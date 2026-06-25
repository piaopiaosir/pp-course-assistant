// 消耗等级划分标准（按输入+输出价格总和，元/百万tokens）：
//   超低消耗：总和 ≤ 5
//   低消耗：总和 5~10
//   中消耗：总和 10~25
//   高消耗：总和 25~50
//   超高消耗：总和 > 50
const AI_MODELS = {
  'DeepSeek-V3.2': {
    id: 'DeepSeek-V3.2',
    apiModel: 'deepseek-ai/DeepSeek-V3.2',
    provider: '302ai',
    displayName: 'DeepSeek-V3.2',
    temperature: 0.6,
    enable_thinking: true,
    cost: '低消耗',
    statsColumn: 'deepseek_v3_calls'
  },
  'DeepSeek-R1-0528': {
    id: 'DeepSeek-R1-0528',
    apiModel: 'Pro/deepseek-ai/DeepSeek-R1',
    provider: '302ai',
    displayName: 'DeepSeek-R1',
    cost: '中消耗',
    statsColumn: 'deepseek_r1_calls'
  },
  'deepseek-v4-flash': {
    id: 'deepseek-v4-flash',
    apiModel: 'deepseek-v4-flash',
    provider: 'deepseek',
    displayName: 'DeepSeek-V4-Flash',
    thinking: { type: "enabled" },
    reasoning_effort: "max",
    cost: '超低消耗',
    statsColumn: 'deepseek_v4_flash_calls'
  },
  'deepseek-v4-pro': {
    id: 'deepseek-v4-pro',
    apiModel: 'deepseek-v4-pro',
    provider: 'deepseek',
    displayName: 'DeepSeek-V4-Pro',
    thinking: { type: "enabled" },
    reasoning_effort: "max",
    cost: '低消耗',
    statsColumn: 'deepseek_v4_pro_calls'
  },
  'qwen3.6-plus': {
    id: 'qwen3.6-plus',
    apiModel: 'qwen3.6-plus',
    provider: '302ai',
    displayName: 'Qwen3.6-Plus',
    temperature: 0.6,
    enable_thinking: true,
    supportsVision: true,
    cost: '中消耗',
    statsColumn: 'qwen3_6_calls'
  },
  'qwen3.7-max': {
    id: 'qwen3.7-max',
    apiModel: 'qwen3.7-max-2026-06-08',
    provider: '302ai',
    displayName: 'Qwen3.7-Max',
    temperature: 0.6,
    enable_thinking: true,
    supportsVision: true,
    cost: '高消耗',
    statsColumn: 'qwen3_7_max_calls'
  },
  'qwen3.7-plus': {
    id: 'qwen3.7-plus',
    apiModel: 'qwen3.7-plus',
    provider: '302ai',
    displayName: 'Qwen3.7-Plus',
    temperature: 0.6,
    enable_thinking: true,
    supportsVision: true,
    cost: '低消耗',
    statsColumn: 'qwen3_7_plus_calls'
  },
  'qwen3.5-plus': {
    id: 'qwen3.5-plus',
    apiModel: 'qwen3.5-plus',
    provider: '302ai',
    displayName: 'Qwen3.5-Plus',
    temperature: 0.6,
    enable_thinking: true,
    supportsVision: true,
    cost: '低消耗',
    statsColumn: 'qwen3_5_calls'
  },
  'minimax-m2.5': {
    id: 'minimax-m2.5',
    apiModel: 'MiniMax-M2.5',
    provider: '302ai',
    displayName: 'MiniMax-M2.5',
    temperature: 0.6,
    cost: '中消耗',
    statsColumn: 'minimax_m25_calls'
  },
  'minimax-m2.7': {
    id: 'minimax-m2.7',
    apiModel: 'MiniMax-M2.7',
    provider: '302ai',
    displayName: 'MiniMax-M2.7',
    temperature: 0.6,
    cost: '中消耗',
    statsColumn: 'minimax_m27_calls'
  },
  'minimax-m3': {
    id: 'minimax-m3',
    apiModel: 'MiniMax-M3',
    provider: '302ai',
    displayName: 'MiniMax-M3',
    temperature: 0.6,
    thinking: { type: "adaptive" },
    reasoning_split: true,
    supportsVision: true,
    cost: '中消耗',
    statsColumn: 'minimax_m3_calls'
  },
  'hy3-preview': {
    id: 'hy3-preview',
    apiModel: 'hy3-preview',
    provider: 'tencent',
    displayName: 'Hy3-preview',
    temperature: 0.6,
    thinking: { type: "enabled" },
    cost: '低消耗',
    statsColumn: 'hy3_preview_calls'
  },
  'gpt-5.4-mini': {
    id: 'gpt-5.4-mini',
    apiModel: 'gpt-5.4-mini',
    provider: '302ai',
    displayName: 'GPT-5.4-mini',
    temperature: 0.6,
    supportsVision: true,
    cost: '高消耗',
    statsColumn: 'gpt_54_mini_calls'
  },
  'gpt-5.4-nano': {
    id: 'gpt-5.4-nano',
    apiModel: 'gpt-5.4-nano',
    provider: '302ai',
    displayName: 'GPT-5.4-nano',
    temperature: 0.6,
    supportsVision: true,
    cost: '中消耗',
    statsColumn: 'gpt_54_nano_calls'
  },
  'gemini-3.1-flash-lite': {
    id: 'gemini-3.1-flash-lite',
    apiModel: 'gemini-3.1-flash-lite',
    provider: '302ai',
    displayName: 'Gemini-3.1',
    temperature: 0.6,
    supportsVision: true,
    cost: '中消耗',
    statsColumn: 'gemini_31_calls'
  },
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    apiModel: 'gemini-3.5-flash',
    provider: '302ai',
    displayName: 'Gemini-3.5',
    temperature: 0.6,
    supportsVision: true,
    cost: '超高消耗',
    statsColumn: 'gemini_35_calls'
  },
  'GLM-5': {
    id: 'GLM-5',
    apiModel: 'glm-5',
    provider: '302ai',
    displayName: 'GLM-5',
    temperature: 0.6,
    thinking: { type: "enabled" },
    cost: '中消耗',
    statsColumn: 'glm_5_calls'
  },
  'GLM-5.1': {
    id: 'GLM-5.1',
    apiModel: 'glm-5.1',
    provider: '302ai',
    displayName: 'GLM-5.1',
    temperature: 0.6,
    thinking: { type: "enabled" },
    cost: '高消耗',
    statsColumn: 'glm_51_calls'
  },
  'GLM-5.2': {
    id: 'GLM-5.2',
    apiModel: 'glm-5.2',
    provider: '302ai',
    displayName: 'GLM-5.2',
    temperature: 0.6,
    thinking: { type: "enabled" },
    cost: '高消耗',
    statsColumn: 'glm_52_calls'
  },
  'GLM-4.7': {
    id: 'GLM-4.7',
    apiModel: 'glm-4.7',
    provider: '302ai',
    displayName: 'GLM-4.7',
    temperature: 0.6,
    thinking: { type: "enabled" },
    cost: '低消耗',
    statsColumn: 'glm_47_calls'
  },
  'kimi-k2.6': {
    id: 'kimi-k2.6',
    apiModel: 'kimi-k2.6',
    provider: '302ai',
    displayName: 'Kimi-K2.6',
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: '高消耗',
    statsColumn: 'kimi_k26_calls'
  },
  'kimi-k2.5': {
    id: 'kimi-k2.5',
    apiModel: 'kimi-k2.5',
    provider: '302ai',
    displayName: 'Kimi-K2.5',
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: '高消耗',
    statsColumn: 'kimi_k25_calls'
  },
  'kimi-k2.7-code': {
    id: 'kimi-k2.7-code',
    apiModel: 'kimi-k2.7-code',
    provider: '302ai',
    displayName: 'Kimi-K2.7-Code',
    thinking: { type: "enabled" },
    cost: '高消耗',
    statsColumn: 'kimi_k27_code_calls'
  },
  'doubao-seed-2.1-turbo': {
    id: 'doubao-seed-2.1-turbo',
    apiModel: 'doubao-seed-2-1-turbo-260628',
    provider: '302ai',
    displayName: 'Doubao-Seed-2.1-Turbo',
    temperature: 0.6,
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: '中消耗',
    statsColumn: 'doubao_seed_21_turbo_calls'
  },
  'doubao-seed-2.1-pro': {
    id: 'doubao-seed-2.1-pro',
    apiModel: 'doubao-seed-2-1-pro-260628',
    provider: '302ai',
    displayName: 'Doubao-Seed-2.1-Pro',
    temperature: 0.6,
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: '高消耗',
    statsColumn: 'doubao_seed_21_pro_calls'
  },
  'doubao-seed-2.0-code': {
    id: 'doubao-seed-2.0-code',
    apiModel: 'doubao-seed-2-0-code-260215',
    provider: '302ai',
    displayName: 'Doubao-Seed-2.0-Code',
    temperature: 0.6,
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: '中消耗',
    statsColumn: 'doubao_seed_20_code_calls'
  },
  'doubao-seed-2.0-mini': {
    id: 'doubao-seed-2.0-mini',
    apiModel: 'doubao-seed-2-0-mini-260215',
    provider: '302ai',
    displayName: 'Doubao-Seed-2.0-Mini',
    temperature: 0.6,
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: '超低消耗',
    statsColumn: 'doubao_seed_20_mini_calls'
  },
  'doubao-seed-2.0-lite': {
    id: 'doubao-seed-2.0-lite',
    apiModel: 'doubao-seed-2-0-lite-260215',
    provider: '302ai',
    displayName: 'Doubao-Seed-2.0-Lite',
    temperature: 0.6,
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: '低消耗',
    statsColumn: 'doubao_seed_20_lite_calls'
  },
  'doubao-seed-2.0-pro': {
    id: 'doubao-seed-2.0-pro',
    apiModel: 'doubao-seed-2-0-pro-260215',
    provider: '302ai',
    displayName: 'Doubao-Seed-2.0-Pro',
    temperature: 0.6,
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: '中消耗',
    statsColumn: 'doubao_seed_20_pro_calls'
  },
};

