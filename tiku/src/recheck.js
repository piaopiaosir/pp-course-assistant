/**
 * 重查数据库中 is_correct=0 的题目（题库海 + AI 深度思考 fallback）
 * 
 * 功能:
 * 1. 查询数据库中标记为错误的题目 (is_correct=0)
 * 2. 先调用题库海 API 查询
 * 3. 如果题库海无答案，调用 AI 深度思考（校验模式）
 * 4. 校验答案
 * 5. 如果校验通过，更新数据库并将 is_correct 改为 NULL(未验证)
 * 
 * 使用方法:
 * node recheck.js
 */

const path = require('path');
const fs = require('fs');

// 加载环境变量
const envPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const { db, pool } = require('./config');
const { validateAndCleanAnswer, getTypeDescription } = require('./utils');
const { fetchDeepSeekThinking } = require('./modes/verify-mode');
const { incrementTikuCalls, incrementAiCalls, incrementTotalQueries, saveAnswerToCacheAsync } = require('./tiku');
const { getDisplayName } = require('./config/ai-models');

// ==================== 配置 ====================

// 题库海配置
const TIKU_API_KEY_1 = process.env.TIKU_API_KEY_1;
const TIKU_API_KEY_2 = process.env.TIKU_API_KEY_2;
const TIKU_API_URL = 'http://api.tikuhai.com/search';

if (!TIKU_API_KEY_1 || !TIKU_API_KEY_2) {
  console.error('[X] 错误: 请在 .env 文件中配置 TIKU_API_KEY_1 和 TIKU_API_KEY_2');
  process.exit(1);
}

// 统计
let stats = {
  total: 0,
  processed: 0,
  tikuSuccess: 0,      // 题库海成功
  aiSuccess: 0,        // AI 成功
  failed: 0,           // 查询失败
  invalid: 0,          // 校验失败
  updated: 0           // 数据库更新
};

// ==================== 题库海 API ====================

/**
 * 调用题库海 API（使用服务器当前选择的密钥）
 */
async function callTikuApi(questionData) {
  // 从数据库获取当前使用的密钥
  const keyStats = await db.prepare(
    "SELECT current_tiku_key, tiku_remaining_1, tiku_remaining_2 FROM global_stats WHERE id = 1"
  ).get();
  
  let currentKey = keyStats?.current_tiku_key || 1;
  const remaining1 = keyStats?.tiku_remaining_1 || 0;
  const remaining2 = keyStats?.tiku_remaining_2 || 0;
  
  // 智能选择密钥：优先使用有次数的
  if (remaining1 > 0 && remaining2 <= 0) {
    currentKey = 1;
  } else if (remaining2 > 0 && remaining1 <= 0) {
    currentKey = 2;
  }
  
  // 使用当前密钥查询
  const apiKey = currentKey === 1 ? TIKU_API_KEY_1 : TIKU_API_KEY_2;
  let result = await callTikuSingleKey(questionData, currentKey, apiKey);
  
  // 如果当前密钥失败（次数不足或其他错误），尝试切换到另一个密钥
  if (!result || result.code !== 200 || 
      (result.msg && (result.msg.includes('次数') || result.msg.includes('余额') || result.msg.includes('不足')))) {
    const newKey = currentKey === 1 ? 2 : 1;
    const newApiKey = newKey === 1 ? TIKU_API_KEY_1 : TIKU_API_KEY_2;
    
    console.log(`[WARN] 密钥${currentKey}失败，切换到密钥${newKey}...`);
    result = await callTikuSingleKey(questionData, newKey, newApiKey);
    
    // 如果切换后成功，更新数据库记录
    if (result && result.code === 200) {
      await db.prepare(
        "UPDATE global_stats SET current_tiku_key = ? WHERE id = 1"
      ).run(newKey);
      console.log(`[OK] 已更新当前密钥为: ${newKey}`);
    }
  }
  
  return result;
}

async function callTikuSingleKey(questionData, keyNum, apiKey) {
  const url = `${TIKU_API_URL}?s=isMobile&v=3.8.3`;
  const body = JSON.stringify({
    question: questionData.question,
    options: questionData.options,
    type: questionData.type,
    questionData: questionData.questionData || '',
    workType: questionData.workType || '',
    id: questionData.id || '',
    key: apiKey
  });

  console.log(`[CALL] 题库海查询中... (使用密钥${keyNum})`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'referer': 'https://mooc1.chaoxing.com/',
        'u': '',
        't': Math.floor(Date.now() / 1000).toString()
      },
      body: body,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const jsonResponse = await response.json();
    console.log(`[INFO] 题库海响应: code=${jsonResponse.code}, msg=${jsonResponse.msg || '无'}`);
    
    if (jsonResponse.code === 200 && jsonResponse.data && jsonResponse.data.answer) {
      console.log(`[OK] 题库海找到答案: ${JSON.stringify(jsonResponse.data.answer)}`);
      console.log(`[STAT] 剩余次数: ${jsonResponse.data.num || '未知'}`);
    }
    
    return jsonResponse;
  } catch (e) {
    if (e.name === 'AbortError') {
      const err = new Error('请求超时（15秒）');
      err.code = 'TIMEOUT';
      throw err;
    }
    throw e;
  }
}

