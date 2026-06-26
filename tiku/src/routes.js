const { Hono } = require('hono');
const http = require('http');
const { db, getEnv, PORT, FREE_TOKEN_INITIAL_COUNT, LATEST_VERSION, SPONSOR_URL, withTransaction } = require('./config');
const { verifyUserToken, initOrGetToken, checkTokenStatus, decrementCount, lockToken, settleToken, releaseToken, recordUserId, getUserIdCreatedAt, getUserType, getUserValidTokens, checkUserIdExists, createTokenForNewUser, updateUserType, checkReferralStatus, getReferralStats, processReferral, verifyUserFid } = require('./auth');
const { refreshAllTikuKeys, generateQuestionHash, getCachedAnswer } = require('./tiku');
const { getClientIp } = require('./utils');
const { getLimitedDate, isIpBanned, recordIpViolation, logIpAccess, checkRateLimit, isIpWhitelisted, getIpWhitelist, checkLimitedDailyQuota, incrementLimitedCount } = require('./ip-security');
const { handleQuery } = require('./mode-handler');
const { getModelCosts, getFullModelConfig } = require('./modes/ai-mode');
const { _adminSessionCleanupTimer } = require('./admin/session');
const { queryTasks, recordQueryRate, POLL_INTERVAL, _queryTaskCleanupTimer, recordRecentlyQueried, isRecentlyQueried, _recentlyQueriedCleanupTimer, _verifyThinkingGrantCleanupTimer, saveTaskToDb, getTaskFromDb } = require('./query-tasks');
const { registerAdminRoutes } = require('./admin/routes');
const { handleRemoteScripts } = require('./remote-scripts');

// 显式初始化数据库（建表+迁移）
const { initDatabase } = require('./config/db-init');
const { loadInvalidKeys } = require('./tavily-search');
// 数据库初始化完成后再加载Tavily失效密钥（确保表已创建）
initDatabase().then(() => loadInvalidKeys()).catch(e => console.error('[启动] 初始化失败:', e.message));

// workType 白名单：只允许这些平台使用题库服务
const ALLOWED_WORK_TYPES = ['zhs', 'ouchn', 'cx', 'stuActive'];

const app = new Hono();

// 请求体大小限制（1MB）
app.use('*', async (c, next) => {
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) {
    return c.json({ code: 413, msg: '请求体过大（最大1MB）' }, 413);
  }
  await next();
});

app.use('*', async (c, next) => {
  try {
    const path = c.req.path;
    
    if (path === '/admin' || path.startsWith('/admin/')) {
      return await next();
    }
    
    if (path === '/notice') {
      return await next();
    }
    
    if (path.startsWith('/internal/')) {
      return await next();
    }
    
    const ip = getClientIp(c);
    
    // /internal/ 路径已在上方提前 return，此处无需再判断
    console.log(`[IP] 最终=${ip}`);
    
    if (isIpWhitelisted(ip)) {
      console.log(`[白名单] ${ip} 跳过安全检查`);
      return await next();
    }
    
    const banCheck = await isIpBanned(ip);
    if (banCheck.banned) {
      console.log(`[IP封禁] ${ip} 尝试访问，原因: ${banCheck.reason}`);
      return c.json({
        code: 403,
        msg: `您的IP已被封禁: ${banCheck.reason}`,
        data: null
      }, 403);
    }
    
    let rateLimit = 20;
    let endpoint = 'other';
    if (c.req.method === 'POST' && path === '/') {
      rateLimit = 100;
      endpoint = 'query';
    } else if (path.startsWith('/query-task/')) {
      rateLimit = 30;
      endpoint = 'poll';
    }
    
    const rateCheck = checkRateLimit(ip, rateLimit, endpoint);
    if (!rateCheck.allowed) {
      console.log(`[频率限制] ${ip} 请求过于频繁: ${rateCheck.count}次/秒 (限制: ${rateLimit}次/秒)`);
      
      const violation = await recordIpViolation(ip);
      
      logIpAccess(ip, path, c.req.header('user-agent'), true).catch(e => console.error('[logIpAccess] 记录失败:', e.message));
      
      return c.json({
        code: 429,
        msg: `请求过于频繁，IP已被封禁${violation.banDuration}`,
        data: { violationCount: violation.violationCount }
      }, 429);
    }
    
    logIpAccess(ip, path, c.req.header('user-agent')).catch(e => console.error('[logIpAccess] 记录失败:', e.message));
    
    await next();
  } catch (error) {
    // 数据库连接超时等网络错误，降级放行（不阻塞用户）
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.warn(`[中间件] 数据库不可达(${error.code})，降级放行: ${c.req.path}`);
    } else {
      console.error('[中间件错误]', error);
    }
    await next();
  }
});

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

