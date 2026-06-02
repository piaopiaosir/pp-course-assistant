/**
 * Tavily 搜索服务
 * 提供联网搜索能力,用于AI深度思考时获取最新信息
 * 支持30个API密钥自动切换
 */

const { db, getEnv } = require('./config');

// Tavily API密钥配置(30个) - 提取为模块级常量，避免重复定义
const TAVILY_KEYS = [
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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'
];

const MAX_RECURSION_DEPTH = 30;

const INVALID_KEYS = new Set();

function markKeyAsInvalid(keyIndex) {
  if (keyIndex > 0 && keyIndex <= 30) {
    INVALID_KEYS.add(keyIndex);
    console.log(`🚫 标记Tavily密钥${keyIndex}为失效，当前失效密钥:`, [...INVALID_KEYS]);
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
    // 从当前密钥的下一个开始查找（currentKeyIndex 是 1-30，数组索引是 0-29）
    for (let i = currentKeyIndex; i < 30; i++) {
      if (isKeyInvalid(i + 1)) {
        console.log(`⏭️ 跳过失效的密钥${i + 1}`);
        continue;
      }
      const key = TAVILY_KEYS[i];
      if (key) {
        await db.prepare(
          "UPDATE global_stats SET tavily_current_key = ? WHERE id = 1"
        ).run(i + 1);
        console.log(`🔄 Tavily密钥切换: 切换到密钥${i + 1}`);
        return { key, index: i + 1 };
      }
    }
    
    // 如果后面没有可用密钥,从头开始找
    for (let i = 0; i < currentKeyIndex - 1; i++) {
      if (isKeyInvalid(i + 1)) {
        console.log(`⏭️ 跳过失效的密钥${i + 1}`);
        continue;
      }
      const key = TAVILY_KEYS[i];
      if (key) {
        await db.prepare(
          "UPDATE global_stats SET tavily_current_key = ? WHERE id = 1"
        ).run(i + 1);
        console.log(`🔄 Tavily密钥切换: 切换到密钥${i + 1}`);
        return { key, index: i + 1 };
      }
    }
    
    return null; // 所有密钥都尝试过了

  } catch (e) {
    console.log("⚠️ 切换Tavily密钥失败:", e.message);
    return null;
  }
}

