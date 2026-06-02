const { db, getEnv, INITIAL_COUNT, getCardTypes, FREE_MODE } = require('./config');
const { sha256 } = require('./utils');

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
        console.log(`⚠️ 更新可疑IP: ${ip}, 用户数: ${userIds.length}`);
      } else {
        // 新增记录
        await db.prepare(`
          INSERT INTO suspicious_ips (ip, user_count, user_ids, reason, created_at, updated_at) 
          VALUES (?, ?, ?, '同一IP创建多个用户ID', ?, ?)
        `).run(ip, userIds.length, userIdList, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000));
        console.log(`⚠️ 新增可疑IP: ${ip}, 用户数: ${userIds.length} (阈值: 5), 用户ID: ${userIdList}`);
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
    WHERE user_id = ? AND is_blacklisted = 0 AND remaining_count > 0
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
    
    // 首先检查是否匹配任意卡类型
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
    
    return { valid: false, message: "Token无效，请购买token" };
  } catch (e) {
    return { valid: false, message: "Token验证失败" };
  }
}

// 生成有效Token（16位数字，基于masterSecret）- 同步函数
function generateValidToken(masterSecret) {
  const seed = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
  const data = `${masterSecret}-${seed}`;
  const hash = sha256(data);
  const checksum = (parseInt(hash.substring(0, 8), 16) % 10000).toString().padStart(4, '0');
  return checksum + seed;
}

// 为新用户创建Token
async function createTokenForNewUser(userId, masterSecret, ip = null) {
  const now = Math.floor(Date.now() / 1000);
  const newToken = generateValidToken(masterSecret);

  await db.prepare(
    "INSERT INTO tokens (token, user_id, remaining_count, is_blacklisted, is_free_token, last_ip, created_at, last_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(newToken, userId, 40, 0, 1, ip, now, now);

  return newToken;
}

// 初始化或获取Token记录
async function initOrGetToken(token, userId = null, cardCount = null, ip = null) {
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
    "INSERT INTO tokens (token, user_id, remaining_count, is_blacklisted, last_ip, created_at, last_used) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(token, userId, initialCount, 0, ip, now, now);
  
  return { 
    isNew: true, 
    record: { token, user_id: userId, remaining_count: initialCount, is_blacklisted: 0, last_ip: ip, created_at: now, last_used: now },
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
  
  if (record.is_blacklisted === 1 || record.remaining_count <= 0) {
    if (record.is_blacklisted !== 1) {
      await db.prepare("UPDATE tokens SET is_blacklisted = 1 WHERE token = ?").run(token);
    }
    return { success: false, message: "次数已用完，请从新购买token", isBlacklisted: true };
  }
  
  return { success: true, remainingCount: record.remaining_count };
}

// 完全随机数：均匀分布在 [min, max] 区间
function weightedRandom(min, max) {
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
  const REFERRER_REWARD = weightedRandom(20, 100);
  const REFEREE_REWARD = weightedRandom(20, 50);
  
  console.log(`推荐奖励随机：推荐人+${REFERRER_REWARD}次，被推荐人+${REFEREE_REWARD}次`);
  
  // 记录推荐关系（INSERT IGNORE 防并发竞态：若 referee_id 已存在则跳过）
  const insertResult = await db.prepare(
    "INSERT IGNORE INTO referrals (referrer_id, referee_id, referrer_reward, referee_reward, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(referrerId, refereeId, REFERRER_REWARD, REFEREE_REWARD, now);
  
  if (insertResult.changes === 0) {
    return { success: false, message: "您已经填写过推荐人了" };
  }
  
  // 给推荐人增加次数（只更新最新使用的Token）
  await db.prepare(
    "UPDATE tokens SET remaining_count = remaining_count + ? WHERE token = (SELECT token FROM tokens WHERE user_id = ? AND is_blacklisted = 0 ORDER BY last_used DESC LIMIT 1)"
  ).run(REFERRER_REWARD, referrerId);
  
  // 给被推荐人增加次数（用户一定有Token，因为使用脚本时会自动创建）
  const refereeToken = await db.prepare("SELECT token FROM tokens WHERE user_id = ? AND is_blacklisted = 0 ORDER BY last_used DESC LIMIT 1").get(refereeId);
  if (refereeToken) {
    await db.prepare(
      "UPDATE tokens SET remaining_count = remaining_count + ? WHERE token = ?"
    ).run(REFEREE_REWARD, refereeToken.token);
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

// 扣除次数（智慧树支持跳过用户ID验证）
async function decrementCount(token, userId = null, skipUserIdCheck = false) {
  const now = Math.floor(Date.now() / 1000);
  
  const record = await db.prepare("SELECT remaining_count, is_free_token, user_id FROM tokens WHERE token = ?").get(token);
  
  if (!record) {
    return { success: false, message: "Token记录不存在", remainingCount: 0 };
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
  
  const newCount = record.remaining_count - 1;
  
  if (newCount === 0) {
    await db.prepare(
      "UPDATE tokens SET remaining_count = 0, is_blacklisted = 1, last_used = ? WHERE token = ?"
    ).run(now, token);
    return { success: true, remainingCount: 0, justBlacklisted: true };
  }
  
  await db.prepare(
    "UPDATE tokens SET remaining_count = remaining_count - 1, last_used = ? WHERE token = ?"
  ).run(now, token);
  
  return { success: true, remainingCount: newCount };
}

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
  weightedRandom,
  processReferral,
  checkReferralStatus,
  getReferralStats,
  decrementCount,
  verifyUserFid
};