const fs = require('fs');
const path = require('path');

app.get('/sponsor-url', async (c) => {
  return c.json({
    code: 200,
    msg: 'success',
    data: { sponsorUrl: SPONSOR_URL }
  });
});

app.get('/poll-interval', async (c) => {
  return c.json({
    code: 200,
    msg: 'success',
    data: { pollInterval: POLL_INTERVAL }
  });
});

app.get('/query-task/:taskId', async (c) => {
  const taskId = c.req.param('taskId');
  let task = queryTasks.get(taskId);
  
  // 内存未命中时回退到数据库查询（服务重启后内存丢失）
  if (!task) {
    const dbTask = getTaskFromDb(taskId);
    if (dbTask) {
      return c.json({
        code: 200,
        msg: 'success',
        data: {
          status: dbTask.status,
          result: dbTask.result || null
        }
      });
    }
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
      status: task.status,
      result: task.result || null
    }
  });
});

app.get('/internal/code', async (c) => {
  const apiKey = c.req.header('X-Internal-Key') || c.req.query('key');
  const correctKey = getEnv('INTERNAL_API_KEY');
  if (!correctKey) {
    return c.json({ error: '内部API未配置' }, 403);
  }
  
  if (apiKey !== correctKey) {
    return c.json({ code: 401, msg: '无效的内部API密钥', data: null }, 401);
  }
  
  try {
    const files = {};
    const srcDir = __dirname;
    
    const codeFiles = ['config.js', 'auth.js', 'tiku.js', 'routes.js', 'mode-handler.js', 'ip-security.js', 'utils.js', 'tavily-search.js', 'recheck.js', 'query-tasks.js', 'remote-scripts.js'];
    
    for (const file of codeFiles) {
      let filePath;
      filePath = path.join(srcDir, file);
      
      if (fs.existsSync(filePath)) {
        files[file] = fs.readFileSync(filePath, 'utf-8');
      }
    }
    
    // 扫描 src 下的子目录（modes, config, tiku, admin 等）
    const subDirs = ['modes', 'config', 'tiku', 'admin'];
    for (const subDir of subDirs) {
      const dirPath = path.join(srcDir, subDir);
      if (fs.existsSync(dirPath)) {
        const subFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
        for (const file of subFiles) {
          files[`${subDir}/${file}`] = fs.readFileSync(path.join(dirPath, file), 'utf-8');
        }
      }
    }
    
    const indexPath = path.join(srcDir, '..', 'index.js');
    if (fs.existsSync(indexPath)) {
      files['index.js'] = fs.readFileSync(indexPath, 'utf-8');
    }
    
    const packagePath = path.join(srcDir, '..', 'package.json');
    if (fs.existsSync(packagePath)) {
      files['package.json'] = fs.readFileSync(packagePath, 'utf-8');
    }
    
    let envFile = '';
    const envPath = path.join(srcDir, '..', '.env');
    if (fs.existsSync(envPath)) {
      envFile = fs.readFileSync(envPath, 'utf-8');
      console.log(`[内部同步] 读取 .env: ${envPath}`);
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

registerAdminRoutes(app);

app.get('/version', async (c) => {
  try {
    return c.json({
      code: 200,
      data: {
        latestVersion: LATEST_VERSION,
        updateUrl: 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C.user.js',
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

// 远程脚本：根据IP下发需要执行的脚本列表
app.get('/remote-scripts', handleRemoteScripts);

const GLOBAL_DAILY_QUOTA = 5000;
const GLOBAL_LIMIT_KEY = '__global_api_tiku__';

app.post('/api/tiku', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== 'free') {
      return c.json({
        code: 401,
        msg: '缺少或无效的 Authorization 头，值应为 free',
        data: null
      }, 401);
    }

    const body = await c.req.json();
    const { question, options, type } = body;

    if (!question) {
      return c.json({
        code: 400,
        msg: '参数错误，请检查是否有参数缺失',
        data: null
      }, 400);
    }

    const questionType = type || '0';

    const clientIp = getClientIp(c);

    const today = getLimitedDate();
    const globalRow = await db.prepare(
      "SELECT count FROM daily_limits WHERE limit_key = ? AND limit_date = ?"
    ).get(GLOBAL_LIMIT_KEY, today);

    const globalUsed = globalRow ? globalRow.count : 0;
    if (globalUsed >= GLOBAL_DAILY_QUOTA) {
      return c.json({
        code: 429,
        msg: `今日接口调用次数已达上限（${GLOBAL_DAILY_QUOTA}次），请明日再试`,
        data: { used: globalUsed, total: GLOBAL_DAILY_QUOTA }
      }, 429);
    }

    const questionHash = generateQuestionHash(question, options, questionType);

    const cached = await getCachedAnswer(questionHash);

    if (!cached) {
      return c.json({
        code: 404,
      msg: '未找到答案',
        data: null
      }, 404);
    }

    const now = Math.floor(Date.now() / 1000);
    await db.prepare(`
      INSERT INTO daily_limits (limit_key, limit_date, count, updated_at)
      VALUES (?, ?, 1, ?)
      ON DUPLICATE KEY UPDATE count = count + 1, updated_at = ?
    `).run(GLOBAL_LIMIT_KEY, today, now, now);

    // 记录PP题库请求日志
    try {
      await db.prepare(`
        INSERT INTO pp_api_logs (ip, request_count, token, last_used_at, created_at)
        VALUES (?, 1, ?, ?, ?)
        ON DUPLICATE KEY UPDATE request_count = request_count + 1, last_used_at = ?
      `).run(clientIp, authHeader, now, now, now);
    } catch (e) {
      console.error('[/api/tiku] PP请求日志记录失败:', e.message);
    }

    let answerData;
    try {
      answerData = JSON.parse(cached.answer);
    } catch {
      answerData = [cached.answer];
    }

    return c.json({
      code: 200,
      msg: '查询成功',
      data: {
        answer: answerData,
        source: cached.source || 'cache',
        num: GLOBAL_DAILY_QUOTA - globalUsed
      }
    });
  } catch (e) {
    console.error('[/api/tiku] 处理失败:', e.message);
    return c.json({
      code: 500,
      msg: '服务器错误: ' + e.message,
      data: null
    }, 500);
  }
});

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
      title: '[NOTICE] 系统公告'
    }
  });
});

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

app.post('/report-answer-results', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : 'anonymous';
    
    let userId = null;
    if (token !== 'anonymous') {
      const tokenStatus = await checkTokenStatus(token);
      if (tokenStatus.success) {
        userId = tokenStatus.user_id;
      }
    }
    
    const body = await c.req.json();
    const { results } = body;
    
    if (!results || !Array.isArray(results)) {
      return c.json({
        code: 400,
        msg: "缺少results参数或格式错误"
      }, 400);
    }
    
    console.log(`[最近查询验证] 上报题目数: ${results.length}`);
    
    const clientIp = getClientIp(c);
    
    const { generateQuestionHash, recordCorrectnessReport } = require('./tiku');
    
    let successCount = 0;
    let failCount = 0;
    let rejectedCount = 0;
    
    const validTypes = ['0', '1', '3'];
    
    const reportPromises = results.map(async (result) => {
      const { question, options, type, isCorrect } = result;
      
      if (!validTypes.includes(type)) {
        return 'fail';
      }
      
      if (!question || isCorrect === undefined || isCorrect === null) {
        return 'fail';
      }
      
      if (isCorrect !== 0 && isCorrect !== 1) {
        return 'rejected';
      }
      
      const questionHash = generateQuestionHash(question, options, type);
      
      const wasRecentlyQueried = isRecentlyQueried(questionHash);
      
      if (!wasRecentlyQueried) {
        console.log(`[WARN] 题目不在最近查询记录中 ${questionHash.substring(0, 8)}，记录但不立即应用`);
      }
      
      const reportResult = await recordCorrectnessReport(
        questionHash, 
        token, 
        userId, 
        clientIp, 
        isCorrect, 
        type,
        wasRecentlyQueried
      );
      
      if (reportResult.applied || reportResult.pending) {
        return 'success';
      }
      return 'fail';
    });
    
    const reportResults = await Promise.all(reportPromises);
    for (const r of reportResults) {
      if (r === 'success') successCount++;
      else if (r === 'fail') failCount++;
      else if (r === 'rejected') rejectedCount++;
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

app.post('/welfare', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, mode } = body;

    if (!userId) {
      return c.json({ code: 400, msg: '请输入用户ID' }, 400);
    }

    let targetToken = null;
    let targetUserId = null;

    const isTokenInput = /^\d{16}$/.test(userId);

    if (isTokenInput) {
      const tokenRow = await db.prepare(
        'SELECT token, remaining_count, is_blacklisted, user_id FROM tokens WHERE token = ?'
      ).get(userId);

      if (!tokenRow) {
        return c.json({ code: 404, msg: '该Token不存在，请确认后重试' }, 404);
      }

      targetToken = tokenRow;
      targetUserId = tokenRow.user_id;
    } else {
      const user = await db.prepare('SELECT welfare_claimed FROM user_ids WHERE user_id = ?').get(userId);
      if (!user) {
        return c.json({ code: 404, msg: '用户ID不存在，请先使用脚本后再来领取' }, 404);
      }

      targetUserId = userId;

      const token = await db.prepare(
        'SELECT token, remaining_count, is_blacklisted, user_id FROM tokens WHERE user_id = ? ORDER BY last_used DESC LIMIT 1'
      ).get(userId);

      if (!token) {
        return c.json({ code: 404, msg: '未找到有效的Token，请先使用脚本后再来领取' }, 404);
      }

      targetToken = token;
    }

    if (targetUserId) {
      // 事务化福利领取：原子检查 welfare_claimed + 解封 + 加次数 + 更新 user_ids
      // 保证多步操作的原子性，避免中途失败导致状态不一致（Q-04去重：使用 withTransaction）
      try {
        const txnResult = await withTransaction(async (conn) => {
          // 原子操作：同时检查并设置 welfare_claimed，防止并发重复领取
          const [claimResult] = await conn.execute(
            'UPDATE user_ids SET welfare_claimed = 1 WHERE user_id = ? AND (welfare_claimed = 0 OR welfare_claimed IS NULL)',
            [targetUserId]
          );
          if (claimResult.affectedRows === 0) {
            return { error: { code: 400, msg: '您已领取过免费次数，每人仅限一次' } };
          }

          // 仅在剩余次数不足时解封（H-13修复：不无条件解封）
          if (targetToken.is_blacklisted === 1 && targetToken.remaining_count < 0.1) {
            await conn.execute('UPDATE tokens SET is_blacklisted = 0 WHERE token = ?', [targetToken.token]);
            console.log(`[福利领取] Token ${targetToken.token.substring(0, 8)}*** 已自动解封`);
          }

          let addedCount = 200;
          if (mode === 'random') {
            const rand = Math.random();
            if (rand < 0.6) {
              addedCount = 1 + Math.floor(Math.random() * 200);
            } else if (rand < 0.9) {
              addedCount = 200 + Math.floor(Math.random() * 101);
            } else {
              addedCount = 300 + Math.floor(Math.random() * 101);
            }
          }

          await conn.execute('UPDATE tokens SET remaining_count = remaining_count + ? WHERE token = ?', [addedCount, targetToken.token]);

          return { addedCount };
        });

        if (txnResult.error) {
          return c.json(txnResult.error, txnResult.error.code);
        }

        const { addedCount } = txnResult;
        console.log(`[福利领取] ${targetUserId ? `用户 ${targetUserId}` : 'Token无绑定用户'} 领取${addedCount}次（${mode === 'random' ? '随机' : '固定'}），Token: ${targetToken.token.substring(0, 8)}***，原余额: ${targetToken.remaining_count}，已解封: ${targetToken.is_blacklisted === 1}`);

        return c.json({
          code: 200,
          msg: `领取成功！已为您的账号添加${addedCount}次查询次数`,
          data: { addedCount, newTotal: targetToken.remaining_count + addedCount, token: targetToken.token, mode: mode === 'random' ? 'random' : 'fixed' }
        });
      } catch (txnErr) {
        console.error('[福利领取] 事务失败:', txnErr.message);
        return c.json({ code: 500, msg: '领取失败，请稍后重试' }, 500);
      }
    } else {
      return c.json({ code: 400, msg: '该Token未绑定用户ID，无法领取次数' }, 400);
    }
  } catch (e) {
    console.error('[福利领取] 处理失败:', e.message);
    return c.json({ code: 500, msg: '领取失败，请稍后重试' }, 500);
  }
});

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
    
    const clientIp = getClientIp(c);
    
    const userExists = await checkUserIdExists(userId);
    
    if (!userExists) {
      return c.json({
        code: 404,
        msg: "用户不存在，请先使用脚本后再查看推荐状态"
      }, 404);
    }
    
    const status = await checkReferralStatus(userId);
    const stats = await getReferralStats(userId);
    
    let canRefer = false;
    let canReferReason = '';
    
    if (status.isReferred) {
      canRefer = false;
      canReferReason = '您已填写过推荐人';
    } else {
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

app.get('/', async (c) => {
  const token = c.req.query('token');
  const userId = c.req.query('userId') || c.req.query('u') || null;
  const fid = c.req.query('fid') || null;
  let workType = c.req.query('workType') || null;
  if (['zy', 'ks', 'zj'].includes(workType)) workType = 'cx';
  const masterSecret = getEnv('MASTER_SECRET');
  
  if (userId && !/^\d{7,10}$/.test(userId)) {
    return c.json({ code: 400, msg: '非法用户ID' }, 400);
  }

  // workType 白名单校验
  if (!workType || !ALLOWED_WORK_TYPES.includes(workType)) {
    console.log(`[Token验证] 非法 workType: "${workType}"，拒绝请求`);
    return c.json({
      code: 403,
      msg: '请更新最新的用户端，可正常使用',
      data: { valid: false }
    }, 403);
  }

  const clientIp = getClientIp(c);
  
  console.log(`[Token验证] userId=${userId}, fid=${fid}, workType=${workType}, IP=${clientIp}`);
  
  if (!token && userId) {
    const userExists = await checkUserIdExists(userId);
    if (!userExists) {
      const newToken = await createTokenForNewUser(userId, masterSecret, clientIp);
      const tokenRecord = await db.prepare("SELECT last_ip FROM tokens WHERE token = ?").get(newToken);
      const userIp = tokenRecord?.last_ip || clientIp;
      await recordUserId(userId, userIp, fid);
      console.log(`为新用户 ${userId} 生成Token: ${newToken}, IP: ${userIp}, fid: ${fid || '未知'}`);
      return c.json({
        code: 200,
        msg: `欢迎新用户！已为您生成Token，赠送${FREE_TOKEN_INITIAL_COUNT}次查询额度`,
        data: { valid: true, num: FREE_TOKEN_INITIAL_COUNT, isNew: true, newToken: newToken, sponsorUrl: SPONSOR_URL }
      });
    } else {
      const validTokens = await getUserValidTokens(userId);
      if (validTokens.length > 0) {
        if (fid) await recordUserId(userId, null, fid);
        // fid 未提供时跳过验证（向后兼容旧客户端）
        if (fid) {
          const fidMatch = await verifyUserFid(userId, fid);
          if (!fidMatch) {
            console.log(`[Token验证] userId=${userId} fid验证失败，拒绝返回token列表`);
            return c.json({
              code: 403,
              msg: '身份验证失败，请确保在学习通页面内使用',
              data: { valid: false }
            }, 403);
          }
        }
        return c.json({
          code: 401,
          msg: '请输入您的Token，或选择已有Token',
        data: { valid: false, existingTokens: validTokens }
        }, 401);
      }
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
    const { isNew, record, isBlacklisted } = await initOrGetToken(token, userId, verifyResult.count, clientIp, verifyResult.isFreeToken);
    
    if (isBlacklisted) {
      return c.json({
        code: 403,
        msg: '次数已用完，请从新赞助获取新token',
        data: { valid: false, num: 0, isBlacklisted: true, sponsorUrl: SPONSOR_URL }
      }, 403);
    }
    
    if (record && record.is_free_token === 1 && userId && workType !== 'zhs' && workType !== 'ouchn') {
      const tokenOwnerId = record.user_id;
      if (tokenOwnerId && tokenOwnerId !== userId) {
        console.log(`[Token验证] 免费Token不匹配: Token所有者=${tokenOwnerId}, 当前用户=${userId}`);
        return c.json({
          code: 403,
          msg: '免费token，限制本人学习通使用[可切换赞助获取token，不限制账户]',
          data: { valid: false, num: 0, sponsorUrl: SPONSOR_URL }
        }, 403);
      }
    }
    
    if (userId && fid) await recordUserId(userId, null, fid);

    if (userId) {
      await updateUserType(userId);
    }
    
    const cardInfo = verifyResult.cardName ? `（${verifyResult.cardName}）` : '';
    return c.json({
      code: 200,
      msg: isNew ? `Token验证成功，已初始化${record.remaining_count}次查询额度${cardInfo}` : 'Token验证成功',
      data: { valid: true, num: record.remaining_count, isNew: isNew, cardName: verifyResult.cardName, sponsorUrl: SPONSOR_URL }
    });
  } else {
    const validTokens = await getUserValidTokens(userId);
    if (validTokens.length > 0) {
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
    if (userId && fid) await recordUserId(userId, null, fid);
    return c.json({
      code: 401,
      msg: verifyResult.message,
      data: { valid: false }
    }, 401);
  }
});

// F-02去重：统一访问级别判断（替代分散的 limitedMode 条件判断）
// 返回值: { level: 'FULL' | 'LIMITED', tokenRecord?, skipUserIdCheck?, checkResult? }
// 若返回 deniedResponse 字段，则表示需要直接拒绝请求（如免费Token不属于当前用户）
async function determineAccessLevel({ token, masterSecret, userId, workType, clientIp, log }) {
  // 无Token：受限模式
  if (!token) {
    log("[WARN] 无Token，进入受限模式（仅查询缓存）");
    return { level: 'LIMITED' };
  }

  // Token验证
  const verifyResult = verifyUserToken(token, masterSecret);
  log(`Token验证: ${verifyResult.valid ? "[OK] 通过" : "[X] 失败"} - ${verifyResult.message}`);

  // Token无效：受限模式
  if (!verifyResult.valid) {
    log("[WARN] Token无效，进入受限模式（仅查询缓存）");
    return { level: 'LIMITED' };
  }

  // Token有效：初始化/获取Token记录
  const tokenRecord = await initOrGetToken(token, userId, verifyResult.count, clientIp, verifyResult.isFreeToken);

  // 免费Token：只允许 zhs/ouchn 跳过用户ID校验，其他平台必须校验
  if (tokenRecord.record && tokenRecord.record.is_free_token === 1 && userId && workType !== 'zhs' && workType !== 'ouchn') {
    const tokenOwnerId = tokenRecord.record.user_id;

    if (tokenOwnerId && tokenOwnerId !== userId) {
      log(`[WARN] 免费Token不属于当前用户 (Token所有者: ${tokenOwnerId}, 当前用户: ${userId})`);
      return {
        level: 'DENIED',
        deniedResponse: {
          code: 403,
          msg: '免费token，限制本人学习通使用[可切换赞助获取token，不限制账户]',
          data: { answer: ['免费token限制本人学习通使用'], num: 0, sponsorUrl: SPONSOR_URL }
        }
      };
    }
  }

  const skipUserIdCheck = workType === 'zhs' || workType === 'ouchn';
  const checkResult = await checkTokenStatus(token, userId, skipUserIdCheck);
  log(`次数检查: ${checkResult.success ? `[OK] 剩余${checkResult.remainingCount}次` : "[X] " + checkResult.message}`);

  // 次数不足：受限模式
  if (!checkResult.success) {
    log("[WARN] 次数不足，进入受限模式（仅查询缓存）");
    return { level: 'LIMITED', tokenRecord, skipUserIdCheck };
  }

  // 完全访问
  return { level: 'FULL', tokenRecord, skipUserIdCheck, checkResult };
}

app.post('/', async (c) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const log = (msg) => console.log(`[${requestId}] ${msg}`);
  
  try {
    const body = await c.req.json();
    const { token, questionData, verifyAnswer, checkOnly, userId, aiMode, model, enableWebSearch, fid } = body;
    const masterSecret = getEnv('MASTER_SECRET');
    const tokenhubApiKey = getEnv('TOKENHUB_API_KEY');
    
    if (userId && !/^\d{7,10}$/.test(userId)) {
      return c.json({ code: 400, msg: '非法用户ID' }, 400);
    }

    // workType 白名单校验
    let workType = (questionData?.workType || '').trim();
    if (['zy', 'ks', 'zj'].includes(workType)) workType = 'cx';
    if (!workType || !ALLOWED_WORK_TYPES.includes(workType)) {
      log(`[WARN] 非法 workType: "${workType}"，拒绝请求`);
      return c.json({
        code: 403,
        msg: '请更新最新的用户端，可正常使用',
        data: { answer: ['请更新最新的用户端，可正常使用'], num: 0 }
      }, 403);
    }

    log(`=== 开始处理请求 ===`);
    log(`enableWebSearch: ${enableWebSearch}`);
    log(`fid: ${fid || '未提供'}`);
    
    const clientIp = getClientIp(c);
    
    log("=== 请求参数 ===");
    log(`verifyAnswer: ${verifyAnswer} (${typeof verifyAnswer})`);
    log(`userId: ${userId}`);
    
    // F-02去重：使用统一访问级别判断函数
    const accessLevel = await determineAccessLevel({ token, masterSecret, userId, workType, clientIp, log });

    // 处理直接拒绝的情况（如免费Token不属于当前用户）
    if (accessLevel.level === 'DENIED' && accessLevel.deniedResponse) {
      return c.json(accessLevel.deniedResponse, accessLevel.deniedResponse.code);
    }

    const limitedMode = accessLevel.level === 'LIMITED';
    const skipUserIdCheck = accessLevel.skipUserIdCheck || false;
    
    if (limitedMode) {
      const quotaCheck = await checkLimitedDailyQuota(userId, clientIp);
      log(`受限模式每日限额: ${quotaCheck.used}/${quotaCheck.total} (key=${quotaCheck.key})`);
      
      if (!quotaCheck.allowed) {
        return c.json({
          code: 429,
          msg: `今日免费查题${quotaCheck.total}次已达上限，明日再试`,
          data: { limitedMode: true, answer: [`今日免费查题已达上限，明日再试`], num: 0, dailyQuotaUsed: quotaCheck.used, sponsorUrl: SPONSOR_URL }
        }, 429);
      }
    }
    
    if (limitedMode && (aiMode === true || aiMode === 'true' || verifyAnswer === true)) {
      return c.json({
        code: 403,
        msg: 'AI模式和校验模式需要输入有效Token，赞助获取token解锁',
        data: { limitedMode: true, answer: [], num: 0, sponsorUrl: SPONSOR_URL }
      }, 403);
    }
    
    const supportAsync = body.async === true;
    if (!supportAsync) {
      log("[WARN] 检测到老客户端请求，拒绝服务");
      return c.json({
        code: 426,
        msg: '您的脚本版本过旧，无法使用题库查询功能。请更新到最新版本以继续使用。',
        data: { 
          needUpdate: true,
          hint: '请更新最新脚本'
        }
      }, 426);
    }
    
    const taskId = 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
    
    // 查询开始时就记录 recentlyQueried（而非查询成功后），避免重启中断导致记录丢失
    const { generateQuestionHash } = require('./tiku');
    if (questionData?.question) {
      const questionHash = generateQuestionHash(questionData.question, questionData.options, questionData.type);
      recordRecentlyQueried(questionHash);
    }
    if (questionData?.questions && Array.isArray(questionData.questions)) {
      for (const q of questionData.questions) {
        const qHash = generateQuestionHash(q.question, q.options, q.type);
        recordRecentlyQueried(qHash);
      }
    }
    
    recordQueryRate();
    
    queryTasks.set(taskId, {
      status: 'pending',
      result: null,
      createdAt: Date.now()
    });
    saveTaskToDb(taskId, 'pending', null);
    
    log(`创建异步任务: ${taskId}`);
    
    setImmediate(async () => {
      try {
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
        saveTaskToDb(taskId, 'processing', null);
        
        log(`开始执行异步查询: ${taskId}`);
        
        // F-02去重：复用前面已计算的 skipUserIdCheck
        // 创建轻量 mock context，避免使用已响应的 Hono Context
        // handleQuery 及下游函数仅使用 c.json() 构造 Response，不读取 c.req
        const mockContext = {
          json: (data, status) => {
            const body = JSON.stringify(data);
            return new Response(body, {
              status: status || 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        };
        
        const response = await handleQuery(mockContext, {
          token,
          userId,
          questionData,
          verifyAnswer,
          checkOnly,
          aiMode,
          enableWebSearch,
          model,
          tokenhubApiKey,
          log,
          limitedMode,
          lockToken,
          settleToken,
          releaseToken,
          decrementCount,
          taskId,
          skipUserIdCheck
        });
        
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
        
        if (limitedMode) {
          try {
            await incrementLimitedCount(userId, clientIp);
          } catch (e) {
            console.error('[受限模式] 增加每日计数失败:', e.message);
          }
        }
        
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
        saveTaskToDb(taskId, 'completed', resultData);
        
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
        saveTaskToDb(taskId, 'completed', {
          code: 500,
          msg: '服务器错误: ' + e.message,
          data: { answer: [], num: 0 }
        });
      }
    });
    
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

console.log(`\n[ROCKET] 服务启动中...`);
console.log(`[INFO] 地址: http://localhost:${PORT}`);
console.log(`[STAT] 管理面板: http://localhost:${PORT}/admin`);

// PP题库请求日志7天自动清理
const _ppLogCleanupTimer = setInterval(async () => {
  try {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    const result = await db.prepare('DELETE FROM pp_api_logs WHERE last_used_at < ?').run(sevenDaysAgo);
    if (result.changes > 0) {
      console.log(`[PP请求日志] 已清理 ${result.changes} 条7天前的记录`);
    }
  } catch (e) {
    console.error('[PP请求日志] 清理失败:', e.message);
  }
}, 24 * 60 * 60 * 1000);
console.log(`[KEY] Token验证: 已开启 (需要Token验证)`);

(async () => {
  try {
    const whitelist = await getIpWhitelist();
    if (whitelist.length > 0) {
      console.log(`[SHIELD] IP白名单: ${whitelist.join(', ')}`);
    }
  } catch (e) {
    console.log(`[SHIELD] IP白名单: 暂无`);
  }
})();
console.log();

const allTimers = [
  _queryTaskCleanupTimer,
  _recentlyQueriedCleanupTimer,
  _verifyThinkingGrantCleanupTimer,
  _adminSessionCleanupTimer,
  _ppLogCleanupTimer,
  ...require('./ip-security')._timers,
  require('./remote-scripts')._scriptCleanupTimer
];

function gracefulShutdown() {
  console.log('\n[STOP] 正在关闭服务器...');
  for (const timer of allTimers) {
    clearInterval(timer);
  }
  server.close(() => {
    console.log('[OK] 服务器已关闭');
    process.exit(0);
  });
  setTimeout(() => {
    console.log('[WARN] 强制关闭服务器');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const server = http.createServer(async (req, res) => {
  let clientIp = req.socket.remoteAddress || req.connection.remoteAddress || '127.0.0.1';
  
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }
  
  req.headers['x-real-ip'] = clientIp;
  
  try {
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }
    
    const url = `http://${req.headers.host || 'localhost'}${req.url}`;
    
    const webRequest = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: body && body.length > 0 ? body : null,
      duplex: 'half'
    });
    
    const response = await app.fetch(webRequest);
    
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    if (response.headers.get('content-type')?.includes('text/event-stream') && response.body) {
      const reader = response.body.getReader();
      const flush = res.socket?.setNoDelay?.(true);
      res.socket?.setKeepAlive?.(true);
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
  console.log(`[OK] 服务器已启动，监听端口 ${PORT}`);
  
  const secondServer = getEnv('SECOND_SERVER_URL');
  if (secondServer && getEnv('SKIP_KEY_REFRESH') !== 'true') {
    try {
      const url = new URL(secondServer);
      console.log(`[BELL] 通知第二台服务器同步: ${secondServer}/sync`);
      
      http.request({
        hostname: url.hostname,
        port: url.port || 3001,
        path: '/sync?key=' + encodeURIComponent(getEnv('INTERNAL_API_KEY') || ''),
        method: 'POST',
        headers: {
          'X-Internal-Key': getEnv('INTERNAL_API_KEY') || ''
        },
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`[OK] 第二台服务器同步结果:`, result.msg || '成功');
          } catch (e) {
            console.log(`[OK] 第二台服务器已通知`);
          }
        });
      }).on('error', (e) => {
        console.log(`[WARN] 无法通知第二台服务器: ${e.message}`);
      }).end();
    } catch (e) {
      console.log(`[WARN] 第二台服务器URL配置错误: ${e.message}`);
    }
  }
  
  if (getEnv('SKIP_KEY_REFRESH') !== 'true') {
    const key1 = getEnv('TIKU_API_KEY_1');
    const key2 = getEnv('TIKU_API_KEY_2');
    if (key1 || key2) {
      console.log(`[SWITCH] 正在刷新题库海密钥剩余次数...`);
      refreshAllTikuKeys().then(results => {
        console.log(`[OK] 题库海密钥刷新完成: 密钥1=${results.key1 ?? '未配置'}, 密钥2=${results.key2 ?? '未配置'}`);
      }).catch(e => {
        console.error(`[X] 题库海密钥刷新失败:`, e.message);
      });
      
      function scheduleDailyRefresh() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow - now;
        
        console.log(`[CLOCK] 下次刷新时间: ${tomorrow.toLocaleString('zh-CN')}`);
        
        setTimeout(() => {
          console.log(`\n[SWITCH] [定时任务] 每日0点刷新题库海密钥...`);
          refreshAllTikuKeys().then(results => {
            console.log(`[OK] [定时任务] 刷新完成: 密钥1=${results.key1 ?? '未配置'}, 密钥2=${results.key2 ?? '未配置'}`);
          }).catch(e => {
            console.error(`[X] [定时任务] 刷新失败:`, e.message);
          }).finally(() => {
            scheduleDailyRefresh();
          });
        }, msUntilMidnight);
      }
      
      scheduleDailyRefresh();
    }
  }
});