const MODEL_COLUMN_MAP = {};
const MODEL_DISPLAY_MAP = {};

Object.values(AI_MODELS).forEach(model => {
  MODEL_COLUMN_MAP[model.apiModel] = model.statsColumn;
  MODEL_DISPLAY_MAP[model.apiModel] = model.displayName;
});

function getModelConfig(modelId) {
  const entry = AI_MODELS[modelId];
  if (!entry) return null;
  return {
    provider: entry.provider,
    model: entry.apiModel,
    name: entry.displayName,
    temperature: entry.temperature,
    top_p: entry.top_p,
    thinking: entry.thinking,
    reasoning_split: entry.reasoning_split,
    enable_thinking: entry.enable_thinking,
    reasoning_effort: entry.reasoning_effort,
    supportsVision: entry.supportsVision || false,
    cost: entry.cost
  };
}

function getSupportedModels() {
  return Object.keys(AI_MODELS);
}

function getModelCosts() {
  const { NORMAL_MODE_COST, VERIFY_MODE_COST } = require('./app-config');
  const costs = {};
  // 各AI模型的消耗等级（汉字描述）
  for (const [modelId, entry] of Object.entries(AI_MODELS)) {
    costs[modelId] = (entry.cost || '低消耗') + '模型';
  }
  // 固定模式消耗（完整字符串，如"1次"、"1-3次"）
  costs.normal = NORMAL_MODE_COST;
  costs.verify = VERIFY_MODE_COST;
  return costs;
}

