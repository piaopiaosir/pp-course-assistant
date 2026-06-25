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

// 数据库适配器（兼容 SQLite 接口）
const db = {
  // 同步执行多条 SQL（用于初始化）
  async exec(sql) {
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
  },
  
  // 准备语句（带缓存：相同SQL复用预编译语句对象）
  _stmtCache: new Map(),
  prepare(sql) {
    if (this._stmtCache.has(sql)) {
      return this._stmtCache.get(sql);
    }
    const stmt = {
      async all(...params) {
        const [rows] = await pool.query(sql, params);
        return rows;
      },
      async get(...params) {
        const [rows] = await pool.query(sql, params);
        return rows[0] || null;
      },
      async run(...params) {
        const [result] = await pool.execute(sql, params);
        return { changes: result.affectedRows, lastInsertRowid: result.insertId };
      }
    };
    this._stmtCache.set(sql, stmt);
    return stmt;
  },
  
  // 直接执行
  async query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  }
};

// ==================== Q-04去重：连接管理工具函数 ====================

// 自动管理连接获取和释放（避免连接泄漏）
async function withConnection(callback) {
  const conn = await pool.getConnection();
  try {
    return await callback(conn);
  } finally {
    conn.release();
  }
}

// 自动管理事务（包括连接获取、事务提交/回滚、连接释放）
// callback 接收 conn 参数，执行业务逻辑；若 callback 抛异常则自动回滚
async function withTransaction(callback) {
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
}

module.exports = { DB_CONFIG, pool, db, withConnection, withTransaction };
