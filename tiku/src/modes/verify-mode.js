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

const { fetchAnswer, fetchYanxi, saveAnswerToCache, incrementAiCalls, incrementModelCalls, incrementTotalQueries, getTypeDescription, buildPrompt, extractJsonFromContent, cleanAiAnswer, normalizeMatchingAnswer, cleanAnswerData } = require('../tiku');
const { normalizeAnswer, validateAnswer } = require('../utils');
const { db, getEnv, SPONSOR_URL } = require('../config');
const { tavilySearch, formatSearchContext, WEB_SEARCH_TOOL } = require('../tavily-search');
const { getModelConfig, getDisplayName, MODEL_COLUMN_MAP } = require('../config/ai-models');

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
    console.log("❌ 未找到模型配置: deepseek-v4-pro");
    return { code: 500, msg: "未找到模型配置", data: null };
  }
  
  const apiUrl = "https://api.deepseek.com/v1/chat/completions";
  const apiKey = getEnv('DEEPSEEK_API_KEY');
  
  if (!apiKey) {
    console.log("❌ 未配置 DEEPSEEK_API_KEY");
    return { code: 500, msg: "未配置 DEEPSEEK_API_KEY", data: null };
  }
  
  const typeDesc = getTypeDescription(questionData.type);
  const { system: systemPrompt, user: userPrompt } = buildPrompt(questionData, false);

  const body = {
    model: modelConfig.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.6,
    max_tokens: 8192,
    thinking: { type: "disabled" }
  };
  
  console.log("━━━━━━━━━ AI请求日志（校验模式第一次） ━━━━━━━━━");
  console.log("📍 题目:", questionData.question);
  console.log("📍 题型:", typeDesc);
  console.log("📍 模型:", modelConfig.name);
  console.log("📍 Prompt长度:", systemPrompt.length + userPrompt.length, "字符");
  
  try {
    console.log("AI查询中...");
    
    await incrementAiCalls();
    await incrementTotalQueries('ai');
    
    const modelColumn = MODEL_COLUMN_MAP[modelConfig.model];
    if (modelColumn) {
      await incrementModelCalls(modelColumn);
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    console.log("━━━━━━━━━ AI响应日志（校验模式第一次） ━━━━━━━━━");
    console.log("📍 响应状态:", response.status);
    console.log("📍 响应数据:", JSON.stringify(result).substring(0, 200));
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      const content = result.choices[0].message.content;
      
      const parsed = extractJsonFromContent(content);
      if (parsed) {
          // 清理AI答案中的"选项X"前缀（安全模式：仅当去掉前缀后匹配选项时才删除）
          if (Array.isArray(parsed.answer)) {
            parsed.answer = parsed.answer.map(a => cleanAiAnswer(a, questionData.options));
          }
          // 连线题：标准化答案格式（拆分合并字符串）
          parsed.answer = normalizeMatchingAnswer(parsed.answer, questionData.type);
          console.log("✅ AI解析成功:", JSON.stringify(parsed.answer));
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        return {
          code: 200,
          data: { answer: parsed.answer, source: modelConfig.name },
          msg: "查询成功"
        };
      }
    }
    
    console.log("❌ AI解析失败: 响应中未找到有效答案");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    return { code: 500, msg: "AI解析失败", data: null };
    
  } catch (e) {
    console.error("❌ AI查询失败:", e.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    return { 
      code: 500, 
      msg: `AI查询失败: ${e.message}`, 
      data: null 
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
 * @param {number} maxTokens - 最大token数
 * @returns {Object} API响应JSON
 */
async function callAIWithTools(apiKey, model, messages, maxTokens = 8192) {
  const body = {
    model,
    messages,
    max_tokens: maxTokens,
    tools: [WEB_SEARCH_TOOL],
    tool_choice: "auto"  // AI自主决定是否调用工具
  };

  // DeepSeek官方API：深度思考开关
  if (model.toLowerCase().includes('deepseek')) {
    body.thinking = { type: "enabled" };
  }

  console.log("📍 请求body (含tools):", JSON.stringify({
    ...body,
    messages: body.messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content.substring(0, 200) + '...' : m.content,
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {})
    }))
  }, null, 2));

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}

