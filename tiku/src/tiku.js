// ==================== tiku.js 模块入口（纯 re-export） ====================
// 该文件已拆分为 src/tiku/ 下的多个子模块，此处仅做统一聚合导出，
// 保持对外 require('../tiku') / require('./tiku') 的接口完全不变。
//
// 依赖关系（无循环）：
//   helpers  ← utils
//   prompt   ← helpers
//   cache    ← config, utils, helpers
//   stats    ← config, config/ai-models
//   api      ← config, utils, helpers, cache, stats

const helpers = require('./tiku/helpers');
const prompt = require('./tiku/prompt');
const cache = require('./tiku/cache');
const stats = require('./tiku/stats');
const api = require('./tiku/api');
const { MODEL_COLUMN_MAP } = require('./config/ai-models');
const { getTypeDescription } = require('./utils');

module.exports = {
  // ===== helpers =====
  generateQuestionHash: helpers.generateQuestionHash,
  extractJsonFromContent: helpers.extractJsonFromContent,
  extractImageUrls: helpers.extractImageUrls,
  cleanAiAnswer: helpers.cleanAiAnswer,
  normalizeMatchingAnswer: helpers.normalizeMatchingAnswer,
  cleanAnswerData: helpers.cleanAnswerData,
  mergeSplitAnswers: helpers.mergeSplitAnswers,
  checkAnswerReasonable: helpers.checkAnswerReasonable,
  safeCheckAnswerReasonable: helpers.safeCheckAnswerReasonable,
  cleanAndNormalizeAnswer: helpers.cleanAndNormalizeAnswer,
  // 透传 utils 中的通用函数（保持原有导出契约）
  getTypeDescription,

  // ===== prompt =====
  buildPrompt: prompt.buildPrompt,

  // ===== cache =====
  getCachedAnswer: cache.getCachedAnswer,
  saveAnswerToCache: cache.saveAnswerToCache,
  saveAnswerToCacheAsync: cache.saveAnswerToCacheAsync,
  recordCorrectnessReport: cache.recordCorrectnessReport,
  applyCorrectnessUpdate: cache.applyCorrectnessUpdate,

  // ===== stats =====
  incrementAiCalls: stats.incrementAiCalls,
  incrementTikuCalls: stats.incrementTikuCalls,
  incrementModelCalls: stats.incrementModelCalls,
  updateHiveNetRemaining: stats.updateHiveNetRemaining,
  incrementHiveNetCalls: stats.incrementHiveNetCalls,
  updateYanxiRemaining: stats.updateYanxiRemaining,
  incrementYanxiCalls: stats.incrementYanxiCalls,
  updateUcucRemaining: stats.updateUcucRemaining,
  incrementUcucCalls: stats.incrementUcucCalls,
  incrementCacheHits: stats.incrementCacheHits,
  incrementTotalQueries: stats.incrementTotalQueries,
  incrementAIStats: stats.incrementAIStats,

  // ===== api =====
  getAvailableTikuKey: api.getAvailableTikuKey,
  updateTikuKeyRemaining: api.updateTikuKeyRemaining,
  refreshTikuKeyRemaining: api.refreshTikuKeyRemaining,
  refreshAllTikuKeys: api.refreshAllTikuKeys,
  fetchAnswer: api.fetchAnswer,
  parseAnswer: api.parseAnswer,
  fetchHiveNet: api.fetchHiveNet,
  fetchUcuc: api.fetchUcuc,
  fetchYanxi: api.fetchYanxi,

  // ===== config/ai-models =====
  MODEL_COLUMN_MAP
};
