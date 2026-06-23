const crypto = require('crypto');
const { db } = require('../config');

const adminSessions = new Map();
const ADMIN_SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

const adminLoginAttempts = new Map();
const ADMIN_LOGIN_LIMIT = 5;
const ADMIN_LOGIN_WINDOW = 15 * 60 * 1000;

async function logAdminAccess(ip, sessionId, action, userAgent) {
  try {
    const { getIpLocation } = require('../ip-security');
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

function safeComparePassword(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  const maxLen = Math.max(bufA.length, bufB.length);
  // 填充到相同长度，避免长度不等时提前返回导致时序差异
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  const timingSafe = crypto.timingSafeEqual(paddedA, paddedB);
  // 长度不等则必定不匹配
  return timingSafe && bufA.length === bufB.length;
}

function createAdminSession(ip) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  adminSessions.set(sessionId, { createdAt: Date.now(), ip });
  return sessionId;
}

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

function getSessionFromCookie(c) {
  const cookieHeader = c.req.header('cookie') || '';
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  return match ? match[1] : null;
}

function verifyAdminSession(c) {
  const sessionId = getSessionFromCookie(c);
  if (!sessionId || !validateAdminSession(sessionId)) {
    return { valid: false, error: '会话已过期，请重新登录', status: 401 };
  }
  return { valid: true };
}

module.exports = {
  verifyAdminSession,
  validateAdminSession,
  getSessionFromCookie,
  createAdminSession,
  checkAdminLoginLimit,
  recordAdminLoginFailure,
  clearAdminLoginAttempts,
  safeComparePassword,
  logAdminAccess,
  _adminSessionCleanupTimer
};