/**
 * 执行Tavily搜索并将结果格式化为工具返回消息
 * 
 * @param {string} query - AI指定的搜索关键词
 * @returns {string} 格式化的搜索结果
 */
async function executeWebSearch(query) {
  console.log(`🔍 AI请求联网搜索: "${query}"`);
  
  const searchResult = await tavilySearch(query, {
    maxResults: 10,
    includeAnswer: true,
    autoParameters: true
  });

  if (searchResult.error) {
    console.log(`⚠️ Tavily搜索出错: ${searchResult.error}`);
    return JSON.stringify({
      error: searchResult.error,
      query: query,
      message: "搜索失败，请基于已有知识回答"
    });
  }

  console.log(`✅ 搜索完成，获得${searchResult.results?.length || 0}条结果`);
  if (searchResult.answer) {
    console.log(`📍 Tavily直接答案: ${searchResult.answer}`);
  }

  // 构建结构化的搜索结果
  const formattedResults = [];
  if (searchResult.answer) {
    formattedResults.push(`【Tavily直接答案】${searchResult.answer}`);
  }
  formattedResults.push(formatSearchContext(searchResult.results));

  // 关键提示：告诉AI判断是否足够
  formattedResults.push('\n【判断提示】请立即判断：如果上述搜索结果已经能确定答案，就直接输出<answer>标签，不要再继续搜索。只有当结果完全无关或不足时，才考虑再次搜索（用更精确的关键词）。');

  return formattedResults.join('\n\n');
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
    console.log("❌ 未找到模型配置: deepseek-v4-pro");
    return { code: 500, msg: "未找到模型配置", data: null };
  }
  
  const apiKey = getEnv('DEEPSEEK_API_KEY');
  
  if (!apiKey) {
    console.log("❌ 未配置 DEEPSEEK_API_KEY");
    return { code: 500, msg: "未配置 DEEPSEEK_API_KEY", data: null };
  }
  
  const typeDesc = getTypeDescription(questionData.type);
  const { system: systemPrompt, user: basePrompt } = buildPrompt(questionData, true);

  try {
    const userMessage = basePrompt;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    const MAX_TOOL_ROUNDS = 2;

    console.log("━━━━━━━━━ AI深度思考(工具调用模式) ━━━━━━━━━");
    console.log("📍 题目:", questionData.question);
    console.log("📍 题型:", typeDesc);
    console.log("📍 模型:", modelConfig.name);
    console.log("📍 选项:", JSON.stringify(questionData.options));

    await incrementAiCalls();
    await incrementTotalQueries('ai');

    const thinkingModelColumn = MODEL_COLUMN_MAP[modelConfig.model];
    if (thinkingModelColumn) {
      await incrementModelCalls(thinkingModelColumn);
    }

    // ========== 多轮工具调用循环 ==========
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      console.log(`━━━ 第${round + 1}轮调用 ━━━`);

      const result = await callAIWithTools(apiKey, modelConfig.model, messages);
      
      console.log("📍 响应状态:", result.choices ? result.choices[0]?.finish_reason : 'N/A');
      console.log("📍 完整响应:", JSON.stringify(result, null, 2).substring(0, 2000));

      if (!result.choices || !result.choices[0]) {
        console.log("✗ AI返回无效响应");
        return { code: 500, msg: "AI返回无效响应", data: null };
      }

      const choice = result.choices[0];
      const message = choice.message;

      // 检查是否是工具调用请求
      if (choice.finish_reason === "tool_calls" && message.tool_calls && message.tool_calls.length > 0) {
        console.log(`🔧 AI请求调用${message.tool_calls.length}个工具`);

        // 将助手消息（包含tool_calls）加入历史
        messages.push(message);

        // 如果是最后一轮，拦截工具调用，强制 AI 回答
        const isLastRound = (round === MAX_TOOL_ROUNDS);
        
        // 执行每个工具调用
        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function?.name;
          const fnArgs = JSON.parse(toolCall.function?.arguments || '{}');

          console.log(`🔧 工具: ${fnName}, 参数:`, JSON.stringify(fnArgs));

          let toolResult;
          if (isLastRound) {
            // 达到最大轮数，不再搜索，提示 AI 基于已有信息回答（强化提示）
            toolResult = JSON.stringify({ 
              message: "搜索次数已达上限，你必须立即停止搜索！现在请基于已有信息，严格按照以下格式输出最终答案，不要输出任何其他内容：\n<answer>{\"answer\":[\"你的答案\"]}</answer>\n只输出这一行，不要分析、不要解释、不要搜更多内容。" 
            });
            console.log(`⚠️ 已达最大搜索轮数，拦截工具调用，提示 AI 停止搜索并强制输出JSON`);
          } else if (fnName === "web_search") {
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

          console.log(`🔧 工具结果长度: ${toolResult.length}字符`);
        }

        // 如果是最后一轮，我们需要再调用 AI 来获取最终答案
        if (isLastRound) {
          // 第一次尝试：正常调用获取最终答案
          console.log(`━━━ 最终轮：要求 AI 基于已有信息回答 ━━━`);
          
          let finalParsed = null;
          // 尝试最多2次（第一次正常，第二次用更严格的提示）
          for (let retryAttempt = 0; retryAttempt < 2; retryAttempt++) {
            if (retryAttempt === 1) {
              // 第一次失败，用超严格提示重试
              console.log(`📢 第一次解析失败，用超严格提示重试...`);
              messages.push({
                role: "user",
                content: "你必须立即输出最终答案！只输出一行，格式如下（替换【】内容）：\n<answer>{\"answer\":[\"【你的答案】\"]}</answer>"
              });
            }
            
            const finalResult = await callAIWithTools(apiKey, modelConfig.model, messages);
            
            if (finalResult.choices && finalResult.choices[0]) {
              const finalContent = finalResult.choices[0].message?.content || '';
              console.log(`📍 AI最终返回内容(retry=${retryAttempt}):`, finalContent?.substring(0, 500) || '(空)');
              
              const parsed = extractJsonFromContent(finalContent);
              if (parsed) {
                // 清理AI答案中的"选项X"前缀（安全模式：仅当去掉前缀后匹配选项时才删除）
                if (Array.isArray(parsed.answer)) {
                  parsed.answer = parsed.answer.map(a => cleanAiAnswer(a, questionData.options));
                }
                // 连线题：标准化答案格式（拆分合并字符串）
                parsed.answer = normalizeMatchingAnswer(parsed.answer, questionData.type);
                finalParsed = parsed;
                break; // 解析成功，跳出重试循环
              }
              
              console.log(`⚠️ 第${retryAttempt + 1}次解析失败，尝试${retryAttempt < 1 ? '重试' : '放弃'}`);
            }
          }
          
          if (finalParsed) {
            const usedSearch = messages.some(m => m.role === "tool");
            console.log(`✅ AI深度思考答案 (${usedSearch ? '使用了联网搜索' : '未使用联网搜索'}):`, JSON.stringify(finalParsed.answer));
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
            return {
              code: 200,
              data: {
                answer: finalParsed.answer,
                source: modelConfig.name,
                searchUsed: usedSearch
              },
              msg: "查询成功"
            };
          }
          
          // 如果最终还是没解析出来，跳出循环报错
          break; 
        }

        // 继续下一轮，让AI处理工具结果
        continue;
      }

      // 没有工具调用 → AI给出了最终答案
      const content = message.content || message.reasoning_content;
      console.log("📍 AI返回内容:", content?.substring(0, 500) || '(空)');
      if (content === null && message.reasoning_content) {
        console.log("📍 content为null，使用reasoning_content:", message.reasoning_content.substring(0, 200));
      }

      const parsed = extractJsonFromContent(content);
      if (parsed) {
        // 清理AI答案中的"选项X"前缀（安全模式：仅当去掉前缀后匹配选项时才删除）
        if (Array.isArray(parsed.answer)) {
          parsed.answer = parsed.answer.map(a => cleanAiAnswer(a, questionData.options));
        }
        // 连线题：标准化答案格式（拆分合并字符串）
        parsed.answer = normalizeMatchingAnswer(parsed.answer, questionData.type);
        // 计算是否使用了搜索
        const usedSearch = messages.some(m => m.role === "tool");
        console.log(`✅ AI深度思考答案 (${usedSearch ? '使用了联网搜索' : '未使用联网搜索'}):`, JSON.stringify(parsed.answer));
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return {
          code: 200,
          data: {
            answer: parsed.answer,
            source: modelConfig.name,
            searchUsed: usedSearch
          },
          msg: "查询成功"
        };
      }

      console.log(`✗ 第${round + 1}轮解析失败: 无法从AI回复中提取JSON`);
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

    console.log("✗ AI深度思考：超过最大轮数仍未获得有效答案");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { code: 500, msg: "AI深度思考解析失败", data: null };
    
  } catch (e) {
    console.error("✗ AI深度思考请求失败:", e.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { code: 500, msg: `AI深度思考失败: ${e.message}`, data: null };
  }
}

