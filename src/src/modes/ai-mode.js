/**
 * AI模式处理模块
 * 功能：仅使用AI模型回答问题
 * 
 * 包含：
 * - handleAIMode: 路由处理函数
 * - fetchAICustom: AI模式专用AI调用（独立参数配置）
 * - AI_MODEL_CONFIG: AI模型配置映射
 */

const { saveAnswerToCache, checkAnswerReasonable, incrementAiCalls, incrementModelCalls, incrementTotalQueries, getTypeDescription, buildPrompt, extractJsonFromContent, cleanAiAnswer, normalizeMatchingAnswer, cleanAnswerData, mergeSplitAnswers, MODEL_COLUMN_MAP } = require('../tiku');
const { getEnv } = require('../config');
const { validateAnswer } = require('../utils');

// ==================== AI模型配置映射 ====================

/**
 * AI模型配置映射
 * 注意：每个模型都有独立的参数配置和API密钥
 * 除腾讯混元外，其他模型统一使用302.AI提供商（共享302AI_API_KEY）
 * 腾讯云混元模型共享HUNYUAN_API_KEY
 */
const AI_MODEL_CONFIG = {
  // 302.AI DeepSeek 模型（共享302AI_API_KEY）
  'DeepSeek-V3.2': {
    provider: '302ai',
    model: 'deepseek-ai/DeepSeek-V3.2',
    name: 'DeepSeek-V3.2',
    temperature: 0.6,
    max_tokens: 8192,
    enable_thinking: true,
    cost: 1  // 低成本模型
  },
  'DeepSeek-R1-0528': {
    provider: '302ai',
    model: 'Pro/deepseek-ai/DeepSeek-R1',
    name: 'DeepSeek-R1-0528',
    max_tokens: 8192,
    cost: 3  // 中等成本，推理模型需要更大空间
  },
  'deepseek-v4-flash': {
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    name: 'DeepSeek-V4-Flash',
    max_tokens: 8192,
    thinking: { type: "enabled" },
    reasoning_effort: "max",
    cost: 1  // 低成本
  },
  'deepseek-v4-pro': {
    provider: 'deepseek',
    model: 'deepseek-v4-pro',
    name: 'DeepSeek-V4-Pro',
    max_tokens: 8192,
    thinking: { type: "enabled" },
    reasoning_effort: "max",
    cost: 1  // 低成本
  },
  // 302.AI Qwen 模型（共享302AI_API_KEY）
  'qwen3.6-plus': {
    provider: '302ai',
    model: 'Qwen/Qwen3.6-Plus',
    name: 'qwen3.6-plus',
    temperature: 0.6,
    max_tokens: 8192,
    enable_thinking: true,
    cost: 2  // 中等成本
  },
  'qwen3.7-max': {
    provider: '302ai',
    model: 'Qwen/Qwen3.7-Max',
    name: 'qwen3.7-max',
    temperature: 0.6,
    max_tokens: 8192,
    enable_thinking: true,
    cost: 3  // 中高成本（输入¥12.6/1M，输出¥37.1/1M）
  },
  'qwen3.5-plus': {
    provider: '302ai',
    model: 'Qwen/Qwen3.5-Plus',
    name: 'qwen3.5-plus',
    temperature: 0.6,
    max_tokens: 8192,
    enable_thinking: true,
    cost: 1  // 低成本模型
  },
  // 302.AI MiniMax 模型（共享302AI_API_KEY）
  'minimax-m2.5': {
    provider: '302ai',
    model: 'MiniMax-M2.5',
    name: 'MiniMax-M2.5',
    temperature: 0.6,
    max_tokens: 2048,
    cost: 1  // 低成本模型
  },
  'minimax-m2.7': {
    provider: '302ai',
    model: 'MiniMax-M2.7',
    name: 'MiniMax-M2.7',
    temperature: 0.6,
    max_tokens: 2048,
    cost: 1  // 低成本模型
  },
  // 腾讯云混元模型（共享HUNYUAN_API_KEY）
  'hunyuan-t1': {
    provider: 'tencent',
    model: 'hunyuan-t1-latest',
    name: 'hunyuan-t1',
    max_tokens: 8192,
    cost: 1  // 推理模型，不推荐修改temperature
  },
  'hunyuan-standard': {
    provider: 'tencent',
    model: 'hunyuan-standard-256K',
    name: 'hunyuan-standard-256K',
    temperature: 0.6,
    max_tokens: 2048,
    cost: 1  // 低成本模型
  },
  // 302.AI ChatGPT模型（共享302AI_API_KEY）
  'gpt-5.4-mini': {
    provider: '302ai',
    model: 'gpt-5.4-mini',
    name: 'gpt-5.4-mini',
    temperature: 0.6,
    max_tokens: 2048,
    cost: 3  // 中高成本
  },
  'gpt-5.4-nano': {
    provider: '302ai',
    model: 'gpt-5.4-nano',
    name: 'gpt-5.4-nano',
    temperature: 0.6,
    max_tokens: 2048,
    cost: 1  // 低成本模型
  },
  // 302.AI Gemini 模型（共享302AI_API_KEY）
  'gemini-3.1-flash-lite': {
    provider: '302ai',
    model: 'gemini-3.1-flash-lite',
    name: 'gemini-3.1-flash-lite',
    temperature: 0.6,
    max_tokens: 2048,
    cost: 1  // 低成本模型
  },
  'gemini-3.5-flash': {
    provider: '302ai',
    model: 'gemini-3.5-flash',
    name: 'gemini-3.5-flash',
    temperature: 0.6,
    max_tokens: 2048,
    cost: 2  // 中等成本（输入¥10.5/1M，输出¥63/1M）
  },
  // 302.AI GLM 模型（共享302AI_API_KEY）
  'GLM-5': {
    provider: '302ai',
    model: 'Pro/zai-org/GLM-5',
    name: 'GLM-5',
    temperature: 1.0,
    max_tokens: 8192,
    thinking: { type: "enabled" },
    cost: 4  // 高成本模型
  },
  'GLM-5.1': {
    provider: '302ai',
    model: 'glm-5.1',
    name: 'GLM-5.1',
    temperature: 1.0,
    max_tokens: 8192,
    thinking: { type: "enabled" },
    cost: 4  // 高成本模型
  },
  'GLM-4.7': {
    provider: '302ai',
    model: 'glm-4.7',
    name: 'GLM-4.7',
    temperature: 1.0,
    max_tokens: 8192,
    thinking: { type: "enabled" },
    cost: 2  // 中等成本
  },
  // 302.AI Kimi 模型（共享302AI_API_KEY）
  'kimi-k2.6': {
    provider: '302ai',
    model: 'kimi-k2.6',
    name: 'Kimi-K2.6',
    max_tokens: 8192,
    thinking: { type: "enabled" },
    cost: 4  // 最高成本模型
  },
  'kimi-k2.5': {
    provider: '302ai',
    model: 'kimi-k2.5',
    name: 'Kimi-K2.5',
    max_tokens: 8192,
    thinking: { type: "enabled" },
    cost: 3  // 高成本模型
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
  if (modelConfig.max_tokens !== undefined) {
    body.max_tokens = modelConfig.max_tokens;
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

        // 根据实际模型名映射到简洁的source名称
        const modelToSourceMap = {
          'deepseek-ai/DeepSeek-V3.2': 'DeepSeek-V3.2',
          'Pro/deepseek-ai/DeepSeek-R1': 'DeepSeek-R1',
          'deepseek-v4-flash': 'DeepSeek-V4-Flash',
          'deepseek-v4-pro': 'DeepSeek-V4-Pro',
          'Qwen/Qwen3.6-Plus': 'Qwen3.6-Plus',
          'Qwen/Qwen3.7-Max': 'Qwen3.7-Max',
          'Qwen/Qwen3.5-Plus': 'Qwen3.5-Plus',
          'MiniMax-M2.5': 'MiniMax-M2.5',
          'MiniMax-M2.7': 'MiniMax-M2.7',
          'gpt-5.4-mini': 'GPT-5.4-mini',
          'gpt-5.4-nano': 'GPT-5.4-nano',
          'gemini-3.1-flash-lite': 'Gemini-3.1',
          'gemini-3.5-flash': 'Gemini-3.5',
          'Pro/zai-org/GLM-5': 'GLM-5',
          'glm-5.1': 'GLM-5.1',
          'glm-4.7': 'GLM-4.7',
          'hunyuan-t1-latest': 'hunyuan-t1',
          'hunyuan-standard-256K': 'hunyuan-standard'
        };

        const source = modelToSourceMap[model] || model;

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

    // 超出最大轮数
    console.log("⚠️ 超出最大工具调用轮数限制");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { code: 500, msg: "超出最大工具调用轮数", data: null };

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

  const modelConfig = AI_MODEL_CONFIG[model];
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
    const cost = modelConfig.cost || 1;
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

  log(`✓ 返回响应: code=${answerData.code}, answer=${JSON.stringify(answerData.data?.answer)}`);
  return c.json(answerData);
}

// ==================== 辅助函数 ====================

/**
 * 获取支持的AI模型列表
 * @returns {Array<string>} 支持的AI模型标识符列表
 */
function getSupportedModels() {
  return Object.keys(AI_MODEL_CONFIG);
}

/**
 * 获取AI模型配置
 * @param {string} model - AI模型标识符
 * @returns {Object|null} AI模型配置对象
 */
function getModelConfig(model) {
  return AI_MODEL_CONFIG[model] || null;
}

/**
 * 获取所有模型的消耗映射
 * @returns {Object} 模型消耗映射 { modelId: cost }
 */
function getModelCosts() {
  const costs = {};
  for (const [modelId, config] of Object.entries(AI_MODEL_CONFIG)) {
    costs[modelId] = config.cost || 1;
  }
  return costs;
}

/**
 * 获取完整的模型配置（供客户端动态获取）
 * @returns {Object} 包含类型、选项、映射的完整配置
 */
function getFullModelConfig() {
  // AI类型分组配置（用于客户端下拉选择）
  const typeModelMap = {
    'DeepSeek': ['V4-Flash', 'V4-Pro', 'V3.2', 'R1'],
    'HunYuan': ['Standard', 'T1'],
    'Qwen': ['3.5-plus', '3.6-plus', '3.7-Max'],
    'MiniMax': ['M2.7', 'M2.5'],
    'GLM': ['5.1', '5.0', '4.7'],
    'Kimi': ['K2.6', 'K2.5'],
    'ChatGPT': ['5.4-nano', '5.4'],
    'Gemini': ['3.5', '3.1']
  };
  
  // 默认模型配置（选择最新版本）
  const defaultModels = {
    'DeepSeek': 'V4-Flash',
    'HunYuan': 'Standard',
    'Qwen': '3.7-Max',
    'MiniMax': 'M2.7',
    'GLM': '5.1',
    'Kimi': 'K2.6',
    'ChatGPT': '5.4-nano',
    'Gemini': '3.5'
  };
  
  // 类型+模型名称 → 模型标识符映射
  const modelIdMap = {
    'DeepSeek': {
      'V4-Flash': 'deepseek-v4-flash',
      'V4-Pro': 'deepseek-v4-pro',
      'V3.2': 'DeepSeek-V3.2',
      'R1': 'DeepSeek-R1-0528'
    },
    'HunYuan': {
      'Standard': 'hunyuan-standard',
      'T1': 'hunyuan-t1'
    },
    'Qwen': {
      '3.7-Max': 'qwen3.7-max',
      '3.6-plus': 'qwen3.6-plus',
      '3.5-plus': 'qwen3.5-plus'
    },
    'MiniMax': {
      'M2.7': 'minimax-m2.7',
      'M2.5': 'minimax-m2.5'
    },
    'GLM': {
      '5.1': 'GLM-5.1',
      '5.0': 'GLM-5',
      '4.7': 'GLM-4.7'
    },
    'Kimi': {
      'K2.6': 'kimi-k2.6',
      'K2.5': 'kimi-k2.5'
    },
    'ChatGPT': {
      '5.4-nano': 'gpt-5.4-nano',
      '5.4': 'gpt-5.4-mini'
    },
    'Gemini': {
      '3.5': 'gemini-3.5-flash',
      '3.1': 'gemini-3.1-flash-lite'
    }
  };
  
  // 所有类型选项
  const typeOptions = Object.keys(typeModelMap);
  
  // 所有模型选项（合并）
  const allModelOptions = Object.values(typeModelMap).flat();
  
  return {
    typeOptions,           // ["混元", "DeepSeek", ...]
    allModelOptions,       // ["Standard", "T1", "3.2", ...]
    typeModelMap,          // { '混元': ['Standard', 'T1'], ... }
    defaultModels,         // { '混元': 'Standard', ... }
    modelIdMap,            // { '混元': { 'Standard': 'hunyuan-standard', ... } }
    modelCosts: getModelCosts()  // { 'hunyuan-standard': 1, ... }
  };
}

module.exports = {
  handleAIMode,
  fetchAICustom,
  getSupportedModels,
  getModelConfig,
  getModelCosts,
  getFullModelConfig
};