const { db, getEnv, TIKU_API_URL, HIVENET_API_URL, YANXI_API_URL, getGlobalStats } = require('../config');
const { normalizeAnswer, fetchWithTimeout, getTypeDescription } = require('../utils');
const { generateQuestionHash } = require('./helpers');
const { saveAnswerToCache, validateSourceAnswer } = require('./cache');
const {
  incrementUcucCalls,
  incrementTotalQueries,
  updateUcucRemaining,
  incrementTikuCalls,
  incrementHiveNetCalls,
  updateHiveNetRemaining,
  incrementYanxiCalls,
  updateYanxiRemaining
} = require('./stats');

// UCUC 题库查询
// API文档: https://so.ucuc.net/system/article/detail?id=2
// POST https://so.ucuc.net/prod-api/system/questionBank/search
// 返回码: code=200 成功, code=500 失败
async function fetchUcuc(questionData) {
  const apiKey = getEnv('UCUC_API_KEY');

  if (!apiKey) {
    console.log("✗ UCUC 题库未配置 UCUC_API_KEY");
    return { code: 500, msg: "UCUC题库未配置ApiKey", data: null };
  }

  try {
    console.log("━━━ UCUC 题库查询中... ━━━");

    // 统计 UCUC 调用次数
    await incrementUcucCalls();

    // 去除题目中的所有符号，只保留中文、英文、数字
    const cleanQuestion = (questionData.question || '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');

    // 仅对UCUC支持的题型传入type，其他题型不传（让API自行识别）
    const ucucRequestTypeMap = {
      "0": "单选题",
      "1": "多选题",
      "2": "填空题",
      "3": "判断题",
      "4": "简答题"
    };
    const ucucRequestType = ucucRequestTypeMap[questionData.type];
    const requestBody = { question: cleanQuestion, apiKey: apiKey };
    if (ucucRequestType) requestBody.type = ucucRequestType;
    // 选择题上传选项
    if ((questionData.type === "0" || questionData.type === "1") && questionData.options) {
      const optionsArr = typeof questionData.options === 'string'
        ? questionData.options.split('\n').filter(o => o.trim())
        : questionData.options;
      requestBody.options = JSON.stringify(optionsArr);
      console.log(`📤 UCUC 上传选项: ${optionsArr.length} 个`);
    }

    const response = await fetchWithTimeout("https://so.ucuc.net/prod-api/system/questionBank/search", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.log(`✗ UCUC 题库 HTTP错误: ${response.status} ${response.statusText}`);
      return { code: response.status, msg: `UCUC题库HTTP错误: ${response.status}`, data: null };
    }

    const result = await response.json();

    // 记录查询日志
    await incrementTotalQueries('ucuc');

    console.log(`📥 UCUC 返回: code=${result.code}, msg="${result.msg || ''}"`);
    if (result.data?.remainingCount !== undefined) {
      console.log(`📥 UCUC 剩余次数: ${result.data.remainingCount}`);
    }

    if (result.code !== 200 || !result.data || !result.data.answer) {
      console.log(`✗ UCUC 题库未找到答案: "${(questionData.question || '').substring(0, 30)}..."`);
      return { code: 404, msg: result.msg || "UCUC题库未找到答案", data: null };
    }

    // 更新剩余次数
    if (result.data.remainingCount !== undefined) {
      await updateUcucRemaining(result.data.remainingCount);
    }

    // 解析答案
    let answers = [];
    const answerText = result.data.answer;

    // 清理 "第X空：" 前缀的函数
    const cleanBlankPrefix = (a) => a.replace(/^第[一二三四五六七八九十\d]+空[：:]\s*/, '').trim();

    if (typeof answerText === 'string') {
      // 优先按 ### 分割（UCUC 填空题多空分隔符）
      if (answerText.includes('###')) {
        answers = answerText.split('###').map(cleanBlankPrefix).filter(a => a);
      }
      // 其次按 "第X空" 标记分割（无 ### 但有第X空前缀的情况）
      else if (/第[一二三四五六七八九十\d]+空[：:]/.test(answerText)) {
        answers = answerText.split(/(?=第[一二三四五六七八九十\d]+空[：:])/)
          .map(cleanBlankPrefix).filter(a => a);
      }
      // 智慧树题库使用 # 分隔多选题答案
      else if (answerText.includes('#')) {
        // 只有当有多个 # 时才分割（避免误判单选题答案）
        const parts = answerText.split('#');
        if (parts.length > 1) {
          answers = parts.map(a => a.trim()).filter(a => a);
        } else {
          answers = [answerText.trim()];
        }
      }
      // 无第X空标记：按换行/逗号分割（适用于选项类答案）
      else if (answerText.includes('\n')) {
        answers = answerText.split('\n').map(a => a.trim()).filter(a => a);
      } else if (answerText.includes('，') || answerText.includes(',')) {
        answers = answerText.split(/[,，]/).map(a => a.trim()).filter(a => a);
      } else {
        answers = [answerText.trim()];
      }
    } else if (Array.isArray(answerText)) {
      answers = answerText.map(a => cleanBlankPrefix(typeof a === 'string' ? a : String(a))).filter(a => a);
    }

    console.log(`✓ UCUC 题库找到答案:`, JSON.stringify(answers));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 统一答案校验（单选/多选数量、选项匹配、判断题格式）
    const ucucValidation = validateSourceAnswer('UCUC题库', questionData.type, answers, questionData.options);
    if (!ucucValidation.valid) {
      console.log(`✗ ${ucucValidation.reason}`);
      return { code: 404, msg: ucucValidation.reason, data: { answer: answers } };
    }

    // 判断题多答案矛盾处理（UCUC特有逻辑）
    if (questionData.type === "3" && answers.length > 1) {
      const normalizedJudgments = answers.map(a => {
        const t = a.replace(/^[A-Z][.、]\s*/, '').trim();
        if (/^(正确|对|true|√|是|T)$/i.test(t)) return 'correct';
        if (/^(错误|错|false|×|否|F)$/i.test(t)) return 'wrong';
        return 'unknown';
      });
      const hasCorrect = normalizedJudgments.includes('correct');
      const hasWrong = normalizedJudgments.includes('wrong');
      if (hasCorrect && hasWrong) {
        console.log(`✗ UCUC 题库判断题答案矛盾: 同时包含正确和错误 → ${answers.join(', ')}`);
        return { code: 404, msg: "UCUC题库判断题答案矛盾(同时包含正确和错误)", data: { answer: answers } };
      }
      if (hasCorrect) {
        console.log(`✓ UCUC 判断题多答案统一为正确: ${answers.join(', ')} → ["正确"]`);
        answers = ["正确"];
      } else if (hasWrong) {
        console.log(`✓ UCUC 判断题多答案统一为错误: ${answers.join(', ')} → ["错误"]`);
        answers = ["错误"];
      }
    }

    // 判断题标准化
    if (questionData.type === "3") {
      answers = answers.map(ans => normalizeAnswer(ans, "3"));
    }

    return {
      code: 200,
      msg: "查询成功",
      data: {
        answer: answers,
        num: result.data.remainingCount,
        question: questionData.question,
        source: 'ucuc'
      }
    };
  } catch (e) {
    console.error("✗ UCUC 题库请求失败:", e.message);
    return { code: 500, msg: `UCUC题库请求失败: ${e.message}`, data: null };
  }
}