// ==================== 主逻辑 ====================

/**
 * 重查单个题目（供 routes.js 调用）
 * @param {string} questionHash - 题目哈希
 */
async function recheckSingleQuestion(questionHash) {
  try {
    // 查询该题目的详细信息
    const row = await db.prepare(
      `SELECT id, question_hash, question, options, type, answer, source, created_at
       FROM answer_cache 
       WHERE question_hash = ? AND is_correct = 0`
    ).get(questionHash);

    if (!row) {
      console.log(`[OK] 题目 ${questionHash.substring(0, 8)} 未被标记为错误，跳过重查`);
      return { status: 'skipped', reason: '题目未被标记为错误' };
    }

    console.log(`\n========= 触发重查题目 ${questionHash.substring(0, 8)} =========`);
    return await recheckQuestion(row);
  } catch (e) {
    console.error(`重查题目失败 ${questionHash.substring(0, 8)}:`, e.message);
    return { status: 'failed', reason: e.message };
  }
}

/**
 * 查询数据库中 is_correct=0 的题目
 */
async function getWrongAnswers() {
  try {
    const rows = await db.prepare(
      `SELECT id, question_hash, question, options, type, answer, source, created_at
       FROM answer_cache 
       WHERE is_correct = 0
       ORDER BY created_at DESC`
    ).all();

    console.log(`[OK] 查询到 ${rows.length} 个标记为错误的题目`);
    return rows;
  } catch (e) {
    console.error('[X] 查询数据库失败:', e.message);
    return [];
  }
}

/**
 * 重查单个题目
 */
async function recheckQuestion(row) {
  console.log(`\n========= 处理题目 ${row.question_hash.substring(0, 8)} =========`);
  console.log(`题目: ${row.question}`);
  console.log(`题型: ${getTypeDescription(row.type)} (${row.type})`);
  console.log(`原答案: ${row.answer}`);
  console.log(`原来源: ${row.source}`);

  try {
    // 解析选项
    let options = null;
    if (row.options) {
      try {
        options = JSON.parse(row.options);
      } catch (e) {
        options = row.options;
      }
    }

    // 构建查询数据
    const questionData = {
      question: row.question,
      options: options,
      type: String(row.type)
    };

    // 第一步：调用题库海
    console.log('\n【第一步】调用题库海 API...');
    await incrementTikuCalls();
    const tikuResult = await callTikuApi(questionData);

    // 检查题库海结果
    if (tikuResult.code === 200 && tikuResult.data && tikuResult.data.answer && 
        (!Array.isArray(tikuResult.data.answer) || tikuResult.data.answer.length > 0)) {
      
      await incrementTotalQueries('tiku');
      
      // 题库海有答案
      const newAnswer = tikuResult.data.answer;
      const newSource = 'tiku';

      console.log('\n[SEARCH] 正在校验答案...');
      const validation = validateAndCleanAnswer(row.type, newAnswer, options);

      if (validation.valid) {
        console.log('[OK] 校验通过');
        await updateDatabase(row.question_hash, row.question, options, row.type, validation.answers, newSource);
        return { status: 'success', source: 'tiku', answer: newAnswer };
      } else {
        console.log(`[X] 校验失败: ${validation.reason}，继续调用 AI 深度思考...`);
        // 校验失败，继续调用 AI
      }
    }

    // 第二步：题库海无答案或校验失败，调用 AI 深度思考
    console.log('\n【第二步】调用 AI 深度思考...');
    await incrementAiCalls();
    const aiResult = await fetchDeepSeekThinking(questionData);

    if (aiResult.code === 200 && aiResult.data && aiResult.data.answer) {
      await incrementTotalQueries('ai');
      
      const newAnswer = aiResult.data.answer;
      const newSource = aiResult.data.source || getDisplayName('deepseek-v4-pro');

      console.log(`[OK] AI 返回答案: ${JSON.stringify(newAnswer)}`);
      console.log('[SEARCH] 正在校验答案...');
      const validation = validateAndCleanAnswer(row.type, newAnswer, options);

      if (validation.valid) {
        console.log('[OK] 校验通过');
        await updateDatabase(row.question_hash, row.question, options, row.type, validation.answers, newSource);
        return { status: 'success', source: 'ai', answer: newAnswer };
      } else {
        console.log(`[X] 校验失败: ${validation.reason}，从数据库删除该题目`);
        await deleteRecord(row.question_hash);
        return { status: 'invalid', reason: validation.reason };
      }
    } else {
      console.log(`[X] AI 查询失败: ${aiResult.msg || '无答案'}`);
      return { status: 'failed', reason: '题库海和AI均无答案' };
    }

  } catch (e) {
    console.error(`[X] 处理异常:`, e.message);
    return { status: 'failed', reason: e.message };
  }
}

/**
 * 删除数据库记录
 */
async function deleteRecord(questionHash) {
  await db.prepare(
    `DELETE FROM answer_cache WHERE question_hash = ?`
  ).run(questionHash);

  console.log(`[OK] 已从数据库删除: ${questionHash.substring(0, 8)}`);
}

