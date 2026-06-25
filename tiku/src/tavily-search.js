/**
 * Tavily 搜索服务
 * 提供联网搜索能力,用于AI深度思考时获取最新信息
 * 支持多API密钥自动切换（数量由环境变量决定）
 */

const { db, getEnv, withTransaction } = require('./config');

// Tavily API密钥配置 - 从环境变量读取，格式：TAVILY_KEY_1 ~ TAVILY_KEY_50
// 启动时自动扫描所有 TAVILY_KEY_* 环境变量
const TAVILY_KEYS = [];
let keyIndex = 1;
while (true) {
  const key = getEnv(`TAVILY_KEY_${keyIndex}`);
  if (!key) break;
  TAVILY_KEYS.push(key);
  keyIndex++;
}
// 兼容单密钥配置
if (TAVILY_KEYS.length === 0) {
  const singleKey = getEnv('TAVILY_API_KEY');
  if (singleKey) TAVILY_KEYS.push(singleKey);
}
const TAVILY_KEY_COUNT = TAVILY_KEYS.length;

const MAX_RECURSION_DEPTH = 30;

const INVALID_KEYS = new Set();

// 启动时从DB加载已持久化的失效密钥
async function loadInvalidKeys() {
  try {
    const rows = await db.prepare("SELECT key_index FROM tavily_invalid_keys").all();
    for (const row of rows) {
      INVALID_KEYS.add(row.key_index);
    }
    if (INVALID_KEYS.size > 0) {
      console.log(`[LIST] 从DB加载${INVALID_KEYS.size}个已失效Tavily密钥`);
    }
  } catch (e) {
    // 表可能不存在，首次运行时忽略
    console.log('[WARN] 加载Tavily失效密钥失败（表可能未创建）:', e.message);
  }
}

function markKeyAsInvalid(keyIndex) {
  if (keyIndex > 0 && keyIndex <= TAVILY_KEY_COUNT) {
    INVALID_KEYS.add(keyIndex);
    // 持久化到DB
    db.prepare("INSERT IGNORE INTO tavily_invalid_keys (key_index, invalidated_at) VALUES (?, ?)").run(keyIndex, Math.floor(Date.now() / 1000)).catch(e => {
      console.log('[WARN] 持久化失效密钥失败:', e.message);
    });
    console.log(`[BLOCK] 标记Tavily密钥${keyIndex}为失效，当前失效密钥:`, [...INVALID_KEYS]);
  }
}

function isKeyInvalid(keyIndex) {
  return INVALID_KEYS.has(keyIndex);
}

/**
 * 切换到下一个可用的Tavily密钥
 * @param {number} currentKeyIndex - 当前密钥索引
 * @returns {Object|null} 新密钥对象或null
 */
async function switchToNextAvailableKey(currentKeyIndex) {
  try {
    // currentKeyIndex 是 1-based，循环从 i=currentKeyIndex 开始（0-based），
    // 即跳过当前密钥，从下一个开始查找（正确行为：避免重新选中频率受限的当前密钥）
    for (let i = currentKeyIndex; i < TAVILY_KEY_COUNT; i++) {
      if (isKeyInvalid(i + 1)) {
        console.log(`[SKIP] 跳过失效的密钥${i + 1}`);
        continue;
      }
      const key = TAVILY_KEYS[i];
      if (key) {
        await db.prepare(
          "UPDATE global_stats SET tavily_current_key = ? WHERE id = 1"
        ).run(i + 1);
        console.log(`[SWITCH] Tavily密钥切换: 切换到密钥${i + 1}`);
        return { key, index: i + 1 };
      }
    }
    
    // 如果后面没有可用密钥,从头开始找
    for (let i = 0; i < currentKeyIndex - 1; i++) {
      if (isKeyInvalid(i + 1)) {
        console.log(`[SKIP] 跳过失效的密钥${i + 1}`);
        continue;
      }
      const key = TAVILY_KEYS[i];
      if (key) {
        await db.prepare(
          "UPDATE global_stats SET tavily_current_key = ? WHERE id = 1"
        ).run(i + 1);
        console.log(`[SWITCH] Tavily密钥切换: 切换到密钥${i + 1}`);
        return { key, index: i + 1 };
      }
    }
    
    return null; // 所有密钥都尝试过了

  } catch (e) {
    console.log("[WARN] 切换Tavily密钥失败:", e.message);
    return null;
  }
}