// 获取当前可用的题库海密钥（支持双密钥切换）
async function getAvailableTikuKey() {
  const key1 = getEnv('TIKU_API_KEY_1');
  const key2 = getEnv('TIKU_API_KEY_2');
  
  // 如果只配置了一个密钥
  if (key1 && !key2) {
    return { key: key1, keyNum: 1 };
  }
  if (key2 && !key1) {
    return { key: key2, keyNum: 2 };
  }
  
  // 双密钥模式：根据剩余次数自动切换
  const stats = await getGlobalStats();
  const remaining1 = stats.tiku_remaining_1 || 0;
  const remaining2 = stats.tiku_remaining_2 || 0;
  let currentKey = stats.current_tiku_key || 1;
  
  // 获取当前密钥的剩余次数
  const currentRemaining = currentKey === 1 ? remaining1 : remaining2;
  const otherRemaining = currentKey === 1 ? remaining2 : remaining1;
  
  // 当前密钥次数为0，尝试切换到另一个
  if (currentRemaining <= 0) {
    if (otherRemaining > 0) {
      // 切换到另一个密钥（数据库显示有次数）
      const newKeyNum = currentKey === 1 ? 2 : 1;
      await db.prepare("UPDATE global_stats SET current_tiku_key = ? WHERE id = 1").run(newKeyNum);
      console.log(`🔄 题库海密钥切换: 密钥${currentKey}次数耗尽，切换到密钥${newKeyNum}`);
      currentKey = newKeyNum;
    } else {
      // 数据库显示两个密钥都是0，但仍返回当前密钥尝试调用
      // 因为用户可能已充值，数据库还没更新
      // 实际调用API时会更新数据库值
      console.log(`⚠️ 数据库显示两个密钥次数都为0，仍尝试密钥${currentKey}（可能已充值）`);
      return {
        key: currentKey === 1 ? key1 : key2,
        keyNum: currentKey,
        bothZero: true  // 标记两个都是0，调用失败时可以尝试另一个
      };
    }
  }
  
  return {
    key: currentKey === 1 ? key1 : key2,
    keyNum: currentKey
  };
}

// 更新题库海密钥剩余次数
async function updateTikuKeyRemaining(keyNum, remaining) {
  if (remaining === undefined || remaining === null) return;
  
  try {
    const FIELD_MAP = { 1: 'tiku_remaining_1', 2: 'tiku_remaining_2' };
    const field = FIELD_MAP[keyNum];
    if (!field) return;
    await db.prepare(
      `UPDATE global_stats SET \`${field}\` = ?, updated_at = ? WHERE id = 1`
    ).run(remaining, Math.floor(Date.now() / 1000));
    console.log(`✓ 题库海密钥${keyNum}剩余次数已更新:`, remaining);
  } catch (e) {
    console.error(`更新题库海密钥${keyNum}剩余次数失败:`, e.message);
  }
}

// 刷新题库海密钥剩余次数（从API查询）
async function refreshTikuKeyRemaining(keyNum) {
  const key = keyNum === 1 ? getEnv('TIKU_API_KEY_1') : getEnv('TIKU_API_KEY_2');
  if (!key) {
    console.log(`⚠️ 题库海密钥${keyNum}未配置`);
    return null;
  }
  
  try {
    const response = await fetchWithTimeout(`https://help.tikuhai.com/key/get?key=${key}`);
    const result = await response.json();
    
    if (result.code === 0 && result.data && result.data.num !== undefined) {
      await updateTikuKeyRemaining(keyNum, result.data.num);
      console.log(`✓ 题库海密钥${keyNum}刷新成功: 剩余${result.data.num}次`);
      return result.data.num;
    } else {
      console.log(`✗ 题库海密钥${keyNum}刷新失败:`, result.msg || '未知错误');
      return null;
    }
  } catch (e) {
    console.error(`✗ 题库海密钥${keyNum}刷新异常:`, e.message);
    return null;
  }
}

// 刷新所有题库海密钥剩余次数
async function refreshAllTikuKeys() {
  const key1 = getEnv('TIKU_API_KEY_1');
  const key2 = getEnv('TIKU_API_KEY_2');
  
  const results = { key1: null, key2: null };
  
  if (key1) {
    results.key1 = await refreshTikuKeyRemaining(1);
  }
  if (key2) {
    results.key2 = await refreshTikuKeyRemaining(2);
  }
  
  return results;
}

