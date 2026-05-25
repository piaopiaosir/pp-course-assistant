const { Hono } = require('hono');
const http = require('http');
const crypto = require('crypto');
const { db, getEnv, getGlobalStats, PORT, FREE_MODE, LATEST_VERSION } = require('./config');
const { verifyUserToken, initOrGetToken, checkTokenStatus, decrementCount, recordUserId, getUserIdCreatedAt, getUserType, getUserValidTokens, checkUserIdExists, createTokenForNewUser, updateUserType, checkReferralStatus, getReferralStats, processReferral, verifyUserFid } = require('./auth');
const { getTypeDescription, measureLatency, refreshAllTikuKeys } = require('./tiku');
const { generateLoginHTML, generateAdminHTML } = require('./admin');
const { isIpBanned, recordIpViolation, logIpAccess, checkRateLimit, isIpWhitelisted, getIpWhitelist, clearWhitelistCache, checkLimitedDailyQuota, incrementLimitedCount } = require('./ip-security');
const { handleQuery } = require('./mode-handler');
const { getModelCosts, getFullModelConfig } = require('./modes/ai-mode');
const { recheckSingleQuestion, findDuplicates, removeDuplicateRecords } = require('./recheck');

// ==================== 工具函数 ====================

/**
 * 获取客户端真实IP
 * @param {Object} c - Hono context
 * @returns {string} 客户端IP
 */
function getClientIp(c) {
  const xri = c.req.header('x-real-ip');
  const rawReq = c.req.raw;
  const socketIp = rawReq?.socket?.remoteAddress;
  let clientIp = xri || socketIp || '127.0.0.1';
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }
  return clientIp;
}

// ==================== 题目查询异步任务管理 ====================
const queryTasks = new Map(); // taskId -> { status, result, createdAt }
const QUERY_TASK_EXPIRY = 5 * 60 * 1000; // 5分钟过期

// 查询速率统计（滑动窗口）
const queryRateWindow = []; // 时间戳数组，记录每次查询请求的时间
const QUERY_RATE_WINDOW_SIZE = 60 * 1000; // 统计最近60秒内的请求

// 记录一次查询请求
function recordQueryRate() {
  queryRateWindow.push(Date.now());
}

// 获取最近60秒的查询速率（次/分钟）
function getQueryRate() {
  const now = Date.now();
  // 清理窗口外的记录
  while (queryRateWindow.length > 0 && now - queryRateWindow[0] > QUERY_RATE_WINDOW_SIZE) {
    queryRateWindow.shift();
  }
  return queryRateWindow.length;
}

// 轮询间隔（暂时统一1秒，关闭动态速率）
function calculatePollInterval() {
  return 1000;
}

// 清理过期任务
const _queryTaskCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [taskId, task] of queryTasks.entries()) {
    if (now - task.createdAt > QUERY_TASK_EXPIRY) {
      queryTasks.delete(taskId);
    }
  }
}, 60 * 1000); // 每60秒清理一次

// ==================== 最近查询题目追踪（用于上报验证） ====================
const recentlyQueriedQuestions = new Map(); // token -> { hashes: Set, lastAccess: number }
const RECENTLY_QUERIED_EXPIRY = 30 * 60 * 1000; // 30分钟过期

// 记录最近查询的题目
const MAX_QUERIED_PER_TOKEN = 200;
function recordRecentlyQueried(token, questionHash) {
  let entry = recentlyQueriedQuestions.get(token);
  if (!entry) {
    entry = { hashes: new Set(), lastAccess: Date.now() };
    recentlyQueriedQuestions.set(token, entry);
  }
  entry.lastAccess = Date.now(); // 刷新访问时间
  entry.hashes.add(questionHash);
  if (entry.hashes.size > MAX_QUERIED_PER_TOKEN) {
    entry.hashes.delete(entry.hashes.values().next().value);
  }
}

// 检查题目是否是最近查询过的
function isRecentlyQueried(token, questionHash) {
  const entry = recentlyQueriedQuestions.get(token);
  if (!entry) return false;
  return entry.hashes.has(questionHash);
}

// 清理过期的查询记录（每60秒逐个删除30分钟未访问的token）
const _recentlyQueriedCleanupTimer = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, entry] of recentlyQueriedQuestions.entries()) {
    if (now - entry.lastAccess > RECENTLY_QUERIED_EXPIRY) {
      recentlyQueriedQuestions.delete(token);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[最近查询追踪] 清理${cleaned}个过期token，剩余${recentlyQueriedQuestions.size}个`);
  }
}, 60 * 1000);

// ==================== 管理面板Session认证 ====================
const adminSessions = new Map(); // sessionId -> { createdAt, ip }
const ADMIN_SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30天

const adminLoginAttempts = new Map(); // IP -> { count, firstAttempt }
const ADMIN_LOGIN_LIMIT = 5; // 最大尝试次数
const ADMIN_LOGIN_WINDOW = 15 * 60 * 1000; // 15分钟窗口

// 记录管理面板访问
async function logAdminAccess(ip, sessionId, action, userAgent) {
  try {
    const { getIpLocation } = require('./ip-security');
    const location = await getIpLocation(ip);
    await db.prepare(`
      INSERT INTO admin_access_logs (ip, session_id, action, user_agent, ip_location, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ip, sessionId || '', action, userAgent || '', location, Math.floor(Date.now() / 1000));
    console.log(`[管理面板访问记录] ✓ ${ip}(${location}) ${action} session=${sessionId?.substring(0,8)}...`);
  } catch (e) {
    console.error('[管理面板访问记录] 写入失败:', e.message);
  }
}

// 时序安全密码比较（防止计时攻击）
function safeComparePassword(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // 仍执行比较以避免长度泄露
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// 创建管理员session
function createAdminSession(ip) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  adminSessions.set(sessionId, { createdAt: Date.now(), ip });
  return sessionId;
}

// 验证管理员session
function validateAdminSession(sessionId) {
  if (!sessionId) return false;
  const session = adminSessions.get(sessionId);
  if (!session) return false;
  if (Date.now() - session.createdAt > ADMIN_SESSION_TTL) {
    adminSessions.delete(sessionId);
    return false;
  }
  return true;
}

// 定期清理过期的登录尝试记录和session（每5分钟）
const _adminSessionCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of adminLoginAttempts.entries()) {
    if (now - record.firstAttempt > ADMIN_LOGIN_WINDOW) {
      adminLoginAttempts.delete(ip);
    }
  }
  for (const [id, session] of adminSessions.entries()) {
    if (now - session.createdAt > ADMIN_SESSION_TTL) {
      adminSessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

function checkAdminLoginLimit(ip) {
  const now = Date.now();
  const record = adminLoginAttempts.get(ip);
  
  if (!record) {
    return { allowed: true, remaining: ADMIN_LOGIN_LIMIT };
  }
  
  // 窗口过期，重置
  if (now - record.firstAttempt > ADMIN_LOGIN_WINDOW) {
    adminLoginAttempts.delete(ip);
    return { allowed: true, remaining: ADMIN_LOGIN_LIMIT };
  }
  
  if (record.count >= ADMIN_LOGIN_LIMIT) {
    return { allowed: false, remaining: 0, waitTime: Math.ceil((ADMIN_LOGIN_WINDOW - (now - record.firstAttempt)) / 60000) };
  }
  
  return { allowed: true, remaining: ADMIN_LOGIN_LIMIT - record.count };
}

function recordAdminLoginFailure(ip) {
  const now = Date.now();
  const record = adminLoginAttempts.get(ip);
  
  if (!record || now - record.firstAttempt > ADMIN_LOGIN_WINDOW) {
    adminLoginAttempts.set(ip, { count: 1, firstAttempt: now });
    return { count: 1, remaining: ADMIN_LOGIN_LIMIT - 1 };
  }
  
  record.count++;
  return { count: record.count, remaining: ADMIN_LOGIN_LIMIT - record.count };
}

function clearAdminLoginAttempts(ip) {
  adminLoginAttempts.delete(ip);
}

// 从cookie中读取session ID
function getSessionFromCookie(c) {
  const cookieHeader = c.req.header('cookie') || '';
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  return match ? match[1] : null;
}

// 管理接口验证函数（基于session）
function verifyAdminSession(c) {
  const sessionId = getSessionFromCookie(c);
  if (!sessionId || !validateAdminSession(sessionId)) {
    return { valid: false, error: '会话已过期，请重新登录', status: 401 };
  }
  return { valid: true };
}

// ==================== Hono应用 ====================

const app = new Hono();

// IP安全检查中间件（在CORS之前）
app.use('*', async (c, next) => {
  try {
    const path = c.req.path;
    
    // 管理接口跳过安全检查
    if (path === '/admin' || path.startsWith('/admin/')) {
      return await next();
    }
    
    // 公告接口跳过安全检查
    if (path === '/notice') {
      return await next();
    }
    
    // 内部同步接口跳过安全检查（由内部API密钥保护）
    if (path.startsWith('/internal/')) {
      return await next();
    }
    
    // 获取真实IP - 多种方式尝试
    const xff = c.req.header('x-forwarded-for');
    const xri = c.req.header('x-real-ip');
    
    // 尝试从原生请求获取
    const rawReq = c.req.raw;
    const socketIp = rawReq?.socket?.remoteAddress;
    const connectionIp = rawReq?.connection?.remoteAddress;
    
    // 处理IPv6前缀
    let cleanIp = socketIp || connectionIp || '';
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.substring(7);
    }
    
    const ip = xff?.split(',')[0]?.trim() || 
               xri || 
               cleanIp ||
               '127.0.0.1';
    
    // 调试日志（仅对非轮询接口打印，避免日志泛滥）
    if (!path.startsWith('/query-task/') && !path.startsWith('/internal/')) {
      console.log(`[IP] socket=${socketIp}, conn=${connectionIp}, XFF=${xff}, 最终=${ip}`);
    }
    
    // 白名单IP跳过所有安全检查
    if (isIpWhitelisted(ip)) {
      console.log(`[白名单] ${ip} 跳过安全检查`);
      return await next();
    }
    
    // 检查是否被封禁
    const banCheck = await isIpBanned(ip);
    if (banCheck.banned) {
      console.log(`[IP封禁] ${ip} 尝试访问，原因: ${banCheck.reason}`);
      return c.json({
        code: 403,
        msg: `您的IP已被封禁: ${banCheck.reason}`,
        data: null
      }, 403);
    }
    
    // 根据路径设置不同的频率限制
    // 题库查询接口(POST /)允许每秒100次，轮询接口30次，其他接口20次
    let rateLimit = 20; // 默认20次/秒
    if (c.req.method === 'POST' && path === '/') {
      rateLimit = 100; // 题库查询100次/秒
    } else if (path.startsWith('/query-task/')) {
      rateLimit = 30; // 轮询接口30次/秒
    }
    
    // 检查请求频率
    const rateCheck = checkRateLimit(ip, rateLimit);
    if (!rateCheck.allowed) {
      console.log(`[频率限制] ${ip} 请求过于频繁: ${rateCheck.count}次/秒 (限制: ${rateLimit}次/秒)`);
      
      // 记录违规并封禁
      const violation = await recordIpViolation(ip);
      
      // 记录可疑访问（不阻塞请求）
      logIpAccess(ip, path, c.req.header('user-agent'), true).catch(() => {});
      
      return c.json({
        code: 429,
        msg: `请求过于频繁，IP已被封禁${violation.banDuration}`,
        data: { violationCount: violation.violationCount }
      }, 429);
    }
    
    // 记录正常访问（不阻塞请求）
    logIpAccess(ip, path, c.req.header('user-agent')).catch(() => {});
    
    await next();
  } catch (error) {
    console.error('[中间件错误]', error);
    // 发生错误时继续执行后续处理，不要阻塞正常请求
    await next();
  }
});

// CORS中间件
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  await next();
  
  c.header('Access-Control-Allow-Origin', '*');
});

// ==================== 内部同步接口 ====================
const fs = require('fs');
const path = require('path');

// 获取轮询间隔配置接口（脚本启动时调用一次）
app.get('/poll-interval', async (c) => {
  return c.json({
    code: 200,
    msg: 'success',
    data: { pollInterval: calculatePollInterval() }
  });
});

