const { db } = require('../config');
const { normalizeAnswer, normalizeOptions, validateAnswer } = require('../utils');
const { normalizeQuestion, cleanSingleAnswer } = require('./helpers');

// 从缓存获取答案（哈希已包含排序选项，直接精确匹配即可）
async function getCachedAnswer(questionHash) {
  try {
    const cached = await db.prepare(
      "SELECT answer, source FROM answer_cache WHERE question_hash = ?"
    ).get(questionHash);

    if (cached) {
      console.log("缓存命中:", questionHash.substring(0, 8));
    }

    return cached;
  } catch (e) {
    console.error("查询缓存失败:", e.message);
    return null;
  }
}

// 保存答案到缓存
async function saveAnswerToCache(questionHash, question, options, type, answer, source, isCorrect = undefined) {
  const now = Math.floor(Date.now() / 1000);
  
  try {
    // ========== 先清洗答案，再校验（修复#号导致校验失败的问题） ==========
    let cleanedAnswer;
    if (Array.isArray(answer)) {
      cleanedAnswer = answer.map(cleanSingleAnswer);
    } else if (typeof answer === 'string') {
      // 如果是字符串，尝试解析后清洗
      try {
        const parsed = JSON.parse(answer);
        if (Array.isArray(parsed)) {
          cleanedAnswer = parsed.map(cleanSingleAnswer);
        } else {
          cleanedAnswer = cleanSingleAnswer(answer);
        }
      } catch (e) {
        cleanedAnswer = cleanSingleAnswer(answer);
      }
    } else {
      cleanedAnswer = answer;
    }
    
    // ========== 清洗后再校验 ==========
    const validation = validateAnswer(type, cleanedAnswer, options);
    if (!validation.valid) {
      console.log("[WARN] 答案校验失败，跳过缓存:", validation.reason);
      return;
    }
    
    let answerStr = typeof cleanedAnswer === 'string' ? cleanedAnswer : JSON.stringify(cleanedAnswer);
    
    // 标准化题目和选项格式
    const normalizedQuestion = normalizeQuestion(question);
    const normalizedOptions = normalizeOptions(options);
    let optionsStr = JSON.stringify(normalizedOptions);
    
    // 先检查缓存是否存在且答案一致
    const cached = await db.prepare(
      "SELECT answer, type, is_correct FROM answer_cache WHERE question_hash = ?"
    ).get(questionHash);
    
    if (cached) {
      // 解析缓存答案和新答案进行比较
      let cachedAnswerArr, newAnswerArr;
      let answersMatch = false;
      try {
        cachedAnswerArr = JSON.parse(cached.answer);
        newAnswerArr = typeof cleanedAnswer === 'string' ? JSON.parse(cleanedAnswer) : cleanedAnswer;
        
        // 标准化后比较
        const cachedNormalized = cachedAnswerArr.map(a => normalizeAnswer(a, cached.type || type)).sort();
        const newNormalized = newAnswerArr.map(a => normalizeAnswer(a, type)).sort();
        
        if (JSON.stringify(cachedNormalized) === JSON.stringify(newNormalized)) {
          answersMatch = true;
        }
      } catch (e) {
        // 解析失败则用字符串比较
        if (cached.answer === answerStr) {
          answersMatch = true;
        }
      }
      
      if (answersMatch) {
        // 答案一致，仅当显式传入 isCorrect 且与缓存不同时更新
        const needsCorrectnessUpdate = isCorrect !== undefined && cached.is_correct !== isCorrect;
        if (needsCorrectnessUpdate) {
          await db.prepare(
            "UPDATE answer_cache SET is_correct = ? WHERE question_hash = ?"
          ).run(isCorrect, questionHash);
          console.log("缓存答案一致，更新 is_correct:", isCorrect, questionHash.substring(0, 8));
        } else {
          console.log("缓存已存在且答案一致，跳过写入:", questionHash.substring(0, 8));
        }
        return;
      }
    }

    // 新增或覆盖缓存
    // isCorrect 语义：undefined=不覆盖已有状态, null=显式设为NULL(重查成功重置), 0/1=设为具体值
    const shouldSetCorrectness = isCorrect !== undefined;
    const isCorrectValue = shouldSetCorrectness ? isCorrect : null;
    const isCorrectUpdateExpr = shouldSetCorrectness ? '?' : 'is_correct';
    await db.prepare(
      `INSERT INTO answer_cache (question_hash, question, options, type, answer, source, is_correct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE question=?, options=?, type=?, answer=?, source=?, is_correct=${isCorrectUpdateExpr}, created_at=?`
    ).run(questionHash, normalizedQuestion, optionsStr, type, answerStr, source, isCorrectValue, now, normalizedQuestion, optionsStr, type, answerStr, source, ...(shouldSetCorrectness ? [isCorrectValue] : []), now);
    
    console.log("保存缓存成功:", questionHash.substring(0, 8), "来源:", source, cached ? "(覆盖旧答案)" : "(新增)", shouldSetCorrectness ? `is_correct=${isCorrect}` : "");
  } catch (e) {
    if (e.code === 'ETIMEDOUT' || e.code === 'ECONNREFUSED' || e.code === 'PROTOCOL_CONNECTION_LOST') {
      console.warn("保存答案缓存失败(数据库不可达):", e.code);
    } else {
      console.error("保存答案缓存失败:", e.message);
    }
  }
}

// ==================== 答案正确性上报可信度机制 ====================

