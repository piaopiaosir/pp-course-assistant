const { PORT, TIKU_API_URL, HIVENET_API_URL, YANXI_API_URL, getCardTypes, INITIAL_COUNT, FREE_TOKEN_INITIAL_COUNT, FREE_TOKEN_SECRET, SERVER_ID, SPONSOR_URL, LATEST_VERSION, getEnv } = require('./config/app-config');
const { DB_CONFIG, pool, db, withConnection, withTransaction, withRetry, RETRYABLE_ERRORS } = require('./config/db-config');
const { getGlobalStats } = require('./config/db-init');

module.exports = {
  PORT,
  TIKU_API_URL,
  HIVENET_API_URL,
  YANXI_API_URL,
  getCardTypes,
  INITIAL_COUNT,
  FREE_TOKEN_INITIAL_COUNT,
  FREE_TOKEN_SECRET,
  SERVER_ID,
  SPONSOR_URL,
  LATEST_VERSION,
  db,
  pool,
  withConnection,
  withTransaction,
  withRetry,
  RETRYABLE_ERRORS,
  getEnv,
  getGlobalStats
};
