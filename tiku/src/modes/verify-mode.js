/**
 * 校验模式处理模块
 * 功能：验证题库和AI答案的一致性，不一致时启动深度思考
 * 
 * 包含：
 * - handleVerifyMode: 路由处理函数
 * - fetchVerifyFirstAI: 校验模式第一次查询（非深度思考）
 * - fetchDeepSeekThinking: 校验模式第二次查询（深度思考+Tool Calling）
 * - callAIWithTools: AI调用（支持tool calling）
 * - executeWebSearch: 执行Tavily搜索
 */

const { fetchAnswer, fetchYanxi, saveAnswerToCacheAsync, cleanAndNormalizeAnswer, incrementAIStats, getTypeDescription, buildPrompt, extractJsonFromContent, cleanAnswerData } = require('../tiku');
const { normalizeAnswer, validateAndCleanAnswer, callAIApi, buildUserContent } = require('../utils');
const { db, getEnv, SPONSOR_URL } = require('../config');
const { tavilySearch, WEB_SEARCH_TOOL } = require('../tavily-search');
const { getModelConfig, getDisplayName, calculateCostFromTokens } = require('../config/ai-models');
const { saveStep1Cost, getStep1Cost } = require('../query-tasks');


// ==================== 校验模式第一次查询（非深度思考） ====================

/**
 * 校验模式第一次查询AI（非深度思考）
 * 使用 DeepSeek-V4-Pro，不启用thinking，用于和题库答案比对
 * 
 * @param {Object} questionData - 题目数据
 * @returns {Object} { code, msg, data: { answer, source } }
 */
async function fetchVerifyFirstAI(questionData) {
  const modelConfig = getModelConfig('deepseek-v4-pro');
  if (!modelConfig) {
    console.log("[ERROR] 未找到模型配置: deepseek-v4-pro");
    return { code: 500, msg: "未找到模型配置", data: null, tokenUsage: { promptTokens: 0, completionTokens: 0 } };
  }
  
  const apiUrl = "https://api.deepseek.com/v1/chat/completions";
  const apiKey = getEnv('DEEPSEEK_API_KEY');
  
  if (!apiKey) {
    console.log("[ERROR] 未配置 DEEPSEEK_API_KEY");
    return { code: 500, msg: "未配置 DEEPSEEK_API_KEY", data: null, tokenUsage: { promptTokens: 0, completionTokens: 0 } };
  }
  
  const typeDesc = getTypeDescription(questionData.type);
  const { system: systemPrompt, user: userPrompt, imageUrls } = buildPrompt(questionData, false);

  // 根据模型是否支持视觉选择消息格式
  const supportsVision = modelConfig?.supportsVision && imageUrls && imageUrls.length > 0;
  // D-07去重：构建用户消息content
  const userContent = buildUserContent(userPrompt, imageUrls, supportsVision);

  const body = {
    model: modelConfig.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ],
    temperature: 0.6,
    thinking: { type: "disabled" }
  };
  
  console.log("========= AI请求日志（校验模式第一次） =========");
  console.log("[INFO] 题目:", questionData.question);
  console.log("[INFO] 题型:", typeDesc);
  console.log("[INFO] 模型:", modelConfig.name);
  console.log("[INFO] Prompt长度:", systemPrompt.length + userPrompt.length, "字符");
  
  try {
    console.log("AI查询中...");
    
    // 增加AI调用次数统计（D-01去重：使用统一统计函数）
    await incrementAIStats(modelConfig.model);
    
    const { result, usage } = await callAIApi({ apiUrl, apiKey, body });
    
    // token统计
    if (usage) {
      console.log(`[STAT] token统计: 输入=${usage.prompt_tokens || 0}, 输出=${usage.completion_tokens || 0}`);
    }
    
    console.log("========= AI响应日志（校验模式第一次） =========");
    console.log("[INFO] 响应数据:", JSON.stringify(result).substring(0, 200));
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      const content = result.choices[0].message.content;
      
      const parsed = extractJsonFromContent(content);
      if (parsed) {
          // D-06去重：清洗答案并标准化格式
          parsed.answer = cleanAndNormalizeAnswer(parsed.answer, questionData);
          console.log("[OK] AI解析成功:", JSON.stringify(parsed.answer));
        
        console.log(`[STAT] 本次AI调用token总计: 输入=${usage?.prompt_tokens || 0}, 输出=${usage?.completion_tokens || 0}`);
        console.log("==========================");
        
        return {
          code: 200,
          data: { answer: parsed.answer, source: modelConfig.name },
          msg: "查询成功",
          tokenUsage: { promptTokens: usage?.prompt_tokens || 0, completionTokens: usage?.completion_tokens || 0 }
        };
      }
    }

    console.log("[ERROR] AI解析失败: 响应中未找到有效答案");
    console.log(`[STAT] 本次AI调用token总计: 输入=${usage?.prompt_tokens || 0}, 输出=${usage?.completion_tokens || 0}`);
    console.log("==========================");

    return { code: 500, msg: "未在AI回答中解析到答案", data: null, tokenUsage: { promptTokens: usage?.prompt_tokens || 0, completionTokens: usage?.completion_tokens || 0 }, failureType: 'quality' };

  } catch (e) {
    console.error("[ERROR] AI查询失败:", e.message);
    console.log("[STAT] 本次AI调用token总计: 输入=0, 输出=0 (请求异常，无token数据)");
    console.log("==========================");

    return {
      code: 500,
      msg: `AI查询失败: ${e.message}`,
      data: null,
      tokenUsage: { promptTokens: 0, completionTokens: 0 },
      failureType: 'communication'
    };
  }
}

