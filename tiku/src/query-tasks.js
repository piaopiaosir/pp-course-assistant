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

module.exports = {
  queryTasks,
  recentlyQueriedQuestions,
  recordQueryRate,
  getQueryRate,
  calculatePollInterval,
  recordRecentlyQueried,
  isRecentlyQueried,
  _queryTaskCleanupTimer,
  _recentlyQueriedCleanupTimer
};
