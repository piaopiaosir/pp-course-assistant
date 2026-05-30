const { db, getEnv, TIKU_API_URL, HIVENET_API_URL, YANXI_API_URL, SERVER_ID } = require('./config');
const { sha256, normalizeAnswer, normalizeOptions, validateAnswer, getTypeDescription } = require('./utils');

// 从AI返回内容中提取JSON（处理AI在JSON前后输出分析文字、markdown代码块包裹等情况）
function extractJsonFromContent(content) {
  if (!content) return null;

  // 预处理：去掉markdown代码块标记和BOM/零宽字符
  content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  content = content.replace(/[\uFEFF\u200B\u200C\u200D\u00A0]/g, '');

  // 方法0（优先）：从<answer>标签中提取JSON
  const answerTagMatch = content.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerTagMatch) {
    const tagContent = answerTagMatch[1].trim();
    try {
      const parsed = JSON.parse(tagContent);
      if (parsed.answer !== undefined) return parsed;
    } catch (e) { /* 继续尝试 */ }
    // 标签内不是纯JSON，尝试从标签内容中用方法1/2提取
    const tagResult = extractJsonFromArray(tagContent);
    if (tagResult) return tagResult;
  }

  // 方法1：提取"answer"后面的数组
  const arrayResult = extractJsonFromArray(content);
  if (arrayResult) return arrayResult;

  // 方法2：贪婪匹配最后一个完整的{..."answer"...}对象
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

