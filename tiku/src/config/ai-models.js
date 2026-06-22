const AI_MODELS = {
  'DeepSeek-V3.2': {
    id: 'DeepSeek-V3.2',
    apiModel: 'deepseek-ai/DeepSeek-V3.2',
    provider: '302ai',
    displayName: 'DeepSeek-V3.2',
    temperature: 0.6,
    enable_thinking: true,
    cost: 1,
    statsColumn: 'deepseek_v3_calls'
  },
  'DeepSeek-R1-0528': {
    id: 'DeepSeek-R1-0528',
    apiModel: 'Pro/deepseek-ai/DeepSeek-R1',
    provider: '302ai',
    displayName: 'DeepSeek-R1',
    cost: 3,
    statsColumn: 'deepseek_r1_calls'
  },
  'deepseek-v4-flash': {
    id: 'deepseek-v4-flash',
    apiModel: 'deepseek-v4-flash',
    provider: 'deepseek',
    displayName: 'DeepSeek-V4-Flash',
    thinking: { type: "enabled" },
    reasoning_effort: "max",
    cost: 1,
    statsColumn: 'deepseek_v4_flash_calls'
  },
  'deepseek-v4-pro': {
    id: 'deepseek-v4-pro',
    apiModel: 'deepseek-v4-pro',
    provider: 'deepseek',
    displayName: 'DeepSeek-V4-Pro',
    thinking: { type: "enabled" },
    reasoning_effort: "max",
    cost: 1,
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
    cost: 2,
    statsColumn: 'qwen3_6_calls'
  },
  'qwen3.7-max': {
    id: 'qwen3.7-max-2026-06-08',
    apiModel: 'qwen3.7-max',
    provider: '302ai',
    displayName: 'Qwen3.7-Max',
    temperature: 0.6,
    enable_thinking: true,
    supportsVision: true,
    cost: 3,
    statsColumn: 'qwen3_7_calls'
  },
  'qwen3.5-plus': {
    id: 'qwen3.5-plus',
    apiModel: 'qwen3.5-plus',
    provider: '302ai',
    displayName: 'Qwen3.5-Plus',
    temperature: 0.6,
    enable_thinking: true,
    supportsVision: true,
    cost: 1,
    statsColumn: 'qwen3_5_calls'
  },
  'minimax-m2.5': {
    id: 'minimax-m2.5',
    apiModel: 'MiniMax-M2.5',
    provider: '302ai',
    displayName: 'MiniMax-M2.5',
    temperature: 0.6,
    cost: 1,
    statsColumn: 'minimax_m25_calls'
  },
  'minimax-m2.7': {
    id: 'minimax-m2.7',
    apiModel: 'MiniMax-M2.7',
    provider: '302ai',
    displayName: 'MiniMax-M2.7',
    temperature: 0.6,
    cost: 1,
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
    cost: 2,
    statsColumn: 'minimax_m3_calls'
  },
  'hy3-preview': {
    id: 'hy3-preview',
    apiModel: 'hy3-preview',
    provider: 'tencent',
    displayName: 'Hy3-preview',
    temperature: 0.6,
    thinking: { type: "enabled" },
    cost: 1,
    statsColumn: 'hy3_preview_calls'
  },
  'gpt-5.4-mini': {
    id: 'gpt-5.4-mini',
    apiModel: 'gpt-5.4-mini',
    provider: '302ai',
    displayName: 'GPT-5.4-mini',
    temperature: 0.6,
    supportsVision: true,
    cost: 3,
    statsColumn: 'gpt_54_mini_calls'
  },
  'gpt-5.4-nano': {
    id: 'gpt-5.4-nano',
    apiModel: 'gpt-5.4-nano',
    provider: '302ai',
    displayName: 'GPT-5.4-nano',
    temperature: 0.6,
    supportsVision: true,
    cost: 1,
    statsColumn: 'gpt_54_nano_calls'
  },
  'gemini-3.1-flash-lite': {
    id: 'gemini-3.1-flash-lite',
    apiModel: 'gemini-3.1-flash-lite',
    provider: '302ai',
    displayName: 'Gemini-3.1',
    temperature: 0.6,
    supportsVision: true,
    cost: 1,
    statsColumn: 'gemini_31_calls'
  },
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    apiModel: 'gemini-3.5-flash',
    provider: '302ai',
    displayName: 'Gemini-3.5',
    temperature: 0.6,
    supportsVision: true,
    cost: 2,
    statsColumn: 'gemini_35_calls'
  },
  'GLM-5': {
    id: 'GLM-5',
    apiModel: 'glm-5',
    provider: '302ai',
    displayName: 'GLM-5',
    temperature: 1.0,
    thinking: { type: "enabled" },
    cost: 4,
    statsColumn: 'glm_5_calls'
  },
  'GLM-5.1': {
    id: 'GLM-5.1',
    apiModel: 'glm-5.1',
    provider: '302ai',
    displayName: 'GLM-5.1',
    temperature: 1.0,
    thinking: { type: "enabled" },
    cost: 4,
    statsColumn: 'glm_51_calls'
  },
  'GLM-4.7': {
    id: 'GLM-4.7',
    apiModel: 'glm-4.7',
    provider: '302ai',
    displayName: 'GLM-4.7',
    temperature: 1.0,
    thinking: { type: "enabled" },
    cost: 2,
    statsColumn: 'glm_47_calls'
  },
  'kimi-k2.6': {
    id: 'kimi-k2.6',
    apiModel: 'kimi-k2.6',
    provider: '302ai',
    displayName: 'Kimi-K2.6',
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: 4,
    statsColumn: 'kimi_k26_calls'
  },
  'kimi-k2.5': {
    id: 'kimi-k2.5',
    apiModel: 'kimi-k2.5',
    provider: '302ai',
    displayName: 'Kimi-K2.5',
    thinking: { type: "enabled" },
    supportsVision: true,
    cost: 3,
    statsColumn: 'kimi_k25_calls'
  }
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
  const costs = {};
  for (const [modelId, entry] of Object.entries(AI_MODELS)) {
    costs[modelId] = entry.cost || 1;
  }
  return costs;
}

