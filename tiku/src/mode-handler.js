/**
 * 模式处理器 - 统一的查询入口
 * 根据请求参数调用不同的模式处理模块
 */

const { handleVerifyMode } = require('./modes/verify-mode');
const { handleNormalMode } = require('./modes/normal-mode');
const { handleAIMode } = require('./modes/ai-mode');
const { generateQuestionHash } = require('./tiku');
const { getTypeDescription } = require('./utils');

/**
 * 处理查询请求的统一入口
 * @param {Object} c - Hono context
 * @param {Object} params - 请求参数
 * @param {string} params.token - 用户token
 * @param {string} params.userId - 用户ID
 * @param {Object} params.questionData - 题目数据
 * @param {boolean} params.verifyAnswer - 是否校验答案（校验模式）
 * @param {boolean} params.checkOnly - 是否仅检测（校验模式）
 * @param {string} params.aiMode - AI模式标识（ai模式）
 * @param {string} params.model - AI模型标识符（ai模式）
 * @param {string} params.tokenhubApiKey - TokenHub API密钥
 * @param {Function} params.log - 日志函数
 * @param {boolean} params.FREE_MODE - 免费模式
 * @param {Function} params.lockToken - 预锁定次数函数
 * @param {Function} params.settleToken - 结算次数函数
 * @param {Function} params.releaseToken - 释放锁定函数
 * @param {string} params.taskId - 异步任务ID
 * @returns {Promise<Response>} Hono响应
 */
async function handleQuery(c, params) {
  const {
    token,
    userId,
    questionData,
    verifyAnswer,
    checkOnly,
    aiMode,
    enableWebSearch,
    model,
    tokenhubApiKey,
    log,
    FREE_MODE,
    limitedMode,
    lockToken,
    settleToken,
    releaseToken,
    decrementCount,
    taskId,
    skipUserIdCheck
  } = params;

  // 打印题目信息
  const questionHash = generateQuestionHash(
    questionData.question,
    questionData.options,
    questionData.type
  );
  log(`题目哈希: ${questionHash.substring(0, 16)}`);
  log(`题目内容: ${questionData.question}`);
  log(`题目类型: ${getTypeDescription(questionData.type)}`);
  log(`选项数据: ${JSON.stringify(questionData.options)}`);

  // 判断使用哪种模式
  // 优先级：校验模式 > AI模式 > 正常模式

  // 校验模式
  if (verifyAnswer === true) {
    log("=== 使用校验模式 ===");
    return handleVerifyMode(c, {
      token,
      userId,
      questionData,
      questionHash,
      verifyAnswer,
      checkOnly,
      hunyuanApiKey: tokenhubApiKey,
      log,
      FREE_MODE,
      lockToken,
      settleToken,
      releaseToken,
      decrementCount,
      taskId,
      skipUserIdCheck
    });
  }

  // AI模式
  if (aiMode === true || aiMode === 'true') {
    log("=== 使用AI模式 ===");
    log(`enableWebSearch: ${enableWebSearch}`);
    return handleAIMode(c, {
      token,
      userId,
      questionData,
      questionHash,
      log,
      FREE_MODE,
      lockToken,
      settleToken,
      releaseToken,
      decrementCount,
      skipUserIdCheck,
      model,
      enableWebSearch
    });
  }

  // 正常模式（默认）
  log("=== 使用正常模式 ===");
    return handleNormalMode(c, {
      token,
      userId,
      questionData,
      questionHash,
      hunyuanApiKey: tokenhubApiKey,
      log,
      FREE_MODE,
      limitedMode,
      lockToken,
      settleToken,
      releaseToken,
      decrementCount,
      skipUserIdCheck
    });
}

module.exports = {
  handleQuery
};