// 题目查询轮询接口
app.get('/query-task/:taskId', async (c) => {
  const taskId = c.req.param('taskId');
  const task = queryTasks.get(taskId);
  
  if (!task) {
    return c.json({
      code: 404,
      msg: '任务不存在或已过期',
      data: { status: 'expired' }
    }, 404);
  }
  
  return c.json({
    code: 200,
    msg: 'success',
    data: {
      status: task.status, // pending, processing, completed
      result: task.result || null
    }
  });
});

// 内部代码同步接口（供第二台服务器使用）

// 内部代码同步接口（供第二台服务器使用）
app.get('/internal/code', async (c) => {
  // 验证内部API密钥
  const apiKey = c.req.header('X-Internal-Key') || c.req.query('key');
  const correctKey = getEnv('INTERNAL_API_KEY', 'internal-secret-key-2024');
  
  if (apiKey !== correctKey) {
    return c.json({ code: 401, msg: '无效的内部API密钥', data: null }, 401);
  }
  
  try {
    const files = {};
    const srcDir = __dirname;
    
    // 读取所有源代码文件
    const codeFiles = ['config.js', 'auth.js', 'tiku.js', 'routes.js', 'mode-handler.js', 'ip-security.js', 'utils.js', 'admin.js', 'tavily-search.js', 'recheck.js'];
    
    for (const file of codeFiles) {
      let filePath;
      filePath = path.join(srcDir, file);
      
      if (fs.existsSync(filePath)) {
        files[file] = fs.readFileSync(filePath, 'utf-8');
      }
    }
    
    // 读取 modes 子目录文件
    const modesDir = path.join(srcDir, 'modes');
    if (fs.existsSync(modesDir)) {
      const modeFiles = fs.readdirSync(modesDir).filter(f => f.endsWith('.js'));
      for (const file of modeFiles) {
        files[`modes/${file}`] = fs.readFileSync(path.join(modesDir, file), 'utf-8');
      }
    }
    
    // 读取 index.js（项目根目录）
    const indexPath = path.join(srcDir, '..', 'index.js');
    if (fs.existsSync(indexPath)) {
      files['index.js'] = fs.readFileSync(indexPath, 'utf-8');
    }
    
    // 读取 package.json
    const packagePath = path.join(srcDir, '..', 'package.json');
    if (fs.existsSync(packagePath)) {
      files['package.json'] = fs.readFileSync(packagePath, 'utf-8');
    }
    
    // 读取 .env 文件（尝试多个路径）
    let envFile = '';
    const envPaths = [
      path.join(srcDir, '..', '.env'),      // src/../.env
      path.join(srcDir, '..', '..', '.env') // src/src/../../.env
    ];
    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        envFile = fs.readFileSync(envPath, 'utf-8');
        console.log(`[内部同步] 读取 .env: ${envPath}`);
        break;
      }
    }
    
    return c.json({
      code: 200,
      msg: 'success',
      data: {
        files,
        envFile
      }
    });
  } catch (e) {
    console.error('[内部同步] 错误:', e.message);
    return c.json({ code: 500, msg: '同步失败: ' + e.message, data: null }, 500);
  }
});

// 管理页面 - 显示登录页（支持session免登录）
app.get('/admin', async (c) => {
  const sessionId = getSessionFromCookie(c);
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const userAgent = c.req.header('user-agent') || '';
  
  // session有效，直接显示管理面板
  if (sessionId && validateAdminSession(sessionId)) {
    // 记录管理面板访问（view操作）
    logAdminAccess(ip, sessionId, 'view', userAgent).catch(() => {});
    
    try {
      const globalStats = await getGlobalStats();
      const userStats = await db.prepare(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN user_type = 0 THEN 1 ELSE 0 END) as paid_users,
          SUM(CASE WHEN user_type = 1 THEN 1 ELSE 0 END) as free_users
        FROM user_ids
      `).get();
      
      const threeDaysAgo = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60);
      const tokenStats = await db.prepare(`
        SELECT 
          COUNT(*) as total_tokens,
          COUNT(CASE WHEN is_blacklisted = 0 AND last_used > ? THEN 1 END) as active_tokens,
          SUM(remaining_count) as total_remaining,
          SUM(CASE WHEN is_blacklisted = 0 AND last_used > ? THEN remaining_count ELSE 0 END) as active_remaining,
          AVG(remaining_count) as avg_remaining
        FROM tokens
      `).get(threeDaysAgo, threeDaysAgo);
      
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      const hourlyRates = {
        tiku: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'tiku' AND created_at > ?`).get(oneHourAgo)).count,
        hivenet: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'hivenet' AND created_at > ?`).get(oneHourAgo)).count,
        yanxi: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'yanxi' AND created_at > ?`).get(oneHourAgo)).count,
        ucuc: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'ucuc' AND created_at > ?`).get(oneHourAgo)).count,
        ai: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'ai' AND created_at > ?`).get(oneHourAgo)).count,
        cache: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'cache' AND created_at > ?`).get(oneHourAgo)).count,
        server1: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE server_id = 'server1' AND created_at > ?`).get(oneHourAgo)).count,
        server2: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE server_id = 'server2' AND created_at > ?`).get(oneHourAgo)).count,
        get total() { return this.tiku + this.hivenet + this.yanxi + this.ucuc + this.ai + this.cache; }
      };
      
      const cacheStats = await db.prepare(`
        SELECT 
          COUNT(*) as total_cached,
          COUNT(CASE WHEN source = 'tiku' THEN 1 END) as tiku_cached,
          COUNT(CASE WHEN source = 'hivenet' THEN 1 END) as hivenet_cached,
          COUNT(CASE WHEN source = 'yanxi' THEN 1 END) as yanxi_cached,
          COUNT(CASE WHEN source = 'ucuc' THEN 1 END) as ucuc_cached,
          COUNT(CASE WHEN source NOT IN ('tiku', 'hivenet', 'yanxi', 'ucuc') THEN 1 END) as ai_cached,
          COUNT(CASE WHEN is_correct = 1 THEN 1 END) as verified_correct,
          COUNT(CASE WHEN is_correct = 0 THEN 1 END) as verified_wrong
        FROM answer_cache
      `).get();
      
      const recentCache = await db.prepare(`
        SELECT question, type, answer, source, is_correct, created_at
        FROM answer_cache ORDER BY created_at DESC LIMIT 10
      `).all();
      
      const topUsers = await db.prepare(`
        SELECT token, user_id, remaining_count, created_at, last_used
        FROM tokens WHERE is_blacklisted = 0 ORDER BY last_used DESC LIMIT 10
      `).all();
      
      const allUsers = await db.prepare(`SELECT created_at, user_type FROM user_ids ORDER BY created_at ASC`).all();
      const now = new Date();
      const utc8Now = new Date(now.getTime() + 8 * 3600000);
      const userTrends = { days: [], total: [], paid: [], free: [] };
      
      for (let i = 29; i >= 0; i--) {
        const dayEnd = new Date(utc8Now);
        dayEnd.setDate(dayEnd.getDate() - i);
        dayEnd.setHours(23, 59, 59, 999);
        const endTs = Math.floor((dayEnd.getTime() - 8 * 3600000) / 1000);
        const label = String(dayEnd.getMonth() + 1).padStart(2, '0') + '-' + String(dayEnd.getDate()).padStart(2, '0');
        let dayTotal = 0, dayPaid = 0, dayFree = 0;
        for (const u of allUsers) {
          if (u.created_at <= endTs) {
            dayTotal++;
            if (u.user_type === 0) dayPaid++;
            else dayFree++;
          }
        }
        userTrends.days.push(label);
        userTrends.total.push(dayTotal);
        userTrends.paid.push(dayPaid);
        userTrends.free.push(dayFree);
      }
      
      const queryTrends = { hours: [], total: [], server1: [], server2: [], tiku: [], hivenet: [], yanxi: [], ucuc: [], ai: [], cache: [] };
      const nowTs = Date.now();
      
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(nowTs - i * 3600000);
        hourStart.setMinutes(0, 0, 0);
        const startTs = Math.floor(hourStart.getTime() / 1000);
        const endTs = startTs + 3600;
        const label = String(hourStart.getHours()).padStart(2, '0') + ':00';
        
        const stats = await db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN server_id = 'server1' THEN 1 ELSE 0 END) as server1,
            SUM(CASE WHEN server_id = 'server2' THEN 1 ELSE 0 END) as server2,
            SUM(CASE WHEN source = 'cache' THEN 1 ELSE 0 END) as cache,
            SUM(CASE WHEN source = 'tiku' THEN 1 ELSE 0 END) as tiku,
            SUM(CASE WHEN source = 'hivenet' THEN 1 ELSE 0 END) as hivenet,
            SUM(CASE WHEN source = 'yanxi' THEN 1 ELSE 0 END) as yanxi,
            SUM(CASE WHEN source = 'ucuc' THEN 1 ELSE 0 END) as ucuc,
            SUM(CASE WHEN source NOT IN ('cache', 'tiku', 'hivenet', 'yanxi', 'ucuc') THEN 1 ELSE 0 END) as ai
          FROM query_logs WHERE created_at >= ? AND created_at < ?
        `).get(startTs, endTs);
        
        queryTrends.hours.push(label);
        queryTrends.total.push(stats.total || 0);
        queryTrends.server1.push(stats.server1 || 0);
        queryTrends.server2.push(stats.server2 || 0);
        queryTrends.cache.push(stats.cache || 0);
        queryTrends.tiku.push(stats.tiku || 0);
        queryTrends.hivenet.push(stats.hivenet || 0);
        queryTrends.yanxi.push(stats.yanxi || 0);
        queryTrends.ucuc.push(stats.ucuc || 0);
        queryTrends.ai.push(stats.ai || 0);
      }
      
      return c.html(generateAdminHTML(userStats, tokenStats, cacheStats, recentCache, topUsers, globalStats, hourlyRates, userTrends, queryTrends));
    } catch (e) {
      return c.text(`管理页面加载失败: ${e.message}`, 500);
    }
  }
  
  // 没有有效session，显示登录页
  return c.html(generateLoginHTML());
});