/**
 * 获取当前可用的Tavily API密钥
 * 支持50个密钥自动切换
 * 每月1号自动刷新额度（使用事务保证原子性）
 */
async function getAvailableTavilyKey() {
  const keys = TAVILY_KEYS.map((key, index) => ({ key, index: index + 1 }));

  if (keys.length === 0) {
    // 兼容旧配置:从环境变量读取单个TAVILY_API_KEY
    const singleKey = getEnv('TAVILY_API_KEY');
    if (singleKey) {
      return { key: singleKey, index: 0 };
    }
    return null;
  }

  if (keys.length === 1) {
    return keys[0];
  }

  // 多密钥模式:检查是否需要月度重置（使用事务保证原子性）（Q-04去重：使用 withTransaction）
  try {
    return await withTransaction(async (conn) => {
      const [rows] = await conn.query(
        "SELECT tavily_current_key, tavily_last_reset_date FROM global_stats WHERE id = 1 FOR UPDATE"
      );
      const stats = rows[0] || {};

      // 检查是否需要月度重置(每月1号)
      const today = new Date();
      const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
      const lastResetDate = stats?.tavily_last_reset_date || '';

      if (currentMonth !== lastResetDate) {
        // 新的一个月,重置所有密钥使用次数
        console.log(`[SWITCH] Tavily月度重置: ${lastResetDate || '首次'} -> ${currentMonth}`);
        const resetFields = Array.from({length: TAVILY_KEY_COUNT}, (_, i) => `tavily_key_${i + 1}_usage = 0`).join(', ');
        await conn.query(
          `UPDATE global_stats SET
            ${resetFields}, tavily_current_key = 1, tavily_last_reset_date = ?,
            updated_at = ?
          WHERE id = 1`,
          [currentMonth, Math.floor(Date.now() / 1000)]
        );

        return keys[0]; // 重置后使用第一个密钥
      }

      // 使用数据库记录的当前密钥
      let currentKeyIndex = stats?.tavily_current_key || 1;

      // 检查当前密钥是否已失效，如果是则跳过
      if (isKeyInvalid(currentKeyIndex)) {
        console.log(`[SKIP] 当前密钥${currentKeyIndex}已失效，查找下一个可用密钥...`);
        let found = false;
        // 先往后找
        for (let i = currentKeyIndex; i < TAVILY_KEY_COUNT; i++) {
          if (!isKeyInvalid(i + 1) && TAVILY_KEYS[i]) {
            currentKeyIndex = i + 1;
            await conn.query("UPDATE global_stats SET tavily_current_key = ? WHERE id = 1", [currentKeyIndex]);
            found = true;
            break;
          }
        }
        // 如果往后没找到，往前找
        if (!found) {
          for (let i = 0; i < currentKeyIndex - 1; i++) {
            if (!isKeyInvalid(i + 1) && TAVILY_KEYS[i]) {
              currentKeyIndex = i + 1;
              await conn.query("UPDATE global_stats SET tavily_current_key = ? WHERE id = 1", [currentKeyIndex]);
              found = true;
              break;
            }
          }
        }
        if (!found) {
          return null; // 所有密钥都失效
        }
      }

      const keyObj = keys.find(k => k.index === currentKeyIndex);
      return keyObj || keys[0];
    });
  } catch (e) {
    console.log("[WARN] 查询Tavily密钥状态失败,使用默认密钥:", e.message);
    return keys[0];
  }
}

/**
 * 更新指定Tavily密钥的使用次数
 * @param {number} keyIndex - 密钥索引(1-30)
 * @param {number} increment - 增加的次数(basic=1, advanced=2)
 */
async function updateTavilyKeyUsage(keyIndex, increment = 1) {
  if (keyIndex <= 0) return; // 单个密钥模式不记录
  
  try {
    const field = `tavily_key_${keyIndex}_usage`;
    // 使用原子递增，避免并发竞态导致计数丢失
    await db.prepare(
      `UPDATE global_stats SET \`${field}\` = \`${field}\` + ?, updated_at = ? WHERE id = 1`
    ).run(increment, Math.floor(Date.now() / 1000));
    
    console.log(`[STAT] Tavily密钥${keyIndex}使用次数: +${increment} (原子递增)`);
  } catch (e) {
    console.log("[WARN] 更新Tavily密钥使用次数失败:", e.message);
  }
}

