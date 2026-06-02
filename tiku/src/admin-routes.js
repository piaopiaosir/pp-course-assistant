const { db, getEnv, getGlobalStats } = require('./config');
const { verifyAdminSession, getSessionFromCookie, validateAdminSession, createAdminSession, checkAdminLoginLimit, recordAdminLoginFailure, clearAdminLoginAttempts, safeComparePassword, logAdminAccess } = require('./admin-session');
const { generateLoginHTML, generateAdminHTML } = require('./admin');
const { isIpBanned, recordIpViolation, logIpAccess, checkRateLimit, isIpWhitelisted, getIpWhitelist, clearWhitelistCache, getIpLocation } = require('./ip-security');
const { recheckSingleQuestion, findDuplicates, removeDuplicateRecords } = require('./recheck');
const { refreshAllTikuKeys } = require('./tiku');

let recheckTask = null;
let recheckSSEClients = [];
let recheckLogBuffer = [];
let recheckProgressBuffer = null;

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
  recheckProgressBuffer = data;
  pushSSEMessage(data);
}

function pushRecheckLog(level, message) {
  const timestamp = new Date().toLocaleTimeString();
  const data = JSON.stringify({
    type: 'log',
    level,
    message,
    timestamp
  });
  recheckLogBuffer.push(data);
  if (recheckLogBuffer.length > 200) recheckLogBuffer.shift();
  pushSSEMessage(data);
}

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
  recheckSSEClients = recheckSSEClients.filter(c => !c.aborted);
}

let dedupTask = null;
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

async function getAdminStats() {
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

  return { globalStats, userStats, tokenStats, cacheStats, recentCache, topUsers, hourlyRates, userTrends, queryTrends };
}

