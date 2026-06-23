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

const _queryTaskCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [taskId, task] of queryTasks.entries()) {
    if (now - task.createdAt > QUERY_TASK_EXPIRY) {
      queryTasks.delete(taskId);
    }
  }
}, 60 * 1000);

const recentlyQueriedQuestions = new Map(); // questionHash -> lastAccessTime
const RECENTLY_QUERIED_EXPIRY = 30 * 60 * 1000;
const RECENTLY_QUERIED_MAX_SIZE = 50000;

function recordRecentlyQueried(token, questionHash) {
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
  _queryTaskCleanupTimer,
  _recentlyQueriedCleanupTimer,
  _verifyThinkingGrantCleanupTimer
};
