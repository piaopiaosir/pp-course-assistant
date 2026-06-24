const { db, SERVER_ID } = require('../config');
const { MODEL_COLUMN_MAP } = require('../config/ai-models');

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
    console.log("[OK] 题库海调用次数已更新");
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
    console.log("[OK] Hive-Net 剩余次数已更新:", remaining);
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
    console.log("[OK] Hive-Net 调用次数已更新");
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
    console.log("[OK] UCUC 题库剩余次数已更新:", remaining);
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
    console.log("[OK] UCUC 题库调用次数已更新");
  } catch (e) {
    console.error("更新 UCUC 调用次数失败:", e.message);
  }
}

// 更新言溪题库剩余次数
async function updateYanxiRemaining(remaining) {
  if (remaining === undefined || remaining === null) return;
  
  try {
    await db.prepare(
      "UPDATE global_stats SET yanxi_remaining = ?, updated_at = ? WHERE id = 1"
    ).run(remaining, Math.floor(Date.now() / 1000));
    console.log("[OK] 言溪题库剩余次数已更新:", remaining);
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
    console.log("[OK] 言溪题库调用次数已更新");
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

// 增加缓存命中次数
async function incrementCacheHits() {
  try {
    await db.prepare(
      "UPDATE global_stats SET cache_hits_count = cache_hits_count + 1, updated_at = ? WHERE id = 1"
    ).run(Math.floor(Date.now() / 1000));
    console.log("[OK] 缓存命中次数已更新");
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

module.exports = {
  // 调用次数
  incrementAiCalls,
  incrementTikuCalls,
  incrementHiveNetCalls,
  incrementUcucCalls,
  incrementYanxiCalls,
  incrementModelCalls,
  incrementCacheHits,
  incrementTotalQueries,
  // 剩余次数更新
  updateHiveNetRemaining,
  updateUcucRemaining,
  updateYanxiRemaining
};
