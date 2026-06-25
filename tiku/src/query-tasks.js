const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const queryTasks = new Map();
const QUERY_TASK_EXPIRY = 5 * 60 * 1000;

const queryRateWindow = [];
const QUERY_RATE_WINDOW_SIZE = 60 * 1000;

function recordQueryRate() {
  queryRateWindow.push(Date.now());
}

function getQueryRate() {
  const now = Date.now();
  while (queryRateWindow.length > 0 && now - queryRateWindow[0] > QUERY_RATE_WINDOW_SIZE) {
    queryRateWindow.shift();
  }
  return queryRateWindow.length;
}

const POLL_INTERVAL = 1000;

// ==================== 任务持久化（SQLite） ====================
// 使用本地 SQLite 存储异步任务状态，服务重启后客户端仍可查询任务结果

const TASK_DB_DIR = path.join(__dirname, '..', 'data');
const TASK_DB_PATH = path.join(TASK_DB_DIR, 'query-tasks.sqlite');

// 确保数据目录存在
try {
  if (!fs.existsSync(TASK_DB_DIR)) {
    fs.mkdirSync(TASK_DB_DIR, { recursive: true });
  }
} catch (e) {
  console.error('[任务持久化] 创建数据目录失败:', e.message);
}

const taskDb = new Database(TASK_DB_PATH);
taskDb.pragma('journal_mode = WAL'); // WAL模式提升并发读写性能
taskDb.pragma('synchronous = NORMAL'); // 平衡性能与安全

// 初始化表
taskDb.exec(`
  CREATE TABLE IF NOT EXISTS query_tasks (
    task_id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'pending',
    result TEXT,
    step1_cost REAL DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_query_tasks_status ON query_tasks(status);
  CREATE INDEX IF NOT EXISTS idx_query_tasks_created_at ON query_tasks(created_at);
`);

// 兼容：如果旧表没有 step1_cost 列，自动添加
try {
  taskDb.exec(`ALTER TABLE query_tasks ADD COLUMN step1_cost REAL DEFAULT 0`);
} catch (e) {
  // 列已存在，忽略
}

// 预编译语句（better-sqlite3 原生支持语句缓存）
const stmtUpsert = taskDb.prepare(
  `INSERT INTO query_tasks (task_id, status, result, created_at, updated_at) 
   VALUES (@taskId, @status, @result, @now, @now)
   ON CONFLICT(task_id) DO UPDATE SET status = @status, result = @result, updated_at = @now`
);
const stmtGet = taskDb.prepare('SELECT status, result, step1_cost FROM query_tasks WHERE task_id = ?');
const stmtRecover = taskDb.prepare(
  `UPDATE query_tasks SET status = 'failed', result = ?, updated_at = ? 
   WHERE status IN ('pending', 'processing')`
);
const stmtCleanup = taskDb.prepare('DELETE FROM query_tasks WHERE created_at < ?');
const stmtUpdateStep1Cost = taskDb.prepare('UPDATE query_tasks SET step1_cost = ? WHERE task_id = ?');

// 保存任务到数据库（同步操作）
function saveTaskToDb(taskId, status, result = null) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const resultStr = result ? JSON.stringify(result) : null;
    stmtUpsert.run({ taskId, status, result: resultStr, now });
  } catch (e) {
    console.error('[任务持久化] 保存失败:', e.message);
  }
}

// 保存第一轮消耗到任务记录（同步操作）
function saveStep1Cost(taskId, step1Cost) {
  try {
    stmtUpdateStep1Cost.run(step1Cost, taskId);
  } catch (e) {
    console.error('[任务持久化] 保存step1Cost失败:', e.message);
  }
}

// 获取第一轮消耗（同步操作）
function getStep1Cost(taskId) {
  try {
    const row = stmtGet.get(taskId);
    return row?.step1_cost || 0;
  } catch (e) {
    console.error('[任务持久化] 获取step1Cost失败:', e.message);
    return 0;
  }
}

// 从数据库获取任务（同步操作）
function getTaskFromDb(taskId) {
  try {
    const row = stmtGet.get(taskId);
    if (!row) return null;
    return {
      status: row.status,
      result: row.result ? JSON.parse(row.result) : null
    };
  } catch (e) {
    console.error('[任务持久化] 查询失败:', e.message);
    return null;
  }
}

// 启动时将未完成的任务标记为失败（服务重启后无法恢复）
function recoverPendingTasks() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const result = stmtRecover.run(
      JSON.stringify({ code: 500, msg: '服务重启，任务已失效', data: { answer: [], num: 0 } }),
      now
    );
    if (result.changes > 0) {
      console.log(`[任务恢复] 已将 ${result.changes} 个未完成任务标记为失败`);
    }
  } catch (e) {
    console.error('[任务恢复] 恢复失败:', e.message);
  }
}

