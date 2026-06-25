const { db, pool, INITIAL_COUNT, FREE_TOKEN_INITIAL_COUNT, FREE_TOKEN_SECRET, getCardTypes, FREE_MODE, withTransaction } = require('./config');
const { sha256 } = require('./utils');
const crypto = require('crypto');

// 检查用户ID是否已存在
async function checkUserIdExists(userId) {
  if (!userId) return false;
  const record = await db.prepare("SELECT user_id FROM user_ids WHERE user_id = ?").get(userId);
  return !!record;
}

// 记录用户ID（如果不存在则创建）
async function recordUserId(userId, ip = null, fid = null) {
  if (!userId) return;
  try {
    const now = Math.floor(Date.now() / 1000);
    // 使用 INSERT IGNORE 避免重复插入错误（竞态条件）
    const result = await db.prepare("INSERT IGNORE INTO user_ids (user_id, user_type, created_ip, fid, created_at) VALUES (?, ?, ?, ?, ?)").run(userId, 1, ip, fid, now);
    
    // affectedRows > 0 表示是新插入的记录
    if (result.changes > 0) {
      console.log(`记录新用户ID: ${userId}, IP: ${ip || '未知'}, fid: ${fid || '未知'}`);
      
      // 检查是否需要加入可疑IP表
      if (ip) {
        await checkAndRecordSuspiciousIp(ip);
      }
    } else {
      // 用户已存在，只有当fid不存在时才更新（首次绑定）
      if (fid) {
        const existing = await db.prepare("SELECT fid FROM user_ids WHERE user_id = ?").get(userId);
        if (!existing.fid) {
          // fid不存在，允许首次绑定
          await db.prepare("UPDATE user_ids SET fid = ? WHERE user_id = ?").run(fid, userId);
          console.log(`首次绑定用户 ${userId} 的 fid: ${fid}`);
        }
        // fid已存在时不允许覆盖
      }
    }
  } catch (e) {
    // 忽略重复键错误
    if (!e.message.includes('Duplicate')) {
      console.error('记录用户ID失败:', e.message);
    }
  }
}

// 验证用户fid是否匹配（返回true=匹配，false=不匹配/无fid信息）
async function verifyUserFid(userId, fid) {
  if (!userId || !fid) return false; // 没有fid信息时拒绝
  const record = await db.prepare("SELECT fid FROM user_ids WHERE user_id = ?").get(userId);
  if (!record || !record.fid) return false; // 数据库中没有fid记录时拒绝
  return record.fid === fid;
}

// 检查并记录可疑IP（同一IP创建多个用户ID）
async function checkAndRecordSuspiciousIp(ip) {
  try {
    // 查询该IP创建的所有用户ID
    const userIds = await db.prepare("SELECT user_id FROM user_ids WHERE created_ip = ?").all(ip);
    
    if (userIds.length >= 5) {
      // 同一IP创建了5个及以上用户ID，标记为可疑
      const userIdList = userIds.map(r => r.user_id).join(',');
      const existing = await db.prepare("SELECT * FROM suspicious_ips WHERE ip = ?").get(ip);
      
      if (existing) {
        // 更新记录
        await db.prepare(`
          UPDATE suspicious_ips 
          SET user_count = ?, user_ids = ?, updated_at = ? 
          WHERE ip = ?
        `).run(userIds.length, userIdList, Math.floor(Date.now() / 1000), ip);
        console.log(`[WARN] 更新可疑IP: ${ip}, 用户数: ${userIds.length}`);
      } else {
        // 新增记录
        await db.prepare(`
          INSERT INTO suspicious_ips (ip, user_count, user_ids, reason, created_at, updated_at) 
          VALUES (?, ?, ?, '同一IP创建多个用户ID', ?, ?)
        `).run(ip, userIds.length, userIdList, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000));
        console.log(`[WARN] 新增可疑IP: ${ip}, 用户数: ${userIds.length} (阈值: 5), 用户ID: ${userIdList}`);
      }
    }
  } catch (e) {
    console.error('检查可疑IP失败:', e.message);
  }
}

