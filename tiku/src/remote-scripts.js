const { db } = require('./config');
const { getClientIp } = require('./utils');

/**
 * 远程脚本管理：根据用户IP判断是否需要下发脚本执行指令
 * 同一IP每天只下发一次，数据库记录3天后自动清理
 */

// 远程脚本配置：key为脚本标识，url为下载地址
const REMOTE_SCRIPTS = {
  pp_tiku: {
    name: 'PP网课小助手',
    url: 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C.user.js'
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
const _scriptCleanupTimer = setInterval(async () => {
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

module.exports = { handleRemoteScripts, REMOTE_SCRIPTS, _scriptCleanupTimer };