// ==================== 路由处理函数 ====================

/**
 * 校验模式路由处理函数
 * @param {Object} c - Hono context
 * @param {Object} params - 请求参数
 * @param {string} params.token - 用户token
 * @param {string} params.userId - 用户ID
 * @param {Object} params.questionData - 题目数据
 * @param {boolean} params.verifyAnswer - 是否校验答案
 * @param {boolean} params.checkOnly - 是否仅检测
 * @param {string} params.hunyuanApiKey - TokenHub API密钥
 * @param {Object} params.checkResult - 校验结果
 * @param {Function} params.log - 日志函数
 * @param {boolean} params.FREE_MODE - 免费模式
 * @param {Function} params.decrementCount - 扣除次数函数
 */
async function handleVerifyMode(c, params) {
  const {
    token,
    userId,
    questionData,
    questionHash,
    verifyAnswer,
    checkOnly,
    hunyuanApiKey,
    log,
    FREE_MODE,
    decrementCount,
    skipUserIdCheck
  } = params;

  log("━━━ 校验答案模式 ━━━");

  let answerData;
  let remainingCount = 999999;

  // 免费模式不扣除次数
  if (!FREE_MODE) {
    const VERIFY_MODE_COST = 2;
    log(`扣除次数: ${VERIFY_MODE_COST}（校验模式）`);
    const decrementResult = await decrementCount(token, userId, skipUserIdCheck, VERIFY_MODE_COST);
    if (!decrementResult.success) {
      return c.json({
        code: 403,
        msg: decrementResult.message,
        data: { num: decrementResult.remainingCount, answer: [], sponsorUrl: SPONSOR_URL }
      }, 403);
    }
    remainingCount = decrementResult.remainingCount;
    log(`剩余次数: ${remainingCount}`);
  } else {
    log("免费模式: 不扣除次数");
  }

  // 第一步：查询已验证答案（is_correct=1）
  log("━━━ 第一步：查询已验证答案 ━━━");
  try {
    const verifiedAnswer = await db.prepare(
      "SELECT answer, source FROM answer_cache WHERE question_hash = ? AND is_correct = 1"
    ).get(questionHash);

    if (verifiedAnswer) {
      log("✓ 找到已验证答案，直接返回");
      log(`答案: ${verifiedAnswer.answer}`);
      log(`来源: ${verifiedAnswer.source}`);
      
      let answerArr;
      try {
        answerArr = JSON.parse(verifiedAnswer.answer);
      } catch (e) {
        answerArr = [verifiedAnswer.answer];
      }

      // 已验证答案也需要校验（防止历史脏数据）
      const validation = validateAnswer(questionData.type, answerArr, questionData.options);
      if (!validation.valid) {
        log(`✗ 已验证答案校验失败: ${validation.reason}，清除并继续校验流程`);
        await db.prepare(
          "UPDATE answer_cache SET is_correct = 0 WHERE question_hash = ?"
        ).run(questionHash);
        // 不返回，继续走校验流程
      } else {
        return c.json({
          code: 200,
          msg: "答案校验一致(题库)",
          data: {
            answer: answerArr,
            num: remainingCount,
            source: verifiedAnswer.source,
            isVerified: true
          }
        });
      }
    } else {
      log("✗ 未找到已验证答案，继续校验流程");
    }
  } catch (e) {
    log(`查询已验证答案失败: ${e.message}`);
  }

  // 校验答案模式：同时请求题库和AI
  if (hunyuanApiKey || getEnv('DEEPSEEK_API_KEY')) {
    // 第二次请求（checkOnly=false）：直接查询思维模式AI
    if (!checkOnly) {
      log("━━━ 第二次请求：直接查询思维模式AI ━━━");
      
      log("深度思考请求参数:");
      log(`题目: ${questionData.question}`);
      log(`题型: ${questionData.type}`);
      log(`选项: ${JSON.stringify(questionData.options)}`);
      
      log("━━━━━━━━━ 发送第二次深度思考请求 ━━━━━━━━━");
      const aiResultThinking = await fetchDeepSeekThinking(questionData);
      
      log("━━━━━━━━━ 收到第二次深度思考响应 ━━━━━━━━━");
      log(`完整响应JSON: ${JSON.stringify(aiResultThinking, null, 2)}`);
      log(`思维模式AI返回: code=${aiResultThinking.code}, msg=${aiResultThinking.msg || ''}`);
      
      if (aiResultThinking.data) {
        log(`思维模式AI答案: ${JSON.stringify(aiResultThinking.data.answer)}`);
        log(`思维模式AI来源: ${aiResultThinking.data.source || 'unknown'}`);
      } else {
        log("✗ 思维模式AI返回data为空");
      }

      if (aiResultThinking.code === 200 && aiResultThinking.data && aiResultThinking.data.answer) {
        log(`✓ 思维模式AI答案: ${JSON.stringify(aiResultThinking.data.answer)}`);
        answerData = aiResultThinking;
        answerData.msg = "答案校验不一致(思维模式AI)";
        
        // 检查缓存是否存在，不存在才缓存（避免覆盖已有答案）
        const existingCache = await db.prepare(
          "SELECT answer FROM answer_cache WHERE question_hash = ?"
        ).get(questionHash);
        
        if (!existingCache) {
          log("✓ 缓存不存在，保存深度思考答案");
          await saveAnswerToCache(
            questionHash,
            questionData.question,
            questionData.options,
            questionData.type,
            answerData.data.answer,
            answerData.data.source
          );
          log("✓ 深度思考答案已缓存");
        } else {
          log("✓ 缓存已存在，不覆盖原有答案");
        }
      } else {
        log("✗ 思维模式AI请求失败");
        answerData = { code: 500, msg: "思维模式AI请求失败", data: { answer: [], num: remainingCount } };
      }
    } else {
      // 第一次请求（checkOnly=true）：查询题库和AI并比对
      log("━━━ 校验答案模式：第一步-非思维模式查询 ━━━");

      // 第二步：题库查询前，查询缓存（不限制is_correct）
      log("━━━ 第二步：查询缓存（用于跳过题库查询） ━━━");
      let cachedTikuAnswer = null;
      try {
        cachedTikuAnswer = await db.prepare(
          "SELECT answer, source FROM answer_cache WHERE question_hash = ?"
        ).get(questionHash);
        
        if (cachedTikuAnswer) {
          log(`✓ 找到缓存答案，来源: ${cachedTikuAnswer.source}`);
        } else {
          log("✗ 未找到缓存答案");
        }
      } catch (e) {
        log(`查询缓存失败: ${e.message}`);
      }

      // 题库查询逻辑：根据缓存来源决定是否跳过题库海查询
      let tikuResult;
      let tikuHasAnswer = false;
      
      // 如果缓存存在且来源是题库海，跳过题库海查询，使用缓存答案
      if (cachedTikuAnswer && cachedTikuAnswer.source === 'tiku') {
        log("✓ 缓存来源是题库海，跳过题库海查询");
        
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
        log("━━━ 查询题库海 ━━━");
        tikuResult = await fetchAnswer(questionData);
        tikuHasAnswer = tikuResult.code === 200 &&
                            tikuResult.data &&
                            tikuResult.data.answer &&
                            (Array.isArray(tikuResult.data.answer) ? tikuResult.data.answer.length > 0 : true);

        log(`题库海结果: ${tikuHasAnswer ? "✓ 有答案" : `✗ ${tikuResult.msg || '无答案'}`}`);
      }

      // 如果题库海无答案，尝试言溪题库（不受缓存影响）
      if (!tikuHasAnswer) {
        log("━━━ 题库海无答案，尝试言溪题库 ━━━");
        tikuResult = await fetchYanxi(questionData);
        tikuHasAnswer = tikuResult.code === 200 &&
                        tikuResult.data &&
                        tikuResult.data.answer &&
                        (Array.isArray(tikuResult.data.answer) ? tikuResult.data.answer.length > 0 : true);
        log(`言溪题库结果: ${tikuHasAnswer ? "✓ 有答案" : `✗ ${tikuResult.msg || '无答案'}`}`);
      }

      // AI 查询（并行）
      const aiResult = await fetchVerifyFirstAI(questionData);

      const aiHasAnswer = aiResult.code === 200 &&
                          aiResult.data &&
                          aiResult.data.answer &&
                          (Array.isArray(aiResult.data.answer) ? aiResult.data.answer.length > 0 : true);

      log(`AI结果: ${aiHasAnswer ? "✓ 有答案" : "✗ 无答案"}`);

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
          log("✓ 答案一致，使用题库答案");
          answerData = tikuResult;
          answerData.msg = "答案校验一致(题库)";
          
          // 无论缓存是否存在，都要更新 is_correct=1
          const existingCache = await db.prepare(
            "SELECT answer FROM answer_cache WHERE question_hash = ?"
          ).get(questionHash);
          
          if (!existingCache) {
            log("✓ 缓存不存在，保存题库答案（标记为已验证正确）");
            await saveAnswerToCache(
              questionHash,
              questionData.question,
              questionData.options,
              questionData.type,
              answerData.data.answer,
              answerData.data.source || 'tiku',
              1  // is_correct=1：题库和AI答案一致，标记为正确
            );
            log("✓ 题库答案已缓存（is_correct=1）");
          } else {
            log("✓ 缓存已存在，比较答案是否一致");
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
              log("✓ 缓存答案和校验答案完全一样（标准化后），只更新 is_correct=1");
              await db.prepare(
                "UPDATE answer_cache SET is_correct = 1 WHERE question_hash = ?"
              ).run(questionHash);
              log("✓ 已更新 is_correct=1");
            } else {
              log("⚠ 缓存答案和校验答案不一样，准备覆盖缓存答案");
              log(`  缓存答案: ${JSON.stringify(cachedAnswerArr)}`);
              log(`  校验答案: ${JSON.stringify(currentAnswer)}`);
              
              // 覆盖前校验答案格式
              const validation = validateAnswer(questionData.type, currentAnswer, questionData.options);
              if (!validation.valid) {
                log(`✗ 校验答案格式错误: ${validation.reason}，跳过覆盖`);
              } else {
                log("✓ 校验答案格式正确，执行覆盖");
                await db.prepare(
                  "UPDATE answer_cache SET answer = ?, source = ?, is_correct = 1 WHERE question_hash = ?"
                ).run(JSON.stringify(currentAnswer), answerData.data.source || 'tiku', questionHash);
                log("✓ 已覆盖缓存答案并设置 is_correct=1");
              }
            }
          }
        } else {
          log("✗ 答案不一致，需要深度思考");
          log(`题库答案: ${JSON.stringify(tikuResult.data.answer)}`);
          log(`AI答案(非思维): ${JSON.stringify(aiResult.data.answer)}`);
          needThinking = true;
          thinkingReason = '题库和AI答案不一致';
          fallbackAnswer = aiResult;  // 回退使用AI答案
        }
      } else if (tikuHasAnswer) {
        log("✗ 仅题库有答案，AI无答案，需要深度思考");
        needThinking = true;
        thinkingReason = 'AI无答案，需深度思考确认';
        fallbackAnswer = tikuResult;  // 回退使用题库答案
      } else if (aiHasAnswer) {
        log("✗ 仅AI有答案，题库无答案，需要深度思考");
        needThinking = true;
        thinkingReason = '题库无答案，需深度思考确认';
        fallbackAnswer = aiResult;  // 回退使用AI答案
      } else {
        log("✗ 题库和AI均无答案，尝试深度思考");
        needThinking = true;
        thinkingReason = '题库和AI均无答案，尝试深度思考';
        fallbackAnswer = null;  // 无回退答案
      }

      // 如果需要深度思考
      if (needThinking) {
        // 如果是检测模式（checkOnly=true），返回202通知客户端
        if (checkOnly) {
          log("━━━ 检测模式：返回202状态码，通知客户端启动思维模式 ━━━");
          return c.json({
            code: 202,
            status: "thinking",
            msg: thinkingReason,
            data: {
              needThinking: true,
              tikuAnswer: tikuHasAnswer ? tikuResult.data.answer : null,
              aiAnswer: aiHasAnswer ? aiResult.data.answer : null,
              reason: thinkingReason,
              thinkingModel: getDisplayName('deepseek-v4-pro')
            }
          });
        }

        // 直接查询思维模式AI
        log("━━━ 启动深度思考模式 ━━━");
        
        log("深度思考请求参数:");
        log(`题目: ${questionData.question}`);
        log(`题型: ${questionData.type}`);
        log(`选项: ${JSON.stringify(questionData.options)}`);
        
        log("━━━━━━━━━ 发送深度思考请求 ━━━━━━━━━");
        const aiResultThinking = await fetchDeepSeekThinking(questionData);
        
        log("━━━━━━━━━ 收到深度思考响应 ━━━━━━━━━");
        log(`完整响应JSON: ${JSON.stringify(aiResultThinking, null, 2)}`);
        log(`思维模式AI返回: code=${aiResultThinking.code}, msg=${aiResultThinking.msg || ''}`);
        
        if (aiResultThinking.data) {
          log(`思维模式AI答案: ${JSON.stringify(aiResultThinking.data.answer)}`);
          log(`思维模式AI来源: ${aiResultThinking.data.source || 'unknown'}`);
        } else {
          log("✗ 思维模式AI返回data为空");
        }

        if (aiResultThinking.code === 200 && aiResultThinking.data && aiResultThinking.data.answer) {
          log(`✓ 思维模式AI答案: ${JSON.stringify(aiResultThinking.data.answer)}`);
          answerData = aiResultThinking;
          answerData.msg = thinkingReason + "(思维模式AI)";
          answerData.data.thinkingUsed = true;
          answerData.data.thinkingReason = thinkingReason;

          // 检查缓存是否存在，不存在才缓存（避免覆盖已有答案）
          const existingCache = await db.prepare(
            "SELECT answer FROM answer_cache WHERE question_hash = ?"
          ).get(questionHash);
          
          if (!existingCache) {
            log("✓ 缓存不存在，保存深度思考答案");
            await saveAnswerToCache(
              questionHash,
              questionData.question,
              questionData.options,
              questionData.type,
              answerData.data.answer,
              answerData.data.source
            );
            log("✓ 深度思考答案已缓存");
          } else {
            log("✓ 缓存已存在，不覆盖原有答案");
          }
        } else {
          log("✗ 思维模式AI请求失败");
          if (fallbackAnswer) {
            log("使用回退答案");
            answerData = fallbackAnswer;
            answerData.msg = thinkingReason + "(回退答案)";
          } else {
            answerData = { code: 404, msg: "深度思考失败且无可用答案", data: { answer: [], num: remainingCount } };
          }
        }
      }
    }
  } else {
    log("✗ 校验模式需要配置DEEPSEEK_API_KEY");
    return c.json({
      code: 500,
      msg: "校验模式需要配置DEEPSEEK_API_KEY",
      data: { answer: [], num: remainingCount }
    }, 500);
  }

  // 统一覆盖为用户Token的剩余次数（避免返回题库或AI的num）
  if (answerData && answerData.data) {
    answerData.data.num = remainingCount;
  }

  // ========== 先清洗答案，再校验（修复#号导致校验失败的问题） ==========
  // 清洗答案中的#号、正确答案标记等
  answerData = cleanAnswerData(answerData);

  // 最终校验：答案格式和选项匹配（仅对有答案的情况校验，使用清洗后的答案）
  if (answerData && answerData.data && answerData.data.answer && answerData.data.answer.length > 0) {
    const validation = validateAnswer(questionData.type, answerData.data.answer, questionData.options);
    if (!validation.valid) {
      log(`✗ 答案校验失败: ${validation.reason}`);
      return c.json({
        code: 422,
        msg: `答案校验失败: ${validation.reason}`,
        data: { answer: [], num: remainingCount }
      }, 422);
    }
  }

  return c.json(answerData);
}

module.exports = {
  handleVerifyMode,
  fetchDeepSeekThinking,
  callAIWithTools,
  executeWebSearch
};