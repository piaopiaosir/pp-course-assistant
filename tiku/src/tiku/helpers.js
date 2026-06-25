const { sha256, normalizeOptions, getInvalidSortFormatItems, hasDuplicateSortAnswers, extractOptionLetters, getInvalidSortOptionLetters } = require('../utils');

// 从AI返回内容中提取JSON（处理AI在JSON前后输出分析文字、markdown代码块包裹等情况）
function extractJsonFromContent(content) {
  if (!content) return null;

  // 预处理：去掉markdown代码块标记和BOM/零宽字符
  content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  content = content.replace(/[\uFEFF\u200B\u200C\u200D\u00A0]/g, '');

  // 步骤1（优先）：<answer>标签提取
  const answerTagMatch = content.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerTagMatch) {
    const tagContent = answerTagMatch[1].trim();
    const tagResult = tryParseJson(tagContent);
    if (tagResult) return tagResult;
  }

  // 步骤2：从"answer"关键字后提取数组
  const arrayResult = extractAnswerArray(content);
  if (arrayResult) return arrayResult;

  // 步骤3：贪婪匹配最后一个包含"answer"的JSON对象
  const greedyMatches = content.match(/\{[\s\S]*"answer"[\s\S]*\}/g);
  if (greedyMatches && greedyMatches.length > 0) {
    for (let i = greedyMatches.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(greedyMatches[i]);
        if (parsed.answer !== undefined) return parsed;
      } catch (e) { continue; }
    }
  }

  return null;
}

// 尝试将文本解析为包含answer字段的JSON（对象或数组）
function tryParseJson(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed.answer !== undefined) return parsed;
    if (Array.isArray(parsed)) return { answer: parsed };
  } catch (e) { /* 继续尝试 */ }
  // 不是纯JSON，尝试从中提取answer数组
  return extractAnswerArray(text);
}

// 从文本中定位"answer"关键字，提取其后的数组内容
function extractAnswerArray(content) {
  const answerIdx = content.indexOf('"answer"');
  if (answerIdx === -1) return null;

  const bracketStart = content.indexOf('[', answerIdx);
  if (bracketStart === -1) return null;

  // 按括号深度匹配找到数组结束位置
  let depth = 0;
  let bracketEnd = -1;
  for (let i = bracketStart; i < content.length; i++) {
    if (content[i] === '[') depth++;
    else if (content[i] === ']') {
      depth--;
      if (depth === 0) { bracketEnd = i; break; }
    }
  }
  if (bracketEnd === -1) return null;

  const arrayStr = content.substring(bracketStart, bracketEnd + 1);

  // 优先标准JSON.parse
  try {
    const parsed = JSON.parse(arrayStr);
    if (Array.isArray(parsed)) return { answer: parsed };
  } catch (e) {
    // JSON.parse失败，手动提取引号内的字符串元素
    return extractQuotedStrings(arrayStr);
  }
  return null;
}

// 从数组字符串中手动提取引号内的元素（JSON.parse失败时的降级方案）
function extractQuotedStrings(arrayStr) {
  const answers = [];
  let i = 1; // 跳过开头的 [
  while (i < arrayStr.length - 1) {
    const start = arrayStr.indexOf('"', i);
    if (start === -1) break;
    let end = start + 1;
    while (end < arrayStr.length) {
      if (arrayStr[end] === '"') {
        // 确认这个引号是元素结束（后面是逗号、空白或 ]）
        let next = end + 1;
        while (next < arrayStr.length && /\s/.test(arrayStr[next])) next++;
        if (next < arrayStr.length && (arrayStr[next] === ',' || arrayStr[next] === ']')) {
          break;
        }
      }
      end++;
    }
    if (end < arrayStr.length) {
      answers.push(arrayStr.substring(start + 1, end));
      i = end + 1;
    } else break;
  }
  return answers.length > 0 ? { answer: answers } : null;
}

// 生成题目哈希
// 标准化题目文本：去除题号、题型标签、空括号等干扰内容
function normalizeQuestion(question) {
  if (!question) return '';
  return question
    // 去除题型标签：[单选题] [多选题] [判断题] [填空题] 等
    .replace(/\[(?:单选题|多选题|判断题|填空题|简答题)\]/g, '')
    // 去除题号前缀：1. 2. 10. 等（必须是行首或紧跟换行）
    .replace(/(?:^|\n)\s*\d+[.、]\s*/g, '')
    // 去除空括号：() ( ) (   ) （ ） （  ）等
    .replace(/[（(]\s*[)）]/g, '')
    // 去除多余空格（连续空格合并为一个）
    .replace(/\s{2,}/g, ' ')
    // 去除首尾空白
    .trim();
}