function getFullModelConfig() {
  const typeModelMap = {
    'DeepSeek': ['V4-Flash', 'V4-Pro', 'V3.2', 'R1'],
    'HunYuan': ['3-Preview'],
    'Doubao': ['2.1-Pro', '2.1-Turbo', '2.0-Pro', '2.0-Code', '2.0-Lite', '2.0-Mini'],
    'Qwen': ['3.7-Max', '3.7-Plus', '3.6-Plus', '3.5-Plus'],
    'MiniMax': ['M3', 'M2.7', 'M2.5'],
    'GLM': ['5.2', '5.1', '5.0', '4.7'],
    'Kimi': ['K2.7-Code', 'K2.6', 'K2.5'],
    'ChatGPT': ['5.4-Nano', '5.4-Mini'],
    'Gemini': ['3.5-Flash', '3.1-Flash']
  };

  const defaultModels = {
    'DeepSeek': 'V4-Flash',
    'HunYuan': '3-Preview',
    'Doubao': '2.1-Pro',
    'Qwen': '3.7-Max',
    'MiniMax': 'M3',
    'GLM': '5.2',
    'Kimi': 'K2.6',
    'ChatGPT': '5.4-Nano',
    'Gemini': '3.5-Flash'
  };

  const modelIdMap = {
    'DeepSeek': {
      'V4-Flash': 'deepseek-v4-flash',
      'V4-Pro': 'deepseek-v4-pro',
      'V3.2': 'DeepSeek-V3.2',
      'R1': 'DeepSeek-R1-0528'
    },
    'HunYuan': {
      '3-Preview': 'hy3-preview'
    },
    'Doubao': {
      '2.1-Pro': 'doubao-seed-2.1-pro',
      '2.1-Turbo': 'doubao-seed-2.1-turbo',
      '2.0-Pro': 'doubao-seed-2.0-pro',
      '2.0-Code': 'doubao-seed-2.0-code',
      '2.0-Lite': 'doubao-seed-2.0-lite',
      '2.0-Mini': 'doubao-seed-2.0-mini'
    },
    'Qwen': {
      '3.7-Max': 'qwen3.7-max',
      '3.7-Plus': 'qwen3.7-plus',
      '3.6-Plus': 'qwen3.6-plus',
      '3.5-Plus': 'qwen3.5-plus'
    },
    'MiniMax': {
      'M3': 'minimax-m3',
      'M2.7': 'minimax-m2.7',
      'M2.5': 'minimax-m2.5'
    },
    'GLM': {
      '5.2': 'GLM-5.2',
      '5.1': 'GLM-5.1',
      '5.0': 'GLM-5',
      '4.7': 'GLM-4.7'
    },
    'Kimi': {
      'K2.7-Code': 'kimi-k2.7-code',
      'K2.6': 'kimi-k2.6',
      'K2.5': 'kimi-k2.5'
    },
    'ChatGPT': {
      '5.4-Nano': 'gpt-5.4-nano',
      '5.4-Mini': 'gpt-5.4-mini'
    },
    'Gemini': {
      '3.5-Flash': 'gemini-3.5-flash',
      '3.1-Flash': 'gemini-3.1-flash-lite'
    }
  };

  const typeOptions = Object.keys(typeModelMap);
  const allModelOptions = Object.values(typeModelMap).flat();

  return {
    typeOptions,
    allModelOptions,
    typeModelMap,
    defaultModels,
    modelIdMap,
    modelCosts: getModelCosts()
  };
}