// 管理页面 - 处理登录
app.post('/admin', async (c) => {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const body = await c.req.parseBody();
  const password = body.password || body.pwd;
  const correctPassword = getEnv('ADMIN_PASSWORD', 'admin123');
  
  // 检查登录限制
  const limitCheck = checkAdminLoginLimit(ip);
  if (!limitCheck.allowed) {
    console.log(`[管理登录] ${ip} 尝试次数过多，需等待 ${limitCheck.waitTime} 分钟`);
    return c.html(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f5f5f5;"><div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.1);"><h2 style="color:#e74c3c;">⚠️ 登录尝试过多</h2><p>请 ${limitCheck.waitTime} 分钟后再试</p></div></body></html>`);
  }
  
  // 时序安全密码比较
  if (!safeComparePassword(password || '', correctPassword)) {
    const result = recordAdminLoginFailure(ip);
    console.log(`[管理登录] ${ip} 密码错误，剩余 ${result.remaining} 次`);
    return c.html(generateLoginHTML());
  }
  
  // 登录成功，清除限制
  clearAdminLoginAttempts(ip);
  
  // 创建session
  const sessionId = createAdminSession(ip);
  
  // 记录管理面板登录
  const userAgent = c.req.header('user-agent') || '';
  logAdminAccess(ip, sessionId, 'login', userAgent);
  console.log(`[管理登录] ${ip} 登录成功，session=${sessionId.substring(0,8)}...`);
  
  try {
    // 获取全局统计
    const globalStats = await getGlobalStats();
    
    // 用户统计（从 user_ids 表统计）
    const userStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN user_type = 0 THEN 1 ELSE 0 END) as paid_users,
        SUM(CASE WHEN user_type = 1 THEN 1 ELSE 0 END) as free_users
      FROM user_ids
    `).get();
    
    // Token统计（从 tokens 表统计）
    const threeDaysAgo = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60);  // 3天前的时间戳
    
    const tokenStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_tokens,
        COUNT(CASE WHEN is_blacklisted = 0 AND last_used > ? THEN 1 END) as active_tokens,
        SUM(remaining_count) as total_remaining,
        SUM(CASE WHEN is_blacklisted = 0 AND last_used > ? THEN remaining_count ELSE 0 END) as active_remaining,
        AVG(remaining_count) as avg_remaining
      FROM tokens
    `).get(threeDaysAgo, threeDaysAgo);
    
    // 各数据源调用速率（最近1小时）
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
    const hourlyRates = {
      tiku: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'tiku' AND created_at > ?`).get(oneHourAgo)).count,
      hivenet: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'hivenet' AND created_at > ?`).get(oneHourAgo)).count,
      yanxi: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'yanxi' AND created_at > ?`).get(oneHourAgo)).count,
      ucuc: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'ucuc' AND created_at > ?`).get(oneHourAgo)).count,
      ai: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'ai' AND created_at > ?`).get(oneHourAgo)).count,
      cache: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE source = 'cache' AND created_at > ?`).get(oneHourAgo)).count,
      server1: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE server_id = 'server1' AND created_at > ?`).get(oneHourAgo)).count,
      server2: (await db.prepare(`SELECT COUNT(*) as count FROM query_logs WHERE server_id = 'server2' AND created_at > ?`).get(oneHourAgo)).count,
      get total() { return this.tiku + this.hivenet + this.yanxi + this.ucuc + this.ai + this.cache; }
    };
    
    // 缓存统计
    // AI来源统计：排除所有题库来源(tiku/hivenet/yanxi/ucuc)，因为AI返回的source是具体模型名(如DeepSeek-V3.2、kimi-k2.6)
    const cacheStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_cached,
        COUNT(CASE WHEN source = 'tiku' THEN 1 END) as tiku_cached,
        COUNT(CASE WHEN source = 'hivenet' THEN 1 END) as hivenet_cached,
        COUNT(CASE WHEN source = 'yanxi' THEN 1 END) as yanxi_cached,
        COUNT(CASE WHEN source = 'ucuc' THEN 1 END) as ucuc_cached,
        COUNT(CASE WHEN source NOT IN ('tiku', 'hivenet', 'yanxi', 'ucuc') THEN 1 END) as ai_cached,
        COUNT(CASE WHEN is_correct = 1 THEN 1 END) as verified_correct,
        COUNT(CASE WHEN is_correct = 0 THEN 1 END) as verified_wrong
      FROM answer_cache
    `).get();
    
    // 最近缓存
    const recentCache = await db.prepare(`
      SELECT 
        question,
        type,
        answer,
        source,
        is_correct,
        created_at
      FROM answer_cache
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    
    // 活跃用户
    const topUsers = await db.prepare(`
      SELECT 
        token,
        user_id,
        remaining_count,
        created_at,
        last_used
      FROM tokens
      WHERE is_blacklisted = 0
      ORDER BY last_used DESC
      LIMIT 10
    `).all();
    
    // 用户增长趋势（最近30天累计用户数）
    // 查询所有用户，用 JS 按 UTC+8 时区处理
    const allUsers = await db.prepare(`
      SELECT created_at, user_type FROM user_ids ORDER BY created_at ASC
    `).all();
    
    // 生成最近30天的日期范围（UTC+8）
    const now = new Date();
    // 当前 UTC+8 时间
    const utc8Now = new Date(now.getTime() + 8 * 3600000);
    
    const userTrends = { days: [], total: [], paid: [], free: [] };
    
    for (let i = 29; i >= 0; i--) {
      // 第 i 天前的日期（UTC+8）
      const dayEnd = new Date(utc8Now);
      dayEnd.setDate(dayEnd.getDate() - i);
      dayEnd.setHours(23, 59, 59, 999);
      
      // 转回 UTC 时间戳用于比较
      const endTs = Math.floor((dayEnd.getTime() - 8 * 3600000) / 1000);
      
      const label = String(dayEnd.getMonth() + 1).padStart(2, '0') + '-' + String(dayEnd.getDate()).padStart(2, '0');
      
      // 累计到当天结束时的用户数
      let dayTotal = 0, dayPaid = 0, dayFree = 0;
      for (const u of allUsers) {
        if (u.created_at <= endTs) {
          dayTotal++;
          if (u.user_type === 0) dayPaid++;
          else dayFree++;
        }
      }
      
      userTrends.days.push(label);
      userTrends.total.push(dayTotal);
      userTrends.paid.push(dayPaid);
      userTrends.free.push(dayFree);
    }
    
    // 查询速率趋势（最近24小时，按小时分组）
    const queryTrends = { 
      hours: [], 
      total: [], server1: [], server2: [],
      tiku: [], hivenet: [], yanxi: [], ucuc: [], ai: [], cache: [] 
    };
    const nowTs = Date.now();
    
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(nowTs - i * 3600000);
      hourStart.setMinutes(0, 0, 0);
      const startTs = Math.floor(hourStart.getTime() / 1000);
      const endTs = startTs + 3600;
      
      const label = String(hourStart.getHours()).padStart(2, '0') + ':00';
      
      const stats = await db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN server_id = 'server1' THEN 1 ELSE 0 END) as server1,
          SUM(CASE WHEN server_id = 'server2' THEN 1 ELSE 0 END) as server2,
          SUM(CASE WHEN source = 'cache' THEN 1 ELSE 0 END) as cache,
          SUM(CASE WHEN source = 'tiku' THEN 1 ELSE 0 END) as tiku,
          SUM(CASE WHEN source = 'hivenet' THEN 1 ELSE 0 END) as hivenet,
          SUM(CASE WHEN source = 'yanxi' THEN 1 ELSE 0 END) as yanxi,
          SUM(CASE WHEN source = 'ucuc' THEN 1 ELSE 0 END) as ucuc,
          SUM(CASE WHEN source NOT IN ('cache', 'tiku', 'hivenet', 'yanxi', 'ucuc') THEN 1 ELSE 0 END) as ai
        FROM query_logs
        WHERE created_at >= ? AND created_at < ?
      `).get(startTs, endTs);
      
      queryTrends.hours.push(label);
      queryTrends.total.push(stats.total || 0);
      queryTrends.server1.push(stats.server1 || 0);
      queryTrends.server2.push(stats.server2 || 0);
      queryTrends.cache.push(stats.cache || 0);
      queryTrends.tiku.push(stats.tiku || 0);
      queryTrends.hivenet.push(stats.hivenet || 0);
      queryTrends.yanxi.push(stats.yanxi || 0);
      queryTrends.ucuc.push(stats.ucuc || 0);
      queryTrends.ai.push(stats.ai || 0);
    }
    
    // 登录成功后重定向到 GET /admin，避免刷新时重复提交表单
    const thirtyDays = 30 * 24 * 60 * 60;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin',
        'Set-Cookie': `admin_session=${sessionId}; Max-Age=${thirtyDays}; Path=/; SameSite=Lax; HttpOnly`
      }
    });
  } catch (e) {
    return c.text(`管理页面加载失败: ${e.message}`, 500);
  }
});

// 数据库管理API - 获取表格数据
app.get('/admin/data', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }
  
  try {
    const table = c.req.query('table') || 'tokens';
    const search = c.req.query('search') || '';
    const searchColumn = c.req.query('searchColumn') || '';
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const offset = (page - 1) * pageSize;
    
    let columns = [];
    let rows = [];
    let total = 0;
    
    // 安全函数：验证列名是否在白名单中
    const validateColumn = (col, allowedColumns) => {
      return allowedColumns.includes(col) ? col : null;
    };
    
    if (table === 'tokens') {
      columns = ['token', 'user_id', 'remaining_count', 'is_blacklisted', 'is_free_token', 'last_ip', 'created_at', 'last_used'];
      let whereClause = '';
      let params = [];
      
      if (search) {
        // 安全验证列名
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          // 搜索指定列（使用反引号包裹列名防止注入）
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          // 搜索所有列
          whereClause = 'WHERE user_id LIKE ? OR token LIKE ? OR last_ip LIKE ?';
          params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }
      }
      
      total = (await db.prepare(`SELECT COUNT(*) as count FROM tokens ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT * FROM tokens ${whereClause} ORDER BY last_used DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    } else if (table === 'user_ids') {
      columns = ['user_id', 'user_type', 'fid', 'created_ip', 'created_at', 'welfare_claimed'];
      let whereClause = '';
      let params = [];
      
      if (search) {
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          whereClause = 'WHERE user_id LIKE ? OR fid LIKE ? OR created_ip LIKE ?';
          params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }
      }
      
      total = (await db.prepare(`SELECT COUNT(*) as count FROM user_ids ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT user_id, user_type, fid, created_ip, created_at, welfare_claimed FROM user_ids ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    } else if (table === 'referrals') {
      columns = ['id', 'referrer_id', 'referee_id', 'referrer_reward', 'referee_reward', 'created_at'];
      let whereClause = '';
      let params = [];
      
      if (search) {
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          whereClause = 'WHERE referrer_id LIKE ? OR referee_id LIKE ?';
          params = [`%${search}%`, `%${search}%`];
        }
      }
      
      total = (await db.prepare(`SELECT COUNT(*) as count FROM referrals ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT * FROM referrals ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    } else if (table === 'ip_blacklist') {
      columns = ['id', 'ip', 'violation_count', 'ban_until', 'is_permanent', 'created_at', 'updated_at'];
      let whereClause = '';
      let params = [];
      
      if (search) {
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          whereClause = 'WHERE ip LIKE ?';
          params = [`%${search}%`];
        }
      }
      
      total = (await db.prepare(`SELECT COUNT(*) as count FROM ip_blacklist ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT * FROM ip_blacklist ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    } else if (table === 'ip_access_logs') {
      columns = ['id', 'ip', 'endpoint', 'ip_location', 'access_count', 'is_suspicious', 'created_at', 'updated_at'];
      let whereClause = '';
      let params = [];
      
      if (search) {
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          whereClause = 'WHERE ip LIKE ? OR ip_location LIKE ? OR endpoint LIKE ?';
          params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }
      }
      
      total = (await db.prepare(`SELECT COUNT(*) as count FROM ip_access_logs ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT * FROM ip_access_logs ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    } else if (table === 'answer_cache') {
      columns = ['id', 'question_hash', 'question', 'options', 'type', 'answer', 'source', 'is_correct', 'created_at'];
      let whereClause = '';
      let params = [];
      
      if (search) {
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          whereClause = 'WHERE question LIKE ? OR answer LIKE ? OR source LIKE ?';
          params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }
      }
      
      total = (await db.prepare(`SELECT COUNT(*) as count FROM answer_cache ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT * FROM answer_cache ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    } else if (table === 'daily_limits') {
      columns = ['id', 'limit_key', 'limit_date', 'count', 'updated_at'];
      let whereClause = '';
      let params = [];
      
      if (search) {
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          whereClause = 'WHERE limit_key LIKE ?';
          params = [`%${search}%`];
        }
      }
      
      total = (await db.prepare(`SELECT COUNT(*) as count FROM daily_limits ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT * FROM daily_limits ${whereClause} ORDER BY limit_date DESC, count DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    } else if (table === 'suspicious_ips') {
      columns = ['id', 'ip', 'user_count', 'user_ids', 'reason', 'created_at', 'updated_at'];
      let whereClause = '';
      let params = [];
      
      if (search) {
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          whereClause = 'WHERE ip LIKE ? OR user_ids LIKE ? OR reason LIKE ?';
          params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }
      }
      
      total = (await db.prepare(`SELECT COUNT(*) as count FROM suspicious_ips ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT * FROM suspicious_ips ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    } else if (table === 'ip_whitelist') {
      columns = ['id', 'ip', 'note', 'created_at'];
      let whereClause = '';
      let params = [];
      
      if (search) {
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          whereClause = 'WHERE ip LIKE ? OR note LIKE ?';
          params = [`%${search}%`, `%${search}%`];
        }
      }
      
      total = (await db.prepare(`SELECT COUNT(*) as count FROM ip_whitelist ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT * FROM ip_whitelist ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    } else if (table === 'admin_access_logs') {
      columns = ['id', 'ip', 'ip_location', 'session_id', 'action', 'user_agent', 'created_at'];
      let whereClause = '';
      let params = [];

      if (search) {
        const safeColumn = validateColumn(searchColumn, columns);
        if (safeColumn) {
          whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
          params = [`%${search}%`];
        } else {
          whereClause = 'WHERE ip LIKE ? OR action LIKE ? OR ip_location LIKE ?';
          params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }
      }

      total = (await db.prepare(`SELECT COUNT(*) as count FROM admin_access_logs ${whereClause}`).get(...params)).count;
      rows = await db.prepare(`SELECT * FROM admin_access_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
    }
    
    return c.json({ columns, rows, total });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 数据库管理API - 删除记录
app.post('/admin/delete', async (c) => {
  try {
    const verify = verifyAdminSession(c);
    if (!verify.valid) {
      return c.json({ error: verify.error }, verify.status);
    }
    const body = await c.req.json();
    const { table, id } = body;
    
    if (table === 'tokens') {
      await db.prepare('DELETE FROM tokens WHERE token = ?').run(id);
    } else if (table === 'user_ids') {
      await db.prepare('DELETE FROM user_ids WHERE user_id = ?').run(id);
    } else if (table === 'referrals') {
      await db.prepare('DELETE FROM referrals WHERE id = ?').run(id);
    } else if (table === 'ip_whitelist') {
      await db.prepare('DELETE FROM ip_whitelist WHERE id = ?').run(id);
      clearWhitelistCache();
    } else if (table === 'ip_blacklist') {
      await db.prepare('DELETE FROM ip_blacklist WHERE id = ?').run(id);
    } else if (table === 'ip_access_logs') {
      await db.prepare('DELETE FROM ip_access_logs WHERE id = ?').run(id);
    } else if (table === 'answer_cache') {
      await db.prepare('DELETE FROM answer_cache WHERE id = ?').run(id);
    } else if (table === 'daily_limits') {
      await db.prepare('DELETE FROM daily_limits WHERE id = ?').run(id);
    } else if (table === 'suspicious_ips') {
      await db.prepare('DELETE FROM suspicious_ips WHERE id = ?').run(id);
    } else {
      return c.json({ error: '不支持的表' }, 400);
    }
    
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 清除题库缓存API
app.post('/admin/clear-cache', async (c) => {
  try {
    const verify = verifyAdminSession(c);
    if (!verify.valid) {
      return c.json({ error: verify.error }, verify.status);
    }
    const body = await c.req.json();
    const { source } = body;
    
    let result;
    if (source && source !== 'all') {
      // 清除指定来源的缓存
      const count = await db.prepare('DELETE FROM answer_cache WHERE source = ?').run(source).changes;
      result = { cleared: count, source: source };
      console.log(`清除缓存: 来源=${source}, 删除=${count}条`);
    } else {
      // 清除所有缓存
      const count = await db.prepare('DELETE FROM answer_cache').run().changes;
      result = { cleared: count, source: 'all' };
      console.log(`清除所有缓存: 删除=${count}条`);
    }
    
    return c.json({ success: true, ...result });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 数据库管理API - 更新记录
app.post('/admin/update', async (c) => {
  try {
    const verify = verifyAdminSession(c);
    if (!verify.valid) {
      return c.json({ error: verify.error }, verify.status);
    }
    const body = await c.req.json();
    const { table, id, data } = body;
    
    // 允许更新的字段白名单
    const allowedFields = {
      'tokens': ['remaining_count', 'is_blacklisted', 'is_free_token', 'last_ip'],
      'user_ids': ['user_type', 'created_ip', 'welfare_claimed'],
      'referrals': ['referrer_reward', 'referee_reward'],
      'ip_whitelist': ['ip', 'note'],
      'answer_cache': ['question', 'options', 'type', 'answer', 'source', 'is_correct']
    };
    
    // 验证表名
    if (!allowedFields[table]) {
      return c.json({ error: '不支持的表' }, 400);
    }
    
    // 构建更新SQL
    const updates = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      const val = data[key];
      // 验证字段名是否在白名单中
      if (val !== '' && allowedFields[table].includes(key)) {
        // 数字字段转换
        if (['remaining_count', 'is_blacklisted', 'is_free_token', 'referrer_reward', 'referee_reward', 'user_type', 'welfare_claimed'].includes(key)) {
          updates.push(`\`${key}\` = ?`);
          values.push(parseInt(val) || 0);
        } else {
          updates.push(`\`${key}\` = ?`);
          values.push(val);
        }
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: '没有要更新的字段' }, 400);
    }
    
    if (table === 'tokens') {
      values.push(id);
      await db.prepare('UPDATE tokens SET ' + updates.join(', ') + ' WHERE token = ?').run(...values);
    } else if (table === 'user_ids') {
      values.push(id);
      await db.prepare('UPDATE user_ids SET ' + updates.join(', ') + ' WHERE user_id = ?').run(...values);
    } else if (table === 'referrals') {
      values.push(parseInt(id));
      await db.prepare('UPDATE referrals SET ' + updates.join(', ') + ' WHERE id = ?').run(...values);
    } else if (table === 'ip_whitelist') {
      values.push(parseInt(id));
      await db.prepare('UPDATE ip_whitelist SET ' + updates.join(', ') + ' WHERE id = ?').run(...values);
      clearWhitelistCache();
    } else if (table === 'answer_cache') {
      values.push(parseInt(id));
      await db.prepare('UPDATE answer_cache SET ' + updates.join(', ') + ' WHERE id = ?').run(...values);
    } else {
      return c.json({ error: '不支持的表' }, 400);
    }
    
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 数据库管理API - 添加记录
app.post('/admin/insert', async (c) => {
  try {
    const verify = verifyAdminSession(c);
    if (!verify.valid) {
      return c.json({ error: verify.error }, verify.status);
    }
    const body = await c.req.json();
    const { table, data } = body;
    
    // 允许添加的字段定义
    const allowedInserts = {
      'tokens': ['token', 'user_id', 'remaining_count', 'is_blacklisted', 'is_free_token', 'last_ip'],
      'user_ids': ['user_id', 'user_type', 'created_ip', 'welfare_claimed'],
      'ip_whitelist': ['ip', 'note'],
      'ip_blacklist': ['ip', 'violation_count', 'ban_until', 'is_permanent'],
      'referrals': ['referrer_id', 'referee_id', 'referrer_reward', 'referee_reward']
    };
    
    // 验证表名
    if (!allowedInserts[table]) {
      return c.json({ error: '该表不支持手动添加数据' }, 400);
    }
    
    // 构建插入SQL
    const columns = [];
    const placeholders = [];
    const values = [];
    const now = Math.floor(Date.now() / 1000);
    
    Object.keys(data).forEach(key => {
      const val = data[key];
      if (allowedInserts[table].includes(key) && val !== '') {
        columns.push(`\`${key}\``);
        placeholders.push('?');
        // 数字字段转换
        if (['remaining_count', 'is_blacklisted', 'is_free_token', 'referrer_reward', 'referee_reward', 'user_type', 'violation_count', 'ban_until', 'is_permanent'].includes(key)) {
          values.push(parseInt(val) || 0);
        } else {
          values.push(val);
        }
      }
    });
    
    if (columns.length === 0) {
      return c.json({ error: '没有要添加的数据' }, 400);
    }
    
    // 添加时间戳字段（如果表需要）
    if (['tokens', 'user_ids', 'ip_whitelist', 'ip_blacklist', 'referrals'].includes(table)) {
      columns.push('`created_at`');
      placeholders.push('?');
      values.push(now);
    }
    if (table === 'tokens') {
      columns.push('`last_used`');
      placeholders.push('?');
      values.push(now);
    }
    if (table === 'ip_blacklist') {
      columns.push('`updated_at`');
      placeholders.push('?');
      values.push(now);
    }
    
    const sql = `INSERT INTO \`${table}\` (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    await db.prepare(sql).run(...values);
    
    // 如果是IP白名单，清除缓存
    if (table === 'ip_whitelist') {
      clearWhitelistCache();
    }
    
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ==================== 重查错误题目 ====================

// 重查任务状态
let recheckTask = null; // { running, total, processed, tikuSuccess, aiSuccess, failed, invalid, updated, startTime, logs }
// SSE 客户端列表（存储 { controller, encoder, aborted } 对象）
let recheckSSEClients = [];
// 日志缓冲区（新连接的 SSE 客户端可以收到之前发出的日志）
let recheckLogBuffer = []; // 最多保留 200 条
// 进度缓冲区（保存最新的进度状态，新连接的 SSE 客户端可以立即收到）
let recheckProgressBuffer = null;

// 推送进度到所有 SSE 客户端
function pushRecheckProgress() {
  if (!recheckTask) return;
  const data = JSON.stringify({
    type: 'progress',
    running: recheckTask.running,
    total: recheckTask.total,
    processed: recheckTask.processed,
    tikuSuccess: recheckTask.tikuSuccess,
    aiSuccess: recheckTask.aiSuccess,
    failed: recheckTask.failed,
    updated: recheckTask.updated
  });
  // 缓冲最新进度（新连接的客户端可以收到）
  recheckProgressBuffer = data;
  pushSSEMessage(data);
}

// 推送日志到所有 SSE 客户端
function pushRecheckLog(level, message) {
  const timestamp = new Date().toLocaleTimeString();
  const data = JSON.stringify({
    type: 'log',
    level,
    message,
    timestamp
  });
  // 存入缓冲区（新连接的客户端可以补收）
  recheckLogBuffer.push(data);
  if (recheckLogBuffer.length > 200) recheckLogBuffer.shift();
  pushSSEMessage(data);
}

// 通用 SSE 消息推送（重查）
function pushSSEMessage(data) {
  const message = `data: ${data}\n\n`;
  console.log(`[SSE] 推送消息给 ${recheckSSEClients.length} 个客户端:`, data.substring(0, 100));
  for (const client of recheckSSEClients) {
    if (client.aborted) continue;
    try {
      client.controller.enqueue(client.encoder.encode(message));
    } catch (e) {
      console.log('[SSE] 推送失败:', e.message);
      client.aborted = true;
    }
  }
  // 清理已断开的客户端
  recheckSSEClients = recheckSSEClients.filter(c => !c.aborted);
}

// SSE 端点：实时推送重查进度
app.get('/admin/recheck/stream', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }

  const encoder = new TextEncoder();
  let aborted = false;
  let heartbeatTimer = null;

  // 监听客户端断开
  c.req.raw.signal.addEventListener('abort', () => {
    aborted = true;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  });

  const stream = new ReadableStream({
    start(controller) {
      // 发送缓冲的最新进度（如果有的话）
      if (recheckProgressBuffer) {
        controller.enqueue(encoder.encode(`data: ${recheckProgressBuffer}\n\n`));
      } else {
        const initialData = { type: 'progress', running: false, total: 0, processed: 0 };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));
      }

      // 发送缓冲的历史日志
      for (const logData of recheckLogBuffer) {
        controller.enqueue(encoder.encode(`data: ${logData}\n\n`));
      }
      
      console.log(`[SSE] 新客户端连接，发送初始进度和 ${recheckLogBuffer.length} 条日志`);

      // 添加到客户端列表
      recheckSSEClients.push({ controller, encoder, aborted });

      // 心跳保活（每15秒发送一次）
      heartbeatTimer = setInterval(() => {
        if (aborted) {
          clearInterval(heartbeatTimer);
          return;
        }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (e) {
          aborted = true;
          clearInterval(heartbeatTimer);
        }
      }, 15000);
    }
  });

  // 用 c.body() 返回流式响应，设置正确的 SSE 头
  return c.body(stream, 200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
});

app.post('/admin/recheck', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }

  // 防止重复启动
  if (recheckTask && recheckTask.running) {
    return c.json({ error: '重查任务正在进行中', total: recheckTask.total, processed: recheckTask.processed }, 409);
  }

  try {
    // 查询错误题目，附带来源信息
    const wrongAnswers = await db.prepare(
      `SELECT question_hash, source FROM answer_cache WHERE is_correct = 0`
    ).all();

    if (wrongAnswers.length === 0) {
      return c.json({ error: '没有需要重查的错误题目', total: 0 }, 200);
    }

    // 排序：题库来源（tiku/hivenet/ucuc/yanxi）优先，AI来源放最后
    const TIKU_SOURCES = ['tiku', 'hivenet', 'ucuc', 'yanxi'];
    wrongAnswers.sort((a, b) => {
      const aIsTiku = TIKU_SOURCES.includes(a.source) ? 0 : 1;
      const bIsTiku = TIKU_SOURCES.includes(b.source) ? 0 : 1;
      return aIsTiku - bIsTiku;
    });

    const tikuCount = wrongAnswers.filter(q => TIKU_SOURCES.includes(q.source)).length;
    const aiCount = wrongAnswers.length - tikuCount;
    console.log(`[recheck] 排序完成: 题库来源 ${tikuCount} 题优先, AI来源 ${aiCount} 题在后`);

    // 初始化任务状态
    recheckTask = {
      running: true,
      total: wrongAnswers.length,
      processed: 0,
      tikuSuccess: 0,
      aiSuccess: 0,
      failed: 0,
      invalid: 0,
      updated: 0,
      startTime: Date.now()
    };
    // 清空旧日志缓冲区
    recheckLogBuffer = [];

    // 异步执行重查
    console.log(`[recheck] 异步任务即将启动，共 ${wrongAnswers.length} 题`);
    (async () => {
      console.log(`[recheck] === 异步任务已开始执行 ===`);
      pushRecheckLog('info', `开始重查，共 ${wrongAnswers.length} 道错误题目`);
      pushRecheckProgress();
      
      for (let i = 0; i < wrongAnswers.length; i++) {
        const qHash = wrongAnswers[i].question_hash;
        // 先增加进度（和手动脚本一致，让用户立即看到进度）
        recheckTask.processed++;
        pushRecheckLog('info', `[${recheckTask.processed}/${recheckTask.total}] 开始处理 ${qHash.substring(0, 8)}...`);
        pushRecheckProgress();
        
        try {
          const result = await recheckSingleQuestion(qHash);
          if (result.status === 'success') {
            if (result.source === 'tiku') {
              recheckTask.tikuSuccess++;
              pushRecheckLog('success', `题库海找到答案: ${JSON.stringify(result.answer)}`);
            } else {
              recheckTask.aiSuccess++;
              pushRecheckLog('success', `AI找到答案: ${JSON.stringify(result.answer)}`);
            }
            recheckTask.updated++;
          } else if (result.status === 'invalid') {
            recheckTask.invalid++;
            pushRecheckLog('warn', `答案校验失败: ${result.reason || '格式错误'}`);
          } else if (result.status === 'skipped') {
            pushRecheckLog('info', `题目已处理，跳过`);
          } else {
            recheckTask.failed++;
            pushRecheckLog('error', `查询失败: ${result.reason || '无答案'}`);
          }
          pushRecheckProgress();
        } catch (e) {
          recheckTask.failed++;
          pushRecheckLog('error', `处理异常: ${e.message}`);
          pushRecheckProgress();
        }
        // 每题间隔1秒，避免请求过快
        if (i < wrongAnswers.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      recheckTask.running = false;
      pushRecheckLog('info', `完成! 题库:${recheckTask.tikuSuccess} AI:${recheckTask.aiSuccess} 更新:${recheckTask.updated} 失败:${recheckTask.failed}`);
      pushRecheckProgress();
      
      // 发送完成标志
      pushSSEMessage(JSON.stringify({ type: 'done', done: true }));
      recheckSSEClients = [];
    })().catch(e => {
      console.error(`[recheck] 异步任务崩溃:`, e.message, e.stack);
      recheckTask.running = false;
      pushRecheckLog('error', `任务异常终止: ${e.message}`);
      pushRecheckProgress();
    });

    return c.json({ total: wrongAnswers.length, msg: '重查已启动' });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/admin/recheck/status', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }

  if (!recheckTask) {
    return c.json({ running: false, total: 0, processed: 0, tikuSuccess: 0, aiSuccess: 0, failed: 0, updated: 0, remainingWrong: 0 });
  }

  const result = {
    running: recheckTask.running,
    total: recheckTask.total,
    processed: recheckTask.processed,
    tikuSuccess: recheckTask.tikuSuccess,
    aiSuccess: recheckTask.aiSuccess,
    failed: recheckTask.failed,
    updated: recheckTask.updated,
    // 附带日志缓冲区（前端可以根据 logIndex 增量获取）
    logs: recheckLogBuffer,
    logCount: recheckLogBuffer.length
  };

  // 如果任务完成，附带当前剩余错误数
  if (!recheckTask.running) {
    try {
      const remaining = await db.prepare("SELECT COUNT(*) as count FROM answer_cache WHERE is_correct = 0").get();
      result.remainingWrong = remaining.count;
    } catch (e) {
      result.remainingWrong = 0;
    }
  }

  return c.json(result);
});

// ==================== 查重任务 ====================

// 查重任务状态
let dedupTask = null; // { running, totalGroups, totalToRemove, processed, removed, startTime }
let dedupSSEClients = [];
let dedupLogBuffer = [];
let dedupProgressBuffer = null;

function pushDedupProgress() {
  if (!dedupTask) return;
  const data = JSON.stringify({
    type: 'progress',
    running: dedupTask.running,
    totalGroups: dedupTask.totalGroups,
    totalToRemove: dedupTask.totalToRemove,
    processed: dedupTask.processed,
    removed: dedupTask.removed
  });
  dedupProgressBuffer = data;
  pushDedupSSEMessage(data);
}

function pushDedupLog(level, message) {
  const timestamp = new Date().toLocaleTimeString();
  const data = JSON.stringify({ type: 'log', level, message, timestamp });
  dedupLogBuffer.push(data);
  if (dedupLogBuffer.length > 200) dedupLogBuffer.shift();
  pushDedupSSEMessage(data);
}

function pushDedupSSEMessage(data) {
  const message = `data: ${data}\n\n`;
  for (const client of dedupSSEClients) {
    if (client.aborted) continue;
    try {
      client.controller.enqueue(client.encoder.encode(message));
    } catch (e) {
      client.aborted = true;
    }
  }
  dedupSSEClients = dedupSSEClients.filter(c => !c.aborted);
}

// SSE 端点：实时推送查重进度
app.get('/admin/dedup/stream', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }

  const encoder = new TextEncoder();
  let aborted = false;
  let heartbeatTimer = null;

  // 监听客户端断开
  c.req.raw.signal.addEventListener('abort', () => {
    aborted = true;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  });

  const stream = new ReadableStream({
    start(controller) {
      // 发送缓冲的最新进度
      if (dedupProgressBuffer) {
        controller.enqueue(encoder.encode(`data: ${dedupProgressBuffer}\n\n`));
      } else {
        const initialData = JSON.stringify({ type: 'progress', running: false, totalGroups: 0, totalToRemove: 0, processed: 0, removed: 0 });
        controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));
      }

      // 发送缓冲的历史日志
      for (const logData of dedupLogBuffer) {
        controller.enqueue(encoder.encode(`data: ${logData}\n\n`));
      }

      // 添加到客户端列表
      dedupSSEClients.push({ controller, encoder, aborted });

      // 心跳保活（每15秒发送一次）
      heartbeatTimer = setInterval(() => {
        if (aborted) {
          clearInterval(heartbeatTimer);
          return;
        }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (e) {
          aborted = true;
          clearInterval(heartbeatTimer);
        }
      }, 15000);
    }
  });

  // 用 c.body() 返回流式响应，设置正确的 SSE 头
  return c.body(stream, 200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
});

// 启动查重任务
app.post('/admin/dedup', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }

  if (dedupTask && dedupTask.running) {
    return c.json({ error: '查重任务正在进行中', totalGroups: dedupTask.totalGroups, processed: dedupTask.processed }, 409);
  }

  try {
    const { duplicates, totalGroups, totalToRemove } = await findDuplicates();

    if (totalGroups === 0) {
      return c.json({ msg: '没有重复题目', totalGroups: 0, totalToRemove: 0 }, 200);
    }

    dedupTask = {
      running: true,
      totalGroups,
      totalToRemove,
      processed: 0,
      removed: 0,
      startTime: Date.now(),
      duplicates
    };
    dedupLogBuffer = [];

    pushDedupLog('info', `开始查重，共 ${totalGroups} 组重复题目，需删除 ${totalToRemove} 条`);
    pushDedupProgress();

    (async () => {
      for (let i = 0; i < dedupTask.duplicates.length; i++) {
        const group = dedupTask.duplicates[i];
        dedupTask.processed++;
        const removeIds = group.removed.map(r => r.id);
        const keptHash = group.kept.question_hash.substring(0, 8);
        pushDedupLog('info', `[${dedupTask.processed}/${dedupTask.totalGroups}] 保留 ${keptHash}，删除 ${removeIds.length} 条重复`);

        try {
          const deletedCount = await removeDuplicateRecords(removeIds);
          dedupTask.removed += deletedCount;
          pushDedupLog('success', `已删除 ${deletedCount} 条重复记录`);
        } catch (e) {
          pushDedupLog('error', `删除失败: ${e.message}`);
        }
        pushDedupProgress();

        if (i < dedupTask.duplicates.length - 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
      dedupTask.running = false;
      pushDedupLog('info', `完成! 共处理 ${dedupTask.totalGroups} 组，删除 ${dedupTask.removed} 条重复`);
      pushDedupProgress();
      pushDedupSSEMessage(JSON.stringify({ type: 'done', done: true }));
      dedupSSEClients = [];
    })().catch(e => {
      console.error('[dedup] 异步任务崩溃:', e.message);
      dedupTask.running = false;
      pushDedupLog('error', `任务异常终止: ${e.message}`);
      pushDedupProgress();
    });

    return c.json({ totalGroups, totalToRemove, msg: '查重已启动' });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 查重任务状态
app.get('/admin/dedup/status', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }

  if (!dedupTask) {
    return c.json({ running: false, totalGroups: 0, totalToRemove: 0, processed: 0, removed: 0 });
  }

  return c.json({
    running: dedupTask.running,
    totalGroups: dedupTask.totalGroups,
    totalToRemove: dedupTask.totalToRemove,
    processed: dedupTask.processed,
    removed: dedupTask.removed
  });
});

// ==================== IP安全管理接口 ====================

// 获取IP黑名单
app.get('/admin/ip-blacklist', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }
  
  try {
    const blacklist = await db.prepare(`
      SELECT * FROM ip_blacklist ORDER BY updated_at DESC LIMIT 100
    `).all();
    return c.json({ success: true, data: blacklist });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 获取IP访问日志
app.get('/admin/ip-logs', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }
  
  try {
    const hours = parseInt(c.req.query('hours')) || 24;
    const since = Math.floor(Date.now() / 1000) - hours * 3600;
    
    const logs = await db.prepare(`
      SELECT * FROM ip_access_logs 
      WHERE created_at > ? 
      ORDER BY created_at DESC 
      LIMIT 1000
    `).all(since);
    
    return c.json({ success: true, data: logs, count: logs.length });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 手动解封IP
app.post('/admin/unban-ip', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }
  
  try {
    const body = await c.req.json();
    const { ip } = body;
    
    await db.prepare(`DELETE FROM ip_blacklist WHERE ip = ?`).run(ip);
    console.log(`[管理员操作] 解封IP: ${ip}`);
    
    return c.json({ success: true, message: `IP ${ip} 已解封` });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 手动封禁IP
app.post('/admin/ban-ip', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }
  
  try {
    const body = await c.req.json();
    const { ip, permanent } = body;
    const now = Math.floor(Date.now() / 1000);
    
    const existing = await db.prepare(`SELECT * FROM ip_blacklist WHERE ip = ?`).get(ip);
    if (existing) {
      await db.prepare(`
        UPDATE ip_blacklist 
        SET is_permanent = ?, ban_until = ?, updated_at = ?
        WHERE ip = ?
      `).run(permanent ? 1 : 0, permanent ? null : (now + 86400), now, ip);
    } else {
      await db.prepare(`
        INSERT INTO ip_blacklist (ip, violation_count, ban_until, is_permanent, created_at, updated_at)
        VALUES (?, 99, ?, ?, ?, ?)
      `).run(ip, permanent ? null : (now + 86400), permanent ? 1 : 0, now, now);
    }
    
    console.log(`[管理员操作] 封禁IP: ${ip}, 永久: ${permanent}`);
    return c.json({ success: true, message: `IP ${ip} 已封禁` });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 获取IP统计
app.get('/admin/ip-stats', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }
  
  try {
    const totalBanned = (await db.prepare(`SELECT COUNT(*) as count FROM ip_blacklist`).get()).count;
    const permanentBanned = (await db.prepare(`SELECT COUNT(*) as count FROM ip_blacklist WHERE is_permanent = 1`).get()).count;
    const todayLogs = (await db.prepare(`
      SELECT COUNT(*) as count FROM ip_access_logs 
      WHERE created_at > ?
    `).get(Math.floor(Date.now() / 1000) - 86400)).count;
    const suspiciousLogs = (await db.prepare(`
      SELECT COUNT(*) as count FROM ip_access_logs 
      WHERE is_suspicious = 1 AND created_at > ?
    `).get(Math.floor(Date.now() / 1000) - 86400)).count;
    
    return c.json({
      success: true,
      data: {
        totalBanned,
        permanentBanned,
        todayLogs,
        suspiciousLogs
      }
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 刷新题库海密钥剩余次数
app.post('/admin/refresh-tiku-keys', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }
  
  try {
    const results = await refreshAllTikuKeys();
    return c.json({
      success: true,
      message: '题库海密钥刷新完成',
      data: results
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 获取管理面板访问记录
app.get('/admin/access-logs', async (c) => {
  const verify = verifyAdminSession(c);
  if (!verify.valid) {
    return c.json({ error: verify.error }, verify.status);
  }
  
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const search = c.req.query('search') || '';
    const offset = (page - 1) * pageSize;
    
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = 'WHERE ip LIKE ?';
      params = [`%${search}%`];
    }
    
    const total = (await db.prepare(`SELECT COUNT(*) as count FROM admin_access_logs ${whereClause}`).get(...params)).count;
    const rows = await db.prepare(`
      SELECT id, ip, session_id, action, user_agent, created_at
      FROM admin_access_logs ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);
    
    return c.json({
      columns: ['id', 'ip', 'session_id', 'action', 'user_agent', 'created_at'],
      rows,
      total
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});


// ==================== 版本检查接口 ====================

// 获取云端脚本最新版本号（供客户端检查更新）
app.get('/version', async (c) => {
  try {
    return c.json({
      code: 200,
      data: {
        latestVersion: LATEST_VERSION,
        updateUrl: 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%EF%BD%9C%E7%9F%A5%E5%88%B0%E6%99%BA%E6%85%A7%E6%A0%91--%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7CAI%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98%7C%E7%AD%94%E6%A1%88%E6%A0%A1%E9%AA%8C%7C%E9%A3%09%E9%A5%98%E5%8F%8B%E6%83%85%E6%8F%90%E4%BE%9B%7C%E8%87%AA%E5%8A%A8%E8%B7%B3%E8%BD%AC%E4%BB%BB%E5%8A%A1%E7%82%B9%7C%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98%7C%E8%B6%85%E9%AB%98%E9%A2%98%E5%BA%93%E8%A6%86%E7%9B%96%E7%8E%87%7C%E9%80%90%E6%B8%90%E6%94%AF%E6%8C%81%E6%9B%B4%E5%A4%9A%E5%B9%B3%E5%8F%B0.user.js',
        updateMessage: '修复多项已知问题，优化答题准确率，新增更多AI模型支持'
      }
    });
  } catch (e) {
    console.error('获取版本失败:', e);
    return c.json({
      code: 500,
      msg: '获取版本失败'
    }, 500);
  }
});

// 获取AI模型消耗映射
app.get('/model-costs', async (c) => {
  try {
    const costs = getModelCosts();
    return c.json({
      code: 200,
      data: costs
    });
  } catch (error) {
    return c.json({
      code: 500,
      msg: '获取模型消耗失败'
    }, 500);
  }
});

// 获取完整AI模型配置（供客户端动态获取）
app.get('/ai/models', async (c) => {
  try {
    const config = getFullModelConfig();
    return c.json({
      code: 200,
      data: config
    });
  } catch (e) {
    return c.json({
      code: 500,
      msg: '获取模型配置失败: ' + e.message
    }, 500);
  }
});

// 获取公开统计数据（供前端展示）
app.get('/stats', async (c) => {
  try {
    const globalStats = await getGlobalStats();
    
    // 今日查询次数（UTC+8 时区 0:00~24:00）
    const nowUtc8 = new Date(Date.now() + 8 * 3600000);
    const today0Utc8 = new Date(nowUtc8);
    today0Utc8.setUTCHours(0, 0, 0, 0);
    const todayStart = Math.floor((today0Utc8.getTime() - 8 * 3600000) / 1000);
    const todayQueries = (await db.prepare(`
      SELECT COUNT(*) as count FROM query_logs WHERE created_at >= ?
    `).get(todayStart)).count;
    
    // 最近1小时查询速率
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
    const hourlyRate = (await db.prepare(`
      SELECT COUNT(*) as count FROM query_logs WHERE created_at > ?
    `).get(oneHourAgo)).count;
    
    return c.json({
      code: 200,
      data: {
        totalQueries: globalStats.total_queries || 0,
        todayQueries: todayQueries,
        hourlyRate: hourlyRate
      }
    });
  } catch (e) {
    console.error('[统计数据] 获取失败:', e.message);
    return c.json({
      code: 500,
      msg: '获取统计数据失败',
      data: { totalQueries: 0, todayQueries: 0, hourlyRate: 0 }
    }, 500);
  }
});

// 获取系统通知（补偿公告等）- 从环境变量读取
app.get('/notice', async (c) => {
  const noticeEnabled = getEnv('NOTICE_ENABLED', '0') === '1';
  const noticeType = parseInt(getEnv('NOTICE_TYPE', '1'));
  const noticeMessage = getEnv('NOTICE_MESSAGE', '测试');
  
  return c.json({
    code: 200,
    data: {
      enabled: noticeEnabled,
      type: noticeType,
      message: noticeMessage,
      title: '📢 系统公告'
    }
  });
});

// 推荐接口
app.post('/referral', async (c) => {
  try {
    const body = await c.req.json();
    const { referrerId, refereeId } = body;
    
    if (!referrerId || !refereeId) {
      return c.json({
        code: 400,
        msg: "请提供推荐人和被推荐人ID"
      }, 400);
    }
    
    const result = await processReferral(referrerId, refereeId);
    
    return c.json({
      code: result.success ? 200 : 400,
      msg: result.message,
      data: result.success ? {
        referrerReward: result.referrerReward,
        refereeReward: result.refereeReward
      } : null
    });
  } catch (e) {
    return c.json({
      code: 500,
      msg: `推荐处理失败: ${e.message}`
    }, 500);
  }
});

// ==================== 答案正确性上报接口 ====================

// 答案正确性批量上报接口
app.post('/report-answer-results', async (c) => {
  try {
    // ========== 1. 获取客户端信息（不强制验证Token） ==========
    const authHeader = c.req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : 'anonymous';
    
    // 如果有Token，验证有效性（但不强制要求）
    let userId = null;
    if (token !== 'anonymous') {
      const tokenStatus = await checkTokenStatus(token);
      if (tokenStatus.valid) {
        userId = tokenStatus.user_id;
      }
    }
    
    // ========== 2. 参数验证 ==========
    const body = await c.req.json();
    const { results } = body;
    
    if (!results || !Array.isArray(results)) {
      return c.json({
        code: 400,
        msg: "缺少results参数或格式错误"
      }, 400);
    }
    
    // ========== 4. 最近查询验证（新增） ==========
    // 检查上报的题目是否是最近查询过的（防止恶意上报未查询的题目）
    const recentlyQueriedCount = recentlyQueriedQuestions.get(token)?.size || 0;
    console.log(`[最近查询验证] Token: ${token.substring(0, 8)}, 最近查询题目数: ${recentlyQueriedCount}`);
    
    // ========== 4. 处理上报（带可信度验证） ==========
    const clientIp = getClientIp(c);
    
    // 导入需要的函数
    const { generateQuestionHash, recordCorrectnessReport } = require('./tiku');
    
    let successCount = 0;
    let failCount = 0;
    let rejectedCount = 0;
    
    for (const result of results) {
      const { question, options, type, isCorrect } = result;
      
      // 只处理选择题和判断题
      const validTypes = ['0', '1', '3'];
      if (!validTypes.includes(type)) {
        failCount++;
        continue;
      }
      
      // 参数验证
      if (!question || isCorrect === undefined || isCorrect === null) {
        failCount++;
        continue;
      }
      
      // 验证isCorrect只能是0或1
      if (isCorrect !== 0 && isCorrect !== 1) {
        rejectedCount++;
        continue;
      }
      
      // 生成题目哈希
      const questionHash = generateQuestionHash(question, options, type);
      
      // ========== 最近查询验证 ==========
      // 检查题目是否是最近查询过的（防止恶意上报未查询的题目）
      const wasRecentlyQueried = isRecentlyQueried(token, questionHash);
      
      if (!wasRecentlyQueried) {
        // 不拒绝上报，只是不立即应用更新（记录到 correctness_reports 等待验证）
        console.log(`⚠️ 题目不在最近查询记录中 ${questionHash.substring(0, 8)}，记录但不立即应用`);
      }
      
      // ========== 5. 记录上报并检查可信度 ==========
      const reportResult = await recordCorrectnessReport(
        questionHash, 
        token, 
        userId, 
        clientIp, 
        isCorrect, 
        type,
        wasRecentlyQueried  // 是否查询过，决定是否应用更新
      );
      
      if (reportResult.applied) {
        // 单次上报已生效，已应用到答案缓存
        successCount++;
        
        // 重查已改为手动触发，不再自动执行
      } else if (reportResult.pending) {
        // 等待更多验证（或题目未查询过）
        successCount++; // 记录为成功上报，但未立即应用
      }
    }
    
    console.log(`[答案正确性上报] Token: ${token.substring(0, 8)}, 成功: ${successCount}, 失败: ${failCount}, 拒绝: ${rejectedCount}`);
    
    return c.json({
      code: 200,
      msg: "批量上报完成",
      data: {
        successCount,
        failCount,
        rejectedCount,
        total: results.length
      }
    });
  } catch (e) {
    console.error('[答案正确性上报] 处理失败:', e.message);
    return c.json({
      code: 500,
      msg: `上报失败: ${e.message}`
    }, 500);
  }
});

// 免费福利领取接口
app.post('/welfare', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, mode } = body;

    if (!userId) {
      return c.json({ code: 400, msg: '请输入用户ID' }, 400);
    }

    let targetToken = null;
    let targetUserId = null;

    // 判断输入是 Token（16位数字）还是用户ID
    const isTokenInput = /^\d{16}$/.test(userId);

    if (isTokenInput) {
      // 输入的是 Token，直接查 tokens 表
      const tokenRow = await db.prepare(
        'SELECT token, remaining_count, is_blacklisted, user_id FROM tokens WHERE token = ?'
      ).get(userId);

      if (!tokenRow) {
        return c.json({ code: 404, msg: '该Token不存在，请确认后重试' }, 404);
      }

      targetToken = tokenRow;
      targetUserId = tokenRow.user_id;
    } else {
      // 输入的是用户ID，查 user_ids 表
      const user = await db.prepare('SELECT welfare_claimed FROM user_ids WHERE user_id = ?').get(userId);
      if (!user) {
        return c.json({ code: 404, msg: '用户ID不存在，请先使用脚本后再来领取' }, 404);
      }

      targetUserId = userId;

      // 查找该用户最近使用的 token（不过滤黑名单，后面自动解封）
      const token = await db.prepare(
        'SELECT token, remaining_count, is_blacklisted, user_id FROM tokens WHERE user_id = ? ORDER BY last_used DESC LIMIT 1'
      ).get(userId);

      if (!token) {
        return c.json({ code: 404, msg: '未找到有效的Token，请先使用脚本后再来领取' }, 404);
      }

      targetToken = token;
    }

    // 检查是否已领取（通过 user_ids 表，仅当有 user_id 时检查）
    if (targetUserId) {
      const user = await db.prepare('SELECT welfare_claimed FROM user_ids WHERE user_id = ?').get(targetUserId);
      if (user && user.welfare_claimed === 1) {
        return c.json({ code: 400, msg: '您已领取过免费次数，每人仅限一次' }, 400);
      }
    } else {
      // Token 没有绑定 user_id，无法防重复领取
      return c.json({ code: 400, msg: '该Token未绑定用户ID，无法领取次数' }, 400);
    }

    // 如果 token 被拉黑，自动解封
    if (targetToken.is_blacklisted === 1) {
      await db.prepare('UPDATE tokens SET is_blacklisted = 0 WHERE token = ?').run(targetToken.token);
      console.log(`[福利领取] Token ${targetToken.token.substring(0, 8)}*** 已自动解封`);
    }

    // 计算领取次数
    let addedCount = 200;
    if (mode === 'random') {
      // 随机模式：0-199占60%, 200-300占30%, 300-400占10%
      const rand = Math.random();
      if (rand < 0.6) {
        addedCount = Math.floor(Math.random() * 200); // 0~199
      } else if (rand < 0.9) {
        addedCount = 200 + Math.floor(Math.random() * 101); // 200~300
      } else {
        addedCount = 300 + Math.floor(Math.random() * 101); // 300~400
      }
    }

    // 给 token 添加次数
    await db.prepare('UPDATE tokens SET remaining_count = remaining_count + ? WHERE token = ?').run(addedCount, targetToken.token);

    // 设置 welfare_claimed = 1（仅当有 user_id 时）
    if (targetUserId) {
      const user = await db.prepare('SELECT welfare_claimed FROM user_ids WHERE user_id = ?').get(targetUserId);
      if (user) {
        await db.prepare('UPDATE user_ids SET welfare_claimed = 1 WHERE user_id = ?').run(targetUserId);
      } else {
        await db.prepare('INSERT INTO user_ids (user_id, welfare_claimed) VALUES (?, 1)').run(targetUserId);
      }
    }

    console.log(`[福利领取] ${targetUserId ? `用户 ${targetUserId}` : 'Token无绑定用户'} 领取${addedCount}次（${mode === 'random' ? '随机' : '固定'}），Token: ${targetToken.token.substring(0, 8)}***，原余额: ${targetToken.remaining_count}，已解封: ${targetToken.is_blacklisted === 1}`);

    return c.json({
      code: 200,
      msg: `领取成功！已为您的账号添加${addedCount}次查询次数`,
      data: { addedCount, newTotal: targetToken.remaining_count + addedCount, token: targetToken.token, mode: mode === 'random' ? 'random' : 'fixed' }
    });
  } catch (e) {
    console.error('[福利领取] 处理失败:', e.message);
    return c.json({ code: 500, msg: '领取失败，请稍后重试' }, 500);
  }
});