function generateQuestionHash(question, options, type) {
  // 标准化题目和选项后再计算哈希，确保同一题目不同格式生成相同哈希
  const normalizedQ = normalizeQuestion(question);
  const normalizedOptions = normalizeOptions(options);
  // 对选项排序后再拼接，这样选项内容相同但顺序不同的题目会生成相同哈希
  const sortedOptions = Array.isArray(normalizedOptions) ? [...normalizedOptions].sort() : normalizedOptions;
  const optionsStr = Array.isArray(sortedOptions) ? sortedOptions.join('|') : String(sortedOptions);
  const content = `${normalizedQ}|${optionsStr}|${type}`;
  return sha256(content);
}

/**
 * 从题目文本中提取图片URL，并清理img标签
 * @param {string} text - 原始题目文本
 * @returns {{ cleanedQuestion: string, imageUrls: string[] }} 清理后的文本和图片URL列表
 */
function extractImageUrls(text) {
  const imageUrls = [];
  let cleanedQuestion = text || '';
  
  // 提取 <img src="..." /> 中的URL（引号含中文""和英文""）
  const imgRegex = /<img\s+src\s*=\s*[""\u201C\u201D]([^""\u201C\u201D]+)[""\u201C\u201D][^>]*\/?>/gi;
  cleanedQuestion = cleanedQuestion.replace(imgRegex, (match, url) => {
    imageUrls.push(url);
    return ''; // 移除img标签
  });
  
  // 清理多余空白
  cleanedQuestion = cleanedQuestion.replace(/\s{2,}/g, ' ').trim();
  
  return { cleanedQuestion, imageUrls };
}

/**
 * 清理AI返回的答案，去除"选项X"/"A."等前缀
 * prompt中选项格式化为"A. 文本"，AI有时会返回"A. 文本"或"选项1 文本"而非纯文本
 * 
 * 安全策略：只有当去掉前缀后的文本与某个选项完全一致时，才确认是前缀并删除；
 * 否则保留原答案，避免误删合法内容（如"C语言"、"B细胞"、"A股"等）
 * 
 * @param {string} answer - AI返回的单个答案
 * @param {Array} [options] - 题目选项数组，用于对照验证
 */
function cleanAiAnswer(answer, options) {
  if (typeof answer !== 'string') return answer;

  // 如果没有选项列表，只做最保守的清理：仅去除"选项X:"格式（几乎不会误伤）
  if (!Array.isArray(options) || options.length === 0) {
    const cleaned = answer.replace(/^选项\d+[\s:：]+/, '').trim();
    return cleaned || answer;
  }

  // 标准化选项文本用于对照
  const normalizedOptions = options.map(opt => String(opt).trim());

  // 尝试去除"选项X:"或"选项X "前缀
  const afterOptionPrefix = answer.replace(/^选项\d+[\s:：]+/, '').trim();
  if (afterOptionPrefix && afterOptionPrefix !== answer.trim() && normalizedOptions.includes(afterOptionPrefix)) {
    return afterOptionPrefix;
  }

  // 尝试去除"A. "或"A。："等字母编号前缀
  const letterMatch = answer.match(/^([A-Z])[\s.：:]+\s*([\s\S]*)$/);
  if (letterMatch) {
    const afterLetter = letterMatch[2].trim();
    if (afterLetter && normalizedOptions.includes(afterLetter)) {
      return afterLetter;
    }
  }

  // 任何前缀去除后都不匹配选项，保留原答案
  return answer;
}

/**
 * 连线题答案标准化：确保每个元素为纯大写字母
 * 提示词已要求AI返回纯字母数组如["C","D","A"]，此函数仅做兜底处理：
 *   - "1-C" → "C"（AI偶尔不遵守格式时的兜底）
 *   - 统一大写
 * @param {Array} answer - AI返回的answer数组
 * @param {string} questionType - 题目类型
 * @returns {Array} 标准化后的answer数组
 */
function normalizeMatchingAnswer(answer, questionType) {
  if (String(questionType) !== '11') return answer;
  if (!Array.isArray(answer) || answer.length === 0) return answer;
  
  return answer.map(item => {
    const s = String(item).trim();
    // 兜底：提取"序号-字母"中的字母
    const matchFormat = s.match(/^\d+\s*[—\-–、.。:：]\s*([A-Za-z])$/);
    if (matchFormat) return matchFormat[1].toUpperCase();
    return s.toUpperCase();
  });
}