/**
 * 获取当前可用的Tavily API密钥
 * 支持30个密钥自动切换
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

  // 多密钥模式:检查是否需要月度重置（使用事务保证原子性）
  const conn = await require('./config').pool.getConnection();
  try {
    await conn.beginTransaction();

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
      console.log(`🔄 Tavily月度重置: ${lastResetDate || '首次'} -> ${currentMonth}`);
      const resetFields = Array.from({length: 30}, (_, i) => `tavily_key_${i + 1}_usage = 0`).join(', ');
      await conn.query(
        `UPDATE global_stats SET 
          ${resetFields}, tavily_current_key = 1, tavily_last_reset_date = ?,
          updated_at = ? 
        WHERE id = 1`,
        [currentMonth, Math.floor(Date.now() / 1000)]
      );
      
      await conn.commit();
      return keys[0]; // 重置后使用第一个密钥
    }

    // 使用数据库记录的当前密钥
    let currentKeyIndex = stats?.tavily_current_key || 1;
    
    // 检查当前密钥是否已失效，��果是则跳过
    if (isKeyInvalid(currentKeyIndex)) {
      console.log(`⏭️ 当前密钥${currentKeyIndex}已失效，查找下一个可用密钥...`);
      let found = false;
      // 先往后找
      for (let i = currentKeyIndex; i < 30; i++) {
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
        await conn.commit();
        return null; // 所有密钥都失效
      }
    }
    
    await conn.commit();
    const keyObj = keys.find(k => k.index === currentKeyIndex);
    return keyObj || keys[0];

  } catch (e) {
    await conn.rollback();
    console.log("⚠️ 查询Tavily密钥状态失败,使用默认��钥:", e.message);
    return keys[0];
  } finally {
    conn.release();
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
    
    console.log(`📊 Tavily密钥${keyIndex}使用次数: +${increment} (原子递增)`);
  } catch (e) {
    console.log("⚠️ 更新Tavily密钥使用次数失败:", e.message);
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
async function tavilySearch(query, options = {}, _depth = 0) {
  if (_depth > MAX_RECURSION_DEPTH) {
    console.log(`❌ 超过最大递归深度${MAX_RECURSION_DEPTH}次，停止重试`);
    return { results: [], answer: null, error: `超过最大递归深度${MAX_RECURSION_DEPTH}次` };
  }

  const tavilyKeyObj = await getAvailableTavilyKey();
  
  if (!tavilyKeyObj) {
    console.log("⚠️ 未配置 TAVILY_API_KEY,跳过Tavily搜索");
    return { results: [], answer: null, error: '未配置API密钥' };
  }

  const { key: TAVILY_API_KEY, index: keyIndex } = tavilyKeyObj;

  const {
    maxResults = 5,
    searchDepth = 'advanced',
    includeAnswer = true
  } = options;

  try {
    console.log(`━━━ Tavily搜索中... (使用密钥${keyIndex || '默认'}) ━━━`);
    console.log("📍 搜索问题:", query);
    console.log("📍 搜索深度:", searchDepth);
    console.log("📍 最大结果数:", maxResults);
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: query,
        max_results: maxResults,
        search_depth: searchDepth,
        include_answer: includeAnswer
      })
    });

    if (!response.ok) {
      console.log("❌ Tavily搜索失败:", response.status, response.statusText);
      
      // 401: 密钥失效/无效
      if (response.status === 401) {
        console.log(`⚠️ Tavily密钥${keyIndex}无效或已失效`);
        markKeyAsInvalid(keyIndex);
        return { 
          results: [], 
          answer: null, 
          error: `密钥无效(HTTP 401)`,
          shouldSwitchKey: true // 标记需要切换密钥
        };
      }
      
      // 429: 额度用完或频率超限
      if (response.status === 429) {
        // 检查retry-after头,判断是频率限制还是额度用完
        const retryAfter = response.headers.get('retry-after');
        
        if (retryAfter) {
          // 有retry-after头,说明是频率限制,临时切换到其他密钥
          const waitSeconds = parseInt(retryAfter);
          console.log(`⚠️ Tavily密钥${keyIndex}触发频率限制,临时切换到其他密钥...`);
          
          // 尝试切换到其他密钥
          const nextKey = await switchToNextAvailableKey(keyIndex);
          if (nextKey) {
            console.log(`🔄 临时切换到密钥${nextKey.index},重新执行搜索...`);
            return await tavilySearch(query, options, _depth + 1);
          } else {
            // 所有密钥都不可用,等待后重试
            console.log(`⚠️ 所有密钥都不可用,等待${waitSeconds}秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
            return await tavilySearch(query, options, _depth + 1);
          }
        } else {
          // 没有retry-after头,可能是额度用完,切换密钥
          console.log(`⚠️ Tavily密钥${keyIndex}额度可能已用完(HTTP 429),尝试切换...`);
          
          // 尝试切换到下一个有额度的密钥
          const nextKey = await switchToNextAvailableKey(keyIndex);
          if (nextKey) {
            console.log(`🔄 已切换到密钥${nextKey.index},重新执行搜索...`);
            // 递归调用,使用新密钥重新搜索
            return await tavilySearch(query, options, _depth + 1);
          } else {
            console.log("❌ 所有Tavily密钥额度都已用完");
            return { 
              results: [], 
              answer: null, 
              error: '所有Tavily密钥额度已用完',
              shouldSwitchKey: false
            };
          }
        }
      }
      
      // 432: 搜索失败（可能是敏感词或频率限制），尝试切换密钥
      if (response.status === 432) {
        console.log(`⚠️ Tavily密钥${keyIndex}搜索失败(HTTP 432),尝试切换密钥...`);
        const nextKey = await switchToNextAvailableKey(keyIndex);
        if (nextKey) {
          console.log(`🔄 已切换到密钥${nextKey.index},重新执行搜索...`);
          return await tavilySearch(query, options, _depth + 1);
        } else {
          console.log("❌ 所有Tavily密钥都不可用");
          return { 
            results: [], 
            answer: null, 
            error: '所有Tavily密钥都不可用',
            shouldSwitchKey: false
          };
        }
      }
      
      // 其他错误(400/433/500等)
      return { 
        results: [], 
        answer: null, 
        error: `HTTP错误: ${response.status}`,
        shouldSwitchKey: false
      };
    }

    const result = await response.json();
    
    console.log("✅ Tavily搜索成功!");
    console.log("📍 搜索结果数量:", result.results?.length || 0);
    
    if (result.answer) {
      console.log("📍 Tavily直接答案:", result.answer);
    }

    // 更新使用次数(根据搜索深度扣费: basic=1次, advanced=2次)
    if (keyIndex > 0) {
      const cost = searchDepth === 'advanced' ? 2 : 1;
      await updateTavilyKeyUsage(keyIndex, cost);
    }

    return {
      results: result.results || [],
      answer: result.answer || null,
      error: null
    };

  } catch (e) {
    console.error("❌ Tavily搜索异常:", e.message);
    return { 
      results: [], 
      answer: null, 
      error: e.message 
    };
  }
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
    console.error("❌ 查询Tavily用量失败:", e.message);
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
  WEB_SEARCH_TOOL
};
