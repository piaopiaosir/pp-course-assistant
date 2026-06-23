const { PORT, TIKU_API_URL, HIVENET_API_URL, YANXI_API_URL, getCardTypes, INITIAL_COUNT, FREE_MODE, SERVER_ID, SPONSOR_URL, LATEST_VERSION, getEnv } = require('./config/app-config');
const { DB_CONFIG, pool, db } = require('./config/db-config');
const { getGlobalStats } = require('./config/db-init');

module.exports = {
  PORT,
  TIKU_API_URL,
  HIVENET_API_URL,
  YANXI_API_URL,
  getCardTypes,
  INITIAL_COUNT,
  FREE_MODE,
  SERVER_ID,
  SPONSOR_URL,
  LATEST_VERSION,
  db,
  pool,
  getEnv,
  getGlobalStats
};