// 获取推荐状态
app.get('/referral/status', async (c) => {
  try {
    const userId = c.req.query('userId');
    const masterSecret = getEnv('MASTER_SECRET');
    
    if (!userId) {
      return c.json({
        code: 400,
        msg: "请提供用户ID"
      }, 400);
    }
    
    // 获取客户端IP
    const clientIp = getClientIp(c);
    
    // 检查是否为新用户（user_ids中没有记录）
    const userExists = await checkUserIdExists(userId);
    
    if (!userExists) {
      // 新用户：记录ID并创建免费token
      const newToken = await createTokenForNewUser(userId, masterSecret, clientIp);
      await recordUserId(userId, clientIp, null);
      console.log(`[推广接口] 为新用户 ${userId} 创建免费Token: ${newToken}`);
    }
    
    const status = await checkReferralStatus(userId);
    const stats = await getReferralStats(userId);
    
    // 判断是否可以填写推荐人
    let canRefer = false;
    let canReferReason = '';
    
    if (status.isReferred) {
      canRefer = false;
      canReferReason = '您已填写过推荐人';
    } else {
      // 检查是否为新用户（24小时内）
      const refereeCreatedAt = await getUserIdCreatedAt(userId);
      const now = Math.floor(Date.now() / 1000);
      const isNewUser = (now - refereeCreatedAt) < 86400;
      
      if (isNewUser) {
        canRefer = true;
        canReferReason = '可以填写推荐人';
      } else {
        canRefer = false;
        canReferReason = '仅限新用户（注册24小时内）填写推荐人';
      }
    }
    
    return c.json({
      code: 200,
      data: {
        canRefer: canRefer,
        canReferReason: canReferReason,
        isReferred: status.isReferred,
        referrerId: status.referrerId,
        myReward: status.myReward,
        totalReferrals: stats.totalReferrals,
        totalRewards: stats.totalRewards,
        userType: await getUserType(userId)
      }
    });
  } catch (e) {
    return c.json({
      code: 500,
      msg: `查询失败: ${e.message}`
    }, 500);
  }
});