// 获取用户ID创建时间
async function getUserIdCreatedAt(userId) {
  if (!userId) return null;
  const record = await db.prepare("SELECT created_at FROM user_ids WHERE user_id = ?").get(userId);
  return record ? record.created_at : null;
}

// 计算用户类型（0=付费用户, 1=免费用户）- 基于tokens表计算
async function calculateUserType(userId) {
  if (!userId) return 1;
  
  // 方法1：检查是否有付费Token（is_free_token = 0）
  const paidToken = await db.prepare(
    "SELECT token FROM tokens WHERE user_id = ? AND is_blacklisted = 0 AND is_free_token = 0 LIMIT 1"
  ).get(userId);
  
  // 方法2：检查是否有 token 次数 > 40 的记录
  const highCountToken = await db.prepare(
    "SELECT token, remaining_count FROM tokens WHERE user_id = ? AND is_blacklisted = 0 AND remaining_count > 40 LIMIT 1"
  ).get(userId);
  
  // 满足任一条件即为付费用户
  return (paidToken || highCountToken) ? 0 : 1;
}

// 更新用户类型（存储到user_ids表）
async function updateUserType(userId) {
  if (!userId) return;
  const userType = await calculateUserType(userId);
  await db.prepare("UPDATE user_ids SET user_type = ? WHERE user_id = ?").run(userType, userId);
  console.log(`更新用户 ${userId} 类型为: ${userType === 0 ? '付费用户' : '免费用户'}`);
}

// 获取用户类型（从user_ids表读取）
async function getUserType(userId) {
  if (!userId) return 1;
  const record = await db.prepare("SELECT user_type FROM user_ids WHERE user_id = ?").get(userId);
  return record ? record.user_type : 1;
}

// 获取用户的所有有效Token（查询tokens表）
async function getUserValidTokens(userId) {
  if (!userId) return [];
  // 查询该用户绑定的所有有效token（未被黑名单，次数>0）
  const records = await db.prepare(`
    SELECT token, remaining_count, is_free_token FROM tokens 
    WHERE user_id = ? AND is_blacklisted = 0 AND remaining_count >= 1
    ORDER BY is_free_token ASC, remaining_count DESC
  `).all(userId);
  // 免费模式下返回次数为99999
  return records.map(r => ({ 
    token: r.token, 
    remainingCount: FREE_MODE ? 99999 : r.remaining_count, 
    isFreeToken: r.is_free_token 
  }));
}

// 检查用户是否是付费用户
async function isPaidUser(userId) {
  const userType = await getUserType(userId);
  return userType === 0;
}

// 验证用户Token（支持多种卡类型）- 同步函数，不涉及数据库
function verifyUserToken(token, masterSecret) {
  try {
    if (!token) {
      return { valid: false, message: "请先填写验证Token" };
    }
    
    if (!/^\d{16}$/.test(token)) {
      return { valid: false, message: "Token格式错误，必须是16位数字" };
    }
    
    const providedChecksum = token.substring(0, 4);
    const seed = token.substring(4, 16);
    
    // 优先检查免费Token密钥（与赞助卡密钥区分开）
    if (FREE_TOKEN_SECRET) {
      const data = `${FREE_TOKEN_SECRET}-${seed}`;
      const hash = sha256(data);
      const correctChecksum = (parseInt(hash.substring(0, 8), 16) % 10000).toString().padStart(4, '0');
      
      if (providedChecksum === correctChecksum) {
        return { valid: true, message: "验证成功", count: FREE_TOKEN_INITIAL_COUNT, cardName: '免费Token', isFreeToken: true };
      }
    }
    
    // 检查赞助卡类型
    const cardTypes = getCardTypes();
    for (const card of cardTypes) {
      const data = `${card.secret}-${seed}`;
      const hash = sha256(data);
      const correctChecksum = (parseInt(hash.substring(0, 8), 16) % 10000).toString().padStart(4, '0');
      
      if (providedChecksum === correctChecksum) {
        return { valid: true, message: "验证成功", count: card.count, cardName: card.name };
      }
    }
    
    // 向后兼容：检查传统单密钥（如果环境变量中有）
    if (masterSecret) {
      const data = `${masterSecret}-${seed}`;
      const hash = sha256(data);
      const correctChecksum = (parseInt(hash.substring(0, 8), 16) % 10000).toString().padStart(4, '0');
      
      if (providedChecksum === correctChecksum) {
        return { valid: true, message: "验证成功", count: INITIAL_COUNT, cardName: '默认卡' };
      }
    }
    
    return { valid: false, message: "Token无效，请赞助获取token" };
  } catch (e) {
    return { valid: false, message: "Token验证失败" };
  }
}

