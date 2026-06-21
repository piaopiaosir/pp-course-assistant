const path = require('path');
const fs = require('fs');
const envPath = fs.existsSync(path.join(__dirname, '../../.env'))
  ? path.join(__dirname, '../../.env')
  : path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const mysql = require('mysql2/promise');

async function test() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tiku'
  };

  console.log(`测试目标: ${config.host}:${config.port}/${config.database}\n`);

  // 1. 连接耗时
  const t1 = Date.now();
  const conn = await mysql.createConnection(config);
  console.log(`连接耗时: ${Date.now() - t1}ms`);

  // 2. 简单查询
  const t2 = Date.now();
  await conn.query('SELECT 1');
  console.log(`SELECT 1: ${Date.now() - t2}ms`);

  // 3. 实际表查询
  const t3 = Date.now();
  await conn.query('SELECT * FROM answer_cache LIMIT 1');
  console.log(`answer_cache查询: ${Date.now() - t3}ms`);

  // 4. 100次查询平均
  const t4 = Date.now();
  for (let i = 0; i < 100; i++) {
    await conn.query('SELECT 1');
  }
  const total = Date.now() - t4;
  console.log(`100次查询总耗时: ${total}ms (平均 ${(total / 100).toFixed(1)}ms/次)`);

  // 5. 并发10连接
  const t5 = Date.now();
  await Promise.all(Array.from({ length: 10 }, () => conn.query('SELECT 1')));
  console.log(`10并发查询: ${Date.now() - t5}ms`);

  await conn.end();
  console.log('\n测试完成');
}

test().catch(e => console.error('测试失败:', e.message));
