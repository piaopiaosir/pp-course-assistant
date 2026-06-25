/**
 * AI模式处理模块
 * 功能：仅使用AI模型回答问题
 * 
 * 包含：
 * - handleAIMode: 路由处理函数
 * - fetchAICustom: AI模式专用AI调用（独立参数配置）
 */

const { saveAnswerToCacheAsync, getCachedAnswer, checkAnswerReasonable, safeCheckAnswerReasonable, cleanAndNormalizeAnswer, incrementAiCalls, incrementModelCalls, incrementTotalQueries, incrementAIStats, getTypeDescription, buildPrompt, extractJsonFromContent, cleanAiAnswer, normalizeMatchingAnswer, cleanAnswerData, mergeSplitAnswers } = require('../tiku');
const { db, getEnv, SPONSOR_URL } = require('../config');
const { validateAnswer, retryWithStrippedPunctuation, fetchWithTimeout, validateAndCleanAnswer, callAIApi, buildUserContent } = require('../utils');
const { getModelConfig, getSupportedModels, getModelCosts, getFullModelConfig, getDisplayName, MODEL_COLUMN_MAP, calculateCostFromTokens, getPrelockCount } = require('../config/ai-models');
const { lockToken, settleToken, releaseToken } = require('../auth');

// D-04去重：AI提供商配置映射表（统一Key获取、API地址、错误消息）
const AI_PROVIDER_CONFIG = {
  tencent: {
    keyEnv: 'TOKENHUB_API_KEY',
    apiUrl: 'https://tokenhub.tencentmaas.com/v1/chat/completions',
    errorMsg: "AI模式需要配置TOKENHUB_API_KEY",
    logResult: true
  },
  '302ai': {
    keyEnv: '302AI_API_KEY',
    apiUrl: 'https://api.302ai.com/v1/chat/completions',
    errorMsg: "AI模式需要配置302AI_API_KEY",
    logResult: false
  },
  deepseek: {
    keyEnv: 'DEEPSEEK_API_KEY',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    errorMsg: "AI模式需要配置DEEPSEEK_API_KEY",
    logResult: true
  }
};

// ==================== AI模式专用AI调用 ====================

/**
 * 请求 AI API（AI模式专用）
 * 支持独立参数配置，每个模型可自定义temperature、max_tokens等
 * 
 * @param {Object} questionData - 题目数据
 * @param {string} apiKey - API密钥
 * @param {Object} modelConfig - 模型配置 { model, temperature, max_tokens, thinking, enable_thinking }
 * @param {string} customApiUrl - 可选的自定义API地址
 * @param {boolean} enableWebSearch - 是否启用联网搜索
 * @param {Function} tavilySearch - Tavily搜索函数
 * @returns {Object} { code, msg, data: { answer, source } }
 */
