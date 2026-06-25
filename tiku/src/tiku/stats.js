const { db, SERVER_ID } = require('../config');
const { MODEL_COLUMN_MAP } = require('../config/ai-models');
const { safeAsync } = require('../utils');

// 增加AI调用次数
async function incrementAiCalls() {
  await safeAsync(
    () => db.prepare("UPDATE global_stats SET ai_calls_count = ai_calls_count + 1, updated_at = ? WHERE id = 1").run(Math.floor(Date.now() / 1000)),
    "更新AI调用次数失败"
  );
}

// 增加题库海调用次数
async function incrementTikuCalls() {
  await safeAsync(
    async () => {
      await db.prepare("UPDATE global_stats SET tiku_calls_count = tiku_calls_count + 1, updated_at = ? WHERE id = 1").run(Math.floor(Date.now() / 1000));
      console.log("[OK] 题库海调用次数已更新");
    },
    "更新题库海调用次数失败"
  );
}

// 更新 Hive-Net 剩余次数
async function updateHiveNetRemaining(remaining) {
  if (remaining === undefined || remaining === null) return;

  await safeAsync(
    async () => {
      await db.prepare("UPDATE global_stats SET hivenet_remaining = ?, updated_at = ? WHERE id = 1").run(remaining, Math.floor(Date.now() / 1000));
      console.log("[OK] Hive-Net 剩余次数已更新:", remaining);
    },
    "更新 Hive-Net 剩余次数失败"
  );
}

// 增加 Hive-Net 调用次数
async function incrementHiveNetCalls() {
  await safeAsync(
    async () => {
      await db.prepare("UPDATE global_stats SET hivenet_calls_count = hivenet_calls_count + 1, updated_at = ? WHERE id = 1").run(Math.floor(Date.now() / 1000));
      console.log("[OK] Hive-Net 调用次数已更新");
    },
    "更新 Hive-Net 调用次数失败"
  );
}

// 更新 UCUC 题库剩余次数
async function updateUcucRemaining(remaining) {
  await safeAsync(
    async () => {
      await db.prepare("UPDATE global_stats SET ucuc_remaining = ?, updated_at = ? WHERE id = 1").run(remaining, Math.floor(Date.now() / 1000));
      console.log("[OK] UCUC 题库剩余次数已更新:", remaining);
    },
    "更新 UCUC 剩余次数失败"
  );
}

// 增加 UCUC 题库调用次数
async function incrementUcucCalls() {
  await safeAsync(
    async () => {
      await db.prepare("UPDATE global_stats SET ucuc_calls_count = ucuc_calls_count + 1, updated_at = ? WHERE id = 1").run(Math.floor(Date.now() / 1000));
      console.log("[OK] UCUC 题库调用次数已更新");
    },
    "更新 UCUC 调用次数失败"
  );
}

// 更新言溪题库剩余次数
async function updateYanxiRemaining(remaining) {
  if (remaining === undefined || remaining === null) return;

  await safeAsync(
    async () => {
      await db.prepare("UPDATE global_stats SET yanxi_remaining = ?, updated_at = ? WHERE id = 1").run(remaining, Math.floor(Date.now() / 1000));
      console.log("[OK] 言溪题库剩余次数已更新:", remaining);
    },
    "更新言溪题库剩余次数失败"
  );
}

// 增加言溪题库调用次数
async function incrementYanxiCalls() {
  await safeAsync(
    async () => {
      await db.prepare("UPDATE global_stats SET yanxi_calls_count = yanxi_calls_count + 1, updated_at = ? WHERE id = 1").run(Math.floor(Date.now() / 1000));
      console.log("[OK] 言溪题库调用次数已更新");
    },
    "更新言溪题库调用次数失败"
  );
}

// 增加指定模型的调用次数（通用函数）
async function incrementModelCalls(columnName) {
  // 白名单校验：只允许 MODEL_COLUMN_MAP 中定义的列名
  const allowedColumns = new Set(Object.values(MODEL_COLUMN_MAP));
  if (!allowedColumns.has(columnName)) {
    console.error(`更新模型调用次数失败: 未知列名 "${columnName}"`);
    return;
  }
  await safeAsync(
    () => db.query(
      `UPDATE global_stats SET ?? = ?? + 1, updated_at = ? WHERE id = 1`,
      [columnName, columnName, Math.floor(Date.now() / 1000)]
    ),
    `更新${columnName}调用次数失败`
  );
}

// 增加缓存命中次数
async function incrementCacheHits() {
  await safeAsync(
    async () => {
      await db.prepare("UPDATE global_stats SET cache_hits_count = cache_hits_count + 1, updated_at = ? WHERE id = 1").run(Math.floor(Date.now() / 1000));
      console.log("[OK] 缓存命中次数已更新");
    },
    "更新缓存命中次数失败"
  );
}

// 增加总查询次数
async function incrementTotalQueries(source) {
  await safeAsync(
    async () => {
      await db.prepare("UPDATE global_stats SET total_queries = total_queries + 1, updated_at = ? WHERE id = 1").run(Math.floor(Date.now() / 1000));
      // 记录查询日志（包含服务器ID）
      await db.prepare("INSERT INTO query_logs (source, server_id, created_at) VALUES (?, ?, ?)").run(source, SERVER_ID, Math.floor(Date.now() / 1000));
    },
    "更新总查询次数失败"
  );
}

// D-01去重：统一增加AI调用统计（AI调用次数 + 总查询次数 + 按模型统计）
async function incrementAIStats(model) {
  await incrementAiCalls();
  await incrementTotalQueries('ai');
  const modelColumn = MODEL_COLUMN_MAP[model];
  if (modelColumn) {
    await incrementModelCalls(modelColumn);
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
  incrementAIStats,
  // 剩余次数更新
  updateHiveNetRemaining,
  updateUcucRemaining,
  updateYanxiRemaining
};