// ==================== 校验模式第二次查询（深度思考+Tool Calling） ====================

/**
 * 执行一次AI调用（支持tool calling）- 使用DeepSeek官方API
 * 
 * @param {string} apiKey - DeepSeek官方API密钥
 * @param {string} model - 模型名
 * @param {Array} messages - 消息历史
 * @param {boolean} includeTools - 是否包含tools参数（最后一轮去掉tools防止AI再次调用工具）
 * @returns {Object} API响应JSON
 */
async function callAIWithTools(apiKey, model, messages, includeTools = true) {
  const body = {
    model,
    messages,
    ...(includeTools ? { tools: [WEB_SEARCH_TOOL], tool_choice: "auto" } : {})
  };

  // DeepSeek官方API：深度思考开关
  if (model.toLowerCase().includes('deepseek')) {
    body.thinking = { type: "enabled" };
  }

  console.log(`[INFO] 请求body (${includeTools ? '含tools' : '无tools'}):`, JSON.stringify({
    ...body,
    messages: body.messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content.substring(0, 200) + '...' : m.content,
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {})
    }))
  }, null, 2));

  const { result } = await callAIApi({ apiUrl: "https://api.deepseek.com/v1/chat/completions", apiKey, body });
  return result;
}

/**
 * 执行Tavily搜索并将结果格式化为工具返回消息
 * 
 * @param {string} query - AI指定的搜索关键词
 * @returns {string} 格式化的搜索结果
 */
async function executeWebSearch(query) {
  console.log(`[SEARCH] AI请求联网搜索: "${query}"`);
  
  const searchResult = await tavilySearch(query, {
    maxResults: 5,
    searchDepth: 'advanced',
    includeAnswer: true,
    autoParameters: false
  });

  if (searchResult.error) {
    console.log(`[WARN] Tavily搜索出错: ${searchResult.error}`);
    return JSON.stringify({
      error: searchResult.error,
      query: query,
      message: "搜索失败，请基于已有知识回答"
    });
  }

  console.log(`[OK] 搜索完成，获得${searchResult.results?.length || 0}条结果`);
  if (searchResult.answer) {
    console.log(`[INFO] Tavily直接答案: ${searchResult.answer}`);
  }

  // 校验模式需要详细搜索结果来验证答案，传 results 列表
  const resultParts = [];
  if (searchResult.answer) {
    resultParts.push(`【搜索摘要】${searchResult.answer}`);
  }
  if (searchResult.results && searchResult.results.length > 0) {
    resultParts.push('【详细结果】');
    for (const result of searchResult.results) {
      resultParts.push(`${result.title}: ${result.content}`);
    }
  }
  if (resultParts.length === 0) {
    resultParts.push('无搜索结果');
  }

  return resultParts.join('\n\n');
}

/**
 * 请求 AI 深度思考 API（专用于校验模式的深度思考请求）
 * 使用Tool Calling机制，让AI自主决定是否联网搜索以及搜索什么关键词
 * 
 * @param {Object} questionData - 题目数据
 * @returns {Object} { code, msg, data: { answer, source, searchUsed } }
 */
