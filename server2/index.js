/**
 * 题库代理服务 - VPS版本 (Hono + Node.js)
 * 
 * 拆分版本 - 代码已模块化
 * 
 * 模块说明：
 * - src/config.js: 配置和数据库初始化
 * - src/utils.js: 工具函数
 * - src/auth.js: 认证相关
 * - src/tiku.js: 题库查询
 * - src/admin.js: 管理面板
 * - src/ip-security.js: IP安全机制
 * - src/routes.js: API路由
 */

// 导入配置（会自动初始化数据库）
require('./src/config');

// 导入并启动路由（会自动启动服务器）
require('./src/routes');

console.log('✅ 服务已启动（模块化版本）');