// Token验证
app.get('/', async (c) => {
  const token = c.req.query('token');
  const userId = c.req.query('userId') || c.req.query('u') || null;
  const fid = c.req.query('fid') || null;
  const workType = c.req.query('workType') || null;
  const masterSecret = getEnv('MASTER_SECRET');
  
  // 校验 userId 格式（学习通/智慧树用户ID为7-10位纯数字）
  if (userId && !/^\d{7,10}$/.test(userId)) {
    return c.json({ code: 400, msg: '非法用户ID' }, 400);
  }
  
  // 获取客户端IP
  const clientIp = getClientIp(c);
  
  console.log(`[Token验证] userId=${userId}, fid=${fid}, workType=${workType}, IP=${clientIp}`);
  
  // 如果token为空，检查是否为新用户
  if (!token && userId) {
    const userExists = await checkUserIdExists(userId);
    if (!userExists) {
      // 新用户，先生成Token（Token会记录IP）
      const newToken = await createTokenForNewUser(userId, masterSecret, clientIp);
      // 从Token记录中获取IP（更可靠）
      const tokenRecord = await db.prepare("SELECT last_ip FROM tokens WHERE token = ?").get(newToken);
      const userIp = tokenRecord?.last_ip || clientIp;
      // 然后记录用户ID，使用Token中的IP，同时记录fid
      await recordUserId(userId, userIp, fid);
      console.log(`为新用户 ${userId} 生成Token: ${newToken}, IP: ${userIp}, fid: ${fid || '未知'}`);
      return c.json({
        code: 200,
        msg: '欢迎新用户！已为您生成Token，赠送40次查询额度',
        data: { valid: true, num: FREE_MODE ? 999999 : 40, isNew: true, newToken: newToken }
      });
    } else {
      // 老用户，检查是否有有效token
      const validTokens = await getUserValidTokens(userId);
      if (validTokens.length > 0) {
        // 有token列表 → 验证fid后才返回（防止泄露）
        // 先尝试绑定fid（如果数据库中没有fid，允许首次绑定）
        if (fid) await recordUserId(userId, null, fid);
        const fidMatch = await verifyUserFid(userId, fid);
        if (!fidMatch) {
          console.log(`[Token验证] userId=${userId} fid验证失败，拒绝返回token列表`);
          return c.json({
            code: 403,
            msg: '身份验证失败，请确保在学习通页面内使用',
            data: { valid: false }
          }, 403);
        }
        return c.json({
          code: 401,
          msg: '请输入您的Token，或选择已有Token',
          data: { valid: false, existingTokens: validTokens }
        }, 401);
      }
      // 老用户但没有有效token → 绑定fid（如果数据库中没有fid），然后返回空列表
      if (fid) await recordUserId(userId, null, fid);
      return c.json({
        code: 401,
        msg: '请输入您的Token',
        data: { valid: false }
      }, 401);
    }
  }
  
  const verifyResult = verifyUserToken(token, masterSecret);
  
  if (verifyResult.valid) {
    const { isNew, record, isBlacklisted } = await initOrGetToken(token, userId, verifyResult.count, clientIp);
    
    if (isBlacklisted) {
      return c.json({
        code: 403,
        msg: '次数已用完，请从新购买token',
        data: { valid: false, num: 0, isBlacklisted: true }
      }, 403);
    }
    
    // 免费Token + 学习通平台 + 上报了userId → 检查是否本人使用
    // 未上报userId或智慧树平台 → 跳过此检查
    if (record && record.is_free_token === 1 && userId && workType && workType !== 'zhs') {
      const tokenOwnerId = record.user_id;
      if (tokenOwnerId && tokenOwnerId !== userId) {
        console.log(`[Token验证] 免费Token不匹配: Token所有者=${tokenOwnerId}, 当前用户=${userId}`);
        return c.json({
          code: 403,
          msg: '免费token，限制本人学习通使用[可切换赞助获取token，不限制账户]',
          data: { valid: false, num: 0, sponsorUrl: 'https://hsfaka.cn/shop/IU2JDO1E' }
        }, 403);
      }
    }
    
    // 更新用户类型（根据 is_free_token 判断，而不是次数）
    if (userId) {
      await updateUserType(userId);
    }
    
    const cardInfo = verifyResult.cardName ? `（${verifyResult.cardName}）` : '';
    return c.json({
      code: 200,
      msg: isNew ? `Token验证成功，已初始化${FREE_MODE ? 999999 : record.remaining_count}次查询额度${cardInfo}` : 'Token验证成功',
      data: { valid: true, num: FREE_MODE ? 999999 : record.remaining_count, isNew: isNew, cardName: verifyResult.cardName }
    });
  } else {
    // Token验证失败，检查用户是否有有效token（需要验证fid才能返回）
    const validTokens = await getUserValidTokens(userId);
    if (validTokens.length > 0) {
      // 有token列表 → 验证fid后才返回（防止泄露）
      // 先尝试绑定fid（如果数据库中没有fid，允许首次绑定）
      if (fid) await recordUserId(userId, null, fid);
      const fidMatch = await verifyUserFid(userId, fid);
      if (!fidMatch) {
        console.log(`[Token验证失败] userId=${userId} fid验证失败，拒绝返回token列表`);
        return c.json({
          code: 403,
          msg: '身份验证失败，请确保在学习通页面内使用',
          data: { valid: false }
        }, 403);
      }
      return c.json({
        code: 401,
        msg: verifyResult.message,
        data: { valid: false, existingTokens: validTokens }
      }, 401);
    }
    // 绑定fid（如果数据库中没有fid）
    if (userId && fid) await recordUserId(userId, null, fid);
    return c.json({
      code: 401,
      msg: verifyResult.message,
      data: { valid: false }
    }, 401);
  }
});

