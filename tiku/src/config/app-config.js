const path = require('path');

// 加载 .env 文件
const envPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });
console.log('[OK] 环境变量加载自:', envPath);

// ==================== 应用配置常量 ====================
const PORT = process.env.PORT || 3000;
const TIKU_API_URL = "http://api.tikuhai.com/search";
const HIVENET_API_URL = "https://www.hive-net.cn/backend/course/search";
const YANXI_API_URL = "https://tk.enncy.cn/query";

// 卡类型配置
function getCardTypes() {
  const cardTypes = [];
  if (process.env.MASTER_SECRET_2500) {
    cardTypes.push({ secret: process.env.MASTER_SECRET_2500, count: 2500, name: '2500次卡' });
  }
  if (process.env.MASTER_SECRET_1288) {
    cardTypes.push({ secret: process.env.MASTER_SECRET_1288, count: 1288, name: '1288次卡' });
  }
  if (process.env.MASTER_SECRET) {
    cardTypes.push({ secret: process.env.MASTER_SECRET, count: 500, name: '500次卡' });
  }
  return cardTypes;
}

const INITIAL_COUNT = 500;

// 免费模式配置（开启后不需要验证token，不扣除次数）
const FREE_MODE = process.env.FREE_MODE === '1';

// 服务器ID配置（用于区分不同服务器）
const SERVER_ID = process.env.SERVER_ID || 'server1';

// 赞助链接配置
const SPONSOR_URL = process.env.SPONSOR_URL || 'https://hsfaka.cn/shop/IU2JDO1E';

// 获取环境变量
function getEnv(key, defaultVal) {
  return process.env[key] || defaultVal;
}

// 云端脚本最新版本号（从环境变量读取，用于版本检查）
const LATEST_VERSION = getEnv('LATEST_VERSION', '2.2.6');

// ==================== 固定模式消耗配置（最小扣除次数）====================
// 正常模式：缓存命中扣0.8次、AI补充扣1次
const NORMAL_MODE_COST = '0.8-1次';
// 校验模式：缓存命中0.8次、第一步1次+AI消耗、第二步深度思考1-3次
const VERIFY_MODE_COST = '0.8-3次';

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
  getEnv,
  LATEST_VERSION,
  NORMAL_MODE_COST,
  VERIFY_MODE_COST
};