function getFullModelConfig() {
  const typeModelMap = {
    'DeepSeek': ['V4-Flash', 'V4-Pro', 'V3.2', 'R1'],
    'HunYuan': ['Hy3-preview'],
    'Qwen': ['3.5-plus', '3.6-plus', '3.7-Max'],
    'MiniMax': ['M3', 'M2.7', 'M2.5'],
    'GLM': ['5.1', '5.0', '4.7'],
    'Kimi': ['K2.6', 'K2.5'],
    'ChatGPT': ['5.4-nano', '5.4'],
    'Gemini': ['3.5', '3.1']
  };

  const defaultModels = {
    'DeepSeek': 'V4-Flash',
    'HunYuan': 'Hy3-preview',
    'Qwen': '3.7-Max',
    'MiniMax': 'M3',
    'GLM': '5.1',
    'Kimi': 'K2.6',
    'ChatGPT': '5.4-nano',
    'Gemini': '3.5'
  };

  const modelIdMap = {
    'DeepSeek': {
      'V4-Flash': 'deepseek-v4-flash',
      'V4-Pro': 'deepseek-v4-pro',
      'V3.2': 'DeepSeek-V3.2',
      'R1': 'DeepSeek-R1-0528'
    },
    'HunYuan': {
      'Hy3-preview': 'hy3-preview'
    },
    'Qwen': {
      '3.7-Max': 'qwen3.7-max',
      '3.6-plus': 'qwen3.6-plus',
      '3.5-plus': 'qwen3.5-plus'
    },
    'MiniMax': {
      'M3': 'minimax-m3',
      'M2.7': 'minimax-m2.7',
      'M2.5': 'minimax-m2.5'
    },
    'GLM': {
      '5.1': 'GLM-5.1',
      '5.0': 'GLM-5',
      '4.7': 'GLM-4.7'
    },
    'Kimi': {
      'K2.6': 'kimi-k2.6',
      'K2.5': 'kimi-k2.5'
    },
    'ChatGPT': {
      '5.4-nano': 'gpt-5.4-nano',
      '5.4': 'gpt-5.4-mini'
    },
    'Gemini': {
      '3.5': 'gemini-3.5-flash',
      '3.1': 'gemini-3.1-flash-lite'
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

module.exports = {
  AI_MODELS,
  MODEL_COLUMN_MAP,
  MODEL_DISPLAY_MAP,
  getModelConfig,
  getSupportedModels,
  getModelCosts,
  getFullModelConfig,
  getDisplayName
};