// 题库查询
app.post('/', async (c) => {
  // 生成请求ID，用于区分并发请求
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const log = (msg) => console.log(`[${requestId}] ${msg}`);
  
  try {
    const body = await c.req.json();
    const { token, questionData, verifyAnswer, checkOnly, userId, aiMode, model, enableWebSearch, fid } = body;
    const masterSecret = getEnv('MASTER_SECRET');
    const hunyuanApiKey = getEnv('HUNYUAN_API_KEY');
    
    // 校验 userId 格式（学习通/智慧树用户ID为7-10位纯数字）
    if (userId && !/^\d{7,10}$/.test(userId)) {
      return c.json({ code: 400, msg: '非法用户ID' }, 400);
    }
    
    log(`━━━ 开始处理请求 ━━━`);
    log(`enableWebSearch: ${enableWebSearch}`);
    log(`fid: ${fid || '未提供'}`);
    
    // 检查免费模式
    if (FREE_MODE) {
      log("🌟 免费模式已开启，跳过Token验证和次数扣除");
    }
    
    // 获取客户端IP
    const clientIp = getClientIp(c);
    
    log("━━━ 请求参数 ━━━");
    log(`verifyAnswer: ${verifyAnswer} (${typeof verifyAnswer})`);
    log(`userId: ${userId}`);
    
    // 免费模式：新用户创建token
    if (FREE_MODE && userId) {
      const userExists = await checkUserIdExists(userId);
      if (!userExists) {
        const newToken = await createTokenForNewUser(userId, masterSecret, clientIp);
        await recordUserId(userId, clientIp, fid);
        log(`✓ 免费模式：为新用户 ${userId} 创建Token: ${newToken}`);
      }
    }
    
    // 受限模式：无Token时允许查缓存，不查外部题库和AI
    let limitedMode = false;
    
    // 免费模式跳过验证
    if (!FREE_MODE) {
      // 无Token → 受限模式（只查缓存）
      if (!token) {
        log("⚠️ 无Token，进入受限模式（仅查询缓存）");
        limitedMode = true;
      } else {
        // 验证Token
        const verifyResult = verifyUserToken(token, masterSecret);
        log(`Token验证: ${verifyResult.valid ? "✓ 通过" : "✗ 失败"} - ${verifyResult.message}`);
        
        if (!verifyResult.valid) {
          log("⚠️ Token无效，进入受限模式（仅查询缓存）");
          limitedMode = true;
        } else {
          // 更新Token的IP（如果IP变化）
          const tokenRecord = await initOrGetToken(token, userId, verifyResult.count, clientIp);
          const workType = questionData.workType || '';

          // 检查免费Token使用限制（智慧树跳过，未上报workType跳过）
          if (tokenRecord.record && tokenRecord.record.is_free_token === 1 && userId && workType && workType !== 'zhs') {
            const tokenOwnerId = tokenRecord.record.user_id;

            // 如果Token不属于当前用户
            if (tokenOwnerId && tokenOwnerId !== userId) {
              log(`⚠️ 免费Token不属于当前用户 (Token所有者: ${tokenOwnerId}, 当前用户: ${userId})`);

              // 学习通平台但不是本人
              return c.json({
                code: 403,
                msg: '免费token，限制本人学习通使用[可切换赞助获取token，不限制账户]',
                data: { answer: ['免费token限制本人学习通使用'], num: 0, sponsorUrl: 'https://hsfaka.cn/shop/IU2JDO1E' }
              }, 403);
            }
          }

          // 检查次数（智慧树跳过用户ID验证）
          const skipUserIdCheck = workType === 'zhs';
          const checkResult = await checkTokenStatus(token, userId, skipUserIdCheck);
          log(`次数检查: ${checkResult.success ? `✓ 剩余${checkResult.remainingCount}次` : "✗ " + checkResult.message}`);

          if (!checkResult.success) {
            // 次数用完 → 受限模式
            log("⚠️ 次数不足，进入受限模式（仅查询缓存）");
            limitedMode = true;
          }
        }
      }
    }
    
    // 受限模式下检查每日限额
    if (limitedMode) {
      const quotaCheck = await checkLimitedDailyQuota(userId, clientIp);
      log(`受限模式每日限额: ${quotaCheck.used}/${quotaCheck.total} (key=${quotaCheck.key})`);
      
      if (!quotaCheck.allowed) {
        return c.json({
          code: 429,
          msg: '今日免费查题100次已达上限，明日再试',
          data: { limitedMode: true, answer: ['今日免费查题已达上限，明日再试'], num: 0, dailyQuotaUsed: quotaCheck.used }
        }, 429);
      }
    }
    
    // AI模式和校验模式不允许受限模式
    if (limitedMode && (aiMode === true || aiMode === 'true' || verifyAnswer === true)) {
      return c.json({
        code: 403,
        msg: 'AI模式和校验模式需要输入有效Token',
        data: { limitedMode: true, answer: [], num: 0 }
      }, 403);
    }
    
    // 检查是否为新客户端（支持异步模式）
    const { async: supportAsync } = body;
    if (supportAsync !== true) {
      log("⚠️ 检测到老客户端请求，拒绝服务");
      return c.json({
        code: 426,
        msg: '您的脚本版本过旧，无法使用题库查询功能。请更新到最新版本以继续使用。',
        data: { 
          needUpdate: true,
          hint: '请更新最新脚本'
        }
      }, 426);
    }
    
    // 生成任务ID
    const taskId = 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
    
    // 记录查询速率
    recordQueryRate();
    
    // 创建异步任务
    queryTasks.set(taskId, {
      status: 'pending',
      result: null,
      createdAt: Date.now()
    });
    
    log(`创建异步任务: ${taskId}`);
    
    // 后台异步执行查询
    setImmediate(async () => {
      try {
        // 更新任务状态为处理中
        const existingTask = queryTasks.get(taskId);
        if (!existingTask) {
          log(`任务已过期，跳过处理: ${taskId}`);
          return;
        }
        queryTasks.set(taskId, {
          status: 'processing',
          result: null,
          createdAt: existingTask.createdAt
        });
        
        log(`开始执行异步查询: ${taskId}`);
        
        // 统一调用模式处理器（日志打印在 mode-handler.js 中统一处理）
        // 智慧树跳过用户ID验证
        const skipUserIdCheck = (questionData.workType || '') === 'zhs';
        
        // 创建一个新的Hono context用于异步执行
        const response = await handleQuery(c, {
          token,
          userId,
          questionData,
          verifyAnswer,
          checkOnly,
          aiMode,
          enableWebSearch,  // 传递联网搜索参数
          model,
          hunyuanApiKey,
          log,
          FREE_MODE,
          limitedMode,
          decrementCount,
          skipUserIdCheck
        });
        
        // 解析响应
        let resultData;
        try {
          const clonedResponse = response.clone();
          resultData = await clonedResponse.json();
        } catch (e) {
          resultData = {
            code: 500,
            msg: '响应解析失败',
            data: { answer: [], num: 0 }
          };
        }
        
        // 受限模式下增加每日计数（await 确保计数不丢失）
        if (limitedMode) {
          try {
            await incrementLimitedCount(userId, clientIp);
          } catch (e) {
            console.error('[受限模式] 增加每日计数失败:', e.message);
          }
        }
        
        // 更新任务状态为完成
        const taskForComplete = queryTasks.get(taskId);
        if (!taskForComplete) {
          log(`任务已过期，无法更新完成状态: ${taskId}`);
          return;
        }
        queryTasks.set(taskId, {
          status: 'completed',
          result: resultData,
          createdAt: taskForComplete.createdAt
        });
        
        // ========== 记录最近查询的题目（服务端内部记录，不暴露给客户端） ==========
        // 只有查询成功且有答案时才记录（用于上报验证）
        if (resultData.code === 200 && resultData.data && resultData.data.answer) {
          const { generateQuestionHash } = require('./tiku');
          
          // 记录题目哈希（支持单题和多题）
          if (questionData.question) {
            const questionHash = generateQuestionHash(
              questionData.question,
              questionData.options,
              questionData.type
            );
            recordRecentlyQueried(token || 'anonymous', questionHash);
            // 只在服务端记录，不暴露给客户端
            console.log(`[内部记录] 查询题目 ${questionHash.substring(0, 16)}`);
          }
          
          // 如果有多个题目（批量查询），也记录每个题目
          if (questionData.questions && Array.isArray(questionData.questions)) {
            for (const q of questionData.questions) {
              const qHash = generateQuestionHash(q.question, q.options, q.type);
              recordRecentlyQueried(token || 'anonymous', qHash);
              console.log(`[内部记录] 批量查询题目 ${qHash.substring(0, 16)}`);
            }
          }
        }
        
        log(`异步查询完成: ${taskId}, 结果code=${resultData.code}`);
      } catch (e) {
        log(`异步查询失败: ${taskId}, ${e.message}`);
        const taskForError = queryTasks.get(taskId);
        if (!taskForError) {
          log(`任务已过期，无法更新错误状态: ${taskId}`);
          return;
        }
        queryTasks.set(taskId, {
          status: 'completed',
          result: {
            code: 500,
            msg: '服务器错误: ' + e.message,
            data: { answer: [], num: 0 }
          },
          createdAt: taskForError.createdAt
        });
      }
    });
    
    // 立即返回202 + taskId
    return c.json({
      code: 202,
      status: 'querying',
      msg: '题目查询已启动，请轮询获取结果',
      data: {
        taskId: taskId
      }
    }, 202);
  } catch (e) {
    return c.json({
      code: 500,
      msg: '服务器错误: ' + e.message,
      data: null
    }, 500);
  }
});

