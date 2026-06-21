// ==UserScript==
// @name         |🥇PP网课小助手|飘飘|热更新版本|
// @namespace    飘飘
// @version      1.0.1
// @author       PIAOPIAO
// @license      MIT
// @description  轻量级引导脚本，自动拉取最新代码执行。支持热更新，无需手动更新脚本。
// @icon         https://wk.piao.one/assets/%E5%9B%BE%E5%B1%82%201-D6uQ9z8H.png
// @match        *://*.chaoxing.com/*
// @match        *://*.xuexitong.com/*
// @match        *://*.edu.cn/*
// @match        *://*.nbdlib.cn/*
// @match        *://*.hnsyu.net/*
// @match        *://*.gdhkmooc.com/*
// @match        *://onlineexamh5new.zhihuishu.com/*
// @require      https://lib.baomitu.com/vue/3.5.0/vue.global.prod.js
// @require      https://lib.baomitu.com/vue-demi/0.14.7/index.iife.js
// @require      data:application/javascript,window.Vue%3DVue%3B
// @require      https://lib.baomitu.com/element-plus/2.7.2/index.full.min.js
// @require      https://lib.baomitu.com/pinia/2.3.1/pinia.iife.min.js
// @require      https://lib.baomitu.com/rxjs/7.8.2/rxjs.umd.min.js
// @require      https://lib.baomitu.com/blueimp-md5/2.19.0/js/md5.min.js
// @resource     ElementPlus       https://lib.baomitu.com/element-plus/2.7.2/index.css
// @resource     ElementPlusStyle  https://lib.baomitu.com/element-plus/2.8.2/index.min.css
// @resource     ttf               https://www.forestpolice.org/ttf/2.0/table.json
// @connect      scriptcat.org
// @connect      *
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// @antifeature  payment  答案需调用AI的API需收费
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        VERSION_SERVER: {
            VERSION_URL: 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C.meta.js',
            BOOTSTRAP_VERSION_URL: 'https://scriptcat.org/scripts/code/5615/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C%E7%83%AD%E6%9B%B4%E6%96%B0%E7%89%88%E6%9C%AC%7C.meta.js',
        },
        SCRIPTCAT: {
            SCRIPT_ID: '5597',
            SCRIPT_NAME: 'PP网课小助手',
            CODE_URL: 'https://wk.piao.one/api/proxy/download.user.js',
            CODE_URL_FALLBACK: 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C.user.js'
        },
        CACHE_KEY: 'cloud_script_cache',
        VERSION_KEY: 'cloud_script_version',
        LAST_CHECK_KEY: 'last_check_time'
    };

    const log = {
        info: (msg, ...args) => console.log(`%c[云端脚本] ${msg}`, 'color: #667eea; font-weight: bold;', ...args),
        success: (msg, ...args) => console.log(`%c[云端脚本] ✓ ${msg}`, 'color: #10b981; font-weight: bold;', ...args),
        warn: (msg, ...args) => console.warn(`%c[云端脚本] ⚠ ${msg}`, 'color: #f59e0b; font-weight: bold;', ...args),
        error: (msg, ...args) => console.error(`%c[云端脚本] ✗ ${msg}`, 'color: #ef4444; font-weight: bold;', ...args)
    };

    let loadingWindow = null;

    function showLoadingWindow() {
        if (loadingWindow) return;
        const createLoading = () => {
            loadingWindow = document.createElement('div');
            loadingWindow.id = 'cloud-script-loading-window';
            loadingWindow.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">脚本加载中...</div>
                </div>
            `;
            loadingWindow.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                animation: toastSlideIn 0.3s ease;
            `;
            const style = document.createElement('style');
            style.id = 'cloud-script-loading-styles';
            style.textContent = `
                #cloud-script-loading-window .loading-content {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-left: 3px solid #0052D9;
                    padding: 10px 16px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
                    min-width: 180px;
                }
                #cloud-script-loading-window .loading-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid #e5e7eb;
                    border-top-color: #0052D9;
                    border-right-color: #0052D9;
                    border-radius: 50%;
                    animation: loadingSpin 0.8s linear infinite;
                    flex-shrink: 0;
                    display: block;
                }
                #cloud-script-loading-window .loading-text {
                    color: #374151;
                    font-size: 13px;
                    font-weight: 500;
                    white-space: nowrap;
                }
                @keyframes loadingSpin {
                    to { transform: rotate(360deg); }
                }
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(16px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(loadingWindow);
            log.info('加载窗口已显示');
        };
        if (document.body) {
            createLoading();
        } else {
            document.addEventListener('DOMContentLoaded', createLoading);
        }
    }

    function hideLoadingWindow() {
        if (loadingWindow) {
            loadingWindow.style.opacity = '0';
            loadingWindow.style.transition = 'opacity 0.25s ease';
            setTimeout(() => {
                if (loadingWindow) {
                    loadingWindow.remove();
                    loadingWindow = null;
                    const style = document.getElementById('cloud-script-loading-styles');
                    if (style) style.remove();
                    log.info('加载窗口已关闭');
                }
            }, 250);
        }
    }

    window.__closeLoadingWindow__ = hideLoadingWindow;

    function compareVersion(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    }

    function httpGet(url, isText = false, headers = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: headers,
                timeout: 15000,
                onload: (response) => {
                    if (response.status === 200) {
                        resolve(isText ? response.responseText : response.response);
                    } else {
                        reject(new Error(`HTTP ${response.status}`));
                    }
                },
                onerror: () => reject(new Error('网络请求失败')),
                ontimeout: () => reject(new Error('请求超时'))
            });
        });
    }

    function getLocalCache() {
        return {
            version: GM_getValue(CONFIG.VERSION_KEY, ''),
            code: GM_getValue(CONFIG.CACHE_KEY, ''),
            lastCheck: GM_getValue(CONFIG.LAST_CHECK_KEY, 0)
        };
    }

    function saveLocalCache(version, code) {
        GM_setValue(CONFIG.VERSION_KEY, version);
        GM_setValue(CONFIG.CACHE_KEY, code);
        GM_setValue(CONFIG.LAST_CHECK_KEY, Date.now());
    }

    async function checkBootstrapVersion() {
        try {
            log.info('检查引导脚本版本...');
            const response = await httpGet(CONFIG.VERSION_SERVER.BOOTSTRAP_VERSION_URL, true, { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
            
            const versionMatch = response.match(/\/\/\s*@version\s+(\d+\.\d+\.\d+)/);
            if (versionMatch && versionMatch[1]) {
                const latestVersion = versionMatch[1];
                const currentVersion = GM_info?.script?.version || '1.2.0';
                
                if (compareVersion(latestVersion, currentVersion) > 0) {
                    log.warn(`引导脚本有新版本: v${currentVersion} → v${latestVersion}`);
                    
                    // 显示更新提示对话框（不自动关闭）
                    const showDialog = () => {
                        const dialog = document.createElement('div');
                        dialog.id = 'bootstrap-update-dialog';
                        dialog.style.cssText = `
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: #ffffff;
                            border: 1px solid #e5e7eb;
                            color: #111827;
                            padding: 30px 40px;
                            border-radius: 12px;
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                            z-index: 2147483647;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            text-align: center;
                            max-width: 400px;
                        `;
                        dialog.innerHTML = `
                            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                            <div style="font-weight: 600; font-size: 18px; margin-bottom: 12px; color: #111827;">PP网课助手启动器需要更新</div>
                            <div style="font-size: 14px; margin-bottom: 20px; color: #6b7280;">
                                当前版本: v${currentVersion}<br>
                                最新版本: v${latestVersion}
                            </div>
                            <div style="font-size: 13px; margin-bottom: 16px; color: #6b7280;">
                                请先更新启动器，否则可能无法正常运行
                            </div>
                            <div style="font-size: 12px; margin-bottom: 20px; color: #9ca3af;">
                                安装完成后请刷新页面
                            </div>
                            <a href="https://scriptcat.org/scripts/code/5615/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C%E7%83%AD%E6%9B%B4%E6%96%B0%E7%89%88%E6%9C%AC%7C.user.js" target="_blank" 
                               style="display: inline-block; background: #0052D9; color: #ffffff; padding: 10px 28px; 
                                      border-radius: 6px; font-size: 14px; text-decoration: none; font-weight: 500;
                                      transition: all 0.2s;">
                                立即更新
                            </a>
                        `;
                        document.body.appendChild(dialog);
                        log.warn('引导脚本需要更新，已停止执行');
                    };
                    
                    if (document.body) {
                        showDialog();
                    } else {
                        document.addEventListener('DOMContentLoaded', showDialog);
                    }
                    
                    // 返回 true 表示需要更新，停止后续执行
                    return true;
                } else {
                    log.success(`引导脚本已是最新版本 v${currentVersion}`);
                    return false;
                }
            }
        } catch (e) {
            log.warn('检查引导脚本版本失败:', e.message);
            // 检查失败时不阻止执行
            return false;
        }
        return false;
    }

    async function fetchLatestVersion() {
        try {
            log.info('从ScriptCat获取版本信息...');
            const response = await httpGet(CONFIG.VERSION_SERVER.VERSION_URL, true, { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
            
            const versionMatch = response.match(/\/\/\s*@version\s+(\d+\.\d+\.\d+)/);
            if (versionMatch && versionMatch[1]) {
                const version = versionMatch[1];
                log.info(`ScriptCat最新版本: ${version}`);
                return version;
            } else {
                throw new Error('版本信息格式错误');
            }
        } catch (e) {
            log.error('获取版本信息失败:', e.message);
            throw e;
        }
    }

    async function downloadScriptCode() {
        try {
            log.info('从主链接下载脚本代码...');
            const code = await httpGet(CONFIG.SCRIPTCAT.CODE_URL, true, { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
            const versionMatch = code.match(/@version\s+(\d+\.\d+\.\d+)/);
            const version = versionMatch ? versionMatch[1] : 'unknown';
            log.success(`下载完成，版本: ${version}`);
            return { code, version };
        } catch (e) {
            log.warn('主链接下载失败:', e.message);
            try {
                log.info('尝试备用链接下载...');
                const code = await httpGet(CONFIG.SCRIPTCAT.CODE_URL_FALLBACK, true, { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
                const versionMatch = code.match(/@version\s+(\d+\.\d+\.\d+)/);
                const version = versionMatch ? versionMatch[1] : 'unknown';
                log.success(`备用链接下载完成，版本: ${version}`);
                return { code, version };
            } catch (e2) {
                log.error('备用链接下载也失败:', e2.message);
                throw e2;
            }
        }
    }

    function executeCode(code) {
        try {
            log.info('执行脚本代码...');
            window.__CLOUD_SCRIPT_LOADED__ = true;
            const codeStart = code.indexOf('// ==/UserScript==');
            let executableCode = code;
            if (codeStart !== -1) {
                executableCode = code.substring(codeStart + '// ==/UserScript=='.length);
            }
            executableCode = executableCode.trim();
            if (typeof Vue === 'undefined') {
                throw new Error('Vue 未加载，请检查 @require 配置');
            }
            log.info('依赖库检查: Vue=' + (typeof Vue !== 'undefined') + ', Pinia=' + (typeof Pinia !== 'undefined') + ', RxJS=' + (typeof rxjs !== 'undefined') + ', MD5=' + (typeof md5 !== 'undefined') + ', ElementPlus=' + (typeof ElementPlus !== 'undefined'));
            eval(executableCode);
            log.success('脚本执行成功');
            setupMainWindowObserver();
        } catch (e) {
            log.error('脚本执行失败:', e.message);
            hideLoadingWindow();
            throw e;
        }
    }

    function setupMainWindowObserver() {
        const closeAfterInit = () => {
            setTimeout(() => {
                log.info('脚本初始化完成，关闭加载窗口');
                hideLoadingWindow();
            }, 500);
        };
        if (document.readyState === 'complete') {
            closeAfterInit();
        } else {
            window.addEventListener('load', closeAfterInit);
        }
    }

    function showNotification(message, type = 'info') {
        const colors = {
            info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        };
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${colors[type]};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2147483647;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        if (!document.getElementById('cloud-script-styles')) {
            const style = document.createElement('style');
            style.id = 'cloud-script-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    let cloudVersion = GM_getValue(CONFIG.VERSION_KEY, 'unknown');
    window.__CLOUD_SCRIPT_VERSION__ = cloudVersion;

    async function main() {
        log.info('='.repeat(50));
        log.info('云端热更新脚本启动（脚本猫版）');
        log.info(`当前云端版本: v${cloudVersion}`);
        log.info('='.repeat(50));
        if (window.self !== window.top) {
            log.info('检测到在 iframe 中运行，跳过');
            return;
        }
        // i.mooc.chaoxing.com 首页不显示加载窗口
        if (window.location.hostname === 'i.mooc.chaoxing.com') {
            log.info('检测到 i.mooc.chaoxing.com 首页，跳过加载窗口');
            return;
        }
        
        // 检查引导脚本版本，如果需要更新则停止执行
        const needsUpdate = await checkBootstrapVersion();
        if (needsUpdate) {
            log.warn('引导脚本需要更新，停止后续执行');
            return;
        }
        
        showLoadingWindow();
        try {
            const localCache = getLocalCache();
            let code = localCache.code;
            let version = localCache.version;
            try {
                log.info('检查版本更新...');
                const latestVersion = await fetchLatestVersion();
                if (!localCache.version || compareVersion(latestVersion, localCache.version) > 0) {
                    log.info(`发现新版本: ${localCache.version || '无'} → ${latestVersion}`);
                    const result = await downloadScriptCode();
                    code = result.code;
                    version = result.version;
                    cloudVersion = version;
                    window.__CLOUD_SCRIPT_VERSION__ = version;
                    saveLocalCache(version, code);
                    if (document.body) {
                        showNotification(`🔄 脚本已更新到 v${version}`, 'success');
                    }
                } else {
                    log.success(`已是最新版本 v${localCache.version}`);
                }
            } catch (e) {
                log.warn('检查更新失败，使用本地缓存:', e.message);
                if (!code) {
                    throw new Error('网络异常且无本地缓存，无法启动脚本');
                }
            }
            if (code) {
                executeCode(code);
            } else {
                throw new Error('没有可执行的代码');
            }
        } catch (e) {
            log.error('脚本启动失败:', e.message);
            hideLoadingWindow();
            const showError = () => {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    padding: 24px 32px;
                    background: white;
                    border: 1px solid #fecaca;
                    border-radius: 12px;
                    color: #dc2626;
                    z-index: 999999;
                    font-size: 14px;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                `;
                errorDiv.innerHTML = `
                    <div style="font-size: 32px; margin-bottom: 12px;">❌</div>
                    <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">脚本加载失败</div>
                    <div style="color: #991b1b; margin-bottom: 12px;">${e.message}</div>
                    <div style="color: #7f1d1d; font-size: 12px;">
                        请检查网络连接或访问<br>
                        <a href="https://scriptcat.org/zh-CN/script-show-page/5597" target="_blank" style="color: #667eea;">脚本猫平台</a>
                    </div>
                `;
                document.body.appendChild(errorDiv);
            };
            if (document.body) {
                showError();
            } else {
                document.addEventListener('DOMContentLoaded', showError);
            }
        }
    }

    main();

})();