// 从文本中提取 "answer": [...] 数组部分
function extractJsonFromArray(content) {
  const answerIdx = content.indexOf('"answer"');
  if (answerIdx === -1) return null;

  const bracketStart = content.indexOf('[', answerIdx);
  if (bracketStart === -1) return null;

  // 匹配括号深度找到数组结束位置
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

  // 尝试标准 JSON.parse
  try {
    const parsed = JSON.parse(arrayStr);
    if (Array.isArray(parsed)) return { answer: parsed };
  } catch (e) {
    // 手动提取：找到引号内的字符串元素
    const answers = [];
    let i = 1;
    while (i < arrayStr.length - 1) {
      const start = arrayStr.indexOf('"', i);
      if (start === -1) break;
      let end = start + 1;
      while (end < arrayStr.length) {
        if (arrayStr[end] === '"') {
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
    if (answers.length > 0) return { answer: answers };
  }
  return null;
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

// 统一的prompt构建函数
// 返回 { system: string, user: string } 结构，分离系统指令和用户题目
function buildPrompt(questionData, enableWebSearch = false) {
  const q = questionData.question;
  const opts = questionData.options;

  // 格式化选项为字母编号列表（A. B. C. D.格式，与标准考试格式一致）
  let formattedOptions;
  if (Array.isArray(opts)) {
    formattedOptions = opts.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
  } else {
    formattedOptions = opts;
  }

  // 通用规则部分（所有题型共享）
  const commonRules = [
    '【关键规则】',
    '- <answer>标签内只放纯JSON，不要用markdown代码块包裹。',
    '- answer数组中的文本必须与题目选项冒号后面的文本完全一致，不要拆分、修改或合并选项文本。',
    '- 不要根据题目关键词自由联想、推测或编造答案，必须基于知识认真推理后给出确定答案。'
  ];
  if (enableWebSearch) {
    commonRules.push('- 你已启用联网搜索工具。搜索策略：①先判断题目是否需要联网搜索信息；②搜索时用精确的中文关键词；③搜索后立即判断：如果结果已能确定答案就直接输出，不要继续搜索。');
  }

  // 根据题型定制第二步分析指令
  const stepTwoByType = {
    "0":  '第二步：逐个分析每个选项，明确指出它为什么正确或错误，排除干扰项，给出确定的排除理由。',
    "1":  '第二步：逐个分析每个选项，明确判断它应该选还是不选，给出确定的判断依据。注意：宁可漏选也不要错选，对不确定的选项宁可不选。',
    "3":  '第二步：分析题目陈述的逻辑是否成立，逐一检验陈述中的关键命题是否为真，是否存在以偏概全、偷换概念等逻辑谬误。',
    "2":  '第二步：识别题目考查的具体知识点，结合学科原理推理出每个空应填的最精确内容，注意空格数量和语境。',
    "11": '第二步：逐个分析左侧每个题目与右侧哪个选项匹配，给出匹配理由，确保每个左侧题目只对应一个右侧选项。',
    "13": '第二步：分析各选项之间的逻辑关系（如时间先后、因果链条、递进层次等），确定它们的排列顺序。',
    "4":  '第二步：分析题目考查的核心问题，梳理答题要点，按逻辑顺序组织答案，确保每个要点有理有据、条理清晰。',
    "default": '第二步：分析题目考查的核心问题，梳理答题要点，按逻辑顺序组织答案，确保每个要点有理有据、条理清晰。'
  };

  // 第三步输出指令也按题型定制
  const stepThreeByType = {
    "0":  '第三步：在<answer>标签内输出最终答案的纯JSON，answer数组只含一个正确选项的完整文本。分析过程写在<analysis>标签内。',
    "1":  '第三步：在<answer>标签内输出最终答案的纯JSON，answer数组包含所有确定正确的选项文本。分析过程写在<analysis>标签内。',
    "3":  '第三步：在<answer>标签内输出最终答案的纯JSON，answer数组只含"正确"或"错误"。分析过程写在<analysis>标签内。',
    "2":  '第三步：在<answer>标签内输出最终答案的纯JSON，answer数组按空格顺序依次填写。分析过程写在<analysis>标签内。',
    "11": '第三步：在<answer>标签内输出最终答案的纯JSON，answer数组按左侧题目顺序，每项只写对应右侧选项的字母（如"C"），不要写序号。分析过程写在<analysis>标签内。',
    "13": '第三步：在<answer>标签内输出最终答案的纯JSON，answer数组按正确顺序列出选项字母。分析过程写在<analysis>标签内。',
    "4":  '第三步：在<answer>标签内输出最终答案的纯JSON，answer数组每个元素是一个答题要点，合并后构成完整答案。分析过程写在<analysis>标签内。',
    "default": '第三步：在<answer>标签内输出最终答案的纯JSON，answer数组每个元素是一个答题要点，合并后构成完整答案。分析过程写在<analysis>标签内。'
  };

  const qType = questionData.type || "default";
  const stepTwo = stepTwoByType[qType] || stepTwoByType["default"];
  const stepThree = stepThreeByType[qType] || stepThreeByType["default"];

  const systemParts = [
    '你是一个精准的答题助手，采用三步分析法作答。',
    '',
    '【三步分析法】',
    '第一步：识别题目所属的学科领域',
    stepTwo,
    stepThree,
    '',
    ...commonRules
  ];
  const system = systemParts.join('\n');

  switch (questionData.type) {
    case "0":
      return {
        system,
        user: `单选题：
${q}
${formattedOptions}

示例：<answer>{"answer":["北京"]}</answer>，不要输出 {"answer":["A"]} 或 {"answer":["1"]}。`
      };
    case "1": {
      const optCount = Array.isArray(opts) ? opts.length : opts.split('\n').filter(o => o.trim()).length;
      return {
        system,
        user: `多选题：
${q}
${formattedOptions}

共${optCount}个选项。绝对不要拆分任何选项（即使选项内部包含逗号或顿号），不要自己归纳总结。
示例：<answer>{"answer":["实践是检验真理的唯一标准","生产力决定生产关系"]}</answer>`
      };
    }
    case "3":
      return {
        system,
        user: `判断题：${q}

答案只能是"正确"或"错误"，不要输出"对""错""是""否""True""False"等其他变体。
示例：<answer>{"answer":["正确"]}</answer> 或 <answer>{"answer":["错误"]}</answer>`
      };
    case "2":
      return {
        system,
        user: `填空题：${q}

示例：<answer>{"answer":["答案1","答案2"]}</answer>`
      };
    case "13": {
      // 排序题特殊处理：选项用字母A/B/C/D标识
      let sortOptions;
      if (Array.isArray(opts)) {
        sortOptions = opts.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
      } else {
        sortOptions = opts;
      }
      return {
        system,
        user: `排序题：
${q}
${sortOptions}

answer数组中的每个元素必须是选项字母（A/B/C/D等），按正确顺序排列。
示例：<answer>{"answer":["A","B","C","D"]}</answer>`
      };
    }
    case "4":
      return {
        system,
        user: `简答题：${q}

示例：<answer>{"answer":["要点1","要点2","要点3"]}</answer>`
      };
    case "11": {
      // 连线题：选项用字母标识，要求AI返回纯字母数组
      let matchOptions;
      if (Array.isArray(opts)) {
        matchOptions = opts.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
      } else {
        matchOptions = opts;
      }
      return {
        system,
        user: `连线题：
${q}
${matchOptions}

answer数组按左侧题目从上到下的顺序，每项只写对应的右侧选项字母（A/B/C/D等），不要写序号或其他内容。
示例：<answer>{"answer":["C","D","A","B"]}</answer>`
      };
    }
    default:
      return {
        system,
        user: `问答题：${q}

示例：<answer>{"answer":["要点1","要点2","要点3"]}</answer>`
      };
  }
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

    // 检查哪些AI答案是这个选项的子串
    const subAnswers = aiAnswers.filter(ans => {
      const t = ans.trim();
      return t.length > 0 && trimmedOpt.includes(t) && t !== trimmedOpt;
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

// 从缓存获取答案
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
async function saveAnswerToCache(questionHash, question, options, type, answer, source, isCorrect = null) {
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
      console.log("⚠️ 答案校验失败，跳过缓存:", validation.reason);
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
        newAnswerArr = typeof answer === 'string' ? JSON.parse(answer) : answer;
        
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
        // 答案一致，如果需要更新 is_correct 则只更新此字段
        if (isCorrect !== null && cached.is_correct !== isCorrect) {
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

    // 新增或覆盖缓存，is_correct 使用传入值或 NULL
    const isCorrectValue = isCorrect !== null ? isCorrect : null;
    await db.prepare(
      "INSERT INTO answer_cache (question_hash, question, options, type, answer, source, is_correct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE question=?, options=?, type=?, answer=?, source=?, is_correct=?, created_at=?"
    ).run(questionHash, normalizedQuestion, optionsStr, type, answerStr, source, isCorrectValue, now, normalizedQuestion, optionsStr, type, answerStr, source, isCorrectValue, now);
    
    console.log("保存缓存成功:", questionHash.substring(0, 8), "来源:", source, cached ? "(覆盖旧答案)" : "(新增)", isCorrect !== null ? `is_correct=${isCorrect}` : "");
  } catch (e) {
    console.error("保存答案缓存失败:", e.message);
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
    
    console.log(`✅ 单次上报已生效: ${questionHash.substring(0, 8)} (${isCorrect === 1 ? '正确' : '错误'})`);
    
    return { applied, pending: false };
    
  } catch (e) {
    console.error("记录正确性上报失败:", e.message);
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
            
            console.log(`✓ 判断题答案已更正: ${questionHash.substring(0, 8)} "${judgeAnswer}" -> "${reversedAnswer}"`);
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
      console.log(`✓ 更新答案正确性标记: ${questionHash.substring(0, 8)} -> ${isCorrect === 1 ? '正确' : '错误'}`);
      return true;
    } else {
      console.log(`⚠️ 未找到缓存记录: ${questionHash.substring(0, 8)}`);
      return false;
    }
  } catch (e) {
    console.error("应用正确性更新失败:", e.message);
    return false;
  }
}

// 更新答案正确性标记（旧版本，保留向后兼容）
async function updateAnswerCorrectness(questionHash, isCorrect, type) {
  // 直接调用新版本的可信度机制（单次上报视为可信）
  return await applyCorrectnessUpdate(questionHash, isCorrect, type);
}

// 反转判断题答案
function reverseJudgeAnswer(answer) {
  const normalized = answer.trim().toLowerCase();
  
  // 正确 -> 错误
  if (['正确', '对', '√', '✓', 'true', 't', '是'].includes(normalized)) {
    return '错误';
  }
  
  // 错误 -> 正确
  if (['错误', '错', '×', '✗', 'false', 'f', '否'].includes(normalized)) {
    return '正确';
  }
  
  // 无法识别的格式，返回 null
  console.log(`⚠️ 无法识别判断题答案格式: "${answer}"`);
  return null;
}

// 增加AI调用次数
async function incrementAiCalls() {
  try {
    await db.prepare(
      "UPDATE global_stats SET ai_calls_count = ai_calls_count + 1, updated_at = ? WHERE id = 1"
    ).run(Math.floor(Date.now() / 1000));
  } catch (e) {
    console.error("更新AI调用次数失败:", e.message);
  }
}

// 增加题库海调用次数
async function incrementTikuCalls() {
  try {
    await db.prepare(
      "UPDATE global_stats SET tiku_calls_count = tiku_calls_count + 1, updated_at = ? WHERE id = 1"
    ).run(Math.floor(Date.now() / 1000));
    console.log("✓ 题库海调用次数已更新");
  } catch (e) {
    console.error("更新题库海调用次数失败:", e.message);
  }
}

// 更新 Hive-Net 剩余次数
async function updateHiveNetRemaining(remaining) {
  if (remaining === undefined || remaining === null) return;
  
  try {
    await db.prepare(
      "UPDATE global_stats SET hivenet_remaining = ?, updated_at = ? WHERE id = 1"
    ).run(remaining, Math.floor(Date.now() / 1000));
    console.log("✓ Hive-Net 剩余次数已更新:", remaining);
  } catch (e) {
    console.error("更新 Hive-Net 剩余次数失败:", e.message);
  }
}

// 增加 Hive-Net 调用次数
async function incrementHiveNetCalls() {
  try {
    await db.prepare(
      "UPDATE global_stats SET hivenet_calls_count = hivenet_calls_count + 1, updated_at = ? WHERE id = 1"
    ).run(Math.floor(Date.now() / 1000));
    console.log("✓ Hive-Net 调用次数已更新");
  } catch (e) {
    console.error("更新 Hive-Net 调用次数失败:", e.message);
  }
}

// 更新 UCUC 题库剩余次数
async function updateUcucRemaining(remaining) {
  try {
    await db.prepare(
      "UPDATE global_stats SET ucuc_remaining = ?, updated_at = ? WHERE id = 1"
    ).run(remaining, Math.floor(Date.now() / 1000));
    console.log("✓ UCUC 题库剩余次数已更新:", remaining);
  } catch (e) {
    console.error("更新 UCUC 剩余次数失败:", e.message);
  }
}

// 增加 UCUC 题库调用次数
async function incrementUcucCalls() {
  try {
    await db.prepare(
      "UPDATE global_stats SET ucuc_calls_count = ucuc_calls_count + 1, updated_at = ? WHERE id = 1"
    ).run(Math.floor(Date.now() / 1000));
    console.log("✓ UCUC 题库调用次数已更新");
  } catch (e) {
    console.error("更新 UCUC 调用次数失败:", e.message);
  }
}

// 去除题目中的所有符号，只保留中文、英文、数字（用于题库查询）
function cleanQuestionText(question) {
  return (question || '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
}

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

    const response = await fetch("https://so.ucuc.net/prod-api/system/questionBank/search", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: cleanQuestion,
        apiKey: apiKey
      })
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

    // UCUC 题型校验：返回的题型必须与用户请求的题型一致
    const ucucType = result.data.type;
    // UCUC 题型到数字类型的映射（只支持这几种题型）
    const ucucTypeMapping = {
      "单选题": "0",
      "多选题": "1",
      "填空题": "2",
      "判断题": "3",
      "简答题": "4",
      "名词解释": "5"
    };

    const isUserRequestJudge = questionData.type === "3";
    const mappedUcucType = ucucType ? ucucTypeMapping[ucucType] : undefined;
    // UCUC未知类型：返回了题型但不在映射表中，或未返回题型
    const ucucTypeUnknown = !ucucType || !mappedUcucType;

    if (ucucType && questionData.type) {
      console.log(`📥 UCUC 返回题型: "${ucucType}" -> "${mappedUcucType}"`);
      console.log(`📥 客户端请求题型: "${questionData.type}" (${getTypeDescription(questionData.type)})`);

      if (mappedUcucType === questionData.type) {
        // 题型完全匹配
        console.log(`✓ UCUC 题型校验通过: ${ucucType}`);
      } else if (ucucTypeUnknown) {
        // 未知类型，降级校验：后续通过答案数量和选项内容判断
        console.log(`⚠️ UCUC 返回未知题型"${ucucType}"，降级为根据答案内容校验`);
      } else {
        // 已知类型但不匹配（如返回"单选"但客户端是"多选"），直接跳过
        console.log(`✗ UCUC 题型不匹配: 返回"${ucucType}"(${mappedUcucType})，期望"${getTypeDescription(questionData.type)}"(${questionData.type})，跳过`);
        return { code: 404, msg: `UCUC题型不匹配: 返回${ucucType}，期望${getTypeDescription(questionData.type)}`, data: null };
      }
    } else if (!ucucType) {
      console.log(`⚠️ UCUC 未返回题型，降级为根据答案内容校验`);
    } else if (!questionData.type) {
      console.log(`⚠️ 客户端未上报题型，跳过题型校验`);
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

    // 判断是否需要校验选项（单选/多选）
    // UCUC返回未知类型或未返回题型时，根据答案数量和选项内容判断
    const needOptions = ["0", "1"].includes(questionData.type);
    const ucucTypeUndefined = ucucTypeUnknown;

    if (needOptions) {
      // UCUC返回未知类型或未返回题型时，降级校验
      if (ucucTypeUndefined) {
        
        // 单选题：只允许1个答案
        if (questionData.type === "0" && answers.length > 1) {
          console.log(`✗ UCUC 题库 答案异常: 用户请求单选，但UCUC返回了${answers.length}个答案，跳过`);
          return { code: 404, msg: "UCUC题库答案与题型不匹配(单选返回多答案)", data: { answer: answers } };
        }

        // 多选题：不允许只有1个答案
        if (questionData.type === "1" && answers.length === 1) {
          console.log(`✗ UCUC 题库 答案异常: 用户请求多选，但UCUC只返回了1个答案，跳过`);
          return { code: 404, msg: "UCUC题库答案与题型不匹配(多选返回单答案)", data: { answer: answers } };
        }

        // 多选题：不允许全选
        if (questionData.type === "1" && questionData.options) {
          let optionLines = [];
          if (Array.isArray(questionData.options)) {
            optionLines = questionData.options;
          } else if (typeof questionData.options === 'string') {
            optionLines = questionData.options.split(/[,\n]+/).filter(o => o.trim());
          }
          if (answers.length >= optionLines.length) {
            console.log(`✗ UCUC 题库 答案异常: 用户请求多选，但UCUC返回了全部${answers.length}个选项，跳过`);
            return { code: 404, msg: "UCUC题库答案校验失败(多选题全选)", data: { answer: answers } };
          }
        }
      } else {
        // UCUC返回了题型，正常校验
        // 单选题返回多个答案，跳过
        if (questionData.type === "0" && answers.length > 1) {
          console.log(`✗ UCUC 题库 答案异常: 单选题返回了${answers.length}个答案，跳过`);
          return { code: 404, msg: "UCUC题库答案与题型不匹配(单选返回多答案)", data: { answer: answers } };
        }

        // 多选题只返回1个答案，跳过
        if (questionData.type === "1" && answers.length === 1) {
          console.log(`✗ UCUC 题库 答案异常: 多选题只返回了1个答案，跳过`);
          return { code: 404, msg: "UCUC题库答案与题型不匹配(多选返回单答案)", data: { answer: answers } };
        }

        // 多选题全选校验
        if (questionData.type === "1" && questionData.options) {
          let optionLines = [];
          if (Array.isArray(questionData.options)) {
            optionLines = questionData.options;
          } else if (typeof questionData.options === 'string') {
            optionLines = questionData.options.split(/[,\n]+/).filter(o => o.trim());
          }
          if (answers.length >= optionLines.length) {
            console.log(`✗ UCUC 题库 答案异常: 多选题返回了全部${answers.length}个选项，跳过`);
            return { code: 404, msg: "UCUC题库答案校验失败(多选题全选)", data: { answer: answers } };
          }
        }
      }
    }

    // 答案必须在选项中（单选/多选）
    if (needOptions && questionData.options) {
      let optionLines = [];
      if (Array.isArray(questionData.options)) {
        optionLines = questionData.options;
      } else if (typeof questionData.options === 'string') {
        optionLines = questionData.options.split(/[,\n]+/).filter(o => o.trim());
      }
      const validOptions = optionLines.map(opt => {
        const match = String(opt).match(/^[A-Z][.、]\s*(.+)$/);
        return match ? match[1].trim() : String(opt).trim();
      });

      const invalidAnswers = answers.filter(ans => {
        const ansText = ans.replace(/^[A-Z][.、]\s*/, '').trim();
        return !validOptions.some(opt =>
          opt === ans || opt === ansText || ansText.includes(opt)
        );
      });

      if (invalidAnswers.length > 0) {
        console.log(`✗ UCUC 题库答案不在选项中: ${invalidAnswers.join(', ')}`);
        return { code: 404, msg: "UCUC题库答案不在选项中", data: { answer: answers } };
      } else if (ucucTypeUndefined) {
        console.log(`✓ UCUC题型未知，但答案数量和选项内容都符合用户请求，通过校验`);
      }
    }

    // 判断题降级校验：UCUC返回未知类型时，检查答案是否为判断题标准值
    if (ucucTypeUndefined && isUserRequestJudge) {
      const judgeKeywords = /^(正确|错误|对|错|true|false|√|×|是|否|T|F)$/i;
      const allAnswersValid = answers.every(ans => judgeKeywords.test(ans.replace(/^[A-Z][.、]\s*/, '').trim()));
      if (!allAnswersValid) {
        console.log(`✗ UCUC 题库答案不符合判断题格式: ${answers.join(', ')}`);
        return { code: 404, msg: "UCUC题库答案不符合判断题格式", data: { answer: answers } };
      }
      console.log(`✓ UCUC题型未知，但答案符合判断题格式，通过校验`);
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

// 更新言溪题库剩余次数
async function updateYanxiRemaining(remaining) {
  if (remaining === undefined || remaining === null) return;
  
  try {
    await db.prepare(
      "UPDATE global_stats SET yanxi_remaining = ?, updated_at = ? WHERE id = 1"
    ).run(remaining, Math.floor(Date.now() / 1000));
    console.log("✓ 言溪题库剩余次数已更新:", remaining);
  } catch (e) {
    console.error("更新言溪题库剩余次数失败:", e.message);
  }
}

// 增加言溪题库调用次数
async function incrementYanxiCalls() {
  try {
    await db.prepare(
      "UPDATE global_stats SET yanxi_calls_count = yanxi_calls_count + 1, updated_at = ? WHERE id = 1"
    ).run(Math.floor(Date.now() / 1000));
    console.log("✓ 言溪题库调用次数已更新");
  } catch (e) {
    console.error("更新言溪题库调用次数失败:", e.message);
  }
}

// 增加指定模型的调用次数（通用函数）
async function incrementModelCalls(columnName) {
  // 白名单校验：只允许 MODEL_COLUMN_MAP 中定义的列名
  const allowedColumns = new Set(Object.values(MODEL_COLUMN_MAP));
  if (!allowedColumns.has(columnName)) {
    console.error(`更新模型调用次数失败: 未知列名 "${columnName}"`);
    return;
  }
  try {
    // 使用 mysql2 的 query 方法（支持 ?? 标识符占位符），避免字符串拼接列名
    await db.query(
      `UPDATE global_stats SET ?? = ?? + 1, updated_at = ? WHERE id = 1`,
      [columnName, columnName, Math.floor(Date.now() / 1000)]
    );
  } catch (e) {
    console.error(`更新${columnName}调用次数失败:`, e.message);
  }
}

// 模型名 → global_stats 列名映射
const MODEL_COLUMN_MAP = {
  // DeepSeek 系列（302.AI）
  'deepseek-ai/DeepSeek-V3.2': 'deepseek_v3_calls',  // AI模式 DeepSeek-V3.2
  'Pro/deepseek-ai/DeepSeek-R1': 'deepseek_r1_calls',  // AI模式 DeepSeek-R1-0528
  'deepseek-v4-flash': 'deepseek_v4_flash_calls',  // DeepSeek-V4-Flash
  'deepseek-v4-pro': 'deepseek_v4_pro_calls',  // DeepSeek-V4-Pro
  // Kimi 系列（302.AI）
  'kimi-k2.6': 'kimi_k26_calls',
  'kimi-k2.5': 'kimi_k25_calls',
  // Qwen 系列（302.AI）
  'Qwen/Qwen3.6-Plus': 'qwen3_6_calls',  // qwen3.6-plus实际调用的model
  'Qwen/Qwen3.5-Plus': 'qwen3_5_calls',  // qwen3.5-plus实际调用的model
  'Qwen/Qwen3.7-Max': 'qwen3_7_calls',   // qwen3.7-max实际调用的model
  // MiniMax 系列（302.AI）
  'MiniMax-M2.5': 'minimax_m25_calls',  // minimax-m2.5实际调用的model
  'MiniMax-M2.7': 'minimax_m27_calls',  // minimax-m2.7实际调用的model
  // 混元系列（腾讯云）
  'hunyuan-t1-latest': 'hunyuan_t1_calls',  // tencent-hunyuan-t1实际调用的model
  'hunyuan-standard-256K': 'hunyuan_standard_calls',  // tencent-hunyuan-standard实际调用的model
  // GPT 系列（302.AI）
  'gpt-5.4-mini': 'gpt_54_mini_calls',
  'gpt-5.4-nano': 'gpt_54_nano_calls',
  // Gemini 系列（302.AI）
  'gemini-3.1-flash-lite': 'gemini_31_calls',
  'gemini-3.5-flash': 'gemini_35_calls',
  // GLM 系列（302.AI）
  'Pro/zai-org/GLM-5': 'glm_5_calls',
  'glm-5.1': 'glm_51_calls',
  'glm-4.7': 'glm_47_calls'
};

// 增加缓存命中次数
async function incrementCacheHits() {
  try {
    await db.prepare(
      "UPDATE global_stats SET cache_hits_count = cache_hits_count + 1, updated_at = ? WHERE id = 1"
    ).run(Math.floor(Date.now() / 1000));
    console.log("✓ 缓存命中次数已更新");
  } catch (e) {
    console.error("更新缓存命中次数失败:", e.message);
  }
}

// 增加总查询次数
async function incrementTotalQueries(source) {
  try {
    await db.prepare(
      "UPDATE global_stats SET total_queries = total_queries + 1, updated_at = ? WHERE id = 1"
    ).run(Math.floor(Date.now() / 1000));

    // 记录查询日志（包含服务器ID）
    await db.prepare(
      "INSERT INTO query_logs (source, server_id, created_at) VALUES (?, ?, ?)"
    ).run(source, SERVER_ID, Math.floor(Date.now() / 1000));
  } catch (e) {
    console.error("更新总查询次数失败:", e.message);
  }
}

// 获取全局统计
async function getGlobalStats() {
  try {
    return await db.prepare("SELECT * FROM global_stats WHERE id = 1").get();
  } catch (e) {
    console.error("获取全局统计失败:", e.message);
    return { 
      tiku_remaining: 0, tiku_calls_count: 0, 
      hivenet_remaining: 0, hivenet_calls_count: 0, 
      yanxi_remaining: 0, yanxi_calls_count: 0, 
      ai_calls_count: 0, 
      deepseek_calls_count: 0, deepseek_thinking_calls_count: 0,
      hunyuan_calls_count: 0, hunyuan_t1_calls_count: 0,
      thinking_calls_count: 0, 
      cache_hits_count: 0, total_queries: 0 
    };
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
    const response = await fetch(`https://help.tikuhai.com/key/get?key=${key}`);
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
    
    const response = await fetch(TIKU_API_URL + "?s=PIAOPIAO&v=9.9.9", {
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
      
      // 单选/多选校验：答案数量与题型是否匹配
      if (questionData.type === "0" && answers.length > 1) {
        console.log(`✗ 题库海 答案异常: 单选题返回了${answers.length}个答案，跳过`);
        return { code: 404, msg: "题库海答案与题型不匹配(单选返回多答案)", data: result.data };
      }
      
      if (questionData.type === "1" && answers.length === 1) {
        console.log(`✗ 题库海 答案异常: 多选题只返回了1个答案，跳过`);
        return { code: 404, msg: "题库海答案与题型不匹配(多选返回单答案)", data: result.data };
      }
      
      // 单选/多选验证：答案必须存在于选项中
      if ((questionData.type === "0" || questionData.type === "1") && questionData.options) {
        // 解析选项
        let optionLines = [];
        if (typeof questionData.options === 'string') {
          optionLines = questionData.options.split(/[,\s]+/).filter(o => o.trim());
        } else if (Array.isArray(questionData.options)) {
          optionLines = questionData.options.map(o => String(o).trim()).filter(o => o);
        }
        
        const validOptions = optionLines.map(opt => {
          // 提取选项内容：A.杭州 -> 杭州
          const match = opt.match(/^[A-Z][.、]\s*(.+)$/);
          return match ? match[1].trim() : opt.trim();
        });
        
        // 检查每个答案是否在选项中
        const invalidAnswers = answers.filter(ans => {
          const ansText = typeof ans === 'string' ? ans.replace(/^[A-Z][.、]\s*/, '').trim() : String(ans);
          
          // 精确匹配，或答案文本完全包含选项
          return !validOptions.some(opt => 
            opt === ans || opt === ansText || ansText.includes(opt)
          );
        });
        
        if (invalidAnswers.length > 0) {
          console.log(`✗ 题库海 答案不在选项中: ${invalidAnswers.join(', ')}`);
          return { code: 404, msg: "题库海答案不在选项中", data: { answer: answers, options: questionData.options } };
        }
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
  
  const response = await fetch(url, {
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
    
    // 验证答案数量与题型是否匹配
    // 单选(type=0)返回多个答案，说明题目版本不同，跳过
    if (questionData.type === "0" && answers.length > 1) {
      console.log(`⚠️ Hive-Net 答案异常: 单选题返回了${answers.length}个答案，可能题目版本不同，跳过`);
      return { code: 404, msg: "Hive-Net答案与题型不匹配(单选返回多答案)", data: null };
    }
    
    // 多选(type=1)只返回1个答案，说明题目版本不同，跳过
    if (questionData.type === "1" && answers.length === 1) {
      console.log(`⚠️ Hive-Net 答案异常: 多选题只返回了1个答案，可能题目版本不同，跳过`);
      return { code: 404, msg: "Hive-Net答案与题型不匹配(多选返回单答案)", data: null };
    }
    
    // 多选题全选校验：答案数量等于选项数量，跳过
    if (questionData.type === "1" && questionData.options && typeof questionData.options === 'string') {
      const optionCount = questionData.options.split(/[,\s]+/).filter(o => o.trim()).length;
      if (answers.length >= optionCount) {
        console.log(`⚠️ Hive-Net 答案异常: 多选题返回了全部${answers.length}个选项，跳过`);
        return { code: 404, msg: "Hive-Net答案校验失败(多选题全选)", data: null };
      }
    }
    
    // 单选/多选验证：答案必须存在于选项中
    if (questionData.options && typeof questionData.options === 'string') {
      // 解析选项
      const optionLines = questionData.options.split(/[,\s]+/).filter(o => o.trim());
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
        console.log(`✗ Hive-Net 答案不在选项中: ${invalidAnswers.join(', ')}`);
        return { code: 404, msg: "Hive-Net答案不在选项中", data: { answer: answers, options: questionData.options } };
      }
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
    
    const response = await fetch(url, {
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


// 检查答案是否合理（返回 { reasonable: boolean, reason: string }）
function checkAnswerReasonable(answer, questionType, options) {
  if (!Array.isArray(answer) || answer.length === 0) {
    return { reasonable: false, reason: "答案为空或格式错误" };
  }
  
  // 判断题：答案必须是标准判断值，不能是大段解释文字
  if (questionType === "3") {
    const judgeValues = ["正确", "错误", "对", "错", "√", "×", "✓", "✗", "true", "false"];
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
  
  // 排序题：答案必须是单个字母（A/B/C/D等）
  if (questionType === "13") {
    // 1. 格式校验：必须是单个字母
    const validPattern = /^[A-Za-z]$/;
    const invalidFormat = answer.filter(a => !validPattern.test(String(a).trim()));
    if (invalidFormat.length > 0) {
      return { reasonable: false, reason: `排序题答案格式错误，应为单个字母: ${invalidFormat.join(', ')}` };
    }
    
    // 2. 重复校验：不能有重复字母
    const uniqueAnswers = new Set(answer.map(a => a.toUpperCase()));
    if (uniqueAnswers.size !== answer.length) {
      return { reasonable: false, reason: "排序题答案包含重复字母" };
    }
    
    // 3. 选项校验：答案字母必须在选项中
    if (options) {
      // 提取选项字母（从选项文本中提取A/B/C/D等）
      let optionLetters = [];
      try {
        const optionsData = typeof options === 'string' ? JSON.parse(options) : options;
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
          return { reasonable: false, reason: `排序题答案字母不在选项中: ${invalidLetters.join(', ')}` };
        }
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

// ==================== 导出题库函数 ====================
// 注意：fetchAISupplement/fetchAICustom/fetchDeepSeekThinking 已移到 modes/*.js
// 导出供 modes 文件使用的通用函数

module.exports = {
  // 通用工具函数
  generateQuestionHash,
  extractJsonFromContent,
  buildPrompt,
  cleanAiAnswer,
  normalizeMatchingAnswer,
  cleanAnswerData,
  mergeSplitAnswers,
  checkAnswerReasonable,
  MODEL_COLUMN_MAP,
  
  // 缓存相关
  getCachedAnswer,
  saveAnswerToCache,
  updateAnswerCorrectness,  // 旧版本：向后兼容
  recordCorrectnessReport,  // 简化版：单用户上报即可生效
  applyCorrectnessUpdate,   // 应用正确性更新
  
  // 统计相关
  incrementAiCalls,
  incrementTikuCalls,
  incrementModelCalls,
  updateHiveNetRemaining,
  incrementHiveNetCalls,
  updateYanxiRemaining,
  incrementYanxiCalls,
  updateUcucRemaining,
  incrementUcucCalls,
  incrementCacheHits,
  incrementTotalQueries,
  getGlobalStats,
  
  // 题库查询
  getAvailableTikuKey,
  updateTikuKeyRemaining,
  refreshTikuKeyRemaining,
  refreshAllTikuKeys,
  fetchAnswer,
  parseAnswer,
  fetchHiveNet,
  fetchUcuc,
  fetchYanxi,
  
  // 从 utils.js 重新导出
  getTypeDescription
};
