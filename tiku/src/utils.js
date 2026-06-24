// ==================== 工具函数 ====================

const crypto = require('crypto');

// SHA256哈希（Node.js版本）
function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

// 去除所有标点符号（用于选项/答案的模糊匹配）
function stripPunctuation(str) {
  return str.replace(/[，。！？、；：""''（）【】\s，.!?;:'"()\[\]]/g, '');
}

// 标准化答案（用于比较和缓存）
function normalizeAnswer(answer, type = null) {
  let normalized = answer.trim()
    .toLowerCase();
  
  // 移除反斜杠（AI 可能返回转义后的引号，如 \"，导致匹配失败）
  normalized = normalized.replace(/\\/g, '');
  
  // 选择题（单选/多选）：去除选项前缀（如 "A、"、"A."、"A:"、"A)" 等）
  if (type === "0" || type === "1") {
    // 去除字母+分隔符前缀：A. A、 A: A： A) 等
    normalized = normalized.replace(/^[a-z][.、:：)\s]+/, '').trim();
  }
  
  // 判断题同义词标准化（提前处理，避免标点移除影响）
  if (type === "3" || !type) {
    const judgeAnswer = normalized.replace(/[，。！？、；：""''（）【】\s]/g, '').replace(/[,\.!?;:'"()\[\]]/g, '');
    if (['对', '正确', '√', '✓', 'true', 't', '是', 'yes'].includes(judgeAnswer)) {
      return '正确';
    } else if (['错', '错误', '×', '✗', 'false', 'f', '否', 'no'].includes(judgeAnswer)) {
      return '错误';
    }
  }
  
  // 填空题特殊处理
  if (type === "2" || !type) {
    // 数字格式标准化（去除末尾多余的0）
    // "100.0" → "100", "0.50" → "0.5"
    const numMatch = normalized.match(/^(\d+\.\d+)$/);
    if (numMatch) {
      normalized = parseFloat(numMatch[1]).toString();
    }
  }
  
  // 最后移除标点和空格（但不移除数字中的小数点）
  normalized = normalized
    .replace(/[，。！？、；：""''（）【】\s]/g, '')  // 移除中文标点和空格
    .replace(/[,!?;:'"()\[\]]/g, '');  // 移除英文标点（保留小数点）
  
  return normalized;
}

// 校验答案格式
function validateAnswer(type, answer, options = null) {
  if (!answer || !Array.isArray(answer)) {
    return { valid: false, reason: "答案格式错误：必须为数组" };
  }
  
  if (type === "0" && answer.length !== 1) {
    return { valid: false, reason: `单选题答案数量错误：期望1个，实际${answer.length}个` };
  }
  
  if (type === "3") {
    // 先检查答案是否为空
    if (!answer[0]) {
      return { valid: false, reason: "判断题答案为空" };
    }
    
    const validValues = ["正确", "错误", "对", "错", "√", "×", "✓", "✗", "true", "false", "t", "f"];
    const normalizedAnswer = String(answer[0]).trim()
      .replace(/[，。！？、；：""''（）【】\s，.!?;:'"()\[\]]/g, '')
      .toLowerCase();
    // 精确匹配，不用includes避免"答复报告的对..."误匹配
    if (!validValues.some(v => normalizedAnswer === v)) {
      return { valid: false, reason: `判断题答案格式错误：${answer[0]}` };
    }
  }
  
  if (type === "1" && answer.length === 1) {
    return { valid: false, reason: "多选题答案数量错误：不能只有1个答案" };
  }

  if ((type === "1" || type === "2") && answer.length === 0) {
    return { valid: false, reason: `${type === "1" ? "多选" : "填空"}题答案为空` };
  }
  
  // 排序题校验：答案格式为数组，元素为字母 A/B/C/D 等
  if (type === "13") {
    if (answer.length === 0) {
      return { valid: false, reason: "排序题答案为空" };
    }
    
    // 1. 格式校验：必须是单个字母
    const validPattern = /^[A-Za-z]$/;
    const invalidFormat = answer.filter(a => !validPattern.test(String(a).trim()));
    if (invalidFormat.length > 0) {
      return { valid: false, reason: `排序题答案格式错误，应为单个字母: ${invalidFormat.join(', ')}` };
    }
    
    // 2. 重复校验：不能有重复字母
    const uniqueAnswers = new Set(answer.map(a => a.toUpperCase()));
    if (uniqueAnswers.size !== answer.length) {
      return { valid: false, reason: "排序题答案包含重复字母" };
    }
    
    // 3. 选项校验：答案字母必须在选项中
    if (options) {
      // 提取选项字母（从选项文本中提取A/B/C/D等）
      let optionLetters = [];
      try {
        const optionsData = JSON.parse(options);
        const optionArray = Array.isArray(optionsData) ? optionsData : String(optionsData).split('\n').filter(o => o.trim());
        
        // 从选项文本提取字母前缀（如"A. 北京" → "A"）
        optionLetters = optionArray.map(opt => {
          const match = String(opt).match(/^([A-Za-z])[.、)\s]/);
          return match ? match[1].toUpperCase() : null;
        }).filter(letter => letter);
      } catch (e) {
        // 解析失败，跳过选项校验
      }
      
      if (optionLetters.length > 0) {
        // 检查答案字母是否都在选项中
        const invalidLetters = answer.filter(a => !optionLetters.includes(a.toUpperCase()));
        if (invalidLetters.length > 0) {
          return { valid: false, reason: `排序题答案字母不在选项中: ${invalidLetters.join(', ')}` };
        }
      }
    }
  }
  
  if (answer.some(a => !a || (typeof a === 'string' && a.trim() === ''))) {
    return { valid: false, reason: "答案包含空内容" };
  }
  
  // 单选/多选题校验：答案必须存在于选项中
  if ((type === "0" || type === "1") && options) {
    // 统一选项为数组格式
    let optionLines;
    if (Array.isArray(options)) {
      optionLines = options.map(o => String(o).trim()).filter(o => o);
    } else if (typeof options === 'string') {
      if (options.includes('\n')) {
        optionLines = options.split('\n').filter(o => o.trim());
      } else {
        optionLines = options.split(/[,\s]+/).filter(o => o.trim());
      }
    } else {
      optionLines = [];
    }

    const validOptions = optionLines.map(opt => {
      // 提取选项内容：A.杭州 -> 杭州
      const match = opt.match(/^[A-Za-z][.、)\s]+(.+)$/);
      return match ? match[1].trim() : opt.trim();
    }).filter(opt => opt);

    if (validOptions.length > 0) {
      // 清洗选项中的标记（如 "(正确答案)"）和统一引号
      const cleanedOptions = validOptions.map(opt => 
        opt.replace(/（正确答案）|\(正确答案\)|【正确答案】|\[正确答案\]/gi, '')
           .replace(/（正确选项）|\(正确选项\)|【正确选项】|\[正确选项\]/gi, '')
           .replace(/\n.*正确答案.*$/gi, '')  // 清理换行后的标注信息
           .replace(/["""''「」『』【】]/g, '')  // 统一引号：移除所有类型的引号
           .trim()
      );
      
      // 检查每个答案是否在选项中（标准化后匹配）
      const invalidAnswers = answer.filter(ans => {
        const ansText = typeof ans === 'string' ? ans.replace(/^[A-Za-z][.、)\s]+/, '').trim() : String(ans);
        const normalizedAns = normalizeAnswer(ansText, type);
        
        // 标准化后匹配：答案标准化后必须等于某个选项的标准化结果
        return !cleanedOptions.some(opt => {
          const normalizedOpt = normalizeAnswer(opt, type);
          return normalizedOpt === normalizedAns;
        });
      });
      
      if (invalidAnswers.length > 0) {
        return { valid: false, reason: `答案不在选项中: ${invalidAnswers.map(a => `"${a}"`).join(', ')}` };
      }
    }
  }
  
  return { valid: true };
}

// 获取题型说明
function getTypeDescription(type) {
  const types = {
    "0": "单选题",
    "1": "多选题",
    "2": "填空题",
    "3": "判断题",
    "4": "简答题",
    "5": "名词解释",
    "6": "论述题",
    "7": "计算题",
    "11": "连线题",
    "13": "排序题"
  };
  return types[type] || "未知题型";
}

// 标准化选项格式（将各种格式转换为统一的数组格式）
function normalizeOptions(options) {
  if (!options) return [];
  
  // 提取选项内容的辅助函数（更严格的匹配）
  const extractOptionText = (opt) => {
    opt = String(opt).trim();
    if (!opt) return null;
    
    // 匹配选项前缀：A. A、 A: A： A) A（后面必须有实际内容）
    // 注意：) 需要转义，但 A) 格式要求后面有内容
    const match = opt.match(/^[A-Za-z][.、:：)]\s*(.+)$/);
    if (match && match[1].trim()) {
      // 去除引号（中文引号、英文引号、单引号）
      let text = match[1].trim();
      text = text.replace(/^[""''"]+/, '').replace(/[""''"]+$/, '').trim();
      return text;
    }
    
    // 如果没有选项前缀，直接返回原始内容（过滤掉纯标点符号和引号）
    const cleanText = opt
      .replace(/^[,，.、:：\s]+/, '')  // 去除开头标点（不包含括号）
      .replace(/[,，.、:：\s]+$/, '')  // 去除末尾标点（不包含括号）
      .replace(/^[""''"]+/, '')  // 去除开头引号
      .replace(/[""''"]+$/, '')  // 去除结尾引号
      .trim();
    return cleanText.length > 0 ? cleanText : null;
  };
  
  // 已经是数组，直接返回
  if (Array.isArray(options)) {
    return options.map(extractOptionText).filter(opt => opt !== null);
  }
  
  // 字符串格式
  if (typeof options === 'string') {
    let optionsStr = options.trim();
    
    if (!optionsStr) return [];
    
    // 尝试 JSON 解析（可能是 JSON 字符串）
    if (optionsStr.startsWith('[')) {
      try {
        const parsed = JSON.parse(optionsStr);
        if (Array.isArray(parsed)) {
          return normalizeOptions(parsed);
        }
      } catch (e) { console.warn('解析选项JSON失败:', optionsStr.substring(0, 50)); }
    }
    
    // 换行符分隔（优先级最高）
    if (optionsStr.includes('\n')) {
      return optionsStr.split('\n')
        .map(extractOptionText)
        .filter(opt => opt !== null);
    }
    
    // 检查是否有选项前缀（如 A. B. C. 或 A: B: C:）
    // 使用更严格的匹配：字母后面必须是 . : 、 ）等
    const prefixMatch = optionsStr.match(/[A-Za-z][.、:：)]/g);
    if (prefixMatch && prefixMatch.length >= 2) {
      // 按选项前缀分割（在字母+分隔符前分割）
      return optionsStr
        .split(/(?=[A-Za-z][.、:：)])/)
        .map(extractOptionText)
        .filter(opt => opt !== null);
    }
    
    // 逗号分隔（最后的后备方案）
    return optionsStr.split(',')
      .map(extractOptionText)
      .filter(opt => opt !== null);
  }
  
  return [];
}

// 去标点符号后重新匹配答案与选项（仅用于选择题答案不在选项中的重试）
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
      console.log(`[OK] 去标点匹配成功: "${ans}" -> "${String(match).trim()}"`);
    } else {
      return null; // 有答案匹配不上，放弃
    }
  }
  return fixed;
}

// 答案校验+清洗+重试的统一函数
// 返回 { valid, reason, answers } - answers 可能被 retryWithStrippedPunctuation 修正
function validateAndCleanAnswer(type, answers, options) {
  let currentAnswers = answers;
  let validation = validateAnswer(type, currentAnswers, options);

  if (!validation.valid && (type === "0" || type === "1") && validation.reason.includes('答案不在选项中')) {
    const questionData = { options };
    const fixed = retryWithStrippedPunctuation(questionData, currentAnswers);
    if (fixed) {
      currentAnswers = fixed;
      validation = validateAnswer(type, currentAnswers, options);
    }
  }

  return { valid: validation.valid, reason: validation.reason, answers: currentAnswers };
}

// 统一AI API调用函数（提取自 ai-mode/normal-mode/verify-mode 的重复逻辑）
// 参数: { apiUrl, apiKey, model, body, timeoutMs }
// 返回: { result, usage } 或抛出异常
async function callAIApi({ apiUrl, apiKey, body, timeoutMs = 300000 }) {
  const response = await fetchWithTimeout(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  }, timeoutMs);

  const result = await response.json();
  const usage = result.usage || null;
  return { result, usage };
}

// 带超时的fetch，默认15秒超时
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error(`请求超时(${timeoutMs}ms): ${url}`);
    }
    throw e;
  }
}

// 统一IP提取：优先信任 Nginx 传入的 x-real-ip，回退到 socket 地址
function getClientIp(c) {
  const xri = c.req.header('x-real-ip');
  const rawReq = c.req.raw;
  const socketIp = rawReq?.socket?.remoteAddress;
  let clientIp = xri || socketIp || '127.0.0.1';
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }
  return clientIp;
}

module.exports = {
  sha256,
  stripPunctuation,
  normalizeAnswer,
  normalizeOptions,
  validateAnswer,
  getTypeDescription,
  retryWithStrippedPunctuation,
  getClientIp,
  fetchWithTimeout,
  validateAndCleanAnswer,
  callAIApi
};
