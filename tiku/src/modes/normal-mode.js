/**
 * 正常模式处理模块
 * 功能：先题库后AI，支持缓存机制
 * 
 * 包含：
 * - handleNormalMode: 路由处理函数
 * - fetchAISupplement: 正常模式AI补充（含深度思考备用）
 */

const { fetchAnswer, fetchYanxi, fetchHiveNet, fetchUcuc, getCachedAnswer, incrementCacheHits, incrementTotalQueries, saveAnswerToCache, checkAnswerReasonable, incrementAiCalls, incrementModelCalls, getTypeDescription, buildPrompt, extractJsonFromContent, cleanAiAnswer, normalizeMatchingAnswer, cleanAnswerData } = require('../tiku');
const { validateAnswer, stripPunctuation } = require('../utils');
const { getEnv, SPONSOR_URL } = require('../config');
const { MODEL_COLUMN_MAP } = require('../config/ai-models');

// ==================== 正常模式 AI 补充 ====================

/**
 * 请求 AI API（正常模式AI补充）
 * 仅支持 DeepSeek V4（官方 API）
 * 
 * @param {Object} questionData - 题目数据
 * @returns {Object} { code, msg, data: { answer, source } }
 */
async function fetchAISupplement(questionData) {
  // 模型配置：正常模式使用 DeepSeek-V4-Flash
  const AI_MODEL_NORMAL = getEnv('AI_MODEL_NORMAL', 'deepseek-v4-flash');
  // 深度思考备用（当第一次答案不合理时启用thinking重新查询）
  const AI_MODEL_NORMAL_THINKING = getEnv('AI_MODEL_NORMAL_THINKING', 'deepseek-v4-flash');

  const model = AI_MODEL_NORMAL;
  const apiUrl = "https://api.deepseek.com/v1/chat/completions";
  const useApiKey = getEnv('DEEPSEEK_API_KEY');
  const apiName = "DeepSeek官方";
  
  if (!useApiKey) {
    console.log("❌ 未配置 DEEPSEEK_API_KEY");
    return { code: 500, msg: "未配置 DEEPSEEK_API_KEY", data: null };
  }
  
  const typeDesc = getTypeDescription(questionData.type);
  const { system: systemPrompt, user: userPrompt } = buildPrompt(questionData, false);

  const body = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.6,
    max_tokens: 8192,
    thinking: { type: "disabled" }  // thinking disabled模式下支持temperature
  };
  
  console.log("━━━━━━━━━ AI请求日志（正常模式） ━━━━━━━━━");
  console.log("📍 题目:", questionData.question);
  console.log("📍 题型:", typeDesc);
  console.log("📍 实际模型:", model);
  console.log("📍 API平台:", apiName);
  console.log("📍 Prompt长度:", systemPrompt.length + userPrompt.length, "字符");
  
  try {
    console.log("AI查询中...");
    
    // 增加AI调用次数统计
    await incrementAiCalls();
    await incrementTotalQueries('ai');
    
    // 按模型统一统计
    const modelColumn = MODEL_COLUMN_MAP[model];
    if (modelColumn) {
      await incrementModelCalls(modelColumn);
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useApiKey}`
      },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    console.log("━━━━━━━━━ AI响应日志（正常模式） ━━━━━━━━━");
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
        
        // 检查答案是否合理
        let checkResult;
        try {
          checkResult = checkAnswerReasonable(parsed.answer, questionData.type, questionData.options);
        } catch (e) {
          console.log('⚠️ checkAnswerReasonable异常:', e.message);
          checkResult = { reasonable: true, reason: '' };
        }
        
        if (!checkResult.reasonable) {
          // 答案不合理，启用深度思考重新查询
          console.log(`⚠️ 答案异常: ${checkResult.reason}`);
          console.log(`━━━ 启用深度思考重新查询 ━━━`);
          
          // 构建深度思考请求
          const thinkingBody = {
            model: AI_MODEL_NORMAL_THINKING,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            max_tokens: 8192,
            reasoning_effort: "high",
            thinking: { type: "enabled" }
          };
          
          try {
            // 增加深度思考模型调用次数统计
            const thinkingModelColumn = MODEL_COLUMN_MAP[AI_MODEL_NORMAL_THINKING];
            if (thinkingModelColumn) {
              await incrementModelCalls(thinkingModelColumn);
            }
            console.log("深度思考查询中...");
            
            const thinkingResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${useApiKey}`
              },
              body: JSON.stringify(thinkingBody)
            });
            
            const thinkingResult = await thinkingResponse.json();
            
            if (thinkingResult.choices && thinkingResult.choices[0] && thinkingResult.choices[0].message) {
              const thinkingContent = thinkingResult.choices[0].message.content;
              const thinkingParsed = extractJsonFromContent(thinkingContent);
              
              if (thinkingParsed) {
                  // 清理答案中的"选项X"前缀（安全模式：仅当去掉前缀后匹配选项时才删除）
                  if (Array.isArray(thinkingParsed.answer)) {
                    thinkingParsed.answer = thinkingParsed.answer.map(a => cleanAiAnswer(a, questionData.options));
                  }
                  // 连线题：标准化答案格式（拆分合并字符串）
                  thinkingParsed.answer = normalizeMatchingAnswer(thinkingParsed.answer, questionData.type);
                  console.log("✅ 深度思考答案:", JSON.stringify(thinkingParsed.answer));
                  // 检查深度思考答案是否合理
                  const thinkingCheckResult = checkAnswerReasonable(thinkingParsed.answer, questionData.type, questionData.options);

                  if (!thinkingCheckResult.reasonable) {
                    // 深度思考答案也不合理，返回错误
                    console.log(`⚠️ 深度思考答案异常: ${thinkingCheckResult.reason}`);
                    console.log("✗ 深度思考答案校验失败");
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    return {
                      code: 500,
                      msg: `AI答案校验失败(深度思考:${thinkingCheckResult.reason})`,
                      data: null
                    };
                  }

                  // 深度思考答案合理，返回
                  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
                  return {
                    code: 200,
                    data: { answer: thinkingParsed.answer, source: "DeepSeek-V4-Flash-thinking" },
                    msg: "查询成功"
                  };
              }
            }

            console.log("✗ 深度思考解析失败，使用原答案");
          } catch (thinkingError) {
            console.log("✗ 深度思考请求失败:", thinkingError.message);
          }
        }
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        return {
          code: 200,
          data: { answer: parsed.answer, source: "DeepSeek-V4-Flash" },
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

// ==================== 路由处理函数 ====================

/**
 * 正常模式路由处理函数
 * @param {Object} c - Hono context
 * @param {Object} params - 请求参数
 * @param {string} params.token - 用户token
 * @param {string} params.userId - 用户ID
 * @param {Object} params.questionData - 题目数据
 * @param {Object} params.checkResult - 校验结果
 * @param {string} params.hunyuanApiKey - TokenHub API密钥
 * @param {Function} params.log - 日志函数
 * @param {boolean} params.FREE_MODE - 免费模式
 * @param {Function} params.decrementCount - 扣除次数函数
 */
async function handleNormalMode(c, params) {
  const {
    token,
    userId,
    questionData,
    questionHash,
    hunyuanApiKey,
    log,
    FREE_MODE,
    limitedMode,
    decrementCount,
    skipUserIdCheck
  } = params;

  log("━━━ 正常模式（先题库后AI） ━━━");
  if (limitedMode) {
    log("⚠️ 受限模式：仅查询缓存");
  }

  log("━━━ 开始查询缓存 ━━━");
  const cachedAnswer = await getCachedAnswer(questionHash);
  if (cachedAnswer) {
    log("✓ 缓存命中！");

    // 统计缓存命中
    incrementCacheHits();
    incrementTotalQueries('cache');

    // 受限模式或免费模式不扣除次数
    let remainingCount = 999999;
    if (!FREE_MODE && !limitedMode) {
      const decrementResult = await decrementCount(token, userId, skipUserIdCheck);
      if (!decrementResult.success) {
        return c.json({
          code: 403,
          msg: decrementResult.message,
          data: { num: decrementResult.remainingCount, answer: [], sponsorUrl: SPONSOR_URL }
        }, 403);
      }
      remainingCount = decrementResult.remainingCount;
      log("扣除次数: 1（缓存命中）");
    }

    if (!limitedMode) {
      log(`剩余次数: ${remainingCount}`);
    }
    log("━━━ 查询完成（缓存） ━━━");

    // 缓存答案校验（防止历史脏数据）
    const cachedAnswerArr = JSON.parse(cachedAnswer.answer);
    const cacheValidation = validateAnswer(questionData.type, cachedAnswerArr, questionData.options);
    if (!cacheValidation.valid) {
      log(`✗ 缓存答案校验失败: ${cacheValidation.reason}，跳过缓存继续查询`);
    } else {
      return c.json({
        code: 200,
        msg: "查询成功-缓存命中",
        data: {
          answer: cachedAnswerArr,
          source: "cache",
          num: limitedMode ? "免费题库中" : remainingCount
        }
      });
    }
  }
  log("✗ 缓存未命中或校验失败");

  // 受限模式下：缓存未命中，直接返回无答案
  if (limitedMode) {
    log("⚠️ 受限模式：缓存未命中");
    return c.json({
      code: 403,
      msg: '免费题库：无答案<br>飘飘全能答题模型：有答案',
      data: { limitedMode: true, answer: [], num: 0 }
    }, 403);
  }

  log("开始查询题库/AI");

  let answerData;
  let remainingCount = 999999;
  let hasAnswer = false;

  // 排序题（type=13）直接跳过题库，使用AI补充
  if (questionData.type === "13") {
    log("⏭️ 排序题直接使用AI补充（跳过题库）");
    if (hunyuanApiKey) {
      log("━━━ 查询 AI ━━━");
const aiResult = await fetchAISupplement(questionData);

    if (aiResult.code === 200 && aiResult.data && aiResult.data.answer) {
      log("✓ AI 返回成功");
        hasAnswer = true;
        answerData = aiResult;
        answerData.data.source = answerData.data.source || "ai";

        // 排序题不缓存
        log("⚠️ 排序题答案不保存缓存");

        log("━━━ 查询完成 ━━━");

        // 免费模式不扣除次数
        if (!FREE_MODE) {
          log("扣除次数: 1");
          const decrementResult = await decrementCount(token, userId, skipUserIdCheck);
          if (!decrementResult.success) {
            return c.json({
              code: 403,
              msg: decrementResult.message,
              data: { num: remainingCount, answer: [], sponsorUrl: SPONSOR_URL }
            }, 403);
          }
          remainingCount = decrementResult.remainingCount;
          log(`剩余次数: ${remainingCount}`);
        } else {
          log("免费模式: 不扣除次数");
        }

        if (answerData.data) {
          answerData.data.num = remainingCount;
        }

        // ========== 先清洗答案，再校验（修复#号导致校验失败的问题） ==========
        answerData = cleanAnswerData(answerData);

        // 最终校验：答案格式和选项匹配（使用清洗后的答案）
        let validation = validateAnswer(questionData.type, answerData.data.answer, questionData.options);
        if (!validation.valid) {
          // 第二阶段：去除标点符号后重试
          const fixed = retryWithStrippedPunctuation(questionData, answerData.data.answer);
          if (fixed) {
            answerData.data.answer = fixed;
            validation = validateAnswer(questionData.type, answerData.data.answer, questionData.options);
          }
        }
        if (!validation.valid) {
          log(`✗ 答案校验失败: ${validation.reason}`);
          return c.json({
            code: 422,
            msg: `答案校验失败: ${validation.reason}`,
            data: { answer: [], num: remainingCount }
          }, 422);
        }

        return c.json(answerData);
      } else {
        log("✗ AI 返回失败");
        answerData = {
          code: 404,
          msg: "排序题AI补充失败",
          data: { answer: [], num: remainingCount }
        };
        return c.json(cleanAnswerData(answerData));
      }
    } else {
      log("✗ 未配置AI API密钥，无法处理排序题");
      answerData = {
        code: 404,
        msg: "排序题需要AI支持，但未配置API密钥",
        data: { answer: [], num: remainingCount }
      };
      return c.json(cleanAnswerData(answerData));
    }
  }

  // 检查是否跳过 Hive-Net
  const skipHiveNet = getEnv('SKIP_HIVENET', 'false') === 'true';

  // 策略：Hive-Net → UCUC → 言溪 → 题库海 → AI
  if (!skipHiveNet) {
    log("━━━ 1. 查询 Hive-Net ━━━");
    const hiveNetResult = await fetchHiveNet(questionData);

    hasAnswer = hiveNetResult.code === 200 &&
                hiveNetResult.data &&
                hiveNetResult.data.answer &&
                (Array.isArray(hiveNetResult.data.answer) ? hiveNetResult.data.answer.length > 0 : true);

    if (hasAnswer) {
      log("✓ Hive-Net 有答案");
      answerData = hiveNetResult;
      answerData.data.source = answerData.data.source || "hivenet";
    } else {
      log(`✗ Hive-Net 无答案：${hiveNetResult.msg || '未找到'}`);
    }
  } else {
    log("⏭️ Hive-Net 已禁用（SKIP_HIVENET=true），直接使用UCUC题库");
  }

  if (!hasAnswer) {
    // UCUC 题库支持：单选题(0)、多选题(1)、填空题(2)、判断题(3)、简答题(4)
    const ucucSupportedTypes = ["0", "1", "2", "3", "4"];
    if (ucucSupportedTypes.includes(questionData.type)) {
      log("━━━ 2. 查询 UCUC 题库 ━━━");
      const ucucResult = await fetchUcuc(questionData);

      hasAnswer = ucucResult.code === 200 &&
                  ucucResult.data &&
                  ucucResult.data.answer &&
                  (Array.isArray(ucucResult.data.answer) ? ucucResult.data.answer.length > 0 : true);

      if (hasAnswer) {
        log("✓ UCUC 题库 有答案");
        answerData = ucucResult;
        answerData.data.source = answerData.data.source || "ucuc";
      } else {
        log(`✗ UCUC 题库 无答案：${ucucResult.msg || '未找到'}`);
      }
    } else {
      log(`⏭️ 题型 "${questionData.type}" 不在 UCUC 支持范围内，跳过 UCUC 题库`);
    }
  }

  if (!hasAnswer) {
    log("━━━ 3. 查询 言溪题库 ━━━");
    const yanxiResult = await fetchYanxi(questionData);

    hasAnswer = yanxiResult.code === 200 &&
                yanxiResult.data &&
                yanxiResult.data.answer &&
                (Array.isArray(yanxiResult.data.answer) ? yanxiResult.data.answer.length > 0 : true);

    if (hasAnswer) {
      log("✓ 言溪题库 有答案");
      answerData = yanxiResult;
      answerData.data.source = answerData.data.source || "yanxi";
    } else {
      log(`✗ 言溪题库 无答案：${yanxiResult.msg || '未找到'}`);
    }
  }

  if (!hasAnswer) {
    log("━━━ 4. 查询 题库海 ━━━");
    const tikuResult = await fetchAnswer(questionData);

    hasAnswer = tikuResult.code === 200 &&
                tikuResult.data &&
                tikuResult.data.answer &&
                (Array.isArray(tikuResult.data.answer) ? tikuResult.data.answer.length > 0 : true);

    if (hasAnswer) {
      log("✓ 题库海 有答案");
      answerData = tikuResult;
      answerData.data.source = answerData.data.source || "tikuhai";
    } else {
      log(`✗ 题库海 无答案：${tikuResult.msg || '未找到'}`);
    }
  }

  // AI补充：只在配置了hunyuanApiKey（TokenHub）时才使用
  if (!hasAnswer && hunyuanApiKey) {
    log("━━━ 5. 查询 AI ━━━");
    const aiResult = await fetchAISupplement(questionData);

    if (aiResult.code === 200 && aiResult.data && aiResult.data.answer) {
      log("✓ AI 补充成功");
      hasAnswer = true;
      answerData = aiResult;
      answerData.data.source = answerData.data.source || "ai";
    } else {
      log("✗ AI 补充失败");
    }
  }

  const finalHasAnswer = hasAnswer && answerData && answerData.data && answerData.data.answer;

  if (finalHasAnswer) {
    // ========== 一条线：清洗 → 校验 → 存缓存 + 返回 ==========
    // 清洗答案（去除#号、引号、正确答案标记等）
    answerData = cleanAnswerData(answerData);
    
    // 校验答案格式和选项匹配
    let validation = validateAnswer(questionData.type, answerData.data.answer, questionData.options);
    if (!validation.valid) {
      // 第二阶段：去除标点符号后重试
      const fixed = retryWithStrippedPunctuation(questionData, answerData.data.answer);
      if (fixed) {
        answerData.data.answer = fixed;
        validation = validateAnswer(questionData.type, answerData.data.answer, questionData.options);
      }
    }
    if (!validation.valid) {
      log(`✗ 答案校验失败: ${validation.reason}`);
      return c.json({
        code: 422,
        msg: `答案校验失败: ${validation.reason}`,
        data: { answer: [], num: remainingCount }
      }, 422);
    }

    log("✓ 答案校验通过，保存缓存");
    await saveAnswerToCache(
      questionHash,
      questionData.question,
      questionData.options,
      questionData.type,
      answerData.data.answer,
      answerData.data.source || 'tiku'
    );
    log("✓ 缓存处理完成");

    log("━━━ 查询完成 ━━━");

    // 免费模式不扣除次数
    if (!FREE_MODE) {
      log("扣除次数: 1");
      const decrementResult = await decrementCount(token, userId, skipUserIdCheck);
      if (!decrementResult.success) {
        return c.json({
          code: 403,
          msg: decrementResult.message,
          data: { num: remainingCount, answer: [], sponsorUrl: SPONSOR_URL }
        }, 403);
      }
      remainingCount = decrementResult.remainingCount;
      log(`剩余次数: ${remainingCount}`);
    } else {
      log("免费模式: 不扣除次数");
    }

    // 设置剩余次数
    if (answerData.data) {
      answerData.data.num = remainingCount;
    }

    return c.json(answerData);
  } else {
    log("✗ 所有来源均无答案");
    answerData = {
      code: 404,
      msg: "未找到答案",
      data: { answer: [], num: remainingCount }
    };
    return c.json(cleanAnswerData(answerData));
  }
}

module.exports = {
  handleNormalMode,
  fetchAISupplement
};

// 去标点符号后重新匹配答案与选项
function retryWithStrippedPunctuation(questionData, answers) {
  if (!questionData.options || !answers || answers.length === 0) return null;
  
  const optionLines = Array.isArray(questionData.options)
    ? questionData.options
    : String(questionData.options).split('\n').filter(o => o.trim());
  
  const fixed = [];
  for (const ans of answers) {
    const ansText = String(ans).replace(/^[A-Za-z][.、)\s]+/, '').trim();
    const match = optionLines.find(opt => {
      const cleanOpt = String(opt).replace(/^[A-Za-z][.、)\s]+/, '').trim();
      return stripPunctuation(cleanOpt) === stripPunctuation(ansText);
    });
    if (match) {
      fixed.push(String(match).trim());
      console.log(`✓ 去标点匹配成功: "${ans}" -> "${String(match).trim()}"`);
    } else {
      return null; // 有答案匹配不上，放弃
    }
  }
  return fixed;
}