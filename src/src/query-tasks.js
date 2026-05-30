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

const recentlyQueriedQuestions = new Map();
const RECENTLY_QUERIED_EXPIRY = 30 * 60 * 1000;
const MAX_QUERIED_PER_TOKEN = 200;

function recordRecentlyQueried(token, questionHash) {
  let entry = recentlyQueriedQuestions.get(token);
  if (!entry) {
    entry = { hashes: new Set(), lastAccess: Date.now() };
    recentlyQueriedQuestions.set(token, entry);
  }
  entry.lastAccess = Date.now();
  entry.hashes.add(questionHash);
  if (entry.hashes.size > MAX_QUERIED_PER_TOKEN) {
    entry.hashes.delete(entry.hashes.values().next().value);
  }
}

function isRecentlyQueried(token, questionHash) {
  const entry = recentlyQueriedQuestions.get(token);
  if (!entry) return false;
  return entry.hashes.has(questionHash);
}

const _recentlyQueriedCleanupTimer = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, entry] of recentlyQueriedQuestions.entries()) {
    if (now - entry.lastAccess > RECENTLY_QUERIED_EXPIRY) {
      recentlyQueriedQuestions.delete(token);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[最近查询追踪] 清理${cleaned}个过期token，剩余${recentlyQueriedQuestions.size}个`);
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
