const { db, getEnv } = require('./config');

// ==================== IP安全机制 ====================

// 违规封禁时长（秒）：第1次10分钟，第2次30分钟，第3次1小时，第4次24小时，第5次永久
const BAN_DURATIONS = [600, 1800, 3600, 86400, -1]; // -1表示永久

// IP白名单缓存
let ipWhitelistCache = null;
let ipWhitelistCacheTime = 0;
const WHITELIST_CACHE_TTL = 60000; // 1分钟缓存

// 获取IP白名单（从数据库，带缓存）
async function getIpWhitelist() {
  const now = Date.now();
  
  // 使用缓存
  if (ipWhitelistCache && now - ipWhitelistCacheTime < WHITELIST_CACHE_TTL) {
    return ipWhitelistCache;
  }
  
  try {
    const rows = await db.prepare('SELECT ip, note FROM ip_whitelist').all();
    ipWhitelistCache = rows.map(row => row.ip);
    ipWhitelistCacheTime = now;
    return ipWhitelistCache;
  } catch (e) {
    // 表不存在，返回空数组
    console.log('[IP白名单] 数据库查询失败:', e.message);
    return [];
  }
}

// 同步版本（用于启动时显示）
function getIpWhitelistSync() {
  return ipWhitelistCache || [];
}

// 检查IP是否在白名单中（异步版本）
async function isIpWhitelistedAsync(ip) {
  const whitelist = await getIpWhitelist();
  return checkIpInWhitelist(ip, whitelist);
}

// 检查IP是否在白名单中（同步版本，使用缓存）
function isIpWhitelisted(ip) {
  // 先检查环境变量（兼容旧配置）
  const envWhitelist = process.env.IP_WHITELIST || '';
  if (envWhitelist) {
    const envList = envWhitelist.split(',').map(i => i.trim()).filter(i => i);
    if (checkIpInWhitelist(ip, envList)) return true;
  }
  
  // 检查缓存
  if (ipWhitelistCache && checkIpInWhitelist(ip, ipWhitelistCache)) return true;
  
  return false;
}

// 检查IP是否在列表中
function checkIpInWhitelist(ip, whitelist) {
  if (!whitelist || whitelist.length === 0) return false;
  
  return whitelist.some(allowed => {
    if (allowed.includes('/')) {
      // CIDR格式
      const [prefix, bits] = allowed.split('/');
      const mask = parseInt(bits) || 32;
      const ipParts = ip.split('.').map(Number);
      const prefixParts = prefix.split('.').map(Number);
      if (ipParts.length !== 4 || prefixParts.length !== 4) return false;
      
      // 使用乘法替代位移，避免32位有符号整数溢出（A类地址>127会变负数）
      const ipNum = ipParts[0] * 256 ** 3 + ipParts[1] * 256 ** 2 + ipParts[2] * 256 + ipParts[3];
      const prefixNum = prefixParts[0] * 256 ** 3 + prefixParts[1] * 256 ** 2 + prefixParts[2] * 256 + prefixParts[3];
      const maskNum = (0xFFFFFFFF << (32 - mask)) >>> 0;
      
      return (ipNum & maskNum) === (prefixNum & maskNum);
    }
    return ip === allowed;
  });
}

// 清除白名单缓存
function clearWhitelistCache() {
  ipWhitelistCache = null;
  ipWhitelistCacheTime = 0;
}