async function fetchDeepSeekThinking(questionData) {
  const modelConfig = getModelConfig('deepseek-v4-pro');
  if (!modelConfig) {
    console.log("[ERROR] 未找到模型配置: deepseek-v4-pro");
    return { code: 500, msg: "未找到模型配置", data: null, tokenUsage: { promptTokens: 0, completionTokens: 0 } };
  }
  
  const apiKey = getEnv('DEEPSEEK_API_KEY');
  
  if (!apiKey) {
    console.log("[ERROR] 未配置 DEEPSEEK_API_KEY");
    return { code: 500, msg: "未配置 DEEPSEEK_API_KEY", data: null, tokenUsage: { promptTokens: 0, completionTokens: 0 } };
  }
  
  const typeDesc = getTypeDescription(questionData.type);
  const { system: systemPrompt, user: basePrompt, imageUrls } = buildPrompt(questionData, true);

  // 变量前置声明（避免 TDZ 错误：catch 块需要访问 token 统计变量）
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  try {
    // 根据模型是否支持视觉选择消息格式（D-07去重）
  const supportsVision = modelConfig?.supportsVision && imageUrls && imageUrls.length > 0;
  const userMessage = buildUserContent(basePrompt, imageUrls, supportsVision);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];

    const MAX_TOOL_ROUNDS = 2;

    console.log("========= AI深度思考(工具调用模式) =========");
    console.log("[INFO] 题目:", questionData.question);
    console.log("[INFO] 题型:", typeDesc);
    console.log("[INFO] 模型:", modelConfig.name);
    console.log("[INFO] 选项:", JSON.stringify(questionData.options));

    // 增加AI调用次数统计（D-01去重：使用统一统计函数）
    await incrementAIStats(modelConfig.model);

    // ========== 多轮工具调用循环 ==========
    // 第0轮：AI可能请求搜索 → 执行搜索
    // 第N轮（最后一轮）：去掉tools参数，要求AI基于已有信息返回最终答案
    let webSearchUsed = false;

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      console.log(`=== 第${round + 1}轮调用 ===`);

      // 最后一轮：去掉tools参数，追加强制回答提示
      if (round === MAX_TOOL_ROUNDS) {
        console.log("[INFO] 最后一轮：移除tools参数，强制AI返回答案");
        if (webSearchUsed) {
          messages.push({
            role: "user",
            content: "请基于上述已有信息和你的知识库，直接输出最终答案。你已无法调用任何工具，不得再次请求联网搜索或任何工具调用。分析过程写在<analysis>标签内，最终答案放在<answer>标签内，格式为：\n<answer>{\"answer\":[\"你的答案\"]}</answer>"
          });
          console.log("[INFO] 最后一轮：已追加强制回答提示（禁止再次搜索）");
        }
      }

      const includeTools = (round < MAX_TOOL_ROUNDS);
      const result = await callAIWithTools(apiKey, modelConfig.model, messages, includeTools);
      
      // 累加token统计
      if (result.usage) {
        totalPromptTokens += result.usage.prompt_tokens || 0;
        totalCompletionTokens += result.usage.completion_tokens || 0;
        console.log(`[INFO] 本轮token: 输入=${result.usage.prompt_tokens || 0}, 输出=${result.usage.completion_tokens || 0}`);
      }

      console.log("[INFO] 响应状态:", result.choices ? result.choices[0]?.finish_reason : 'N/A');
      console.log("[INFO] 完整响应:", JSON.stringify(result, null, 2).substring(0, 2000));

      if (!result.choices || !result.choices[0]) {
        console.log("[X] AI返回无效响应");
        console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
        console.log("==========================");
        return { code: 500, msg: "未在AI回答中解析到答案", data: null, tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens }, failureType: 'communication' };
      }

      const choice = result.choices[0];
      const message = choice.message;

      // 检查是否是工具调用请求（只有非最后一轮才会出现，最后一轮已去掉tools）
      if (choice.finish_reason === "tool_calls" && message.tool_calls && message.tool_calls.length > 0) {
        console.log(`[TOOL] AI请求调用${message.tool_calls.length}个工具`);
        webSearchUsed = true;

        // 将助手消息（包含tool_calls）加入历史
        messages.push(message);

        // 执行每个工具调用
        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function?.name;
          const fnArgs = JSON.parse(toolCall.function?.arguments || '{}');

          console.log(`[TOOL] 工具: ${fnName}, 参数:`, JSON.stringify(fnArgs));

          let toolResult;
          if (fnName === "web_search") {
            toolResult = await executeWebSearch(fnArgs.query || questionData.question);
          } else {
            toolResult = JSON.stringify({ error: `未知工具: ${fnName}` });
          }

          // 将工具结果加入历史
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult
          });

          console.log(`[TOOL] 工具结果长度: ${toolResult.length}字符`);
        }

        // 继续下一轮，让AI处理工具结果
        continue;
      }

      // 没有工具调用 → AI给出了最终答案
      const content = message.content || message.reasoning_content;
      console.log("[INFO] AI返回内容:", content?.substring(0, 500) || '(空)');
      if (content === null && message.reasoning_content) {
        console.log("[INFO] content为null，使用reasoning_content:", message.reasoning_content.substring(0, 200));
      }

      const parsed = extractJsonFromContent(content);
      if (parsed) {
        // D-06去重：清洗答案并标准化格式
        parsed.answer = cleanAndNormalizeAnswer(parsed.answer, questionData);
        // 计算是否使用了搜索
        const usedSearch = messages.some(m => m.role === "tool");
        console.log(`[OK] AI深度思考答案 (${usedSearch ? '使用了联网搜索' : '未使用联网搜索'}):`, JSON.stringify(parsed.answer));
        console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
        console.log("==========================");

        return {
          code: 200,
          data: {
            answer: parsed.answer,
            source: modelConfig.name,
            searchUsed: usedSearch
          },
          msg: "查询成功",
          tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens }
        };
      }

      console.log(`[X] 第${round + 1}轮解析失败: 无法从AI回复中提取JSON`);
      // 如果解析失败但还有轮数剩余，尝试让AI重新回答
      if (round < MAX_TOOL_ROUNDS) {
        messages.push(message); // 保留assistant消息
        messages.push({
          role: "user",
          content: "请以严格JSON格式输出答案：{\"answer\":[\"答案内容\"]}。只输出JSON，不要输出其他内容。"
        });
        continue;
      }
    }

    console.log("[X] AI深度思考：超过最大轮数仍未获得有效答案");
    console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
    console.log("==========================");
    return { code: 500, msg: "未在AI回答中解析到答案", data: null, tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens }, failureType: 'quality' };

  } catch (e) {
    console.error("[X] AI深度思考请求失败:", e.message);
    console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
    console.log("==========================");
    return { code: 500, msg: `AI深度思考失败: ${e.message}`, data: null, tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens }, failureType: 'communication' };
  }
}

// ==================== 路由处理函数 ====================

/**
 * 校验模式路由处理函数
 * @param {Object} c - Hono context
 * @param {Object} params - 请求参数
 * @param {string} params.token - 用户token
 * @param {Object} params.questionData - 题目数据
 * @param {string} params.questionHash - 题目哈希
 * @param {boolean} params.checkOnly - 是否仅检测
 * @param {string} params.hunyuanApiKey - TokenHub API密钥
 * @param {Function} params.log - 日志函数
 * @param {Function} params.lockToken - 预锁定次数函数
 * @param {Function} params.settleToken - 结算次数函数
 * @param {Function} params.releaseToken - 释放锁定函数
 * @param {string} params.taskId - 异步任务ID
 */
