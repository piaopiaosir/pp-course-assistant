/**
 * 正常模式处理模块
 * 功能：先题库后AI，支持缓存机制
 * 
 * 包含：
 * - handleNormalMode: 路由处理函数
 * - fetchAISupplement: 正常模式AI补充（含深度思考备用）
 */

const { fetchAnswer, fetchYanxi, fetchHiveNet, fetchUcuc, getCachedAnswer, incrementCacheHits, incrementTotalQueries, saveAnswerToCacheAsync, checkAnswerReasonable, safeCheckAnswerReasonable, cleanAndNormalizeAnswer, incrementAIStats, getTypeDescription, buildPrompt, extractJsonFromContent, cleanAiAnswer, normalizeMatchingAnswer, cleanAnswerData } = require('../tiku');
const { validateAndCleanAnswer, callAIApi, hasValidAnswer, buildUserContent } = require('../utils');
const { getEnv, SPONSOR_URL } = require('../config');
const { getModelConfig, getDisplayName } = require('../config/ai-models');

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
    console.log("[ERROR] 未配置 DEEPSEEK_API_KEY");
    return { code: 500, msg: "未配置 DEEPSEEK_API_KEY", data: null };
  }
  
  const typeDesc = getTypeDescription(questionData.type);
  const { system: systemPrompt, user: userPrompt, imageUrls } = buildPrompt(questionData, false);

  // 根据模型是否支持视觉选择消息格式
  const modelCfg = getModelConfig(AI_MODEL_NORMAL);
  const supportsVision = modelCfg?.supportsVision && imageUrls && imageUrls.length > 0;
  // D-07去重：构建用户消息content
  const userContent = buildUserContent(userPrompt, imageUrls, supportsVision);

  const body = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ],
    temperature: 0.6,
    thinking: { type: "disabled" }  // thinking disabled模式下支持temperature
  };
  
  console.log("========= AI请求日志（正常模式） =========");
  console.log("[INFO] 题目:", questionData.question);
  console.log("[INFO] 题型:", typeDesc);
  console.log("[INFO] 实际模型:", model);
  console.log("[INFO] API平台:", apiName);
  console.log("[INFO] Prompt长度:", systemPrompt.length + userPrompt.length, "字符");
  if (imageUrls && imageUrls.length > 0) {
    console.log("[INFO] 图片URL:", imageUrls.join(', '));
    console.log("[INFO] 多模态:", supportsVision ? "已启用" : "未启用(模型不支持视觉)");
  }
  
  // 变量前置声明（避免 TDZ 错误：catch 块需要访问 token 统计变量）
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  try {
    console.log("AI查询中...");
    
    // 增加AI调用次数统计（D-01去重：使用统一统计函数）
    await incrementAIStats(model);
    
    const { result } = await callAIApi({ apiUrl, apiKey: useApiKey, body });
    
    // token统计
    totalPromptTokens = result.usage?.prompt_tokens || 0;
    totalCompletionTokens = result.usage?.completion_tokens || 0;
    if (result.usage) {
      console.log(`[STAT] token统计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
    }
    
    console.log("========= AI响应日志（正常模式） =========");
    console.log("[INFO] 响应数据:", JSON.stringify(result).substring(0, 200));
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      const content = result.choices[0].message.content;
      
      const parsed = extractJsonFromContent(content);
      if (parsed) {
          // D-06去重：清洗答案并标准化格式
          parsed.answer = cleanAndNormalizeAnswer(parsed.answer, questionData);
          console.log("[OK] AI解析成功:", JSON.stringify(parsed.answer));
        
        // 检查答案是否合理（D-03去重：使用安全包装版）
        const checkResult = safeCheckAnswerReasonable(parsed.answer, questionData.type, questionData.options);
        
        if (!checkResult.reasonable) {
          // 答案不合理，启用深度思考重新查询
          console.log(`[WARN] 答案异常: ${checkResult.reason}`);
          console.log(`=== 启用深度思考重新查询 ===`);
          
          // 构建深度思考请求
          const thinkingBody = {
            model: AI_MODEL_NORMAL_THINKING,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ],
            reasoning_effort: "high",
            thinking: { type: "enabled" }
          };
          
          try {
            // 增加深度思考模型调用次数统计（D-01去重：使用统一统计函数，深度思考也是一次AI调用）
            await incrementAIStats(AI_MODEL_NORMAL_THINKING);
            console.log("深度思考查询中...");
            
            const { result: thinkingResult } = await callAIApi({ apiUrl: "https://api.deepseek.com/v1/chat/completions", apiKey: useApiKey, body: thinkingBody });
            
            // 累加深度思考token
            if (thinkingResult.usage) {
              totalPromptTokens += thinkingResult.usage.prompt_tokens || 0;
              totalCompletionTokens += thinkingResult.usage.completion_tokens || 0;
              console.log(`[STAT] 深度思考token: 输入=${thinkingResult.usage.prompt_tokens || 0}, 输出=${thinkingResult.usage.completion_tokens || 0}`);
            }
            
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
                  console.log("[OK] 深度思考答案:", JSON.stringify(thinkingParsed.answer));
                  // 检查深度思考答案是否合理
                  const thinkingCheckResult = checkAnswerReasonable(thinkingParsed.answer, questionData.type, questionData.options);

                  if (!thinkingCheckResult.reasonable) {
                    // 深度思考答案也不合理，返回错误
                    console.log(`[WARN] 深度思考答案异常: ${thinkingCheckResult.reason}`);
                    console.log("[X] 深度思考答案校验失败");
                    console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
                    console.log("==========================");
                    return {
                      code: 500,
                      msg: `AI答案不合理(深度思考:${thinkingCheckResult.reason})`,
                      data: null
                    };
                  }

                  // 深度思考答案合理，返回
                  console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
                  console.log("==========================");
                  return {
                    code: 200,
                    data: { answer: thinkingParsed.answer, source: getDisplayName(AI_MODEL_NORMAL_THINKING) },
                    msg: "未命中缓存"
                  };
              }
            }

            console.log("[X] 深度思考解析失败，使用原答案");
          } catch (thinkingError) {
            console.log("[X] 深度思考请求失败:", thinkingError.message);
          }
        }
        
        console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
        console.log("==========================");
        
        return {
          code: 200,
          data: { answer: parsed.answer, source: getDisplayName(model) },
          msg: "未命中缓存",
          tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens },
          modelId: model
        };
      }
    }
    
    console.log("[ERROR] AI解析失败: 响应中未找到有效答案");
    console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens}`);
    console.log("==========================");
    
    return { code: 500, msg: "AI解析失败", data: null, tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens }, modelId: model };
    
  } catch (e) {
    console.error("[ERROR] AI查询失败:", e.message);
    console.log(`[STAT] 本次AI调用token总计: 输入=${totalPromptTokens}, 输出=${totalCompletionTokens} (异常)`);
    console.log("==========================");
    
    return {
      code: 500,
      msg: `AI查询失败: ${e.message}`,
      data: null,
      tokenUsage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens },
      modelId: model
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
 * @param {Function} params.lockToken - 预锁定次数函数
 * @param {Function} params.settleToken - 结算次数函数
 * @param {Function} params.releaseToken - 释放锁定函数
 */
async function handleNormalMode(c, params) {
  const {
    token,
    userId,
    questionData,
    questionHash,
    hunyuanApiKey,
    log,
    lockToken,
    settleToken,
    releaseToken,
    skipUserIdCheck
  } = params;

  // limitedMode 用 let 声明，预锁定失败时可回退为受限模式
  let limitedMode = params.limitedMode;

  log("=== 正常模式（先题库后AI） ===");
  if (limitedMode) {
    log("[WARN] 受限模式：仅查询缓存");
  }

  // 预锁定1次，确保余额充足后再查询
  let prelocked = false;
  if (!limitedMode) {
    const lockResult = await lockToken(token, 1);
    if (!lockResult.success) {
      log(`[X] 预锁定失败: ${lockResult.message}，回退到受限模式（仅查询缓存）`);
      limitedMode = true;
    } else {
      prelocked = true;
      log(`预锁定1次成功，锁定后余额: ${lockResult.remainingCount}`);
    }
  }

  log("=== 开始查询缓存 ===");
  const cachedAnswer = await getCachedAnswer(questionHash);
  if (cachedAnswer) {
    log("[OK] 缓存命中！");

    // 缓存答案校验（防止历史脏数据）
    // 先校验后扣费：避免校验失败导致用户被扣 0.8 次后又走正常查询再扣 1 次（共 1.8 次）
    const cachedAnswerArr = JSON.parse(cachedAnswer.answer);
    const cacheValidation = validateAndCleanAnswer(questionData.type, cachedAnswerArr, questionData.options);
    if (!cacheValidation.valid) {
      log(`[X] 缓存答案校验失败: ${cacheValidation.reason}，跳过缓存继续查询`);
    } else {
      // 校验通过，统计缓存命中
      incrementCacheHits();
      incrementTotalQueries('cache');

      // 受限模式不扣除次数
      let remainingCount = 999999;
      let actualCost = 0;  // 实际消耗次数
      if (!limitedMode) {
        // 预锁定已扣1次，缓存命中按0.8次结算（退0.2次）
        const cacheCost = 0.8;
        const settleResult = await settleToken(token, 1, cacheCost);
        if (settleResult.success) {
          remainingCount = settleResult.remainingCount;
          actualCost = cacheCost;
          log(`结算次数: ${cacheCost}（缓存命中，预锁定1次退0.2次），剩余: ${remainingCount}`);
        } else {
          // 结算失败（极端情况），释放锁定
          await releaseToken(token, 1);
          return c.json({
            code: 403,
            msg: settleResult.message || '结算失败',
            data: { num: 0, answer: [], sponsorUrl: SPONSOR_URL }
          }, 403);
        }
      }

      if (!limitedMode) {
        log(`剩余次数: ${remainingCount}`);
      }
      log("=== 查询完成（缓存） ===");

      // 受限模式不返回消耗次数
      return c.json({
        code: 200,
        msg: '缓存命中',
        data: {
          answer: cacheValidation.answers,
          source: "cache",
          num: limitedMode ? "免费题库中" : remainingCount,
          cost: limitedMode ? undefined : actualCost
        }
      });
    }
  }
  log("[X] 缓存未命中或校验失败");

  // 受限模式下：缓存未命中，直接返回无答案
  if (limitedMode) {
    log("[WARN] 受限模式：缓存未命中");
    return c.json({
      code: 403,
      msg: '免费题库：无答案，飘飘全能答题模型：有答案',
      data: { limitedMode: true, answer: [], num: 0, sponsorUrl: SPONSOR_URL }
    }, 403);
  }

  log("开始查询题库/AI");

  let answerData;
  let remainingCount = 999999;
  let hasAnswer = false;

  // 排序题（type=13）直接跳过题库，使用AI补充
  if (questionData.type === "13") {
    log("[SKIP] 排序题直接使用AI补充（跳过题库）");
    if (hunyuanApiKey) {
      log("=== 查询 AI ===");
      const aiResult = await fetchAISupplement(questionData);

    if (aiResult.code === 200 && aiResult.data && aiResult.data.answer) {
      log("[OK] AI 返回成功");
        hasAnswer = true;
        answerData = aiResult;
        answerData.data.source = answerData.data.source || "ai";

        // 排序题不缓存
        log("[WARN] 排序题答案不保存缓存");

        log("=== 查询完成 ===");

        // 预锁定已扣1次，排序题按1次结算（无需调整）
        let actualCost = 0;  // 实际消耗次数
        if (prelocked) {
          const normalCost = 1;
          const settleResult = await settleToken(token, 1, normalCost);
          if (settleResult.success) {
            remainingCount = settleResult.remainingCount;
            actualCost = normalCost;
            log(`结算次数: ${normalCost}，剩余: ${remainingCount}`);
          } else {
            await releaseToken(token, 1);
          }
        }

        if (answerData.data) {
          answerData.data.num = remainingCount;
        }

        // 添加消耗信息到 data.cost，msg 改成"未命中缓存"
        if (answerData.code === 200) {
          answerData.msg = '未命中缓存';
          if (answerData.data) {
            answerData.data.cost = actualCost;
          }
        }

        // AI来源的source转为"ai"供客户端显示
        if (answerData.data && answerData.data.source) {
          const nonAiSources = ['cache', 'tiku', 'hivenet', 'yanxi', 'ucuc'];
          if (!nonAiSources.includes(answerData.data.source)) {
            answerData.data.source = "ai";
          }
        }

        // ========== 先清洗答案，再校验（修复#号导致校验失败的问题） ==========
        answerData = cleanAnswerData(answerData);

        // 最终校验：答案格式和选项匹配（使用清洗后的答案）
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

        return c.json(answerData);
      } else {
        log("[X] AI 返回失败");
        answerData = {
          code: 404,
          msg: "排序题AI补充失败",
          data: { answer: [], num: remainingCount }
        };
        return c.json(cleanAnswerData(answerData));
      }
    } else {
      log("[X] 未配置AI API密钥，无法处理排序题");
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
  // Hive-Net 仅支持单选(0)和多选(1)
  const hivenetSupportedTypes = ["0", "1"];
  const skipHiveNetByType = !hivenetSupportedTypes.includes(questionData.type);

  // 策略：Hive-Net → UCUC → 言溪 → 题库海 → AI
  if (!skipHiveNet && !skipHiveNetByType) {
    log("=== 1. 查询 Hive-Net ===");
    const hiveNetResult = await fetchHiveNet(questionData);

    hasAnswer = hasValidAnswer(hiveNetResult);

    if (hasAnswer) {
      log("[OK] Hive-Net 有答案");
      answerData = hiveNetResult;
      answerData.data.source = answerData.data.source || "hivenet";
    } else {
      log(`[X] Hive-Net 无答案：${hiveNetResult.msg || '未找到'}`);
    }
  } else {
    log(skipHiveNetByType 
      ? `[SKIP] Hive-Net 不支持题型${questionData.type}，跳过` 
      : "[SKIP] Hive-Net 已禁用（SKIP_HIVENET=true），直接使用UCUC题库");
  }

  if (!hasAnswer) {
    // UCUC 题库支持：单选题(0)、多选题(1)、填空题(2)、判断题(3)、简答题(4)
    const ucucSupportedTypes = ["0", "1", "2", "3", "4"];
    if (ucucSupportedTypes.includes(questionData.type)) {
      log("=== 2. 查询 UCUC 题库 ===");
      const ucucResult = await fetchUcuc(questionData);

      hasAnswer = hasValidAnswer(ucucResult);

      if (hasAnswer) {
        log("[OK] UCUC 题库 有答案");
        answerData = ucucResult;
        answerData.data.source = answerData.data.source || "ucuc";
      } else {
        log(`[X] UCUC 题库 无答案：${ucucResult.msg || '未找到'}`);
      }
    } else {
      log(`[SKIP] 题型 "${questionData.type}" 不在 UCUC 支持范围内，跳过 UCUC 题库`);
    }
  }

  if (!hasAnswer) {
    log("=== 3. 查询 言溪题库 ===");
    const yanxiResult = await fetchYanxi(questionData);

    hasAnswer = hasValidAnswer(yanxiResult);

    if (hasAnswer) {
      log("[OK] 言溪题库 有答案");
      answerData = yanxiResult;
      answerData.data.source = answerData.data.source || "yanxi";
    } else {
      log(`[X] 言溪题库 无答案：${yanxiResult.msg || '未找到'}`);
    }
  }

  if (!hasAnswer) {
    log("=== 4. 查询 题库海 ===");
    const tikuResult = await fetchAnswer(questionData);

    hasAnswer = hasValidAnswer(tikuResult);

    if (hasAnswer) {
      log("[OK] 题库海 有答案");
      answerData = tikuResult;
      answerData.data.source = "tiku";  // 题库来源统一为 tiku
    } else {
      log(`[X] 题库海 无答案：${tikuResult.msg || '未找到'}`);
    }
  }

  // AI补充：检查是否配置了 DeepSeek API Key
  if (!hasAnswer && getEnv('DEEPSEEK_API_KEY')) {
    log("=== 5. 查询 AI ===");
    const aiResult = await fetchAISupplement(questionData);

    if (aiResult.code === 200 && aiResult.data && aiResult.data.answer) {
      log("[OK] AI 补充成功");
      hasAnswer = true;
      answerData = aiResult;
      answerData.data.source = answerData.data.source || "ai";
    } else {
      log("[X] AI 补充失败");
    }
  }

  const finalHasAnswer = hasAnswer && answerData && answerData.data && answerData.data.answer;

  if (finalHasAnswer) {
    // ========== 一条线：清洗 → 校验 → 存缓存 + 返回 ==========
    // 清洗答案（去除#号、引号、正确答案标记等）
    answerData = cleanAnswerData(answerData);
    
    // 校验答案格式和选项匹配
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

    log("[OK] 答案校验通过，保存缓存");
    saveAnswerToCacheAsync(
      questionHash,
      questionData.question,
      questionData.options,
      questionData.type,
      answerData.data.answer,
      answerData.data.source || 'tiku'
    );
    log("[OK] 缓存处理完成");

    // AI来源的source存缓存时是具体模型名，但客户端需要"ai"来显示AI提示
    if (answerData.data.source && answerData.data.source !== 'cache' && 
        answerData.data.source !== 'tiku' && answerData.data.source !== 'hivenet' && 
        answerData.data.source !== 'yanxi' && answerData.data.source !== 'ucuc') {
      answerData.data.source = "ai";
    }

    log("=== 查询完成 ===");

    // 预锁定已扣1次，正常查询按1次结算（无需调整）
    let actualCost = 0;  // 实际消耗次数
    if (prelocked) {
      const normalCost = 1;
      const settleResult = await settleToken(token, 1, normalCost);
      if (settleResult.success) {
        remainingCount = settleResult.remainingCount;
        actualCost = normalCost;
        log(`结算次数: ${normalCost}，剩余: ${remainingCount}`);
      } else {
        await releaseToken(token, 1);
      }
    }

    // 设置剩余次数和消耗信息
    if (answerData.data) {
      answerData.data.num = remainingCount;
    }

    // 添加消耗信息到 data.cost，msg 改成"未命中缓存"
    if (answerData.code === 200) {
      answerData.msg = '未命中缓存';
      if (answerData.data) {
        answerData.data.cost = actualCost;
      }
    }

    return c.json(answerData);
  } else {
    log("[X] 所有来源均无答案");
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