/**
 * 答案最终清理：所有答案返回给客户端前统一调用
 * 清理规则与答案来源和题型无关，属于公共清洗逻辑
 */
function finalCleanAnswer(answer) {
  if (typeof answer !== 'string') return answer;
  return answer
    .replace(/#+$/, '')               // 去除末尾 # 标记（言溪等题库返回的答案可能带 # 后缀）
    .replace(/[;；,，]$/, '')          // 去除末尾分号/逗号（言溪填空题答案可能带 ; 后缀）
    .replace(/（正确答案）|\(正确答案\)|【正确答案】|\[正确答案\]/gi, '')
    .replace(/（正确选项）|\(正确选项\)|【正确选项】|\[正确选项\]/gi, '')
    .replace(/（正确）|\(正确\)|【正确】|\[正确\]/gi, '')
    .replace(/（答案）|\(答案\)|【答案】|\[答案\]/gi, '')
    .trim() || answer;
}

/**
 * 清洗单个答案的公共函数（返回用户端和保存缓存共用）
 * 去除引号、#号、正确答案标记等
 */
function cleanSingleAnswer(a) {
  if (typeof a !== 'string') return a;
  return finalCleanAnswer(a
    .replace(/^[""''"]+/, '')  // 去除开头引号
    .replace(/[""''"]+$/, '')  // 去除结尾引号
  );
}

/**
 * 清理 answerData 中的所有答案（公共出口）
 */
function cleanAnswerData(answerData) {
  if (answerData?.data?.answer) {
    if (Array.isArray(answerData.data.answer)) {
      answerData.data.answer = answerData.data.answer.map(cleanSingleAnswer).filter(a => a);
    } else if (typeof answerData.data.answer === 'string') {
      answerData.data.answer = cleanSingleAnswer(answerData.data.answer);
    }
  }
  return answerData;
}

/**
 * 合并被AI拆分的选项
 * AI可能把"知晓...迹象，以及维持..."拆成"知晓...迹象"和"以及维持..."两段
 * 本函数检测拆分并合并回原始选项文本
 */
function mergeSplitAnswers(aiAnswers, originalOptions) {
  if (!Array.isArray(originalOptions) || !Array.isArray(aiAnswers)) return aiAnswers;

  const merged = [];
  const used = new Set();

  for (const opt of originalOptions) {
    const trimmedOpt = opt.trim();
    if (merged.includes(trimmedOpt) || used.has(trimmedOpt)) continue;

    // 检查是否有AI答案是这个选项的子串（说明被拆分了）
    const isFullOption = aiAnswers.some(ans => ans.trim() === trimmedOpt);
    if (isFullOption) {
      merged.push(trimmedOpt);
      used.add(trimmedOpt);
      continue;
    }

    // 检查哪些AI答案是这个选项的子串（排除已被其他选项完全匹配的答案）
    const subAnswers = aiAnswers.filter(ans => {
      const t = ans.trim();
      return t.length > 0 && trimmedOpt.includes(t) && t !== trimmedOpt && !used.has(t);
    });

    if (subAnswers.length >= 1) {
      // 合并：这些子串都属于同一个原始选项，用原始选项替换
      merged.push(trimmedOpt);
      subAnswers.forEach(a => used.add(a.trim()));
    }
  }

  // 添加未被合并的答案（不在任何原始选项中的）
  for (const ans of aiAnswers) {
    const t = ans.trim();
    if (!used.has(t) && !merged.includes(t)) {
      // 检查是否已作为子串被合并
      const alreadyMerged = merged.some(m => m.includes(t) && m !== t);
      if (!alreadyMerged) {
        merged.push(t);
      }
    }
  }

  return merged.length > 0 ? merged : aiAnswers;
}

// 检查答案是否合理（返回 { reasonable: boolean, reason: string }）
function checkAnswerReasonable(answer, questionType, options) {
  if (!Array.isArray(answer) || answer.length === 0) {
    return { reasonable: false, reason: "答案为空或格式错误" };
  }
  
  // 判断题：答案必须是标准判断值，不能是大段解释文字
  if (questionType === "3") {
    const judgeValues = ["正确", "错误", "对", "错", "√", "×", "✓", "✗", "true", "false", "t", "f"];
    const normalized = answer[0]?.trim()
      .replace(/[，。！？、；：""''（）【】\s，.!?;:'"()\[\]]/g, '')
      .toLowerCase();
    if (!judgeValues.includes(normalized)) {
      return { reasonable: false, reason: `判断题答案格式异常: "${answer[0]}"` };
    }
  }
  
  // 连线题：答案必须是单个字母
  if (questionType === "11") {
    const invalidFormat = answer.filter(a => !/^[A-Za-z]$/.test(String(a).trim()));
    if (invalidFormat.length > 0) {
      return { reasonable: false, reason: `连线题答案格式错误，应为单个字母: ${invalidFormat.join(', ')}` };
    }
  }
  
  // 排序题：答案必须是单个字母（A/B/C/D等）（D-09去重：复用公共辅助函数）
  if (questionType === "13") {
    // 1. 格式校验：必须是单个字母
    const invalidFormat = getInvalidSortFormatItems(answer);
    if (invalidFormat.length > 0) {
      return { reasonable: false, reason: `排序题答案格式错误，应为单个字母: ${invalidFormat.join(', ')}` };
    }

    // 2. 重复校验：不能有重复字母
    if (hasDuplicateSortAnswers(answer)) {
      return { reasonable: false, reason: "排序题答案包含重复字母" };
    }

    // 3. 选项校验：答案字母必须在选项中
    if (options) {
      const optionLetters = extractOptionLetters(options);
      const invalidLetters = getInvalidSortOptionLetters(answer, optionLetters);
      if (invalidLetters.length > 0) {
        return { reasonable: false, reason: `排序题答案字母不在选项中: ${invalidLetters.join(', ')}` };
      }
    }
  }
  
  // 单选题和多选题需要检查答案是否在选项中
  if ((questionType === "0" || questionType === "1") && options) {
    // 统一选项为数组格式
    let optionList;
    if (Array.isArray(options)) {
      optionList = options.map(o => String(o).trim()).filter(o => o);
    } else if (typeof options === 'string') {
      optionList = options.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    } else {
      optionList = [];
    }

    // 检查每个答案是否在选项中（严格匹配：答案必须完全等于选项文本）
    const notFoundAnswers = [];
    for (const ans of answer) {
      const normalizedAns = ans.trim();
      const found = optionList.some(opt => {
        // 完全匹配
        if (opt === normalizedAns) return true;
        // 去掉选项前缀后匹配（如 "A. 改革" → "改革"）
        const cleanOpt = opt.replace(/^[A-Za-z][.、)\s]+/, '').trim();
        if (cleanOpt === normalizedAns) return true;
        return false;
      });

      if (!found) {
        notFoundAnswers.push(normalizedAns);
      }
    }

    if (notFoundAnswers.length > 0) {
      return {
        reasonable: false,
        reason: `答案不在选项中: ${notFoundAnswers.map(a => `"${a}"`).join(', ')}`
      };
    }
  }
  
  // 单选题：只能有一个答案
  if (questionType === "0" && answer.length > 1) {
    return { reasonable: false, reason: `单选题返回了${answer.length}个答案` };
  }
  
  // 多选题：不能只有一个答案
  if (questionType === "1") {
    if (answer.length === 1) {
      return { reasonable: false, reason: "多选题只返回了1个答案" };
    }
  }
  
  return { reasonable: true, reason: "答案合理" };
}

// D-03去重：安全包装版，异常时返回"合理"避免阻塞流程
function safeCheckAnswerReasonable(answer, questionType, options) {
  try {
    return checkAnswerReasonable(answer, questionType, options);
  } catch (e) {
    console.log('[WARN] checkAnswerReasonable异常:', e.message);
    return { reasonable: true, reason: '' };
  }
}

// D-06去重：清洗AI答案并标准化格式（清理选项前缀 + 连线题标准化）
function cleanAndNormalizeAnswer(answer, questionData) {
  if (Array.isArray(answer)) {
    answer = answer.map(a => cleanAiAnswer(a, questionData.options));
  }
  answer = normalizeMatchingAnswer(answer, questionData.type);
  return answer;
}

module.exports = {
  // JSON 解析
  extractJsonFromContent,
  tryParseJson,
  extractAnswerArray,
  extractQuotedStrings,
  // 哈希与题目标准化
  normalizeQuestion,
  generateQuestionHash,
  // 图片提取
  extractImageUrls,
  // 答案清洗
  cleanAiAnswer,
  normalizeMatchingAnswer,
  finalCleanAnswer,
  cleanSingleAnswer,
  cleanAnswerData,
  mergeSplitAnswers,
  // 答案合理性校验
  checkAnswerReasonable,
  safeCheckAnswerReasonable,
  // 答案清洗+标准化
  cleanAndNormalizeAnswer
};
