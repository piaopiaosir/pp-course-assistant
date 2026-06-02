/**
 * hsfaka.cn 支付代理服务
 * 使用 Puppeteer 绕过 WAF，自动化购买流程
 */

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// 使用 stealth 插件绕过 WAF/反自动化检测
puppeteer.use(StealthPlugin());

// ==================== MySQL 配置 ====================
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '13306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'PIAOPIAONB',
  database: process.env.DB_NAME || 'tiku',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  charset: 'utf8mb4'
};

let dbPool = null;

async function initDb() {
  try {
    dbPool = mysql.createPool(DB_CONFIG);
    // 测试连接
    const conn = await dbPool.getConnection();
    log(`✓ MySQL 连接成功: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
    conn.release();
  } catch (err) {
    log(`✗ MySQL 连接失败: ${err.message}，统计数据将不可用`);
    dbPool = null;
  }
}

async function queryStats() {
  if (!dbPool) return null;
  try {
    const [rows] = await dbPool.query('SELECT total_queries FROM global_stats WHERE id = 1');
    const globalStats = rows[0] || {};

    const nowUtc8 = new Date(Date.now() + 8 * 3600000);
    const today0Utc8 = new Date(nowUtc8);
    today0Utc8.setUTCHours(0, 0, 0, 0);
    const todayStart = Math.floor((today0Utc8.getTime() - 8 * 3600000) / 1000);

    const [todayRows] = await dbPool.query('SELECT COUNT(*) as count FROM query_logs WHERE created_at >= ?', [todayStart]);
    const todayQueries = todayRows[0]?.count || 0;

    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
    const [hourRows] = await dbPool.query('SELECT COUNT(*) as count FROM query_logs WHERE created_at > ?', [oneHourAgo]);
    const hourlyRate = hourRows[0]?.count || 0;

    return {
      totalQueries: globalStats.total_queries || 0,
      todayQueries,
      hourlyRate
    };
  } catch (err) {
    log(`[统计查询失败] ${err.message}`);
    return null;
  }
}

const PORT = 3001;

// 支付模块开关（关闭后不启动浏览器，支付相关接口返回503）
const PAY_ENABLED = false;

// 商品 → 独立链接映射（直达商品购买页，无需经过店铺列表）
const ITEM_URLS = {
  '2500次': 'https://hsfaka.cn/item/f8pbqy',
  '1288次': 'https://hsfaka.cn/item/sclxnb',
  '500次':  'https://hsfaka.cn/item/ghb4q8',
};

// 代理 IP 配置（通过国内服务器中转隧道代理，避免海外IP被拒）
const PROXY_HOST = '122.152.249.109';
const PROXY_PORT = 10000;  // 国内中转代理端口
const PROXY_USER = '';
const PROXY_PASS = '';
const USE_PROXY = true;

// ==================== 支付结果存储 ====================
// key: taskId, value: { status, cardKeys, error }
const paymentTasks = new Map();

// ==================== 订单任务存储（异步购买流程） ====================
// key: taskId, value: { status, productName, email, paymentUrl, taskId, cardKeys, error, amount, createdAt }
const orderTasks = new Map();

// ==================== 验证码页面引用（用户提交验证码时需要继续操作页面） ====================
// key: taskId, value: { page, productName, email, paymentMethod, flow }
const captchaPages = new Map();

// ==================== SSE 推送（替代前端轮询） ====================
const sseClients = new Map(); // taskId → Set<res>

function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function notifySSE(taskId) {
  const clients = sseClients.get(taskId);
  if (!clients) return;
  const data = orderTasks.get(taskId) || paymentTasks.get(taskId);
  if (!data) return;
  for (const res of clients) {
    sseWrite(res, 'update', data);
  }
}

// 包装 Map.set，自动推送 SSE
function watchMap(map, name) {
  const original = map.set.bind(map);
  map.set = function(key, value) {
    const result = original(key, value);
    notifySSE(key);
    return result;
  };
}
watchMap(orderTasks);
watchMap(paymentTasks);

function generateTaskId() {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ==================== 浏览器管理 ====================

class BrowserPool {
  constructor() {
    this.browser = null;
    this.ready = false;
    this._initPromise = null;
  }

  async init() {
    if (this._initPromise) return this._initPromise;
    
    this._initPromise = this._doInit();
    return this._initPromise;
  }

  async _doInit() {
    log(`启动浏览器... (代理: ${USE_PROXY ? `${PROXY_HOST}:${PROXY_PORT}` : '直连'})`);
    
    const launchOpts = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        // 禁用 Chrome 自带的网络请求，节省代理流量
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-features=Translate,InterestFeedContentSuggestions,OptimizationHints',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain',
        USE_PROXY ? `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}` : '',
      ].filter(Boolean),
    };

    // 自动检测 Chrome/Chromium 路径（跨平台：Windows + Linux VPS）
    const isWin = process.platform === 'win32';
    const chromePaths = [
      // Windows
      ...(isWin ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      ] : []),
      // Linux VPS 常见路径
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      // 环境变量
      process.env.CHROME_PATH,
      process.env.PUPPETEER_EXECUTABLE_PATH,
    ].filter(Boolean);

    for (const cp of chromePaths) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(cp)) {
          launchOpts.executablePath = cp;
          log(`使用浏览器: ${cp}`);
          break;
        }
      } catch {}
    }

    // 如果还是找不到，让 Puppeteer 自动下载 Chromium
    if (!launchOpts.executablePath) {
      log('未找到系统浏览器，使用 Puppeteer 内置 Chromium');
    }

    // stealth 插件已处理大部分反检测，但仍需关闭 automation 标志
    this.browser = await puppeteer.launch(launchOpts);
    this.ready = true;
    log('浏览器已就绪');
  }

  /**
   * 创建新的购买会话页面
   */
  async createSessionPage() {
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });
    
    // stealth 插件已自动注入反检测脚本（webdriver/plugins/languages/platform 等）
    // 无需手动 evaluateOnNewDocument
    
    // 代理认证
    if (USE_PROXY) {
      await page.authenticate({ username: PROXY_USER, password: PROXY_PASS });
    }

    // 设置 User-Agent（跟随操作系统）
    const ua = process.platform === 'win32'
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await page.setUserAgent(ua);

    // 关闭 HTTP keep-alive，避免代理隧道连接复用导致无法切换 IP
    await page.setExtraHTTPHeaders({ Connection: 'close' });
    
    // 拦截不必要的资源加速加载，同时拦截第三方域名节省代理流量
    await page.setRequestInterception(true);
    const blockedHosts = [
      'googleapis.com', 'google.com', 'gstatic.com', 'gvt2.com',
      'google-analytics.com', 'googletagmanager.com',
      'baidu.com', 'bdstatic.com', 'bilibili.com',
      'facebook.com', 'fbcdn.net',
      'twitter.com', 'twimg.com',
    ];
    page.on('request', (req) => {
      const type = req.resourceType();
      const url = req.url();
      const host = new URL(url).hostname;

      // 放行支付相关域名的图片（二维码渲染需要！）
      const payDomains = ['pay.5v1.net', 'hsfaka.cn', 'cunchu.hsfaka.cn'];
      if (type === 'image' && payDomains.some(d => host.includes(d))) {
        req.continue();
        return;
      }

      // 拦截图片/字体/媒体（支付域名除外）
      if (['image', 'font', 'media'].includes(type)) {
        req.abort();
        return;
      }
      // 拦截第三方无关域名（节省代理流量）
      if (blockedHosts.some(h => host.includes(h))) {
        req.abort();
        return;
      }
      req.continue();
    });

    return page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.ready = false;
    }
  }
}

// ==================== 购买流程 ====================

class PurchaseFlow {
  constructor(browserPool) {
    this.pool = browserPool;
  }

  /**
   * 完整购买流程：直达商品页 → 点击购买 → 填写信息 → 提交 → 获取支付URL
   * 支持最多 3 次重试
   */
  async execute(productName, email, paymentMethod = 'alipay', externalTaskId = null) {
    const MAX_RETRIES = 3;
    let lastError = null;

    const itemUrl = ITEM_URLS[productName];
    if (!itemUrl) {
      throw new Error(`未知商品: ${productName}，可用商品: ${Object.keys(ITEM_URLS).join(', ')}`);
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const page = await this.pool.createSessionPage();
      
      try {
        if (attempt > 1) {
          log(`[重试] 第 ${attempt}/${MAX_RETRIES} 次尝试...`);
        }

        // ====== 第1步：直达商品购买页 ======
        log(`[流程] 打开商品页面: ${itemUrl}`);
        await page.goto(itemUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });

        // 等待 SPA 渲染完成：联系方式输入框出现
        try {
          await page.waitForSelector('input[type="text"], input:not([type])', { timeout: 8000 });
          log(`[流程] 商品页面已加载（输入框已出现）: ${productName}`);
        } catch {
          log(`[流程] ⚠️ 未等到输入框，继续尝试: ${productName}`);
        }
        await sleep(200);

        

        // ====== 第2步：在商品页面上填写联系方式和选择支付方式 ======
        // hsfaka 的联系方式输入框和支付方式选择都在商品页面本体（不是弹窗里）
        log(`[流程] 在商品页面上填写联系方式: ${email}`);
        await this.fillContactInfo(page, email);
        await this.selectPaymentMethod(page, paymentMethod);
        await sleep(200);

        // ====== 提取商品页面金额 ======
        const amount = await page.evaluate(() => {
          const el = document.querySelector('.goods-price');
          if (!el) return null;
          return el.textContent.trim().replace(/\s+/g, '');
        });
        if (amount) {
          log(`[流程] 商品金额: ${amount}`);
        }

        // ====== 第3步：点击购买按钮 ======
        const clicked = await this.clickBuyButton(page);
        if (!clicked) {
          throw new Error(`无法点击购买按钮 (${productName})`);
        }

        log(`[流程] 已点击购买按钮: ${productName}`);
        await sleep(1000);

        // ====== 第3.5步：检测验证码弹窗（WAF 反自动化触发） ======
        const hasCaptcha = await page.evaluate(() => {
          const modals = document.querySelectorAll('.arco-modal');
          for (const m of modals) {
            const title = m.querySelector('.arco-modal-title');
            if (title && (title.textContent.includes('验证码') || title.textContent.includes('captcha'))) {
              return true;
            }
          }
          return false;
        });

        if (hasCaptcha) {
          log(`[流程] 检测到验证码弹窗，尝试自动处理...`);
          const captchaHandled = await this.handleCaptcha(page, externalTaskId);
          if (!captchaHandled) {
            throw new Error(`hsfaka 触发了验证码拦截，请稍后重试 (${productName})`);
          }
          await sleep(800);
        }

        // ====== 第3.8步：检测"提示"弹窗（支付跳转提示） ======
        // 点击"立即购买"后，hsfaka 可能弹出"如页面未自动跳转支付页，请点击下方按钮跳转！"的提示
        const hasRedirectModal = await page.evaluate(() => {
          const modals = document.querySelectorAll('.arco-modal');
          for (const m of modals) {
            if (m.offsetParent === null) continue;
            const title = m.querySelector('.arco-modal-title');
            const body = m.querySelector('.arco-modal-body');
            const titleText = title ? title.textContent.trim() : '';
            const bodyText = body ? body.textContent.trim() : '';
            if (titleText.includes('提示') || bodyText.includes('跳转支付') || bodyText.includes('跳转')) {
              return true;
            }
          }
          return false;
        });

        if (hasRedirectModal) {
          log('[流程] 检测到支付跳转提示弹窗，点击"立即跳转"...');
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes('立即跳转'));
            if (btn) btn.click();
          });
          await sleep(800);
        }

        // ====== 第4步：提交订单 ======
        const orderResult = await this.submitOrder(page, paymentMethod);
        
        log(`[流程] 订单已提交，支付URL: ${typeof orderResult === 'string' ? orderResult : orderResult.url}`);
        
        const paymentUrl = typeof orderResult === 'string' ? orderResult : orderResult.url;
        const tradeNo = typeof orderResult === 'object' ? orderResult.tradeNo : null;
        const directCards = typeof orderResult === 'object' ? orderResult.cardKeys : null;
        const paymentPage = typeof orderResult === 'object' ? orderResult.paymentPage : null;

        if (directCards && directCards.length > 0) {
          log(`[流程] ✅ 直接获取到卡密，无需轮询`);
          // 清理支付页面
          if (paymentPage) await paymentPage.close().catch(() => {});
          return { success: true, paymentUrl: 'direct', cardKeys: directCards, productName, email };
        }

        const taskId = externalTaskId || generateTaskId();
        
        // 优先使用页面跳转监控（守着支付页面等跳转到卡密页）
        if (paymentPage) {
          log(`[监控] 启动页面跳转监控，等待支付完成...`);
          this.startPageMonitor(taskId, paymentPage, paymentUrl, productName);
        } else if (tradeNo) {
          log(`[监控] 无页面引用，使用 API 轮询，trade_no: ${tradeNo}`);
          this.startApiPollMonitor(taskId, tradeNo, paymentUrl, productName);
        } else {
          log(`[监控] 未提取到 trade_no 和页面引用，无法自动获取卡密`);
          paymentTasks.set(taskId, { status: 'pending_no_trade', paymentUrl });
        }

        return { success: true, paymentUrl, taskId, productName, email, amount };

      } catch (err) {
        lastError = err;
        log(`[重试] 第 ${attempt}/${MAX_RETRIES} 次失败: ${err.message}`);
        await page.close().catch(() => {});
        if (attempt < MAX_RETRIES) {
          await sleep(2000 * attempt);
        }
      }
    }

    log(`[错误] 已重试 ${MAX_RETRIES} 次，全部失败: ${lastError.message}`);
    throw lastError;
  }



  /**
   * 点击商品页面的"立即购买"/"购买"按钮
   */
  async clickBuyButton(page) {
    log(`[购买] 寻找购买按钮...`);
    
    const result = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const buyKeywords = ['立即购买', '购买', '下单', 'buy', 'purchase'];
      
      for (const btn of buttons) {
        if (!btn.offsetParent) continue; // 跳过隐藏按钮
        const text = btn.textContent.trim().toLowerCase();
        for (const kw of buyKeywords) {
          if (text.includes(kw.toLowerCase()) && !btn.disabled) {
            // 模拟真实点击
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const opts = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy };
            
            btn.dispatchEvent(new MouseEvent('mousedown', opts));
            btn.dispatchEvent(new MouseEvent('mouseup', opts));
            btn.dispatchEvent(new MouseEvent('click', opts));
            
            return { found: true, text: btn.textContent.trim(), tag: 'button' };
          }
        }
      }
      
      // 也尝试找链接形式的购买
      const links = document.querySelectorAll('a');
      for (const link of links) {
        const text = link.textContent.trim().toLowerCase();
        for (const kw of buyKeywords) {
          if (text.includes(kw.toLowerCase())) {
            link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return { found: true, text: link.textContent.trim(), tag: 'a' };
          }
        }
      }
      
      return { found: false };
    });
    
    if (result.found) {
      log(`[购买] ✅ 点击了购买按钮: "${result.text}" (${result.tag})`);
      return true;
    }
    
    // 兜底：Puppeteer 直接 click
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        const isVisible = await page.evaluate(el => el.offsetParent !== null, btn);
        if (isVisible && /购买|下单|buy|purchase/i.test(text)) {
          await btn.click();
          log(`[购买] 兜底 click: "${text}"`);
          return true;
        }
      } catch {}
    }
    
    log('[购买] 未找到购买按钮');
    return false;
  }

  /**
   * 处理验证码弹窗
   * 策略1: 截图推送给前端让用户手动输入验证码
   * 策略2: 关闭弹窗重新点击购买（WAF 可能只拦截首次）
   */
  async handleCaptcha(page, taskId) {
    log('[验证码] 检测到验证码弹窗');

    // 刷新验证码图片确保加载
    try {
      await page.evaluate(() => {
        const captchaImg = document.querySelector('.arco-modal img');
        if (captchaImg) captchaImg.click();
      });
      await sleep(800);
      log('[验证码] 已刷新验证码图片');
    } catch (e) {
      log(`[验证码] 刷新验证码失败: ${e.message}`);
    }

    // 截取验证码弹窗截图推送给前端
    let captchaScreenshot = null;
    try {
      const modalBox = await page.evaluate(() => {
        const modal = document.querySelector('.arco-modal');
        if (!modal) return null;
        const rect = modal.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      });
      if (modalBox) {
        const screenshot = await page.screenshot({
          clip: modalBox,
          type: 'png',
          encoding: 'base64',
        });
        captchaScreenshot = `data:image/png;base64,${screenshot}`;
        log('[验证码] ✅ 弹窗截图成功');
      }
    } catch (e) {
      log(`[验证码] 弹窗截图失败: ${e.message}`);
    }

    // 如果有 taskId，保存页面引用并推送验证码给前端
    if (taskId && captchaScreenshot) {
      // 保存页面引用以便用户提交验证码时继续操作
      captchaPages.set(taskId, {
        page,
        productName: orderTasks.get(taskId)?.productName,
        flow: this,
      });
      log('[验证码] 已保存页面引用');

      const order = orderTasks.get(taskId);
      if (order) {
        orderTasks.set(taskId, {
          ...order,
          status: 'captcha_required',
          captchaImage: captchaScreenshot,
        });
        log('[验证码] 已推送验证码到前端，等待用户输入...');

        // 等待用户输入验证码（最长5分钟）
        const MAX_WAIT = 300000;
        const startTime = Date.now();
        while (Date.now() - startTime < MAX_WAIT) {
          const current = orderTasks.get(taskId);
          if (current?.captchaAnswer) {
            log(`[验证码] 用户已输入验证码: ${current.captchaAnswer}`);

            // 在 Puppeteer 页面中输入验证码并点击确定
            const filled = await page.evaluate((answer) => {
              const modal = document.querySelector('.arco-modal');
              if (!modal) return false;
              const input = modal.querySelector('input[type="text"], input:not([type])');
              if (!input) return false;
              input.focus();
              input.value = '';
              input.value = answer;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              // 点击确定按钮
              const confirmBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('确定'));
              if (confirmBtn) {
                confirmBtn.click();
                return true;
              }
              return false;
            }, current.captchaAnswer);

            if (filled) {
              log('[验证码] ✅ 验证码已提交');
              await sleep(1000);

              // 清除验证码数据
              orderTasks.set(taskId, { ...current, status: 'processing', captchaAnswer: null, captchaImage: null });
              captchaPages.delete(taskId);

              // 检查验证码是否通过（是否出现了订单确认弹窗或又弹出了验证码）
              const afterCaptcha = await page.evaluate(() => {
                const modals = document.querySelectorAll('.arco-modal');
                for (const m of modals) {
                  const title = m.querySelector('.arco-modal-title');
                  if (title && title.textContent.includes('验证码')) return 'captcha_again';
                }
                // 检查订单确认弹窗
                const confirmModal = document.querySelector('.arco-modal.confirm_order, .arco-modal-wrapper');
                if (confirmModal && confirmModal.offsetParent !== null) return 'order_modal';
                return 'no_modal';
              });

              if (afterCaptcha === 'order_modal') {
                log('[验证码] ✅ 验证码通过，订单确认弹窗已出现');
                return true;
              } else if (afterCaptcha === 'captcha_again') {
                log('[验证码] 验证码未通过，重新截图...');
                return await this.handleCaptcha(page, taskId); // 递归处理
              } else {
                log('[验证码] 验证码通过但弹窗未出现，继续流程...');
                return true; // 让后续流程处理
              }
            } else {
              log('[验证码] 填写验证码失败');
            }
            break;
          }
          await sleep(2000);
        }

        // 超时
        captchaPages.delete(taskId);
        log('[验证码] ⏰ 用户输入超时');
        return false;
      }
    }

    return false;
  }

  /**
   * 在弹窗中填写联系方式（邮箱）
   */
  async fillContactInfo(page, email) {
    // 确保联系方式输入框已渲染
    try {
      await page.waitForSelector('input[type="text"], input:not([type])', { timeout: 5000 });
    } catch {}

    // 使用 JS evaluate 智能查找联系方式输入框（商品页面本体或弹窗内均可）
    const inputInfo = await page.evaluate(() => {
      // 优先在弹窗内查找，找不到则在全页面查找
      const modal = document.querySelector('.arco-modal.confirm_order, .confirm_order, .arco-modal-wrapper');
      const container = modal || document;
      
      // 排除关键词：搜索、密码、验证码等非联系方式的输入框
      const skipKeywords = ['搜索', 'search', '密码', 'password', '验证码', 'code', 'captcha'];
      const contactKeywords = ['邮箱', 'email', '联系', 'QQ', '手机', 'phone', '暗号', '备注'];
      
      const inputs = Array.from(container.querySelectorAll('input[type="text"], input:not([type])'));
      
      for (const input of inputs) {
        if (input.offsetParent === null) continue; // 跳过隐藏
        const placeholder = (input.placeholder || '').toLowerCase();
        const name = (input.name || '').toLowerCase();
        const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
        const parentText = (input.closest('.arco-form-item, .arco-form, label, div')?.textContent || '').toLowerCase();
        const combined = placeholder + name + ariaLabel + parentText;
        
        // 排除搜索等无关输入框
        const isSkip = skipKeywords.some(kw => combined.includes(kw.toLowerCase()));
        if (isSkip) continue;
        
        // 优先匹配联系方式关键词
        const isContact = contactKeywords.some(kw => combined.includes(kw.toLowerCase()));
        if (isContact) {
          return { found: true, placeholder: input.placeholder, name: input.name, selector: 'container', index: inputs.indexOf(input) };
        }
      }
      
      // 兜底：返回第一个非搜索的可见 input
      for (const input of inputs) {
        if (input.offsetParent === null) continue;
        const placeholder = (input.placeholder || '').toLowerCase();
        const isSkip = skipKeywords.some(kw => placeholder.includes(kw.toLowerCase()));
        if (!isSkip) {
          return { found: true, placeholder: input.placeholder, name: input.name, selector: 'container', index: inputs.indexOf(input), fallback: true };
        }
      }
      
      // 如果弹窗内没找到，且当前是在弹窗内搜索，则回退到全页面搜索
      if (modal) {
        const allInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
        for (const input of allInputs) {
          if (input.offsetParent === null) continue;
          const placeholder = (input.placeholder || '').toLowerCase();
          const parentText = (input.closest('.arco-form-item, .arco-form, label, div')?.textContent || '').toLowerCase();
          const combined = placeholder + parentText;
          const isSkip = skipKeywords.some(kw => combined.includes(kw.toLowerCase()));
          if (isSkip) continue;
          const isContact = contactKeywords.some(kw => combined.includes(kw.toLowerCase()));
          if (isContact) {
            return { found: true, placeholder: input.placeholder, name: input.name, selector: 'document', index: allInputs.indexOf(input) };
          }
        }
      }
      
      return { found: false, totalInputs: inputs.length };
    });

    if (inputInfo.found) {
      log(`[表单] ${inputInfo.fallback ? '兜底' : '精确'}匹配: placeholder="${inputInfo.placeholder}", name="${inputInfo.name}", 搜索范围=${inputInfo.selector}`);
      
      // 用 JS evaluate 直接填写
      await page.evaluate(({ selector, index, email }) => {
        const container = selector === 'document' ? document : (document.querySelector('.arco-modal.confirm_order, .confirm_order, .arco-modal-wrapper') || document);
        const inputs = Array.from(container.querySelectorAll('input[type="text"], input:not([type])'));
        const input = inputs[index];
        if (input) {
          input.focus();
          input.value = '';
          input.value = email;
          // 触发 Vue 的 input 事件以同步 v-model
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { selector: inputInfo.selector, index: inputInfo.index, email });
      
      log(`[表单] 已填写联系方式: ${email}`);
      return;
    }

    log(`[表单] 未找到输入框 (共${inputInfo.totalInputs}个input)，可能不需要填写联系方式`);
  }

  /**
   * 选择支付方式 — hsfaka 商品页面 .pay_type 容器内的 label.arco-radio
   * 
   * 支付方式值映射：26=支付宝H5, 27=QQ支付, 25=微信支付
   * 选中状态：label 有 arco-radio-checked class，div 有 pay_type_leng_xz class
   */
  async selectPaymentMethod(page, method) {
    const keywordMap = {
      'alipay': ['支付宝'],
      'wechat': ['微信'],
      'qq': ['QQ'],
    };
    const keywords = keywordMap[method] || keywordMap['alipay'];

    log(`[支付] 开始选择支付方式: ${method} (关键词: ${keywords.join(',')})`);

    // 等待价格加载完成（支付渠道在 .nowPrice 出现后才渲染）
    try {
      await page.waitForSelector('.nowPrice', { timeout: 8000 });
      log('[支付] 价格已加载，支付渠道应该已显示');
    } catch {
      log('[支付] 未等到 .nowPrice，可能页面结构变化');
    }

    // 等待 radio-group 容器出现
    try {
      await page.waitForSelector('.arco-radio-group', { timeout: 5000 });
    } catch {
      log('[支付] 未找到 radio-group，跳过支付方式选择');
      return;
    }

    // 1) 先在页面中查找目标 label，获取其在父容器中的索引
    const targetInfo = await page.evaluate((keywords) => {
      const container = document.querySelector('.arco-radio-group');
      if (!container) return { success: false, reason: 'no radio-group' };

      const labels = container.querySelectorAll('label.arco-radio');
      for (let idx = 0; idx < labels.length; idx++) {
        const label = labels[idx];
        const payTypeEl = label.querySelector('.pay_type_leng');
        if (!payTypeEl) continue;
        const text = payTypeEl.textContent.trim();
        const input = label.querySelector('input[type="radio"]');
        const value = input ? input.value : '';
        const alreadyChecked = label.classList.contains('arco-radio-checked');
        for (const kw of keywords) {
          if (text.includes(kw)) {
            return { success: true, text, value, idx, alreadyChecked };
          }
        }
      }
      return { success: false, reason: 'no match', keywords };
    }, keywords);

    if (!targetInfo.success) {
      log(`[支付] 未能找到 ${method} 支付方式（查找: ${targetInfo.keywords?.join(',') || '未知'}），使用默认`);
      return;
    }

    // 2) 如果已经选中，无需操作
    if (targetInfo.alreadyChecked) {
      log(`[支付] ${method} 已是选中状态 (idx=${targetInfo.idx}, value=${targetInfo.value})，无需切换`);
      return;
    }

    log(`[支付] 当前选中不是 ${method}，准备切换到: idx=${targetInfo.idx}, value=${targetInfo.value} (${targetInfo.text})`);

    // 3) 点击 label 元素（不是 input！Arco Design 的 Radio 是整行 label 可点击）
    //    page.click() 会触发真实的 mouse 事件，Vue 组件可以正常响应
    try {
      // 直接点击 label 中的 .pay_type_leng（用户可见的选项区域）
      const payTypeElements = await page.$$('.arco-radio-group label.arco-radio .pay_type_leng');
      if (payTypeElements[targetInfo.idx]) {
        await payTypeElements[targetInfo.idx].click();
        await sleep(400); // 等 Vue 响应
        log(`[支付] ✅ 已点击 ${method} 选项 (idx=${targetInfo.idx})`);
      } else {
        log(`[支付] ❌ 找不到 idx=${targetInfo.idx} 的元素`);
        return;
      }
    } catch (err) {
      log(`[支付] ❌ 点击选项失败: ${err.message}`);
      return;
    }

    // 4) 验证切换是否真正生效
    const verified = await page.evaluate(({ idx }) => {
      const container = document.querySelector('.arco-radio-group');
      if (!container) return false;
      const labels = container.querySelectorAll('label.arco-radio');
      if (idx >= labels.length) return false;
      return labels[idx].classList.contains('arco-radio-checked');
    }, { idx: targetInfo.idx });

    if (verified) {
      log(`[支付] ✅ 验证通过：已成功切换到 ${method} (${targetInfo.text})`);
    } else {
      log(`[支付] ⚠️ 验证失败：切换后 ${method} 未变为选中状态，请检查`);
    }
  }

  /**
   * 检测页面上是否出现了错误提示（Arco Design toast/notification/表单验证）
   */
  async checkPageError(page) {
    return await page.evaluate(() => {
      const errors = [];

      // 1. Arco Design Message toast（最常见，浮层渲染，不用 offsetParent）
      const msgSelectors = [
        '.arco-message-content',
        '.arco-message-notice-content',
        '.arco-message-wrapper .arco-message',
      ];
      msgSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          const text = el.textContent.trim();
          if (text) errors.push({ source: 'message-toast', text });
        });
      });

      // 2. Arco Design Notification
      const notifications = document.querySelectorAll('.arco-notification-notice-content, .arco-notification');
      notifications.forEach(el => {
        const text = el.textContent.trim();
        if (text) errors.push({ source: 'notification', text });
      });

      // 3. 表单验证错误（input 下方红色提示）
      const formErrors = document.querySelectorAll('.arco-form-item-message-error, .arco-form-item-message, [class*="error-msg"], [class*="errmsg"]');
      formErrors.forEach(el => {
        const text = el.textContent.trim();
        if (text) errors.push({ source: 'form-validation', text });
      });

      // 4. 弹窗内的红色提示文字
      const modal = document.querySelector('.arco-modal.confirm_order, .confirm_order');
      if (modal) {
        const alertTexts = modal.querySelectorAll('[class*="error"], [class*="warning"], [class*="danger"], [style*="color: red"], [style*="color:red"]');
        alertTexts.forEach(el => {
          const text = el.textContent.trim();
          if (text) errors.push({ source: 'modal-alert', text });
        });
      }

      // 5. Modal 标题变化（可能变成错误提示）
      if (modal) {
        const title = modal.querySelector('.arco-modal-title, .arco-modal-header');
        if (title) {
          const text = title.textContent.trim();
          if (/错误|失败|异常|无效|不正确|不符合/.test(text)) {
            errors.push({ source: 'modal-title', text });
          }
        }
      }

      return errors.length > 0 ? errors : null;
    });
  }

  /**
   * 注入 MutationObserver 实时监控错误消息出现
   * 返回收集到的错误文本
   */
  async startErrorMonitor(page) {
    await page.evaluate(() => {
      if (window.__proxyErrorMessages) return; // 已注入
      window.__proxyErrorMessages = [];
      
      const observer = new MutationObserver(() => {
        const msgEls = document.querySelectorAll('.arco-message-content, .arco-message-notice-content');
        msgEls.forEach(el => {
          const text = el.textContent.trim();
          if (text && !window.__proxyErrorMessages.includes(text)) {
            window.__proxyErrorMessages.push(text);
          }
        });
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      window.__proxyErrorObserver = observer;
    });
  }

  /**
   * 读取并清理错误监控结果
   */
  async collectErrors(page) {
    return await page.evaluate(() => {
      const msgs = window.__proxyErrorMessages || [];
      window.__proxyErrorMessages = [];
      return msgs;
    });
  }

  /**
   * 提交订单并获取支付URL
   */
  async submitOrder(page, paymentMethod) {
    await sleep(200);

    // ===== 注入 MutationObserver 实时捕获错误消息（必须在点击前） =====
    await this.startErrorMonitor(page);

    // 先设置新页面监听（支付可能在新标签页打开）
    const browser = this.pool.browser;
    let newPageResolve;
    const newPagePromise = new Promise((resolve) => {
      newPageResolve = resolve;
      if (!browser) { resolve(null); return; }
      const handler = async (target) => {
        try {
          const newPage = await target.page();
          if (newPage) {
            // 立即为新页面设置代理认证，否则通过代理访问支付页面会 404
            if (USE_PROXY) {
              try { await newPage.authenticate({ username: PROXY_USER, password: PROXY_PASS }); } catch {}
            }
            browser.off('targetcreated', handler);
            resolve(newPage);
          }
        } catch { /* ignore */ }
      };
      browser.on('targetcreated', handler);
      setTimeout(() => { browser.off('targetcreated', handler); resolve(null); }, 6000);
    });

    // ===== 点击"去支付"/"提交订单"按钮 =====
    const clicked = await page.evaluate(() => {
      const modal = document.querySelector('.arco-modal.confirm_order, .confirm_order');
      const container = modal || document;
      const buttons = container.querySelectorAll('button');
      const submitKeywords = ['立即购买', '去支付', '支付', '下单', '提交订单', '确认下单', '确认支付', '立即支付', '提交'];
      for (const btn of buttons) {
        if (!btn.offsetParent && modal) continue; // 在弹窗中跳过隐藏
        const text = btn.textContent.trim();
        for (const kw of submitKeywords) {
          if (text.includes(kw) && !btn.disabled) {
            btn.click();
            return { found: true, text };
          }
        }
      }
      // 整页兜底
      const allBtns = document.querySelectorAll('button');
      for (const btn of allBtns) {
        if (!btn.offsetParent) continue;
        const text = btn.textContent.trim();
        if (/立即购买|去支付|提交订单|确认下单|提交/.test(text) && !btn.disabled) {
          btn.click();
          return { found: true, text };
        }
      }
      return { found: false };
    });

    if (clicked.found) {
      log(`[提交] JS点击了按钮: "${clicked.text}"，等待支付页...`);
    } else {
      log('[提交] JS未找到提交按钮，尝试 XPath...');
      const submitXPaths = [
        '//button[contains(text(),"立即购买")]',
        '//button[contains(text(),"去支付")]',
        '//button[contains(text(),"提交订单")]',
        '//button[contains(text(),"立即支付")]',
        '//button[contains(text(),"确认下单")]',
      ];
      for (const xpath of submitXPaths) {
        try {
          const [btn] = await page.$x(xpath);
          if (btn) {
            const disabled = await page.evaluate(el => el.disabled, btn);
            if (!disabled) {
              await btn.click();
              log(`[提交] XPath点击成功`);
              break;
            }
          }
        } catch {}
      }
    }

    // ===== 等待并检测：是打开支付页，还是弹出错误提示？ =====
    await sleep(500);
    
    // 1) 读取 MutationObserver 实时捕获的消息
    const capturedErrors = await this.collectErrors(page);
    if (capturedErrors.length > 0) {
      const errorTexts = capturedErrors.join('；');
      log(`[提交] ⚠️ 网站返回错误: ${errorTexts}`);
      throw new Error(errorTexts);
    }

    // 2) 静态检查页面错误（兜底）
    const pageError = await this.checkPageError(page);
    if (pageError) {
      const errorTexts = pageError.map(e => e.text).join('；');
      log(`[提交] ⚠️ 静态检测到错误: ${errorTexts}`);
      throw new Error(errorTexts);
    }

    // ===== 尝试提取 trade_no（仅从可靠来源）=====
    // 注意：body 文本正则匹配太宽泛，会误匹配 QQ/邮箱等无关字符串
    let tradeNo = null;
    try {
      tradeNo = await page.evaluate(() => {
        // 1) URL 参数（最可靠）
        const urlParams = new URLSearchParams(window.location.search);
        const fromUrl = urlParams.get('trade_no') || urlParams.get('tradeNo') || urlParams.get('order_no') || urlParams.get('orderNo');
        if (fromUrl) return fromUrl;

        // 2) 页面隐藏字段
        const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
        for (const input of hiddenInputs) {
          const name = (input.name || '').toLowerCase();
          const value = input.value;
          if ((name.includes('trade') || name.includes('order')) && value) return value;
        }

        // 3) data 属性（限定 trade/order 相关）
        const el = document.querySelector('[data-trade-no], [data-trade_no], [data-order-no], [data-order_no]');
        if (el) return el.getAttribute('data-trade-no') || el.getAttribute('data-trade_no') || el.getAttribute('data-order-no') || el.getAttribute('data-order_no');

        return null;
      });
      if (tradeNo) log(`[提交] 从主页面提取到 trade_no: ${tradeNo}`);
      else log(`[提交] 主页面未提取到 trade_no，等待支付页面`);
    } catch (e) { /* ignore */ }

    // 等待新页面打开 → 提取二维码后关闭
    const newPage = await newPagePromise;
    
    if (newPage) {
      const url = newPage.url();
      log(`[提交] 新页面URL: ${url.slice(0, 200)}`);

      // 等待支付页面加载完成（可能需要重新导航以确保认证生效）
      try {
        // 如果页面显示 404，可能是代理认证未在导航前设置，重新加载
        const pageTitle = await newPage.title();
        if (pageTitle.includes('404') || pageTitle.includes('Error') || pageTitle.includes('Not Found')) {
          log(`[提交] ⚠️ 页面标题异常: "${pageTitle}"，尝试重新加载...`);
          await newPage.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
          const newTitle = await newPage.title();
          log(`[提交] 重新加载后标题: "${newTitle}"`);
        } else {
          await newPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
        }
      } catch {}

      // 等待支付页面二维码渲染（支付宝用 img.code，微信用 #qrcode canvas）
      const isAlipay = paymentMethod === 'alipay';
      try {
        if (isAlipay) {
          // 支付宝：等待 img.code 图片元素出现并加载
          await newPage.waitForSelector('img.code', { timeout: 10000 });
          log('[提交] ✅ img.code 二维码元素已出现');
          let imgReady = false;
          for (let i = 0; i < 8; i++) {
            await sleep(200);
            imgReady = await newPage.evaluate(() => {
              const img = document.querySelector('img.code');
              if (!img) return false;
              return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
            });
            if (imgReady) {
              log(`[提交] ✅ 二维码图片加载完成（等待 ${(i + 1) * 200}ms）`);
              break;
            }
          }
          if (!imgReady) {
            log('[提交] ⚠️ 图片似乎未加载完成，继续尝试提取...');
            await sleep(500);
          }
        } else {
          // 微信：等待 #qrcode 容器出现，检测 canvas 绘制完成
          await newPage.waitForSelector('#qrcode', { timeout: 10000 });
          log('[提交] ✅ #qrcode 容器已出现');
          let canvasReady = false;
          for (let i = 0; i < 8; i++) {
            await sleep(200);
            canvasReady = await newPage.evaluate(() => {
              const c = document.querySelector('#qrcode canvas');
              if (!c) return false;
              try {
                const ctx = c.getContext('2d');
                if (!ctx) return c.width > 0;
                const data = ctx.getImageData(0, 0, Math.min(c.width, 10), Math.min(c.height, 10));
                for (let j = 3; j < data.data.length; j += 4) {
                  if (data.data[j] > 0) return true;
                }
                return false;
              } catch {
                return c.width > 0;
              }
            });
            if (canvasReady) {
              log(`[提交] ✅ 二维码 canvas 绘制完成（等待 ${(i + 1) * 200}ms）`);
              break;
            }
          }
          if (!canvasReady) {
            log('[提交] ⚠️ canvas 似乎未绘制内容，继续尝试提取...');
            await sleep(500);
          }
        }
      } catch {
        log('[提交] ⚠️ 未等到二维码元素，继续尝试提取...');
      }



      // 从支付页面重新提取 trade_no（支付页面 URL 是最权威的来源）
      // 始终执行，因为主页面可能提取到错误的 trade_no（如 QQ 号）
      try {
        const newPageTradeNo = await newPage.evaluate(() => {
          // 1) 支付页面 URL 参数（最可靠）
          const urlParams = new URLSearchParams(window.location.search);
          const fromUrl = urlParams.get('trade_no') || urlParams.get('tradeNo') || urlParams.get('order_no') || urlParams.get('orderNo');
          if (fromUrl) return fromUrl;

          // 2) 页面中的订单号元素
          const orderEl = document.querySelector('.order span:first-child');
          if (orderEl) {
            const match = orderEl.textContent.match(/[A-Z]{2}\d{6,}[A-Z0-9]+/);
            if (match) return match[0];
          }

          // 3) 隐藏字段
          const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
          for (const input of hiddenInputs) {
            const name = (input.name || '').toLowerCase();
            const value = input.value;
            if ((name.includes('trade') || name.includes('order')) && value) return value;
          }

          return null;
        });
        if (newPageTradeNo) {
          if (tradeNo && tradeNo !== newPageTradeNo) {
            log(`[提交] ⚠️ 主页面 trade_no (${tradeNo}) 与支付页面 (${newPageTradeNo}) 不一致，使用支付页面的值`);
          }
          tradeNo = newPageTradeNo;
          log(`[提交] ✅ 从支付页面提取到 trade_no: ${tradeNo}`);
        }
      } catch (e) { /* ignore */ }

      // 从支付页面提取二维码图片
      const qrUrl = await newPage.evaluate((isAlipay) => {
        if (isAlipay) {
          // 支付宝：直接取 img.code 的 src
          const qrImg = document.querySelector('img.code');
          if (qrImg && qrImg.src && qrImg.src.length > 50) {
            return qrImg.src;
          }
        } else {
          // 微信：从 #qrcode canvas 提取
          const qrCanvas = document.querySelector('#qrcode canvas');
          if (qrCanvas && qrCanvas.width >= 100) {
            try {
              const dataUrl = qrCanvas.toDataURL('image/png');
              if (dataUrl && dataUrl.length > 500) {
                return dataUrl;
              }
            } catch {}
          }
        }
        return null;
      }, isAlipay);

      if (!qrUrl) {
        throw new Error('未能提取到支付二维码，请重试');
      }

      // 不关闭支付页面！留给卡密监控守着等跳转
      log('[提交] 保留支付页面，等待支付完成后跳转...');

      return { url: qrUrl, paymentPage: newPage, tradeNo };
    }

    // 一定会弹出新的支付页面，没弹出来就是异常
    throw new Error('支付页面未弹出，请重试');
  }

  /**
   * 后台轮询 hsfaka 卡密 API，检测支付完成（旧方案，兜底用）
   */
  async startApiPollMonitor(taskId, tradeNo, paymentUrl, productName) {
    paymentTasks.set(taskId, { status: 'pending', paymentUrl });
    
    const MAX_POLLS = 120;  // 最多轮询 120 次（10分钟，每5秒一次）
    const POLL_INTERVAL = 5000;
    const EXPORT_URL = `https://hsfaka.cn/shopApi/Order/exportCards?trade_no=${tradeNo}`;

    // 获取当前页面的 cookies 用于 fetch
    let cookieStr = '';
    try {
      const pages = await this.pool.browser.pages();
      for (const p of pages) {
        try {
          const c = await p.cookies();
          if (c.length > 0) {
            cookieStr = c.map(c => `${c.name}=${c.value}`).join('; ');
            break;
          }
        } catch {}
      }
    } catch (e) {
      log(`[卡密监控] 获取cookies失败: ${e.message}`);
    }

    log(`[卡密监控] 开始轮询 (taskId=${taskId}, 每${POLL_INTERVAL/1000}s, 最多${MAX_POLLS}次)`);

    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(POLL_INTERVAL);
      
      try {
        const resp = await fetch(EXPORT_URL, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Cookie': cookieStr,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://hsfaka.cn/',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!resp.ok) {
          if (i % 12 === 0) log(`[卡密监控] 第${i+1}次: HTTP ${resp.status}，继续等待...`);
          continue;
        }

        const text = await resp.text();
        
        // 尝试解析响应
        let cardKeys = [];
        
        // 可能是 JSON
        try {
          const json = JSON.parse(text);
          if (json.data && Array.isArray(json.data)) {
            cardKeys = json.data.map(item => 
              typeof item === 'string' ? item : (item.card || item.code || item.key || item.cdk || JSON.stringify(item))
            );
          } else if (json.cards && Array.isArray(json.cards)) {
            cardKeys = json.cards;
          } else if (Array.isArray(json)) {
            cardKeys = json;
          }
        } catch {
          // 可能是 CSV/纯文本，按行分割
          const lines = text.trim().split(/[\r\n]+/).filter(l => l.trim());
          if (lines.length > 0 && !lines[0].includes('DOCTYPE') && !lines[0].includes('<html')) {
            // 跳过标题行（如果看起来像标题）
            const startIdx = lines[0].match(/卡密|卡号|cdk|card|code/i) ? 1 : 0;
            cardKeys = lines.slice(startIdx).map(l => l.trim()).filter(l => l.length > 3);
          }
        }

        if (cardKeys.length > 0) {
          log(`[卡密监控] ✅ 获取到 ${cardKeys.length} 张卡密！`);
          paymentTasks.set(taskId, { 
            status: 'completed', 
            cardKeys, 
            tradeNo,
            productName,
          });
          // 同步更新 orderTasks
          const order = orderTasks.get(taskId);
          if (order) {
            orderTasks.set(taskId, { ...order, status: 'completed', cardKeys });
            log(`[卡密监控] 已同步订单状态: ${taskId}`);
          }
          return;
        }

        // 检查是否包含"未支付"或空响应（说明还没支付）
        if (text.includes('未支付') || text.includes('unpaid') || text.trim().length === 0) {
          if (i % 12 === 0) log(`[卡密监控] 第${i+1}次: 尚未支付，继续等待...`);
          continue;
        }

        // 其他情况
        if (i % 12 === 0) log(`[卡密监控] 第${i+1}次: 响应内容不明确 (${text.slice(0, 100)})`);

      } catch (err) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
          if (i % 12 === 0) log(`[卡密监控] 第${i+1}次: 请求超时`);
        } else if (i % 12 === 0) {
          log(`[卡密监控] 第${i+1}次: ${err.message}`);
        }
      }
    }

    // 超时
    log(`[卡密监控] ⏰ 轮询超时 (${MAX_POLLS * POLL_INTERVAL / 1000}s)`);
    paymentTasks.set(taskId, { status: 'timeout', paymentUrl });
    // 同步更新 orderTasks
    const order = orderTasks.get(taskId);
    if (order) {
      orderTasks.set(taskId, { ...order, status: 'pending_payment', error: '支付超时，未检测到付款' });
    }
  }

  /**
   * 页面跳转监控：支付完成后 hsfaka 会自动跳转到 /order/result/ 卡密页
   * 直接用 waitForNavigation 事件驱动，不轮询！
   */
  async startPageMonitor(taskId, paymentPage, paymentUrl, productName) {
    paymentTasks.set(taskId, { status: 'pending', paymentUrl });
    const startTime = Date.now();
    log(`[页面监控] 等待支付完成，检测到跳转即抓取卡密 (taskId=${taskId})`);

    const MAX_WAIT_MS = 600000; // 最长等 10 分钟

    try {
      // ===== 事件驱动：直接等页面跳转（支付完成后自动跳转）=====
      log(`[页面监控] 监听页面跳转中（最长${MAX_WAIT_MS/1000}s）...`);
      await paymentPage.waitForNavigation({
        timeout: MAX_WAIT_MS,
        waitUntil: 'domcontentloaded',
      });

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const newUrl = paymentPage.url();
      log(`[页面监控] ✅ 页面已跳转！耗时${elapsed}s → ${newUrl.slice(0, 100)}`);

      // 等待卡密元素渲染完成
      await sleep(1000);

      // 提取卡密
      const cardKeys = await paymentPage.evaluate(() => {
        const keys = [];
        const items = document.querySelectorAll('.cards .item-content');
        items.forEach(item => {
          const text = item.textContent.trim();
          if (text) keys.push(text);
        });
        if (keys.length === 0) {
          const content = document.querySelector('.cards .content');
          if (content) {
            const text = content.textContent.trim();
            if (text) keys.push(text);
          }
        }
        // 兜底：页面中找符合卡密格式的文本
        if (keys.length === 0) {
          const allText = document.body.innerText;
          const lines = allText.split('\n').filter(l => l.trim().length > 5);
          for (const line of lines) {
            if (/^[A-Za-z0-9]{8,50}$/.test(line.trim())) {
              keys.push(line.trim());
            }
          }
        }
        return keys;
      });

      if (cardKeys.length > 0) {
        log(`[页面监控] ✅ 获取到 ${cardKeys.length} 张卡密: ${cardKeys.slice(0, 3).join(', ')}${cardKeys.length > 3 ? '...' : ''}`);

        paymentTasks.set(taskId, { status: 'completed', cardKeys, tradeNo: null, productName });
        const order = orderTasks.get(taskId);
        if (order) {
          orderTasks.set(taskId, { ...order, status: 'completed', cardKeys });
          log(`[页面监控] 已同步订单状态: ${taskId}`);
        }
      } else {
        log(`[页面监控] ⚠️ 页面已跳转但未提取到卡密`);
        paymentTasks.set(taskId, { status: 'failed', error: '未提取到卡密' });
        const order = orderTasks.get(taskId);
        if (order) orderTasks.set(taskId, { ...order, status: 'failed', error: '页面跳转但未提取到卡密' });
      }

      await paymentPage.close().catch(() => {});
      log(`[页面监控] 已关闭支付页面`);

    } catch (err) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      if (err.name === 'TimeoutError') {
        log(`[页面监控] ⏰ 等待超时（${elapsed}s），用户可能未支付`);
        paymentTasks.set(taskId, { status: 'timeout', paymentUrl });
        const order = orderTasks.get(taskId);
        if (order) orderTasks.set(taskId, { ...order, status: 'pending_payment', error: '支付超时，未检测到付款' });
      } else {
        log(`[页面监控] 异常 (${elapsed}s): ${err.message}`);
        paymentTasks.set(taskId, { status: 'timeout', paymentUrl, error: '支付超时，请重试' });
        const order = orderTasks.get(taskId);
        if (order) orderTasks.set(taskId, { ...order, status: 'pending_payment', error: '支付超时，请重试' });
      }
      
      await paymentPage.close().catch(() => {});
    }
  }
}