function registerAdminRoutes(app) {
  app.get('/admin', async (c) => {
    const sessionId = getSessionFromCookie(c);
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || '';

    if (sessionId && validateAdminSession(sessionId)) {
      logAdminAccess(ip, sessionId, 'view', userAgent).catch(() => {});

      try {
        const stats = await getAdminStats();
        return c.html(generateAdminHTML(stats.userStats, stats.tokenStats, stats.cacheStats, stats.recentCache, stats.topUsers, stats.globalStats, stats.hourlyRates, stats.userTrends, stats.queryTrends));
      } catch (e) {
        return c.text(`管理页面加载失败: ${e.message}`, 500);
      }
    }

    return c.html(generateLoginHTML());
  });

  app.post('/admin', async (c) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const body = await c.req.parseBody();
    const password = body.password || body.pwd;
    const correctPassword = getEnv('ADMIN_PASSWORD', 'admin123');

    const limitCheck = checkAdminLoginLimit(ip);
    if (!limitCheck.allowed) {
      console.log(`[管理登录] ${ip} 尝试次数过多，需等待 ${limitCheck.waitTime} 分钟`);
      return c.html(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f5f5f5;"><div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.1);"><h2 style="color:#e74c3c;">⚠️ 登录尝试过多</h2><p>请 ${limitCheck.waitTime} 分钟后再试</p></div></body></html>`);
    }

    if (!safeComparePassword(password || '', correctPassword)) {
      const result = recordAdminLoginFailure(ip);
      console.log(`[管理登录] ${ip} 密码错误，剩余 ${result.remaining} 次`);
      return c.html(generateLoginHTML());
    }

    clearAdminLoginAttempts(ip);

    const sessionId = createAdminSession(ip);

    const userAgent = c.req.header('user-agent') || '';
    logAdminAccess(ip, sessionId, 'login', userAgent);
    console.log(`[管理登录] ${ip} 登录成功，session=${sessionId.substring(0,8)}...`);

    try {
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

      const validateColumn = (col, allowedColumns) => {
        return allowedColumns.includes(col) ? col : null;
      };

      if (table === 'tokens') {
        columns = ['token', 'user_id', 'remaining_count', 'is_blacklisted', 'is_free_token', 'last_ip', 'created_at', 'last_used'];
        let whereClause = '';
        let params = [];

        if (search) {
          const safeColumn = validateColumn(searchColumn, columns);
          if (safeColumn) {
            whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
            params = [`%${search}%`];
          } else {
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
      } else if (table === 'pp_api_logs') {
        columns = ['id', 'ip', 'request_count', 'token', 'last_used_at', 'created_at'];
        let whereClause = '';
        let params = [];

        if (search) {
          const safeColumn = validateColumn(searchColumn, columns);
          if (safeColumn) {
            whereClause = `WHERE \`${safeColumn}\` LIKE ?`;
            params = [`%${search}%`];
          } else {
            whereClause = 'WHERE ip LIKE ? OR token LIKE ?';
            params = [`%${search}%`, `%${search}%`];
          }
        }

        total = (await db.prepare(`SELECT COUNT(*) as count FROM pp_api_logs ${whereClause}`).get(...params)).count;
        rows = await db.prepare(`SELECT * FROM pp_api_logs ${whereClause} ORDER BY last_used_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
      }

      return c.json({ columns, rows, total });
    } catch (e) {
      return c.json({ error: e.message }, 500);
    }
  });

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
      } else if (table === 'pp_api_logs') {
        await db.prepare('DELETE FROM pp_api_logs WHERE id = ?').run(id);
      } else {
        return c.json({ error: '不支持的表' }, 400);
      }

      return c.json({ success: true });
    } catch (e) {
      return c.json({ error: e.message }, 500);
    }
  });

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
        const count = await db.prepare('DELETE FROM answer_cache WHERE source = ?').run(source).changes;
        result = { cleared: count, source: source };
        console.log(`清除缓存: 来源=${source}, 删除=${count}条`);
      } else {
        const count = await db.prepare('DELETE FROM answer_cache').run().changes;
        result = { cleared: count, source: 'all' };
        console.log(`清除所有缓存: 删除=${count}条`);
      }

      return c.json({ success: true, ...result });
    } catch (e) {
      return c.json({ error: e.message }, 500);
    }
  });

  app.post('/admin/update', async (c) => {
    try {
      const verify = verifyAdminSession(c);
      if (!verify.valid) {
        return c.json({ error: verify.error }, verify.status);
      }
      const body = await c.req.json();
      const { table, id, data } = body;

      const allowedFields = {
        'tokens': ['remaining_count', 'is_blacklisted', 'is_free_token', 'last_ip'],
        'user_ids': ['user_type', 'created_ip', 'welfare_claimed'],
        'referrals': ['referrer_reward', 'referee_reward'],
        'ip_whitelist': ['ip', 'note'],
        'answer_cache': ['question', 'options', 'type', 'answer', 'source', 'is_correct']
      };

      if (!allowedFields[table]) {
        return c.json({ error: '不支持的表' }, 400);
      }

      const updates = [];
      const values = [];

      Object.keys(data).forEach(key => {
        const val = data[key];
        if (val !== '' && allowedFields[table].includes(key)) {
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

  app.post('/admin/insert', async (c) => {
    try {
      const verify = verifyAdminSession(c);
      if (!verify.valid) {
        return c.json({ error: verify.error }, verify.status);
      }
      const body = await c.req.json();
      const { table, data } = body;

      const allowedInserts = {
        'tokens': ['token', 'user_id', 'remaining_count', 'is_blacklisted', 'is_free_token', 'last_ip'],
        'user_ids': ['user_id', 'user_type', 'created_ip', 'welfare_claimed'],
        'ip_whitelist': ['ip', 'note'],
        'ip_blacklist': ['ip', 'violation_count', 'ban_until', 'is_permanent'],
        'referrals': ['referrer_id', 'referee_id', 'referrer_reward', 'referee_reward']
      };

      if (!allowedInserts[table]) {
        return c.json({ error: '该表不支持手动添加数据' }, 400);
      }

      const columns = [];
      const placeholders = [];
      const values = [];
      const now = Math.floor(Date.now() / 1000);

      Object.keys(data).forEach(key => {
        const val = data[key];
        if (allowedInserts[table].includes(key) && val !== '') {
          columns.push(`\`${key}\``);
          placeholders.push('?');
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

      if (table === 'ip_whitelist') {
        clearWhitelistCache();
      }

      return c.json({ success: true });
    } catch (e) {
      return c.json({ error: e.message }, 500);
    }
  });

  app.get('/admin/recheck/stream', async (c) => {
    const verify = verifyAdminSession(c);
    if (!verify.valid) {
      return c.json({ error: verify.error }, verify.status);
    }

    const encoder = new TextEncoder();
    let aborted = false;
    let heartbeatTimer = null;

    c.req.raw.signal.addEventListener('abort', () => {
      aborted = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    });

    const stream = new ReadableStream({
      start(controller) {
        if (recheckProgressBuffer) {
          controller.enqueue(encoder.encode(`data: ${recheckProgressBuffer}\n\n`));
        } else {
          const initialData = { type: 'progress', running: false, total: 0, processed: 0 };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));
        }

        for (const logData of recheckLogBuffer) {
          controller.enqueue(encoder.encode(`data: ${logData}\n\n`));
        }

        console.log(`[SSE] 新客户端连接，发送初始进度和 ${recheckLogBuffer.length} 条日志`);

        recheckSSEClients.push({ controller, encoder, aborted });

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

    if (recheckTask && recheckTask.running) {
      return c.json({ error: '重查任务正在进行中', total: recheckTask.total, processed: recheckTask.processed }, 409);
    }

    try {
      const wrongAnswers = await db.prepare(
        `SELECT question_hash, source FROM answer_cache WHERE is_correct = 0`
      ).all();

      if (wrongAnswers.length === 0) {
        return c.json({ error: '没有需要重查的错误题目', total: 0 }, 200);
      }

      const TIKU_SOURCES = ['tiku', 'hivenet', 'ucuc', 'yanxi'];
      wrongAnswers.sort((a, b) => {
        const aIsTiku = TIKU_SOURCES.includes(a.source) ? 0 : 1;
        const bIsTiku = TIKU_SOURCES.includes(b.source) ? 0 : 1;
        return aIsTiku - bIsTiku;
      });

      const tikuCount = wrongAnswers.filter(q => TIKU_SOURCES.includes(q.source)).length;
      const aiCount = wrongAnswers.length - tikuCount;
      console.log(`[recheck] 排序完成: 题库来源 ${tikuCount} 题优先, AI来源 ${aiCount} 题在后`);

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
      recheckLogBuffer = [];

      console.log(`[recheck] 异步任务即将启动，共 ${wrongAnswers.length} 题`);
      (async () => {
        console.log(`[recheck] === 异步任务已开始执行 ===`);
        pushRecheckLog('info', `开始重查，共 ${wrongAnswers.length} 道错误题目`);
        pushRecheckProgress();

        for (let i = 0; i < wrongAnswers.length; i++) {
          const qHash = wrongAnswers[i].question_hash;
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
          if (i < wrongAnswers.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
        recheckTask.running = false;
        pushRecheckLog('info', `完成! 题库:${recheckTask.tikuSuccess} AI:${recheckTask.aiSuccess} 更新:${recheckTask.updated} 失败:${recheckTask.failed}`);
        pushRecheckProgress();

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
      logs: recheckLogBuffer,
      logCount: recheckLogBuffer.length
    };

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

  app.get('/admin/dedup/stream', async (c) => {
    const verify = verifyAdminSession(c);
    if (!verify.valid) {
      return c.json({ error: verify.error }, verify.status);
    }

    const encoder = new TextEncoder();
    let aborted = false;
    let heartbeatTimer = null;

    c.req.raw.signal.addEventListener('abort', () => {
      aborted = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    });

    const stream = new ReadableStream({
      start(controller) {
        if (dedupProgressBuffer) {
          controller.enqueue(encoder.encode(`data: ${dedupProgressBuffer}\n\n`));
        } else {
          const initialData = JSON.stringify({ type: 'progress', running: false, totalGroups: 0, totalToRemove: 0, processed: 0, removed: 0 });
          controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));
        }

        for (const logData of dedupLogBuffer) {
          controller.enqueue(encoder.encode(`data: ${logData}\n\n`));
        }

        dedupSSEClients.push({ controller, encoder, aborted });

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

    return c.body(stream, 200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
  });

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
}

module.exports = { registerAdminRoutes, getAdminStats };