// 请求题库API（双密钥自动切换）
async function fetchAnswer(questionData) {
  const key1 = getEnv('TIKU_API_KEY_1');
  const key2 = getEnv('TIKU_API_KEY_2');
  
  if (!key1 && !key2) {
    return { code: 500, msg: "未配置题库海密钥", data: null };
  }
  
  // 检查数据库中的剩余次数
  const stats = await getGlobalStats();
  const remaining1 = stats.tiku_remaining_1 || 0;
  const remaining2 = stats.tiku_remaining_2 || 0;
  
  // 如果两个密钥都没次数，直接跳过题库海
  if (remaining1 <= 0 && remaining2 <= 0) {
    console.log("⏭️ 题库海两个密钥次数都为0，跳过题库海");
    return { code: 403, msg: "题库海次数耗尽，已跳过", data: null, skipTiku: true };
  }
  
  // 单次调用题库API
  async function callTikuApi(key, keyNum) {
    const headers = {
      "Content-Type": "application/json",
      "referer": questionData.refer || "",
      "u": questionData.u || "",
      "t": questionData.t || Math.floor(Date.now() / 1000).toString()
    };
    
    const body = JSON.stringify({
      question: questionData.question,
      options: questionData.options,
      type: questionData.type,
      questionData: questionData.questionData,
      workType: questionData.workType,
      id: questionData.id,
      key: key
    });
    
    console.log(`━━━ 题库海查询中... (使用密钥${keyNum}) ━━━`);
    console.log(`📍 题目: ${questionData.question}`);
    console.log(`📍 题型: ${questionData.type} (${getTypeDescription(questionData.type)})`);
    // 正确处理options为数组的情况
    const optionsText = Array.isArray(questionData.options) 
      ? questionData.options.join('; ').substring(0, 30)
      : (questionData.options || '').substring(0, 30);
    console.log(`📍 请求体: question=${questionData.question.substring(0,30)}, options=${optionsText}, type=${questionData.type}`);
    
    const response = await fetchWithTimeout(TIKU_API_URL + "?s=PIAOPIAO&v=9.9.9", {
      method: 'POST',
      headers: headers,
      body: body
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP错误: ${response.status}`);
      return { success: false, error: { code: response.status, msg: `HTTP错误: ${response.status}` } };
    }
    
    const result = await response.json();
    console.log(`📍 code: ${result.code}, msg: ${result.msg || '无'}`);
    
    // 更新题库剩余次数
    if (result.data && result.data.num !== undefined) {
      await updateTikuKeyRemaining(keyNum, result.data.num);
    }
    
    // 检查是否成功
    if (result.code === 200) {
      return { success: true, result };
    }
    
    // 检查是否是次数不足错误
    const errorMsg = result.msg || '';
    if (errorMsg.includes('次数') || errorMsg.includes('余额') || errorMsg.includes('不足') || result.code === 403) {
      return { success: false, exhausted: true, error: result };
    }
    
    return { success: false, error: result };
  }
  
  // 智能选择起始密钥：优先用有次数且已配置的
  let currentKey;
  const maxKeys = key1 && key2 ? 2 : 1;
  
  if (key1 && remaining1 > 0 && (!key2 || remaining2 <= 0)) {
    currentKey = 1;
  } else if (key2 && remaining2 > 0 && (!key1 || remaining1 <= 0)) {
    currentKey = 2;
  } else {
    currentKey = stats.current_tiku_key || 1;
    if (currentKey === 1 && !key1) currentKey = 2;
    if (currentKey === 2 && !key2) currentKey = 1;
  }
  
  const triedKeys = new Set();
  
  while (triedKeys.size < maxKeys) {
    if (triedKeys.has(currentKey)) {
      currentKey = currentKey === 1 ? 2 : 1;
      if (triedKeys.has(currentKey)) break;
    }
    
    triedKeys.add(currentKey);
    const key = currentKey === 1 ? key1 : key2;
    
    await incrementTikuCalls();
    const apiResult = await callTikuApi(key, currentKey);
    
    if (apiResult.success) {
      // 成功后才更新当前使用的密钥（下次直接用这个）
      await db.prepare("UPDATE global_stats SET current_tiku_key = ? WHERE id = 1").run(currentKey);
      
      await incrementTotalQueries('tiku');
      const result = apiResult.result;
      const hasAnswer = result.data && result.data.answer && 
                       (Array.isArray(result.data.answer) ? result.data.answer.length > 0 : true);
      
      if (!hasAnswer) {
        console.log("✗ 题库海 查询成功但无答案（题库中无此题）");
        return { code: 404, msg: "题库海无此题", data: result.data };
      }
      
      const answers = result.data.answer;
      
      // 统一答案校验
      const sourceValidation = validateSourceAnswer('题库海', questionData.type, answers, questionData.options);
      if (!sourceValidation.valid) {
        console.log(`✗ ${sourceValidation.reason}`);
        return { code: 404, msg: sourceValidation.reason, data: result.data };
      }

      // 判断题标准化
      if (questionData.type === "3") {
        answers = answers.map(ans => normalizeAnswer(ans, "3"));
      }

      console.log("✓ 题库海 找到答案:", JSON.stringify(answers));
      // 统一answer为数组格式（题库海API可能返回逗号分隔的字符串）
      let normalizedAnswer = result.data.answer;
      if (typeof normalizedAnswer === 'string') {
        normalizedAnswer = normalizedAnswer.split(/[,，]/).map(a => a.trim()).filter(a => a);
      } else if (!Array.isArray(normalizedAnswer)) {
        normalizedAnswer = [String(normalizedAnswer)];
      }
      // 添加 source 字段，统一 msg 为 "查询成功"
      return {
        ...result,
        msg: "查询成功",  // 统一返回消息，避免题库海API返回各种不同的提示
        data: {
          ...result.data,
          answer: normalizedAnswer,
          source: 'tiku'
        }
      };
    }
    
    if (apiResult.exhausted) {
      console.log(`🔄 密钥${currentKey}次数不足，尝试切换到密钥${currentKey === 1 ? 2 : 1}...`);
      console.log(`[密钥切换] IP=${questionData.question?.substring(0, 20) || 'unknown'}, 从密钥${currentKey}切换，原因: 次数不足`);
      currentKey = currentKey === 1 ? 2 : 1;
      continue;
    }
    
    await incrementTotalQueries('tiku');
    return apiResult.error;
  }
  
  return { code: 403, msg: "题库海两个密钥次数都已耗尽", data: null };
}

// 智能解析答案：判断返回的是字母还是文本
function parseAnswer(answer, answerOptions) {
  // 答案清洗函数：去除 "(正确答案)" 等标记
  const cleanAnswer = (text) => {
    return text
      .replace(/（正确答案）|\(正确答案\)|【正确答案】|\[正确答案\]/gi, '')
      .replace(/（正确选项）|\(正确选项\)|【正确选项】|\[正确选项\]/gi, '')
      .replace(/（正确）|\(正确\)|【正确】|\[正确\]/gi, '')
      .replace(/（答案）|\(答案\)|【答案】|\[答案\]/gi, '')
      .trim();
  };
  
  // 如果 answer 为空，尝试从 answerOptions 中识别带标记的正确答案
  if (!answer && answerOptions) {
    const markedAnswers = [];
    const answerMarkers = /（正确答案）|\(正确答案\)|【正确答案】|\[正确答案\]|（正确选项）|\(正确选项\)|【正确选项】|\[正确选项\]|（正确）|\(正确\)|【正确】|\[正确\]/gi;
    
    // 按换行符或逗号分割选项
    let options;
    if (answerOptions.includes('\n')) {
      options = answerOptions.split('\n').map(s => s.trim()).filter(s => s);
    } else {
      options = answerOptions.split(',').map(s => s.trim()).filter(s => s);
    }
    
    for (const opt of options) {
      if (answerMarkers.test(opt)) {
        // 提取选项文本（清洗标记）
        let answerText = cleanAnswer(opt);
        // 如果有选项前缀（如 A.），去掉前缀
        answerText = answerText.replace(/^[A-Za-z][.、:：)\s]+/, '').trim();
        if (answerText) {
          markedAnswers.push(answerText);
        }
      }
      // 重置正则的 lastIndex（因为使用了全局标志）
      answerMarkers.lastIndex = 0;
    }
    
    if (markedAnswers.length > 0) {
      console.log(`答案格式：从选项标记中识别，找到 ${markedAnswers.length} 个答案`);
      return markedAnswers;
    }
  }
  
  if (!answer) return [];

  // 分割答案（支持逗号或 # 分隔的多选）
  let answerParts;
  // 优先检查 # 分隔符（智慧树题库使用）
  if (answer.includes('#') && answer.split('#').length > 1) {
    answerParts = answer.split('#').map(s => cleanAnswer(s)).filter(s => s);
  } else {
    answerParts = answer.split(',').map(s => cleanAnswer(s)).filter(s => s);
  }
  
  // 判断是否全是字母（单字母或重复字母如 "A,A,A"）
  const isAllLetters = answerParts.every(part => /^[A-Za-z]$/.test(part));
  
  if (!isAllLetters) {
    // 已经是文本，清洗后返回
    console.log("答案格式：文本，清洗后使用");
    return answerParts;
  }
  
  // 是字母，需要从 options 中提取对应文本
  console.log("答案格式：字母，开始转换");
  
  if (!answerOptions) {
    console.log("⚠️ 缺少选项信息，无法转换字母答案");
    return answerParts; // 无法转换，返回原始字母
  }
  
  // 解析选项：格式为 "A.文本,B.文本,C.文本,D.文本"
  const optionsMap = {};
  const options = answerOptions.split(',').map(s => s.trim());
  
  for (const opt of options) {
    // 匹配 "A.文本" 或 "A:文本" 格式，同时清洗选项文本
    const match = opt.match(/^([A-Za-z])[\.:：]\s*(.+)$/);
    if (match) {
      const letter = match[1].toUpperCase();
      const text = cleanAnswer(match[2].trim());  // 清洗选项文本
      optionsMap[letter] = text;
    }
  }
  
  // 转换字母为文本
  const convertedAnswers = [];
  const letterSet = new Set(answerParts.map(l => l.toUpperCase()));
  
  for (const letter of letterSet) {
    if (optionsMap[letter]) {
      convertedAnswers.push(optionsMap[letter]);
    } else {
      console.log(`⚠️ 未找到字母 ${letter} 对应的选项`);
    }
  }
  
  return convertedAnswers;
}

// Hive-Net 单次查询（内部函数）
async function fetchHiveNetOnce(questionData, token, tokenName) {
  console.log(`━━━ Hive-Net 题库查询中... (使用 ${tokenName} token) ━━━`);
  
  // 统计 Hive-Net 调用次数
  await incrementHiveNetCalls();
  
  // 构建请求 URL
  const encodedQuestion = encodeURIComponent(questionData.question);
  const url = `${HIVENET_API_URL}?token=${token}&question=${encodedQuestion}`;
  
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // 检查 HTTP 响应状态
  if (!response.ok) {
    console.log(`✗ Hive-Net HTTP错误: ${response.status} ${response.statusText}`);
    return { code: response.status, msg: `Hive-Net HTTP错误: ${response.status}`, data: null };
  }
  
  const result = await response.json();
  
  // 更新 Hive-Net 剩余次数（如果API返回了剩余次数）
  if (result.data && result.data.remain_times !== undefined) {
    await updateHiveNetRemaining(result.data.remain_times);
  }
  
  // 记录查询日志
  await incrementTotalQueries('hivenet');
  
  // Hive-Net 成功码是 0
  if (result.code !== 0) {
    console.log(`✗ Hive-Net API错误: code=${result.code}, msg=${result.msg || '未知错误'}`);
    return { code: result.code, msg: `Hive-Net API错误: ${result.msg || '未知错误'}`, data: null };
  }
  
  // API 返回成功但无数据
  if (!result.data || !result.data.list || result.data.list.length === 0) {
    console.log("✗ Hive-Net 查询成功但无答案（题库中无此题）");
    return { code: 404, msg: "Hive-Net无此题", data: null };
  }
  
  return { success: true, result };
}

// 请求 Hive-Net API（备用题库，仅支持单选和多选）
async function fetchHiveNet(questionData) {
  // 只处理单选(0)和多选(1)，其他题型直接返回失败
  if (questionData.type !== "0" && questionData.type !== "1") {
    console.log("Hive-Net: 不支持此题型(仅支持单选/多选)，跳过");
    return { code: 404, msg: "Hive-Net不支持此题型", data: null };
  }
  
  try {
    // 定义 token
    const HIVENET_PAID_TOKEN = getEnv('HIVENET_PAID_TOKEN', '');  // 付费 token（环境变量，不刷新）
    const HIVENET_FREE_TOKEN = 'free';  // 免费 token（每日0点刷新）
    
    // 获取统计数据
    const stats = await getGlobalStats();
    const lastDate = stats.hivenet_free_last_date || '';  // 上次使用免费 token 的日期 "2026-03-20"
    
    // 获取今天日期
    const today = new Date().toISOString().split('T')[0];  // "2026-03-20"
    
    // 判断是否新的一天（免费 token 会刷新）
    const isNewDay = today !== lastDate;
    
    let apiResult;
    
    if (isNewDay) {
      // 新的一天，免费 token 已刷新，优先使用
      console.log(`━━━ Hive-Net 使用免费 token (新的一天已刷新) ━━━`);
      apiResult = await fetchHiveNetOnce(questionData, HIVENET_FREE_TOKEN, '免费');
      
      // 如果免费 token 失败，切换到付费 token
      if (!apiResult.success) {
        if (!HIVENET_PAID_TOKEN) {
          console.log(`✗ 免费 token 查询失败，且未配置 HIVENET_PAID_TOKEN`);
          return apiResult;
        }
        console.log(`🔄 免费 token 查询失败，切换到付费 token...`);
        apiResult = await fetchHiveNetOnce(questionData, HIVENET_PAID_TOKEN, '付费');
      } else {
        // 更新日期和剩余次数
        const newRemaining = apiResult.result?.data?.remain_times;
        if (newRemaining !== undefined) {
          await db.prepare(
            "UPDATE global_stats SET hivenet_remaining = ?, hivenet_free_last_date = ?, updated_at = ? WHERE id = 1"
          ).run(newRemaining, today, Math.floor(Date.now() / 1000));
        }
      }
    } else {
      // 同一天，检查剩余次数
      const freeRemaining = stats.hivenet_remaining || 0;
      if (freeRemaining > 0) {
        console.log(`━━━ Hive-Net 使用免费 token (剩余 ${freeRemaining} 次) ━━━`);
        apiResult = await fetchHiveNetOnce(questionData, HIVENET_FREE_TOKEN, '免费');
        
        if (!apiResult.success) {
          if (!HIVENET_PAID_TOKEN) {
            console.log(`✗ 免费 token 查询失败，且未配置 HIVENET_PAID_TOKEN`);
            return apiResult;
          }
          console.log(`🔄 免费 token 查询失败，切换到付费 token...`);
          apiResult = await fetchHiveNetOnce(questionData, HIVENET_PAID_TOKEN, '付费');
        } else {
          // 更新剩余次数
          const newRemaining = apiResult.result?.data?.remain_times;
          if (newRemaining !== undefined) {
            await db.prepare(
              "UPDATE global_stats SET hivenet_remaining = ?, updated_at = ? WHERE id = 1"
            ).run(newRemaining, Math.floor(Date.now() / 1000));
          }
        }
      } else {
        // 免费次数已用完，直接使用付费 token
        if (!HIVENET_PAID_TOKEN) {
          console.log("✗ Hive-Net 免费 token 已耗尽，且未配置 HIVENET_PAID_TOKEN");
          return { code: 403, msg: "Hive-Net次数耗尽且未配置付费Token", data: null };
        }
        console.log("━━━ Hive-Net 免费 token 已耗尽，使用付费 token ━━━");
        apiResult = await fetchHiveNetOnce(questionData, HIVENET_PAID_TOKEN, '付费');
      }
    }
    
    // 如果仍然失败，返回错误
    if (!apiResult.success) {
      return apiResult;
    }
    
    const result = apiResult.result;
    
    // 解析用户提供的选项，用于精确匹配
    let userOptions = [];
    if (questionData.options && typeof questionData.options === 'string') {
      userOptions = questionData.options.split('\n').map(o => o.trim()).filter(o => o);
    } else if (Array.isArray(questionData.options)) {
      // 如果选项已经是数组，直接使用
      userOptions = questionData.options.map(o => String(o).trim()).filter(o => o);
    }
    
    // 提取用户选项的纯文本内容（去除A.、B.等前缀）
    const userOptionTexts = userOptions.map(opt => 
      opt.replace(/^[A-Za-z][.、)\s]+/, '').trim().replace(/[。，,.！!？?；;：:]+$/, '').trim()
    ).filter(t => t);
    
    // 标准化函数：统一中英文标点符号
    const normalizeText = (text) => {
      return text
        .replace(/，/g, ',')   // 中文逗号 → 英文逗号
        .replace(/。/g, '.')   // 中文句号 → 英文句号
        .replace(/！/g, '!')   // 中文感叹号 → 英文感叹号
        .replace(/？/g, '?')   // 中文问号 → 英文问号
        .replace(/；/g, ';')   // 中文分号 → 英文分号
        .replace(/：/g, ':')   // 中文冒号 → 英文冒号
        .replace(/"/g, '"')    // 中文双引号 → 英文双引号
        .replace(/"/g, '"')
        .replace(/'/g, "'")    // 中文单引号 → 英文单引号
        .replace(/'/g, "'")
        .replace(/（/g, '(')   // 中文括号 → 英文括号
        .replace(/）/g, ')')
        .toLowerCase();        // 统一小写
    };
    
    // 标准化用户选项
    const normalizedUserOptions = userOptionTexts.map(normalizeText);
    
    // 如果用户没有提供选项，返回失败，让下一个题库处理
    if (userOptionTexts.length === 0) {
      console.log(`✗ Hive-Net 用户未提供选项，跳过`);
      return { code: 404, msg: "Hive-Net需要选项进行匹配", data: null };
    }
    
    // 遍历所有匹配结果，找到选项完全相同的题目
    let exactMatch = null;

    // 调试日志：输出用户选项
    console.log(`📋 用户选项(${userOptionTexts.length}个):`, userOptionTexts);

    for (const item of result.data.list) {
      if (!item.answer_options) continue;

      // 解析 Hive-Net 返回的选项（优先尝试换行符分割）
      let hiveNetOptions;
      const rawOptions = item.answer_options;

      // 先打印原始选项格式，便于调试
      console.log(`📋 Hive-Net原始选项:`, rawOptions.substring(0, 100) + (rawOptions.length > 100 ? '...' : ''));

      // 尝试不同的分割方式
      if (rawOptions.includes('\n')) {
        // 换行符分割
        hiveNetOptions = rawOptions.split('\n').map(o => o.trim()).filter(o => o);
      } else if (rawOptions.match(/[A-Za-z][.、)]/g)?.length >= 2) {
        // 有选项前缀（如 A. B. C.），按前缀分割
        hiveNetOptions = rawOptions.split(/(?=[A-Za-z][.、)])/).map(o => o.trim()).filter(o => o);
      } else {
        // 逗号分割（可能不准确，但作为后备）
        hiveNetOptions = rawOptions.split(',').map(o => o.trim()).filter(o => o);
      }

      // 提取 Hive-Net 选项的纯文本内容（并清洗标记）
      // 注意处理顺序：先去除(正确答案)标记，再处理前缀
      const hiveNetOptionTexts = hiveNetOptions.map(opt =>
        opt.replace(/（正确答案）|\(正确答案\)|【正确答案】|\[正确答案\]/gi, '')
           .replace(/（正确选项）|\(正确选项\)|【正确选项】|\[正确选项\]/gi, '')
           .replace(/^[A-Za-z][:.、)\s]+/, '')  // 匹配 A: A. A、 A) 等前缀
           .trim()
           .replace(/[。，,.！!？?；;：:]+$/, '')  // 去除末尾标点
           .trim()
      ).filter(t => t);

      // 【修复】标准化选项：去除末尾标点后，作为最终选项数组用于缓存和返回
      const cleanHiveNetOptions = hiveNetOptionTexts;
      
      // 标准化 Hive-Net 选项
      const normalizedHiveNetOptions = hiveNetOptionTexts.map(normalizeText);
      
      // 调试日志：输出选项
      console.log(`📋 Hive-Net选项(${hiveNetOptionTexts.length}个):`, hiveNetOptionTexts);
      
      // 检查选项数量是否相同
      if (normalizedUserOptions.length !== normalizedHiveNetOptions.length) {
        console.log(`⚠️ 选项数量不匹配: 用户${normalizedUserOptions.length} vs Hive-Net${normalizedHiveNetOptions.length}`);
        continue;
      }
      
      // 检查选项集合是否完全相同（忽略顺序）
      let allMatch = true;
      
      // 检查用户的所有选项是否都在 Hive-Net 选项中
      for (const userOpt of normalizedUserOptions) {
        if (!normalizedHiveNetOptions.includes(userOpt)) {
          allMatch = false;
          console.log(`⚠️ 用户选项未在Hive-Net中找到: "${userOpt}"`);
          break;
        }
      }
      
      // 反向检查：Hive-Net 的所有选项是否都在用户选项中
      if (allMatch) {
        for (const hiveOpt of normalizedHiveNetOptions) {
          if (!normalizedUserOptions.includes(hiveOpt)) {
            allMatch = false;
            console.log(`⚠️ Hive-Net选项未在用户选项中找到: "${hiveOpt}"`);
            break;
          }
        }
      }
      
      if (allMatch) {
        exactMatch = item;
        console.log(`✓ Hive-Net 找到选项完全相同的题目`);
        break;
      }
    }
    
    // 缓存 Hive-Net 返回的所有题目（无论是否匹配当前用户）
    console.log(`━━━ 缓存 Hive-Net 返回的所有题目 (${result.data.list.length} 道) ━━━`);
    for (const item of result.data.list) {
      if (!item.question || !item.answer || !item.answer_options) continue;

      // 转换题型：Hive-Net 的 answer_type (1=单选, 2=多选, 3=判断, 4=填空)
      const typeMap = { 1: "0", 2: "1", 3: "3", 4: "2" };
      const itemType = typeMap[item.answer_type] || "0";

      // 解析答案
      const itemAnswers = parseAnswer(item.answer, item.answer_options);
      if (itemAnswers.length === 0) continue;

      // 【修复】标准化选项后，用于生成哈希和缓存
      let itemOptions;
      if (Array.isArray(item.answer_options)) {
        // 如果已经是数组，去除末尾标点
        itemOptions = item.answer_options.map(opt =>
          String(opt).replace(/[。，,.！!？?；;：:]+$/, '').trim()
        );
      } else if (typeof item.answer_options === 'string') {
        // 如果是字符串，先分割再去除末尾标点
        if (item.answer_options.includes('\n')) {
          itemOptions = item.answer_options.split('\n')
            .map(o => o.trim()
              .replace(/^[A-Za-z][:.、)\s]+/, '')
              .replace(/[。，,.！!？?；;：:]+$/, '')
              .trim())
            .filter(o => o);
        } else if (item.answer_options.match(/[A-Za-z][.、)]/g)?.length >= 2) {
          itemOptions = item.answer_options.split(/(?=[A-Za-z][.、)])/)
            .map(o => o.trim()
              .replace(/^[A-Za-z][:.、)\s]+/, '')
              .replace(/[。，,.！!？?；;：:]+$/, '')
              .trim())
            .filter(o => o);
        } else {
          itemOptions = item.answer_options.split(',')
            .map(o => o.trim()
              .replace(/^[A-Za-z][:.、)\s]+/, '')
              .replace(/[。，,.！!？?；;：:]+$/, '')
              .trim())
            .filter(o => o);
        }
      } else {
        itemOptions = [];
      }

      // 生成题目哈希并缓存
      const itemHash = generateQuestionHash(item.question, itemOptions, itemType);

      // 异步保存，不阻塞主流程（saveAnswerToCache 内部会验证答案）
      saveAnswerToCache(itemHash, item.question, itemOptions, itemType, itemAnswers, "hivenet").catch(e => {
        console.log(`✗ 缓存失败: ${item.question.substring(0, 20)}... - ${e.message}`);
      });
    }
    
    // 如果没有找到选项完全相同的题目，返回失败
    if (!exactMatch) {
      console.log(`✗ Hive-Net 未找到选项完全相同的题目，跳过`);
      return { code: 404, msg: "Hive-Net未找到选项完全匹配的题目", data: null };
    }
    
    // 智能解析答案
    const answers = parseAnswer(exactMatch.answer, exactMatch.answer_options);
    
    if (answers.length === 0) {
      return { code: 404, msg: "Hive-Net答案解析失败", data: null };
    }
    
    // 统一答案校验
    const hiveValidation = validateSourceAnswer('Hive-Net', questionData.type, answers, questionData.options);
    if (!hiveValidation.valid) {
      console.log(`✗ ${hiveValidation.reason}`);
      return { code: 404, msg: hiveValidation.reason, data: null };
    }
    
    console.log("✓ Hive-Net 找到答案:", answers);

    // 【修复】返回清理后的选项（与缓存一致）
    // 注意：exactMatch.answer_options是原始字符串，需要重新解析并清理
    let returnOptions;
    if (Array.isArray(exactMatch.answer_options)) {
      returnOptions = exactMatch.answer_options.map(opt =>
        String(opt).replace(/[。，,.！!？?；;：:]+$/, '').trim()
      );
    } else if (typeof exactMatch.answer_options === 'string') {
      if (exactMatch.answer_options.includes('\n')) {
        returnOptions = exactMatch.answer_options.split('\n')
          .map(o => o.trim()
            .replace(/^[A-Za-z][:.、)\s]+/, '')
            .replace(/[。，,.！!？?；;：:]+$/, '')
            .trim())
          .filter(o => o);
      } else if (exactMatch.answer_options.match(/[A-Za-z][.、)]/g)?.length >= 2) {
        returnOptions = exactMatch.answer_options.split(/(?=[A-Za-z][.、)])/)
          .map(o => o.trim()
            .replace(/^[A-Za-z][:.、)\s]+/, '')
            .replace(/[。，,.！!？?；;：:]+$/, '')
            .trim())
          .filter(o => o);
      } else {
        returnOptions = exactMatch.answer_options.split(',')
          .map(o => o.trim()
            .replace(/^[A-Za-z][:.、)\s]+/, '')
            .replace(/[。，,.！!？?；;：:]+$/, '')
            .trim())
          .filter(o => o);
      }
    } else {
      returnOptions = [];
    }

    return {
      code: 200,
      msg: "查询成功",
      data: {
        answer: answers,
        num: result.data.remain_times,
        question: exactMatch.question,
        answer_options: returnOptions,
        source: 'hivenet'
      }
    };
    
  } catch (e) {
    console.error("✗ Hive-Net 网络错误:", e.message);
    return { 
      code: 500, 
      msg: `Hive-Net网络错误: ${e.message}`, 
      data: null 
    };
  }
}

// 言溪题库查询
// API文档: https://tk.enncy.cn/query
// 返回码: code=1 找到答案, code=0 未找到答案
async function fetchYanxi(questionData) {
  const token = getEnv('YANXI_TOKEN');
  
  if (!token) {
    console.log("✗ 言溪题库未配置 YANXI_TOKEN");
    return { code: 500, msg: "言溪题库未配置Token", data: null };
  }
  
  try {
    console.log("━━━ 言溪题库查询中... ━━━");
    
    // 统计言溪题库调用次数
    await incrementYanxiCalls();
    
    // 转换题型编码：我的编码 -> 言溪编码
    const typeMap = {
      "0": "single",      // 单选题
      "1": "multiple",    // 多选题
      "2": "completion",  // 填空题
      "3": "judgement",   // 判断题
    };
    const yanxiType = typeMap[questionData.type] || "unknown";
    
    // 题型检查
    if (!questionData.type) {
      console.log("✗ 言溪题库缺少题型参数");
      return { code: 400, msg: "言溪题库缺少题型参数", data: null };
    }
    
    // 单选(0)、多选(1) 需要选项
    const needOptions = ["0", "1"].includes(questionData.type);
    if (needOptions && !questionData.options) {
      console.log("✗ 言溪题库此题型需要选项参数");
      return { code: 400, msg: "言溪题库此题型需要选项参数", data: null };
    }
    
    // 转换选项格式：将选项转换为换行符分隔（言溪要求）
    // 例如: "A.杭州 B.汝州 C.黄州 D.儋州" → "A.杭州\nB.汝州\nC.黄州\nD.儋州"
    let yanxiOptions = '';
    if (questionData.options) {
      // 处理数组和字符串两种格式
      if (Array.isArray(questionData.options)) {
        yanxiOptions = questionData.options.join('\n');
      } else if (typeof questionData.options === 'string') {
        yanxiOptions = questionData.options;
        if (!yanxiOptions.includes('\n')) {
          // 如果选项中没有换行符，尝试按 A. B. C. D. 分割
          yanxiOptions = yanxiOptions
            .replace(/([A-Z])\./g, '\n$1.')
            .trim()
            .replace(/^\n/, '');  // 移除开头的换行
        }
      } else {
        // 其他类型转为字符串
        yanxiOptions = String(questionData.options);
      }
    }
    
    // 打印请求参数
    console.log(`📤 言溪请求: 题型=${yanxiType}, 题目="${(questionData.question || '').substring(0, 30)}..."`);
    if (yanxiOptions) {
      console.log(`📤 言溪选项: "${yanxiOptions.substring(0, 50)}..."`);
    }
    
    // 构建请求 URL
    const params = new URLSearchParams({
      token: token,
      title: questionData.question || '',
      options: yanxiOptions,
      type: yanxiType
    });
    const url = `${YANXI_API_URL}?${params.toString()}`;
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 检查 HTTP 响应状态
    if (!response.ok) {
      console.log(`✗ 言溪题库 HTTP连接错误: ${response.status} ${response.statusText}`);
      return { code: response.status, msg: `言溪题库HTTP连接错误: ${response.status}`, data: null };
    }
    
    const result = await response.json();
    
    // 记录查询日志
    await incrementTotalQueries('yanxi');
    
    // 打印言溪返回状态
    console.log(`📥 言溪返回: code=${result.code}, message="${result.message || ''}"`);
    if (result.data?.times !== undefined) {
      console.log(`📥 言溪剩余次数: ${result.data.times}`);
    }
    
    // 言溪返回码说明:
    // code=1 找到答案, code=0 未找到答案
    if (result.code === 0) {
      console.log(`✗ 言溪题库未找到答案: "${(questionData.question || '').substring(0, 30)}..."`);
      return { code: 404, msg: "言溪题库未找到答案", data: null };
    }
    
    if (result.code !== 1) {
      console.log(`✗ 言溪题库返回异常: code=${result.code}, message="${result.message || '未知错误'}"`);
      return { code: result.code, msg: `言溪题库返回异常: ${result.message || '未知错误'}`, data: null };
    }
    
    // 更新言溪剩余次数
    if (result.data && result.data.times !== undefined) {
      await updateYanxiRemaining(result.data.times);
    }
    
    // API 返回成功但无答案
    if (!result.data || !result.data.answer) {
      console.log("✗ 言溪题库查询成功但无答案");
      return { code: 404, msg: "言溪题库无此题", data: result.data };
    }
    
    // 记录是否为 AI 生成
    const isAiGenerated = result.data.ai === true;
    if (isAiGenerated) {
      console.log("ℹ️ 言溪题库答案为 AI 生成");
    }
    
    // 解析答案
    let answers = [];
    const answerText = result.data.answer;
    
    // 清洗答案序号前缀的函数（用于填空题）
    const cleanAnswerPrefix = (ans) => {
      // 只去掉序号前缀（后面必须有空格或中文/英文，不能是数字）
      // 匹配: "1. 答案" 或 "1、答案" 或 "1:答案"，但不匹配 "1.2" 或 "1.3"
      return ans.replace(/^\d+[.、]\s+/, '')      // "1. 答案" -> "答案"
                 .replace(/^\d+[.、](?=[\u4e00-\u9fa5a-zA-Z])/, '')  // "1.答案" -> "答案"（后面是中文/英文）
                 .replace(/^\d+[:：]\s*/, '')     // "1:答案" -> "答案"
                 .replace(/^\(\d+\)\s*/, '')      // "(1) 答案" -> "答案"
                 .trim();
    };
    
    // 填空题：分割单个字符串中的多个答案（如 "(1)答案1(2)答案2" 或 "1、答案1 2、答案2"）
    const splitFillBlankAnswers = (ans) => {
      // 检测 (1)(2) 格式
      if (/\(\d+\)/.test(ans)) {
        return ans.split(/\(\d+\)/).map(a => a.trim()).filter(a => a);
      }
      // 检测 1、2、 格式（中文顿号，后面是中文）
      if (/\d+、[\u4e00-\u9fa5]/.test(ans)) {
        return ans.split(/\d+、/).map(a => a.trim()).filter(a => a);
      }
      // 检测 1. 2. 格式（后面有空格或中文）
      if (/\d+[.、]\s*[\u4e00-\u9fa5a-zA-Z]/.test(ans)) {
        return ans.split(/\d+[.、]\s*/).map(a => a.trim()).filter(a => a);
      }
      // 没有分隔符，返回原答案
      return [ans];
    };
    
    if (typeof answerText === 'string') {
      // 尝试解析 JSON 格式的答案（言溪可能返回 '["答案"]' 字符串格式）
      if (answerText.startsWith('[') && answerText.endsWith(']')) {
        try {
          const parsed = JSON.parse(answerText);
          if (Array.isArray(parsed)) {
            answers = parsed.map(a => typeof a === 'string' ? a.trim() : String(a)).filter(a => a);
            console.log("📥 言溪答案JSON解析成功:", answers);
          } else {
            answers = [String(parsed).trim()];
          }
        } catch (e) {
          // JSON 解析失败，按普通字符串处理
          answers = [answerText.trim()];
        }
      } else if (answerText.includes('\n')) {
        // 换行分隔
        answers = answerText.split('\n').map(a => a.trim()).filter(a => a);
      } else if (answerText.includes('，') || answerText.includes(',')) {
        // 逗号分隔
        answers = answerText.split(/[,，]/).map(a => a.trim()).filter(a => a);
      } else {
        answers = [answerText.trim()];
      }
    } else if (Array.isArray(answerText)) {
      // 过滤并清洗数组答案
      answers = answerText
        .map(a => typeof a === 'string' ? a.trim() : String(a))
        .filter(a => a)
        .map(a => a.replace(/^正确答案[:：]\s*/i, ''))  // 去除"正确答案:"前缀
        .filter(a => a && !/^(正确答案|答案)[:：]?$/.test(a));  // 过滤纯标记项
    }
    
    // 填空题：分割并清洗答案
    if (questionData.type === "2") {
      // 先尝试分割单个字符串中的多个答案
      const splitAnswers = [];
      for (const ans of answers) {
        const parts = splitFillBlankAnswers(ans);
        splitAnswers.push(...parts.map(cleanAnswerPrefix));
      }
      answers = splitAnswers;
    }
    
    // 单选/多选验证：答案数量与题型是否匹配
    if (needOptions) {
      // 单选题返回多个答案，跳过
      if (questionData.type === "0" && answers.length > 1) {
        console.log(`✗ 言溪题库 答案异常: 单选题返回了${answers.length}个答案，跳过`);
        return { code: 404, msg: "言溪题库答案与题型不匹配(单选返回多答案)", data: { answer: answers } };
      }
      
      // 多选题只返回1个答案，跳过
      if (questionData.type === "1" && answers.length === 1) {
        console.log(`✗ 言溪题库 答案异常: 多选题只返回了1个答案，跳过`);
        return { code: 404, msg: "言溪题库答案与题型不匹配(多选返回单答案)", data: { answer: answers } };
      }
    }
    
    // 单选/多选验证：答案必须存在于选项中
    if (needOptions && yanxiOptions) {
      // 解析选项
      const optionLines = yanxiOptions.split('\n').filter(o => o.trim());
      const validOptions = optionLines.map(opt => {
        // 提取选项内容：A.杭州 -> 杭州
        const match = opt.match(/^[A-Z][.、]\s*(.+)$/);
        return match ? match[1].trim() : opt.trim();
      });
      
      // 检查每个答案是否在选项中
      const invalidAnswers = answers.filter(ans => {
        // 答案可能是 "A"、"A.杭州" 或 "杭州"
        const ansText = ans.replace(/^[A-Z][.、]\s*/, '').trim();
        
        // 精确匹配，或答案文本完全包含选项
        return !validOptions.some(opt => 
          opt === ans || opt === ansText || ansText.includes(opt)
        );
      });
      
      if (invalidAnswers.length > 0) {
        console.log(`✗ 言溪题库答案不在选项中: ${invalidAnswers.join(', ')}`);
        return { code: 404, msg: "言溪题库答案不在选项中", data: { answer: answers, options: yanxiOptions } };
      }
    }
    
    // 判断题格式校验
    if (questionData.type === "3") {
      const judgeKeywords = /^(正确|错误|对|错|true|false|√|×|是|否|T|F)$/i;
      const allAnswersValid = answers.every(ans => judgeKeywords.test(String(ans).replace(/^[A-Z][.、]\s*/, '').trim()));
      if (!allAnswersValid) {
        console.log(`✗ 言溪题库答案不符合判断题格式: ${answers.join(', ')}`);
        return { code: 404, msg: "言溪题库答案不符合判断题格式", data: { answer: answers } };
      }
    }

    // 判断题标准化：将答案统一为 "正确" 或 "错误"
    if (questionData.type === "3") {
      answers = answers.map(ans => normalizeAnswer(ans, "3"));
    }
    
    console.log("✓ 言溪题库找到答案:", JSON.stringify(answers));
    
    return {
      code: 200,
      msg: "查询成功",
      data: {
        answer: answers,
        num: result.data.times,
        question: result.data.question || questionData.question,
        source: 'yanxi'
      }
    };
    
  } catch (e) {
    console.error("✗ 言溪题库网络错误:", e.message);
    return { 
      code: 500, 
      msg: `言溪题库网络错误: ${e.message}`, 
      data: null 
    };
  }
}

module.exports = {
  // 题库海
  getAvailableTikuKey,
  updateTikuKeyRemaining,
  refreshTikuKeyRemaining,
  refreshAllTikuKeys,
  fetchAnswer,
  // Hive-Net
  fetchHiveNet,
  // UCUC
  fetchUcuc,
  // 言溪
  fetchYanxi,
  // 答案解析
  parseAnswer
};