// ==================== 工具函数 ====================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}





// ==================== Express 服务器 ====================

async function main() {
  const pool = new BrowserPool();
  const flow = new PurchaseFlow(pool);

  // 初始化数据库连接
  await initDb();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // 健康检查
  app.get('/api/proxy/health', (req, res) => {
    res.json({ status: 'ok', ready: pool.ready });
  });

  // ========== 统计数据：后端每1秒查询本地数据库 + SSE 推送 ==========
  let cachedStats = null;
  const statsClients = new Set();

  // 启动时立即查询一次
  (async () => {
    const data = await queryStats();
    if (data) {
      cachedStats = data;
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      for (const client of statsClients) {
        try { client.write(payload); } catch (_) { statsClients.delete(client); }
      }
    }
  })();

  // 每1秒查询本地数据库
  setInterval(async () => {
    const data = await queryStats();
    if (data) {
      cachedStats = data;
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      for (const client of statsClients) {
        try { client.write(payload); } catch (_) { statsClients.delete(client); }
      }
    }
  }, 1000);

  // SSE 实时推送端点
  app.get('/api/proxy/stats-stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    // 有缓存数据立即推送
    if (cachedStats) {
      res.write(`data: ${JSON.stringify(cachedStats)}\n\n`);
    }
    statsClients.add(res);
    // 心跳保活
    const hb = setInterval(() => {
      try { res.write(': ping\n\n'); } catch (_) { statsClients.delete(res); clearInterval(hb); }
    }, 15000);
    req.on('close', () => { clearInterval(hb); statsClients.delete(res); });
  });

  // 普通查询接口（兼容）
  app.get('/api/proxy/stats', (req, res) => {
    if (cachedStats) {
      res.json({ code: 200, data: cachedStats });
    } else {
      res.status(503).json({ code: 503, msg: '统计数据尚未就绪' });
    }
  });

  // ========== Uptime Kuma 监控数据：后端每60秒轮询 + SSE 推送 ==========
  const UPTIME_BASE = 'https://uptime.piao.one';
  const UPTIME_SLUG = 'tiku';
  let cachedUptimeData = null;
  const uptimeClients = new Set(); // SSE 连接池

  async function fetchUptimeData() {
    try {
      const [statusRes, heartbeatRes] = await Promise.all([
        fetch(`${UPTIME_BASE}/api/status-page/${UPTIME_SLUG}`, { signal: AbortSignal.timeout(10000) }),
        fetch(`${UPTIME_BASE}/api/status-page/heartbeat/${UPTIME_SLUG}`, { signal: AbortSignal.timeout(10000) }),
      ]);
      if (!statusRes.ok || !heartbeatRes.ok) {
        log(`[监控轮询] API 返回 ${statusRes.status}/${heartbeatRes.status}`);
        return;
      }
      const statusData = await statusRes.json();
      const heartbeatData = await heartbeatRes.json();
      cachedUptimeData = { statusData, heartbeatData };
      // 推送给所有 SSE 客户端
      const payload = `data: ${JSON.stringify(cachedUptimeData)}\n\n`;
      for (const client of uptimeClients) {
        try { client.write(payload); } catch (_) { uptimeClients.delete(client); }
      }
    } catch (err) {
      log(`[监控轮询失败] ${err.message}`);
    }
  }

  // 启动时立即拉取一次
  fetchUptimeData();
  // 每60秒轮询
  setInterval(fetchUptimeData, 60000);

  // SSE 实时推送端点
  app.get('/api/proxy/uptime-stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    // 立即发送当前缓存数据
    if (cachedUptimeData) {
      res.write(`data: ${JSON.stringify(cachedUptimeData)}\n\n`);
    }
    uptimeClients.add(res);
    // 心跳
    const heartbeat = setInterval(() => {
      try { res.write(': ping\n\n'); } catch (_) { uptimeClients.delete(res); clearInterval(heartbeat); }
    }, 15000);
    req.on('close', () => {
      clearInterval(heartbeat);
      uptimeClients.delete(res);
    });
  });

  // 普通查询接口（兼容）
  app.get('/api/proxy/uptime', (req, res) => {
    if (cachedUptimeData) {
      res.json(cachedUptimeData);
    } else {
      res.status(503).json({ error: '监控数据尚未就绪' });
    }
  });

  // 免费福利领取 - IP频率限制（同一IP每分钟最多10次）
  const welfareIpCache = new Map();
  function checkWelfareIpLimit(ip) {
    const now = Date.now();
    const record = welfareIpCache.get(ip);
    if (!record || now - record.resetAt > 60000) {
      welfareIpCache.set(ip, { count: 1, resetAt: now });
      return true;
    }
    if (record.count >= 10) return false;
    record.count++;
    return true;
  }
  // 定期清理过期IP记录
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of welfareIpCache) {
      if (now - record.resetAt > 60000) welfareIpCache.delete(ip);
    }
  }, 60000);

  // 免费福利领取（后端转发，不暴露题库服务器地址）
  // 题库接口代理（解决 HTTPS 混合内容问题）
  app.post('/api/proxy/tiku', async (req, res) => {
    const { server } = req.body;
    const servers = ['122.152.249.109:3000', '152.136.30.238:3000'];
    const target = server && servers.includes(server) ? server : servers[0];
    try {
      const resp = await fetch(`http://${target}/api/tiku`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers['authorization'] || 'free',
        },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(15000),
      });
      const data = await resp.json();
      res.status(resp.status).json(data);
    } catch (err) {
      log(`[题库代理失败] ${err.message}`);
      res.status(500).json({ code: 500, msg: '题库服务器连接失败，请稍后重试', data: null });
    }
  });

  app.post('/api/proxy/welfare', async (req, res) => {
    // IP频率限制
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || req.socket.remoteAddress;
    if (!checkWelfareIpLimit(ip)) {
      return res.status(429).json({ code: 429, msg: '操作过于频繁，请1分钟后再试' });
    }
    try {
      const resp = await fetch('http://122.152.249.109:3000/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(10000),
      });
      const data = await resp.json();
      res.status(resp.status).json(data);
    } catch (err) {
      log(`[福利转发失败] ${err.message}`);
      res.status(500).json({ code: 500, msg: '服务暂时不可用，请稍后重试' });
    }
  });

  // 初始化浏览器
  app.post('/api/proxy/init', async (req, res) => {
    if (!PAY_ENABLED) return res.status(503).json({ success: false, error: '支付功能暂未开放' });
    try {
      await pool.init();
      res.json({ success: true, message: '浏览器已就绪' });
    } catch (err) {
      res.status(500).json({ success: false, error: '请求失败' });
    }
  });

  // 创建订单（异步模式：立即返回 taskId，后台执行购买流程）
  app.post('/api/proxy/orders', async (req, res) => {
    if (!PAY_ENABLED) return res.status(503).json({ success: false, error: '支付功能暂未开放' });
    try {
      const { productName, email, paymentMethod, code } = req.body;

      // code 是赞助查询暗号（必填，作为 hsfaka 联系方式）
      // email 是接收邮箱（选填，后期邮局服务用于发送卡密）
      const contactInfo = code || email; // 优先用暗号，兼容旧版 email 字段

      if (!productName) {
        return res.status(400).json({ success: false, error: '请选择商品' });
      }
      if (!contactInfo) {
        return res.status(400).json({ success: false, error: '请填写赞助查询暗号' });
      }
      if (!ITEM_URLS[productName]) {
        return res.status(400).json({ success: false, error: `未知商品: ${productName}` });
      }

      if (!pool.ready) {
        log('[API] 浏览器未初始化，自动初始化...');
        await pool.init();
      }

      const taskId = generateTaskId();
      const createdAt = Date.now();

      // 立即记录任务并返回
      orderTasks.set(taskId, {
        status: 'processing',
        productName,
        email: contactInfo,    // hsfaka 联系方式用暗号
        userEmail: email || '', // 用户邮箱（用于后期邮件发送）
        paymentMethod: paymentMethod || 'alipay',
        paymentUrl: null,
        taskId: null,
        cardKeys: null,
        amount: null,
        error: null,
        createdAt,
      });

      log(`[API] 赞助已受理: ${taskId} (${productName}, 暗号=${contactInfo}${email ? `, 邮箱=${email}` : ''})，共 ${orderTasks.size} 个进行中`);

      // 后台异步执行购买流程（不阻塞响应）
      (async () => {
        try {
          const result = await flow.execute(productName, contactInfo, paymentMethod || 'alipay', taskId);
          
          // 更新任务状态
          const current = orderTasks.get(taskId);
          if (current) {
            const updated = {
              ...current,
              status: result.cardKeys ? 'completed' : 'pending_payment',
              paymentUrl: result.paymentUrl || null,
              taskId: result.taskId || null,
              cardKeys: result.cardKeys || null,
              amount: result.amount || null,
            };
            orderTasks.set(taskId, updated);
            log(`[API] 订单完成: ${taskId} → ${updated.status}${result.cardKeys ? `，${result.cardKeys.length}张卡密` : ''}`);
          }
        } catch (err) {
          const current = orderTasks.get(taskId);
          if (current) {
            orderTasks.set(taskId, { ...current, status: 'failed', error: err.message });
          }
          log(`[API] 订单失败: ${taskId} - ${err.message}`);
        }
      })();

      // 立即返回，不等待结果
      res.json({
        success: true,
        taskId,
        status: 'processing',
        message: '赞助已提交，后台处理中...',
        productName,
        code: contactInfo,
        email: email || '',
      });

    } catch (err) {
      log(`[API错误] ${err.message}`);
      res.status(500).json({ 
        success: false, 
        error: '服务异常，请稍后重试',
      });
    }
  });

  // 提交验证码（用户在前端看到验证码图片后输入）
  app.post('/api/proxy/captcha-answer', async (req, res) => {
    if (!PAY_ENABLED) return res.status(503).json({ success: false, error: '支付功能暂未开放' });
    try {
      const { taskId, captchaAnswer } = req.body;
      if (!taskId || !captchaAnswer) {
        return res.status(400).json({ success: false, error: '缺少 taskId 或验证码' });
      }

      const order = orderTasks.get(taskId);
      if (!order || order.status !== 'captcha_required') {
        return res.status(400).json({ success: false, error: '该订单不需要验证码或已过期' });
      }

      // 保存验证码答案，后台 handleCaptcha 循环会读取并继续流程
      orderTasks.set(taskId, { ...order, captchaAnswer });
      log(`[API] 收到验证码: taskId=${taskId}, answer=${captchaAnswer}`);

      res.json({ success: true, message: '验证码已提交，继续处理...' });
    } catch (err) {
      log(`[API错误] 验证码提交失败: ${err.message}`);
      res.status(500).json({ success: false, error: '验证码提交失败，请重试' });
    }
  });

  // SSE 推送：前端建立长连接，后端主动推送状态变更（替代轮询）
  app.get('/api/proxy/order-stream/:taskId', (req, res) => {
    if (!PAY_ENABLED) return res.status(503).json({ error: '支付功能暂未开放' });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 nginx 缓冲
    });

    // 注册客户端
    if (!sseClients.has(taskId)) sseClients.set(taskId, new Set());
    sseClients.get(taskId).add(res);
    log(`[SSE] 客户端连接: ${taskId} (共${sseClients.get(taskId).size}个)`);

    // 立即发送当前状态
    const current = orderTasks.get(taskId);
    if (current) {
      sseWrite(res, 'update', current);
    }

    // 心跳，防止连接断开
    const heartbeat = setInterval(() => {
      sseWrite(res, 'ping', {});
    }, 15000);

    // 客户端断开时清理
    req.on('close', () => {
      clearInterval(heartbeat);
      const clients = sseClients.get(taskId);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) sseClients.delete(taskId);
      }
      log(`[SSE] 客户端断开: ${taskId}`);
    });
  });

  // 脚本下载：从脚本猫获取，带版本缓存
  const SCRIPT_META_URL = 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%EF%BD%9C%E7%9F%A5%E5%88%B0%E6%99%BA%E6%85%A7%E6%A0%91--%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7CAI%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98%7C%E7%AD%94%E6%A1%88%E6%A0%A1%E9%AA%8C%7C%E9%A3%98%E9%A3%98%7C%E9%A3%98%E9%A3%98%E5%8F%8B%E6%83%85%E6%8F%90%E4%BE%9B%7C%E8%87%AA%E5%8A%A8%E8%B7%B3%E8%BD%AC%E4%BB%BB%E5%8A%A1%E7%82%B9%7C%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98%7C%E8%B6%85%E9%AB%98%E9%A2%98%E5%BA%93%E8%A6%86%E7%9B%96%E7%8E%87%7C%E9%80%90%E6%B8%90%E6%94%AF%E6%8C%81%E6%9B%B4%E5%A4%9A%E5%B9%B3%E5%8F%B0.meta.js';
  const SCRIPT_CODE_URL = 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%EF%BD%9C%E7%9F%A5%E5%88%B0%E6%99%BA%E6%85%A7%E6%A0%91--%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7CAI%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98%7C%E7%AD%94%E6%A1%88%E6%A0%A1%E9%AA%8C%7C%E9%A3%98%E9%A3%98%7C%E9%A3%98%E9%A3%98%E5%8F%8B%E6%83%85%E6%8F%90%E4%BE%9B%7C%E8%87%AA%E5%8A%A8%E8%B7%B3%E8%BD%AC%E4%BB%BB%E5%8A%A1%E7%82%B9%7C%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98%7C%E8%B6%85%E9%AB%98%E9%A2%98%E5%BA%93%E8%A6%86%E7%9B%96%E7%8E%87%7C%E9%80%90%E6%B8%90%E6%94%AF%E6%8C%81%E6%9B%B4%E5%A4%9A%E5%B9%B3%E5%8F%B0.user.js';
  let cachedScript = null;
  let cachedVersion = null;

  app.get('/api/proxy/download.user.js', async (req, res) => {
    try {
      // 1. 检查脚本猫是否有新版本
      log('[下载] 检查脚本猫最新版本...');
      const metaResp = await fetch(SCRIPT_META_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000),
      });
      if (!metaResp.ok) throw new Error(`meta.js 请求失败: ${metaResp.status}`);
      const metaText = await metaResp.text();
      const versionMatch = metaText.match(/\/\/\s*@version\s+(\d+\.\d+\.\d+)/);
      if (!versionMatch) throw new Error('未找到版本号');
      const latestVersion = versionMatch[1];

      // 2. 如果有缓存且版本一致，直接返回缓存
      if (cachedScript && cachedVersion === latestVersion) {
        log(`[下载] 使用缓存脚本 (v${latestVersion})`);
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        res.send(cachedScript);
        return;
      }

      // 3. 下载新版本脚本
      log(`[下载] 发现新版本 v${latestVersion}，正在下载...`);
      const scriptResp = await fetch(SCRIPT_CODE_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(15000),
      });
      if (!scriptResp.ok) throw new Error(`脚本下载失败: ${scriptResp.status}`);
      cachedScript = await scriptResp.text();
      cachedVersion = latestVersion;
      log(`[下载] 脚本已缓存 (v${latestVersion})`);

      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.send(cachedScript);
    } catch (err) {
      log(`[下载错误] ${err.message}`);
      // 即使出错也返回缓存（如果有）
      if (cachedScript) {
        log('[下载] 返回缓存脚本（备用）');
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        res.send(cachedScript);
      } else {
        res.status(500).json({ error: '脚本下载失败，请稍后重试' });
      }
    }
  });

  // 查询订单状态（保留旧接口兼容）
  app.get('/api/proxy/order-status', (req, res) => {
    if (!PAY_ENABLED) return res.status(503).json({ error: '支付功能暂未开放' });
    const taskId = req.query.taskId;
    if (!taskId) {
      return res.status(400).json({ error: '缺少 taskId' });
    }

    const order = orderTasks.get(taskId);
    if (!order) {
      // 可能已完成被清理，检查 paymentTasks
      const payment = paymentTasks.get(taskId);
      if (payment) {
        return res.json({ status: 'pending_payment', paymentUrl: payment.paymentUrl, ...payment });
      }
      return res.json({ status: 'not_found', message: '赞助记录不存在或已过期' });
    }

    // 如果订单处于 pending_payment 且 paymentTasks 有更新，合并返回
    if (order.status === 'pending_payment') {
      const payment = paymentTasks.get(taskId);
      if (payment && payment.cardKeys) {
        // 更新 order 状态
        order.status = 'completed';
        order.cardKeys = payment.cardKeys;
        orderTasks.set(taskId, order);
        log(`[订单] ${taskId} 卡密已到账，${payment.cardKeys.length}张`);
      }
    }

    res.json(order);
  });

  // 轮询支付结果（卡密）
  app.get('/api/proxy/payment-result', (req, res) => {
    if (!PAY_ENABLED) return res.status(503).json({ error: '支付功能暂未开放' });
    const taskId = req.query.taskId;
    if (!taskId) {
      return res.status(400).json({ error: '缺少 taskId' });
    }

    const task = paymentTasks.get(taskId);
    if (!task) {
      return res.json({ status: 'not_found', message: '任务不存在或已过期' });
    }

    res.json(task);
  });

  // 定期清理过期任务（1小时）
  setInterval(() => {
    const now = Date.now();
    let paymentCleaned = 0;
    for (const [taskId, task] of paymentTasks) {
      const ts = parseInt(taskId.split('_')[1]);
      if (ts && now - ts > 3600000) {
        paymentTasks.delete(taskId);
        paymentCleaned++;
      }
    }
    let orderCleaned = 0;
    for (const [taskId, task] of orderTasks) {
      if (now - task.createdAt > 3600000) {
        orderTasks.delete(taskId);
        orderCleaned++;
      }
    }
    if (paymentCleaned || orderCleaned) {
      log(`[清理] 删除过期任务: payment=${paymentCleaned}, order=${orderCleaned}`);
    }
  }, 60000);

  // 启动服务器
  app.listen(PORT, () => {
    log(`========================================`);
    log(`  支付代理服务已启动`);
    log(`  地址: http://localhost:${PORT}`);
    log(`  商品: ${Object.keys(ITEM_URLS).join(', ')}`);
    log(`========================================`);
    
    // 自动初始化浏览器（支付关闭时跳过）
    if (PAY_ENABLED) {
      pool.init().catch(err => {
        log(`[初始化失败] ${err.message}`);
        log(` 提示: 请确保已安装 Chrome 或运行 npx puppeteer browsers install chrome`);
      });
    } else {
      log('  [支付模块已关闭，浏览器未启动]');
    }
  });

  // 优雅退出
  process.on('SIGINT', async () => {
    log('正在关闭...');
    await pool.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log('正在关闭...');
    await pool.close();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
