const { db } = require('./config');

/**
 * 远程脚本管理：根据用户IP判断是否需要下发脚本执行指令
 * 同一IP每天只下发一次，数据库记录3天后自动清理
 */

// 远程脚本配置：key为脚本标识，url为下载地址
const REMOTE_SCRIPTS = {
  pp_tiku: {
    name: 'PP网课小助手',
    url: 'https://scriptcat.org/scripts/code/5615/%F0%9F%A5%87%EF%BC%88%E4%BA%91%E7%AB%AF%E7%83%AD%E6%9B%B4%E6%96%B0%E7%89%88%EF%BC%89%E9%A2%98%E5%BA%93%E9%99%90%E6%97%B6%E5%85%8D%E8%B4%B9%E4%B8%AD%20%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%EF%BD%9C%E7%9F%A5%E5%88%B0%E6%99%BA%E6%85%A7%E6%A0%91--%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7CAI%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98%7C%E7%AD%94%E6%A1%88%E6%A0%A1%E9%AA%8C%7CAI%2B%E9%A2%98%E5%BA%93%E8%B0%83%E7%94%A8%E8%B4%B9%E7%94%A81%E5%85%83300%2B%E6%AC%A1%7C%E9%A3%98%E9%A3%98%E5%8F%8B%E6%83%85%E6%8F%90%E4%BE%9B%7C%E8%87%AA%E5%8A%A8%E8%B7%B3%E8%BD%AC%E4%BB%BB%E5%8A%A1%E7%82%B9%7C%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98%7C%E8%B6%85%E9%AB%98%E9%A2%98%E5%BA%93%E8%A6%86%E7%9B%96%E7%8E%87%7C%E9%80%90%E6%B8%90%E6%94%AF%E6%8C%81%E6%9B%B4%E5%A4%9A%E5%B9%B3%E5%8F%B0.user.js'
  }
  // 后续可添加更多脚本：
  // other_script: {
  //   name: '其他脚本',
  //   url: 'https://...'
  // }
};

/**
 * 查询需要下发的脚本列表（同一IP同一天只下发一次）
 */
async function handleRemoteScripts(c) {
  try {
    const clientIp = getClientIp(c);
    const now = Math.floor(Date.now() / 1000);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 查询该IP今天已下载过的脚本
    const rows = await db.prepare(
      "SELECT script_key FROM script_download_ips WHERE ip = ? AND limit_date = ?"
    ).all(clientIp, today);

    const downloadedKeys = new Set(rows.map(r => r.script_key));

    // 筛选出需要下发的脚本
    const scripts = [];
    for (const [key, config] of Object.entries(REMOTE_SCRIPTS)) {
      if (!downloadedKeys.has(key)) {
        scripts.push({ key, name: config.name, url: config.url });
        // 记录到数据库
        await db.prepare(
          "INSERT IGNORE INTO script_download_ips (ip, script_key, limit_date, downloaded, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)"
        ).run(clientIp, key, today, now, now);
      }
    }

    if (scripts.length > 0) {
      console.log(`[远程脚本] IP ${clientIp} 今日首次请求，下发 ${scripts.length} 个脚本: ${scripts.map(s => s.key).join(', ')}`);
    }

    return c.json({
      code: 200,
      msg: 'success',
      data: {
        hasUpdate: scripts.length > 0,
        patches: scripts.map(s => ({
          id: s.key,
          description: s.name,
          downloadUrl: s.url
        }))
      }
    });
  } catch (e) {
    console.error('[远程脚本] 处理失败:', e.message);
    return c.json({ code: 500, msg: '服务器错误', data: null }, 500);
  }
}

// 定时清理3天前的记录
setInterval(async () => {
  try {
    const result = await db.prepare(
      "DELETE FROM script_download_ips WHERE limit_date < DATE_SUB(CURDATE(), INTERVAL 3 DAY)"
    ).run();
    if (result.changes > 0) {
      console.log(`[远程脚本] 已清理 ${result.changes} 条3天前的下载记录`);
    }
  } catch (e) {
    console.error('[远程脚本] 清理失败:', e.message);
  }
}, 24 * 60 * 60 * 1000);

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

module.exports = { handleRemoteScripts, REMOTE_SCRIPTS };
