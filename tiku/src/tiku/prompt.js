const { extractImageUrls } = require('./helpers');

// 统一的prompt构建函数
// 返回 { system: string, user: string, imageUrls: string[] } 结构，分离系统指令和用户题目
function buildPrompt(questionData, enableWebSearch = false) {
  const q = questionData.question;
  const opts = questionData.options;

  // 从题目文本中提取图片URL，并清理img标签
  const { cleanedQuestion, imageUrls: questionImageUrls } = extractImageUrls(q);
  const imageUrls = [...questionImageUrls];

  // 格式化选项为字母编号列表（A. B. C. D.格式，与标准考试格式一致），同时提取选项中的图片URL
  let formattedOptions;
  if (Array.isArray(opts)) {
    formattedOptions = opts.map((opt, i) => {
      const { cleanedQuestion: cleanedOpt, imageUrls: optImageUrls } = extractImageUrls(String(opt));
      // 将选项中的图片URL合并到总列表中
      imageUrls.push(...optImageUrls);
      return `${String.fromCharCode(65 + i)}. ${cleanedOpt}`;
    }).join('\n');
  } else {
    formattedOptions = opts;
  }

  // 通用规则部分（所有题型共享）
  const commonRules = [
    '【关键规则，必须遵守】',
    '- 最终答案必须放在content字段中输出。',
    '- <answer>标签只输出最终答案，不要将分析步骤放入answer数组。',
    '- 最终答案必须放在<answer>标签内，格式为 {"answer":["答案内容"]}',
    '- <answer>标签内只放纯JSON，不要用markdown代码块包裹。',
    '- 不要根据题目关键词自由联想、推测或编造答案，必须基于知识认真推理后给出确定答案。'
  ];
  // 选择题专用规则：答案文本必须与选项一致
  if (questionData.type === "0" || questionData.type === "1") {
    commonRules.push('- answer数组中的文本必须与题目选项冒号后面的文本完全一致，不要拆分、修改或合并选项文本。');
  }
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
${cleanedQuestion}
${formattedOptions}

示例：<answer>{"answer":["北京"]}</answer>，不要输出 {"answer":["A"]} 或 {"answer":["1"]}。`,
        imageUrls
      };
    case "1": {
      const optCount = Array.isArray(opts) ? opts.length : opts.split('\n').filter(o => o.trim()).length;
      return {
        system,
        user: `多选题：
${cleanedQuestion}
${formattedOptions}

共${optCount}个选项。绝对不要拆分任何选项（即使选项内部包含逗号或顿号），不要自己归纳总结。
示例：<answer>{"answer":["实践是检验真理的唯一标准","生产力决定生产关系"]}</answer>`,
        imageUrls
      };
    }
    case "3":
      return {
        system,
        user: `判断题：${cleanedQuestion}

答案只能是"正确"或"错误"，不要输出"对""错""是""否""True""False"等其他变体。
示例：<answer>{"answer":["正确"]}</answer> 或 <answer>{"answer":["错误"]}</answer>`,
        imageUrls
      };
    case "2":
      return {
        system,
        user: `填空题：${cleanedQuestion}

示例：<answer>{"answer":["答案1","答案2"]}</answer>`,
        imageUrls
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
${cleanedQuestion}
${sortOptions}

answer数组中的每个元素必须是选项字母（A/B/C/D等），按正确顺序排列。
示例：<answer>{"answer":["A","B","C","D"]}</answer>`,
        imageUrls
      };
    }
    case "4":
      return {
        system,
        user: `简答题：${cleanedQuestion}

示例：<answer>{"answer":["要点1","要点2","要点3"]}</answer>`,
        imageUrls
      };
    case "5":
      return {
        system,
        user: `名词解释：${cleanedQuestion}

请给出该名词的准确解释，包含定义和关键特征。
示例：<answer>{"answer":["名词的完整解释"]}</answer>`,
        imageUrls
      };
    case "6":
      return {
        system,
        user: `论述题：${cleanedQuestion}

请从多个角度进行详细论述，条理清晰、逻辑严密。
示例：<answer>{"answer":["论点1","论点2","论点3"]}</answer>`,
        imageUrls
      };
    case "7":
      return {
        system,
        user: `计算题：${cleanedQuestion}

请给出完整的计算过程和最终结果，步骤清晰。
示例：<answer>{"answer":["最终计算结果"]}</answer>`,
        imageUrls
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
${cleanedQuestion}
${matchOptions}

answer数组按左侧题目从上到下的顺序，每项只写对应的右侧选项字母（A/B/C/D等），不要写序号或其他内容。
示例：<answer>{"answer":["C","D","A","B"]}</answer>`,
        imageUrls
      };
    }
    default:
      return {
        system,
        user: `问答题：${cleanedQuestion}

示例：<answer>{"answer":["要点1","要点2","要点3"]}</answer>`,
        imageUrls
      };
  }
}

module.exports = { buildPrompt };