// 生成有效Token（16位数字，基于masterSecret）- 同步函数
function generateValidToken(masterSecret) {
  // 使用加密安全的随机数生成器，防止攻击者预测Token
  const seed = crypto.randomInt(0, 1000000000000).toString().padStart(12, '0');
  const data = `${masterSecret}-${seed}`;
  const hash = sha256(data);
  const checksum = (parseInt(hash.substring(0, 8), 16) % 10000).toString().padStart(4, '0');
  return checksum + seed;
}

// 为新用户创建Token（带防重检查，防止并发请求创建多个token）
// 使用 FREE_TOKEN_SECRET 生成（与赞助卡密钥区分开）
async function createTokenForNewUser(userId, masterSecret, ip = null) {
  // 防重检查：如果该用户已有未拉黑的免费token，直接返回
  const existingToken = await db.prepare(
    "SELECT token FROM tokens WHERE user_id = ? AND is_free_token = 1 AND is_blacklisted = 0 LIMIT 1"
  ).get(userId);
  
  if (existingToken) {
    console.log(`用户 ${userId} 已有免费Token: ${existingToken.token}，跳过创建`);
    return existingToken.token;
  }

  // 免费Token使用独立的密钥生成，与赞助卡区分开
  const freeSecret = FREE_TOKEN_SECRET || masterSecret;
  const now = Math.floor(Date.now() / 1000);
  const newToken = generateValidToken(freeSecret);

  await db.prepare(
    "INSERT INTO tokens (token, user_id, remaining_count, is_blacklisted, is_free_token, last_ip, created_at, last_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(newToken, userId, FREE_TOKEN_INITIAL_COUNT, 0, 1, ip, now, now);

  return newToken;
}

// 初始化或获取Token记录
async function initOrGetToken(token, userId = null, cardCount = null, ip = null, isFreeToken = false) {
  const now = Math.floor(Date.now() / 1000);
  const initialCount = cardCount || INITIAL_COUNT;
  
  const existing = await db.prepare("SELECT * FROM tokens WHERE token = ?").get(token);
  
  if (existing) {
    if (existing.is_blacklisted === 1) {
      return { isNew: false, record: existing, isBlacklisted: true };
    }
    // 如果传入了userId且数据库中没有，则更新
    if (userId && !existing.user_id) {
      await db.prepare("UPDATE tokens SET user_id = ? WHERE token = ?").run(userId, token);
      existing.user_id = userId;
    }
    // 只有IP变化时才更新
    if (ip && existing.last_ip !== ip) {
      await db.prepare("UPDATE tokens SET last_ip = ? WHERE token = ?").run(ip, token);
      existing.last_ip = ip;
    }
    return { isNew: false, record: existing, isBlacklisted: false };
  }
  
  await db.prepare(
    "INSERT INTO tokens (token, user_id, remaining_count, is_blacklisted, is_free_token, last_ip, created_at, last_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(token, userId, initialCount, 0, isFreeToken ? 1 : 0, ip, now, now);
  
  return { 
    isNew: true, 
    record: { token, user_id: userId, remaining_count: initialCount, is_blacklisted: 0, is_free_token: isFreeToken ? 1 : 0, last_ip: ip, created_at: now, last_used: now },
    isBlacklisted: false
  };
}

// 检查Token状态
async function checkTokenStatus(token, userId = null, skipUserIdCheck = false) {
  const record = await db.prepare("SELECT remaining_count, is_blacklisted, is_free_token, user_id FROM tokens WHERE token = ?").get(token);
  
  if (!record) {
    return { success: false, message: "Token记录不存在，请先验证" };
  }
  
  // 验证免费Token的user_id绑定（智慧树跳过此验证）
  if (record.is_free_token === 1 && !skipUserIdCheck) {
    // 免费Token必须提供userId
    if (!userId) {
      return { success: false, message: "免费Token需要验证用户身份", isBlacklisted: false };
    }
    // userId必须匹配
    if (record.user_id && record.user_id !== userId) {
      return { success: false, message: "免费Token仅限本人使用，此Token已绑定其他账号", isBlacklisted: false };
    }
  }
  
  if (record.is_blacklisted === 1 || record.remaining_count < 0.1) {
    if (record.is_blacklisted !== 1) {
      await db.prepare("UPDATE tokens SET is_blacklisted = 1 WHERE token = ?").run(token);
    }
    return { success: false, message: `剩余次数不足（${record.remaining_count}次），请从新赞助获取新token`, isBlacklisted: true };
  }
  
  return { success: true, remainingCount: record.remaining_count, user_id: record.user_id };
}

// 均匀随机整数：分布在 [min, max] 区间
function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// 推荐功能：处理推荐关系
async function processReferral(referrerId, refereeId) {
  // 不能推荐自己
  if (referrerId === refereeId) {
    return { success: false, message: "不能推荐自己" };
  }
  
  // 从user_ids表获取被推荐人的注册时间
  const refereeCreatedAt = await getUserIdCreatedAt(refereeId);
  
  // 检查被推荐人是否存在（必须先打开过推广页面或验证过Token）
  if (!refereeCreatedAt) {
    return { success: false, message: "用户信息不存在，请刷新页面重试" };
  }
  
  // 检查是否为新用户（24小时内注册）
  const now = Math.floor(Date.now() / 1000);
  const isNewUser = (now - refereeCreatedAt) < 86400; // 24小时 = 86400秒
  if (!isNewUser) {
    return { success: false, message: "仅限新用户（注册24小时内）填写推荐人" };
  }
  
  // 检查推荐人是否存在（在user_ids表中）
  const referrerCreatedAt = await getUserIdCreatedAt(referrerId);
  if (!referrerCreatedAt) {
    return { success: false, message: "推荐人不存在" };
  }
  
  // 检查推荐人是否是付费用户（user_type=0）
  const paid = await isPaidUser(referrerId);
  if (!paid) {
    return { success: false, message: "推荐人需要是付费用户才能获得推广奖励" };
  }
  
  // 随机奖励：推荐人20-100次，被推荐人20-50次（完全随机）
  const REFERRER_REWARD = randomInt(20, 100);
  const REFEREE_REWARD = randomInt(20, 50);
  
  console.log(`推荐奖励随机：推荐人+${REFERRER_REWARD}次，被推荐人+${REFEREE_REWARD}次`);
  
  // 使用事务保证原子性：INSERT推荐记录 + 更新双方Token余额（Q-04去重：使用 withTransaction）
  let txnResult;
  try {
    txnResult = await withTransaction(async (conn) => {
      // 记录推荐关系（INSERT IGNORE 防并发竞态：若 referee_id 已存在则跳过）
      const [insertResult] = await conn.execute(
        "INSERT IGNORE INTO referrals (referrer_id, referee_id, referrer_reward, referee_reward, created_at) VALUES (?, ?, ?, ?, ?)",
        [referrerId, refereeId, REFERRER_REWARD, REFEREE_REWARD, now]
      );

      if (insertResult.affectedRows === 0) {
        return { success: false, message: "您已经填写过推荐人了" };
      }

      // 给推荐人增加次数（只更新最新使用的Token）
      const [referrerRows] = await conn.execute(
        "SELECT token FROM tokens WHERE user_id = ? AND is_blacklisted = 0 ORDER BY last_used DESC LIMIT 1",
        [referrerId]
      );
      if (referrerRows.length > 0) {
        await conn.execute(
          "UPDATE tokens SET remaining_count = remaining_count + ? WHERE token = ?",
          [REFERRER_REWARD, referrerRows[0].token]
        );
      }

      // 给被推荐人增加次数
      const [refereeRows] = await conn.execute(
        "SELECT token FROM tokens WHERE user_id = ? AND is_blacklisted = 0 ORDER BY last_used DESC LIMIT 1",
        [refereeId]
      );
      if (refereeRows.length > 0) {
        await conn.execute(
          "UPDATE tokens SET remaining_count = remaining_count + ? WHERE token = ?",
          [REFEREE_REWARD, refereeRows[0].token]
        );
      }

      return null; // 成功标志
    });
  } catch (e) {
    console.error("推荐事务失败:", e.message);
    return { success: false, message: "推荐处理失败，请稍后重试" };
  }

  // 事务中返回非null表示有业务错误（如已推荐过）
  if (txnResult) {
    return txnResult;
  }
  
  return { 
    success: true, 
    message: `推荐成功！推荐人获得${REFERRER_REWARD}次，您获得${REFEREE_REWARD}次`,
    referrerReward: REFERRER_REWARD,
    refereeReward: REFEREE_REWARD
  };
}

// 检查用户是否已被推荐
async function checkReferralStatus(userId) {
  const referral = await db.prepare("SELECT * FROM referrals WHERE referee_id = ?").get(userId);
  return {
    isReferred: !!referral,
    referrerId: referral ? referral.referrer_id : null,
    myReward: referral ? referral.referee_reward : 0  // 被推荐人获得的奖励
  };
}

// 获取推荐统计
async function getReferralStats(userId) {
  const referrals = await db.prepare("SELECT * FROM referrals WHERE referrer_id = ?").all(userId);
  return {
    totalReferrals: referrals.length,
    totalRewards: referrals.reduce((sum, r) => sum + (r.referrer_reward || 0), 0)
  };
}

// 扣除次数（原子操作，使用 UPDATE ... WHERE remaining_count >= ? 避免竞态条件）
// 扣减 + 归零拉黑使用事务保证原子性，避免并发场景下状态不一致
async function decrementCount(token, userId = null, skipUserIdCheck = false, count = 1, checkOnly = false) {
  const now = Math.floor(Date.now() / 1000);
  
  const record = await db.prepare("SELECT remaining_count, is_blacklisted, is_free_token, user_id FROM tokens WHERE token = ?").get(token);
  
  if (!record) {
    return { success: false, message: "Token记录不存在", remainingCount: 0 };
  }
  
  // 检查黑名单（checkOnly 模式也需检查）
  if (record.is_blacklisted === 1) {
    return { success: false, message: "Token已被拉黑", remainingCount: record.remaining_count };
  }
  
  // 验证免费Token的user_id绑定（智慧树跳过此验证）
  if (record.is_free_token === 1 && !skipUserIdCheck) {
    // 免费Token必须提供userId
    if (!userId) {
      return { success: false, message: "免费Token需要验证用户身份", remainingCount: record.remaining_count };
    }
    // userId必须匹配
    if (record.user_id && record.user_id !== userId) {
      return { success: false, message: "免费Token仅限本人使用", remainingCount: record.remaining_count };
    }
  }
  
  // 剩余次数不足，拒绝扣减
  if (record.remaining_count < count) {
    return { success: false, message: `剩余次数不足（${record.remaining_count}次，需${count}次），请赞助获取新token`, remainingCount: record.remaining_count };
  }

  // 仅检查模式：不实际扣减，只返回余额
  if (checkOnly) {
    return { success: true, remainingCount: record.remaining_count };
  }

  // 事务化扣减 + 拉黑：保证"扣减"与"归零拉黑"两步操作的原子性（Q-04去重：使用 withTransaction）
  try {
    return await withTransaction(async (conn) => {
      // 原子扣减：使用 WHERE remaining_count >= ? 保证并发安全
      const [result] = await conn.execute(
        "UPDATE tokens SET remaining_count = remaining_count - ?, last_used = ? WHERE token = ? AND remaining_count >= ?",
        [count, now, token, count]
      );

      if (result.affectedRows === 0) {
        // 并发场景下余额已被其他请求消耗
        return { success: false, message: "余额不足，请赞助获取新token", remainingCount: 0 };
      }

      // 检查扣减后是否归零，需要拉黑
      const [rows] = await conn.execute(
        "SELECT remaining_count FROM tokens WHERE token = ?",
        [token]
      );
      const updated = rows[0];
      const finalCount = updated ? parseFloat(Number(updated.remaining_count).toFixed(1)) : 0;
      if (finalCount < 0.1) {
        await conn.execute(
          "UPDATE tokens SET remaining_count = 0, is_blacklisted = 1 WHERE token = ?",
          [token]
        );
        return { success: true, remainingCount: 0, justBlacklisted: true };
      }

      return { success: true, remainingCount: finalCount };
    });
  } catch (e) {
    console.error("[decrementCount] 事务失败:", e.message);
    return { success: false, message: "扣减失败，请稍后重试", remainingCount: 0 };
  }
}

// ==================== AI模式预锁定机制 ====================
// 防止并发请求导致余额透支，调用AI前锁定一定数量的token，完成后按实际消耗结算

// 内存中存储当前锁定的token：token -> { lockedAt, lockCount, refCount }
// refCount 用于引用计数，支持同一Token并发锁定
const lockedTokens = new Map();
const LOCK_EXPIRY = 60 * 1000; // 锁定60秒后自动释放（兜底，防死锁）

/**
 * 锁定Token次数（AI模式调用前）
 * @param {string} token - 用户Token
 * @param {number} lockCount - 锁定次数
 * @returns {Promise<Object>} { success, remainingCount, message }
 */
async function lockToken(token, lockCount) {
  if (!token) return { success: false, message: 'Token为空' };
  
  // 清理该Token的过期锁定（如果有）
  const existing = lockedTokens.get(token);
  if (existing && Date.now() - existing.lockedAt >= LOCK_EXPIRY) {
    lockedTokens.delete(token);
  }
  
  // 检查余额是否足够
  const record = await db.prepare('SELECT remaining_count FROM tokens WHERE token = ? AND is_blacklisted = 0').get(token);
  if (!record) {
    return { success: false, message: 'Token无效或已被拉黑' };
  }
  if (record.remaining_count < lockCount) {
    return { success: false, message: `余额不足，需要${lockCount}次，剩余${record.remaining_count}次，请赞助获取新token` };
  }
  
  // 锁定：扣除锁定次数（Q-04去重：使用 withTransaction）
  try {
    const lockResult = await withTransaction(async (conn) => {
      // 原子扣减锁定次数
      const [result] = await conn.execute(
        'UPDATE tokens SET remaining_count = remaining_count - ? WHERE token = ? AND remaining_count >= ?',
        [lockCount, token, lockCount]
      );

      if (result.affectedRows === 0) {
        return { success: false, message: '余额不足，请赞助获取新token' };
      }

      return null; // 成功
    });

    if (lockResult) {
      return lockResult; // 返回业务错误
    }
  } catch (e) {
    console.error('[lockToken] 事务失败:', e.message);
    return { success: false, message: '锁定失败，请稍后重试' };
  }
  
  // 记录锁定（引用计数：同一Token并发锁定时累加 refCount）
  const current = lockedTokens.get(token);
  if (current) {
    lockedTokens.set(token, { 
      lockedAt: current.lockedAt, 
      lockCount: current.lockCount + lockCount,
      refCount: current.refCount + 1
    });
  } else {
    lockedTokens.set(token, { lockedAt: Date.now(), lockCount, refCount: 1 });
  }
  
  return { 
    success: true, 
    remainingCount: record.remaining_count - lockCount 
  };
}

/**
 * 结算Token（AI模式调用完成后）
 * 预锁定时已扣减lockCount，现在根据actualCost多退少补：
 *   - actualCost < lockCount：退还 (lockCount - actualCost) 次
 *   - actualCost > lockCount：补扣 (actualCost - lockCount) 次
 *   - actualCost = lockCount：无需操作
 * @param {string} token - 用户Token
 * @param {number} lockCount - 预锁定次数
 * @param {number} actualCost - 实际消耗
 * @returns {Promise<Object>} { success, remainingCount, message }
 */
async function settleToken(token, lockCount, actualCost) {
  if (!token) return { success: false, message: 'Token为空' };
  
  // 引用计数递减：仅当所有并发锁定都结算后才删除锁记录
  const current = lockedTokens.get(token);
  if (current) {
    const newRef = current.refCount - 1;
    if (newRef <= 0) {
      lockedTokens.delete(token);
    } else {
      lockedTokens.set(token, {
        lockedAt: current.lockedAt,
        lockCount: current.lockCount - lockCount,
        refCount: newRef
      });
    }
  }
  
  const diff = lockCount - actualCost; // 正数=退还，负数=补扣
  
  if (diff === 0) {
    // 刚好相等，无需操作
    const record = await db.prepare('SELECT remaining_count FROM tokens WHERE token = ?').get(token);
    return { success: true, remainingCount: record ? record.remaining_count : 0 };
  }
  
  // 结算：退还或补扣次数（Q-04去重：使用 withTransaction）
  try {
    const settleResult = await withTransaction(async (conn) => {
      if (diff > 0) {
        // 退还多余次数
        await conn.execute(
          'UPDATE tokens SET remaining_count = remaining_count + ? WHERE token = ?',
          [diff, token]
        );
      } else {
        // 补扣不足次数（actualCost > lockCount 的情况）
        const extraCost = Math.abs(diff);
        const [result] = await conn.execute(
          'UPDATE tokens SET remaining_count = remaining_count - ? WHERE token = ? AND remaining_count >= ?',
          [extraCost, token, extraCost]
        );
        if (result.affectedRows === 0) {
          // 余额不足以补扣，扣到0并拉黑
          await conn.execute(
            'UPDATE tokens SET remaining_count = 0, is_blacklisted = 1 WHERE token = ?',
            [token]
          );
          console.log(`[预锁定结算] Token ${token.substring(0, 8)}*** 余额不足补扣${extraCost}次，已拉黑`);
          return { success: true, remainingCount: 0 };
        }
        // 补扣成功后检查是否归零，若是则拉黑（与 decrementCount 逻辑一致）
        const [afterRows] = await conn.execute(
          'SELECT remaining_count FROM tokens WHERE token = ?',
          [token]
        );
        const afterCount = afterRows[0] ? parseFloat(Number(afterRows[0].remaining_count).toFixed(1)) : 0;
        if (afterCount < 0.1) {
          await conn.execute(
            'UPDATE tokens SET remaining_count = 0, is_blacklisted = 1 WHERE token = ?',
            [token]
          );
          console.log(`[预锁定结算] Token ${token.substring(0, 8)}*** 补扣后余额归零，已拉黑`);
          return { success: true, remainingCount: 0 };
        }
      }
      return null; // 成功，外层查询余额
    });

    if (settleResult) {
      return settleResult; // 返回拉黑结果
    }

    // 查询更新后余额
    const record = await db.prepare('SELECT remaining_count FROM tokens WHERE token = ?').get(token);
    return {
      success: true,
      remainingCount: record ? record.remaining_count : 0
    };
  } catch (e) {
    console.error('[settleToken] 事务失败:', e.message);
    return { success: false, message: '结算失败' };
  }
}

/**
 * 释放锁定（异常时调用）
 * @param {string} token - 用户Token
 * @param {number} lockCount - 锁定次数
 * @param {boolean} isSystemError - 是否为系统异常（API超时、网络错误、5xx等），系统异常时退还预锁定次数
 */
async function releaseToken(token, lockCount, isSystemError = false) {
  if (!token) return;
  
  // 引用计数递减
  const current = lockedTokens.get(token);
  if (current) {
    const newRef = current.refCount - 1;
    if (newRef <= 0) {
      lockedTokens.delete(token);
    } else {
      lockedTokens.set(token, {
        lockedAt: current.lockedAt,
        lockCount: current.lockCount - lockCount,
        refCount: newRef
      });
    }
  }
  
  if (isSystemError) {
    // 系统异常：退还预锁定次数，避免用户因系统故障损失
    try {
      await pool.execute(
        'UPDATE tokens SET remaining_count = remaining_count + ? WHERE token = ?',
        [lockCount, token]
      );
      console.log(`[预锁定] Token ${token.substring(0, 8)}*** 系统异常释放，退还${lockCount}次`);
    } catch (e) {
      console.error(`[预锁定] Token ${token.substring(0, 8)}*** 退费失败:`, e.message);
    }
  } else {
    // 用户主动中断：不退还次数（防止恶意利用异常逃费）
    console.log(`[预锁定] Token ${token.substring(0, 8)}*** 用户中断释放，${lockCount}次已扣`);
  }
}

// ==================== 每晚0点重置黑名单Token次数 ====================
// 将 is_blacklisted = 1 的 token 的 remaining_count 重置为 0（不解除黑名单）
function scheduleBlacklistReset() {
  const now = new Date();
  // 计算下一个0点（UTC+8）
  const utc8Now = new Date(now.getTime() + 8 * 3600000);
  const nextMidnightUTC8 = new Date(utc8Now);
  nextMidnightUTC8.setUTCDate(nextMidnightUTC8.getUTCDate() + 1);
  nextMidnightUTC8.setUTCHours(0, 0, 0, 0);
  // 转回本地时间戳
  const delay = nextMidnightUTC8.getTime() - 8 * 3600000 - now.getTime();

  setTimeout(async () => {
    await resetBlacklistedTokens();
    // 之后每24小时执行一次
    setInterval(resetBlacklistedTokens, 24 * 60 * 60 * 1000);
  }, delay);

  console.log(`[黑名单重置] 已调度，下次执行: ${nextMidnightUTC8.toISOString().replace('T', ' ').substring(0, 19)} (UTC+8 0点)`);
}

async function resetBlacklistedTokens() {
  try {
    const result = await db.prepare(
      "UPDATE tokens SET remaining_count = 0 WHERE is_blacklisted = 1"
    ).run();
    console.log(`[黑名单重置] 已重置 ${result.changes} 个黑名单Token的remaining_count→0`);
  } catch (e) {
    console.error('[黑名单重置] 重置失败:', e.message);
  }
}

// 启动时调度
scheduleBlacklistReset();

// 定期清理过期锁定
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, data] of lockedTokens.entries()) {
    if (now - data.lockedAt > LOCK_EXPIRY) {
      lockedTokens.delete(token);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[预锁定] 清理${cleaned}个过期锁定`);
  }
}, 30 * 1000); // 每30秒清理一次

// 导出认证函数
module.exports = {
  checkUserIdExists,
  recordUserId,
  checkAndRecordSuspiciousIp,
  getUserIdCreatedAt,
  calculateUserType,
  updateUserType,
  getUserType,
  getUserValidTokens,
  isPaidUser,
  verifyUserToken,
  generateValidToken,
  createTokenForNewUser,
  initOrGetToken,
  checkTokenStatus,
  randomInt,
  processReferral,
  checkReferralStatus,
  getReferralStats,
  decrementCount,
  verifyUserFid,
  lockToken,
  settleToken,
  releaseToken
};