function getDisplayName(apiModelName) {
  return MODEL_DISPLAY_MAP[apiModelName] || apiModelName;
}

// ==================== 模型价格表（元/百万Tokens，不考虑缓存命中价格）====================
const MODEL_PRICING = {
  'DeepSeek-V3.2': { inputPerMillion: 2.03, outputPerMillion: 3.01 },
  'DeepSeek-R1-0528': { inputPerMillion: 4.20, outputPerMillion: 16.10 },
  'deepseek-v4-flash': { inputPerMillion: 1.00, outputPerMillion: 2.00 },
  'deepseek-v4-pro': { inputPerMillion: 3.00, outputPerMillion: 6.00 },
  'qwen3.6-plus': { inputPerMillion: 2.10, outputPerMillion: 12.60 },
  'qwen3.7-max': { inputPerMillion: 12.60, outputPerMillion: 37.10 },
  'qwen3.7-plus': { inputPerMillion: 1.596, outputPerMillion: 6.44 },
  'qwen3.5-plus': { inputPerMillion: 0.84, outputPerMillion: 4.83 },
  'minimax-m2.5': { inputPerMillion: 2.10, outputPerMillion: 8.40 },
  'minimax-m2.7': { inputPerMillion: 2.10, outputPerMillion: 8.40 },
  'minimax-m3': { inputPerMillion: 4.20, outputPerMillion: 16.80 },
  'hy3-preview': { inputPerMillion: 1.20, outputPerMillion: 4.00 },
  'gpt-5.4-mini': { inputPerMillion: 5.25, outputPerMillion: 31.50 },
  'gpt-5.4-nano': { inputPerMillion: 1.40, outputPerMillion: 8.75 },
  'gemini-3.1-flash-lite': { inputPerMillion: 1.75, outputPerMillion: 10.50 },
  'gemini-3.5-flash': { inputPerMillion: 10.50, outputPerMillion: 63.00 },
  'GLM-5': { inputPerMillion: 4.20, outputPerMillion: 18.20 },
  'GLM-5.1': { inputPerMillion: 9.80, outputPerMillion: 30.80 },
  'GLM-5.2': { inputPerMillion: 9.80, outputPerMillion: 30.80 },
  'GLM-4.7': { inputPerMillion: 2.002, outputPerMillion: 7.994 },
  'kimi-k2.6': { inputPerMillion: 6.65, outputPerMillion: 28.00 },
  'kimi-k2.5': { inputPerMillion: 4.389, outputPerMillion: 23.10 },
  'kimi-k2.7-code': { inputPerMillion: 6.65, outputPerMillion: 28.00 },
  'doubao-seed-2.1-turbo': { inputPerMillion: 3.01, outputPerMillion: 14.98 },
  'doubao-seed-2.1-pro': { inputPerMillion: 6.02, outputPerMillion: 29.96 },
  'doubao-seed-2.0-code': { inputPerMillion: 3.22, outputPerMillion: 16.03 },
  'doubao-seed-2.0-mini': { inputPerMillion: 0.805, outputPerMillion: 0.805 },
  'doubao-seed-2.0-lite': { inputPerMillion: 0.896, outputPerMillion: 5.46 },
  'doubao-seed-2.0-pro': { inputPerMillion: 3.22, outputPerMillion: 15.96 },
};

