/**
 * 题库代理服务 - VPS版本 (Hono + Node.js)
 * 
 * 主服务器（广州）
 */

// 导入配置（会自动初始化数据库）
require('./src/config');

// 导入并启动路由（会自动启动服务器）
require('./src/routes');

console.log('✅ 主服务已启动（广州服务器）');