/**
 * 更新数据库（通过 saveAnswerToCache，内置校验）
 */
async function updateDatabase(questionHash, question, options, type, answer, source) {
  // 传 null 显式将 is_correct 从 0(错误) 重置为 NULL(未验证)
  saveAnswerToCacheAsync(questionHash, question, options, type, answer, source, null);

  console.log(`[OK] 数据库已更新: 答案="${JSON.stringify(answer)}", 来源="${source}", is_correct=NULL`);
  stats.updated++;
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 打印统计信息
 */
function printStats() {
  console.log('\n[STAT] 统计信息:');
  console.log(`  总题目数: ${stats.total}`);
  console.log(`  已处理: ${stats.processed}`);
  console.log(`  [OK] 题库海成功: ${stats.tikuSuccess}`);
  console.log(`  [OK] AI 成功: ${stats.aiSuccess}`);
  console.log(`  [X] 查询失败: ${stats.failed}`);
  console.log(`  [WARN] 校验失败: ${stats.invalid}`);
  console.log(`  [SAVE] 数据库更新: ${stats.updated}`);
  console.log(`  成功率: ${stats.total > 0 ? ((stats.tikuSuccess + stats.aiSuccess) / stats.total * 100).toFixed(2) : 0}%`);
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('  重查错误答案脚本（题库海 + AI fallback）');
  console.log('========================================');
  console.log(`启动时间: ${new Date().toLocaleString()}`);
  console.log(`API Key 1: ${TIKU_API_KEY_1.substring(0, 10)}...`);
  console.log(`API Key 2: ${TIKU_API_KEY_2.substring(0, 10)}...`);
  console.log('');

  // 1. 查询所有错误题目
  const wrongAnswers = await getWrongAnswers();

  if (wrongAnswers.length === 0) {
    console.log('[OK] 没有需要重查的题目');
    return;
  }

  stats.total = wrongAnswers.length;
  console.log(`\n开始处理 ${stats.total} 个题目...`);
  console.log('');

  // 2. 逐个处理
  for (let i = 0; i < wrongAnswers.length; i++) {
    const row = wrongAnswers[i];
    stats.processed++;

    console.log(`\n[进度 ${stats.processed}/${stats.total}]`);

    // 重查题目
    const result = await recheckQuestion(row);

    // 更新统计
    switch (result.status) {
      case 'success':
        if (result.source === 'tiku') {
          stats.tikuSuccess++;
        } else if (result.source === 'ai') {
          stats.aiSuccess++;
        }
        break;
      case 'failed':
        stats.failed++;
        break;
      case 'invalid':
        stats.invalid++;
        break;
    }

    // 延迟，避免请求过快
    if (i < wrongAnswers.length - 1) {
      await delay(1000);
    }

    // 每10个题目打印一次统计
    if (stats.processed % 10 === 0) {
      printStats();
    }
  }

  // 3. 打印最终统计
  console.log('\n========================================');
  console.log('  处理完成');
  console.log('========================================');
  printStats();
  console.log(`结束时间: ${new Date().toLocaleString()}`);
}

// ==================== 查重任务 ====================

/**
 * 查重：找出 question 相同但 question_hash 不同的重复题目，保留最新的一条，删除旧的
 * 返回 { duplicates: [{kept, removed}], totalDuplicates, totalToRemove }
 */
async function findDuplicates() {
  // 查找 question 相同但有多条记录的分组
  const groups = await db.prepare(
    `SELECT question, COUNT(*) as cnt FROM answer_cache GROUP BY question HAVING cnt > 1`
  ).all();

  const duplicates = [];
  let totalToRemove = 0;

  for (const group of groups) {
    // 获取该 question 下所有记录，按 created_at 降序（最新的排前面）
    const rows = await db.prepare(
      `SELECT id, question_hash, question, answer, source, is_correct, created_at FROM answer_cache WHERE question = ? ORDER BY created_at DESC`
    ).all(group.question);

    if (rows.length > 1) {
      // 保留第一条（最新），其余标记为待删除
      const kept = rows[0];
      const removed = rows.slice(1);
      totalToRemove += removed.length;
      duplicates.push({ kept, removed });
    }
  }

  return { duplicates, totalGroups: duplicates.length, totalToRemove };
}

/**
 * 删除指定的重复记录
 */
async function removeDuplicateRecords(ids) {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  const result = await db.prepare(
    `DELETE FROM answer_cache WHERE id IN (${placeholders})`
  ).run(...ids);
  return result.changes || ids.length;
}

// 导出函数供 routes.js 调用
module.exports = {
  recheckSingleQuestion,
  findDuplicates,
  removeDuplicateRecords
};

// 如果是直接运行脚本，执行主函数
if (require.main === module) {
  main().catch(e => {
    console.error('\n[X] 脚本执行失败:', e.message);
    console.error(e.stack);
    process.exit(1);
  }).finally(() => {
    // 关闭数据库连接
    try { pool?.end?.(); } catch(e) { console.warn('关闭数据库连接失败:', e.message); }
    console.log('\n[OK] 数据库连接已关闭');
  });
}