// ==================== 预锁定机制 ====================
// AI模式调用前，按模型消耗等级预锁定（冻结）一定次数，调用完成后按实际消耗结算
// 防止并发请求导致余额透支，恶意用户无法在余额不足时发起AI请求
// 预锁定是冻结预授权额度，不是扣费上限；最终扣费按实际token消耗计算，多退少不补
const COST_PRELOCK = {
  '超低消耗': 1,  // 超低消耗模型预锁定1次
  '低消耗': 2,   // 低消耗模型预锁定2次
  '中消耗': 6,  // 中消耗模型预锁定6次
  '高消耗': 12,   // 高消耗模型预锁定12次
  '超高消耗': 20  // 超高消耗模型预锁定20次
};

/**
 * 根据模型ID获取预锁定次数
 * @param {string} modelId - 模型ID
 * @returns {number} 预锁定次数
 */
function getPrelockCount(modelId) {
  const config = AI_MODELS[modelId];
  if (!config) return COST_PRELOCK['低消耗']; // 未知模型按低消耗锁定
  return COST_PRELOCK[config.cost] || COST_PRELOCK['低消耗'];
}

// 套餐综合单价（加权平均）：0.007 元/次
const PRICE_PER_COUNT = 0.007;

/**
 * 根据实际消耗的token计算应扣除的次数
 * 不考虑缓存命中价格，不满0.5次按0.5次扣除
 *
 * @param {string} modelId - 模型ID（如 'deepseek-v4-flash'）
 * @param {number} promptTokens - 输入token数
 * @param {number} completionTokens - 输出token数
 * @returns {number} 应扣除的次数（最小0.5）
 */
function calculateCostFromTokens(modelId, promptTokens, completionTokens) {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) {
    // 未知模型默认扣1次
    console.log(`[WARN] 未知模型定价: ${modelId}，默认扣除1次`);
    return 1;
  }

  // 计算实际费用（元）
  const inputCost = (promptTokens / 1000000) * pricing.inputPerMillion;
  const outputCost = (completionTokens / 1000000) * pricing.outputPerMillion;
  const totalCost = inputCost + outputCost;

  // 转换为次数（保留1位小数向上取整，不满0.5次按0.5次）
  const rawCount = totalCost / PRICE_PER_COUNT;
  const count = Math.ceil(rawCount * 10) / 10;
  const finalCount = Math.max(0.5, count);
  console.log(`[COST] 费用计算: 输入${promptTokens}tokens=${inputCost.toFixed(6)}元, 输出${completionTokens}tokens=${outputCost.toFixed(6)}元, 总费用=${totalCost.toFixed(6)}元, rawCount=${rawCount.toFixed(4)}, count=${count}, finalCount=${finalCount}`);
  return finalCount;
}

module.exports = {
  AI_MODELS,
  MODEL_COLUMN_MAP,
  MODEL_DISPLAY_MAP,
  getModelConfig,
  getSupportedModels,
  getModelCosts,
  getFullModelConfig,
  getDisplayName,
  MODEL_PRICING,
  PRICE_PER_COUNT,
  COST_PRELOCK,
  getPrelockCount,
  calculateCostFromTokens
};