// 查询IP归属地（使用IP9 API，不限次数，完整中文）
async function getIpLocation(ip) {
  // 跳过本地IP
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return '本地网络';
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`https://ip9.com.cn/get?ip=${ip}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const result = await response.json();
    if (result.ret === 200 && result.data) {
      const d = result.data;
      // 格式：中国 广东 深圳 海淀 (中国移动)
      const parts = [d.country, d.prov, d.city];
      if (d.area) parts.push(d.area);
      if (d.isp) parts.push(`(${d.isp})`);
      return parts.join(' ').replace(/\s+/g, ' ').trim();
    }
  } catch (e) {
    console.error('IP归属地查询失败:', e.message);
  }
  return '未知';
}

// 检查IP是否被封禁
async function isIpBanned(ip) {
  // 白名单IP跳过检测
  if (isIpWhitelisted(ip)) {
    return { banned: false, whitelisted: true };
  }
  
  const record = await db.prepare(`
    SELECT * FROM ip_blacklist WHERE ip = ?
  `).get(ip);
  
  if (!record) return { banned: false };
  
  // 永久封禁
  if (record.is_permanent === 1) {
    return { banned: true, reason: '永久封禁', violationCount: record.violation_count };
  }
  
  // 检查临时封禁是否过期
  const now = Math.floor(Date.now() / 1000);
  if (record.ban_until && record.ban_until > now) {
    const remaining = record.ban_until - now;
    return { banned: true, reason: `临时封禁中，剩余${Math.floor(remaining / 60)}分钟`, violationCount: record.violation_count };
  }
  
  return { banned: false };
}

// 记录IP违规并封禁
async function recordIpViolation(ip) {
  const now = Math.floor(Date.now() / 1000);
  const existing = await db.prepare(`SELECT * FROM ip_blacklist WHERE ip = ?`).get(ip);
  
  if (existing) {
    const newCount = existing.violation_count + 1;
    const banIndex = Math.min(newCount - 1, BAN_DURATIONS.length - 1);
    const banDuration = BAN_DURATIONS[banIndex];
    const isPermanent = banDuration === -1;
    
    await db.prepare(`
      UPDATE ip_blacklist 
      SET violation_count = ?, ban_until = ?, is_permanent = ?, updated_at = ?
      WHERE ip = ?
    `).run(newCount, isPermanent ? null : (now + banDuration), isPermanent ? 1 : 0, now, ip);
    
    return {
      violationCount: newCount,
      banDuration: isPermanent ? '永久' : `${Math.floor(banDuration / 60)}分钟`,
      isPermanent
    };
  } else {
    const banDuration = BAN_DURATIONS[0];
    await db.prepare(`
      INSERT INTO ip_blacklist (ip, violation_count, ban_until, is_permanent, created_at, updated_at)
      VALUES (?, 1, ?, 0, ?, ?)
    `).run(ip, now + banDuration, now, now);
    
    return {
      violationCount: 1,
      banDuration: `${Math.floor(banDuration / 60)}分钟`,
      isPermanent: false
    };
  }
}

// 记录IP访问日志（累计模式，使用原子 UPSERT 避免并发竞态导致重复键错误）
async function logIpAccess(ip, endpoint, userAgent, isSuspicious = false) {
  const now = Math.floor(Date.now() / 1000);
  const suspiciousFlag = isSuspicious ? 1 : 0;
  // better-sqlite3 不允许 undefined 参数，需转为 null
  const safeUserAgent = userAgent ?? null;

  try {
    // 先尝试 INSERT（带 ON DUPLICATE KEY UPDATE），新 IP 默认 location='查询中'
    const result = await db.prepare(`
      INSERT INTO ip_access_logs (ip, endpoint, user_agent, ip_location, is_suspicious, access_count, created_at, updated_at)
      VALUES (?, ?, ?, '查询中', ?, 1, ?, ?)
      ON DUPLICATE KEY UPDATE
        access_count = access_count + 1,
        endpoint = VALUES(endpoint),
        user_agent = VALUES(user_agent),
        is_suspicious = GREATEST(is_suspicious, VALUES(is_suspicious)),
        updated_at = VALUES(updated_at)
    `).run(ip, endpoint, safeUserAgent, suspiciousFlag, now, now);

    // 新插入的记录（affectedRows > 0 且是 INSERT）→ 后台异步查归属地
    // 注意：ON DUPLICATE KEY UPDATE 时 affectedRows=2（更新）或 1（无变化）
    if (result.changes === 1) {
      // 新插入的行
      getIpLocation(ip).then(location => {
        db.prepare('UPDATE ip_access_logs SET ip_location = ? WHERE ip = ?')
          .run(location, ip)
          .catch(e => console.error('[IP归属地] 后台更新失败:', e.message));
      }).catch(e => console.error('[IP归属地] 查询失败:', e.message));
    }
  } catch (e) {
    console.error('[logIpAccess] 记录失败:', e.message);
  }
}

// IP请求频率检测（内存缓存）- 按 (ip, endpoint) 维度分别维护滑动窗口
const ipRequestCache = new Map(); // `${ip}:${endpoint}` -> timestamp[]
const RATE_WINDOW = 1000; // 1秒窗口

function checkRateLimit(ip, limit = 10, endpoint = 'default') {
  // 白名单IP跳过频率限制
  if (isIpWhitelisted(ip)) {
    return { allowed: true, count: 0, whitelisted: true };
  }
  
  const now = Date.now();
  const windowStart = now - RATE_WINDOW;
  const cacheKey = `${ip}:${endpoint}`;
  
  // 按 (ip, endpoint) 维度维护独立滑动窗口
  let requests = ipRequestCache.get(cacheKey);
  if (!requests) {
    requests = [];
    ipRequestCache.set(cacheKey, requests);
  }
  
  // 清理过期记录
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }
  
  // 检查是否超限
  if (requests.length >= limit) {
    return { allowed: false, count: requests.length };
  }
  
  // 记录本次请求
  requests.push(now);
  return { allowed: true, count: requests.length };
}

// 定期清理缓存（每分钟）
const IP_CACHE_MAX_SIZE = 10000;
const _rateLimitCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of ipRequestCache.entries()) {
    // 清理1分钟前的过期时间戳
    const cutoff = now - 60000;
    while (requests.length > 0 && requests[0] < cutoff) {
      requests.shift();
    }
    // 数组为空则删除整个条目
    if (requests.length === 0) {
      ipRequestCache.delete(ip);
    }
  }
  // 容量限制：超出时淘汰最旧条目
  if (ipRequestCache.size > IP_CACHE_MAX_SIZE) {
    const excess = ipRequestCache.size - IP_CACHE_MAX_SIZE;
    let deleted = 0;
    for (const key of ipRequestCache.keys()) {
      if (deleted >= excess) break;
      ipRequestCache.delete(key);
      deleted++;
    }
    console.log(`[IP限流] 缓存超限，清理${deleted}个条目`);
  }
}, 60000);


// ==================== 受限模式每日限额 ====================

const LIMITED_DAILY_QUOTA = parseInt(process.env.LIMITED_DAILY_QUOTA) || 100; // 受限模式每天限额（可通过环境变量配置）
const LIMITED_RESET_HOUR = 6; // 刷新时间：早上6点

// 获取今天的"受限模式日期"（UTC+8 时区，6点前算前一天）
function getLimitedDate() {
  const now = new Date(Date.now() + 8 * 3600000); // 转换为 UTC+8
  const hour = now.getUTCHours();
  // 6点前算前一天的日期
  if (hour < LIMITED_RESET_HOUR) {
    now.setUTCDate(now.getUTCDate() - 1);
  }
  return now.toISOString().split('T')[0]; // "2026-03-26"
}

// 检查受限模式每日限额
// userId 有值时按 userId 限，否则按 IP 限
async function checkLimitedDailyQuota(userId, ip) {
  const today = getLimitedDate();
  const key = userId || ip;

  const row = await db.prepare(
    "SELECT count FROM daily_limits WHERE limit_key = ? AND limit_date = ?"
  ).get(key, today);

  return {
    allowed: !row || row.count < LIMITED_DAILY_QUOTA,
    used: row ? row.count : 0,
    remaining: row ? Math.max(0, LIMITED_DAILY_QUOTA - row.count) : LIMITED_DAILY_QUOTA,
    total: LIMITED_DAILY_QUOTA,
    key,
    date: today
  };
}

// 增加受限模式查询计数
async function incrementLimitedCount(userId, ip) {
  const today = getLimitedDate();
  const key = userId || ip;
  const now = Math.floor(Date.now() / 1000);

  try {
    await db.prepare(`
      INSERT INTO daily_limits (limit_key, limit_date, count, updated_at)
      VALUES (?, ?, 1, ?)
      ON DUPLICATE KEY UPDATE count = count + 1, updated_at = ?
    `).run(key, today, now, now);
  } catch (e) {
    console.error('[受限模式] 更新每日计数失败:', e.message);
  }
}

// 每天清理超过2天的每日限额记录（保留昨天和今天，防止6点跨日期问题）
const _dailyLimitsCleanupTimer = setInterval(async () => {
  try {
    const result = await db.prepare("DELETE FROM daily_limits WHERE limit_date < DATE_SUB(CURDATE(), INTERVAL 2 DAY)").run();
    if (result.changes > 0) console.log(`[每日限额] 清理了 ${result.changes} 条过期记录`);
  } catch (e) {
    console.error('[每日限额] 清理过期记录失败:', e.message);
  }
}, 24 * 60 * 60 * 1000); // 每24小时清理一次

// 导出IP安全函数
module.exports = {
  getIpLocation,
  isIpBanned,
  recordIpViolation,
  logIpAccess,
  checkRateLimit,
  ipRequestCache,
  isIpWhitelisted,
  isIpWhitelistedAsync,
  getIpWhitelist,
  getIpWhitelistSync,
  clearWhitelistCache,
  checkLimitedDailyQuota,
  incrementLimitedCount,
  getLimitedDate,
  // 优雅关闭：导出定时器引用
  _timers: [_rateLimitCleanupTimer, _dailyLimitsCleanupTimer]
};