// 启动服务器 - 使用原生http模块确保能获取真实IP
console.log(`\n🚀 服务启动中...`);
console.log(`📍 地址: http://localhost:${PORT}`);
console.log(`📊 管理面板: http://localhost:${PORT}/admin`);
if (FREE_MODE) {
  console.log(`🌟 免费模式: 已开启 (无需Token验证，不扣除次数)`);
} else {
  console.log(`🔑 免费模式: 未开启 (需要Token验证)`);
}

// 异步初始化白名单缓存
(async () => {
  try {
    const whitelist = await getIpWhitelist();
    if (whitelist.length > 0) {
      console.log(`🛡️ IP白名单: ${whitelist.join(', ')}`);
    }
  } catch (e) {
    console.log(`🛡️ IP白名单: 暂无`);
  }
})();
console.log();

// 优雅关闭：清理所有定时器
const allTimers = [
  _queryTaskCleanupTimer,
  _recentlyQueriedCleanupTimer,
  _adminSessionCleanupTimer,
  ...require('./ip-security')._timers
];

function gracefulShutdown() {
  console.log('\n🛑 正在关闭服务器...');
  for (const timer of allTimers) {
    clearInterval(timer);
  }
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
  // 5秒超时强制退出
  setTimeout(() => {
    console.log('⚠️ 强制关闭服务器');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const server = http.createServer(async (req, res) => {
  // 获取真实IP
  let clientIp = req.socket.remoteAddress || req.connection.remoteAddress || '127.0.0.1';
  
  // 处理IPv6映射的IPv4地址
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }
  
  // 将真实IP添加到请求头
  req.headers['x-real-ip'] = clientIp;
  
  try {
    // 读取请求体
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }
    
    // 创建标准的Request对象
    const url = `http://${req.headers.host || 'localhost'}${req.url}`;
    
    const webRequest = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: body && body.length > 0 ? body : null,
      duplex: 'half'
    });
    
    // 调用Hono处理
    const response = await app.fetch(webRequest);
    
    // 返回响应
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // SSE 流式响应：直接 pipe ReadableStream 到 res
    if (response.headers.get('content-type')?.includes('text/event-stream') && response.body) {
      const reader = response.body.getReader();
      const flush = res.socket?.setNoDelay?.(true);
      res.socket?.setKeepAlive?.(true);
      // 持续读取流并写入 res
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(value);
          }
        } catch (e) {
          reader.cancel().catch(() => {});
          res.end();
        }
      };
      pump();
    } else {
      const buffer = await response.arrayBuffer();
      res.end(Buffer.from(buffer));
    }
  } catch (err) {
    console.error('请求处理错误:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ code: 500, msg: 'Internal Server Error' }));
  }
});

