/**
 * AI模式处理模块
 * 功能：仅使用AI模型回答问题
 * 
 * 包含：
 * - handleAIMode: 路由处理函数
 * - fetchAICustom: AI模式专用AI调用（独立参数配置）
 */

const { saveAnswerToCache, checkAnswerReasonable, incrementAiCalls, incrementModelCalls, incrementTotalQueries, getTypeDescription, buildPrompt, extractJsonFromContent, cleanAiAnswer, normalizeMatchingAnswer, cleanAnswerData, mergeSplitAnswers } = require('../tiku');
const { getEnv } = require('../config');
const { validateAnswer } = require('../utils');
const { getModelConfig, getSupportedModels, getModelCosts, getFullModelConfig, getDisplayName, MODEL_COLUMN_MAP } = require('../config/ai-models');

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
    console.log("❌ 模型配置无效:", modelConfig);
    return { code: 500, msg: "模型配置无效", data: null };
  }

  const model = modelConfig.model;

  const apiUrl = customApiUrl || "https://api.hunyuan.cloud.tencent.com/v1/chat/completions";
  const apiName = customApiUrl ? "302.AI" : "腾讯云";

  if (!apiKey) {
    const errorMsg = customApiUrl ? "未配置 302AI_API_KEY" : "未配置 HUNYUAN_API_KEY";
    console.log(`❌ ${errorMsg}`);
    return { code: 500, msg: errorMsg, data: null };
  }

  const typeDesc = getTypeDescription(questionData.type);

  const { system, user } = buildPrompt(questionData, enableWebSearch);

  // AI模式独立参数配置（每个模型独立）
  const body = {
    model: model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  };
  
  // 可选参数：如果配置了才添加
  if (modelConfig.temperature !== undefined) {
    body.temperature = modelConfig.temperature;
  }
  if (modelConfig.max_completion_tokens !== undefined) {
    body.max_completion_tokens = modelConfig.max_completion_tokens;
  } else if (modelConfig.max_tokens !== undefined) {
    body.max_tokens = modelConfig.max_tokens;
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
    console.log("🔗 已启用联网搜索功能");
  }

  console.log("━━━━━━━━━ AI请求日志（AI模式） ━━━━━━━━━");
  console.log("📍 题目:", questionData.question);
  console.log("📍 题型:", typeDesc);
  console.log("📍 API平台:", apiName);
  console.log("📍 实际模型:", model);
  console.log("📍 温度:", modelConfig.temperature);
  console.log("📍 最大Token:", modelConfig.max_tokens);
  console.log("📍 Prompt长度:", system.length + user.length, "字符");
  console.log("📍 联网搜索:", enableWebSearch ? "已启用" : "未启用");

  try {
    console.log("AI查询中...");
    
    // 增加AI调用次数统计
    await incrementAiCalls();
    await incrementTotalQueries('ai');
    
    // 按具体模型分别统计（统一统计，不区分平台）
    const aiModelColumn = MODEL_COLUMN_MAP[model];
    if (aiModelColumn) {
      await incrementModelCalls(aiModelColumn);
    }

    // ========== 多轮工具调用循环 ==========
    const MAX_TOOL_ROUNDS = 1;  // 最多1轮工具调用
    let messages = body.messages || [{ role: "system", content: system }, { role: "user", content: user }];
    let webSearchUsed = false;  // 标记是否使用了联网搜索

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      console.log(`━━━ 第${round + 1}轮调用 ━━━`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          ...body,
          messages: messages
        })
      });

      const result = await response.json();

      console.log("━━━━━━━━━ AI响应日志（AI模式） ━━━━━━━━━");
      console.log("📍 响应状态:", response.status);
      console.log("📍 完整响应:", JSON.stringify(result, null, 2).substring(0, 2000));

      if (!result.choices || !result.choices[0]) {
        console.log("✗ AI返回无效响应");
        return { code: 500, msg: "AI返回无效响应", data: null };
      }

      const choice = result.choices[0];
      const message = choice.message;

      // 检查是否有tool_calls
      if (message.tool_calls && message.tool_calls.length > 0 && enableWebSearch && tavilySearch) {
        console.log("🔗 AI请求使用联网搜索工具");
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

          console.log(`🔧 工具: ${fnName}, 参数:`, JSON.stringify(fnArgs));

          let toolResult;
          if (fnName === "web_search") {
            console.log(`🔍 执行联网搜索: "${fnArgs.query || questionData.question}"`);
            
            const searchResult = await tavilySearch(fnArgs.query || questionData.question, {
              maxResults: 10,
              searchDepth: 'advanced',
              includeAnswer: true
            });

            if (searchResult.error) {
              console.log(`⚠️ Tavily搜索出错: ${searchResult.error}`);
              toolResult = `搜索失败: ${searchResult.error}`;
            } else {
              console.log(`✅ 联网搜索完成，获得${searchResult.results?.length || 0}条结果`);
              
              // 格式化搜索结果（取全部20条）
              const formattedResults = searchResult.results?.map((r, i) => 
                `[${i + 1}] ${r.title}\n${r.content}\n来源: ${r.url}`
              ) || [];

              // 构建返回结果
              const resultParts = [];
              if (searchResult.answer) {
                resultParts.push(`【直接答案】${searchResult.answer}`);
              }
              resultParts.push(formattedResults.join('\n\n') || '无搜索结果');
              // 关键提示：告诉AI判断是否足够
              resultParts.push('\n【判断提示】请立即判断：如果上述搜索结果已经能确定答案，就直接输出<answer>标签，不要再继续搜索。只有当结果完全无关或不足时，才考虑再次搜索（用更精确的关键词）。');
              
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

          console.log(`📝 工具结果已加入消息历史 (长度: ${toolResult.length}字符)`);
        }

        // 继续下一轮循环，让AI基于工具结果再次回复
        console.log("🔄 进入下一轮AI调用...");
        continue;
      }

      // 没有tool_calls，AI返回了最终答案
      console.log("✅ AI返回最终答案（无tool_calls）");
      const content = message.content;

      const parsed = extractJsonFromContent(content);
      if (parsed) {
        // 清理AI答案中的"选项X"前缀（安全模式：仅当去掉前缀后匹配选项时才删除）
        if (Array.isArray(parsed.answer)) {
          parsed.answer = parsed.answer.map(a => cleanAiAnswer(a, questionData.options));
        }
        // 连线题：标准化答案格式（拆分合并字符串）
        parsed.answer = normalizeMatchingAnswer(parsed.answer, questionData.type);
        console.log("✅ AI解析成功（AI模式）:", JSON.stringify(parsed.answer));
        parsed.answer = mergeSplitAnswers(parsed.answer, questionData.options);

        // 校验答案是否合理
        let checkResult = { reasonable: true, reason: '' };
        try {
          checkResult = checkAnswerReasonable(parsed.answer, questionData.type, questionData.options);
        } catch (e) {
          console.log('⚠️ checkAnswerReasonable异常:', e.message);
        }

        if (!checkResult.reasonable) {
          console.log(`⚠️ AI模式答案校验失败: ${checkResult.reason}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
          return { code: 500, msg: `AI答案校验失败: ${checkResult.reason}`, data: null };
        }

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

        const source = getDisplayName(model);

        return {
          code: 200,
          data: { answer: parsed.answer, source: source },
          msg: "查询成功"
        };
      }

      // 如果解析失败
      console.log("❌ AI解析失败: 响应中未找到有效答案");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return { code: 500, msg: "AI解析失败", data: null };
    }

    // 超出最大轮数：再做最后一轮不带工具的调用，强制AI基于已有上下文给出答案
    console.log("⚠️ 超出最大工具调用轮数限制，进行最后一轮无工具调用...");
    
    const finalBody = { ...body, messages: messages };
    // 删除 tools 参数，强制 AI 直接输出答案
    delete finalBody.tools;
    
    try {
      const finalResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(finalBody)
      });

      const finalResult = await finalResponse.json();
      console.log("📍 最后一轮响应状态:", finalResponse.status);
      console.log("📍 最后一轮完整响应:", JSON.stringify(finalResult, null, 2).substring(0, 2000));

      if (finalResult.choices && finalResult.choices[0]) {
        const finalContent = finalResult.choices[0].message.content;
        console.log("📍 最后一轮 content:", finalContent?.substring(0, 500));
        const finalParsed = extractJsonFromContent(finalContent);
        if (finalParsed) {
          if (Array.isArray(finalParsed.answer)) {
            finalParsed.answer = finalParsed.answer.map(a => cleanAiAnswer(a, questionData.options));
          }
          finalParsed.answer = normalizeMatchingAnswer(finalParsed.answer, questionData.type);
          finalParsed.answer = mergeSplitAnswers(finalParsed.answer, questionData.options);

          const checkResult = checkAnswerReasonable(finalParsed.answer, questionData.type, questionData.options);
          if (checkResult.reasonable) {
            console.log("✅ 最后一轮成功获取答案:", JSON.stringify(finalParsed.answer));
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
            const source = getDisplayName(model);
            return { code: 200, data: { answer: finalParsed.answer, source: source }, msg: "查询成功" };
          } else {
            console.log(`❌ 最后一轮答案校验失败: ${checkResult.reason}`);
          }
        } else {
          console.log("❌ 最后一轮 extractJsonFromContent 解析失败");
        }
      } else {
        console.log("❌ 最后一轮无有效 choices");
      }
      console.log("❌ 最后一轮仍然失败");
    } catch (e) {
      console.log("❌ 最后一轮调用异常:", e.message);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { code: 500, msg: "超出最大工具调用轮数，且最后一轮无工具调用仍然失败", data: null };

  } catch (e) {
    console.error("❌ AI查询失败（AI模式）:", e.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return {
      code: 500,
      msg: `AI查询失败: ${e.message}`,
      data: null
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

  log("━━━ AI模式（仅使用AI） ━━━");
  log(`AI模型: ${model}`);

  const modelConfig = getModelConfig(model);
  if (!modelConfig) {
    log(`✗ 不支持的AI模型: ${model}`);
    return c.json({
      code: 400,
      msg: `不支持的AI模型: ${model}`,
      data: { answer: [], num: 999999 }
    }, 400);
  }

  log(`AI提供商: ${modelConfig.provider}`);
  log(`AI模型: ${modelConfig.name || modelConfig.model}`);

  let answerData;
  let remainingCount = 999999;

  // 免费模式不扣除次数
  if (!FREE_MODE) {
    let cost = modelConfig.cost || 1;
    // 联网搜索额外消耗 +1 次
    if (enableWebSearch) {
      cost += 1;
      log(`联网搜索额外消耗: +1次（总消耗: ${cost}次）`);
    }
    log(`扣除次数: ${cost}（${modelConfig.name}）`);
    for (let i = 0; i < cost; i++) {
      const decrementResult = await decrementCount(token, userId, skipUserIdCheck);
      if (!decrementResult.success) {
        return c.json({
          code: 403,
          msg: decrementResult.message,
          data: { num: decrementResult.remainingCount, answer: [] }
        }, 403);
      }
      remainingCount = decrementResult.remainingCount;
    }
    log(`剩余次数: ${remainingCount}`);
  } else {
    log("免费模式: 不扣除次数");
  }

  // 导入Tavily搜索函数（如果启用了联网搜索）
  const { tavilySearch } = enableWebSearch ? require('../tavily-search') : { tavilySearch: null };
  
  // 根据模型提供商选择AI服务
  if (modelConfig.provider === 'tencent') {
    log("━━━ 查询 腾讯云 AI ━━━");
    const hunyuanApiKey = getEnv('HUNYUAN_API_KEY', '');

    if (!hunyuanApiKey) {
      log("✗ HUNYUAN_API_KEY 未配置");
      return c.json({
        code: 500,
        msg: "AI模式需要配置HUNYUAN_API_KEY",
        data: { answer: [], num: remainingCount }
      }, 500);
    }

    // 使用 fetchAICustom 函数（自定义参数配置）
    const aiResult = await fetchAICustom(questionData, hunyuanApiKey, modelConfig, null, enableWebSearch, tavilySearch);
    answerData = aiResult;

    if (aiResult.code === 200) {
      log(`✓ ${modelConfig.name} 有答案: ${JSON.stringify(aiResult.data.answer)}`);
      answerData.data.source = aiResult.data.source || modelConfig.name;
    } else {
      log(`✗ ${modelConfig.name} 请求失败: ${aiResult.msg || '未知错误'}`);
    }
  } else if (modelConfig.provider === '302ai') {
    log("━━━ 查询 302.AI ChatGPT ━━━");
    const apiKey302 = getEnv('302AI_API_KEY', '');

    if (!apiKey302) {
      log("✗ 302AI_API_KEY 未配置");
      return c.json({
        code: 500,
        msg: "AI模式需要配置302AI_API_KEY",
        data: { answer: [], num: remainingCount }
      }, 500);
    }

    // 使用 fetchAICustom 函数（OpenAI兼容API）
    const aiResult = await fetchAICustom(questionData, apiKey302, modelConfig, 'https://api.302ai.com/v1/chat/completions', enableWebSearch, tavilySearch);
    answerData = aiResult;
  } else if (modelConfig.provider === 'deepseek') {
    log("━━━ 查询 DeepSeek 官方 API ━━━");
    const deepseekApiKey = getEnv('DEEPSEEK_API_KEY', '');

    if (!deepseekApiKey) {
      log("✗ DEEPSEEK_API_KEY 未配置");
      return c.json({
        code: 500,
        msg: "AI模式需要配置DEEPSEEK_API_KEY",
        data: { answer: [], num: remainingCount }
      }, 500);
    }

    // 使用 fetchAICustom 函数（OpenAI兼容API）
    const aiResult = await fetchAICustom(questionData, deepseekApiKey, modelConfig, 'https://api.deepseek.com/v1/chat/completions', enableWebSearch, tavilySearch);
    answerData = aiResult;

    if (aiResult.code === 200) {
      log(`✓ ${modelConfig.name} 有答案: ${JSON.stringify(aiResult.data.answer)}`);
      answerData.data.source = aiResult.data.source || modelConfig.name;
    } else {
      log(`✗ ${modelConfig.name} 请求失败: ${aiResult.msg || '未知错误'}`);
    }
  }

  log(`题目哈希: ${questionHash.substring(0, 16)}`);

  if (!answerData || answerData.code !== 200 || !answerData.data || !answerData.data.answer) {
    log("✗ AI 请求失败或无答案");
    answerData = {
      code: 404,
      msg: "AI请求失败",
      data: { answer: [], num: remainingCount }
    };
    return c.json(cleanAnswerData(answerData));
  }

  // ========== 先清洗答案，再校验（修复#号导致校验失败的问题） ==========
  // 清洗答案中的#号、正确答案标记等
  answerData = cleanAnswerData(answerData);

  // 答案校验：返回给用户前先校验答案（使用清洗后的答案）
  const answers = answerData.data.answer;
  const validation = validateAnswer(questionData.type, answers, questionData.options);

  if (!validation.valid) {
    log(`✗ AI答案校验失败: ${validation.reason}`);
    answerData = {
      code: 422,
      msg: `AI答案校验失败: ${validation.reason}`,
      data: { answer: [], num: remainingCount }
    };
    return c.json(answerData, 422);
  }

  log("✓ AI答案校验通过");

  // 保存到缓存（使用清洗后的答案）
  log("✓ 保存AI答案到缓存");
  await saveAnswerToCache(
    questionHash,
    questionData.question,
    questionData.options,
    questionData.type,
    answers,
    answerData.data.source || 'ai'
  );
  log("✓ AI答案已缓存");

  // 确保返回数据包含剩余次数
  if (answerData.data) {
    answerData.data.num = remainingCount;
  }

  // 联网搜索额外消耗提示
  if (enableWebSearch && answerData.code === 200) {
    answerData.msg = (answerData.msg || '查询成功') + ' | 联网搜索已开启，额外消耗次数+1';
  }

  log(`✓ 返回响应: code=${answerData.code}, answer=${JSON.stringify(answerData.data?.answer)}`);
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