async function fetchAICustom(questionData, apiKey, modelConfig, customApiUrl = null, enableWebSearch = false, tavilySearch = null) {
  if (!modelConfig || !modelConfig.model) {
    console.log("[ERROR] 模型配置无效:", modelConfig);
    return { code: 500, msg: "模型配置无效", data: null };
  }

  const model = modelConfig.model;

  const apiUrl = customApiUrl;
  const providerName = modelConfig.provider || 'unknown';

  if (!apiKey) {
    const errorMsg = `未配置 ${providerName} API密钥`;
    console.log(`[ERROR] ${errorMsg}`);
    return { code: 500, msg: errorMsg, data: null };
  }

  const typeDesc = getTypeDescription(questionData.type);

  const { system, user, imageUrls } = buildPrompt(questionData, enableWebSearch);

  // 如果模型支持视觉且有图片URL，使用多模态格式
  const supportsVision = modelConfig.supportsVision && imageUrls && imageUrls.length > 0;

  // D-07去重：构建用户消息content（支持多模态图片）
  if (!supportsVision && imageUrls && imageUrls.length > 0) {
    console.log(`[WARN] 当前模型不支持视觉，图片将以文本形式传递（可能无法识别）`);
  }
  const userContent = buildUserContent(user, imageUrls, supportsVision);

  // AI模式独立参数配置（每个模型独立）
  const body = {
    model: model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent }
    ]
  };
  
  // 可选参数：如果配置了才添加
  if (modelConfig.temperature !== undefined) {
    body.temperature = modelConfig.temperature;
  }
  if (modelConfig.top_p !== undefined) {
    body.top_p = modelConfig.top_p;
  }
  if (modelConfig.reasoning_split !== undefined) {
    body.reasoning_split = modelConfig.reasoning_split;
  }
  
  // 根据不同模型添加对应的深度思考参数
  if (modelConfig.thinking) {
    // thinking格式: { type: "enabled" } 或 { type: "disabled" }
    body.thinking = modelConfig.thinking;
  } else if (modelConfig.enable_thinking !== undefined) {
    // enable_thinking格式: true 或 false
    body.enable_thinking = modelConfig.enable_thinking;
  }

  // DeepSeek V4 模型的 reasoning_effort 参数
  if (modelConfig.reasoning_effort) {
    body.reasoning_effort = modelConfig.reasoning_effort;
  }
  
  // 如果启用了联网搜索，添加tools参数
  if (enableWebSearch && tavilySearch) {
    const { WEB_SEARCH_TOOL } = require('../tavily-search');
    body.tools = [WEB_SEARCH_TOOL];
    console.log("[LINK] 已启用联网搜索功能");
  }

  console.log("========= AI请求日志（AI模式） =========");
  console.log("[INFO] 题目:", questionData.question);
  console.log("[INFO] 题型:", typeDesc);
  console.log("[INFO] API平台:", providerName);
  console.log("[INFO] 实际模型:", model);
  console.log("[INFO] 温度:", modelConfig.temperature);
  console.log("[INFO] Prompt长度:", system.length + user.length, "字符");
  console.log("[INFO] 联网搜索:", enableWebSearch ? "已启用" : "未启用");
  if (imageUrls && imageUrls.length > 0) {
    console.log("[INFO] 图片URL:", imageUrls.join(', '));
    console.log("[INFO] 多模态:", supportsVision ? "已启用(视觉模型)" : "未启用(模型不支持视觉)");
  }

  try {
    console.log("AI查询中...");
    
    // 增加AI调用次数统计（D-01去重：使用统一统计函数）
    await incrementAIStats(model);

    // ========== 多轮工具调用循环 ==========
    // 第0轮：AI可能请求搜索 → 执行搜索
    // 第N轮（最后一轮）：去掉tools参数，要求AI基于已有信息返回最终答案
    const MAX_TOOL_ROUNDS = 2;
    let messages = [{ role: "system", content: system }, { role: "user", content: userContent }];
    let webSearchUsed = false;  // 标记是否使用了联网搜索
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      console.log(`=== 第${round + 1}轮调用 ===`);

      const bodyForRound = { ...body, messages };

      // 最后一轮：去掉tools参数，追加强制回答提示
      if (round === MAX_TOOL_ROUNDS) {
        if (bodyForRound.tools) {
          delete bodyForRound.tools;
          console.log("[INFO] 最后一轮：移除tools参数，强制AI返回答案");
        }
        if (webSearchUsed) {
          messages.push({
            role: "user",
            content: "请基于上述已有信息和你的知识库，直接输出最终答案。你已无法调用任何工具，不得再次请求联网搜索或任何工具调用。分析过程写在<analysis>标签内，最终答案放在<answer>标签内，格式为：\n<answer>{\"answer\":[\"你的答案\"]}</answer>"
          });
          console.log("[INFO] 最后一轮：已追加强制回答提示（禁止再次搜索）");
        }
      }

      const { result } = await callAIApi({ apiUrl, apiKey, body: bodyForRound });

      // 累加token统计
      if (result.usage) {
        totalPromptTokens += result.usage.prompt_tokens || 0;
        totalCompletionTokens += result.usage.completion_tokens || 0;
        console.log(`[INFO] 本轮token: 输入=${result.usage.prompt_tokens || 0}, 输出=${result.usage.completion_tokens || 0}`);
      }

      console.log("========= AI响应日志（AI模式） =========");
      console.log("[INFO] 完整响应:", JSON.stringify(result, null, 2).substring(0, 2000));

      if (!result.choices || !result.choices[0]) {
        console.log("[ERROR] AI返回无效响应");
        return { code: 500, msg: "AI返回无效响应", data: null, tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens } };
      }

      const choice = result.choices[0];
      const message = choice.message;

      // 检查是否有tool_calls（只有非最后一轮才会出现，最后一轮已去掉tools）
      if (message.tool_calls && message.tool_calls.length > 0 && enableWebSearch && tavilySearch) {
        console.log("[LINK] AI请求使用联网搜索工具");
        webSearchUsed = true;

        // 将AI的回复加入消息历史
        messages.push({
          role: "assistant",
          content: message.content,
          tool_calls: message.tool_calls
        });

        // 执行每个工具调用
        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function?.name;
          const fnArgs = JSON.parse(toolCall.function?.arguments || '{}');

          console.log(`[TOOL] 工具: ${fnName}, 参数:`, JSON.stringify(fnArgs));

          let toolResult;
          if (fnName === "web_search") {
            console.log(`[SEARCH] 执行联网搜索: "${fnArgs.query || questionData.question}"`);
            
            const searchResult = await tavilySearch(fnArgs.query || questionData.question, {
              maxResults: 20,
              includeAnswer: true,
              autoParameters: true
            });

            if (searchResult.error) {
              console.log(`[WARN] Tavily搜索出错: ${searchResult.error}`);
              toolResult = `搜索失败: ${searchResult.error}`;
            } else {
              console.log(`[OK] 联网搜索完成，获得${searchResult.results?.length || 0}条结果`);

              const resultParts = [];
              if (searchResult.answer) {
                resultParts.push(`【搜索结果】${searchResult.answer}`);
              } else {
                resultParts.push('无搜索结果');
              }
              toolResult = resultParts.join('\n\n');
            }
          } else {
            toolResult = JSON.stringify({ error: `未知工具: ${fnName}` });
          }

          // 将工具结果加入消息历史
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult
          });

          console.log(`[NOTE] 工具结果已加入消息历史 (长度: ${toolResult.length}字符)`);
        }

        // 继续下一轮循环，让AI基于工具结果再次回复
        console.log("[SWITCH] 进入下一轮AI调用...");
        continue;
      }

      // 没有tool_calls，AI返回了最终答案
      console.log("[OK] AI返回最终答案（无tool_calls）");
      // 优先从content提取；为空时回退到reasoning_content（深度思考内容）
      const content = message.content || message.reasoning_content;
      if (!message.content && message.reasoning_content) {
        console.log("[INFO] content为空，使用reasoning_content作答");
      }

      const parsed = extractJsonFromContent(content);
      if (parsed) {
        // D-06去重：清洗答案并标准化格式
        parsed.answer = cleanAndNormalizeAnswer(parsed.answer, questionData);
        console.log("[OK] AI解析成功（AI模式）:", JSON.stringify(parsed.answer));
        parsed.answer = mergeSplitAnswers(parsed.answer, questionData.options);

        // 校验答案是否合理（D-03去重：使用安全包装版）
        const checkResult = safeCheckAnswerReasonable(parsed.answer, questionData.type, questionData.options);

        if (!checkResult.reasonable) {
          console.log(`[WARN] AI模式答案校验失败: ${checkResult.reason}`);
          console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
          console.log("==========================");
          return { code: 500, msg: `AI答案校验失败: ${checkResult.reason}`, data: null, tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens } };
        }

        console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
        console.log("==========================");

        const source = getDisplayName(model);

        return {
          code: 200,
          data: { answer: parsed.answer, source: source },
          msg: "查询成功",
          tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens }
        };
      }

      // 如果解析失败
      console.log("[ERROR] AI解析失败: 响应中未找到有效答案");
      console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
      console.log("==========================");
      return { code: 500, msg: "未在AI回答中解析到答案", data: null, tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens } };
    }

    // 不应到达这里
    console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
    console.log("==========================");
    return { code: 500, msg: "未在AI回答中解析到答案", data: null, tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens } };

  } catch (e) {
    console.error("[ERROR] AI查询失败（AI模式）:", e.message);
    console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
    console.log("==========================");

    return {
      code: 500,
      msg: `AI查询失败: ${e.message}`,
      data: null,
      tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens }
    };
  }
}