async function handleVerifyMode(c, params) {
  const {
    token,
    questionData,
    questionHash,
    checkOnly,
    hunyuanApiKey,
    log,
    lockToken,
    settleToken,
    releaseToken,
    taskId
  } = params;

  log("=== 校验答案模式 ===");

  let answerData;
  let remainingCount = 999999;
  let aiResult = null;       // 用于收集 fetchVerifyFirstAI 的token
  let aiResultThinking = null; // 用于收集 fetchDeepSeekThinking 的token
  let totalCost = 0;  // 总消耗次数

  // 预锁定2次，确保余额充足后再查询
  // 扣次规则（每轮独立预锁定2次，结算多退少补）：
  //   已验证答案命中：结算0.8次（退1.2次）
  //   第一轮题库+AI一致：结算 1+aiCost 次
  //   第一轮不一致返回202：释放2次，202响应中携带 step1Cost（不返回cost）
  //   第二轮深度思考：预锁定2次，结算 1+aiCost1+aiCost2 次，返回最终 cost
  let prelocked = false;
  const lockCount = 2;
  const lockResult = await lockToken(token, lockCount);
  if (!lockResult.success) {
    log(`[X] 预锁定失败: ${lockResult.message}`);
    return c.json({
      code: 403,
      msg: `余额不足，该模式至少需要${lockCount}次，当前剩余${lockResult.remainingCount || 0}次`,
      data: { num: lockResult.remainingCount || 0, answer: [], sponsorUrl: SPONSOR_URL }
    }, 403);
  }
  prelocked = true;
  remainingCount = lockResult.remainingCount;
  log(`预锁定${lockCount}次成功，锁定后余额: ${remainingCount}`);

  // 第一步：查询已验证答案（is_correct=1）
  log("=== 第一步：查询已验证答案 ===");
  try {
    const verifiedAnswer = await db.prepare(
      "SELECT answer, source FROM answer_cache WHERE question_hash = ? AND is_correct = 1"
    ).get(questionHash);

    if (verifiedAnswer) {
      log("[OK] 找到已验证答案，直接返回");
      log(`答案: ${verifiedAnswer.answer}`);
      log(`来源: ${verifiedAnswer.source}`);
      
      let answerArr;
      try {
        answerArr = JSON.parse(verifiedAnswer.answer);
      } catch (e) {
        answerArr = [verifiedAnswer.answer];
      }

      // 已验证答案也需要校验（防止历史脏数据）
      const validation = validateAndCleanAnswer(questionData.type, answerArr, questionData.options);
      if (!validation.valid) {
        log(`[X] 已验证答案校验失败: ${validation.reason}，清除并继续校验流程`);
        await db.prepare(
          "UPDATE answer_cache SET is_correct = 0 WHERE question_hash = ?"
        ).run(questionHash);
        // 不返回，继续走校验流程
      } else {
        // 已验证答案命中，结算0.8次（预锁定2次退1.2次）
        if (prelocked) {
          const settleResult = await settleToken(token, lockCount, 0.8);
          if (settleResult.success) {
            remainingCount = settleResult.remainingCount;
            totalCost = 0.8;
            log(`已验证答案命中，结算0.8次（预锁定2次退1.2次），剩余: ${remainingCount}`);
          } else {
            await releaseToken(token, lockCount);
          }
        }
        return c.json({
          code: 200,
          msg: "答案校验一致(题库)",
          data: {
            answer: validation.answers,
            num: remainingCount,
            source: verifiedAnswer.source,
            isVerified: true,
            cost: totalCost
          }
        });
      }
    } else {
      log("[X] 未找到已验证答案，继续校验流程");
    }
  } catch (e) {
    log(`查询已验证答案失败: ${e.message}`);
  }

  // 校验答案模式：同时请求题库和AI
  if (hunyuanApiKey || getEnv('DEEPSEEK_API_KEY')) {
    // 第二次请求（checkOnly=false）：直接查询思维模式AI
    if (checkOnly === false) {
      log("=== 第二次请求：直接查询思维模式AI ===");
      
      log("深度思考请求参数:");
      log(`题目: ${questionData.question}`);
      log(`题型: ${questionData.type}`);
      log(`选项: ${JSON.stringify(questionData.options)}`);
      
      log("========= 发送第二次深度思考请求 =========");
      aiResultThinking = await fetchDeepSeekThinking(questionData);
      
      log("========= 收到第二次深度思考响应 =========");
      log(`完整响应JSON: ${JSON.stringify(aiResultThinking, null, 2)}`);
      log(`思维模式AI返回: code=${aiResultThinking.code}, msg=${aiResultThinking.msg || ''}`);
      
      if (aiResultThinking.data) {
        log(`思维模式AI答案: ${JSON.stringify(aiResultThinking.data.answer)}`);
        log(`思维模式AI来源: ${aiResultThinking.data.source || 'unknown'}`);
      } else {
        log("[X] 思维模式AI返回data为空");
      }

      if (aiResultThinking.code === 200 && aiResultThinking.data && aiResultThinking.data.answer) {
        log(`[OK] 思维模式AI答案: ${JSON.stringify(aiResultThinking.data.answer)}`);
        answerData = aiResultThinking;
        answerData.msg = "答案校验不一致(思维模式AI)";
        
        // 检查缓存是否存在，不存在才缓存（避免覆盖已有答案）
        const existingCache = await db.prepare(
          "SELECT answer FROM answer_cache WHERE question_hash = ?"
        ).get(questionHash);
        
        if (!existingCache) {
          log("[OK] 缓存不存在，保存深度思考答案");
          saveAnswerToCacheAsync(
            questionHash,
            questionData.question,
            questionData.options,
            questionData.type,
            answerData.data.answer,
            answerData.data.source
          );
          log("[OK] 深度思考答案已缓存");
        } else {
          log("[OK] 缓存已存在，不覆盖原有答案");
        }
      } else {
        log("[X] 思维模式AI请求失败");
        answerData = { code: 500, msg: "思维模式AI请求失败", data: { answer: [], num: remainingCount } };
      }
    } else {
      // 第一次请求（checkOnly=true）：查询题库和AI并比对
      log("=== 校验答案模式：第一步-非思维模式查询 ===");

      // 第二步：题库查询前，查询缓存（不限制is_correct）
      log("=== 第二步：查询缓存（用于跳过题库查询） ===");
      let cachedTikuAnswer = null;
      try {
        cachedTikuAnswer = await db.prepare(
          "SELECT answer, source FROM answer_cache WHERE question_hash = ?"
        ).get(questionHash);
        
        if (cachedTikuAnswer) {
          log(`[OK] 找到缓存答案，来源: ${cachedTikuAnswer.source}`);
        } else {
          log("[X] 未找到缓存答案");
        }
      } catch (e) {
        log(`查询缓存失败: ${e.message}`);
      }

      // 题库查询逻辑：根据缓存来源决定是否跳过题库海查询
      let tikuResult;
      let tikuHasAnswer = false;
      
      // 如果缓存存在且来源是题库海，跳过题库海查询，使用缓存答案
      if (cachedTikuAnswer && cachedTikuAnswer.source === 'tiku') {
        log("[OK] 缓存来源是题库海，跳过题库海查询");
        
        let cachedAnswerArr;
        try {
          cachedAnswerArr = JSON.parse(cachedTikuAnswer.answer);
        } catch (e) {
          cachedAnswerArr = [cachedTikuAnswer.answer];
        }
        
        tikuResult = {
          code: 200,
          msg: "使用缓存题库海答案",
          data: {
            answer: cachedAnswerArr,
            source: 'tiku'
          }
        };
        tikuHasAnswer = true;
        log(`缓存题库海答案: ${JSON.stringify(cachedAnswerArr)}`);
      } else {
        // 缓存不存在或来源不是题库海，查询题库海
        log("=== 查询题库海 ===");
        tikuResult = await fetchAnswer(questionData);
        tikuHasAnswer = tikuResult.code === 200 &&
                            tikuResult.data &&
                            tikuResult.data.answer &&
                            (Array.isArray(tikuResult.data.answer) ? tikuResult.data.answer.length > 0 : true);

        log(`题库海结果: ${tikuHasAnswer ? "[OK] 有答案" : `[X] ${tikuResult.msg || '无答案'}`}`);
      }

      // 如果题库海无答案，尝试言溪题库（不受缓存影响）
      if (!tikuHasAnswer) {
        log("=== 题库海无答案，尝试言溪题库 ===");
        tikuResult = await fetchYanxi(questionData);
        tikuHasAnswer = tikuResult.code === 200 &&
                        tikuResult.data &&
                        tikuResult.data.answer &&
                        (Array.isArray(tikuResult.data.answer) ? tikuResult.data.answer.length > 0 : true);
        log(`言溪题库结果: ${tikuHasAnswer ? "[OK] 有答案" : `[X] ${tikuResult.msg || '无答案'}`}`);
      }

      // AI 查询（并行）
      aiResult = await fetchVerifyFirstAI(questionData);

      const aiHasAnswer = aiResult.code === 200 &&
                          aiResult.data &&
                          aiResult.data.answer &&
                          (Array.isArray(aiResult.data.answer) ? aiResult.data.answer.length > 0 : true);

      log(`AI结果: ${aiHasAnswer ? "[OK] 有答案" : "[X] 无答案"}`);

      // 需要启动深度思考的标志
      let needThinking = false;
      let thinkingReason = '';
      let fallbackAnswer = null;  // 回退答案

      if (tikuHasAnswer && aiHasAnswer) {
        // 都有答案，比对是否一致
        log("题库和AI都有答案，开始比对...");

        // 使用全局标准化函数
        const tikuAnswers = tikuResult.data.answer.map(a => normalizeAnswer(a, questionData.type)).sort();
        const aiAnswers = aiResult.data.answer.map(a => normalizeAnswer(a, questionData.type)).sort();

        const isConsistent = JSON.stringify(tikuAnswers) === JSON.stringify(aiAnswers);

        if (isConsistent) {
          log("[OK] 答案一致，使用题库答案");
          answerData = tikuResult;
          answerData.msg = "答案校验一致(题库)";
          
          // 答案一致：结算 1+aiCost 次（预锁定2次，多退少补）
          if (prelocked) {
            let aiPromptTokens = aiResult?.tokenUsage?.promptTokens || 0;
            let aiCompletionTokens = aiResult?.tokenUsage?.completionTokens || 0;
            let aiCost = 0;
            if (aiPromptTokens > 0 || aiCompletionTokens > 0) {
              aiCost = calculateCostFromTokens('deepseek-v4-pro', aiPromptTokens, aiCompletionTokens);
            }
            const costToDeduct = 1 + aiCost;
            const settleResult = await settleToken(token, lockCount, costToDeduct);
            if (settleResult.success) {
              remainingCount = settleResult.remainingCount;
              totalCost = costToDeduct;
              log(`题库和AI校验一致，结算${costToDeduct}次（预锁定${lockCount}次，1次基础+${aiCost}次AI），剩余: ${remainingCount}`);
            } else {
              await releaseToken(token, lockCount);
            }
          }
          
          // 无论缓存是否存在，都要更新 is_correct=1
          const existingCache = await db.prepare(
            "SELECT answer FROM answer_cache WHERE question_hash = ?"
          ).get(questionHash);
          
          if (!existingCache) {
            log("[OK] 缓存不存在，保存题库答案（标记为已验证正确）");
            saveAnswerToCacheAsync(
              questionHash,
              questionData.question,
              questionData.options,
              questionData.type,
              answerData.data.answer,
              answerData.data.source || 'tiku',
              1  // is_correct=1：题库和AI答案一致，标记为正确
            );
            log("[OK] 题库答案已缓存（is_correct=1）");
          } else {
            log("[OK] 缓存已存在，比较答案是否一致");
            let cachedAnswerArr;
            try {
              cachedAnswerArr = JSON.parse(existingCache.answer);
            } catch (e) {
              cachedAnswerArr = [existingCache.answer];
            }
            
            // 使用 normalizeAnswer 标准化后比较答案
            const currentAnswer = answerData.data.answer;
            const cachedNormalized = cachedAnswerArr.map(a => normalizeAnswer(a, questionData.type)).sort();
            const currentNormalized = currentAnswer.map(a => normalizeAnswer(a, questionData.type)).sort();
            const isSameAnswer = JSON.stringify(cachedNormalized) === JSON.stringify(currentNormalized);
            
            if (isSameAnswer) {
              log("[OK] 缓存答案和校验答案完全一样（标准化后），只更新 is_correct=1");
              await db.prepare(
                "UPDATE answer_cache SET is_correct = 1 WHERE question_hash = ?"
              ).run(questionHash);
              log("[OK] 已更新 is_correct=1");
            } else {
              log("[WARN] 缓存答案和校验答案不一样，准备覆盖缓存答案");
              log(`  缓存答案: ${JSON.stringify(cachedAnswerArr)}`);
              log(`  校验答案: ${JSON.stringify(currentAnswer)}`);
              
              // 通过 saveAnswerToCacheAsync 覆盖（内置校验）
              saveAnswerToCacheAsync(questionHash, questionData.question, questionData.options, questionData.type, currentAnswer, answerData.data.source || 'tiku', 1);
              log("[OK] 已覆盖缓存答案并设置 is_correct=1");
            }
          }
        } else {
          log("[X] 答案不一致，需要深度思考");
          log(`题库答案: ${JSON.stringify(tikuResult.data.answer)}`);
          log(`AI答案(非思维): ${JSON.stringify(aiResult.data.answer)}`);
          needThinking = true;
          thinkingReason = '题库和AI答案不一致';
          fallbackAnswer = aiResult;  // 回退使用AI答案
        }
      } else if (tikuHasAnswer) {
        log("[X] 仅题库有答案，AI无答案，需要深度思考");
        needThinking = true;
        thinkingReason = 'AI无答案，需深度思考确认';
        fallbackAnswer = tikuResult;  // 回退使用题库答案
      } else if (aiHasAnswer) {
        log("[X] 仅AI有答案，题库无答案，需要深度思考");
        needThinking = true;
        thinkingReason = '题库无答案，需深度思考确认';
        fallbackAnswer = aiResult;  // 回退使用AI答案
      } else {
        log("[X] 题库和AI均无答案，尝试深度思考");
        needThinking = true;
        thinkingReason = '题库和AI均无答案，尝试深度思考';
        fallbackAnswer = null;  // 无回退答案
      }

      // 如果需要深度思考
      if (needThinking) {
        // 如果是检测模式（checkOnly=true），返回202通知客户端
        if (checkOnly) {
          log("=== 检测模式：返回202状态码，通知客户端启动思维模式 ===");
          // 第一轮结算：预锁定2次，实际消耗 step1Cost（多退少补）
          // AI通讯故障不扣AI费用；AI质量问题扣AI费用50%；正常扣全额AI费用
          let step1Cost = 1;
          if (prelocked) {
            let aiPromptTokens = aiResult?.tokenUsage?.promptTokens || 0;
            let aiCompletionTokens = aiResult?.tokenUsage?.completionTokens || 0;
            let aiCost = 0;
            const aiFailureType = aiResult?.failureType;
            if (aiPromptTokens > 0 || aiCompletionTokens > 0) {
              const fullAiCost = calculateCostFromTokens('deepseek-v4-pro', aiPromptTokens, aiCompletionTokens);
              if (aiFailureType === 'communication') {
                aiCost = 0;
                log(`[WARN] 第一轮AI通讯故障，不扣AI费用（基础1次照常）`);
              } else if (aiFailureType === 'quality') {
                aiCost = fullAiCost * 0.5;
                log(`[WARN] 第一轮AI回答质量问题，按50%扣AI费用: ${fullAiCost}*0.5=${aiCost}次`);
              } else {
                aiCost = fullAiCost;
              }
            }
            step1Cost = 1 + aiCost;
            const settleResult = await settleToken(token, lockCount, step1Cost);
            if (settleResult.success) {
              remainingCount = settleResult.remainingCount;
              log(`第一轮结算完成，预锁定${lockCount}次，实际消耗${step1Cost}次（1次基础+${aiCost}次AI），退还${lockCount - step1Cost}次，剩余: ${remainingCount}`);
            } else {
              await releaseToken(token, lockCount);
              log(`[WARN] 第一轮结算失败，已释放锁定`);
            }
            // 保存 step1Cost 到本地数据库，供第二轮计算总 cost
            if (taskId) {
              saveStep1Cost(taskId, step1Cost);
              log(`第一轮 step1Cost=${step1Cost} 已保存到本地数据库`);
            }
          }
          return c.json({
            code: 202,
            status: "thinking",
            msg: thinkingReason,
            data: {
              needThinking: true,
              tikuAnswer: tikuHasAnswer ? tikuResult.data.answer : null,
              aiAnswer: aiHasAnswer ? aiResult.data.answer : null,
              reason: thinkingReason,
              thinkingModel: getDisplayName('deepseek-v4-pro'),
              num: remainingCount
            }
          });
        }

        // 直接查询思维模式AI
        log("=== 启动深度思考模式 ===");
        
        log("深度思考请求参数:");
        log(`题目: ${questionData.question}`);
        log(`题型: ${questionData.type}`);
        log(`选项: ${JSON.stringify(questionData.options)}`);
        
        log("========= 发送深度思考请求 =========");
        aiResultThinking = await fetchDeepSeekThinking(questionData);
        
        log("========= 收到深度思考响应 =========");
        log(`完整响应JSON: ${JSON.stringify(aiResultThinking, null, 2)}`);
        log(`思维模式AI返回: code=${aiResultThinking.code}, msg=${aiResultThinking.msg || ''}`);
        
        if (aiResultThinking.data) {
          log(`思维模式AI答案: ${JSON.stringify(aiResultThinking.data.answer)}`);
          log(`思维模式AI来源: ${aiResultThinking.data.source || 'unknown'}`);
        } else {
          log("[X] 思维模式AI返回data为空");
        }

        if (aiResultThinking.code === 200 && aiResultThinking.data && aiResultThinking.data.answer) {
          log(`[OK] 思维模式AI答案: ${JSON.stringify(aiResultThinking.data.answer)}`);
          answerData = aiResultThinking;
          answerData.msg = thinkingReason + "(思维模式AI)";
          answerData.data.thinkingUsed = true;
          answerData.data.thinkingReason = thinkingReason;

          // 检查缓存是否存在，不存在才缓存（避免覆盖已有答案）
          const existingCache = await db.prepare(
            "SELECT answer FROM answer_cache WHERE question_hash = ?"
          ).get(questionHash);
          
          if (!existingCache) {
            log("[OK] 缓存不存在，保存深度思考答案");
            saveAnswerToCacheAsync(
              questionHash,
              questionData.question,
              questionData.options,
              questionData.type,
              answerData.data.answer,
              answerData.data.source
            );
            log("[OK] 深度思考答案已缓存");
          } else {
            log("[OK] 缓存已存在，不覆盖原有答案");
          }
        } else {
          log("[X] 思维模式AI请求失败");
          if (fallbackAnswer) {
            log("使用回退答案");
            answerData = fallbackAnswer;
            answerData.msg = thinkingReason + "(回退答案)";
          } else {
            // 通讯故障返回"AI通讯故障，请联系管理员检查"；质量问题返回原msg
            const thinkFailureType = aiResultThinking?.failureType;
            if (thinkFailureType === 'communication') {
              answerData = { code: 500, msg: "AI通讯故障，请联系管理员检查", data: { answer: [], num: remainingCount } };
            } else {
              answerData = { code: 404, msg: aiResultThinking?.msg || "深度思考失败且无可用答案", data: { answer: [], num: remainingCount } };
            }
          }
        }
      }
    }
  } else {
    log("[X] 校验模式需要配置DEEPSEEK_API_KEY");
    // Bug #2 修复：DEEPSEEK_API_KEY 未配置时预锁定需全额退还，避免用户被白扣 lockCount 次
    if (prelocked) {
      const settleResult = await settleToken(token, lockCount, 0);
      if (settleResult.success) {
        remainingCount = settleResult.remainingCount;
        log(`[WARN] API Key 未配置，预锁定${lockCount}次已全额退还，剩余: ${remainingCount}`);
      } else {
        await releaseToken(token, lockCount);
        log(`[WARN] 结算失败，已释放预锁定${lockCount}次`);
      }
    }
    return c.json({
      code: 500,
      msg: "AI通讯故障，请联系管理员检查",
      data: { answer: [], num: remainingCount }
    }, 500);
  }

  // 统一覆盖为用户Token的剩余次数（避免返回题库或AI的num）
  if (answerData && answerData.data) {
    answerData.data.num = remainingCount;
  }

  // ========== 结算预锁定次数 ==========
  // 根据 checkOnly 状态区分第一轮/第二轮结算逻辑

  if (prelocked) {
    // 计算第二次AI深度思考的实际token消耗
    let step2PromptTokens = aiResultThinking?.tokenUsage?.promptTokens || 0;
    let step2CompletionTokens = aiResultThinking?.tokenUsage?.completionTokens || 0;
    let step2AiCost = 0;
    if (step2PromptTokens > 0 || step2CompletionTokens > 0) {
      step2AiCost = calculateCostFromTokens('deepseek-v4-pro', step2PromptTokens, step2CompletionTokens);
    }

    if (checkOnly === false) {
      // ===== 第二轮（深度思考）独立结算 =====
      // AI通讯故障不扣费用；AI质量问题扣50%；正常按 max(aiCost, 1) 结算
      const step2FailureType = aiResultThinking?.failureType;
      let step2Cost;
      if (step2FailureType === 'communication') {
        step2Cost = 0;
        log(`[WARN] 第二轮AI通讯故障，不扣第二轮费用`);
      } else if (step2FailureType === 'quality') {
        step2Cost = step2AiCost * 0.5;
        log(`[WARN] 第二轮AI回答质量问题，按50%扣费: ${step2AiCost}*0.5=${step2Cost}次`);
      } else {
        step2Cost = Math.max(step2AiCost, 1); // 成功时第二轮最低1次
      }
      // 第二轮重新锁定2次，再结算 step2Cost
      const step2LockResult = await lockToken(token, lockCount);
      if (step2LockResult.success) {
        const settleResult = await settleToken(token, lockCount, step2Cost);
        if (settleResult.success) {
          remainingCount = settleResult.remainingCount;
          log(`第二轮结算完成，预锁定${lockCount}次，实际消耗${step2Cost}次，剩余: ${remainingCount}`);
        } else {
          await releaseToken(token, lockCount);
          log(`[WARN] 第二轮结算失败，已释放锁定`);
        }
      } else {
        log(`[X] 第二轮预锁定失败: ${step2LockResult.message}`);
        return c.json({
          code: 403,
          msg: `余额不足，深度思考至少需要${lockCount}次，当前剩余${step2LockResult.remainingCount || 0}次`,
          data: { answer: [], num: step2LockResult.remainingCount || 0, sponsorUrl: SPONSOR_URL }
        }, 403);
      }
      // 从本地数据库读取第一轮的 step1Cost，计算总 cost 返回给用户
      const step1Cost = taskId ? getStep1Cost(taskId) : 1;
      totalCost = step1Cost + step2Cost;
      log(`总消耗${totalCost}次（第一轮${step1Cost}+第二轮${step2Cost}）`);
    } else {
      // ===== 第一轮（一致场景）结算 =====
      // 一致场景下AI必然成功（aiHasAnswer=true），此处防御性处理 failureType
      // 计算第一次AI的实际token消耗
      let step1PromptTokens = aiResult?.tokenUsage?.promptTokens || 0;
      let step1CompletionTokens = aiResult?.tokenUsage?.completionTokens || 0;
      let step1AiCost = 0;
      const step1FailureType = aiResult?.failureType;
      if (step1PromptTokens > 0 || step1CompletionTokens > 0) {
        const fullAiCost = calculateCostFromTokens('deepseek-v4-pro', step1PromptTokens, step1CompletionTokens);
        if (step1FailureType === 'communication') {
          step1AiCost = 0;
          log(`[WARN] 第一轮AI通讯故障，不扣AI费用（基础1次照常）`);
        } else if (step1FailureType === 'quality') {
          step1AiCost = fullAiCost * 0.5;
          log(`[WARN] 第一轮AI回答质量问题，按50%扣AI费用: ${fullAiCost}*0.5=${step1AiCost}次`);
        } else {
          step1AiCost = fullAiCost;
        }
      }
      totalCost = 1 + step1AiCost;

      const settleResult = await settleToken(token, lockCount, totalCost);
      if (settleResult.success) {
        remainingCount = settleResult.remainingCount;
        log(`第一轮结算完成，预锁定${lockCount}次，实际消耗${totalCost}次（1次基础+${step1AiCost}次AI），剩余: ${remainingCount}`);
      } else {
        await releaseToken(token, lockCount);
        log(`[WARN] 第一轮结算失败，已释放锁定`);
      }
    }
  }

  if (answerData && answerData.data) {
    answerData.data.num = remainingCount;
  }

  // ========== 先清洗答案，再校验（修复#号导致校验失败的问题） ==========
  answerData = cleanAnswerData(answerData);

  // 最终校验：答案格式和选项匹配（仅对有答案的情况校验，使用清洗后的答案）
  if (answerData && answerData.data && answerData.data.answer && answerData.data.answer.length > 0) {
    const { valid, reason, answers: fixedAnswers } = validateAndCleanAnswer(questionData.type, answerData.data.answer, questionData.options);
    if (fixedAnswers !== answerData.data.answer) {
      answerData.data.answer = fixedAnswers;
    }
    if (!valid) {
      log(`[X] 答案校验失败: ${reason}`);
      return c.json({
        code: 422,
        msg: `答案校验失败: ${reason}`,
        data: { answer: [], num: remainingCount }
      }, 422);
    }
  }

  // 添加消耗次数到返回数据
  if (answerData && answerData.data && totalCost > 0) {
    answerData.data.cost = totalCost;
  }

  return c.json(answerData);
}

module.exports = {
  handleVerifyMode,
  fetchDeepSeekThinking,
  callAIWithTools,
  executeWebSearch
};