/**
 * 调用Tavily API进行搜索
 * @param {string} query - 搜索查询
 * @param {Object} options - 搜索选项
 * @param {number} options.maxResults - 最大结果数量,默认5
 * @param {string} options.searchDepth - 搜索深度 'basic' 或 'advanced',默认'advanced'
 * @param {boolean} options.includeAnswer - 是否包含直接答案,默认true
 * @param {number} _depth - 递归深度，内部使用
 * @returns {Promise<Object>} 搜索结果 { results: Array, answer: string }
 */
async function tavilySearch(query, options = {}) {
  // P-02修复：递归改循环，避免重复DB查询
  // 原递归每次都调用 getAvailableTavilyKey 触发DB查询，循环复用密钥列表
  const {
    maxResults = 5,
    searchDepth = 'basic',
    includeAnswer = true,
    autoParameters = false
  } = options;

  // 预加载可用密钥列表，避免递归时重复查询DB
  const tavilyKeyObj = await getAvailableTavilyKey();
  if (!tavilyKeyObj) {
    console.log("[WARN] 未配置 TAVILY_API_KEY,跳过Tavily搜索");
    return { results: [], answer: null, error: '未配置API密钥' };
  }

  let currentKey = tavilyKeyObj.key;
  let currentKeyIndex = tavilyKeyObj.index;

  for (let depth = 0; depth <= MAX_RECURSION_DEPTH; depth++) {
    if (depth === MAX_RECURSION_DEPTH) {
      console.log(`[ERROR] 超过最大重试深度${MAX_RECURSION_DEPTH}次，停止重试`);
      return { results: [], answer: null, error: `超过最大重试深度${MAX_RECURSION_DEPTH}次` };
    }

    try {
      console.log(`=== Tavily搜索中... (使用密钥${currentKeyIndex || '默认'}) ===`);
      console.log("[INFO] 搜索问题:", query);
      console.log("[INFO] 搜索深度:", autoParameters ? '自动(auto_parameters)' : searchDepth);
      console.log("[INFO] 最大结果数:", maxResults);
      
      const requestBody = {
        query: query,
        max_results: maxResults,
        include_answer: includeAnswer,
        auto_parameters: autoParameters
      };
      // autoParameters开启时不传search_depth，让API自动决定；否则使用指定深度
      if (!autoParameters) {
        requestBody.search_depth = searchDepth;
      }
      
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.log("[ERROR] Tavily搜索失败:", response.status, response.statusText);
        
        // 401: 密钥失效/无效
        if (response.status === 401) {
          console.log(`[WARN] Tavily密钥${currentKeyIndex}无效或已失效`);
          markKeyAsInvalid(currentKeyIndex);
          const nextKey = await switchToNextAvailableKey(currentKeyIndex);
          if (nextKey) {
            currentKey = nextKey.key;
            currentKeyIndex = nextKey.index;
            continue; // 用新密钥重试
          }
          return { results: [], answer: null, error: `密钥无效(HTTP 401)` };
        }
        
        // 429: 额度用完或频率超限
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          
          if (retryAfter) {
            // 有retry-after头，频率限制，临时切换到其他密钥
            const waitSeconds = parseInt(retryAfter);
            console.log(`[WARN] Tavily密钥${currentKeyIndex}触发频率限制,临时切换到其他密钥...`);
            
            const nextKey = await switchToNextAvailableKey(currentKeyIndex);
            if (nextKey) {
              console.log(`[SWITCH] 临时切换到密钥${nextKey.index},重新执行搜索...`);
              currentKey = nextKey.key;
              currentKeyIndex = nextKey.index;
              continue;
            } else {
              // 所有密钥都不可用，等待后重试（用当前密钥）
              console.log(`[WARN] 所有密钥都不可用,等待${waitSeconds}秒后重试...`);
              await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
              continue;
            }
          } else {
            // 没有retry-after头，可能是额度用完，切换密钥
            console.log(`[WARN] Tavily密钥${currentKeyIndex}额度可能已用完(HTTP 429),尝试切换...`);
            const nextKey = await switchToNextAvailableKey(currentKeyIndex);
            if (nextKey) {
              console.log(`[SWITCH] 已切换到密钥${nextKey.index},重新执行搜索...`);
              currentKey = nextKey.key;
              currentKeyIndex = nextKey.index;
              continue;
            } else {
              console.log("[ERROR] 所有Tavily密钥额度都已用完");
              return { results: [], answer: null, error: '所有Tavily密钥额度已用完' };
            }
          }
        }
        
        // 432/433: 搜索失败（可能是敏感词或频率限制），尝试切换密钥
        if (response.status === 432 || response.status === 433) {
          console.log(`[WARN] Tavily密钥${currentKeyIndex}搜索失败(HTTP ${response.status}),尝试切换密钥...`);
          const nextKey = await switchToNextAvailableKey(currentKeyIndex);
          if (nextKey) {
            console.log(`[SWITCH] 已切换到密钥${nextKey.index},重新执行搜索...`);
            currentKey = nextKey.key;
            currentKeyIndex = nextKey.index;
            continue;
          } else {
            console.log("[ERROR] 所有Tavily密钥都不可用");
            return { results: [], answer: null, error: '所有Tavily密钥都不可用' };
          }
        }
        
        // 其他错误(400/500等)
        return { results: [], answer: null, error: `HTTP错误: ${response.status}` };
      }

      const result = await response.json();
      
      console.log("[OK] Tavily搜索成功!");
      console.log("[INFO] 搜索结果数量:", result.results?.length || 0);
      
      if (result.answer) {
        console.log("[INFO] Tavily直接答案:", result.answer);
      }

      // 更新使用次数(根据Tavily实际使用的搜索深度扣费)
      const actualSearchDepth = result.auto_parameters?.search_depth || searchDepth;
      console.log(`[INFO] 实际搜索深度: ${actualSearchDepth}`);
      if (currentKeyIndex > 0) {
        const cost = actualSearchDepth === 'advanced' ? 2 : 1;
        await updateTavilyKeyUsage(currentKeyIndex, cost);
      }

      return {
        results: result.results || [],
        answer: result.answer || null,
        error: null
      };

    } catch (e) {
      console.error("[ERROR] Tavily搜索异常:", e.message);
      return { results: [], answer: null, error: e.message };
    }
  }

  // 理论上不会执行到这里（循环内已return）
  return { results: [], answer: null, error: '未知错误' };
}

