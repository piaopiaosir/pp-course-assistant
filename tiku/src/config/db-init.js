const { db } = require('./db-config');
const { AI_MODELS } = require('./ai-models');

// ==================== 数据库初始化 ====================
async function initDatabase() {
  try {
    // 创建表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        token VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        remaining_count DECIMAL(10,1) DEFAULT 500.0,
        is_blacklisted TINYINT(1) DEFAULT 0,
        is_free_token TINYINT(1) DEFAULT 0,
        last_ip VARCHAR(45),
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        last_used BIGINT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS user_ids (
        user_id VARCHAR(64) PRIMARY KEY,
        user_type INT DEFAULT 1,
        created_ip VARCHAR(45),
        fid VARCHAR(64) DEFAULT NULL COMMENT '用户所属学校/机构ID',
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        welfare_claimed TINYINT DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS answer_cache (
        id INT PRIMARY KEY AUTO_INCREMENT,
        question_hash VARCHAR(64) UNIQUE,
        question TEXT,
        options TEXT,
        type VARCHAR(20),
        answer TEXT,
        source VARCHAR(50),
        is_correct TINYINT DEFAULT NULL COMMENT '答案正确性标记: 1=正确, 0=错误, NULL=未验证',
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP())
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS referrals (
        id INT PRIMARY KEY AUTO_INCREMENT,
        referrer_id VARCHAR(64) NOT NULL,
        referee_id VARCHAR(64) NOT NULL UNIQUE,
        referrer_reward INT DEFAULT 100,
        referee_reward INT DEFAULT 50,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP())
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS global_stats (
        id INT PRIMARY KEY DEFAULT 1,
        tiku_remaining INT DEFAULT 0,
        tiku_calls_count INT DEFAULT 0,
        hivenet_remaining INT DEFAULT 0,
        hivenet_calls_count INT DEFAULT 0,
        yanxi_remaining INT DEFAULT 0,
        yanxi_calls_count INT DEFAULT 0,
        ai_calls_count INT DEFAULT 0,
        deepseek_calls_count INT DEFAULT 0,
        thinking_calls_count INT DEFAULT 0,
        cache_hits_count INT DEFAULT 0,
        total_queries INT DEFAULT 0,
        hivenet_free_last_date VARCHAR(10) DEFAULT '',
        tiku_remaining_1 INT DEFAULT 0,
        tiku_remaining_2 INT DEFAULT 0,
        current_tiku_key INT DEFAULT 1,
        ucuc_remaining INT DEFAULT 0,
        ucuc_calls_count INT DEFAULT 0,
        ${Object.values(AI_MODELS).map(m => `${m.statsColumn} INT DEFAULT 0`).join(',\n        ')},
        tavily_current_key INT DEFAULT 1,
        tavily_key_1_usage INT DEFAULT 0,
        tavily_key_2_usage INT DEFAULT 0,
        tavily_key_3_usage INT DEFAULT 0,
        tavily_key_4_usage INT DEFAULT 0,
        tavily_key_5_usage INT DEFAULT 0,
        tavily_key_6_usage INT DEFAULT 0,
        tavily_key_7_usage INT DEFAULT 0,
        tavily_key_8_usage INT DEFAULT 0,
        tavily_key_9_usage INT DEFAULT 0,
        tavily_key_10_usage INT DEFAULT 0,
        tavily_key_11_usage INT DEFAULT 0,
        tavily_key_12_usage INT DEFAULT 0,
        tavily_key_13_usage INT DEFAULT 0,
        tavily_key_14_usage INT DEFAULT 0,
        tavily_key_15_usage INT DEFAULT 0,
        tavily_key_16_usage INT DEFAULT 0,
        tavily_key_17_usage INT DEFAULT 0,
        tavily_key_18_usage INT DEFAULT 0,
        tavily_key_19_usage INT DEFAULT 0,
        tavily_key_20_usage INT DEFAULT 0,
        tavily_key_21_usage INT DEFAULT 0,
        tavily_key_22_usage INT DEFAULT 0,
        tavily_key_23_usage INT DEFAULT 0,
        tavily_key_24_usage INT DEFAULT 0,
        tavily_key_25_usage INT DEFAULT 0,
        tavily_key_26_usage INT DEFAULT 0,
        tavily_key_27_usage INT DEFAULT 0,
        tavily_key_28_usage INT DEFAULT 0,
        tavily_key_29_usage INT DEFAULT 0,
        tavily_key_30_usage INT DEFAULT 0,
        tavily_last_reset_date VARCHAR(7) DEFAULT '',
        updated_at BIGINT DEFAULT (UNIX_TIMESTAMP())
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS query_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        source VARCHAR(50) NOT NULL,
        question_hash VARCHAR(64),
        server_id VARCHAR(20) DEFAULT 'server1',
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP())
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS ip_blacklist (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ip VARCHAR(45) UNIQUE NOT NULL,
        violation_count INT DEFAULT 1,
        ban_until BIGINT,
        is_permanent TINYINT(1) DEFAULT 0,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        updated_at BIGINT DEFAULT (UNIX_TIMESTAMP())
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS ip_access_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ip VARCHAR(45) UNIQUE NOT NULL,
        endpoint VARCHAR(100),
        user_agent TEXT,
        ip_location VARCHAR(100),
        is_suspicious TINYINT(1) DEFAULT 0,
        access_count INT DEFAULT 1,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        updated_at BIGINT DEFAULT (UNIX_TIMESTAMP())
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS suspicious_ips (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ip VARCHAR(45) UNIQUE NOT NULL,
        user_count INT DEFAULT 0,
        user_ids TEXT,
        reason TEXT,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        updated_at BIGINT DEFAULT (UNIX_TIMESTAMP())
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS ip_whitelist (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ip VARCHAR(45) UNIQUE NOT NULL,
        note VARCHAR(255),
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP())
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS daily_limits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        limit_key VARCHAR(128) NOT NULL,
        limit_date DATE NOT NULL,
        count INT DEFAULT 0,
        updated_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        UNIQUE KEY uk_key_date (limit_key, limit_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS admin_access_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ip VARCHAR(45) NOT NULL,
        session_id VARCHAR(64),
        action VARCHAR(20) NOT NULL COMMENT 'login/logout/view',
        user_agent TEXT,
        ip_location VARCHAR(100) DEFAULT '',
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        INDEX idx_created_at (created_at),
        INDEX idx_ip (ip)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS correctness_reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        question_hash VARCHAR(64) NOT NULL,
        reporter_token VARCHAR(64),
        reporter_user_id VARCHAR(64),
        reporter_ip VARCHAR(45),
        is_correct TINYINT NOT NULL COMMENT '上报结果: 1=正确, 0=错误',
        question_type VARCHAR(20),
        report_count INT DEFAULT 1 COMMENT '相同上报累计次数',
        is_applied TINYINT DEFAULT 0 COMMENT '是否已应用到答案缓存',
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        updated_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        INDEX idx_question_hash (question_hash),
        INDEX idx_reporter_token (reporter_token),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS pp_api_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ip VARCHAR(45) NOT NULL,
        request_count INT DEFAULT 1 COMMENT '同一IP累计请求次数',
        token VARCHAR(64) DEFAULT 'free' COMMENT '请求使用的Token',
        last_used_at BIGINT DEFAULT (UNIX_TIMESTAMP()) COMMENT '最近使用时间',
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        UNIQUE KEY uk_ip_token (ip, token),
        INDEX idx_last_used (last_used_at),
        INDEX idx_ip (ip)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      CREATE TABLE IF NOT EXISTS script_download_ips (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ip VARCHAR(45) NOT NULL COMMENT '用户IP',
        script_key VARCHAR(64) NOT NULL COMMENT '脚本标识',
        limit_date DATE NOT NULL COMMENT '下发日期',
        downloaded TINYINT(1) DEFAULT 1 COMMENT '是否已下载过',
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        updated_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
        UNIQUE KEY uk_ip_script_date (ip, script_key, limit_date),
        INDEX idx_ip (ip),
        INDEX idx_limit_date (limit_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // 创建索引
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ip_access_logs_ip ON ip_access_logs(ip);
      CREATE INDEX IF NOT EXISTS idx_ip_access_logs_created_at ON ip_access_logs(created_at);
    `).catch(() => {}); // 忽略索引已存在的错误

    // 数据库迁移：添加Tavily密钥管理字段（如果不存在）
    try {
      const columns = await db.prepare("SHOW COLUMNS FROM global_stats LIKE 'tavily_current_key'").all();
      if (columns.length === 0) {
        console.log('[SWITCH] 添加Tavily密钥管理字段...');
        const addColumns = [];
        addColumns.push("ADD COLUMN tavily_current_key INT DEFAULT 1 COMMENT '当前使用的Tavily密钥索引(1-50)'");
        for (let i = 1; i <= 50; i++) {
          addColumns.push(`ADD COLUMN tavily_key_${i}_usage INT DEFAULT 0 COMMENT 'Tavily密钥${i}使用次数'`);
        }
        addColumns.push("ADD COLUMN tavily_last_reset_date VARCHAR(7) DEFAULT '' COMMENT '上次重置日期(格式:2026-04)'");
        await db.exec(`ALTER TABLE global_stats ${addColumns.join(', ')}`);
        console.log('[OK] Tavily密钥管理字段添加完成');
      }
    } catch (e) {
      console.log('[WARN] Tavily字段迁移检查失败:', e.message);
    }

    // 数据库迁移：添加Tavily密钥11-50使用次数字段
    try {
      const existingColumns = await db.prepare("SHOW COLUMNS FROM global_stats LIKE 'tavily_key%'").all();
      const existingNames = new Set(existingColumns.map(c => c.Field));
      const missingColumns = [];
      for (let i = 11; i <= 50; i++) {
        if (!existingNames.has(`tavily_key_${i}_usage`)) {
          missingColumns.push(`ADD COLUMN tavily_key_${i}_usage INT DEFAULT 0 COMMENT 'Tavily密钥${i}使用次数'`);
        }
      }
      if (missingColumns.length > 0) {
        console.log(`[SWITCH] 添加Tavily密钥${50 - missingColumns.length + 1}-50使用次数字段...`);
        await db.exec(`ALTER TABLE global_stats ${missingColumns.join(', ')}`);
        console.log('[OK] Tavily密钥11-50字段添加完成');
      }
    } catch (e) {
      console.log('[WARN] Tavily 11-50字段迁移失败:', e.message);
    }

    // 数据库迁移：remaining_count 从 INT 改为 DECIMAL(10,1) 支持小数
    try {
      const colInfo = await db.prepare("SHOW COLUMNS FROM tokens LIKE 'remaining_count'").all();
      if (colInfo.length > 0 && colInfo[0].Type === 'int') {
        console.log('[SWITCH] 迁移 remaining_count: INT → DECIMAL(10,1)...');
        await db.exec("ALTER TABLE tokens MODIFY COLUMN remaining_count DECIMAL(10,1) DEFAULT 500.0");
        console.log('[OK] remaining_count 迁移完成');
      }
    } catch (e) {
      console.log('[WARN] remaining_count 迁移失败:', e.message);
    }

    console.log('[OK] 数据库表初始化完成');
    
    // 初始化全局统计
    const globalStatsExists = await db.prepare("SELECT id FROM global_stats WHERE id = 1").get();
    if (!globalStatsExists) {
      await db.prepare("INSERT INTO global_stats (id) VALUES (1)").run();
      console.log('[OK] 全局统计表初始化完成');
    }
    
    // 自动添加缺失的字段
    await addMissingColumns();
    

  } catch (e) {
    console.error('数据库初始化失败:', e.message);
    throw e;
  }
}

// 自动添加缺失的字段
async function addMissingColumns() {
  try {
    // 获取当前表结构
    const tableInfo = await db.prepare("DESCRIBE global_stats").all();
    const existingColumns = tableInfo.map(row => row.Field);
    
    // 需要添加的新字段列表 - 从 AI_MODELS 的 statsColumn 动态推导
    const modelColumns = Object.values(AI_MODELS).map(m => m.statsColumn);
    // 去重
    const newColumns = [...new Set(modelColumns)];
    
    // 检查并添加缺失的字段
    for (const column of newColumns) {
      if (!existingColumns.includes(column)) {
        console.log(`[PIN] 添加缺失字段: ${column}`);
        // 使用反引号包裹列名，防止SQL注入
        await db.prepare(`ALTER TABLE global_stats ADD COLUMN \`${column}\` INT DEFAULT 0`).run();
      }
    }
    
    // 检查 answer_cache 表的 is_correct 字段
    try {
      const answerCacheColumns = await db.prepare("SHOW COLUMNS FROM answer_cache").all();
      const answerCacheColumnNames = answerCacheColumns.map(col => col.Field);
      
      if (!answerCacheColumnNames.includes('is_correct')) {
        console.log(`[PIN] 添加 answer_cache.is_correct 字段`);
        await db.prepare(`ALTER TABLE answer_cache ADD COLUMN is_correct TINYINT DEFAULT NULL COMMENT '答案正确性标记: 1=正确, 0=错误, NULL=未验证'`).run();
      }
    } catch (e) {
      console.log('[WARN] answer_cache 表字段检查失败:', e.message);
    }
    
    // 检查 user_ids 表的 welfare_claimed 字段
    try {
      const userIdsColumns = await db.prepare("SHOW COLUMNS FROM user_ids").all();
      const userIdsColumnNames = userIdsColumns.map(col => col.Field);
      
      if (!userIdsColumnNames.includes('welfare_claimed')) {
        console.log(`[PIN] 添加 user_ids.welfare_claimed 字段`);
        await db.prepare(`ALTER TABLE user_ids ADD COLUMN welfare_claimed TINYINT DEFAULT 0`).run();
      }
      if (!userIdsColumnNames.includes('fid')) {
        console.log(`[PIN] 添加 user_ids.fid 字段`);
        await db.prepare(`ALTER TABLE user_ids ADD COLUMN fid VARCHAR(64) DEFAULT NULL COMMENT '用户所属学校/机构ID'`).run();
      }
    } catch (e) {
      console.log('[WARN] user_ids 表字段检查失败:', e.message);
    }
    
    // Tavily失效密钥持久化表
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS tavily_invalid_keys (
          key_index INT PRIMARY KEY,
          invalidated_at BIGINT DEFAULT (UNIX_TIMESTAMP())
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `).run();
    } catch (e) {
      console.log('[WARN] 创建 tavily_invalid_keys 表失败:', e.message);
    }
    
    console.log('[OK] 数据库字段检查完成');
    
    // 验证：检查所有模型列是否都已存在
    try {
      const verifyInfo = await db.prepare("DESCRIBE global_stats").all();
      const existingCols = verifyInfo.map(row => row.Field);
      const expectedCols = Object.values(AI_MODELS).map(m => m.statsColumn);
      const missingCols = expectedCols.filter(c => !existingCols.includes(c));
      if (missingCols.length > 0) {
        console.error(`[ERROR] 迁移验证失败！以下模型统计列缺失: ${missingCols.join(', ')}，请手动执行 ALTER TABLE 添加`);
      }
    } catch (e) {
      console.error('迁移验证查询失败:', e.message);
    }
  } catch (e) {
    console.error('添加缺失字段失败:', e.message);
    // 不抛出错误，允许服务继续运行
  }
}

// 执行初始化
// 注意：initDatabase() 由入口文件（routes.js）显式调用，不在模块加载时执行

// 获取全局统计
// 基础默认值 + 从 AI_MODELS 的 statsColumn 动态生成模型列默认值
const DEFAULT_GLOBAL_STATS = {
  tiku_remaining: 0,
  tiku_calls_count: 0,
  hivenet_remaining: 0,
  hivenet_calls_count: 0,
  hivenet_free_last_date: '',
  yanxi_remaining: 0,
  yanxi_calls_count: 0,
  ai_calls_count: 0,
  cache_hits_count: 0,
  total_queries: 0,
  tiku_remaining_1: 0,
  tiku_remaining_2: 0,
  current_tiku_key: 1,
  ucuc_remaining: 0,
  ucuc_calls_count: 0,
  ...Object.fromEntries(Object.values(AI_MODELS).map(m => [m.statsColumn, 0]))
};

async function getGlobalStats() {
  try {
    const stats = await db.prepare("SELECT * FROM global_stats WHERE id = 1").get();
    return { ...DEFAULT_GLOBAL_STATS, ...stats };
  } catch (e) {
    console.error("获取全局统计失败:", e.message);
    return { ...DEFAULT_GLOBAL_STATS };
  }
}

module.exports = { initDatabase, DEFAULT_GLOBAL_STATS, getGlobalStats };