// ==================== 路由处理函数 ====================

/**
 * AI模式路由处理函数
 * @param {Object} c - Hono context
 * @param {Object} params - 请求参数
 * @param {string} params.token - 用户token
 * @param {string} params.userId - 用户ID
 * @param {Object} params.questionData - 题目数据
 * @param {Function} params.log - 日志函数
 * @param {boolean} params.FREE_MODE - 免费模式
 * @param {Function} params.decrementCount - 扣除次数函数
 * @param {string} params.model - AI模型标识符
 */
async function handleAIMode(c, params) {
  const {
    token,
    userId,
    questionData,
    questionHash,
    log,
    FREE_MODE,
    decrementCount,
    skipUserIdCheck,
    model = 'DeepSeek-R1-0528',
    enableWebSearch = false
  } = params;

  log("=== AI模式（仅使用AI） ===");
  log(`AI模型: ${model}`);

  let actualModelId = model;  // 实际使用的模型ID，可能被回退
  let modelConfig = getModelConfig(model);
  if (!modelConfig) {
    log(`[WARN] 未知AI模型: ${model}，回退为 deepseek-v4-flash`);
    modelConfig = getModelConfig('deepseek-v4-flash');
    actualModelId = 'deepseek-v4-flash';
  }

  log(`AI提供商: ${modelConfig.provider}`);
  log(`AI模型: ${modelConfig.name || modelConfig.model}`);

  // 变量声明前置（避免 TDZ 错误：图片URL检查中使用了 remainingCount）
  let answerData;
  let remainingCount = 999999;
  let prelockCount = 0;  // 预锁定次数

  // ========== 图片URL检查：不支持视觉的模型不能处理图片题目 ==========
  const { imageUrls } = buildPrompt(questionData, enableWebSearch);
  if (imageUrls && imageUrls.length > 0 && !modelConfig.supportsVision) {
    log(`[X] 当前模型不支持图片输入，题目包含${imageUrls.length}张图片`);
    return c.json({
      code: 400,
      msg: "该模型不支持图片输入，请切换模型或者模式",
      data: { answer: [], num: remainingCount }
    }, 400);
  }

  // ========== 免费Token限制：不允许使用中/高/超高消耗模型 ==========
  if (!FREE_MODE && (modelConfig.cost === '中消耗' || modelConfig.cost === '高消耗' || modelConfig.cost === '超高消耗')) {
    const tokenRecord = await db.prepare(
      "SELECT is_free_token FROM tokens WHERE token = ?"
    ).get(token);
    if (tokenRecord?.is_free_token === 1) {
      log(`[X] 免费Token不允许使用${modelConfig.cost}模型: ${modelConfig.name}`);
      return c.json({
        code: 403,
        msg: `免费Token不支持${modelConfig.cost}模型，赞助获取token解锁`,
        data: { answer: [], num: remainingCount, sponsorUrl: SPONSOR_URL }
      }, 403);
    }
  }

  // ========== 调用前：预锁定Token次数 ==========
  if (!FREE_MODE) {
    prelockCount = getPrelockCount(actualModelId);
    log(`预锁定: ${prelockCount}次（${modelConfig.cost}模型: ${modelConfig.name}）`);

    const lockResult = await lockToken(token, prelockCount);
    if (!lockResult.success) {
      const costLevel = modelConfig.cost || '低消耗';
      log(`预锁定失败: ${lockResult.message}`);
      return c.json({
        code: 403,
        msg: `剩余次数过少，无法使用（${costLevel}模型）`,
        data: { num: lockResult.remainingCount || 0, answer: [], sponsorUrl: SPONSOR_URL }
      }, 403);
    }
    remainingCount = lockResult.remainingCount;
    log(`预锁定成功: [OK] 剩余${remainingCount}次（锁定${prelockCount}次）`);
  } else {
    log("免费模式: 不扣除次数");
  }

  // 导入Tavily搜索函数（如果启用了联网搜索）
  const { tavilySearch } = enableWebSearch ? require('../tavily-search') : { tavilySearch: null };
  
  // 根据模型提供商选择AI服务（D-04去重：使用配置映射表统一处理）
  const providerCfg = AI_PROVIDER_CONFIG[modelConfig.provider];
  if (!providerCfg) {
    log(`[X] 不支持的提供商: ${modelConfig.provider}`);
    if (!FREE_MODE && prelockCount > 0) {
      const settleResult = await settleToken(token, prelockCount, 0);
      log(`[预锁定] 不支持的提供商，全额退还${prelockCount}次，剩余: ${settleResult.remainingCount}`);
    }
    return c.json({
      code: 500,
      msg: `不支持的AI提供商: ${modelConfig.provider}`,
      data: { answer: [], num: remainingCount + prelockCount }
    }, 500);
  }

  // 打印查询日志（保持各提供商原有日志格式）
  if (modelConfig.provider === 'tencent') {
    log("=== 查询 腾讯云 TokenHub AI ===");
  } else if (modelConfig.provider === '302ai') {
    log(`=== 查询 302.AI (${modelConfig.name}) ===`);
  } else if (modelConfig.provider === 'deepseek') {
    log("=== 查询 DeepSeek 官方 API ===");
  }

  const apiKey = getEnv(providerCfg.keyEnv, '');
  if (!apiKey) {
    log(`[X] ${providerCfg.keyEnv} 未配置`);
    // API Key未配置属于系统错误，释放预锁定（全额退款）
    if (!FREE_MODE && prelockCount > 0) {
      const settleResult = await settleToken(token, prelockCount, 0);
      log(`[预锁定] API未配置，全额退还${prelockCount}次，剩余: ${settleResult.remainingCount}`);
    }
    return c.json({
      code: 500,
      msg: providerCfg.errorMsg,
      data: { answer: [], num: remainingCount + prelockCount }
    }, 500);
  }

  // 使用 fetchAICustom 函数
  const aiResult = await fetchAICustom(questionData, apiKey, modelConfig, providerCfg.apiUrl, enableWebSearch, tavilySearch);
  answerData = aiResult;

  // 成功/失败日志（302ai保持原有行为：不打印）
  if (providerCfg.logResult) {
    if (aiResult.code === 200) {
      log(`[OK] ${modelConfig.name} 有答案: ${JSON.stringify(aiResult.data.answer)}`);
      answerData.data.source = aiResult.data.source || modelConfig.name;
    } else {
      log(`[X] ${modelConfig.name} 请求失败: ${aiResult.msg || '未知错误'}`);
    }
  }

  // ========== 调用后：根据实际token消耗结算预锁定 ==========
  if (!FREE_MODE) {
    let actualCost = 1; // 默认实际消耗1次

    if (answerData && answerData.tokenUsage) {
      const { promptTokens, completionTokens } = answerData.tokenUsage;
      if (promptTokens > 0 || completionTokens > 0) {
        actualCost = calculateCostFromTokens(actualModelId, promptTokens, completionTokens);
        log(`[STAT] 实际token消耗: 输入=${promptTokens}, 输出=${completionTokens}`);
        log(`[MONEY] 费用换算: 实际消耗${actualCost}次（${modelConfig.name}）`);
      } else {
        log(`[WARN] token消耗为0，默认消耗1次`);
      }
    } else {
      // AI查询失败，默认消耗1次
      log(`[WARN] AI查询失败，默认消耗1次`);
    }

    // 结算：预锁定 - 实际消耗 = 退还次数
    const settleResult = await settleToken(token, prelockCount, actualCost);
    if (settleResult.success) {
      remainingCount = settleResult.remainingCount;
      const refund = prelockCount - actualCost;
      log(`结算完成: 预锁定${prelockCount}次，实际消耗${actualCost}次，退还${Math.max(0, refund)}次，剩余${remainingCount}次`);
    } else {
      log(`[WARN] 结算失败: ${settleResult.message}`);
    }
  }

  log(`题目哈希: ${questionHash.substring(0, 16)}`);

  if (!answerData || answerData.code !== 200 || !answerData.data || !answerData.data.answer) {
    log("[X] AI 请求失败或无答案");
    answerData = {
      code: 404,
      msg: "未在AI回答中解析到答案",
      data: { answer: [], num: remainingCount }
    };
    return c.json(cleanAnswerData(answerData));
  }

  // ========== 先清洗答案，再校验（修复#号导致校验失败的问题） ==========
  answerData = cleanAnswerData(answerData);

  let answers = answerData.data.answer;
  const { valid, reason, answers: fixedAnswers } = validateAndCleanAnswer(questionData.type, answers, questionData.options);
  if (fixedAnswers !== answers) {
    answerData.data.answer = fixedAnswers;
    answers = fixedAnswers;
  }

  if (!valid) {
    log(`[X] AI答案校验失败: ${reason}`);
    answerData = {
      code: 422,
      msg: `AI答案校验失败: ${reason}`,
      data: { answer: [], num: remainingCount }
    };
    return c.json(answerData, 422);
  }

  log("[OK] AI答案校验通过");

  // 保存到缓存（仅当题库中不存在时保存，不覆盖已有答案）
  const existingCache = await getCachedAnswer(questionHash);
  if (!existingCache) {
    log("[OK] 保存AI答案到缓存（题库中无此题）");
    saveAnswerToCacheAsync(
      questionHash,
      questionData.question,
      questionData.options,
      questionData.type,
      answers,
      answerData.data.source || 'ai'
    );
    log("[OK] AI答案已缓存");
  } else {
    log("[OK] 题库中已有答案，跳过缓存");
  }

  // 确保返回数据包含剩余次数
  if (answerData.data) {
    answerData.data.num = remainingCount;
  }

  // 添加消耗次数到返回数据（与正常模式、校验模式统一格式）
  if (!FREE_MODE && answerData.tokenUsage) {
    const { promptTokens, completionTokens } = answerData.tokenUsage;
    const actualCost = (promptTokens > 0 || completionTokens > 0)
      ? calculateCostFromTokens(actualModelId, promptTokens, completionTokens)
      : 1;
    answerData.data.cost = actualCost;

    // 在返回消息中追加本次查询消耗信息
    let msgParts = [answerData.msg || '查询成功'];
    if (enableWebSearch) {
      msgParts.push('联网搜索已开启，将会显著增加模型token使用量');
    }
    msgParts.push(`本次模型消耗: 输入 ${promptTokens}+输出 ${completionTokens}tokens`);
    answerData.msg = msgParts.join('\n');
  }

  log(`[OK] 返回响应: code=${answerData.code}, answer=${JSON.stringify(answerData.data?.answer)}`);
  return c.json(answerData);
}

module.exports = {
  handleAIMode,
  fetchAICustom,
  getSupportedModels,
  getModelConfig,
  getModelCosts,
  getFullModelConfig,
  getDisplayName,
  MODEL_COLUMN_MAP
};