/**
 * 将Tavily搜索结果格式化为文本上下文
 * @param {Array} results - Tavily搜索结果数组
 * @returns {string} 格式化的搜索上下文字符串
 */
function formatSearchContext(results) {
  if (!results || results.length === 0) {
    return '';
  }

  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\n来源: ${r.url}`)
    .join('\n\n');
}

/**
 * 查询Tavily API用量
 * @returns {Promise<Object>} 用量信息 { usage: number, limit: number, remaining: number }
 */
async function getTavilyUsage() {
  const tavilyKeyObj = await getAvailableTavilyKey();
  
  if (!tavilyKeyObj) {
    return { usage: 0, limit: 0, remaining: 0, error: '未配置API密钥' };
  }

  const { key: TAVILY_API_KEY, index: keyIndex } = tavilyKeyObj;

  try {
    const response = await fetch('https://api.tavily.com/usage', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      }
    });

    if (!response.ok) {
      return { usage: 0, limit: 0, remaining: 0, error: `HTTP错误: ${response.status}` };
    }

    const data = await response.json();
    
    return {
      usage: data.key?.usage || 0,
      limit: data.key?.limit || 0,
      searchUsage: data.key?.search_usage || 0,
      remaining: (data.key?.limit || 0) - (data.key?.usage || 0),
      keyIndex: keyIndex,
      error: null
    };

  } catch (e) {
    console.error("[ERROR] 查询Tavily用量失败:", e.message);
    return { usage: 0, limit: 0, remaining: 0, error: e.message };
  }
}

// ==================== OpenAI Tool Calling 定义 ====================

/**
 * Web搜索工具定义（OpenAI tool calling格式）
 * 让AI自主决定是否搜索、搜索什么关键词
 */
const WEB_SEARCH_TOOL = {
  type: "function",
  function: {
    name: "web_search",
    description: "联网搜索获取最新信息。当你对答案不确定、需要验证知识、或需要查找最新数据时使用此工具。\n\n【重要】搜索后请立即判断：如果搜索结果已经能确定答案，就直接输出答案，不要继续搜索。只有在结果仍然不足时才再次搜索。",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "搜索关键词。建议使用精确的中文短语（可加引号）以提高命中率。"
        }
      },
      required: ["query"]
    }
  }
};

module.exports = {
  tavilySearch,
  formatSearchContext,
  getTavilyUsage,
  getAvailableTavilyKey,
  WEB_SEARCH_TOOL,
  TAVILY_KEY_COUNT,
  loadInvalidKeys
};
