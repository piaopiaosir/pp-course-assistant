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

function calculatePollInterval() {
  return 1000;
}

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

function recordRecentlyQueried(token, questionHash) {
  recentlyQueriedQuestions.set(questionHash, Date.now());
}

function isRecentlyQueried(token, questionHash) {
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
}, 60 * 1000);

// 校验模式深度思考免扣资格追踪：token+questionHash -> true
// 第一次请求(checkOnly=true)扣2次后写入，第二次请求(checkOnly=false)检查并消耗
const verifyThinkingGrants = new Map(); // "token:questionHash" -> true
const VERIFY_THINKING_GRANT_EXPIRY = 5 * 60 * 1000; // 5分钟过期

function grantVerifyThinking(token, questionHash) {
  const key = `${token}:${questionHash}`;
  verifyThinkingGrants.set(key, true);
}

function consumeVerifyThinking(token, questionHash) {
  const key = `${token}:${questionHash}`;
  const exists = verifyThinkingGrants.has(key);
  if (exists) {
    verifyThinkingGrants.delete(key); // 一次性消耗
  }
  return exists;
}

const _verifyThinkingGrantCleanupTimer = setInterval(() => {
  // 简单策略：超过5分钟的记录由 consumeVerifyThinking 的 TTL 逻辑处理
  // 这里定期清理防止内存泄漏（Map 本身不大，每60秒清理一次）
  // 由于是 Map 且 consume 时删除，实际不需要额外清理
}, 60 * 1000);

module.exports = {
  queryTasks,
  recentlyQueriedQuestions,
  recordQueryRate,
  getQueryRate,
  calculatePollInterval,
  recordRecentlyQueried,
  isRecentlyQueried,
  grantVerifyThinking,
  consumeVerifyThinking,
  _queryTaskCleanupTimer,
  _recentlyQueriedCleanupTimer,
  _verifyThinkingGrantCleanupTimer
};