// 定期清理过期任务（保留2小时）
function cleanupExpiredTasks() {
  try {
    const cutoff = Math.floor(Date.now() / 1000) - 2 * 3600;
    const result = stmtCleanup.run(cutoff);
    if (result.changes > 0) {
      console.log(`[任务清理] 清理了 ${result.changes} 个过期任务`);
    }
  } catch (e) {
    console.error('[任务清理] 清理失败:', e.message);
  }
}

// 服务启动时恢复未完成任务
recoverPendingTasks();

const _queryTaskCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [taskId, task] of queryTasks.entries()) {
    if (now - task.createdAt > QUERY_TASK_EXPIRY) {
      queryTasks.delete(taskId);
    }
  }
  cleanupExpiredTasks();
}, 60 * 1000);

const recentlyQueriedQuestions = new Map(); // questionHash -> lastAccessTime
const RECENTLY_QUERIED_EXPIRY = 30 * 60 * 1000;
const RECENTLY_QUERIED_MAX_SIZE = 50000;

function recordRecentlyQueried(questionHash) {
  // 写入时即时检查容量，避免高并发下等待60秒清理周期导致超限
  if (recentlyQueriedQuestions.size >= RECENTLY_QUERIED_MAX_SIZE) {
    // 淘汰最旧的一条（Map迭代顺序=插入顺序）
    const oldestKey = recentlyQueriedQuestions.keys().next().value;
    if (oldestKey !== undefined) {
      recentlyQueriedQuestions.delete(oldestKey);
    }
  }
  recentlyQueriedQuestions.set(questionHash, Date.now());
}

function isRecentlyQueried(questionHash) {
  return recentlyQueriedQuestions.has(questionHash);
}

const _recentlyQueriedCleanupTimer = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [hash, lastAccess] of recentlyQueriedQuestions.entries()) {
    if (now - lastAccess > RECENTLY_QUERIED_EXPIRY) {
      recentlyQueriedQuestions.delete(hash);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[最近查询追踪] 清理${cleaned}个过期记录，剩余${recentlyQueriedQuestions.size}个`);
  }
  // 容量限制：超出时淘汰最旧条目
  if (recentlyQueriedQuestions.size > RECENTLY_QUERIED_MAX_SIZE) {
    const excess = recentlyQueriedQuestions.size - RECENTLY_QUERIED_MAX_SIZE;
    let deleted = 0;
    for (const key of recentlyQueriedQuestions.keys()) {
      if (deleted >= excess) break;
      recentlyQueriedQuestions.delete(key);
      deleted++;
    }
    console.log(`[最近查询追踪] 缓存超限，清理${deleted}个条目`);
  }
}, 60 * 1000);

// 校验模式深度思考免扣资格追踪：token+questionHash -> true
// 第一次请求(checkOnly=true)扣2次后写入，第二次请求(checkOnly=false)检查并消耗
const verifyThinkingGrants = new Map(); // "token:questionHash" -> grantTime
const VERIFY_THINKING_GRANT_EXPIRY = 5 * 60 * 1000; // 5分钟过期

function grantVerifyThinking(token, questionHash) {
  const key = `${token}:${questionHash}`;
  verifyThinkingGrants.set(key, Date.now());
}

function consumeVerifyThinking(token, questionHash) {
  const key = `${token}:${questionHash}`;
  const grantTime = verifyThinkingGrants.get(key);
  if (!grantTime) return false;
  // 检查是否过期
  if (Date.now() - grantTime > VERIFY_THINKING_GRANT_EXPIRY) {
    verifyThinkingGrants.delete(key);
    return false;
  }
  verifyThinkingGrants.delete(key); // 一次性消耗
  return true;
}

const _verifyThinkingGrantCleanupTimer = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, grantTime] of verifyThinkingGrants.entries()) {
    if (now - grantTime > VERIFY_THINKING_GRANT_EXPIRY) {
      verifyThinkingGrants.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[思考资格] 清理${cleaned}个过期记录，剩余${verifyThinkingGrants.size}个`);
  }
}, 60 * 1000);

module.exports = {
  queryTasks,
  recentlyQueriedQuestions,
  recordQueryRate,
  getQueryRate,
  POLL_INTERVAL,
  recordRecentlyQueried,
  isRecentlyQueried,
  grantVerifyThinking,
  consumeVerifyThinking,
  saveTaskToDb,
  getTaskFromDb,
  saveStep1Cost,
  getStep1Cost,
  recoverPendingTasks,
  _queryTaskCleanupTimer,
  _recentlyQueriedCleanupTimer,
  _verifyThinkingGrantCleanupTimer
};
