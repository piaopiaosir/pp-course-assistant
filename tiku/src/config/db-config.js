const mysql = require('mysql2/promise');

// MySQL 配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tiku',
  waitForConnections: true,
  connectionLimit: 400,
  queueLimit: 0,
  connectTimeout: 5000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4'
};

// ==================== MySQL 连接池 ====================
const pool = mysql.createPool(DB_CONFIG);
console.log(`[OK] MySQL 连接池已创建: ${DB_CONFIG.host}/${DB_CONFIG.database}`);

// ==================== 数据库重试机制 ====================

// 可重试的数据库错误码
const RETRYABLE_ERRORS = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR']);

// 通用数据库重试包装（仅对网络/连接类错误重试，业务错误不重试）
async function withRetry(fn, maxRetries = 2, delayMs = 500) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (!RETRYABLE_ERRORS.has(e.code) && !RETRYABLE_ERRORS.has(e.errorno)) {
        throw e; // 非网络错误，直接抛出
      }
      if (attempt < maxRetries) {
        console.warn(`[DB重试] ${e.code}，第${attempt + 1}次重试（共${maxRetries}次）...`);
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1))); // 递增延迟
      }
    }
  }
  throw lastError;
}

// ==================== 数据库适配器（内置重试） ====================

const db = {
  // 同步执行多条 SQL（用于初始化）
  async exec(sql) {
    return withRetry(async () => {
      const statements = sql.split(';').filter(s => s.trim());
      const conn = await pool.getConnection();
      try {
        for (const stmt of statements) {
          if (stmt.trim()) {
            await conn.query(stmt);
          }
        }
      } finally {
        conn.release();
      }
    });
  },
  
  // 准备语句（带缓存：相同SQL复用预编译语句对象）
  _stmtCache: new Map(),
  prepare(sql) {
    if (this._stmtCache.has(sql)) {
      return this._stmtCache.get(sql);
    }
    const stmt = {
      async all(...params) {
        return withRetry(() => pool.query(sql, params).then(([rows]) => rows));
      },
      async get(...params) {
        return withRetry(() => pool.query(sql, params).then(([rows]) => rows[0] || null));
      },
      async run(...params) {
        return withRetry(() => pool.execute(sql, params).then(([result]) => ({ changes: result.affectedRows, lastInsertRowid: result.insertId })));
      }
    };
    this._stmtCache.set(sql, stmt);
    return stmt;
  },
  
  // 直接执行
  async query(sql, params = []) {
    return withRetry(async () => {
      const [rows] = await pool.query(sql, params);
      return rows;
    });
  }
};

// ==================== Q-04去重：连接管理工具函数 ====================

// 自动管理连接获取和释放（避免连接泄漏）
async function withConnection(callback) {
  return withRetry(async () => {
    const conn = await pool.getConnection();
    try {
      return await callback(conn);
    } finally {
      conn.release();
    }
  });
}

// 自动管理事务（包括连接获取、事务提交/回滚、连接释放）
// callback 接收 conn 参数，执行业务逻辑；若 callback 抛异常则自动回滚
async function withTransaction(callback) {
  return withRetry(async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  });
}

module.exports = { DB_CONFIG, pool, db, withConnection, withTransaction, withRetry, RETRYABLE_ERRORS };