server.listen(PORT, () => {
  console.log(`✅ 服务器已启动，监听端口 ${PORT}`);
  
  // 通知第二台服务器同步
  const secondServer = getEnv('SECOND_SERVER_URL');  // 例如: http://152.136.30.238:3001
  if (secondServer && getEnv('SKIP_KEY_REFRESH') !== 'true') {
    try {
      const url = new URL(secondServer);
      console.log(`🔔 通知第二台服务器同步: ${secondServer}/sync`);
      
      http.request({
        hostname: url.hostname,
        port: url.port || 3001,
        path: '/sync?key=' + encodeURIComponent(getEnv('INTERNAL_API_KEY', 'internal-secret-key-2024')),
        method: 'POST',
        headers: {
          'X-Internal-Key': getEnv('INTERNAL_API_KEY', 'internal-secret-key-2024')
        },
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`✓ 第二台服务器同步结果:`, result.msg || '成功');
          } catch (e) {
            console.log(`✓ 第二台服务器已通知`);
          }
        });
      }).on('error', (e) => {
        console.log(`⚠️ 无法通知第二台服务器: ${e.message}`);
      }).end();
    } catch (e) {
      console.log(`⚠️ 第二台服务器URL配置错误: ${e.message}`);
    }
  }
  
  // 服务启动时自动刷新题库海密钥剩余次数（第二台服务器跳过）
  if (getEnv('SKIP_KEY_REFRESH') !== 'true') {
    const key1 = getEnv('TIKU_API_KEY_1');
    const key2 = getEnv('TIKU_API_KEY_2');
    if (key1 || key2) {
      console.log(`🔄 正在刷新题库海密钥剩余次数...`);
      refreshAllTikuKeys().then(results => {
        console.log(`✓ 题库海密钥刷新完成: 密钥1=${results.key1 ?? '未配置'}, 密钥2=${results.key2 ?? '未配置'}`);
      }).catch(e => {
        console.error(`✗ 题库海密钥刷新失败:`, e.message);
      });
      
      // 每天0点自动刷新
      function scheduleDailyRefresh() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow - now;
        
        console.log(`⏰ 下次刷新时间: ${tomorrow.toLocaleString('zh-CN')}`);
        
        setTimeout(() => {
          console.log(`\n🔄 [定时任务] 每日0点刷新题库海密钥...`);
          refreshAllTikuKeys().then(results => {
            console.log(`✓ [定时任务] 刷新完成: 密钥1=${results.key1 ?? '未配置'}, 密钥2=${results.key2 ?? '未配置'}`);
          }).catch(e => {
            console.error(`✗ [定时任务] 刷新失败:`, e.message);
          }).finally(() => {
            scheduleDailyRefresh();  // 重新调度下一次
          });
        }, msUntilMidnight);
      }
      
      scheduleDailyRefresh();
    }
  }
});