/**
 * 记录答案正确性上报（简化版：单用户上报即可生效）
 * @param {string} questionHash - 题目哈希
 * @param {string} token - 上报者Token
 * @param {string} userId - 上报者用户ID
 * @param {string} clientIp - 上报者IP
 * @param {number} isCorrect - 上报结果 (0=错误, 1=正确)
 * @param {string} type - 题目类型
 * @param {boolean} wasRecentlyQueried - 是否是最近查询过的题目（决定是否应用更新）
 * @returns {Object} { applied: boolean, pending: boolean }
 */
async function recordCorrectnessReport(questionHash, token, userId, clientIp, isCorrect, type, wasRecentlyQueried = true) {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // ========== 关键防护：未查询过的题目直接丢弃，不记录到数据库 ==========
    if (!wasRecentlyQueried) {
      // 只在服务端记录，不返回给客户端（防止暴露防护机制）
      console.log(`[服务端内部] 题目未查询过 ${questionHash.substring(0, 8)} - 完全丢弃，不记录`);
      // 对客户端来说，表现得和"等待更多验证"一样，隐藏真实原因
      return { applied: false, pending: true };
    }
    
    // ========== 已查询过的题目：单次上报立即生效 ==========
    // 记录到 correctness_reports 表（审计追溯）
    await db.prepare(
      `INSERT INTO correctness_reports 
       (question_hash, reporter_token, reporter_user_id, reporter_ip, is_correct, question_type, report_count, is_applied, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`
    ).run(questionHash, token, userId, clientIp, isCorrect, type, now, now);
    
    // 直接应用更新（不需要多人验证）
    const applied = await applyCorrectnessUpdate(questionHash, isCorrect, type);
    
    console.log(`[OK] 单次上报已生效: ${questionHash.substring(0, 8)} (${isCorrect === 1 ? '正确' : '错误'})`);
    
    return { applied, pending: false };
    
  } catch (e) {
    if (e.code === 'ETIMEDOUT' || e.code === 'ECONNREFUSED' || e.code === 'PROTOCOL_CONNECTION_LOST') {
      console.warn("记录正确性上报失败(数据库不可达):", e.code);
    } else {
      console.error("记录正确性上报失败:", e.message);
    }
    return { applied: false, pending: false };
  }
}

/**
 * 应用正确性更新到答案缓存
 * @param {string} questionHash - 题目哈希
 * @param {number} isCorrect - 正确性标记
 * @param {string} type - 题目类型
 * @returns {boolean} 是否成功
 */
async function applyCorrectnessUpdate(questionHash, isCorrect, type) {
  try {
    // 判断题答案错误时，需要反转答案
    if (type === '3' && isCorrect === 0) {
      // 先查询当前答案
      const row = await db.prepare(
        "SELECT answer FROM answer_cache WHERE question_hash = ?"
      ).get(questionHash);
      
      if (row && row.answer) {
        const currentAnswer = JSON.parse(row.answer);
        if (currentAnswer && currentAnswer.length > 0) {
          const judgeAnswer = currentAnswer[0];
          const reversedAnswer = reverseJudgeAnswer(judgeAnswer);
          
          if (reversedAnswer) {
            // 更新答案和正确性标记
            await db.prepare(
              "UPDATE answer_cache SET answer = ?, is_correct = 1 WHERE question_hash = ?"
            ).run(JSON.stringify([reversedAnswer]), questionHash);
            
            console.log(`[OK] 判断题答案已更正: ${questionHash.substring(0, 8)} "${judgeAnswer}" -> "${reversedAnswer}"`);
            return true;
          }
        }
      }
    }
    
    // 其他情况：只更新正确性标记
    const result = await db.prepare(
      "UPDATE answer_cache SET is_correct = ? WHERE question_hash = ?"
    ).run(isCorrect, questionHash);
    
    if (result.changes > 0) {
      console.log(`[OK] 更新答案正确性标记: ${questionHash.substring(0, 8)} -> ${isCorrect === 1 ? '正确' : '错误'}`);
      return true;
    } else {
      console.log(`[WARN] 未找到缓存记录: ${questionHash.substring(0, 8)}`);
      return false;
    }
  } catch (e) {
    console.error("应用正确性更新失败:", e.message);
    return false;
  }
}

// 反转判断题答案
function reverseJudgeAnswer(answer) {
  const normalized = answer.trim().toLowerCase();
  
  // 正确 -> 错误
  if (["正确", "对", "√", "✓", "true", "t", "是"].includes(normalized)) {
    return '错误';
  }
  
  // 错误 -> 正确
  if (["错误", "错", "×", "✗", "false", "f", "否"].includes(normalized)) {
    return '正确';
  }
  
  // 无法识别的格式，返回 null
  console.log(`[WARN] 无法识别判断题答案格式: "${answer}"`);
  return null;
}

// P-03修复：异步低优先级保存缓存（fire-and-forget）
// 所有非关键路径的缓存保存都应使用此函数，避免阻塞主请求
// 使用 setImmediate 降低优先级，让事件循环优先处理请求响应
function saveAnswerToCacheAsync(...args) {
  setImmediate(() => {
    saveAnswerToCache(...args).catch(e => {
      console.error('[saveAnswerToCacheAsync] 异步保存失败:', e.message);
    });
  });
}

module.exports = {
  // 缓存读写
  getCachedAnswer,
  saveAnswerToCache,
  // 异步低优先级保存（不阻塞主请求，fire-and-forget）
  saveAnswerToCacheAsync,
  // 正确性上报
  recordCorrectnessReport,
  applyCorrectnessUpdate
};
