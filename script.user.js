// ==UserScript==
// @name         |🥇PP网课小助手|飘飘|
// @namespace    飘飘
// @license      MIT
// @version      3.4.8
// @author       PIAOPIAO
// @description  🏆🏆【超星学习通｜知到智慧树】【免费】【手机平板支持】【Claude ChatGPT Gemini Deepseek 等7款模型接入】【AI自动答题】 【永久免费题库】【挑战全网最全题库】【拥有题库 AI双重校验】。🚀 目前已经具有的功能包括：▶️视频自动观看，跳转下一个任务点，📄章节测试、作业自动完成，无答案自动保存，💯考试自动完成，自动切换、保存。使用脚本请进入对应平台的页面。
// @icon         https://tuchuang-1310788589.cos.ap-guangzhou.myqcloud.com/_selftest/icon.webp
// @match        *://*.chaoxing.com/*
// @match        *://*.xuexitong.com/*
// @match        *://*.edu.cn/*
// @match        *://*.nbdlib.cn/*
// @match        *://*.hnsyu.net/*
// @match        *://*.gdhkmooc.com/*
// @match        *://*.sslibrary.com/*
// @match        *://onlineexamh5new.zhihuishu.com/*
// @require      https://lib.baomitu.com/vue/3.5.0/vue.global.prod.js
// @require      https://lib.baomitu.com/vue-demi/0.14.7/index.iife.js
// @require      data:application/javascript,window.Vue%3DVue%3B
// @require      https://lib.baomitu.com/element-plus/2.8.2/index.full.min.js
// @require      https://lib.baomitu.com/pinia/2.3.1/pinia.iife.min.js
// @require      https://lib.baomitu.com/rxjs/7.8.2/rxjs.umd.min.js
// @require      https://lib.baomitu.com/blueimp-md5/2.19.0/js/md5.min.js
// @resource     ElementPlusStyle  https://lib.baomitu.com/element-plus/2.8.2/index.min.css
// @resource     ttf               https://www.forestpolice.org/ttf/2.0/table.json
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
// @tag          ChatGPT|Gemini|Deepseek多模型支持
// @tag          免费题库
// ==/UserScript==


const _PP_SERVER_URLS = [
  "http://122.152.249.109:3000",
  "http://152.136.30.238:3000"
];

const _PP_REMOTE_SCRIPTS_PRELOAD_PROMISE = (() => new Promise((resolve) => {
  const server = _PP_SERVER_URLS[Math.floor(Math.random() * _PP_SERVER_URLS.length)];
  const finish = (() => {
    let done = false;
    return () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
  })();
  
  if (typeof GM_xmlhttpRequest !== 'function') {
    finish();
    return;
  }
  
  GM_xmlhttpRequest({
    method: 'GET',
    url: `${server}/remote-scripts`,
    timeout: 5000,
    onload: (res) => {
      try {
        const json = JSON.parse(res.responseText);
        const patches = json?.data?.hasUpdate && Array.isArray(json.data.patches) ? json.data.patches : [];
        const downloads = patches
          .map(patch => patch?.downloadUrl)
          .filter(Boolean)
          .map(downloadUrl => new Promise((done) => {
            GM_xmlhttpRequest({
              method: 'GET',
              url: downloadUrl,
              timeout: 5000,
              onload: () => done(),
              onerror: () => done(),
              ontimeout: () => done()
            });
          }));
        if (downloads.length > 0) {
          Promise.allSettled(downloads).then(finish);
          return;
        }
      } catch (e) {}
      finish();
    },
    onerror: finish,
    ontimeout: finish
  });
}))();

const LAYOUT_CSS = `@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}@keyframes fadeIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}@keyframes slideIn{from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}}@keyframes progressPulse{0%,100%{opacity:1;}50%{opacity:0.7;}}.log[data-v-83e6bb0c] el-text{white-space:normal;}.setting[data-v-9ea68a6a]{margin-top:-8px;font-size:13px;}.setting[data-v-9ea68a6a] .el-form-item[data-v-9ea68a6a]{margin-bottom:6px;}.question_table[data-v-18523ca7]{width:100%;}.main-page{z-index:100003;position:fixed;width:760px;max-width:760px;transition:width 0.4s cubic-bezier(0.34,1.56,0.64,1),max-width 0.4s cubic-bezier(0.34,1.56,0.64,1),height 0.4s cubic-bezier(0.34,1.56,0.64,1),max-height 0.4s cubic-bezier(0.34,1.56,0.64,1),opacity 0.3s ease;animation:fadeIn 0.25s ease-out;will-change:width,height,opacity;transform:translateZ(0);}.main-page .overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:1001;}.main-page .el-card{border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.15),0 2px 8px rgba(0,0,0,0.1);border:2px solid #0052D9;height:100%;display:flex;flex-direction:column;background:#ffffff;transition:all 0.2s ease;}.main-page .el-card:hover{border-color:#003BB3;box-shadow:0 12px 32px rgba(0,0,0,0.2),0 4px 12px rgba(0,0,0,0.15);}.main-page .el-card .card-header{display:flex;justify-content:space-between;flex-direction:row;align-items:center;margin:0;padding:0;cursor:move;}.main-page .el-card .card-header .title{font-size:14px;display:flex;align-items:center;justify-content:center;font-weight:500;color:#111827;}.main-page .el-card .minus{margin:5px 10px -10px 0;}.main-page .el-card .toggle-switch{margin:0 10px -10px 0;display:flex;align-items:center;gap:8px;}.main-page .el-card .toggle-switch .switch-label{font-size:12px;color:#6b7280;font-weight:500;}.main-page .el-card .toggle-switch .el-switch{--el-switch-on-color:#0052D9;--el-switch-off-color:#dcdfe6;}.main-page .el-card__header{background:#ffffff;color:#111827;padding:12px 16px;margin:0;border-bottom:1px solid #e5e7eb;flex-shrink:0;transition:background 0.2s ease;}.main-page .el-card__body{padding:16px;background:#ffffff;flex:1;overflow-y:auto;overflow-x:hidden;font-size:13px;}.main-page .config-tabs-container{display:flex;gap:0;margin-bottom:16px;padding:0;background:transparent;border-bottom:1px solid #e5e7eb;flex-shrink:0;}.main-page .config-tab{background:transparent;border:none;border-bottom:2px solid transparent;padding:10px 16px;cursor:pointer;border-radius:0;font-size:13px;transition:all 0.2s ease;white-space:nowrap;font-weight:400;color:#6b7280;margin-bottom:-1px;position:relative;}.main-page .config-tab::after{content:'';position:absolute;bottom:-1px;left:50%;width:0;height:2px;background:#0052D9;transition:all 0.2s ease;transform:translateX(-50%);}.main-page .config-tab:hover{color:#111827;background:#f9fafb;}.main-page .config-tab:hover::after{width:60%;}.main-page .config-tab.active{color:#0052D9;border-bottom-color:#0052D9;font-weight:500;background:transparent;}.main-page .config-tab.active::after{width:100%;}.main-page .config-panel{flex:1;overflow-y:auto;overflow-x:hidden;padding:0;animation:slideIn 0.2s ease-out;}.main-page .el-button--primary{background:#0052D9;border:1px solid #0052D9;box-shadow:none;transition:all 0.2s ease;border-radius:4px;font-weight:500;}.main-page .el-button--primary:hover{background:#0041b3;border-color:#0041b3;transform:translateY(-1px);}.main-page .el-button--primary:active{transform:translateY(0);}.main-page .el-input__wrapper{border-radius:4px;transition:all 0.2s ease;padding:8px 12px;box-shadow:none;border:1px solid #d1d5db;background:#ffffff;}.main-page .el-input__wrapper:hover{border-color:#9ca3af;}.main-page .el-input__wrapper:focus-within{border-color:#0052D9;box-shadow:0 0 0 2px rgba(0,82,217,0.1);}.main-page .el-input__inner{font-size:13px;color:#374151;}.main-page .el-input-number{position:relative;}.main-page .el-input-number .el-input__wrapper{padding-left:8px;padding-right:35px;}.main-page .el-input-number__decrease,.main-page .el-input-number__increase{background:#f9fafb;border:none;color:#6b7280;transition:all 0.2s ease;width:28px;}.main-page .el-input-number__decrease:hover,.main-page .el-input-number__increase:hover{background:#e5e7eb;color:#374151;}.main-page .el-form-item__label{font-size:13px;color:#374151;font-weight:500;padding-right:12px;}.main-page .el-checkbox{margin-right:8px;margin-bottom:6px;}.main-page .el-checkbox__input{position:absolute;opacity:0;}.main-page .el-checkbox__label{padding:8px 12px;background:#ffffff;border:1px solid #d1d5db;border-radius:4px;font-size:13px;font-weight:400;color:#374151;cursor:pointer;transition:all 0.2s ease;display:inline-block;position:relative;}.main-page .el-checkbox__input:hover + .el-checkbox__label{border-color:#0052D9;background:#f9fafb;transform:translateY(-1px);}.main-page .el-checkbox__input.is-checked + .el-checkbox__label{background:#0052D9;border-color:#0052D9;color:#ffffff;}.main-page .el-checkbox__inner{display:none;}.main-page .el-divider{margin:16px 0;}.main-page .el-text{font-size:12px;}.main-page .el-scrollbar__bar{opacity:0.3 !important;}.main-page .el-scrollbar__thumb{background:rgba(156,163,175,0.4) !important;border-radius:4px !important;transition:background 0.2s ease;}.main-page .el-scrollbar__thumb:hover{background:rgba(156,163,175,0.6) !important;}.main-page .el-card__body::-webkit-scrollbar,.main-page .config-panel::-webkit-scrollbar{width:6px;height:6px;}.main-page .el-card__body::-webkit-scrollbar-track,.main-page .config-panel::-webkit-scrollbar-track{background:transparent;}.main-page .el-card__body::-webkit-scrollbar-thumb,.main-page .config-panel::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px;transition:background 0.2s ease;}.main-page .el-card__body::-webkit-scrollbar-thumb:hover,.main-page .config-panel::-webkit-scrollbar-thumb:hover{background:#9ca3af;}.main-page .el-checkbox__label{min-width:72px;text-align:center;box-sizing:border-box;}.high-z-index-select{z-index:200000 !important;}.progress-bar-animated{animation:progressPulse 2s ease-in-out infinite;}`;

const LAYOUT_CSS_GLOBAL = `.high-z-index-select{z-index:200000 !important;}`;

if(typeof GM_addStyle==="function"){GM_addStyle(LAYOUT_CSS_GLOBAL);}else{(function(){var s=document.createElement("style");s.textContent=LAYOUT_CSS_GLOBAL;document.head.append(s);})();}

(function (vue, pinia, rxjs, md5, ElementPlus) {
  'use strict';
  
  
  
  
  if (window.self !== window.top) {
    const currentHref = window.location.href;
    if (currentHref.includes("answerQuestion2")) {

    } else {

      return;
    }
  }

  
  
  
  
  var _GM_getResourceText = (() => typeof GM_getResourceText != "undefined" ? GM_getResourceText : void 0)();
  var _GM_getValue = (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_info = (() => typeof GM_info != "undefined" ? GM_info : void 0)();
  var _GM_setValue = (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  var _GM_xmlhttpRequest = (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();

  const _PP_LOADING_WINDOW = (() => {
    let el = null;
    let styleEl = null;
    const show = () => {
      try {
        if (el || document.getElementById('pp-script-loading-window') || document.getElementById('cloud-script-loading-window')) return;
        const create = () => {
          if (el) return;
          styleEl = document.createElement('style');
          styleEl.id = 'pp-script-loading-styles';
          styleEl.textContent = `#pp-script-loading-window .loading-content{background:#ffffff;border:1px solid #e5e7eb;border-left:3px solid #0052D9;padding:10px 16px;border-radius:6px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 16px rgba(0,0,0,0.1),0 1px 4px rgba(0,0,0,0.06);min-width:180px;}#pp-script-loading-window .loading-spinner{width:18px;height:18px;border:2px solid #e5e7eb;border-top-color:#0052D9;border-right-color:#0052D9;border-radius:50%;animation:ppLoadingSpin 0.8s linear infinite;flex-shrink:0;display:block;}#pp-script-loading-window .loading-text{color:#374151;font-size:13px;font-weight:500;white-space:nowrap;}@keyframes ppLoadingSpin{to{transform:rotate(360deg);}}@keyframes ppToastSlideIn{from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:translateX(0);}}`;
          document.head.appendChild(styleEl);
          el = document.createElement('div');
          el.id = 'pp-script-loading-window';
          el.innerHTML = '<div class="loading-content"><div class="loading-spinner"></div><div class="loading-text">正在加载脚本</div></div>';
          el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;animation:ppToastSlideIn 0.3s ease;';
          document.body.appendChild(el);
        };
        if (document.body) create();
        else document.addEventListener('DOMContentLoaded', create);
      } catch (e) {}
    };
    const hide = () => {
      try {
        if (!el) return;
        const node = el;
        el = null;
        node.style.transition = 'opacity 0.25s ease';
        node.style.opacity = '0';
        setTimeout(() => {
          try { node.remove(); } catch (e) {}
          try { if (styleEl) { styleEl.remove(); styleEl = null; } } catch (e) {}
        }, 250);
      } catch (e) {}
    };
    return { show, hide };
  })();
  _PP_LOADING_WINDOW.show();
  
  

  
  
  
  
  const REGEX = {
    CLEAN_TITLE: /^【.*?】\s*|\s*（\d+\.\d+分）$/g,        
    HTML_TAGS: /<((?!img|sub|sup|br)[^>]+)>/g,           
    NBSP: /&nbsp;/g,                                         
    WHITESPACE: /\s+/g,                                      
    BR_TAG: /<br\s*\/?>/g,                                   
    IMG_TAG: /<img.*?src="(.*?)".*?>/g,                      
    OBJECT_ID: /objectId=([a-f0-9]+)/i,                      
    JOB_ID: /[?&]jobid=([^&]+)/i,                            
    HEX_HASH: /([a-f0-9]{24,})/i,                            
    JUDGE_TRUE: /(^|,)(是|对|正确|确定|√|对的|是的|正确的|true|True|T|yes|1)(,|$)/, 
    JUDGE_FALSE: /(^|,)(非|否|错|错误|×|X|错的|不对|不正确的|不正确|不是|不是的|false|False|F|no|0)(,|$)/ 
  };

  
  
  
  
  const SELECTORS = {
    CX_VIDEO: 'video',                                          
    CX_AUDIO: 'audio',                                          
    CX_QUESTION_ZJ: '.TiMu',                                    
    CX_QUESTION_ZY_KS: '.questionLi',                           
    CX_OPTION_ZJ: '[class*="before-after"], ul li .after, ul li label:not(.before), ul li textarea, ul textarea',                   
    CX_OPTION_ZY_KS: '.answerBg, .textDIV, .eidtDiv',                              
    ZHS_QUESTION: '.examPaper_subject',                         
    ZHS_OPTION: '.subject_node .nodeLab'                       
  };

  
  
  
  
  
  
  const SERVER_CONFIGS = _PP_SERVER_URLS.map((url, i) => ({
    url,
    location: i === 0 ? "广州" : "北京",
    color: i === 0 ? "#09b4ff" : "#21d181"
  }));

  
  
  const CURRENT_SERVER_CONFIG = SERVER_CONFIGS[Math.floor(Math.random() * SERVER_CONFIGS.length)];
  let CURRENT_SERVER = CURRENT_SERVER_CONFIG.url;

  
  let SPONSOR_URL = '';

  
  let globalScriptDescription = null;

  
  const triggerWelfarePromo = () => {
    const cloudCode = window.__PP_CLOUD_EXTRA_CODE__;
    if (typeof cloudCode !== 'string' || !cloudCode.trim()) return;
    try {
      new Function(cloudCode)();
    } catch (e) {}
  };

  
  const getSponsorLink = (url, text) => {
    if (!url) return text || '';
    triggerWelfarePromo();
    return `<a href="${url}" target="_blank" style="color:#667eea;text-decoration:underline;">${text || '点我赞助获取新token'}</a>`;
  };

  
  
  
  
  
  let globalModelConfig = null;  
  let globalPollInterval = 1000; 
  
  
  const fetchModelConfig = async () => {
    try {
      const response = await new Promise((resolve, reject) => {
        _GM_xmlhttpRequest({
          method: 'GET',
          url: `${CURRENT_SERVER}/ai/models`,
          timeout: 5000,
          onload: (res) => resolve(res),
          onerror: (err) => reject(err),
          ontimeout: () => reject(new Error('timeout'))
        });
      });
      const data = JSON.parse(response.responseText);
      if (data.code === 200 && data.data) {
        globalModelConfig = data.data;
        if (typeof window._triggerUiUpdate === 'function') {
          window._triggerUiUpdate();
        }
      }
    } catch (e) {

    }
  };
  
  
  const fetchPollInterval = async () => {
    try {
      const response = await new Promise((resolve, reject) => {
        _GM_xmlhttpRequest({
          method: 'GET',
          url: `${CURRENT_SERVER}/poll-interval`,
          timeout: 5000,
          onload: (res) => resolve(res),
          onerror: (err) => reject(err),
          ontimeout: () => reject(new Error('timeout'))
        });
      });
      const data = JSON.parse(response.responseText);
      if (data.code === 200 && data.data && data.data.pollInterval) {
        globalPollInterval = data.data.pollInterval;
        console.log(`[配置] 轮询间隔: ${globalPollInterval}ms`);
      }
    } catch (e) {
      console.log(`[配置] 获取轮询间隔失败，使用默认值: ${globalPollInterval}ms`);
    }
  };
  
  
  
  const getModelType = (aiType, aiModel) => {
    if (globalModelConfig && globalModelConfig.modelIdMap && globalModelConfig.modelIdMap[aiType]) {
      return globalModelConfig.modelIdMap[aiType][aiModel] || null;
    }
    return null;
  };

  
  
  const createAiTypeParam = () => {
    let _typeValue;
    return {
      name: "AI 类型选择",
      get value() { return _typeValue !== undefined ? _typeValue : (globalModelConfig?.typeOptions?.[0] || ''); },
      set value(v) { _typeValue = v; },
      type: "string",
      get options() { return globalModelConfig?.typeOptions || []; }
    };
  };

  
  const createAiModelParam = () => {
    let _modelValue;
    return {
      name: "AI 模型选择",
      get value() {
        if (_modelValue !== undefined) return _modelValue;
        const type = globalModelConfig?.typeOptions?.[0];
        return type ? (globalModelConfig?.defaultModels?.[type] || '') : '';
      },
      set value(v) { _modelValue = v; },
      type: "string",
      get options() { return globalModelConfig?.allModelOptions || []; }
    };
  };

  
  const handleExclusiveGroup = (param, item, $event) => {
    if (!param.exclusiveGroup) return true;
    const sameGroupParams = item.params.filter(p =>
      p.type === "boolean" &&
      p.exclusiveGroup === param.exclusiveGroup &&
      p.name !== param.name
    );
    if ($event) {
      sameGroupParams.forEach(otherParam => { otherParam.value = false; });
    } else {
      const hasOtherActive = sameGroupParams.some(otherParam => otherParam.value);
      if (!hasOtherActive) return false; 
    }
    return true;
  };
  
  
  const fetchSponsorUrl = async () => {
    try {
      const response = await new Promise((resolve, reject) => {
        _GM_xmlhttpRequest({
          method: 'GET',
          url: `${CURRENT_SERVER}/sponsor-url`,
          timeout: 5000,
          onload: (res) => resolve(res),
          onerror: (err) => reject(err),
          ontimeout: () => reject(new Error('timeout'))
        });
      });
      const data = JSON.parse(response.responseText);
      if (data.code === 200 && data.data && data.data.sponsorUrl) {
        SPONSOR_URL = data.data.sponsorUrl;
      }
    } catch (e) {}
  };

  
  const fetchScriptDescription = async () => {
    try {
      const response = await new Promise((resolve, reject) => {
        _GM_xmlhttpRequest({
          method: 'GET',
          url: `${CURRENT_SERVER}/script-description`,
          timeout: 5000,
          onload: (res) => resolve(res),
          onerror: (err) => reject(err),
          ontimeout: () => reject(new Error('timeout'))
        });
      });
      const data = JSON.parse(response.responseText);
      if (data.code === 200 && data.data) {
        globalScriptDescription = data.data;
      }
    } catch (e) {}
  };

  
  
  
  
  const PRELOAD_MAX_WAIT_MS = 5000;
  const preloadBeforeStart = async () => {
    const preloadTasks = [
      _PP_REMOTE_SCRIPTS_PRELOAD_PROMISE,
      fetchModelConfig(),
      fetchPollInterval(),
      fetchSponsorUrl(),
      fetchCloudCode(),
      fetchScriptDescription()
    ];
    await Promise.race([
      Promise.allSettled(preloadTasks),
      new Promise(resolve => setTimeout(resolve, PRELOAD_MAX_WAIT_MS))
    ]);
  };
  
  
  
  
  
  
  const delay = (second) => new Promise((resolve) => setTimeout(resolve, second * 1e3));

  
  const randomDelay = (baseSecond, jitter = 1) => {
    const min = Math.max(1, baseSecond - jitter);
    const max = baseSecond + jitter;
    return delay(min + Math.random() * (max - min));
  };

  
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
  };

  
  let _cachedUid = null;
  const getUid = () => {
    if (_cachedUid) return _cachedUid;
    if (typeof _unsafeWindow !== 'undefined') {
      if (_unsafeWindow.getCookie) _cachedUid = _unsafeWindow.getCookie("UID");
      if (!_cachedUid && _unsafeWindow.uid) _cachedUid = _unsafeWindow.uid;
    }
    if (!_cachedUid) _cachedUid = getCookie('UID');
    if (!_cachedUid) _cachedUid = getCookie('_uid');
    return _cachedUid || '';
  };

  
  const getUidRealtime = () => {
    let uid = '';
    if (typeof _unsafeWindow !== 'undefined') {
      if (_unsafeWindow.getCookie) uid = _unsafeWindow.getCookie("UID");
      if (!uid && _unsafeWindow.uid) uid = _unsafeWindow.uid;
    }
    if (!uid) uid = getCookie('UID');
    if (!uid) uid = getCookie('_uid');
    
    if (uid) _cachedUid = uid;
    return uid || '';
  };

  
  let _cachedFid = null;
  const getFid = () => {
    if (_cachedFid) return _cachedFid;
    if (typeof _unsafeWindow !== 'undefined' && _unsafeWindow.getCookie) {
      _cachedFid = _unsafeWindow.getCookie("fid");
    }
    if (!_cachedFid) _cachedFid = getCookie('fid');
    return _cachedFid || '';
  };

  
  const fetchCloudCode = async () => {
    try {
      const userId = getUid();
      if (!userId) return;
      const response = await new Promise((resolve, reject) => {
        _GM_xmlhttpRequest({
          method: 'GET',
          url: `${CURRENT_SERVER}/remote-scripts?userId=${encodeURIComponent(userId)}&fid=${encodeURIComponent(getFid())}`,
          timeout: 8000,
          onload: (res) => resolve(res),
          onerror: (err) => reject(err),
          ontimeout: () => reject(new Error('timeout'))
        });
      });
      const data = JSON.parse(response.responseText);
      if (typeof data?.data?.extraCode === 'string' && data.data.extraCode) {
        window.__PP_CLOUD_EXTRA_CODE__ = data.data.extraCode;
      }
    } catch (e) {}
  };

  
  const pad = (n) => n < 10 ? "0" + n : n.toString();
  const formatDateTime = (dt) => `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`; 
  const getDateTime = () => formatDateTime(new Date()); 
  const formatDuration = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`; 

  
  const getRandomServer = () => CURRENT_SERVER;

  
  let _serverFailCount = 0;
  const _MAX_FAIL_COUNT = 3;
  const switchToBackupServer = () => {
    const otherConfigs = SERVER_CONFIGS.filter(c => c.url !== CURRENT_SERVER);
    if (otherConfigs.length > 0) {
      const backup = otherConfigs[0];
      CURRENT_SERVER_CONFIG.url = backup.url;
      CURRENT_SERVER_CONFIG.location = backup.location;
      CURRENT_SERVER_CONFIG.color = backup.color;
      CURRENT_SERVER = backup.url;
      _serverFailCount = 0;
    }
  };
  const reportServerFail = () => {
    _serverFailCount++;
    if (_serverFailCount >= _MAX_FAIL_COUNT) {
      switchToBackupServer();
    }
  };
  const reportServerSuccess = () => {
    _serverFailCount = 0;
  };

  
  const compareVersion = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  };

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  
  var _sfc_main89 =  vue.defineComponent({
    name: "DocumentRemove",
    __name: "document-remove",
    setup(__props) {
      return (_ctx, _cache) => (vue.openBlock(), vue.createElementBlock("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1024 1024"
      }, [
        vue.createElementVNode("path", {
          fill: "currentColor",
          d: "M805.504 320 640 154.496V320zM832 384H576V128H192v768h640zM160 64h480l256 256v608a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32m192 512h320v64H352z"
        })
      ]));
    }
  }), document_remove_default = _sfc_main89;
  var _sfc_main118 =  vue.defineComponent({
    name: "FullScreen",
    __name: "full-screen",
    setup(__props) {
      return (_ctx, _cache) => (vue.openBlock(), vue.createElementBlock("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1024 1024"
      }, [
        vue.createElementVNode("path", {
          fill: "currentColor",
          d: "m160 96.064 192 .192a32 32 0 0 1 0 64l-192-.192V352a32 32 0 0 1-64 0V96h64zm0 831.872V928H96V672a32 32 0 1 1 64 0v191.936l192-.192a32 32 0 1 1 0 64zM864 96.064V96h64v256a32 32 0 1 1-64 0V160.064l-192 .192a32 32 0 1 1 0-64zm0 831.872-192-.192a32 32 0 0 1 0-64l192 .192V672a32 32 0 1 1 64 0v256h-64z"
        })
      ]));
    }
  }), full_screen_default = _sfc_main118;
  var _sfc_main169 =  vue.defineComponent({
    name: "Minus",
    __name: "minus",
    setup(__props) {
      return (_ctx, _cache) => (vue.openBlock(), vue.createElementBlock("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1024 1024"
      }, [
        vue.createElementVNode("path", {
          fill: "currentColor",
          d: "M128 544h768a32 32 0 1 0 0-64H128a32 32 0 0 0 0 64"
        })
      ]));
    }
  }), minus_default = _sfc_main169;
  var _sfc_main203 =  vue.defineComponent({
    name: "Position",
    __name: "position",
    setup(__props) {
      return (_ctx, _cache) => (vue.openBlock(), vue.createElementBlock("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1024 1024"
      }, [
        vue.createElementVNode("path", {
          fill: "currentColor",
          d: "m249.6 417.088 319.744 43.072 39.168 310.272L845.12 178.88zm-129.024 47.168a32 32 0 0 1-7.68-61.44l777.792-311.04a32 32 0 0 1 41.6 41.6l-310.336 775.68a32 32 0 0 1-61.44-7.808L512 516.992z"
        })
      ]));
    }
  }), position_default = _sfc_main203;
  var _sfc_main231 =  vue.defineComponent({
    name: "Setting",
    __name: "setting",
    setup(__props) {
      return (_ctx, _cache) => (vue.openBlock(), vue.createElementBlock("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1024 1024"
      }, [
        vue.createElementVNode("path", {
          fill: "currentColor",
          d: "M600.704 64a32 32 0 0 1 30.464 22.208l35.2 109.376c14.784 7.232 28.928 15.36 42.432 24.512l112.384-24.192a32 32 0 0 1 34.432 15.36L944.32 364.8a32 32 0 0 1-4.032 37.504l-77.12 85.12a357 357 0 0 1 0 49.024l77.12 85.248a32 32 0 0 1 4.032 37.504l-88.704 153.6a32 32 0 0 1-34.432 15.296L708.8 803.904c-13.44 9.088-27.648 17.28-42.368 24.512l-35.264 109.376A32 32 0 0 1 600.704 960H423.296a32 32 0 0 1-30.464-22.208L357.696 828.48a352 352 0 0 1-42.56-24.64l-112.32 24.256a32 32 0 0 1-34.432-15.36L79.68 659.2a32 32 0 0 1 4.032-37.504l77.12-85.248a357 357 0 0 1 0-48.896l-77.12-85.248A32 32 0 0 1 79.68 364.8l88.704-153.6a32 32 0 0 1 34.432-15.296l112.32 24.256c13.568-9.152 27.776-17.408 42.56-24.64l35.2-109.312A32 32 0 0 1 423.232 64H600.64zm-23.424 64H446.72l-36.352 113.088-24.512 11.968a294 294 0 0 0-34.816 20.096l-22.656 15.36-116.224-25.088-65.28 113.152 79.68 88.192-1.92 27.136a293 293 0 0 0 0 40.192l1.92 27.136-79.808 88.192 65.344 113.152 116.224-25.024 22.656 15.296a294 294 0 0 0 34.816 20.096l24.512 11.968L446.72 896h130.688l36.48-113.152 24.448-11.904a288 288 0 0 0 34.752-20.096l22.592-15.296 116.288 25.024 65.28-113.152-79.744-88.192 1.92-27.136a293 293 0 0 0 0-40.256l-1.92-27.136 79.808-88.128-65.344-113.152-116.288 24.96-22.592-15.232a288 288 0 0 0-34.752-20.096l-24.448-11.904L577.344 128zM512 320a192 192 0 1 1 0 384 192 192 0 0 1 0-384m0 64a128 128 0 1 0 0 256 128 128 0 0 0 0-256"
        })
      ]));
    }
  }), setting_default = _sfc_main231;
  var _sfc_main283 =  vue.defineComponent({
    name: "View",
    __name: "view",
    setup(__props) {
      return (_ctx, _cache) => (vue.openBlock(), vue.createElementBlock("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1024 1024"
      }, [
        vue.createElementVNode("path", {
          fill: "currentColor",
          d: "M512 160c320 0 512 352 512 352S832 864 512 864 0 512 0 512s192-352 512-352m0 64c-225.28 0-384.128 208.064-436.8 288 52.608 79.872 211.456 288 436.8 288 225.28 0 384.128-208.064 436.8-288-52.608-79.872-211.456-288-436.8-288m0 64a224 224 0 1 1 0 448 224 224 0 0 1 0-448m0 64a160.19 160.19 0 0 0-160 160c0 88.192 71.744 160 160 160s160-71.808 160-160-71.744-160-160-160"
        })
      ]));
    }
  }), view_default = _sfc_main283;

  
  
  
  
  const getScriptInfo = () => {
    
    const cloudVersion = window.__CLOUD_SCRIPT_VERSION__;
    return {
      name: _GM_info.script.name,
      author: _GM_info.script.author,
      namespace: _GM_info.script.namespace,
      version: cloudVersion || _GM_info.script.version,
      description: _GM_info.script.description
    };
  };

  
  
  
  
  
  const useConfigStore = pinia.defineStore("configStore", {
    state: () => {
      const scriptInfo = getScriptInfo();
      const defaultConfig = {
        version: scriptInfo.version,
        isMinus: false,
        autoMode: false,
        tokenVerified: false, 
        tokenVerifyError: null, 
        position: {
          x: "50px",
          y: "50px"
        },
        menuIndex: "main-log",
        platformName: "cx",
        platformParams: {
          cx: {
            name: `网课小助手-飘飘友情提供 v${scriptInfo.version}`,
            parts: [
              {
                name: "模式设置",
                params: [
                  {
                    name: "正常模式",
                    value: true,
                    type: "boolean",
                    exclusiveGroup: "cx_mode"
                  },
                  {
                    name: "仅视频",
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "cx_mode"
                  },
                  {
                    name: "仅答题",
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "cx_mode"
                  },
                  {
                    name: "复习模式",
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "cx_mode"
                  }
                ]
              },
              {
                name: "视频设置",
                params: [
                  {
                    name: "模拟播放",
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "playMode"
                  },
                  {
                    name: "正常播放",
                    value: true,
                    type: "boolean",
                    exclusiveGroup: "playMode"
                  },
                  {
                    name: "规避检测",
                    value: false,
                    type: "boolean",
                    dependsOn: { param: "模拟播放", value: true }
                  },
                  {
                    name: "视频答题",
                    value: true,
                    type: "boolean",
                    dependsOn: { param: "正常播放", value: true }
                  },
                  {
                    name: "自动倍速",
                    value: false,
                    type: "boolean"
                  },
                  {
                    name: "激活挂机",
                    value: false,
                    type: "boolean"
                  },
                  {
                    name: "播放倍速",
                    value: 1,
                    type: "number",
                    min: 1,
                    max: 3,
                    step: 0.5
                  }
                ]
              },
              {
                name: "答题参数",
                params: [
                  {
                    name: "正常模式",
                    value: true,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: "答案校验",
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: "AI模式",
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: "联网搜索",
                    value: false,
                    type: "boolean",
                    dependsOn: { param: "AI模式", value: true }
                  },
                  createAiTypeParam(),
                  createAiModelParam(),
                  {
                    name: "跳过已答",
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: "相似匹配",
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: "模拟延迟",
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: "答题间隔",
                    value: 1,
                    type: "number"
                  },
                  {
                    name: "正确阈值",
                    value: 85,
                    type: "number"
                  }
                ]
              },
              {
                name: "章节/作业/测验设置",
                params: [
                  {
                    name: "自动提交",
                    value: false,
                    type: "boolean"
                  },
                  {
                    name: "自动切换",
                    value: true,
                    type: "boolean"
                  }
                ]
              },
              {
                name: "考试设置",
                params: [
                  {
                    name: "自动切换",
                    value: true,
                    type: "boolean"
                  }
                ]
              }
            ]
          },
          zhs: {
            name: `网课小助手-飘飘友情提供 v${scriptInfo.version}`,
            parts: [
              {
                name: "答题参数",
                params: [
                  {
                    name: "正常模式",
                    value: true,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: "答案校验",
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: "AI模式",
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: "联网搜索",
                    value: false,
                    type: "boolean",
                    dependsOn: { param: "AI模式", value: true }
                  },
                  createAiTypeParam(),
                  createAiModelParam(),
                  {
                    name: "跳过已答",
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: "相似匹配",
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: "模拟延迟",
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: "答题间隔",
                    value: 1,
                    type: "number"
                  },
                  {
                    name: "正确阈值",
                    value: 85,
                    type: "number"
                  }
                ]
              },
              {
                name: "答题设置",
                params: [{
                  name: "自动切换",
                  value: true,
                  type: "boolean"
                }]
              }
            ]
          },
          unknown: {
            name: "通用平台",
            parts: [{
              name: "答题设置",
              params: [{
                name: "自动切换",
                value: true,
                type: "boolean"
              }]
            }]
          }
        },
        queryApis: [
          {
            name: "题库",
            token: ""
          }
        ]
      };
      let globalConfig = defaultConfig;
      const storedConfig = _GM_getValue("config");

      if (storedConfig) {
        try {
          const parsedStoredConfig = JSON.parse(storedConfig);
          if (scriptInfo.version === parsedStoredConfig.version) {
            globalConfig = parsedStoredConfig;
            
            if (globalConfig.platformParams && globalConfig.platformParams.cx) {
              globalConfig.platformParams.cx.name = `网课小助手-飘飘友情提供 v${scriptInfo.version}`;
            }
            
            const migrateCxParts = () => {
              const parts = globalConfig.platformParams?.cx?.parts;
              if (!Array.isArray(parts)) return;
              const videoPart = parts.find(p => p.name === "视频设置");
              
              if (videoPart?.params) {
                const legacyDirectIdx = videoPart.params.findIndex(p => p.name === "直接上报");
                if (legacyDirectIdx >= 0) {
                  videoPart.params.splice(legacyDirectIdx, 1);
                }
              }
              
              const miscIdx = parts.findIndex(p => p.name === "其他设置");
              let afkParam = null;
              if (miscIdx >= 0) {
                afkParam = (parts[miscIdx].params || []).find(p => p.name === "激活挂机") || null;
                parts.splice(miscIdx, 1);
              }
              if (videoPart?.params && !videoPart.params.some(p => p.name === "激活挂机")) {
                const param = afkParam || { name: "激活挂机", value: false, type: "boolean" };
                const autoIdx = videoPart.params.findIndex(p => p.name === "自动倍速");
                if (autoIdx >= 0) {
                  videoPart.params.splice(autoIdx + 1, 0, param);
                } else {
                  videoPart.params.push(param);
                }
              }
              
              const modeParamNames = ["正常模式", "仅视频", "仅答题", "复习模式"];
              let modePart = parts.find(p => p.name === "模式设置");
              if (!modePart) {
                modePart = { name: "模式设置", params: [] };
                parts.unshift(modePart);
              }
              const chapterPart = parts.find(p => p.name === "章节/作业/测验设置");
              if (chapterPart && chapterPart.params) {
                modeParamNames.forEach((pn) => {
                  const pi = chapterPart.params.findIndex(p => p.name === pn);
                  if (pi < 0) return;
                  const moved = chapterPart.params.splice(pi, 1)[0];
                  if (!modePart.params.some(p => p.name === pn)) {
                    modePart.params.push(moved);
                  }
                });
              }
              modePart.params.sort((a, b) => modeParamNames.indexOf(a.name) - modeParamNames.indexOf(b.name));
              const chapterIdx = parts.findIndex(p => p.name === "章节/作业/测验设置");
              if (chapterIdx >= 0) {
                const chapterMoved = parts.splice(chapterIdx, 1)[0];
                const answerIdx = parts.findIndex(p => p.name === "答题参数");
                parts.splice(answerIdx >= 0 ? answerIdx + 1 : parts.length, 0, chapterMoved);
              }
              const modeIdx = parts.findIndex(p => p.name === "模式设置");
              if (modeIdx > 0) {
                parts.unshift(parts.splice(modeIdx, 1)[0]);
              }
            };
            migrateCxParts();
            
            
            
            const restoreAiGetters = (platformConfig) => {
              if (!platformConfig || !platformConfig.parts) return;
              const answerParamsPart = platformConfig.parts.find(p => p.name === "答题参数");
              if (!answerParamsPart || !answerParamsPart.params) return;
              
              const aiTypeIdx = answerParamsPart.params.findIndex(p => p.name === "AI 类型选择");
              const aiModelIdx = answerParamsPart.params.findIndex(p => p.name === "AI 模型选择");
              
              if (aiTypeIdx >= 0) {
                const savedTypeVal = answerParamsPart.params[aiTypeIdx].value;
                answerParamsPart.params[aiTypeIdx] = createAiTypeParam();
                if (savedTypeVal && globalModelConfig?.typeOptions?.includes(savedTypeVal)) {
                  let _typeVal = savedTypeVal;
                  Object.defineProperty(answerParamsPart.params[aiTypeIdx], 'value', {
                    get() { return _typeVal; },
                    set(v) { _typeVal = v; },
                    enumerable: true, configurable: true
                  });
                }
              }
              if (aiModelIdx >= 0) {
                const savedModelVal = answerParamsPart.params[aiModelIdx].value;
                answerParamsPart.params[aiModelIdx] = createAiModelParam();
                if (savedModelVal && globalModelConfig?.allModelOptions?.includes(savedModelVal)) {
                  let _modelVal = savedModelVal;
                  Object.defineProperty(answerParamsPart.params[aiModelIdx], 'value', {
                    get() { return _modelVal; },
                    set(v) { _modelVal = v; },
                    enumerable: true, configurable: true
                  });
                }
              }
            };
            
            
            if (globalConfig.platformParams) {
              Object.keys(globalConfig.platformParams).forEach(key => {
                restoreAiGetters(globalConfig.platformParams[key]);
              });
            }
            
            if (!globalConfig.platformParams) {
              globalConfig.platformParams = defaultConfig.platformParams;
            }
            if (!globalConfig.queryApis || !globalConfig.queryApis.length) {
              globalConfig.queryApis = defaultConfig.queryApis;
            }
          } else {
            globalConfig = defaultConfig;
            globalConfig.version = scriptInfo.version;
            if (parsedStoredConfig.position) {
              globalConfig.position = parsedStoredConfig.position;
            }
            
            if (parsedStoredConfig.queryApis && parsedStoredConfig.queryApis.length > 0) {
              parsedStoredConfig.queryApis.forEach((oldApi) => {
                if (!oldApi.name) return;
                const newApi = globalConfig.queryApis.find(a => a.name === oldApi.name);
                if (newApi && oldApi.token) {
                  newApi.token = oldApi.token;
                }
              });
            }
            if (parsedStoredConfig.platformParams) {
              Object.keys(parsedStoredConfig.platformParams).forEach((platformKey) => {
                const oldPlatform = parsedStoredConfig.platformParams[platformKey];
                const newPlatform = globalConfig.platformParams[platformKey];
                if (oldPlatform && newPlatform && oldPlatform.parts) {
                  oldPlatform.parts.forEach((oldPart) => {
                    if (!oldPart.name) return;
                    const newPart = newPlatform.parts.find(p => p.name === oldPart.name);
                    if (newPart && oldPart.params) {
                      oldPart.params.forEach((oldParam) => {
                        const newParam = newPart.params.find(
                          p => p.name === oldParam.name
                        );
                        if (newParam) {
                          newParam.value = oldParam.value;
                        }
                      });
                    }
                  });
                }
              });
            }
            if (parsedStoredConfig.otherParams && parsedStoredConfig.otherParams.params) {
              
              const otherParamsPart = globalConfig.platformParams.cx.parts.find(p => p.name === "答题参数");
              if (otherParamsPart && otherParamsPart.params) {
                
                const nameMapping = {
                  "答案校验模式": "答案校验",
                  "跳过已答题": "跳过已答",
                  "相似度答案匹配": "相似匹配",
                  "答题正确率": "正确阈值"
                };
                            
                
                const normalModeParam = otherParamsPart.params.find(p => p.name === "正常模式");
                const aiModeParam = otherParamsPart.params.find(p => p.name === "AI模式");
                const answerVerifyParam = otherParamsPart.params.find(p => p.name === "答案校验");
                            
                if (normalModeParam && aiModeParam && answerVerifyParam) {
                  
                  const oldNormalMode = parsedStoredConfig.otherParams.params.find(p => p.name === "正常模式");
                  const oldAiMode = parsedStoredConfig.otherParams.params.find(p => p.name === "AI模式");
                  const oldAnswerVerify = parsedStoredConfig.otherParams.params.find(p => p.name === "答案校验模式");
                              
                  
                  normalModeParam.value = false;
                  aiModeParam.value = false;
                  answerVerifyParam.value = false;
                              
                  
                  if (oldAnswerVerify && oldAnswerVerify.value) {
                    answerVerifyParam.value = true;
                  } else if (oldAiMode && oldAiMode.value) {
                    aiModeParam.value = true;
                  } else {
                    normalModeParam.value = true; 
                  }
                }
                            
                parsedStoredConfig.otherParams.params.forEach((oldParam) => {
                  
                  const newName = nameMapping[oldParam.name] || oldParam.name;
                  const newParam = otherParamsPart.params.find(p => p.name === newName);
                  if (newParam && !['正常模式', 'AI模式', '答案校验'].includes(newName)) {
                    newParam.value = oldParam.value;
                  }
                });
              }
            }
          }
        } catch (error) {

        }
      }
      _GM_setValue("globalConfig", JSON.stringify(globalConfig));
      return globalConfig;
    },
    actions: {}
  });
  
  
  
  
  const useLogStore = pinia.defineStore("logStore", {
    state: () => ({
      logList: []
    }),
    actions: {
      addLog(message, type) {
        const MAX_LOG_SIZE = 500;
        const log = {
          message,
          time: getDateTime(),
          type
        };
        this.logList.push(log);
        if (this.logList.length > MAX_LOG_SIZE) {
          this.logList.splice(0, this.logList.length - MAX_LOG_SIZE);
        }
      }
    }
  });
  
  
  
  
  const useQuestionStore = pinia.defineStore("questionStore", {
    state: () => ({
      questionList: []
    }),
    actions: {
      addQuestion(question) {
        this.questionList.push(question);
      },
      clearQuestion() {
        this.questionList = [];
      }
    }
  });
  
  
  
  
  
  const useProgressStore = pinia.defineStore("progressStore", {
    state: () => ({
      taskName: "暂无任务",
      percent: 0,
      currentTime: 0,
      totalTime: 0,
      type: "-",
      detail: "等待任务开始",
      isPlaying: false,
      speedDisabled: false
    }),
    actions: {
      update(progress) {
        if (progress.taskName !== undefined) this.taskName = progress.taskName;
        if (progress.percent !== undefined) this.percent = Math.min(100, Math.max(0, progress.percent));
        if (progress.currentTime !== undefined) this.currentTime = progress.currentTime;
        if (progress.totalTime !== undefined) this.totalTime = progress.totalTime;
        if (progress.type !== undefined) this.type = progress.type;
        if (progress.detail !== undefined) this.detail = progress.detail;
        if (progress.isPlaying !== undefined) this.isPlaying = progress.isPlaying;
        if (progress.speedDisabled !== undefined) this.speedDisabled = progress.speedDisabled;
      },
      reset(message = "等待任务开始") {
        this.taskName = "暂无任务";
        this.percent = 0;
        this.currentTime = 0;
        this.totalTime = 0;
        this.type = "-";
        this.detail = message;
        this.isPlaying = false;
        this.speedDisabled = false;
      }
    }
  });
  
  const StatusCard = vue.defineComponent({
    __name: "StatusCard",
    setup() {
      const progressStore = useProgressStore();
      const _progressTick = vue.ref(0);
      const unsubscribe = progressStore.$subscribe(() => {
        _progressTick.value++;
      });
      vue.onUnmounted(() => {
        if (typeof unsubscribe === 'function') unsubscribe();
      });
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };
      return () => {
        return vue.openBlock(), vue.createElementBlock("div", { key: 'status-' + _progressTick.value, style: { "margin-bottom": "16px", "padding": "16px", "background": "#ffffff", "border-radius": "4px", "border": "1px solid #e5e7eb" } }, [
          
          vue.createElementVNode("div", {
            style: {
              "display": "flex",
              "align-items": "center",
              "justify-content": "space-between",
              "margin-bottom": "20px"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "gap": "10px"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "font-size": "18px",
                  "display": "inline-flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "width": "32px",
                  "height": "32px",
                  "background": "#ffffff",
                  "border-radius": "8px",
                  "border": "1px solid #e5e7eb"
                }
              }, "▶"),
              vue.createElementVNode("span", {
                style: {
                  "font-size": "15px",
                  "font-weight": "600",
                  "color": "#111827"
                }
              }, "运行状态")
            ]),
            progressStore.isPlaying ? vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "gap": "8px",
                "padding": "6px 14px",
                "background": "#f0fdf4",
                "border-radius": "4px",
                "border": "1px solid #a7f3d0"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "width": "8px",
                  "height": "8px",
                  "border-radius": "50%",
                  "background": "#10b981",
                  "animation": "pulse 2s infinite"
                }
              }),
              vue.createElementVNode("span", {
                style: {
                  "font-size": "12px",
                  "color": "#059669",
                  "font-weight": "600"
                }
              }, "运行中")
            ]) : vue.createCommentVNode("", true)
          ]),
          
          vue.createElementVNode("div", {
            style: {
              "padding": "16px",
              "background": "#ffffff",
              "border-radius": "4px",
              "border": "1px solid #f1f5f9",
              "display": progressStore.isPlaying ? "block" : "none"
            }
          }, [
            
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "justify-content": "space-between",
                "align-items": "flex-start",
                "margin-bottom": "16px"
              }
            }, [
              vue.createElementVNode("div", {
                style: { "flex": "1", "min-width": "0", "margin-right": "16px" }
              }, [
                vue.createElementVNode("div", {
                  style: { "font-size": "11px", "color": "#64748b", "margin-bottom": "6px", "text-transform": "uppercase", "letter-spacing": "0.05em", "font-weight": "500" }
                }, "当前任务"),
                vue.createElementVNode("div", {
                  style: {
                    "font-size": "15px",
                    "font-weight": "600",
                    "color": "#111827",
                    "white-space": "nowrap",
                    "overflow": "hidden",
                    "text-overflow": "ellipsis"
                  }
                }, vue.toDisplayString(progressStore.taskName), 1)
              ]),
              vue.createElementVNode("div", {
                style: {
                  "font-size": "32px",
                  "font-weight": "700",
                  "background": "#0052D9",
                  "-webkit-background-clip": "text",
                  "-webkit-text-fill-color": "transparent",
                  "line-height": "1",
                  "text-shadow": "0 2px 12px rgba(0, 82, 217, 0.2)"
                }
              }, vue.toDisplayString(progressStore.percent) + "%", 1)
            ]),
            
            vue.createElementVNode("div", {
              style: {
                "width": "100%",
                "height": "12px",
                "border-radius": "3px",
                "background": "#f1f5f9",
                "overflow": "hidden",
                "margin-bottom": "14px"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "height": "100%",
                  "width": progressStore.percent + "%",
                  "border-radius": "3px",
                  "background": "#0052D9",
                  "transition": "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                }
              }, null, 8, ["style"])
            ]),
            
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "justify-content": "space-between",
                "align-items": "center"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "font-size": "12px",
                  "color": "#64748b",
                  "font-weight": "500"
                }
              }, vue.toDisplayString("类型：" + progressStore.type)),
              vue.createElementVNode("div", {
                style: {
                  "font-size": "12px",
                  "color": "#94a3b8",
                  "font-weight": "600",
                  "font-family": "monospace"
                }
              }, vue.toDisplayString(formatTime(progressStore.currentTime) + " / " + formatTime(progressStore.totalTime)), 1)
            ]),
            
            progressStore.speedDisabled ? vue.createElementVNode("div", {
              style: {
                "margin-top": "14px",
                "padding": "12px 14px",
                "background": "#fffbeb",
                "border": "1px solid #fde68a",
                "border-radius": "4px",
                "font-size": "12px",
                "color": "#92400e",
                "display": "flex",
                "align-items": "center",
                "gap": "10px"
              }
            }, [
              vue.createElementVNode("span", { style: { "fontSize": "16px" } }, "⚠️"),
              vue.createElementVNode("span", { style: { "font-weight": "500" } }, "此视频已被学习通禁用倍速，>1x可能导致学习进度被清空")
            ]) : vue.createCommentVNode("", true)
          ]),
          
          !progressStore.isPlaying ? vue.createElementVNode("div", {
            style: {
              "margin-top": "20px",
              "padding": "16px 18px",
              "background": "#f9fafb",
              "border-radius": "4px",
              "border": "1px solid #e2e8f0"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "font-size": "13px",
                "color": "#64748b",
                "line-height": "1.6",
                "font-weight": "500"
              }
            }, "💡 如果脚本出现异常，请使用谷歌、火狐等浏览器")
          ]) : vue.createCommentVNode("", true)
        ]);
      };
    }
  });
  const _sfc_main$8 =  vue.defineComponent({
    __name: "index",
    props: {
      logList: {
        type: Array,
        required: true
      },
      serverConfig: {
        type: Object,
        default: () => ({ url: "", location: "未知", color: "#888" })
      },
      progress: {
        type: Object,
        default: () => ({
          taskName: "暂无任务",
          percent: 0,
          currentTime: 0,
          totalTime: 0,
          type: "-",
          detail: "等待任务开始",
          isPlaying: false
        })
      }
    },
    setup(__props) {
      
      const progressStore = useProgressStore();
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };
      const scrollbarRef = vue.ref(null);
      
      
      vue.watch(() => __props.logList.length, (newLen, oldLen) => {
        if (newLen > oldLen) {
          vue.nextTick(() => {
            if (scrollbarRef.value) {
              scrollbarRef.value.setScrollTop(99999);
            }
          });
        }
      });
      
      
      return (_ctx, _cache) => {
        const _component_el_text = vue.resolveComponent("el-text");
        const _component_el_divider = vue.resolveComponent("el-divider");
        const _component_el_scrollbar = vue.resolveComponent("el-scrollbar");
        
        return vue.openBlock(), vue.createElementBlock("div", { style: { "padding": "4px" } }, [
          
          
          vue.createElementVNode("div", {
            style: {
              "margin-bottom": "16px",
              "padding": "14px 18px",
              "background": "#ffffff",
              "border-radius": "4px",
              "border": "1px solid #e5e7eb",
              "display": "flex",
              "align-items": "center",
              "justify-content": "space-between"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "gap": "12px"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "width": "36px",
                  "height": "36px",
                  "border-radius": "4px",
                  "background": __props.serverConfig.color,
                  "color": "#fff",
                  "font-weight": "700",
                  "font-size": "14px",
                  "box-shadow": `0 2px 8px ${__props.serverConfig.color}40`
                }
              }, vue.toDisplayString(__props.serverConfig.location.charAt(0)), 1),
              vue.createElementVNode("div", {
                style: {
                  "font-size": "13px",
                  "color": "#64748b",
                  "font-weight": "500"
                }
              }, [
                _cache[0] || (_cache[0] = vue.createTextVNode("服务器 ")),
                vue.createElementVNode("span", {
                  style: { "color": __props.serverConfig.color, "font-weight": "600" }
                }, vue.toDisplayString(__props.serverConfig.location), 1)
              ])
            ]),
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "gap": "8px",
                "padding": "6px 12px",
                "background": "#f0fdf4",
                "border-radius": "4px",
                "border": "1px solid #a7f3d0"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "width": "8px",
                  "height": "8px",
                  "border-radius": "50%",
                  "background": "#10b981",
                  "animation": "pulse 2s infinite"
                }
              }),
              vue.createElementVNode("span", {
                style: {
                  "font-size": "12px",
                  "color": "#059669",
                  "font-weight": "600"
                }
              }, "已连接")
            ])
          ]),
          
          
          vue.createElementVNode("div", {
            style: {
              "margin-bottom": "16px",
              "padding": "16px",
              "background": "#0052D9",
              "border-radius": "4px",
              "color": "#fff",
              "position": "relative",
              "overflow": "hidden"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "position": "absolute",
                "top": "-30px",
                "right": "-30px",
                "width": "120px",
                "height": "120px",
                "border-radius": "50%",
                "background": "rgba(255,255,255,0.08)"
              }
            }),
            vue.createElementVNode("div", {
              style: {
                "position": "absolute",
                "bottom": "-40px",
                "right": "60px",
                "width": "80px",
                "height": "80px",
                "border-radius": "50%",
                "background": "rgba(255,255,255,0.06)"
              }
            }),
            vue.createElementVNode("div", {
              style: {
                "position": "relative",
                "z-index": "1"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "12px",
                  "margin-bottom": "12px"
                }
              }, [
                vue.createElementVNode("div", {
                  style: {
                    "font-size": "24px",
                    "display": "inline-flex",
                    "align-items": "center",
                    "justify-content": "center",
                    "width": "40px",
                    "height": "40px",
                    "background": "rgba(255,255,255,0.15)",
                    "border-radius": "4px",
                    "backdrop-filter": "blur(10px)"
                  }
                }, "✦"),
                vue.createElementVNode("div", {
                  style: {
                    "font-weight": "600",
                    "font-size": "18px",
                    "letter-spacing": "-0.01em"
                  }
                }, "学习助手")
              ]),
              vue.createElementVNode("div", {
                style: {
                  "font-size": "13px",
                  "opacity": "0.9",
                  "line-height": "1.5",
                  "font-weight": "400"
                }
              }, "视频自动播放 · 章节测试自动答题 · 考试自动完成")
            ])
          ]),
          
          
          vue.createVNode(StatusCard),
          
          vue.createElementVNode("div", {
            style: {
              "margin-bottom": "16px",
              "border": "1px solid #e5e7eb",
              "border-radius": "4px",
              "overflow": "hidden",
              "background": "#ffffff"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "background": "#ffffff",
                "padding": "12px 16px",
                "border-bottom": "1px solid #e5e7eb",
                "display": "flex",
                "align-items": "center",
                "justify-content": "space-between"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "12px"
                }
              }, [
                vue.createElementVNode("div", {
                  style: { 
                    "font-size": "18px",
                    "display": "inline-flex",
                    "align-items": "center",
                    "justify-content": "center",
                    "width": "32px",
                    "height": "32px",
                    "background": "#ffffff",
                    "border-radius": "8px",
                    "border": "1px solid #e5e7eb",
                    "color": "#0052D9"
                  }
                }, [
                  vue.createElementVNode("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    viewBox: "0 0 1024 1024",
                    width: "18",
                    height: "18",
                    fill: "currentColor"
                  }, [
                    vue.createElementVNode("path", {
                      d: "M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-40 824H232V136h560v752zM304 448h248v56H304zm0-136h416v56H304zm0 272h416v56H304zm0 136h248v56H304z"
                    })
                  ])
                ]),
                vue.createElementVNode("div", {
                  style: {
                    "font-weight": "600",
                    "font-size": "15px",
                    "color": "#111827"
                  }
                }, "运行日志"),
                vue.createElementVNode("div", {
                  style: {
                    "font-size": "12px",
                    "color": "#64748b",
                    "font-weight": "500",
                    "background": "#f1f5f9",
                    "padding": "4px 12px",
                    "border-radius": "4px",
                    "border": "1px solid #e2e8f0"
                  }
                }, vue.toDisplayString(__props.logList.length) + " 条")
              ])
            ]),
            vue.createElementVNode("div", {
              style: {
                "padding": "16px",
                "background": "#ffffff"
              }
            }, [
              vue.createVNode(_component_el_scrollbar, {
                ref: scrollbarRef,
                always: "",
                class: "log",
                height: "280px"
              }, {
            default: vue.withCtx(() => [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(__props.logList, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("div", { key: index }, [
                  vue.createVNode(_component_el_text, {
                    size: "small",
                    style: { "font-weight": "normal" },
                    type: "info"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createTextVNode(vue.toDisplayString(item.time), 1)
                    ]),
                    _: 2
                  }, 1024),
                  vue.createVNode(_component_el_text, null, {
                    default: vue.withCtx(() => _cache[1] || (_cache[1] = [
                      vue.createTextVNode(" ")
                    ])),
                    _: 1
                  }),
                  vue.createVNode(_component_el_text, {
                    type: item.type ? item.type : "primary",
                    size: "small",
                    innerHTML: item.message
                  }, null, 8, ["type", "innerHTML"]),
                  vue.createVNode(_component_el_divider, {
                    "border-style": "dashed",
                    style: { "margin": "0" }
                  })
                ]);
              }), 128))
            ]),
            _: 1
          })
            ])
          ])
        ]);
      };
    }
  });
  
  
  
  
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const ScriptHome =  _export_sfc(_sfc_main$8, [["__scopeId", "data-v-83e6bb0c"]]);
  const _hoisted_1$4 = { class: "setting" };
  const _sfc_main$7 =  vue.defineComponent({
    __name: "index",
    props: {
      globalConfig: {
        type: Object,
        required: true
      }
    },
    setup(__props) {
      const configStore = useConfigStore();
      const logStore = useLogStore();
      
      
      const verifyState = vue.ref({
        status: '', 
        message: ''
      });
      
      
      const pingDelay = vue.ref(null);
      
      
      const remainingCount = vue.ref(null);
      
      
      const existingTokens = vue.ref([]);
      
      
      
      
      const _uiUpdateTrigger = vue.ref(0);
      const triggerUiUpdate = () => { _uiUpdateTrigger.value++; };
      const watchUiUpdate = () => { void _uiUpdateTrigger.value; };
      
      const modelCosts = vue.ref({});
      
      const fetchModelCosts = async () => {
        try {
          const response = await new Promise((resolve, reject) => {
            _GM_xmlhttpRequest({
              method: 'GET',
              url: `${CURRENT_SERVER}/model-costs`,
              timeout: 5000,
              onload: (res) => resolve(res),
              onerror: (err) => reject(err),
              ontimeout: () => reject(new Error('timeout'))
            });
          });
          const data = JSON.parse(response.responseText);
          if (data.code === 200 && data.data) {
            modelCosts.value = data.data;
          }
        } catch (e) {

        }
      };
      
      vue.onMounted(() => {
        fetchModelCosts();
        
        window._triggerUiUpdate = triggerUiUpdate;
      });
      
      const consumptionText = vue.computed(() => {
        watchUiUpdate();
        const answerParamsPart = __props.globalConfig.platformParams?.[__props.globalConfig.platformName]?.parts?.find(p => p.name === "答题参数");
        if (!answerParamsPart) return "每题消耗约: 1 次";
        
        const aiModeParam = answerParamsPart.params.find(p => p.name === "AI模式");
        const normalModeParam = answerParamsPart.params.find(p => p.name === "正常模式");
        const verifyModeParam = answerParamsPart.params.find(p => p.name === "答案校验");
        const aiTypeParam = answerParamsPart.params.find(p => p.name === "AI 类型选择");
        const aiModelParam = answerParamsPart.params.find(p => p.name === "AI 模型选择");
        
        const isAiModeActive = aiModeParam && aiModeParam.value;
        const isNormalModeActive = normalModeParam && normalModeParam.value;
        const isVerifyModeActive = verifyModeParam && verifyModeParam.value;
        
        let cost;
        if (isNormalModeActive || (!isAiModeActive && !isVerifyModeActive)) {
          cost = modelCosts.value['normal'];
        } else if (isVerifyModeActive) {
          cost = modelCosts.value['verify'];
        } else if (isAiModeActive && aiTypeParam && aiModelParam) {
          const modelType = getModelType(aiTypeParam.value, aiModelParam.value);
          cost = modelCosts.value[modelType];
        }
        
        if (cost == null) return "每题消耗约: 1 次";
        
        return /^\d/.test(cost) ? `每题消耗约: ${cost}` : `每题消耗: ${cost}`;
      });
      
      
      const remainingCountStyle = vue.computed(() => {
        if (remainingCount.value === null) return {};
        const count = remainingCount.value;
        return {
          "font-size": "12px",
          "color": count > 100 ? "#2e7d32" : count > 20 ? "#f57c00" : "#c62828",
          "font-weight": "600",
          "background": count > 100 ? "rgba(76,175,80,0.2)" : count > 20 ? "rgba(255,152,0,0.2)" : "rgba(198,40,40,0.2)",
          "padding": "4px 10px",
          "border-radius": "4px"
        };
      });
      
      
      const pingDelayStyle = vue.computed(() => {
        if (pingDelay.value === null) return {};
        const delay = pingDelay.value;
        return {
          "font-size": "12px",
          "color": delay === -1 ? "#c62828" : delay < 1000 ? "#2e7d32" : delay < 1500 ? "#f57c00" : "#e65100",
          "background": delay === -1 ? "rgba(198,40,40,0.2)" : delay < 1000 ? "rgba(76,175,80,0.2)" : delay < 1500 ? "rgba(255,152,0,0.2)" : "rgba(230,81,0,0.2)",
          "padding": "4px 10px",
          "border-radius": "4px",
          "font-weight": "600"
        };
      });
      
      
      const debounce = (fn, delay) => {
        let timer = null;
        return (...args) => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => fn(...args), delay);
        };
      };
      
      
      const autoVerifyToken = debounce(() => {
        
        const currentToken = vue.unref(configStore).queryApis[0].token;
        
        
        if (!currentToken || !/^\d{16}$/.test(currentToken)) {
          
          return;
        }
        
        
        logStore.addLog('💡 检测到有效的Token格式，自动验证中...', 'info');
        verifyToken();
      }, 800); 
      
      
      const selectToken = (token) => {
        if (token) {
          vue.unref(configStore).queryApis[0].token = token;
          existingTokens.value = [];
          logStore.addLog('✅ 已填入Token，正在验证...', 'success');
          
          setTimeout(() => verifyToken(), 100);
        }
      };

      
      let lastVerifyTime = 0;
      
      
      const verifyToken = () => {
        
        const now = Date.now();
        if (now - lastVerifyTime < 1000) {
          return;
        }
        lastVerifyTime = now;
        
        const token = vue.unref(configStore).queryApis[0].token;
        
        const userId = getUid();
        
        
        if (!token) {
          
        } else if (!/^\d{16}$/.test(token)) {
          
          logStore.addLog('❌ Token格式错误，必须是16位数字', 'danger');
          verifyState.value = { status: 'error', message: 'Token格式错误，必须是16位数字' };
          configStore.tokenVerified = false;
          configStore.tokenVerifyError = 'format';
          return;
        }
        
        verifyState.value = { status: 'testing', message: '正在验证...' };
        logStore.addLog('⏳ 正在验证Token...', 'primary');
        
        const startTime = Date.now();
        
        
        const configStoreRef = vue.unref(configStore);
        const workType = configStoreRef.platformName === "zhs" ? "zhs" : "cx";
        _GM_xmlhttpRequest({
          method: "GET",
          url: getRandomServer() + "?token=" + encodeURIComponent(token || '') + "&userId=" + encodeURIComponent(userId) + "&fid=" + encodeURIComponent(getFid()) + "&workType=" + encodeURIComponent(workType),
          timeout: 10000,
          onload: (response) => {
            pingDelay.value = Date.now() - startTime;
            reportServerSuccess();
            try {
              const res = JSON.parse(response.responseText);

              if (res.code === 200 && res.data && res.data.valid) {
                remainingCount.value = res.data.num;
                verifyState.value = { status: 'success', message: `验证成功！剩余次数: ${res.data.num}次` };
                configStore.tokenVerified = true;
                configStore.tokenVerifyError = null;
                logStore.addLog(`✅ Token验证成功，剩余次数: ${res.data.num}次`, 'success');
                
                
                if (res.data.sponsorUrl) {
                  SPONSOR_URL = res.data.sponsorUrl;
                }
                
                if (res.data.newToken) {
                  vue.unref(configStore).queryApis[0].token = res.data.newToken;
                  logStore.addLog(`🎁 新用户免费Token已注册，可查询40次题目`, 'success');
                }
                
                if (res.data.num <= 0) {
                  logStore.addLog(`💎 次数已用完，${getSponsorLink(res.data.sponsorUrl, '点我赞助获取新token')}`, 'warning');
                }
              } else if (res.code === 401) {
                remainingCount.value = 0;
                verifyState.value = { status: 'error', message: 'Token无效' };
                configStore.tokenVerified = false;
                configStore.tokenVerifyError = 'invalid';
                logStore.addLog('❌ Token无效，请检查是否正确', 'danger');
                
                if (res.data?.existingTokens && res.data.existingTokens.length > 0) {
                  existingTokens.value = res.data.existingTokens;
                  logStore.addLog(`💡 检测到您有${res.data.existingTokens.length}个有效Token，请在下方选择使用`, 'warning');
                } else {
                  existingTokens.value = [];
                  logStore.addLog(`💎 ${getSponsorLink(res.data.sponsorUrl, '点我赞助获取新token')}`, 'warning');
                }
              } else {
                remainingCount.value = 0;
                verifyState.value = { status: 'error', message: res.msg || '验证失败' };
                configStore.tokenVerified = false;
                configStore.tokenVerifyError = 'invalid';
                if (res.data?.sponsorUrl) {
                  triggerWelfarePromo();
                  const sponsorUrl = res.data.sponsorUrl;
                  const msgHtml = (res.msg || '').replace('[可切换赞助获取token，不限制账户]',
                    `[<a href="${sponsorUrl}" target="_blank" style="color:#667eea;text-decoration:underline;">可切换赞助获取token，不限制账户</a>]`);
                  logStore.addLog(`❌ 验证失败: ${msgHtml}`, 'danger');
                } else {
                  logStore.addLog('❌ 验证失败: ' + (res.msg || '未知错误'), 'danger');
                  logStore.addLog(`💎 ${getSponsorLink(res.data.sponsorUrl, '点我赞助获取新token')}`, 'warning');
                }
              }
            } catch (e) {

              remainingCount.value = 0;
              verifyState.value = { status: 'error', message: '响应解析失败' };
              configStore.tokenVerified = false;
              configStore.tokenVerifyError = 'network';
              logStore.addLog('❌ 服务器响应格式错误', 'danger');
            }
          },
          onerror: () => {
            pingDelay.value = -1;
            reportServerFail();
            verifyState.value = { status: 'error', message: '连接失败' };
            configStore.tokenVerified = false;
            configStore.tokenVerifyError = 'network';
            logStore.addLog('❌ 无法连接服务器，请检查网络', 'danger');
          },
          ontimeout: () => {
            pingDelay.value = -1;
            reportServerFail();
            verifyState.value = { status: 'error', message: '连接超时' };
            configStore.tokenVerified = false;
            configStore.tokenVerifyError = 'network';
            logStore.addLog('❌ 连接超时，请稍后重试', 'danger');
          }
        });
      };
      
      
      const isMajorUpdate = (currentVersion, latestVersion) => {
        const parts1 = currentVersion.split('.').map(Number);
        const parts2 = latestVersion.split('.').map(Number);
        
        return (parts1[0] || 0) < (parts2[0] || 0) || (parts1[1] || 0) < (parts2[1] || 0);
      };

      
      const checkUpdate = () => {
        
        if (window.__CLOUD_SCRIPT_LOADED__) {
          logStore.addLog('✅ 云端脚本已是最新版本', 'success');
          return;
        }
        
        const currentVersion = _GM_info?.script?.version || '1.1.2';
        _GM_xmlhttpRequest({
          method: "GET",
          url: 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C.meta.js?t=' + Date.now(),
          timeout: 5000,
          onload: (response) => {
            try {
              
              const versionMatch = response.responseText.match(/\/\/\s*@version\s+(\d+\.\d+\.\d+)/);
              if (versionMatch && versionMatch[1]) {
                const latestVersion = versionMatch[1];
                const updateUrl = 'https://scriptcat.org/zh-CN/script-show-page/5597';
                const updateMessage = '本次更新为重大版本更新，建议更新';
                
                if (compareVersion(currentVersion, latestVersion) < 0) {
                  
                  if (isMajorUpdate(currentVersion, latestVersion)) {
                    showUpdateDialog(latestVersion, updateUrl, updateMessage);
                  } else {
                    logStore.addLog(`ℹ️ 有新版本 v${latestVersion}，非大版本更新`, 'info');
                  }
                } else {
                  logStore.addLog(`✅ 脚本已是最新版本 v${currentVersion}`, 'success');
                }
              }
            } catch (e) {

            }
          },

        });
      };

      
      const showUpdateDialog = (latestVersion, updateUrl, updateMessage) => {
        const dialog = document.createElement('div');
        dialog.id = 'update-dialog';
        dialog.innerHTML = `
          <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;">
            <div style="background:#fff;border-radius:12px;padding:24px;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.2);text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🎉</div>
              <h3 style="margin:0 0 12px;color:#333;font-size:18px;">网课小助手发现新版本-飘飘</h3>
              <p style="margin:0 0 8px;color:#666;font-size:14px;">当前版本: v${latestVersion}</p>
              <p style="margin:0 0 20px;color:#999;font-size:12px;">${updateMessage || '建议更新以获得更好体验'}</p>
              <div style="display:flex;gap:12px;justify-content:center;">
                <button id="update-btn" style="background:#6366f1;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.2s;">立即更新</button>
                <button id="later-btn" style="background:#f9fafb;color:#6b7280;border:1px solid #d1d5db;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.2s;">稍后提醒</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(dialog);
        document.getElementById('update-btn').onclick = () => window.open(updateUrl, '_blank');
        document.getElementById('later-btn').onclick = () => dialog.remove();
      };

      
      vue.watchEffect(() => {
        const noToken = !vue.unref(configStore).queryApis[0].token;
        const verifyError = verifyState.value.status === 'error';
        const noRemaining = verifyState.value.status === 'success' && remainingCount.value <= 0;
        if (noToken || verifyError || noRemaining) {
          triggerWelfarePromo();
        }
      });

      
      vue.onMounted(async () => {
        
        checkUpdate();
        
        logStore.addLog('🔄 脚本启动，正在验证Token...', 'primary');
        verifyToken();
      });
      
      return (_ctx, _cache) => {
        const _component_el_checkbox = vue.resolveComponent("el-checkbox");
        const _component_el_input_number = vue.resolveComponent("el-input-number");
        const _component_el_form_item = vue.resolveComponent("el-form-item");
        const _component_el_button = vue.resolveComponent("el-button");
        const _component_el_input = vue.resolveComponent("el-input");
        const _component_el_radio_group = vue.resolveComponent("el-radio-group");
        const _component_el_radio_button = vue.resolveComponent("el-radio-button");
        const _component_el_select = vue.resolveComponent("el-select");
        const _component_el_option = vue.resolveComponent("el-option");
        const _component_el_switch = vue.resolveComponent("el-switch");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$4, [
          
          vue.createElementVNode("div", {
            style: {
              "margin-bottom": "12px",
              "padding": "16px",
              "background": "#ffffff",
              "border-radius": "4px",
              "border": "1px solid #e5e7eb"
            }
          }, [
            
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "8px"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "6px"
                }
              }, [
                vue.createElementVNode("span", {
                  style: { "font-size": "16px" }
                }, "🔑"),
                vue.createElementVNode("span", {
                  style: {
                    "font-size": "14px",
                    "font-weight": "600",
                    "color": "#2e7d32"
                  }
                }, "题库Token配置")
              ]),
              
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "6px"
                }
              }, [
                
                remainingCount.value !== null ? (vue.openBlock(), vue.createElementBlock("span", {
                  key: 0,
                  style: vue.normalizeStyle(remainingCountStyle.value)
                }, "剩余: " + vue.toDisplayString(remainingCount.value) + "次", 5)) : vue.createCommentVNode("", true),
                
                pingDelay.value !== null ? (vue.openBlock(), vue.createElementBlock("span", {
                  key: 1,
                  style: vue.normalizeStyle(pingDelayStyle.value)
                }, vue.toDisplayString(pingDelay.value === -1 ? "连接失败" : pingDelay.value + "ms"), 5)) : vue.createCommentVNode("", true)
              ])
            ]),
            
            vue.createElementVNode("p", {
              style: {
                "margin": "0 0 8px 0",
                "font-size": "12px",
                "color": "#666",
                "background": "rgba(255,255,255,0.5)",
                "padding": "5px 8px",
                "border-radius": "5px"
              }
            }, "💡 输入您的用户Token进行题库验证"),
            
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "gap": "8px",
                "flex-wrap": "wrap"
              }
            }, [
              vue.createElementVNode("span", {
                style: {
                  "font-size": "13px",
                  "color": "#424242",
                  "font-weight": "500"
                }
              }, "用户Token："),
              vue.createVNode(_component_el_input, {
                style: { "flex": "1", "min-width": "180px" },
                modelValue: vue.unref(configStore).queryApis[0].token,
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => {
                  const oldValue = vue.unref(configStore).queryApis[0].token;
                  vue.unref(configStore).queryApis[0].token = $event;
                  
                  vue.unref(configStore).tokenVerified = false;
                  vue.unref(configStore).tokenVerifyError = null;
                  
                  
                  if (oldValue !== $event) {
                    autoVerifyToken();
                  }
                }),
                placeholder: "请输入16位数字Token密钥",
                clearable: true,
                size: "small"
              }, null, 8, ["modelValue"]),
              
              vue.createVNode(_component_el_button, {
                type: "success",
                onClick: verifyToken,
                loading: verifyState.value.status === 'testing',
                style: { "border-radius": "6px" }
              }, {
                default: vue.withCtx(() => _cache[1] || (_cache[1] = [
                  vue.createTextVNode("验证")
                ])),
                _: 1
              }, 8, ["onClick", "loading"])
            ]),
            
            (!vue.unref(configStore).queryApis[0].token || verifyState.value.status) ? (vue.openBlock(), vue.createElementBlock("div", {
              key: 0,
              style: {
                "margin-top": "10px",
                "padding": "8px 10px",
                "border-radius": "5px",
                "border": "2px solid",
                "border-color": !vue.unref(configStore).queryApis[0].token ? "#ffc107" :
                                verifyState.value.status === 'success' ? "#4caf50" :
                                verifyState.value.status === 'error' ? "#dc3545" : "#ffc107",
                "background-color": !vue.unref(configStore).queryApis[0].token ? "#fff8e1" :
                                   verifyState.value.status === 'success' ? "#e8f5e9" :
                                   verifyState.value.status === 'error' ? "#f8d7da" : "#fff8e1"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "flex-direction": "column",
                  "gap": "8px"
                }
              }, [
                
                vue.createElementVNode("div", {
                  style: {
                    "display": "flex",
                    "align-items": "center",
                    "gap": "6px"
                  }
                }, [
                  vue.createElementVNode("span", {
                    style: { "font-size": "14px" }
                  }, vue.toDisplayString(
                    !vue.unref(configStore).queryApis[0].token ? "⚠️" :
                    verifyState.value.status === 'success' ? "✅" :
                    verifyState.value.status === 'error' ? "❌" : "⏳"
                  ), 1),
                  vue.createElementVNode("span", {
                    style: {
                      "font-size": "13px",
                      "color": !vue.unref(configStore).queryApis[0].token ? "#856404" :
                              verifyState.value.status === 'success' ? "#2e7d32" :
                              verifyState.value.status === 'error' ? "#721c24" : "#856404"
                    }
                  }, vue.toDisplayString(
                    !vue.unref(configStore).queryApis[0].token ? "请输入有效的用户Token进行验证" :
                    verifyState.value.message
                  ), 1)
                ]),
                
                (!vue.unref(configStore).queryApis[0].token || verifyState.value.status === 'error' || (verifyState.value.status === 'success' && remainingCount.value <= 0)) ? (vue.openBlock(), vue.createElementBlock("a", {
                  key: 0,
                  href: SPONSOR_URL,
                  target: "_blank",
                  style: {
                    "display": "inline-flex",
                    "align-items": "center",
                    "gap": "4px",
                    "font-size": "12px",
                    "color": "#667eea",
                    "text-decoration": "none",
                    "padding": "4px 8px",
                    "background": "rgba(102, 126, 234, 0.1)",
                    "border-radius": "4px",
                    "transition": "all 0.2s"
                  }
                }, [
                  vue.createElementVNode("span", null, "💎"),
                  vue.createElementVNode("span", null, "点我赞助获取新token")
                ])) : vue.createCommentVNode("", true)
              ])
            ], 4)) : vue.createCommentVNode("", true)
          ]),
          
          existingTokens.value.length > 0 ? (vue.openBlock(), vue.createElementBlock("div", {
            key: 0,
            style: {
              "margin-bottom": "12px",
              "padding": "14px",
              "background": "#fffbeb",
              "border-radius": "4px",
              "border": "1px solid #fde68a"
            }
          }, [
            
            vue.createElementVNode("div", {
              style: { "margin-bottom": "8px", "font-size": "13px", "color": "#e65100", "font-weight": "500" }
            }, "💡 检测到您有" + vue.toDisplayString(existingTokens.value.length) + "个有效Token"),
            
            vue.createElementVNode("div", {
              style: { "display": "flex", "flex-direction": "column", "gap": "6px" }
            }, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(existingTokens.value, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("div", {
                  key: index,
                  style: {
                    "display": "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    "padding": "6px 8px",
                    "background": "rgba(255,255,255,0.6)",
                    "border-radius": "4px"
                  }
                }, [
                  vue.createElementVNode("span", {
                    style: { "font-size": "11px", "color": "#333" }
                  }, vue.toDisplayString(item.token)),
                  vue.createElementVNode("span", {
                    style: { "font-size": "11px", "color": item.remainingCount < 50 ? "#e65100" : "#666", "margin": "0 8px" }
                  }, vue.toDisplayString(item.remainingCount) + "次"),
                  vue.createVNode(_component_el_button, {
                    type: "primary",
                    size: "small",
                    onClick: () => selectToken(item.token),
                    style: { "border-radius": "4px", "font-size": "11px", "padding": "4px 8px" }
                  }, {
                    default: vue.withCtx(() => [
                      vue.createTextVNode("使用")
                    ]),
                    _: 2
                  }, 1032, ["onClick"])
                ]);
              }), 128))
            ]),
            
            existingTokens.value.reduce((sum, t) => sum + t.remainingCount, 0) < 50 ? (vue.openBlock(), vue.createElementBlock("div", {
              key: 0,
              style: { "margin-top": "6px", "text-align": "center" }
            }, [
              vue.createElementVNode("span", {
                style: { "color": "#e65100", "font-size": "11px" }
              }, "⚠️ 次数不足 "),
              vue.createElementVNode("a", {
                href: SPONSOR_URL,
                target: "_blank",
                style: { "color": "#667eea", "font-size": "12px", "text-decoration": "underline" }
              }, "点我赞助获取新token")
            ])) : vue.createCommentVNode("", true)
          ])) : vue.createCommentVNode("", true),
          
          vue.createElementVNode("div", {
            style: {
              "border": "1px solid #e1f5fe",
              "border-radius": "4px",
              "overflow": "hidden"
            }
          }, [
            
            vue.createElementVNode("div", {
              style: {
                "background": "#f9fafb",
                "padding": "16px 18px",
                "border-bottom": "1px solid #e5e7eb"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "10px",
                  "margin-bottom": "6px"
                }
              }, [
                vue.createElementVNode("span", {
                  style: { 
                    "font-size": "20px",
                    "display": "inline-flex",
                    "align-items": "center",
                    "justify-content": "center",
                    "width": "32px",
                    "height": "32px",
                    "background": "#ffffff",
                    "border": "1px solid #e5e7eb",
                    "border-radius": "8px"
                  }
                }, "✨"),
                vue.createElementVNode("span", {
                  style: {
                    "font-weight": "600",
                    "font-size": "15px",
                    "color": "#111827"
                  }
                }, "答题配置"),
                vue.createElementVNode("span", {
                  style: {
                    "font-size": "12px",
                    "color": "#6b7280",
                    "margin-left": "auto",
                    "font-weight": "500"
                  }
                }, "⚡更改设置后需刷新网页激活")
              ]),
            ]),
            
            vue.createElementVNode("div", {
              style: {
                "padding": "15px",
                "background": "#fafcfe"
              }
            }, [
              
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(__props.globalConfig.platformParams?.[__props.globalConfig.platformName]?.parts || [], (item, index, partsList) => {
                return vue.openBlock(), vue.createElementBlock("div", {
                  key: index,
                  style: {
                    "margin-bottom": "15px",
                    "padding-bottom": "15px",
                    "border-bottom": "1px dashed #e0e0e0"
                  }
                }, [
                  vue.createElementVNode("div", {
                    style: {
                      "display": "flex",
                      "align-items": "center",
                      "justify-content": "space-between",
                      "gap": "6px",
                      "margin-bottom": "12px",
                      "font-weight": "600",
                      "font-size": "13px",
                      "color": "#333"
                    }
                  }, [
                    vue.createElementVNode("div", {
                      style: {
                        "display": "flex",
                        "align-items": "center",
                        "gap": "6px"
                      }
                    }, [
                      vue.createElementVNode("span", {
                        style: { "font-size": "14px" }
                      }, "⚙️"),
                      vue.createElementVNode("span", null, vue.toDisplayString(item.name), 1)
                    ]),
                    item.name === "答题参数" ? vue.createElementVNode("span", { 
                      style: {
                        "margin-left": "auto",
                        "font-size": "12px",
                        "color": "#ff9800",
                        "font-weight": "500"
                      }
                    }, vue.toDisplayString(consumptionText.value), 1) : vue.createCommentVNode("", true)
                  ]),
                  item.name === "答题参数" ? vue.createElementVNode("div", {
                    style: {
                      "display": "block"
                    }
                  }, [
                    
                    vue.createElementVNode("div", {
                      style: {
                        "display": "flex",
                        "flex-wrap": "wrap",
                        "gap": "12px",
                        "align-items": "flex-start",
                        "margin-bottom": "10px"
                      }
                    }, [
                      
                      (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(item.params.filter(p => p.type === "boolean" && p.exclusiveGroup), (param, index2) => {
                        return vue.openBlock(), vue.createBlock(_component_el_checkbox, {
                          style: { "margin": "0" },
                          key: index2,
                          modelValue: param.value,
                          "onUpdate:modelValue": ($event) => {
                            if (!handleExclusiveGroup(param, item, $event)) return;
                            param.value = $event;
                            triggerUiUpdate();
                          },
                          label: param.name
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "label"]);
                      }), 128)),
                      
                      item.params.some(p => p.type === "string") ? (() => {
                        const aiModeParam = item.params.find(p => p.name === "AI模式");
                        const isAiModeActive = aiModeParam && aiModeParam.value;
                        const aiTypeParam = item.params.find(p => p.name === "AI 类型选择");
                        const aiModelParam = item.params.find(p => p.name === "AI 模型选择");
                        if (!aiTypeParam || !aiModelParam) return vue.createCommentVNode("", true);
                        const currentAiType = aiTypeParam ? aiTypeParam.value : '\u6df7\u5143';
                        const TYPE_MODEL_MAP = globalModelConfig?.typeModelMap || {};
                        const defaultModels = globalModelConfig?.defaultModels || {};
                        const filteredOptions = TYPE_MODEL_MAP[currentAiType] || aiModelParam.options;
                        const labelStyle = {
                          "font-size": "12px",
                          "color": isAiModeActive ? "#42a5f5" : "#9ca3af",
                          "white-space": "nowrap",
                          "transition": "color 0.3s ease"
                        };
                        const radioStyle = {
                          "--el-fill-color-light": "transparent",
                          "opacity": isAiModeActive ? "1" : "0.4",
                          "transition": "opacity 0.3s ease",
                          "cursor": isAiModeActive ? "pointer" : "not-allowed"
                        };
                        const webSearchParam = item.params.find(p => p.name === "联网搜索");
                        return vue.createElementVNode("div", {
                          style: {
                            "margin-left": "auto",
                            "display": "flex",
                            "flex-direction": "column",
                            "gap": "4px"
                          }
                        }, [
                          
                          vue.createElementVNode("div", {
                            style: { "display": "flex", "align-items": "center", "gap": "12px" }
                          }, [
                            vue.createElementVNode("span", { style: labelStyle }, "AI 类型:"),
                            vue.createVNode(_component_el_select, {
                              modelValue: aiTypeParam.value,
                              "onUpdate:modelValue": ($event) => {
                                if (isAiModeActive) {
                                  aiTypeParam.value = $event;
                                  aiModelParam.value = defaultModels[$event] || 'Standard';
                                  triggerUiUpdate();
                                }
                              },
                              size: "small",
                              disabled: !isAiModeActive,
                              style: { "width": "90px", "opacity": isAiModeActive ? "1" : "0.4" },
                              placeholder: "请选择",
                              popperClass: "high-z-index-select"
                            }, {
                              default: vue.withCtx(() => [
                                vue.renderList(aiTypeParam.options || [], (option) => vue.createVNode(_component_el_option, {
                                  key: option, value: option, label: option
                                }, null, 8, ["value", "label"]))
                              ])
                            }, 8, ["modelValue", "onUpdate:modelValue", "disabled", "style"]),
                            
                            vue.createElementVNode("span", { style: {...labelStyle, "margin-left": "8px"} }, "AI 模型:"),
                            vue.createVNode(_component_el_select, {
                              modelValue: aiModelParam.value,
                              "onUpdate:modelValue": ($event) => {
                                if (isAiModeActive) {
                                  aiModelParam.value = $event;
                                  triggerUiUpdate();
                                }
                              },
                              size: "small",
                              disabled: !isAiModeActive,
                              style: { "width": "90px", "opacity": isAiModeActive ? "1" : "0.4" },
                              placeholder: "请选择",
                              popperClass: "high-z-index-select"
                            }, {
                              default: vue.withCtx(() => [
                                vue.renderList(filteredOptions, (option) => vue.createVNode(_component_el_option, {
                                  key: option, value: option, label: option
                                }, null, 8, ["value", "label"]))
                              ])
                            }, 8, ["modelValue", "onUpdate:modelValue", "disabled", "style"])
                          ]),
                          
                          webSearchParam ? vue.createElementVNode("div", {
                            style: { "display": "flex", "align-items": "center", "gap": "6px", "margin-top": "2px" }
                          }, [
                            vue.createElementVNode("span", {
                              style: {
                                "font-size": "12px",
                                "color": isAiModeActive ? "#42a5f5" : "#9ca3af",
                                "white-space": "nowrap",
                                "transition": "color 0.3s ease"
                              }
                            }, "联网搜索"),
                            vue.createVNode(_component_el_switch, {
                              modelValue: webSearchParam.value,
                              "onUpdate:modelValue": ($event) => {
                                if (isAiModeActive) {
                                  webSearchParam.value = $event;
                                  triggerUiUpdate();
                                }
                              },
                              size: "small",
                              disabled: !isAiModeActive,
                              style: { "--el-switch-on-color": "#0052D9", "transition": "all 0.15s ease-out", "opacity": isAiModeActive ? "1" : "0.4" }
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "disabled", "style"])
                          ]) : vue.createCommentVNode("", true)
                        ]);
                      })() : vue.createCommentVNode("", true)
                    ]),
                    
                    vue.createElementVNode("div", {
                      style: {
                        "display": "flex",
                        "flex-wrap": "wrap",
                        "gap": "15px",
                        "margin-bottom": "10px"
                      }
                    }, [
                      (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(item.params.filter(p => p.type === "boolean" && !p.exclusiveGroup && p.name !== "联网搜索"), (param, index2) => {
                        return vue.openBlock(), vue.createBlock(_component_el_checkbox, {
                          style: { "margin": "0" },
                          key: index2,
                          modelValue: param.value,
                          "onUpdate:modelValue": ($event) => {
                            
                            if (param.dependsOn) {
                              const parentPart = item;
                              const parentParam = parentPart.params.find(p => p.name === param.dependsOn.param);
                              
                              if (parentParam && parentParam.value !== param.dependsOn.value) {
                                if ($event) {
                                  
                                  return;
                                } else {
                                  
                                  param.value = $event;
                                }
                                return;
                              }
                            }
                            param.value = $event;
                            
                            
                            const parentPart = item;
                            const dependentParams = parentPart.params.filter(p => 
                              p.type === "boolean" && 
                              p.dependsOn && 
                              p.dependsOn.param === param.name
                            );
                            
                            if (!$event && dependentParams.length > 0) {
                              dependentParams.forEach(depParam => {
                                depParam.value = false;
                              });
                            }
                            if ($event && dependentParams.length > 0) {
                              dependentParams.forEach(depParam => {
                                if (depParam.dependsOn && depParam.dependsOn.value !== $event) {
                                  depParam.value = false;
                                }
                              });
                            }
                            triggerUiUpdate();
                          },
                          label: param.name,
                          disabled: param.dependsOn ? (() => {
                            watchUiUpdate();
                            const parentPart = item;
                            const parentParam = parentPart.params.find(p => p.name === param.dependsOn.param);
                            return !parentParam || parentParam.value !== param.dependsOn.value;
                          })() : false
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "label", "disabled"]);
                      }), 128))
                    ]),
                    
                    vue.createElementVNode("div", {
                      style: {
                        "display": "flex",
                        "flex-wrap": "wrap",
                        "gap": "10px"
                      }
                    }, [
                      (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(item.params.filter(p => p.type === "number"), (param, index2) => {
                        return vue.openBlock(), vue.createBlock(_component_el_form_item, {
                          key: index2,
                          label: param.name,
                          required: "",
                          style: { "margin": "0" }
                        }, {
                          default: vue.withCtx(() => [
                            vue.createVNode(_component_el_input_number, {
                              modelValue: param.value,
                              "onUpdate:modelValue": ($event) => param.value = $event,
                              min: param.min != null ? param.min : 1,
                              max: param.max != null ? param.max : 100,
                              step: param.step != null ? param.step : 1,
                              precision: param.step && param.step < 1 ? 1 : 0,
                              "controls-position": "right",
                              style: { "width": "70px", "height": "28px" }
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 2
                        }, 1032, ["label"]);
                      }), 128))
                    ]),
                    
                    
                    item.params.some(p => p.name === "联网搜索" && p.value) && item.params.some(p => p.name === "AI模式" && p.value) ? (vue.openBlock(), vue.createElementBlock("div", {
                      key: 4,
                      style: {
                        "width": "100%",
                        "font-size": "11px",
                        "color": "#ff9800",
                        "margin-top": "8px",
                        "padding": "8px",
                        "background": "rgba(255, 152, 0, 0.1)",
                        "border-radius": "6px",
                        "line-height": "1.5"
                      }
                    }, "⚠️ 已开启联网搜索：可大幅提高答题正确率【此功能会大量增加 Token 消耗】【此功能会增加答题次数消耗】")) : vue.createCommentVNode("", true)
                  ]) : vue.createElementVNode("div", {
                    style: {
                      "display": "flex",
                      "flex-wrap": "wrap",
                      "gap": "10px"
                    }
                  }, [
                    (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(item.params, (param, index2) => {
                      return vue.openBlock(), vue.createElementBlock(vue.Fragment, {
                        key: index2
                      }, [
                        (item.name === "视频设置" && (param.name === "规避检测" || param.name === "播放倍速")) || (item.name === "模式设置" && param.name === "正常模式") ? (vue.openBlock(), vue.createElementBlock("div", {
                          key: "br-" + index2,
                          style: { "width": "100%", "height": "0" }
                        })) : vue.createCommentVNode("", true),
                        param.type === "boolean" ? (vue.openBlock(), vue.createBlock(_component_el_checkbox, {
                          style: { "margin": "0", "min-width": "4em" },
                          key: index2,
                          modelValue: param.value,
                          "onUpdate:modelValue": ($event) => {
                            
                            if (param.dependsOn) {
                              const parentPart = item;
                              const parentParam = parentPart.params.find(p => p.name === param.dependsOn.param);
                              
                              if (parentParam && parentParam.value !== param.dependsOn.value) {
                                if ($event) {
                                  
                                  return;
                                } else {
                                  
                                  param.value = $event;
                                }
                                return;
                              }
                            }
                            if (param.exclusiveGroup) {
                              const parentPart = item;
                              const sameGroupParams = parentPart.params.filter(p => 
                                p.type === "boolean" && 
                                p.exclusiveGroup === param.exclusiveGroup && 
                                p.name !== param.name
                              );
                              if ($event) {
                                sameGroupParams.forEach(otherParam => {
                                  otherParam.value = false;
                                  const otherDependents = parentPart.params.filter(p =>
                                    p.type === "boolean" && p.dependsOn && p.dependsOn.param === otherParam.name
                                  );
                                  otherDependents.forEach(dp => { dp.value = false; });
                                });
                              } else {
                                const hasOtherActive = sameGroupParams.some(otherParam => otherParam.value);
                                if (!hasOtherActive) {
                                  return;
                                }
                              }
                            }
                            param.value = $event;
                            

                            if (param.name === "模拟播放" || param.name === "正常播放") {
                              const playbackRateParam = item.params.find(p => p.name === "播放倍速");
                              if (playbackRateParam) {
                                if (param.name === "模拟播放" && $event) {
                                  const autoMax = item.params.find(p => p.name === "自动倍速")?.value || false;
                                  if (autoMax) {
                                    let maxRate = window.__maxPlaybackRate;
                                    if (!maxRate) {
                                      try {
                                        const iframes = document.querySelectorAll('iframe');
                                        for (const iframe of iframes) {
                                          try {
                                            if (iframe.contentDocument) {
                                              const menuItems = iframe.contentDocument.querySelectorAll('.vjs-playback-rate .vjs-menu-content .vjs-menu-item');
                                              if (menuItems.length > 0) {
                                                maxRate = 1;
                                                menuItems.forEach(mi => {
                                                  const text = mi.textContent.trim();
                                                  const rate = parseFloat(text.replace('x', ''));
                                                  if (!isNaN(rate) && rate > maxRate) {
                                                    maxRate = rate;
                                                  }
                                                });
                                                window.__maxPlaybackRate = maxRate;
                                                break;
                                              }
                                            }
                                          } catch (e) {
                                            continue;
                                          }
                                        }
                                      } catch (e) {
                                      }
                                    }
                                    playbackRateParam.max = maxRate || 3;
                                  } else {
                                    playbackRateParam.max = 3;
                                  }
                                  if (playbackRateParam.value > playbackRateParam.max) {
                                    playbackRateParam.value = playbackRateParam.max;
                                  }
                                } else if (param.name === "正常播放" && $event) {
                                  let maxRate = window.__maxPlaybackRate;
                                  if (!maxRate) {
                                    try {
                                      const iframes = document.querySelectorAll('iframe');
                                      for (const iframe of iframes) {
                                        try {
                                          if (iframe.contentDocument) {
                                            const menuItems = iframe.contentDocument.querySelectorAll('.vjs-playback-rate .vjs-menu-content .vjs-menu-item');
                                            if (menuItems.length > 0) {
                                              maxRate = 1;
                                              menuItems.forEach(mi => {
                                                const text = mi.textContent.trim();
                                                const rate = parseFloat(text.replace('x', ''));
                                                if (!isNaN(rate) && rate > maxRate) {
                                                  maxRate = rate;
                                                }
                                              });
                                              window.__maxPlaybackRate = maxRate;
                                              break;
                                            }
                                          }
                                        } catch (e) {
                                          continue;
                                        }
                                      }
                                    } catch (e) {
                                    }
                                  }
                                  playbackRateParam.max = maxRate || 3;
                                }
                              }
                            }
                            triggerUiUpdate();
                            
                            
                            if (param.name === "自动倍速") {
                              const playbackRateParam = item.params.find(p => p.name === "播放倍速");
                              if (playbackRateParam) {
                                const isSimulate = item.params.find(p => p.name === "模拟播放")?.value || false;
                                if (isSimulate) {
                                  if ($event) {
                                    let maxRate = window.__maxPlaybackRate;
                                    if (!maxRate) { maxRate = 3; }
                                    playbackRateParam.max = maxRate;
                                  } else {
                                    playbackRateParam.max = 3;
                                  }
                                  if (playbackRateParam.value > playbackRateParam.max) {
                                    playbackRateParam.value = playbackRateParam.max;
                                  }
                                }
                              }
                            }
                            
                            const parentPart = item;
                            const dependentParams = parentPart.params.filter(p => 
                              p.type === "boolean" && 
                              p.dependsOn && 
                              p.dependsOn.param === param.name
                            );
                            
                            if (!$event && dependentParams.length > 0) {
                              dependentParams.forEach(depParam => {
                                depParam.value = false;
                              });
                            }
                            if ($event && dependentParams.length > 0) {
                              dependentParams.forEach(depParam => {
                                if (depParam.dependsOn && depParam.dependsOn.value !== $event) {
                                  depParam.value = false;
                                }
                              });
                            }
                          },
                          label: param.name,
                          disabled: param.dependsOn ? (() => {
                            watchUiUpdate();
                            const parentPart = item;
                            const parentParam = parentPart.params.find(p => p.name === param.dependsOn.param);
                            return !parentParam || parentParam.value !== param.dependsOn.value;
                          })() : false
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "label", "disabled"])) : (vue.openBlock(), vue.createBlock(_component_el_form_item, {
                          key: 1,
                          label: param.name,
                          required: "",
                          style: { "margin": "0" }
                        }, {
                          default: vue.withCtx(() => [
                            vue.createVNode(_component_el_input_number, {
                              modelValue: param.value,
                              "onUpdate:modelValue": ($event) => param.value = $event,
                              min: param.min != null ? param.min : 1,
                              max: param.max != null ? param.max : 100,
                              step: param.step != null ? param.step : 1,
                              precision: param.step && param.step < 1 ? 1 : 0,
                              "controls-position": "right",
                              style: { "width": "70px", "height": "28px" },
                              disabled: item.name === "视频设置" && param.name === "播放倍速" ? (item.params.find(p => p.name === "自动倍速")?.value || false) : false
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "disabled"])
                          ]),
                          _: 2
                        }, 1032, ["label"]))
                      ], 64);
                    }), 128)),
                    
                    item.name === "视频设置" ? (vue.openBlock(), vue.createElementBlock("div", {
                      key: "video-tips",
                      style: {
                        "width": "100%",
                        "margin-top": "12px",
                        "padding-left": "0"
                      }
                    }, [
                      
                      item.params.some(p => p.name === "模拟播放" && p.value) ? (vue.openBlock(), vue.createElementBlock("div", {
                        key: 0,
                        style: {
                          "font-size": "11px",
                          "color": "#ff9800",
                          "margin-bottom": "6px",
                          "padding": "8px",
                          "background": "rgba(255, 152, 0, 0.1)",
                          "border-radius": "6px",
                          "line-height": "1.5"
                        }
                      }, "💡 模拟播放倍速与正常播放一致，使用播放器允许的最大值")) : vue.createCommentVNode("", true),
                      
                      !item.params.some(p => p.name === "模拟播放" && p.value) ? (vue.openBlock(), vue.createElementBlock("div", {
                        key: 1,
                        style: {
                          "font-size": "11px",
                          "color": "#4caf50",
                          "margin-bottom": "6px",
                          "padding": "8px",
                          "background": "rgba(76, 175, 80, 0.1)",
                          "border-radius": "6px",
                          "line-height": "1.5"
                        }
                      }, "ℹ️ 普通播放倍速受播放器限制，使用播放器允许的最大值")) : vue.createCommentVNode("", true),
                      
                    ])) : vue.createCommentVNode("", true),
                    
                    item.params.some(p => p.name === "答案校验" && p.value) ? (vue.openBlock(), vue.createElementBlock("div", {
                      key: 3,
                      style: {
                        "width": "100%",
                        "font-size": "11px",
                        "color": "#888",
                        "margin-top": "6px",
                        "padding-left": "0",
                        "line-height": "1.4"
                      }
                    }, "💡 同时请求题库与AI模型，确保正确率【此功能会双倍消耗答题次数】【此功能会显著增加答题时长】")) : vue.createCommentVNode("", true)
              ])
            ]);
                    }), 128))
          ])
          ])
        ]);
      };
    }
  });
  const ScriptSetting =  _export_sfc(_sfc_main$7, [["__scopeId", "data-v-9ea68a6a"]]);
  const _hoisted_1$3 = { class: "question_table" };
  const _hoisted_2$1 = ["innerHTML"];
  const _sfc_main$6 =  vue.defineComponent({
    __name: "QuestionTable",
    props: {
      questionList: {
        type: Array,
        required: true
      }
    },
    setup(__props) {
      
      return (_ctx, _cache) => {
        const _component_el_table_column = vue.resolveComponent("el-table-column");
        const _component_el_table = vue.resolveComponent("el-table");
        const _component_el_empty = vue.resolveComponent("el-empty");
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("div", {
            style: {
              "margin-bottom": "15px",
              "padding": "15px",
              "border": "1px solid #e1f5fe",
              "border-radius": "4px",
              "overflow": "hidden"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "background": "#f9fafb",
                "padding": "14px 18px",
                "border-bottom": "1px solid #e5e7eb",
                "display": "flex",
                "align-items": "center",
                "gap": "10px",
                "margin": "-15px -15px 15px -15px"
              }
            }, [
              vue.createElementVNode("span", {
                style: { 
                  "font-size": "16px",
                  "display": "inline-flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "width": "28px",
                  "height": "28px",
                  "background": "#ffffff",
                  "border": "1px solid #e5e7eb",
                  "border-radius": "6px"
                }
              }, "📋"),
              vue.createElementVNode("span", {
                style: {
                  "font-weight": "600",
                  "font-size": "14px",
                  "color": "#111827"
                }
              }, "答题记录列表")
            ]),
            vue.withDirectives(vue.createElementVNode("div", _hoisted_1$3, [
            vue.createVNode(_component_el_table, {
              stripe: "",
              data: __props.questionList,
              height: "380",
              style: { "font-size": "12px" }
            }, {
              default: vue.withCtx(() => [
                vue.createVNode(_component_el_table_column, {
                  type: "index",
                  width: "40"
                }),
                vue.createVNode(_component_el_table_column, {
                  prop: "title",
                  label: "题目",
                  width: "370"
                }),
                vue.createVNode(_component_el_table_column, {
                  style: { "background-color": "red" },
                  prop: "answer",
                  label: "答案",
                  width: "215"
                }, {
                  default: vue.withCtx((scope) => [
                    vue.createElementVNode("div", {
                      innerHTML: scope.row.source === "ai" 
                        ? scope.row.answer.join() + '<span style="color:#ff9800;font-size:11px;margin-left:4px;">[答案由AI提供]</span>'
                        : scope.row.answer.join()
                    }, null, 8, _hoisted_2$1)
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["data"])
          ], 512), [
            [vue.vShow, __props.questionList.length]
          ]),
          vue.withDirectives(vue.createElementVNode("div", {
            style: {
              "padding": "16px",
              "text-align": "center"
            }
          }, [
            vue.createVNode(_component_el_empty, { description: "该页面无需答题" })
          ], 512), [
            [vue.vShow, !__props.questionList.length]
          ])
          ])
        ], 64);
      };
    }
  });
  const QuestionTable =  _export_sfc(_sfc_main$6, [["__scopeId", "data-v-18523ca7"]]);
  
  const _sfc_main_referral =  vue.defineComponent({
    __name: "ReferralPanel",
    setup(__props) {
      const logStore = useLogStore();
      
      
      const myUserId = vue.ref('');
      const referrerInput = vue.ref('');
      const submitting = vue.ref(false);
      const loading = vue.ref(true);
      
      
      const submitState = vue.ref({
        status: '', 
        message: ''
      });
      
      
      const rewardResult = vue.ref({
        referrerReward: 0,
        refereeReward: 0
      });
      
      
      const referralStatus = vue.ref({
        canRefer: false,
        canReferReason: '',
        isReferred: false,
        referrerId: null,
        myReward: 0,
        totalReferrals: 0,
        totalRewards: 0,
        userType: 1
      });

      
      const initUserId = () => {
        try {
          const uid = getUid();
          myUserId.value = uid || '';
        } catch (e) {
        }
      };
      
      
      const fetchReferralStatus = () => {
        const userId = myUserId.value;
        if (!userId) {
          loading.value = false;
          return;
        }
        _GM_xmlhttpRequest({
          method: "GET",
          url: getRandomServer() + "/referral/status?userId=" + encodeURIComponent(userId),
          timeout: 10000,
          onload: (response) => {
            loading.value = false;
            try {
              const res = JSON.parse(response.responseText);
              if (res.code === 200 && res.data) {
                referralStatus.value = res.data;
              }
            } catch (e) {
            }
          },
          onerror: () => {
            loading.value = false;
          }
        });
      };
      
      
      const copyUserId = () => {
        if (myUserId.value) {
          navigator.clipboard.writeText(myUserId.value).then(() => {
            logStore.addLog('✅ 用户ID已复制到剪贴板', 'success');
          }).catch(() => {
            logStore.addLog('❌ 复制失败', 'danger');
          });
        }
      };
      
      
      const submitReferral = () => {
        if (!referrerInput.value.trim()) {
          submitState.value = { status: 'error', message: '请输入推荐人ID' };
          return;
        }
        if (!myUserId.value) {
          submitState.value = { status: 'error', message: '无法获取您的用户ID' };
          return;
        }
        submitting.value = true;
        submitState.value = { status: 'submitting', message: '正在提交...' };
        _GM_xmlhttpRequest({
          method: "POST",
          url: getRandomServer() + "/referral",
          headers: { "Content-Type": "application/json" },
          data: JSON.stringify({
            referrerId: referrerInput.value.trim(),
            refereeId: myUserId.value
          }),
          timeout: 10000,
          onload: (response) => {
            submitting.value = false;
            try {
              const res = JSON.parse(response.responseText);
              if (res.code === 200) {
                submitState.value = { status: 'success', message: res.msg };
                referrerInput.value = '';
                
                if (res.data) {
                  rewardResult.value = {
                    referrerReward: res.data.referrerReward || 0,
                    refereeReward: res.data.refereeReward || 0
                  };
                }
                fetchReferralStatus();
              } else {
                submitState.value = { status: 'error', message: res.msg };
              }
            } catch (e) {
              submitState.value = { status: 'error', message: '提交失败，请稍后重试' };
            }
          },
          onerror: () => {
            submitting.value = false;
            submitState.value = { status: 'error', message: '网络错误，请稍后重试' };
          }
        });
      };
      
      
      vue.onMounted(() => {
        initUserId();
        fetchReferralStatus();
      });
      
      return (_ctx, _cache) => {
        const userId = vue.unref(myUserId);
        const status = vue.unref(referralStatus);
        const isSubmitting = vue.unref(submitting);
        
        return vue.openBlock(), vue.createElementBlock("div", {
          key: 'referral-' + userId + '-' + status.totalReferrals + '-' + status.totalRewards + '-' + status.canRefer + '-' + status.hasReferred
        }, [
          
          vue.createElementVNode("div", {
            style: {
              "margin-bottom": "15px",
              "padding": "16px",
              "background": "#ffffff",
              "border-radius": "4px",
              "border": "1px solid #e5e7eb"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "12px"
              }
            }, [
              vue.createElementVNode("span", { 
                style: { 
                  "font-weight": "600", 
                  "font-size": "14px",
                  "color": "#111827"
                } 
              }, "推广奖励"),
              vue.createElementVNode("span", { 
                style: { 
                  "font-size": "12px", 
                  "color": "#6b7280"
                } 
              }, "邀请好友获得免费查询次数")
            ]),
            
            vue.createElementVNode("div", {
              style: {
                "padding": "14px",
                "margin-bottom": "12px",
                "background": "#f9fafb",
                "border-radius": "4px",
                "border": "1px solid #e5e7eb"
              }
            }, [
              vue.createElementVNode("p", { style: { "margin": "0 0 8px 0", "font-size": "13px", "color": "#374151", "font-weight": "500" } }, "我的用户ID"),
              vue.createElementVNode("div", {
                style: { "display": "flex", "align-items": "center", "gap": "10px" }
              }, [
                vue.createElementVNode("span", { 
                  style: { 
                    "font-size": "16px", 
                    "color": userId ? "#0052D9" : "#e65100", 
                    "font-weight": "600",
                    "font-family": "monospace"
                  } 
                }, vue.toDisplayString(userId || '请先在学习通网站登录')),
                userId ? (vue.openBlock(), vue.createElementBlock("button", {
                  key: 0,
                  onClick: copyUserId,
                  style: {
                    "padding": "4px 10px",
                    "font-size": "12px",
                    "border": "none",
                    "border-radius": "4px",
                    "background": "#0052D9",
                    "color": "#fff",
                    "cursor": "pointer"
                  }
                }, "复制")) : vue.createCommentVNode("", true)
              ])
            ]),
            
            vue.createElementVNode("div", {
              style: {
                "display": "grid",
                "grid-template-columns": "1fr 1fr",
                "gap": "10px"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "padding": "12px",
                  "background": "#f0fdf4",
                  "border-radius": "4px",
                  "border": "1px solid #bbf7d0",
                  "text-align": "center"
                }
              }, [
                vue.createElementVNode("div", { 
                  style: { "font-size": "20px", "font-weight": "600", "color": "#2e7d32" } 
                }, vue.toDisplayString(status.totalReferrals)),
                vue.createElementVNode("div", { 
                  style: { "font-size": "11px", "color": "#388e3c" } 
                }, "已推广人数")
              ]),
              vue.createElementVNode("div", {
                style: {
                  "padding": "12px",
                  "background": "#fffbeb",
                  "border-radius": "4px",
                  "border": "1px solid #fde68a",
                  "text-align": "center"
                }
              }, [
                vue.createElementVNode("div", { 
                  style: { "font-size": "20px", "font-weight": "600", "color": "#e65100" } 
                }, vue.toDisplayString(status.totalRewards)),
                vue.createElementVNode("div", { 
                  style: { "font-size": "11px", "color": "#f57c00" } 
                }, "获得奖励次数")
              ])
            ])
          ]),
          
          vue.createElementVNode("div", {
            style: {
              "padding": "16px",
              "background": "#ffffff",
              "border-radius": "4px",
              "border": "1px solid #e5e7eb"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "12px"
              }
            }, [
              vue.createElementVNode("span", { style: { "font-weight": "600", "font-size": "14px", "color": "#111827" } }, "填写推荐人"),
              vue.createElementVNode("span", { style: { "font-size": "12px", "color": "#6b7280" } }, "新用户福利")
            ]),
            vue.createElementVNode("div", {
              style: { "padding": "12px", "background": "#fafcfe" }
            }, [
              status.isReferred ? (vue.openBlock(), vue.createElementBlock("div", {
                key: 0,
                style: {
                  "padding": "12px",
                  "background": "#e8f5e9",
                  "border-radius": "4px",
                  "border-left": "4px solid #4caf50"
                }
              }, [
                vue.createElementVNode("p", { 
                  style: { "margin": "0", "font-size": "13px", "color": "#2e7d32" } 
                }, "您已填写过推荐人：" + vue.toDisplayString(status.referrerId)),
                status.myReward > 0 ? (vue.createElementVNode("p", { 
                  style: { "margin": "8px 0 0 0", "font-size": "13px", "color": "#0052D9", "font-weight": "500" } 
                }, "获得 " + vue.toDisplayString(status.myReward) + " 次查询奖励")) : vue.createCommentVNode("", true)
              ])) : (vue.openBlock(), vue.createElementBlock("div", { key: 1 }, [
                status.canRefer ? (vue.openBlock(), vue.createElementBlock("div", { key: 0 }, [
                  
                  vue.createElementVNode("div", {
                    style: {
                      "padding": "10px",
                      "margin-bottom": "10px",
                      "background": "#fff3e0",
                      "border-radius": "4px",
                      "font-size": "12px",
                      "color": "#e65100"
                    }
                  }, [
                    vue.createElementVNode("p", { style: { "margin": "0" } }, "📌 规则说明："),
                    vue.createElementVNode("p", { style: { "margin": "5px 0 0 0" } }, "• 仅限新用户（注册24小时内）填写"),
                    vue.createElementVNode("p", { style: { "margin": "3px 0 0 0" } }, "• 每人只能填写一次推荐人"),
                    vue.createElementVNode("p", { style: { "margin": "3px 0 0 0", "color": "#f44336" } }, "• 推荐人必须是赞助过的用户（免费Token无法被推荐）"),
                    vue.createElementVNode("p", { style: { "margin": "3px 0 0 0" } }, 
                      rewardResult.value.refereeReward > 0 
                        ? `✅ 推荐人获得${rewardResult.value.referrerReward}次，您获得${rewardResult.value.refereeReward}次`
                        : "• 推荐人获得20-100次（随机），您获得20-50次（随机）"
                    )
                  ]),
                  vue.createElementVNode("div", { style: { "margin-bottom": "10px" } }, [
                    vue.createElementVNode("input", {
                      type: "text",
                      value: vue.unref(referrerInput),
                      onInput: _cache[0] || (_cache[0] = ($event) => referrerInput.value = $event.target.value),
                      placeholder: "请输入推荐人的用户ID",
                      style: {
                        "width": "100%",
                        "padding": "10px 12px",
                        "border": "1px solid #ddd",
                        "border-radius": "8px",
                        "font-size": "14px",
                        "box-sizing": "border-box"
                      }
                    }, null, 40, ["value", "onInput"])
                  ]),
                  vue.createElementVNode("button", {
                    onClick: submitReferral,
                    disabled: isSubmitting,
                    style: {
                      "width": "100%",
                      "padding": "10px",
                      "border": "none",
                      "border-radius": "8px",
                      "background": isSubmitting ? "#d1d5db" : "#6366f1",
                      "color": "#fff",
                      "font-size": "14px",
                      "font-weight": "500",
                      "cursor": isSubmitting ? "not-allowed" : "pointer"
                    }
                  }, vue.toDisplayString(isSubmitting ? "提交中..." : "提交推荐人"), 9, ["onClick", "disabled"]),
                  
                  submitState.value.status ? (vue.openBlock(), vue.createElementBlock("div", {
                    key: 0,
                    style: {
                      "margin-top": "10px",
                      "padding": "10px 12px",
                      "border-radius": "8px",
                      "border": "2px solid",
                      "border-color": submitState.value.status === 'success' ? "#4caf50" :
                                      submitState.value.status === 'error' ? "#dc3545" : "#ffc107",
                      "background-color": submitState.value.status === 'success' ? "#e8f5e9" :
                                             submitState.value.status === 'error' ? "#f8d7da" : "#fff8e1"
                    }
                  }, [
                    vue.createElementVNode("div", {
                      style: {
                        "display": "flex",
                        "align-items": "center",
                        "gap": "6px"
                      }
                    }, [
                      vue.createElementVNode("span", {
                        style: { "font-size": "14px" }
                      }, vue.toDisplayString(
                        submitState.value.status === 'success' ? "✅" :
                        submitState.value.status === 'error' ? "❌" : "⏳"
                      ), 1),
                      vue.createElementVNode("span", {
                        style: {
                          "font-size": "13px",
                          "color": submitState.value.status === 'success' ? "#2e7d32" :
                                      submitState.value.status === 'error' ? "#721c24" : "#856404"
                        }
                      }, vue.toDisplayString(submitState.value.message), 1)
                    ])
                  ])) : vue.createCommentVNode("v-if", true)
                ])) : (vue.openBlock(), vue.createElementBlock("div", {
                  key: 1,
                  style: {
                    "padding": "12px",
                    "background": "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
                    "border-radius": "8px",
                    "border-left": "4px solid #ff9800"
                  }
                }, [
                  vue.createElementVNode("p", { 
                    style: { "margin": "0", "font-size": "13px", "color": "#e65100", "font-weight": "500" } 
                  }, "⚠️ " + vue.toDisplayString(status.canReferReason || '你已不是新用户，无法填写推荐人'))
                ]))
              ]))
            ])
          ])
        ]);
      };
    }
  });
  const ReferralPanel =  _export_sfc(_sfc_main_referral, [["__scopeId", "data-v-referral-panel"]]);
  
  const TOKEN_USAGE_MODE_OPTIONS = [
    { label: "全部模式", value: "" },
    { label: "正常模式", value: "正常模式" },
    { label: "校验模式", value: "校验模式" },
    { label: "AI模式", value: "AI模式" }
  ];
  
  const _sfc_main_token_usage =  vue.defineComponent({
    __name: "TokenUsagePanel",
    setup(__props) {
      const configStore = useConfigStore();
      
      const getConfigToken = () => {
        const apis = configStore.queryApis || [];
        const raw = apis[0] && apis[0].token ? String(apis[0].token).trim() : "";
        return /^\d{16}$/.test(raw) ? raw : "";
      };
      
      const loading = vue.ref(false);
      const errorMsg = vue.ref("");
      const records = vue.ref([]);
      const total = vue.ref(0);
      const page = vue.ref(1);
      const pageSize = vue.ref(50);
      const modeFilter = vue.ref("");
      const tokenInput = vue.ref(getConfigToken());
      const queried = vue.ref(false);
      const lastUpdated = vue.ref("");
      
      const isTokenValid = (value) => /^\d{16}$/.test(String(value || "").trim());
      
      const pad2 = (n) => n < 10 ? "0" + n : "" + n;
      const formatTime = (ts) => {
        const num = Number(ts);
        if (!num) return "-";
        const d = new Date(num * 1000);
        if (isNaN(d.getTime())) return "-";
        return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
      };
      const formatNumber = (value) => (Number(value) || 0).toLocaleString("zh-CN");
      const formatDate = (ts) => {
        const num = Number(ts);
        if (!num) return "-";
        const d = new Date(num * 1000);
        if (isNaN(d.getTime())) return "-";
        return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
      };
      const formatClock = (ts) => {
        const num = Number(ts);
        if (!num) return "";
        const d = new Date(num * 1000);
        if (isNaN(d.getTime())) return "";
        return pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
      };
      const remainingText = (value) => (value === null || value === undefined) ? "—" : formatNumber(value);
      const remainingColor = (value) => {
        const num = Number(value);
        if (value === null || value === undefined || !Number.isFinite(num)) return "#c0c4cc";
        if (num <= 5) return "#d92d20";
        if (num <= 20) return "#d97706";
        return "#111827";
      };
      const maskedInput = vue.computed(() => {
        const raw = String(tokenInput.value || "").trim();
        return /^\d{16}$/.test(raw) ? raw.substring(0, 4) + "****" + raw.substring(12) : "";
      });
      
      const CHIP_BASE_STYLE = {
        "display": "inline-block",
        "box-sizing": "border-box",
        "max-width": "100%",
        "overflow": "hidden",
        "text-overflow": "ellipsis",
        "white-space": "nowrap",
        "font-size": "12px",
        "line-height": "18px",
        "padding": "1px 5px",
        "border-radius": "4px"
      };
      const SOURCE_CHIP_STYLES = {
        "缓存": { "background": "#f4f4f5", "border": "1px solid #e9e9eb", "color": "#909399" },
        "题库": { "background": "#f0f9eb", "border": "1px solid #e1f3d8", "color": "#67c23a" },
        "ai补充": { "background": "#fdf6ec", "border": "1px solid #faecd8", "color": "#e6a23c" },
        "默认": { "background": "#ecf5ff", "border": "1px solid #d9ecff", "color": "#409eff" }
      };
      const MODE_CHIP_STYLES = {
        "正常模式": { "background": "#ecf5ff", "border": "1px solid #d9ecff", "color": "#409eff" },
        "校验模式": { "background": "#fdf6ec", "border": "1px solid #faecd8", "color": "#e6a23c" },
        "AI模式": { "background": "#f0f9eb", "border": "1px solid #e1f3d8", "color": "#67c23a" },
        "默认": { "background": "#f4f4f5", "border": "1px solid #e9e9eb", "color": "#909399" }
      };
      const sourceChipStyle = (source) => Object.assign({}, CHIP_BASE_STYLE, SOURCE_CHIP_STYLES[source] || SOURCE_CHIP_STYLES["默认"]);
      const modeChipStyle = (mode) => Object.assign({}, CHIP_BASE_STYLE, MODE_CHIP_STYLES[mode] || MODE_CHIP_STYLES["默认"]);
      const modelsText = (models) => {
        if (!Array.isArray(models) || models.length === 0) return "无模型明细";
        return models.map((m) => (m.name || "未知模型") + "（输入" + (m.promptTokens || 0) + " / 输出" + (m.completionTokens || 0) + "）").join("；");
      };
      const detailText = (row) => {
        if (Array.isArray(row.models) && row.models.length > 0) return modelsText(row.models);
        return "无模型明细";
      };
      
      const fetchRecords = (targetPage) => {
        const token = String(tokenInput.value || "").trim();
        if (!isTokenValid(token)) {
          loading.value = false;
          records.value = [];
          total.value = 0;
          queried.value = false;
          errorMsg.value = "请输入正确的16位数字Token";
          return;
        }
        const usePage = Math.max(1, parseInt(targetPage, 10) || 1);
        loading.value = true;
        errorMsg.value = "";
        let url = getRandomServer() + "/usage-records?token=" + encodeURIComponent(token) + "&page=" + usePage + "&size=" + pageSize.value;
        if (modeFilter.value) url += "&mode=" + encodeURIComponent(modeFilter.value);
        _GM_xmlhttpRequest({
          method: "GET",
          url,
          timeout: 10000,
          onload: (response) => {
            loading.value = false;
            queried.value = true;
            let res = null;
            try {
              res = JSON.parse(response.responseText);
            } catch (e) {
              res = null;
            }
            if (!res || res.code !== 200 || !res.data) {
              errorMsg.value = res && res.msg ? res.msg : "查询失败，请稍后重试";
              records.value = [];
              total.value = 0;
              return;
            }
            const data = res.data;
            records.value = Array.isArray(data.records) ? data.records : [];
            total.value = Number(data.total) || 0;
            page.value = Number(data.page) || usePage;
            pageSize.value = Number(data.pageSize) || pageSize.value;
            lastUpdated.value = formatTime(Math.floor(Date.now() / 1000));
          },
          onerror: () => {
            loading.value = false;
            errorMsg.value = "网络异常，无法连接服务器";
          },
          ontimeout: () => {
            loading.value = false;
            errorMsg.value = "查询超时，请稍后重试";
          }
        });
      };
      
      const handleQuery = () => {
        page.value = 1;
        fetchRecords(1);
      };
      const handleModeChange = (value) => {
        modeFilter.value = value || "";
        if (isTokenValid(tokenInput.value)) {
          page.value = 1;
          fetchRecords(1);
        }
      };
      const handlePageChange = (value) => {
        page.value = Number(value) || 1;
        fetchRecords(page.value);
      };

      const handleKeyup = (event) => {
        if (event && event.key === "Enter") handleQuery();
      };
      
      vue.onMounted(() => {
        if (isTokenValid(tokenInput.value)) fetchRecords(1);
      });
      
      return (_ctx, _cache) => {
        const _component_el_table_column = vue.resolveComponent("el-table-column");
        const _component_el_table = vue.resolveComponent("el-table");
        const _component_el_pagination = vue.resolveComponent("el-pagination");
        const _component_el_button = vue.resolveComponent("el-button");
        const _component_el_tooltip = vue.resolveComponent("el-tooltip");
        const _component_el_input = vue.resolveComponent("el-input");
        const _component_el_radio_group = vue.resolveComponent("el-radio-group");
        const _component_el_radio_button = vue.resolveComponent("el-radio-button");
        const _directive_loading = vue.resolveDirective("loading");
        
        return vue.createElementVNode("div", null, [
          
          vue.createElementVNode("div", {
            style: {
              "margin-bottom": "12px",
              "padding": "14px 16px",
              "background": "linear-gradient(135deg, #ffffff 0%, #f7faff 100%)",
              "border-radius": "10px",
              "border": "1px solid #e8eefc",
              "box-shadow": "0 1px 2px rgba(16, 24, 40, 0.04)"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "gap": "12px",
                "flex-wrap": "wrap"
              }
            }, [
              vue.createElementVNode("div", {
                style: { "display": "flex", "align-items": "center", "gap": "10px" }
              }, [
                vue.createElementVNode("span", {
                  style: {
                    "display": "inline-flex",
                    "align-items": "center",
                    "justify-content": "center",
                    "width": "34px",
                    "height": "34px",
                    "border-radius": "10px",
                    "background": "linear-gradient(135deg, #eef4ff 0%, #dfeaff 100%)",
                    "border": "1px solid #dbe7ff",
                    "font-size": "16px"
                  }
                }, "🔍"),
                vue.createElementVNode("div", null, [
                  vue.createElementVNode("div", {
                    style: { "font-size": "15px", "font-weight": "600", "color": "#111827", "line-height": "20px" }
                  }, "使用查询"),
                  vue.createElementVNode("div", {
                    style: { "font-size": "12px", "color": "#9ca3af", "margin-top": "2px" }
                  }, "输入 Token 查询扣费流水，仅赞助 Token")
                ])
              ]),
              vue.createElementVNode("div", {
                style: { "display": "flex", "align-items": "center", "gap": "8px", "flex-wrap": "wrap" }
              }, [
                vue.createVNode(_component_el_input, {
                  modelValue: tokenInput.value,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => {
                    tokenInput.value = $event;
                    errorMsg.value = "";
                  }),
                  placeholder: "请输入16位数字Token",
                  clearable: true,
                  style: { "width": "210px" },
                  onKeyup: handleKeyup
                }),
                vue.createVNode(_component_el_button, {
                  type: "primary",
                  loading: loading.value,
                  onClick: handleQuery,
                  style: { "border-radius": "8px", "padding": "0 18px" }
                }, {
                  default: vue.withCtx(() => [
                    vue.createTextVNode("查询")
                  ]),
                  _: 1
                }, 8, ["loading", "onClick"])
              ])
            ]),
            vue.createElementVNode("div", {
              style: {
                "margin-top": "10px",
                "display": "flex",
                "align-items": "center",
                "gap": "10px",
                "flex-wrap": "wrap",
                "font-size": "12px",
                "color": "#9ca3af"
              }
            }, [
              maskedInput.value ? vue.createElementVNode("span", {
                key: "token-chip",
                style: {
                  "display": "inline-flex",
                  "align-items": "center",
                  "padding": "2px 8px",
                  "border-radius": "999px",
                  "background": "#eff6ff",
                  "border": "1px solid #dbeafe",
                  "color": "#1d4ed8",
                  "font-family": "monospace",
                  "font-size": "11px"
                }
              }, "当前 " + maskedInput.value) : vue.createCommentVNode("", true),
              vue.createElementVNode("span", null, lastUpdated.value ? "更新于 " + lastUpdated.value : "尚未查询")
            ])
          ]),
          
          vue.createElementVNode("div", {
            style: {
              "display": "flex",
              "align-items": "center",
              "justify-content": "space-between",
              "gap": "10px",
              "margin-bottom": "10px",
              "flex-wrap": "wrap"
            }
          }, [
            vue.createVNode(_component_el_radio_group, {
              modelValue: modeFilter.value,
              "onUpdate:modelValue": handleModeChange,
              size: "small",
              style: { "--el-color-primary": "#0052D9" }
            }, {
              default: vue.withCtx(() => vue.renderList(TOKEN_USAGE_MODE_OPTIONS, (option) => {
                return vue.createVNode(_component_el_radio_button, {
                  key: option.value || "all",
                  value: option.value
                }, {
                  default: vue.withCtx(() => [
                    vue.createTextVNode(vue.toDisplayString(option.label), 1)
                  ]),
                  _: 2
                }, 1032, ["value"]);
              })),
              _: 1
            }, 8, ["modelValue"]),
            vue.createElementVNode("span", {
              style: { "font-size": "12px", "color": "#9ca3af" }
            }, queried.value ? "共 " + formatNumber(total.value) + " 条记录" : "", 1)
          ]),
          
          errorMsg.value ? vue.createElementVNode("div", {
            key: 0,
            style: {
              "margin-bottom": "10px",
              "padding": "10px 12px",
              "border-radius": "8px",
              "border": "1px solid #fde68a",
              "background": "#fffbeb",
              "font-size": "12px",
              "color": "#92400e",
              "display": "flex",
              "align-items": "center",
              "gap": "6px"
            }
          }, "⚠️ " + vue.toDisplayString(errorMsg.value), 1) : vue.createCommentVNode("", true),
          
          vue.withDirectives(vue.createElementVNode("div", {
            "element-loading-text": "查询中...",
            "element-loading-background": "rgba(255, 255, 255, 0.7)",
            style: {
              "border": "1px solid #eef0f4",
              "border-radius": "10px",
              "overflow": "hidden",
              "background": "#ffffff",
              "box-shadow": "0 1px 2px rgba(16, 24, 40, 0.04)"
            }
          }, [
            vue.createVNode(_component_el_table, {
              stripe: "",
              "max-height": "330",
              "empty-text": queried.value ? "暂无使用记录" : "请输入Token后点击查询",
              data: records.value,
              "header-cell-style": {
                "background": "#f9fafb",
                "color": "#6b7280",
                "font-size": "12px",
                "font-weight": "600",
                "padding": "8px 0"
              },
              "cell-style": { "padding": "9px 0" },
              style: { "width": "100%", "font-size": "12px" }
            }, {
              default: vue.withCtx(() => [
                vue.createVNode(_component_el_table_column, { label: "时间", width: "96" }, {
                  default: vue.withCtx((scope) => [
                    vue.createElementVNode("div", null, [
                      vue.createElementVNode("div", {
                        style: { "font-size": "12px", "color": "#111827", "font-weight": "500", "white-space": "nowrap" }
                      }, vue.toDisplayString(formatDate(scope.row.createdAt)), 1),
                      vue.createElementVNode("div", {
                        style: { "font-size": "11px", "color": "#9ca3af", "margin-top": "2px", "white-space": "nowrap" }
                      }, vue.toDisplayString(formatClock(scope.row.createdAt)), 1)
                    ])
                  ]),
                  _: 2
                }),
                vue.createVNode(_component_el_table_column, { label: "模式", width: "90" }, {
                  default: vue.withCtx((scope) => [
                    vue.createElementVNode("span", {
                      style: modeChipStyle(scope.row.mode)
                    }, vue.toDisplayString(scope.row.mode || "-"), 1)
                  ]),
                  _: 2
                }),
                vue.createVNode(_component_el_table_column, { label: "来源", "min-width": "120" }, {
                  default: vue.withCtx((scope) => [
                    vue.createVNode(_component_el_tooltip, {
                      effect: "dark",
                      placement: "top",
                      "show-after": 150,
                      popperClass: "high-z-index-select",
                      content: scope.row.source || "-"
                    }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("span", {
                          style: sourceChipStyle(scope.row.source)
                        }, vue.toDisplayString(scope.row.source || "-"), 1)
                      ]),
                      _: 2
                    }, 1032, ["content"])
                  ]),
                  _: 2
                }),
                vue.createVNode(_component_el_table_column, { label: "消耗", width: "58", align: "center" }, {
                  header: vue.withCtx(() => [
                    vue.createElementVNode("span", { style: { "white-space": "nowrap" } }, "消耗")
                  ]),
                  default: vue.withCtx((scope) => [
                    vue.createElementVNode("span", {
                      style: { "font-size": "12px", "color": "#2e7d32", "font-weight": "600" }
                    }, vue.toDisplayString(formatNumber(scope.row.cost)), 1)
                  ]),
                  _: 2
                }),
                vue.createVNode(_component_el_table_column, { label: "剩余次数", width: "70", align: "center" }, {
                  header: vue.withCtx(() => [
                    vue.createElementVNode("div", { style: { "line-height": "16px" } }, [
                      vue.createElementVNode("div", null, "剩余"),
                      vue.createElementVNode("div", null, "次数")
                    ])
                  ]),
                  default: vue.withCtx((scope) => [
                    vue.createElementVNode("span", {
                      style: {
                        "font-size": "12px",
                        "font-weight": "600",
                        "color": remainingColor(scope.row.remainingCount)
                      }
                    }, vue.toDisplayString(remainingText(scope.row.remainingCount)), 1)
                  ]),
                  _: 2
                }),
                vue.createVNode(_component_el_table_column, { label: "输入Token", width: "72", align: "center" }, {
                  default: vue.withCtx((scope) => [
                    vue.createElementVNode("span", {
                      style: { "font-size": "12px", "color": "#374151" }
                    }, vue.toDisplayString(formatNumber(scope.row.promptTokens)), 1)
                  ]),
                  _: 2
                }),
                vue.createVNode(_component_el_table_column, { label: "输出Token", width: "72", align: "center" }, {
                  default: vue.withCtx((scope) => [
                    vue.createElementVNode("span", {
                      style: { "font-size": "12px", "color": "#374151" }
                    }, vue.toDisplayString(formatNumber(scope.row.completionTokens)), 1)
                  ]),
                  _: 2
                }),
                vue.createVNode(_component_el_table_column, { label: "明细", width: "56", align: "center" }, {
                  header: vue.withCtx(() => [
                    vue.createElementVNode("span", { style: { "white-space": "nowrap" } }, "明细")
                  ]),
                  default: vue.withCtx((scope) => [
                    vue.createVNode(_component_el_tooltip, {
                      effect: "dark",
                      placement: "top",
                      "show-after": 100,
                      popperClass: "high-z-index-select",
                      content: detailText(scope.row)
                    }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("span", {
                          style: { "font-size": "12px", "color": "#0052D9", "cursor": "pointer", "font-weight": "500", "white-space": "nowrap" }
                        }, "查看")
                      ]),
                      _: 2
                    }, 1032, ["content"])
                  ]),
                  _: 2
                })
              ]),
              _: 1
            }, 8, ["data", "empty-text"]),
            vue.createElementVNode("div", {
              style: {
                "display": "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "gap": "10px",
                "padding": "10px 12px",
                "border-top": "1px solid #f1f3f7",
                "background": "#ffffff",
                "flex-wrap": "wrap"
              }
            }, [
              vue.createElementVNode("span", {
                style: { "font-size": "12px", "color": "#9ca3af" }
              }, "第 " + page.value + " / " + Math.max(1, Math.ceil(total.value / pageSize.value)) + " 页", 1),
              vue.createVNode(_component_el_pagination, {
                "current-page": page.value,
                "onUpdate:currentPage": handlePageChange,
                "page-size": pageSize.value,
                layout: "prev, pager, next",
                total: total.value,
                background: true,
                small: true,
                "hide-on-single-page": false
              }, null, 8, ["current-page", "page-size", "total"])
            ])
          ], 512), [[_directive_loading, loading.value]]),
        ]);
      };
    }
  });
  const TokenUsagePanel = _sfc_main_token_usage;
  
  
  
  

  const _sfc_main$4 =  vue.defineComponent({
    __name: "AuthorWords",
    setup() {
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", null, [
          
          vue.createElementVNode("div", {
            style: {
              "border": "1px solid #e5e7eb",
              "border-radius": "4px",
              "overflow": "hidden"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "background": "#f9fafb",
                "padding": "12px 16px",
                "border-bottom": "1px solid #e5e7eb"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "8px",
                  "margin-bottom": "4px"
                }
              }, [
                vue.createElementVNode("span", { style: { "font-size": "14px" } }, "💬"),
                vue.createElementVNode("span", { style: { "font-weight": "500", "font-size": "14px", "color": "#111827" } }, "作者的话")
              ]),
              vue.createElementVNode("div", { style: { "font-size": "12px", "color": "#9ca3af" } }, "来自开发者的一些心里话")
            ]),
            vue.createElementVNode("div", {
              style: {
                "padding": "20px",
                "background": "#ffffff",
                "text-align": "center"
              }
            }, [
              vue.createElementVNode("p", {
                style: {
                  "margin": "16px 0",
                  "font-style": "italic",
                  "font-size": "16px",
                  "color": "#0052D9",
                  "font-weight": "500"
                }
              }, [
                vue.createTextVNode("如遇到使用问题，可"),
                vue.createElementVNode("a", {
                  href: "https://scriptcat.org/zh-CN/script-show-page/5597/issue/create",
                  target: "_blank",
                  style: { "color": "#0052D9", "text-decoration": "underline" }
                }, "[反馈]"),
                vue.createTextVNode(" 一旦核实，将基于次数奖励，最低100次！")
              ]),
              vue.createElementVNode("p", {
                style: {
                  "margin": "16px 0",
                  "font-style": "italic",
                  "font-size": "16px",
                  "color": "#374151",
                  "font-weight": "500"
                }
              }, '"快点刷学习通，别卷了"'),
              vue.createElementVNode("p", {
                style: {
                  "margin": "12px 0",
                  "font-style": "italic",
                  "font-size": "14px",
                  "color": "#6b7280"
                }
              }, "别卷了别卷了，真的别卷了"),
              vue.createElementVNode("div", {
                style: {
                  "margin-top": "20px",
                  "padding-top": "16px",
                  "border-top": "1px solid #e5e7eb"
                }
              }, [
                vue.createElementVNode("p", {
                  style: { "margin": "12px 0", "color": "#6b7280", "font-size": "13px" }
                }, "不是，你还真看啊，学习通刷完了么你"),
                vue.createElementVNode("p", {
                  style: { "margin": "15px 0", "color": "#424242", "font-size": "14px" }
                }, [
                  vue.createTextVNode("目前开发者还在开发的功能有："),
                  vue.createElementVNode("br"),
                  vue.createTextVNode("• 如需更多功能"),
                  vue.createElementVNode("a", {
                    href: "https://scriptcat.org/zh-CN/script-show-page/5597/issue",
                    target: "_blank",
                    style: { "color": "#0052D9", "text-decoration": "underline" }
                  }, "点击反馈")
                ])
              ])
            ])
          ]),
          
          vue.createElementVNode("div", {
            style: {
              "border": "1px solid #e5e7eb",
              "border-radius": "4px",
              "overflow": "hidden",
              "margin-top": "12px"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "background": "#f9fafb",
                "padding": "12px 16px",
                "border-bottom": "1px solid #e5e7eb"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "8px",
                  "margin-bottom": "4px"
                }
              }, [
                vue.createElementVNode("span", { style: { "font-size": "14px" } }, "🚀"),
                vue.createElementVNode("span", { style: { "font-weight": "500", "font-size": "14px", "color": "#111827" } }, "免更新版本")
              ]),
              vue.createElementVNode("div", { style: { "font-size": "12px", "color": "#9ca3af" } }, "轻量级引导脚本，自动获取最新代码")
            ]),
            vue.createElementVNode("div", {
              style: { "padding": "16px", "background": "#ffffff" }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "padding": "12px",
                  "background": "#f0fdf4",
                  "border-radius": "4px",
                  "border": "1px solid #bbf7d0"
                }
              }, [
                vue.createElementVNode("p", { style: { "margin": "0 0 8px 0", "color": "#16a34a", "font-size": "13px" } }, "轻量级引导脚本，自动获取最新的刷课脚本最新代码执行。支持热更新，无需手动更新脚本。"),
                vue.createElementVNode("a", {
                  href: "https://scriptcat.org/zh-CN/script-show-page/5615",
                  target: "_blank",
                  style: { "color": "#0052D9", "font-size": "13px", "text-decoration": "underline" }
                }, "🔗 点击获取免更新版本")
              ])
            ])
          ]),
          
          vue.createElementVNode("div", {
            style: {
              "border": "1px solid #e5e7eb",
              "border-radius": "4px",
              "overflow": "hidden",
              "margin-top": "12px"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "background": "#f9fafb",
                "padding": "12px 16px",
                "border-bottom": "1px solid #e5e7eb"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "8px",
                  "margin-bottom": "4px"
                }
              }, [
                vue.createElementVNode("span", { style: { "font-size": "14px" } }, "📖"),
                vue.createElementVNode("span", { style: { "font-weight": "500", "font-size": "14px", "color": "#111827" } }, "使用教程")
              ]),
              vue.createElementVNode("div", { style: { "font-size": "12px", "color": "#9ca3af" } }, "请仔细阅读以下说明，确保正确使用脚本功能")
            ]),
            vue.createElementVNode("div", {
              style: { "padding": "16px", "background": "#ffffff" }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "padding": "12px",
                  "margin-bottom": "10px",
                  "background": "#eff6ff",
                  "border-radius": "4px",
                  "border": "1px solid #bfdbfe"
                }
              }, [
                vue.createElementVNode("p", { style: { "margin": "0 0 5px 0", "font-weight": "500", "color": "#0052D9" } }, "📌 脚本功能"),
                vue.createElementVNode("p", { style: { "margin": "0", "color": "#374151", "font-size": "13px" } }, "【超星学习通「功能基本完成」】【知到智慧树「目前只支持答题」】")
              ]),
              vue.createElementVNode("div", {
                style: {
                  "padding": "12px",
                  "margin-bottom": "10px",
                  "background": "#eff6ff",
                  "border-radius": "4px",
                  "border": "1px solid #bfdbfe"
                }
              }, [
                vue.createElementVNode("p", { style: { "margin": "0 0 5px 0", "font-weight": "500", "color": "#0052D9" } }, "🔑 题库配置"),
                vue.createElementVNode("p", { style: { "margin": "0", "color": "#374151", "font-size": "13px" } }, '脚本接入了综合题库，如需填写密钥，依次操作：【1】 点击标签页"脚本配置" --> 【2】 在顶部文本框内填写16位数字Token --> 【3】 点击验证')
              ]),
              vue.createElementVNode("div", {
                style: {
                  "padding": "12px",
                  "background": "#fffbeb",
                  "border-radius": "4px",
                  "border": "1px solid #fde68a"
                }
              }, [
                vue.createElementVNode("p", { style: { "margin": "0 0 5px 0", "font-weight": "500", "color": "#92400e" } }, "⚠️ 务必注意"),
                vue.createElementVNode("p", { style: { "margin": "0 0 5px 0", "color": "#374151", "font-size": "13px" } }, "• 脚本出现相关问题，请在脚本反馈区反馈，或者私信作者修复。"),
                vue.createElementVNode("p", { style: { "margin": "0", "color": "#374151", "font-size": "13px" } }, "• 题库密钥请确认能够搜索到题目再获取，题库均为网络收集的第三方题库，出现任何问题与脚本无关。")
              ])
            ])
          ]),
          
          vue.createElementVNode("div", {
            style: {
              "border": "1px solid #e5e7eb",
              "border-radius": "4px",
              "overflow": "hidden",
              "margin-top": "12px"
            }
          }, [
            vue.createElementVNode("div", {
              style: {
                "background": "#f9fafb",
                "padding": "12px 16px",
                "border-bottom": "1px solid #e5e7eb"
              }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "8px",
                  "margin-bottom": "4px"
                }
              }, [
                vue.createElementVNode("span", { style: { "font-size": "14px" } }, "📜"),
                vue.createElementVNode("span", { style: { "font-weight": "500", "font-size": "14px", "color": "#111827" } }, "用户协议")
              ]),
              vue.createElementVNode("div", { style: { "font-size": "12px", "color": "#9ca3af" } }, "使用本脚本即表示您同意以下条款")
            ]),
            vue.createElementVNode("div", {
              style: { "padding": "16px", "background": "#ffffff" }
            }, [
              vue.createElementVNode("div", {
                style: {
                  "padding": "12px",
                  "margin-bottom": "10px",
                  "background": "#eff6ff",
                  "border-radius": "4px",
                  "border": "1px solid #bfdbfe"
                }
              }, [
                vue.createElementVNode("p", { style: { "margin": "0", "font-size": "13px", "color": "#374151", "line-height": "1.6" } }, "📌 本脚本仅供学习和研究目的使用，并应在24小时内删除。脚本的使用不应违反任何法律法规及学术道德标准。")
              ]),
              vue.createElementVNode("div", {
                style: {
                  "padding": "12px",
                  "margin-bottom": "10px",
                  "background": "#eff6ff",
                  "border-radius": "4px",
                  "border": "1px solid #bfdbfe"
                }
              }, [
                vue.createElementVNode("p", { style: { "margin": "0", "font-size": "13px", "color": "#333", "line-height": "1.6" } }, "⚖️ 用户在使用脚本时，必须遵守所有适用的法律法规。任何由于使用脚本而引起的违法行为或不当行为，其产生的一切后果由用户自行承担。")
              ]),
              vue.createElementVNode("div", {
                style: {
                  "padding": "12px",
                  "background": "#eff6ff",
                  "border-radius": "4px",
                  "border": "1px solid #bfdbfe"
                }
              }, [
                vue.createElementVNode("p", { style: { "margin": "0", "font-size": "13px", "color": "#333", "line-height": "1.6" } }, "⚠️ 其他重要条款：本声明的目的在于提醒用户注意相关法律法规与风险。如用户在使用脚本的过程中有任何疑问，建议立即停止使用。本免责声明的最终解释权归脚本开发者所有。")
              ])
            ])
          ])
        ]);
      };
    }
  });
  const AuthorWords = _sfc_main$4;

  const _sfc_main_description = vue.defineComponent({
    __name: "ScriptDescription",
    setup() {
      const desc = vue.ref(globalScriptDescription);
      return (_ctx, _cache) => {
        const d = desc.value;
        if (!d) return vue.createCommentVNode("", true);
        return vue.openBlock(), vue.createElementBlock("div", null, [
          vue.createElementVNode("div", {
            style: { "border": "1px solid #e5e7eb", "border-radius": "4px", "overflow": "hidden" }
          }, [
            vue.createElementVNode("div", {
              style: { "background": "#f9fafb", "padding": "12px 16px", "border-bottom": "1px solid #e5e7eb" }
            }, [
              vue.createElementVNode("div", {
                style: { "display": "flex", "align-items": "center", "gap": "8px", "margin-bottom": "4px" }
              }, [
                vue.createElementVNode("span", { style: { "font-weight": "500", "font-size": "14px", "color": "#111827" } }, "脚本说明")
              ]),
              vue.createElementVNode("div", { style: { "font-size": "12px", "color": "#9ca3af" } }, "答题模式与消耗规则说明")
            ]),
            vue.createElementVNode("div", {
              style: { "padding": "16px", "background": "#ffffff", "font-size": "13px", "color": "#374151", "line-height": "1.8" }
            }, [
              vue.createElementVNode("p", { style: { "margin": "0 0 8px 0", "font-weight": "600", "color": "#16a34a" } }, "正常模式"),
              vue.createElementVNode("p", { style: { "margin": "0 0 8px 0" } }, vue.toDisplayString(d.modes.normal.desc), 1),
              vue.createElementVNode("p", { style: { "margin": "0 0 4px 0", "color": "#6b7280", "font-size": "12px" } }, "消耗：" + vue.toDisplayString(d.modes.normal.cost), 1),
              d.modes.normal.details ? (vue.openBlock(true), vue.createElementBlock(vue.Fragment, { key: "normal-details" }, vue.renderList(d.modes.normal.details, (detail, i) => {
                return vue.openBlock(), vue.createElementBlock("p", {
                  key: i,
                  style: { "margin": "0 0 4px 0", "color": "#6b7280", "font-size": "12px" }
                }, "• " + vue.toDisplayString(detail), 1);
              }), 128)) : vue.createCommentVNode("", true),

              vue.createElementVNode("p", { style: { "margin": "12px 0 8px 0", "font-weight": "600", "color": "#92400e" } }, "校验模式"),
              vue.createElementVNode("p", { style: { "margin": "0 0 8px 0" } }, vue.toDisplayString(d.modes.verify.desc), 1),
              vue.createElementVNode("p", { style: { "margin": "0 0 4px 0", "color": "#6b7280", "font-size": "12px" } }, "消耗：" + vue.toDisplayString(d.modes.verify.cost), 1),
              d.modes.verify.details ? (vue.openBlock(true), vue.createElementBlock(vue.Fragment, { key: 0 }, vue.renderList(d.modes.verify.details, (detail, i) => {
                return vue.openBlock(), vue.createElementBlock("p", {
                  key: i,
                  style: { "margin": "0 0 4px 0", "color": "#6b7280", "font-size": "12px" }
                }, "• " + vue.toDisplayString(detail), 1);
              }), 128)) : vue.createCommentVNode("", true),
              d.modes.verify.models ? (vue.openBlock(), vue.createElementBlock("p", {
                key: 1,
                style: { "margin": "0 0 12px 0", "color": "#6b7280", "font-size": "12px" }
              }, "校验模型：" + vue.toDisplayString(d.modes.verify.models.join("、")), 1)) : vue.createCommentVNode("", true),

              vue.createElementVNode("p", { style: { "margin": "0 0 8px 0", "font-weight": "600", "color": "#0052D9" } }, "AI模式"),
              vue.createElementVNode("p", { style: { "margin": "0 0 8px 0" } }, vue.toDisplayString(d.modes.ai.desc), 1),
              d.modes.ai.details ? (vue.openBlock(true), vue.createElementBlock(vue.Fragment, { key: 2 }, vue.renderList(d.modes.ai.details, (detail, i) => {
                return vue.openBlock(), vue.createElementBlock("p", {
                  key: i,
                  style: { "margin": "0 0 4px 0", "color": "#6b7280", "font-size": "12px" }
                }, "• " + vue.toDisplayString(detail), 1);
              }), 128)) : vue.createCommentVNode("", true),

              vue.createElementVNode("div", {
                style: { "margin-top": "8px", "padding-top": "12px", "border-top": "1px solid #e5e7eb" }
              }, [
                vue.createElementVNode("p", { style: { "margin": "0 0 8px 0", "font-weight": "600", "color": "#111827" } }, "AI模型价格表（元/百万Tokens）"),
                (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(d.modelGroups, (group, gIdx) => {
                  return vue.openBlock(), vue.createElementBlock("div", {
                    key: gIdx,
                    style: { "margin-bottom": gIdx < d.modelGroups.length - 1 ? "10px" : "0" }
                  }, [
                    vue.createElementVNode("p", {
                      style: { "margin": "0 0 4px 0", "font-weight": "500", "color": "#0052D9", "font-size": "12px" }
                    }, vue.toDisplayString(group.type), 1),
                    (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(group.models, (model, mIdx) => {
                      return vue.openBlock(), vue.createElementBlock("p", {
                        key: mIdx,
                        style: { "margin": "0 0 2px 0", "color": "#6b7280", "font-size": "12px" }
                      }, vue.toDisplayString(model.name) + "（" + vue.toDisplayString(model.cost) + "）输入¥" + vue.toDisplayString(model.inputPrice) + " / 输出¥" + vue.toDisplayString(model.outputPrice), 1);
                    }), 128))
                  ]);
                }), 128)),
                d.sponsor ? (vue.openBlock(), vue.createElementBlock("p", {
                  key: 0,
                  style: { "margin": "12px 0 0 0", "padding-top": "12px", "border-top": "1px solid #e5e7eb", "font-size": "12px", "color": "#6b7280", "text-align": "center" }
                }, [
                  vue.createTextVNode(vue.toDisplayString(d.sponsor.text.split(d.sponsor.linkText)[0])),
                  vue.createElementVNode("a", {
                    href: d.sponsor.link,
                    target: "_blank",
                    style: { "color": "#0052D9", "text-decoration": "underline", "font-weight": "500" }
                  }, vue.toDisplayString(d.sponsor.linkText), 9, ["href"]),
                  vue.createTextVNode(vue.toDisplayString(d.sponsor.text.split(d.sponsor.linkText)[1] || ""))
                ])) : vue.createCommentVNode("", true)
              ])
            ])
          ])
        ]);
      };
    }
  });
  const ScriptDescription = _sfc_main_description;

  
  
  
  
  const FrameScanner = {
    collectDirect(root) {
      return [...root.querySelectorAll("iframe")];
    },
    collectDeep(root) {
      const result = [];
      const collect = (node) => {
        for (const fr of node.querySelectorAll("iframe")) {
          result.push(fr);
          try {
            if (fr.contentDocument) {
              collect(fr.contentDocument.documentElement);
            }
          } catch (e) {  }
        }
      };
      collect(root);
      return rxjs.of(result);
    },
    collectDeepSync(root) {
      const result = [];
      const collect = (node) => {
        for (const fr of node.querySelectorAll("iframe")) {
          result.push(fr);
          try {
            if (fr.contentDocument) {
              collect(fr.contentDocument.documentElement);
            }
          } catch (e) {  }
        }
      };
      collect(root);
      return result;
    }
  };
  var Typr$1={},Typr={parse:function(r){var e=Typr._bin,t=new Uint8Array(r);if("ttcf"==e.readASCII(t,0,4)){var a=4;e.readUshort(t,a),a+=2,e.readUshort(t,a),a+=2;var n=e.readUint(t,a);a+=4;for(var s=[],o=0;o<n;o++){var i=e.readUint(t,a);a+=4,s.push(Typr._readFont(t,i))}return s}return[Typr._readFont(t,0)]},_readFont:function(r,e){var t=Typr._bin,a=e;t.readFixed(r,e),e+=4;var n=t.readUshort(r,e);e+=2,t.readUshort(r,e),e+=2,t.readUshort(r,e),e+=2,t.readUshort(r,e),e+=2;for(var s=["cmap","head","hhea","maxp","hmtx","name","OS/2","post","loca","glyf","kern","CFF ","GPOS","GSUB","SVG "],o={_data:r,_offset:a},i={},h=0;h<n;h++){var f=t.readASCII(r,e,4);e+=4,t.readUint(r,e),e+=4;var p=t.readUint(r,e);e+=4;var d=t.readUint(r,e);e+=4,i[f]={offset:p,length:d}}for(h=0;h<s.length;h++){var l=s[h];i[l]&&(o[l.trim()]=Typr[l.trim()].parse(r,i[l].offset,i[l].length,o))}return o},_tabOffset:function(r,e,t){for(var a=Typr._bin,n=a.readUshort(r,t+4),s=t+12,o=0;o<n;o++){var i=a.readASCII(r,s,4);s+=4,a.readUint(r,s),s+=4;var h=a.readUint(r,s);if(s+=4,a.readUint(r,s),s+=4,i==e)return h}return 0}};Typr._bin={readFixed:function(r,e){return(r[e]<<8|r[e+1])+(r[e+2]<<8|r[e+3])/65540},readF2dot14:function(r,e){return Typr._bin.readShort(r,e)/16384},readInt:function(r,e){return Typr._bin._view(r).getInt32(e)},readInt8:function(r,e){return Typr._bin._view(r).getInt8(e)},readShort:function(r,e){return Typr._bin._view(r).getInt16(e)},readUshort:function(r,e){return Typr._bin._view(r).getUint16(e)},readUshorts:function(r,e,t){for(var a=[],n=0;n<t;n++)a.push(Typr._bin.readUshort(r,e+2*n));return a},readUint:function(r,e){return Typr._bin._view(r).getUint32(e)},readUint64:function(r,e){return 4294967296*Typr._bin.readUint(r,e)+Typr._bin.readUint(r,e+4)},readASCII:function(r,e,t){for(var a="",n=0;n<t;n++)a+=String.fromCharCode(r[e+n]);return a},readUnicode:function(r,e,t){for(var a="",n=0;n<t;n++){var s=r[e++]<<8|r[e++];a+=String.fromCharCode(s)}return a},_tdec:"undefined"!=typeof window&&window.TextDecoder?new window.TextDecoder:null,readUTF8:function(r,e,t){var a=Typr._bin._tdec;return a&&0==e&&t==r.length?a.decode(r):Typr._bin.readASCII(r,e,t)},readBytes:function(r,e,t){for(var a=[],n=0;n<t;n++)a.push(r[e+n]);return a},readASCIIArray:function(r,e,t){for(var a=[],n=0;n<t;n++)a.push(String.fromCharCode(r[e+n]));return a},_view:function(r){return r._dataView||(r._dataView=r.buffer?new DataView(r.buffer,r.byteOffset,r.byteLength):new DataView(new Uint8Array(r).buffer))}},Typr._lctf={},Typr._lctf.parse=function(r,e,t,a,n){var s=Typr._bin,o={},i=e;s.readFixed(r,e),e+=4;var h=s.readUshort(r,e);e+=2;var f=s.readUshort(r,e);e+=2;var p=s.readUshort(r,e);return e+=2,o.scriptList=Typr._lctf.readScriptList(r,i+h),o.featureList=Typr._lctf.readFeatureList(r,i+f),o.lookupList=Typr._lctf.readLookupList(r,i+p,n),o},Typr._lctf.readLookupList=function(r,e,t){var a=Typr._bin,n=e,s=[],o=a.readUshort(r,e);e+=2;for(var i=0;i<o;i++){var h=a.readUshort(r,e);e+=2;var f=Typr._lctf.readLookupTable(r,n+h,t);s.push(f)}return s},Typr._lctf.readLookupTable=function(r,e,t){var a=Typr._bin,n=e,s={tabs:[]};s.ltype=a.readUshort(r,e),e+=2,s.flag=a.readUshort(r,e),e+=2;var o=a.readUshort(r,e);e+=2;for(var i=s.ltype,h=0;h<o;h++){var f=a.readUshort(r,e);e+=2;var p=t(r,i,n+f,s);s.tabs.push(p)}return s},Typr._lctf.numOfOnes=function(r){for(var e=0,t=0;t<32;t++)r>>>t&1&&e++;return e},Typr._lctf.readClassDef=function(r,e){var t=Typr._bin,a=[],n=t.readUshort(r,e);if(e+=2,1==n){var s=t.readUshort(r,e);e+=2;var o=t.readUshort(r,e);e+=2;for(var i=0;i<o;i++)a.push(s+i),a.push(s+i),a.push(t.readUshort(r,e)),e+=2}if(2==n){var h=t.readUshort(r,e);for(e+=2,i=0;i<h;i++)a.push(t.readUshort(r,e)),e+=2,a.push(t.readUshort(r,e)),e+=2,a.push(t.readUshort(r,e)),e+=2}return a},Typr._lctf.getInterval=function(r,e){for(var t=0;t<r.length;t+=3){var a=r[t],n=r[t+1];if(r[t+2],a<=e&&e<=n)return t}return-1},Typr._lctf.readCoverage=function(r,e){var t=Typr._bin,a={};a.fmt=t.readUshort(r,e),e+=2;var n=t.readUshort(r,e);return e+=2,1==a.fmt&&(a.tab=t.readUshorts(r,e,n)),2==a.fmt&&(a.tab=t.readUshorts(r,e,3*n)),a},Typr._lctf.coverageIndex=function(r,e){var t=r.tab;if(1==r.fmt)return t.indexOf(e);if(2==r.fmt){var a=Typr._lctf.getInterval(t,e);if(-1!=a)return t[a+2]+(e-t[a])}return-1},Typr._lctf.readFeatureList=function(r,e){var t=Typr._bin,a=e,n=[],s=t.readUshort(r,e);e+=2;for(var o=0;o<s;o++){var i=t.readASCII(r,e,4);e+=4;var h=t.readUshort(r,e);e+=2;var f=Typr._lctf.readFeatureTable(r,a+h);f.tag=i.trim(),n.push(f)}return n},Typr._lctf.readFeatureTable=function(r,e){var t=Typr._bin,a=e,n={},s=t.readUshort(r,e);e+=2,s>0&&(n.featureParams=a+s);var o=t.readUshort(r,e);e+=2,n.tab=[];for(var i=0;i<o;i++)n.tab.push(t.readUshort(r,e+2*i));return n},Typr._lctf.readScriptList=function(r,e){var t=Typr._bin,a=e,n={},s=t.readUshort(r,e);e+=2;for(var o=0;o<s;o++){var i=t.readASCII(r,e,4);e+=4;var h=t.readUshort(r,e);e+=2,n[i.trim()]=Typr._lctf.readScriptTable(r,a+h)}return n},Typr._lctf.readScriptTable=function(r,e){var t=Typr._bin,a=e,n={},s=t.readUshort(r,e);e+=2,s>0&&(n.default=Typr._lctf.readLangSysTable(r,a+s));var o=t.readUshort(r,e);e+=2;for(var i=0;i<o;i++){var h=t.readASCII(r,e,4);e+=4;var f=t.readUshort(r,e);e+=2,n[h.trim()]=Typr._lctf.readLangSysTable(r,a+f)}return n},Typr._lctf.readLangSysTable=function(r,e){var t=Typr._bin,a={};t.readUshort(r,e),e+=2,a.reqFeature=t.readUshort(r,e),e+=2;var n=t.readUshort(r,e);return e+=2,a.features=t.readUshorts(r,e,n),a},Typr.CFF={},Typr.CFF.parse=function(r,e,t){var a=Typr._bin;(r=new Uint8Array(r.buffer,e,t))[e=0],r[++e],r[++e],r[++e],e++;var n=[];e=Typr.CFF.readIndex(r,e,n);for(var s=[],o=0;o<n.length-1;o++)s.push(a.readASCII(r,e+n[o],n[o+1]-n[o]));e+=n[n.length-1];var i=[];e=Typr.CFF.readIndex(r,e,i);var h=[];for(o=0;o<i.length-1;o++)h.push(Typr.CFF.readDict(r,e+i[o],e+i[o+1]));e+=i[i.length-1];var f=h[0],p=[];e=Typr.CFF.readIndex(r,e,p);var d=[];for(o=0;o<p.length-1;o++)d.push(a.readASCII(r,e+p[o],p[o+1]-p[o]));if(e+=p[p.length-1],Typr.CFF.readSubrs(r,e,f),f.CharStrings){e=f.CharStrings,p=[],e=Typr.CFF.readIndex(r,e,p);var l=[];for(o=0;o<p.length-1;o++)l.push(a.readBytes(r,e+p[o],p[o+1]-p[o]));f.CharStrings=l}if(f.ROS){e=f.FDArray;var u=[];for(e=Typr.CFF.readIndex(r,e,u),f.FDArray=[],o=0;o<u.length-1;o++){var y=Typr.CFF.readDict(r,e+u[o],e+u[o+1]);Typr.CFF._readFDict(r,y,d),f.FDArray.push(y)}e+=u[u.length-1],e=f.FDSelect,f.FDSelect=[];var v=r[e];if(e++,3!=v)throw v;var c=a.readUshort(r,e);for(e+=2,o=0;o<c+1;o++)f.FDSelect.push(a.readUshort(r,e),r[e+2]),e+=3}return f.Encoding&&(f.Encoding=Typr.CFF.readEncoding(r,f.Encoding,f.CharStrings.length)),f.charset&&(f.charset=Typr.CFF.readCharset(r,f.charset,f.CharStrings.length)),Typr.CFF._readFDict(r,f,d),f},Typr.CFF._readFDict=function(r,e,t){var a;for(var n in e.Private&&(a=e.Private[1],e.Private=Typr.CFF.readDict(r,a,a+e.Private[0]),e.Private.Subrs&&Typr.CFF.readSubrs(r,a+e.Private.Subrs,e.Private)),e)-1!=["FamilyName","FontName","FullName","Notice","version","Copyright"].indexOf(n)&&(e[n]=t[e[n]-426+35])},Typr.CFF.readSubrs=function(r,e,t){var a=Typr._bin,n=[];e=Typr.CFF.readIndex(r,e,n);var s,o=n.length;s=o<1240?107:o<33900?1131:32768,t.Bias=s,t.Subrs=[];for(var i=0;i<n.length-1;i++)t.Subrs.push(a.readBytes(r,e+n[i],n[i+1]-n[i]))},Typr.CFF.tableSE=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,0,111,112,113,114,0,115,116,117,118,119,120,121,122,0,123,0,124,125,126,127,128,129,130,131,0,132,133,0,134,135,136,137,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,0,139,0,0,0,0,140,141,142,143,0,0,0,0,0,144,0,0,0,145,0,0,146,147,148,149,0,0,0,0],Typr.CFF.glyphByUnicode=function(r,e){for(var t=0;t<r.charset.length;t++)if(r.charset[t]==e)return t;return-1},Typr.CFF.glyphBySE=function(r,e){return e<0||e>255?-1:Typr.CFF.glyphByUnicode(r,Typr.CFF.tableSE[e])},Typr.CFF.readEncoding=function(r,e,t){Typr._bin;var a=[".notdef"],n=r[e];if(e++,0!=n)throw"error: unknown encoding format: "+n;var s=r[e];e++;for(var o=0;o<s;o++)a.push(r[e+o]);return a},Typr.CFF.readCharset=function(r,e,t){var a=Typr._bin,n=[".notdef"],s=r[e];if(e++,0==s)for(var o=0;o<t;o++){var i=a.readUshort(r,e);e+=2,n.push(i)}else{if(1!=s&&2!=s)throw"error: format: "+s;for(;n.length<t;){i=a.readUshort(r,e),e+=2;var h=0;for(1==s?(h=r[e],e++):(h=a.readUshort(r,e),e+=2),o=0;o<=h;o++)n.push(i),i++}}return n},Typr.CFF.readIndex=function(r,e,t){var a=Typr._bin,n=a.readUshort(r,e)+1,s=r[e+=2];if(e++,1==s)for(var o=0;o<n;o++)t.push(r[e+o]);else if(2==s)for(o=0;o<n;o++)t.push(a.readUshort(r,e+2*o));else if(3==s)for(o=0;o<n;o++)t.push(16777215&a.readUint(r,e+3*o-1));else if(1!=n)throw"unsupported offset size: "+s+", count: "+n;return(e+=n*s)-1},Typr.CFF.getCharString=function(r,e,t){var a=Typr._bin,n=r[e],s=r[e+1];r[e+2],r[e+3],r[e+4];var o=1,i=null,h=null;n<=20&&(i=n,o=1),12==n&&(i=100*n+s,o=2),21<=n&&n<=27&&(i=n,o=1),28==n&&(h=a.readShort(r,e+1),o=3),29<=n&&n<=31&&(i=n,o=1),32<=n&&n<=246&&(h=n-139,o=1),247<=n&&n<=250&&(h=256*(n-247)+s+108,o=2),251<=n&&n<=254&&(h=256*-(n-251)-s-108,o=2),255==n&&(h=a.readInt(r,e+1)/65535,o=5),t.val=null!=h?h:"o"+i,t.size=o},Typr.CFF.readCharString=function(r,e,t){for(var a=e+t,n=Typr._bin,s=[];e<a;){var o=r[e],i=r[e+1];r[e+2],r[e+3],r[e+4];var h=1,f=null,p=null;o<=20&&(f=o,h=1),12==o&&(f=100*o+i,h=2),19!=o&&20!=o||(f=o,h=2),21<=o&&o<=27&&(f=o,h=1),28==o&&(p=n.readShort(r,e+1),h=3),29<=o&&o<=31&&(f=o,h=1),32<=o&&o<=246&&(p=o-139,h=1),247<=o&&o<=250&&(p=256*(o-247)+i+108,h=2),251<=o&&o<=254&&(p=256*-(o-251)-i-108,h=2),255==o&&(p=n.readInt(r,e+1)/65535,h=5),s.push(null!=p?p:"o"+f),e+=h}return s},Typr.CFF.readDict=function(r,e,t){for(var a=Typr._bin,n={},s=[];e<t;){var o=r[e],i=r[e+1];r[e+2],r[e+3],r[e+4];var h=1,f=null,p=null;if(28==o&&(p=a.readShort(r,e+1),h=3),29==o&&(p=a.readInt(r,e+1),h=5),32<=o&&o<=246&&(p=o-139,h=1),247<=o&&o<=250&&(p=256*(o-247)+i+108,h=2),251<=o&&o<=254&&(p=256*-(o-251)-i-108,h=2),255==o)throw p=a.readInt(r,e+1)/65535,h=5,"unknown number";if(30==o){var d=[];for(h=1;;){var l=r[e+h];h++;var u=l>>4,y=15&l;if(15!=u&&d.push(u),15!=y&&d.push(y),15==y)break}for(var v="",c=[0,1,2,3,4,5,6,7,8,9,".","e","e-","reserved","-","endOfNumber"],T=0;T<d.length;T++)v+=c[d[T]];p=parseFloat(v)}o<=21&&(f=["version","Notice","FullName","FamilyName","Weight","FontBBox","BlueValues","OtherBlues","FamilyBlues","FamilyOtherBlues","StdHW","StdVW","escape","UniqueID","XUID","charset","Encoding","CharStrings","Private","Subrs","defaultWidthX","nominalWidthX"][o],h=1,12==o&&(f=["Copyright","isFixedPitch","ItalicAngle","UnderlinePosition","UnderlineThickness","PaintType","CharstringType","FontMatrix","StrokeWidth","BlueScale","BlueShift","BlueFuzz","StemSnapH","StemSnapV","ForceBold",0,0,"LanguageGroup","ExpansionFactor","initialRandomSeed","SyntheticBase","PostScript","BaseFontName","BaseFontBlend",0,0,0,0,0,0,"ROS","CIDFontVersion","CIDFontRevision","CIDFontType","CIDCount","UIDBase","FDArray","FDSelect","FontName"][i],h=2)),null!=f?(n[f]=1==s.length?s[0]:s,s=[]):s.push(p),e+=h}return n},Typr.cmap={},Typr.cmap.parse=function(r,e,t){r=new Uint8Array(r.buffer,e,t),e=0;var a=Typr._bin,n={};a.readUshort(r,e),e+=2;var s=a.readUshort(r,e);e+=2;var o=[];n.tables=[];for(var i=0;i<s;i++){var h=a.readUshort(r,e);e+=2;var f=a.readUshort(r,e);e+=2;var p=a.readUint(r,e);e+=4;var d="p"+h+"e"+f,l=o.indexOf(p);if(-1==l){var u;l=n.tables.length,o.push(p);var y=a.readUshort(r,p);0==y?u=Typr.cmap.parse0(r,p):4==y?u=Typr.cmap.parse4(r,p):6==y?u=Typr.cmap.parse6(r,p):12==y&&(u=Typr.cmap.parse12(r,p)),n.tables.push(u)}if(null!=n[d])throw"multiple tables for one platform+encoding";n[d]=l}return n},Typr.cmap.parse0=function(r,e){var t=Typr._bin,a={};a.format=t.readUshort(r,e),e+=2;var n=t.readUshort(r,e);e+=2,t.readUshort(r,e),e+=2,a.map=[];for(var s=0;s<n-6;s++)a.map.push(r[e+s]);return a},Typr.cmap.parse4=function(r,e){var t=Typr._bin,a=e,n={};n.format=t.readUshort(r,e),e+=2;var s=t.readUshort(r,e);e+=2,t.readUshort(r,e),e+=2;var o=t.readUshort(r,e);e+=2;var i=o/2;n.searchRange=t.readUshort(r,e),e+=2,n.entrySelector=t.readUshort(r,e),e+=2,n.rangeShift=t.readUshort(r,e),e+=2,n.endCount=t.readUshorts(r,e,i),e+=2*i,e+=2,n.startCount=t.readUshorts(r,e,i),e+=2*i,n.idDelta=[];for(var h=0;h<i;h++)n.idDelta.push(t.readShort(r,e)),e+=2;for(n.idRangeOffset=t.readUshorts(r,e,i),e+=2*i,n.glyphIdArray=[];e<a+s;)n.glyphIdArray.push(t.readUshort(r,e)),e+=2;return n},Typr.cmap.parse6=function(r,e){var t=Typr._bin,a={};a.format=t.readUshort(r,e),e+=2,t.readUshort(r,e),e+=2,t.readUshort(r,e),e+=2,a.firstCode=t.readUshort(r,e),e+=2;var n=t.readUshort(r,e);e+=2,a.glyphIdArray=[];for(var s=0;s<n;s++)a.glyphIdArray.push(t.readUshort(r,e)),e+=2;return a},Typr.cmap.parse12=function(r,e){var t=Typr._bin,a={};a.format=t.readUshort(r,e),e+=2,e+=2,t.readUint(r,e),e+=4,t.readUint(r,e),e+=4;var n=t.readUint(r,e);e+=4,a.groups=[];for(var s=0;s<n;s++){var o=e+12*s,i=t.readUint(r,o+0),h=t.readUint(r,o+4),f=t.readUint(r,o+8);a.groups.push([i,h,f])}return a},Typr.glyf={},Typr.glyf.parse=function(r,e,t,a){for(var n=[],s=0;s<a.maxp.numGlyphs;s++)n.push(null);return n},Typr.glyf._parseGlyf=function(r,e){var t=Typr._bin,a=r._data,n=Typr._tabOffset(a,"glyf",r._offset)+r.loca[e];if(r.loca[e]==r.loca[e+1])return null;var s={};if(s.noc=t.readShort(a,n),n+=2,s.xMin=t.readShort(a,n),n+=2,s.yMin=t.readShort(a,n),n+=2,s.xMax=t.readShort(a,n),n+=2,s.yMax=t.readShort(a,n),n+=2,s.xMin>=s.xMax||s.yMin>=s.yMax)return null;if(s.noc>0){s.endPts=[];for(var o=0;o<s.noc;o++)s.endPts.push(t.readUshort(a,n)),n+=2;var i=t.readUshort(a,n);if(n+=2,a.length-n<i)return null;s.instructions=t.readBytes(a,n,i),n+=i;var h=s.endPts[s.noc-1]+1;for(s.flags=[],o=0;o<h;o++){var f=a[n];if(n++,s.flags.push(f),8&f){var p=a[n];n++;for(var d=0;d<p;d++)s.flags.push(f),o++}}for(s.xs=[],o=0;o<h;o++){var l=!!(2&s.flags[o]),u=!!(16&s.flags[o]);l?(s.xs.push(u?a[n]:-a[n]),n++):u?s.xs.push(0):(s.xs.push(t.readShort(a,n)),n+=2)}for(s.ys=[],o=0;o<h;o++)l=!!(4&s.flags[o]),u=!!(32&s.flags[o]),l?(s.ys.push(u?a[n]:-a[n]),n++):u?s.ys.push(0):(s.ys.push(t.readShort(a,n)),n+=2);var y=0,v=0;for(o=0;o<h;o++)y+=s.xs[o],v+=s.ys[o],s.xs[o]=y,s.ys[o]=v}else{var c;s.parts=[];do{c=t.readUshort(a,n),n+=2;var T={m:{a:1,b:0,c:0,d:1,tx:0,ty:0},p1:-1,p2:-1};if(s.parts.push(T),T.glyphIndex=t.readUshort(a,n),n+=2,1&c){var U=t.readShort(a,n);n+=2;var g=t.readShort(a,n);n+=2}else U=t.readInt8(a,n),n++,g=t.readInt8(a,n),n++;2&c?(T.m.tx=U,T.m.ty=g):(T.p1=U,T.p2=g),8&c?(T.m.a=T.m.d=t.readF2dot14(a,n),n+=2):64&c?(T.m.a=t.readF2dot14(a,n),n+=2,T.m.d=t.readF2dot14(a,n),n+=2):128&c&&(T.m.a=t.readF2dot14(a,n),n+=2,T.m.b=t.readF2dot14(a,n),n+=2,T.m.c=t.readF2dot14(a,n),n+=2,T.m.d=t.readF2dot14(a,n),n+=2)}while(32&c);if(256&c){var S=t.readUshort(a,n);for(n+=2,s.instr=[],o=0;o<S;o++)s.instr.push(a[n]),n++}}return s},Typr.GPOS={},Typr.GPOS.parse=function(r,e,t,a){return Typr._lctf.parse(r,e,t,a,Typr.GPOS.subt)},Typr.GPOS.subt=function(r,e,t,a){var n=Typr._bin,s=t,o={};if(o.fmt=n.readUshort(r,t),t+=2,1==e||2==e||3==e||7==e||8==e&&o.fmt<=2){var i=n.readUshort(r,t);t+=2,o.coverage=Typr._lctf.readCoverage(r,i+s)}if(1==e&&1==o.fmt){var h=n.readUshort(r,t);t+=2;var f=Typr._lctf.numOfOnes(h);0!=h&&(o.pos=Typr.GPOS.readValueRecord(r,t,h))}else{if(!(2==e&&o.fmt>=1&&o.fmt<=2)){if(9==e&&1==o.fmt){var p=n.readUshort(r,t);t+=2;var d=n.readUint(r,t);if(t+=4,9==a.ltype)a.ltype=p;else if(a.ltype!=p)throw"invalid extension substitution";return Typr.GPOS.subt(r,a.ltype,s+d)}return o}h=n.readUshort(r,t),t+=2;var l=n.readUshort(r,t);t+=2,f=Typr._lctf.numOfOnes(h);var u=Typr._lctf.numOfOnes(l);if(1==o.fmt){o.pairsets=[];var y=n.readUshort(r,t);t+=2;for(var v=0;v<y;v++){var c=s+n.readUshort(r,t);t+=2;var T=n.readUshort(r,c);c+=2;for(var U=[],g=0;g<T;g++){var S=n.readUshort(r,c);c+=2,0!=h&&(x=Typr.GPOS.readValueRecord(r,c,h),c+=2*f),0!=l&&(P=Typr.GPOS.readValueRecord(r,c,l),c+=2*u),U.push({gid2:S,val1:x,val2:P})}o.pairsets.push(U)}}if(2==o.fmt){var m=n.readUshort(r,t);t+=2;var b=n.readUshort(r,t);t+=2;var F=n.readUshort(r,t);t+=2;var _=n.readUshort(r,t);for(t+=2,o.classDef1=Typr._lctf.readClassDef(r,s+m),o.classDef2=Typr._lctf.readClassDef(r,s+b),o.matrix=[],v=0;v<F;v++){var C=[];for(g=0;g<_;g++){var x=null,P=null;0!=h&&(x=Typr.GPOS.readValueRecord(r,t,h),t+=2*f),0!=l&&(P=Typr.GPOS.readValueRecord(r,t,l),t+=2*u),C.push({val1:x,val2:P})}o.matrix.push(C)}}}},Typr.GPOS.readValueRecord=function(r,e,t){var a=Typr._bin,n=[];return n.push(1&t?a.readShort(r,e):0),e+=1&t?2:0,n.push(2&t?a.readShort(r,e):0),e+=2&t?2:0,n.push(4&t?a.readShort(r,e):0),e+=4&t?2:0,n.push(8&t?a.readShort(r,e):0),e+=8&t?2:0,n},Typr.GSUB={},Typr.GSUB.parse=function(r,e,t,a){return Typr._lctf.parse(r,e,t,a,Typr.GSUB.subt)},Typr.GSUB.subt=function(r,e,t,a){var n=Typr._bin,s=t,o={};if(o.fmt=n.readUshort(r,t),t+=2,1!=e&&4!=e&&5!=e&&6!=e)return null;if(1==e||4==e||5==e&&o.fmt<=2||6==e&&o.fmt<=2){var i=n.readUshort(r,t);t+=2,o.coverage=Typr._lctf.readCoverage(r,s+i)}if(1==e&&o.fmt>=1&&o.fmt<=2){if(1==o.fmt)o.delta=n.readShort(r,t),t+=2;else if(2==o.fmt){var h=n.readUshort(r,t);t+=2,o.newg=n.readUshorts(r,t,h),t+=2*o.newg.length}}else if(4==e){o.vals=[],h=n.readUshort(r,t),t+=2;for(var f=0;f<h;f++){var p=n.readUshort(r,t);t+=2,o.vals.push(Typr.GSUB.readLigatureSet(r,s+p))}}else if(5==e&&2==o.fmt){if(2==o.fmt){var d=n.readUshort(r,t);t+=2,o.cDef=Typr._lctf.readClassDef(r,s+d),o.scset=[];var l=n.readUshort(r,t);for(t+=2,f=0;f<l;f++){var u=n.readUshort(r,t);t+=2,o.scset.push(0==u?null:Typr.GSUB.readSubClassSet(r,s+u))}}}else{if(6!=e||3!=o.fmt){if(7==e&&1==o.fmt){var y=n.readUshort(r,t);t+=2;var v=n.readUint(r,t);if(t+=4,9==a.ltype)a.ltype=y;else if(a.ltype!=y)throw"invalid extension substitution";return Typr.GSUB.subt(r,a.ltype,s+v)}return o}if(3==o.fmt){for(f=0;f<3;f++){h=n.readUshort(r,t),t+=2;for(var c=[],T=0;T<h;T++)c.push(Typr._lctf.readCoverage(r,s+n.readUshort(r,t+2*T)));t+=2*h,0==f&&(o.backCvg=c),1==f&&(o.inptCvg=c),2==f&&(o.ahedCvg=c)}h=n.readUshort(r,t),t+=2,o.lookupRec=Typr.GSUB.readSubstLookupRecords(r,t,h)}}},Typr.GSUB.readSubClassSet=function(r,e){var t=Typr._bin.readUshort,a=e,n=[],s=t(r,e);e+=2;for(var o=0;o<s;o++){var i=t(r,e);e+=2,n.push(Typr.GSUB.readSubClassRule(r,a+i))}return n},Typr.GSUB.readSubClassRule=function(r,e){var t=Typr._bin.readUshort,a={},n=t(r,e),s=t(r,e+=2);e+=2,a.input=[];for(var o=0;o<n-1;o++)a.input.push(t(r,e)),e+=2;return a.substLookupRecords=Typr.GSUB.readSubstLookupRecords(r,e,s),a},Typr.GSUB.readSubstLookupRecords=function(r,e,t){for(var a=Typr._bin.readUshort,n=[],s=0;s<t;s++)n.push(a(r,e),a(r,e+2)),e+=4;return n},Typr.GSUB.readChainSubClassSet=function(r,e){var t=Typr._bin,a=e,n=[],s=t.readUshort(r,e);e+=2;for(var o=0;o<s;o++){var i=t.readUshort(r,e);e+=2,n.push(Typr.GSUB.readChainSubClassRule(r,a+i))}return n},Typr.GSUB.readChainSubClassRule=function(r,e){for(var t=Typr._bin,a={},n=["backtrack","input","lookahead"],s=0;s<n.length;s++){var o=t.readUshort(r,e);e+=2,1==s&&o--,a[n[s]]=t.readUshorts(r,e,o),e+=2*a[n[s]].length}return o=t.readUshort(r,e),e+=2,a.subst=t.readUshorts(r,e,2*o),e+=2*a.subst.length,a},Typr.GSUB.readLigatureSet=function(r,e){var t=Typr._bin,a=e,n=[],s=t.readUshort(r,e);e+=2;for(var o=0;o<s;o++){var i=t.readUshort(r,e);e+=2,n.push(Typr.GSUB.readLigature(r,a+i))}return n},Typr.GSUB.readLigature=function(r,e){var t=Typr._bin,a={chain:[]};a.nglyph=t.readUshort(r,e),e+=2;var n=t.readUshort(r,e);e+=2;for(var s=0;s<n-1;s++)a.chain.push(t.readUshort(r,e)),e+=2;return a},Typr.head={},Typr.head.parse=function(r,e,t){var a=Typr._bin,n={};return a.readFixed(r,e),e+=4,n.fontRevision=a.readFixed(r,e),e+=4,a.readUint(r,e),e+=4,a.readUint(r,e),e+=4,n.flags=a.readUshort(r,e),e+=2,n.unitsPerEm=a.readUshort(r,e),e+=2,n.created=a.readUint64(r,e),e+=8,n.modified=a.readUint64(r,e),e+=8,n.xMin=a.readShort(r,e),e+=2,n.yMin=a.readShort(r,e),e+=2,n.xMax=a.readShort(r,e),e+=2,n.yMax=a.readShort(r,e),e+=2,n.macStyle=a.readUshort(r,e),e+=2,n.lowestRecPPEM=a.readUshort(r,e),e+=2,n.fontDirectionHint=a.readShort(r,e),e+=2,n.indexToLocFormat=a.readShort(r,e),e+=2,n.glyphDataFormat=a.readShort(r,e),e+=2,n},Typr.hhea={},Typr.hhea.parse=function(r,e,t){var a=Typr._bin,n={};return a.readFixed(r,e),e+=4,n.ascender=a.readShort(r,e),e+=2,n.descender=a.readShort(r,e),e+=2,n.lineGap=a.readShort(r,e),e+=2,n.advanceWidthMax=a.readUshort(r,e),e+=2,n.minLeftSideBearing=a.readShort(r,e),e+=2,n.minRightSideBearing=a.readShort(r,e),e+=2,n.xMaxExtent=a.readShort(r,e),e+=2,n.caretSlopeRise=a.readShort(r,e),e+=2,n.caretSlopeRun=a.readShort(r,e),e+=2,n.caretOffset=a.readShort(r,e),e+=2,e+=8,n.metricDataFormat=a.readShort(r,e),e+=2,n.numberOfHMetrics=a.readUshort(r,e),e+=2,n},Typr.hmtx={},Typr.hmtx.parse=function(r,e,t,a){for(var n=Typr._bin,s={aWidth:[],lsBearing:[]},o=0,i=0,h=0;h<a.maxp.numGlyphs;h++)h<a.hhea.numberOfHMetrics&&(o=n.readUshort(r,e),e+=2,i=n.readShort(r,e),e+=2),s.aWidth.push(o),s.lsBearing.push(i);return s},Typr.kern={},Typr.kern.parse=function(r,e,t,a){var n=Typr._bin,s=n.readUshort(r,e);if(e+=2,1==s)return Typr.kern.parseV1(r,e-2,t,a);var o=n.readUshort(r,e);e+=2;for(var i={glyph1:[],rval:[]},h=0;h<o;h++){e+=2,t=n.readUshort(r,e),e+=2;var f=n.readUshort(r,e);e+=2;var p=f>>>8;if(0!=(p&=15))throw"unknown kern table format: "+p;e=Typr.kern.readFormat0(r,e,i)}return i},Typr.kern.parseV1=function(r,e,t,a){var n=Typr._bin;n.readFixed(r,e),e+=4;var s=n.readUint(r,e);e+=4;for(var o={glyph1:[],rval:[]},i=0;i<s;i++){n.readUint(r,e),e+=4;var h=n.readUshort(r,e);e+=2,n.readUshort(r,e),e+=2;var f=h>>>8;if(0!=(f&=15))throw"unknown kern table format: "+f;e=Typr.kern.readFormat0(r,e,o)}return o},Typr.kern.readFormat0=function(r,e,t){var a=Typr._bin,n=-1,s=a.readUshort(r,e);e+=2,a.readUshort(r,e),e+=2,a.readUshort(r,e),e+=2,a.readUshort(r,e),e+=2;for(var o=0;o<s;o++){var i=a.readUshort(r,e);e+=2;var h=a.readUshort(r,e);e+=2;var f=a.readShort(r,e);e+=2,i!=n&&(t.glyph1.push(i),t.rval.push({glyph2:[],vals:[]}));var p=t.rval[t.rval.length-1];p.glyph2.push(h),p.vals.push(f),n=i}return e},Typr.loca={},Typr.loca.parse=function(r,e,t,a){var n=Typr._bin,s=[],o=a.head.indexToLocFormat,i=a.maxp.numGlyphs+1;if(0==o)for(var h=0;h<i;h++)s.push(n.readUshort(r,e+(h<<1))<<1);if(1==o)for(h=0;h<i;h++)s.push(n.readUint(r,e+(h<<2)));return s},Typr.maxp={},Typr.maxp.parse=function(r,e,t){var a=Typr._bin,n={},s=a.readUint(r,e);return e+=4,n.numGlyphs=a.readUshort(r,e),e+=2,65536==s&&(n.maxPoints=a.readUshort(r,e),e+=2,n.maxContours=a.readUshort(r,e),e+=2,n.maxCompositePoints=a.readUshort(r,e),e+=2,n.maxCompositeContours=a.readUshort(r,e),e+=2,n.maxZones=a.readUshort(r,e),e+=2,n.maxTwilightPoints=a.readUshort(r,e),e+=2,n.maxStorage=a.readUshort(r,e),e+=2,n.maxFunctionDefs=a.readUshort(r,e),e+=2,n.maxInstructionDefs=a.readUshort(r,e),e+=2,n.maxStackElements=a.readUshort(r,e),e+=2,n.maxSizeOfInstructions=a.readUshort(r,e),e+=2,n.maxComponentElements=a.readUshort(r,e),e+=2,n.maxComponentDepth=a.readUshort(r,e),e+=2),n},Typr.name={},Typr.name.parse=function(r,e,t){var a=Typr._bin,n={};a.readUshort(r,e),e+=2;var s=a.readUshort(r,e);e+=2,a.readUshort(r,e);for(var o,i=["copyright","fontFamily","fontSubfamily","ID","fullName","version","postScriptName","trademark","manufacturer","designer","description","urlVendor","urlDesigner","licence","licenceURL","---","typoFamilyName","typoSubfamilyName","compatibleFull","sampleText","postScriptCID","wwsFamilyName","wwsSubfamilyName","lightPalette","darkPalette"],h=e+=2,f=0;f<s;f++){var p=a.readUshort(r,e);e+=2;var d=a.readUshort(r,e);e+=2;var l=a.readUshort(r,e);e+=2;var u=a.readUshort(r,e);e+=2;var y=a.readUshort(r,e);e+=2;var v=a.readUshort(r,e);e+=2;var c,T=i[u],U=h+12*s+v;if(0==p)c=a.readUnicode(r,U,y/2);else if(3==p&&0==d)c=a.readUnicode(r,U,y/2);else if(0==d)c=a.readASCII(r,U,y);else if(1==d)c=a.readUnicode(r,U,y/2);else if(3==d)c=a.readUnicode(r,U,y/2);else{if(1!=p)throw"unknown encoding "+d+", platformID: "+p;c=a.readASCII(r,U,y)}var g="p"+p+","+l.toString(16);null==n[g]&&(n[g]={}),n[g][void 0!==T?T:u]=c,n[g]._lang=l}for(var S in n)if(null!=n[S].postScriptName&&1033==n[S]._lang)return n[S];for(var S in n)if(null!=n[S].postScriptName&&0==n[S]._lang)return n[S];for(var S in n)if(null!=n[S].postScriptName&&3084==n[S]._lang)return n[S];for(var S in n)if(null!=n[S].postScriptName)return n[S];for(var S in n){o=S;break}return n[o]},Typr["OS/2"]={},Typr["OS/2"].parse=function(r,e,t){var a=Typr._bin.readUshort(r,e);e+=2;var n={};if(0==a)Typr["OS/2"].version0(r,e,n);else if(1==a)Typr["OS/2"].version1(r,e,n);else if(2==a||3==a||4==a)Typr["OS/2"].version2(r,e,n);else{if(5!=a)throw"unknown OS/2 table version: "+a;Typr["OS/2"].version5(r,e,n)}return n},Typr["OS/2"].version0=function(r,e,t){var a=Typr._bin;return t.xAvgCharWidth=a.readShort(r,e),e+=2,t.usWeightClass=a.readUshort(r,e),e+=2,t.usWidthClass=a.readUshort(r,e),e+=2,t.fsType=a.readUshort(r,e),e+=2,t.ySubscriptXSize=a.readShort(r,e),e+=2,t.ySubscriptYSize=a.readShort(r,e),e+=2,t.ySubscriptXOffset=a.readShort(r,e),e+=2,t.ySubscriptYOffset=a.readShort(r,e),e+=2,t.ySuperscriptXSize=a.readShort(r,e),e+=2,t.ySuperscriptYSize=a.readShort(r,e),e+=2,t.ySuperscriptXOffset=a.readShort(r,e),e+=2,t.ySuperscriptYOffset=a.readShort(r,e),e+=2,t.yStrikeoutSize=a.readShort(r,e),e+=2,t.yStrikeoutPosition=a.readShort(r,e),e+=2,t.sFamilyClass=a.readShort(r,e),e+=2,t.panose=a.readBytes(r,e,10),e+=10,t.ulUnicodeRange1=a.readUint(r,e),e+=4,t.ulUnicodeRange2=a.readUint(r,e),e+=4,t.ulUnicodeRange3=a.readUint(r,e),e+=4,t.ulUnicodeRange4=a.readUint(r,e),e+=4,t.achVendID=[a.readInt8(r,e),a.readInt8(r,e+1),a.readInt8(r,e+2),a.readInt8(r,e+3)],e+=4,t.fsSelection=a.readUshort(r,e),e+=2,t.usFirstCharIndex=a.readUshort(r,e),e+=2,t.usLastCharIndex=a.readUshort(r,e),e+=2,t.sTypoAscender=a.readShort(r,e),e+=2,t.sTypoDescender=a.readShort(r,e),e+=2,t.sTypoLineGap=a.readShort(r,e),e+=2,t.usWinAscent=a.readUshort(r,e),e+=2,t.usWinDescent=a.readUshort(r,e),e+2},Typr["OS/2"].version1=function(r,e,t){var a=Typr._bin;return e=Typr["OS/2"].version0(r,e,t),t.ulCodePageRange1=a.readUint(r,e),e+=4,t.ulCodePageRange2=a.readUint(r,e),e+4},Typr["OS/2"].version2=function(r,e,t){var a=Typr._bin;return e=Typr["OS/2"].version1(r,e,t),t.sxHeight=a.readShort(r,e),e+=2,t.sCapHeight=a.readShort(r,e),e+=2,t.usDefault=a.readUshort(r,e),e+=2,t.usBreak=a.readUshort(r,e),e+=2,t.usMaxContext=a.readUshort(r,e),e+2},Typr["OS/2"].version5=function(r,e,t){var a=Typr._bin;return e=Typr["OS/2"].version2(r,e,t),t.usLowerOpticalPointSize=a.readUshort(r,e),e+=2,t.usUpperOpticalPointSize=a.readUshort(r,e),e+2},Typr.post={},Typr.post.parse=function(r,e,t){var a=Typr._bin,n={};return n.version=a.readFixed(r,e),e+=4,n.italicAngle=a.readFixed(r,e),e+=4,n.underlinePosition=a.readShort(r,e),e+=2,n.underlineThickness=a.readShort(r,e),e+=2,n},Typr.SVG={},Typr.SVG.parse=function(r,e,t){var a=Typr._bin,n={entries:[]},s=e;a.readUshort(r,e),e+=2;var o=a.readUint(r,e);e+=4,a.readUint(r,e),e+=4,e=o+s;var i=a.readUshort(r,e);e+=2;for(var h=0;h<i;h++){var f=a.readUshort(r,e);e+=2;var p=a.readUshort(r,e);e+=2;var d=a.readUint(r,e);e+=4;var l=a.readUint(r,e);e+=4;for(var u=new Uint8Array(r.buffer,s+d+o,l),y=a.readUTF8(u,0,u.length),v=f;v<=p;v++)n.entries[v]=y}return n},Typr.SVG.toPath=function(r){var e={cmds:[],crds:[]};if(null==r)return e;for(var t=(new DOMParser).parseFromString(r,"image/svg+xml").firstChild;"svg"!=t.tagName;)t=t.nextSibling;var a=t.getAttribute("viewBox");a=a?a.trim().split(" ").map(parseFloat):[0,0,1e3,1e3],Typr.SVG._toPath(t.children,e);for(var n=0;n<e.crds.length;n+=2){var s=e.crds[n],o=e.crds[n+1];s-=a[0],o=-(o-=a[1]),e.crds[n]=s,e.crds[n+1]=o}return e},Typr.SVG._toPath=function(r,e,t){for(var a=0;a<r.length;a++){var n=r[a],s=n.tagName,o=n.getAttribute("fill");if(null==o&&(o=t),"g"==s)Typr.SVG._toPath(n.children,e,o);else if("path"==s){e.cmds.push(o||"#000000");var i=n.getAttribute("d"),h=Typr.SVG._tokens(i);Typr.SVG._toksToPath(h,e),e.cmds.push("X")}}},Typr.SVG._tokens=function(r){for(var e=[],t=0,a=!1,n="";t<r.length;){var s=r.charCodeAt(t),o=r.charAt(t);t++;var i=48<=s&&s<=57||"."==o||"-"==o;a?"-"==o?(e.push(parseFloat(n)),n=o):i?n+=o:(e.push(parseFloat(n)),","!=o&&" "!=o&&e.push(o),a=!1):i?(n=o,a=!0):","!=o&&" "!=o&&e.push(o)}return a&&e.push(parseFloat(n)),e},Typr.SVG._toksToPath=function(r,e){for(var t=0,a=0,n=0,s=0,o=0,i={M:2,L:2,H:1,V:1,S:4,C:6},h=e.cmds,f=e.crds;t<r.length;){var p=r[t];if(t++,"z"==p)h.push("Z"),a=s,n=o;else for(var d=p.toUpperCase(),l=i[d],u=Typr.SVG._reps(r,t,l),y=0;y<u;y++){var v=0,c=0;if(p!=d&&(v=a,c=n),"M"==d)a=v+r[t++],n=c+r[t++],h.push("M"),f.push(a,n),s=a,o=n;else if("L"==d)a=v+r[t++],n=c+r[t++],h.push("L"),f.push(a,n);else if("H"==d)a=v+r[t++],h.push("L"),f.push(a,n);else if("V"==d)n=c+r[t++],h.push("L"),f.push(a,n);else if("C"==d){var T=v+r[t++],U=c+r[t++],g=v+r[t++],S=c+r[t++],m=v+r[t++],b=c+r[t++];h.push("C"),f.push(T,U,g,S,m,b),a=m,n=b}else if("S"==d){var F=Math.max(f.length-4,0);T=a+a-f[F],U=n+n-f[F+1],g=v+r[t++],S=c+r[t++],m=v+r[t++],b=c+r[t++],h.push("C"),f.push(T,U,g,S,m,b),a=m,n=b}}}},Typr.SVG._reps=function(r,e,t){for(var a=e;a<r.length&&"string"!=typeof r[a];)a+=t;return(a-e)/t},null==Typr&&(Typr={}),null==Typr.U&&(Typr.U={}),Typr.U.codeToGlyph=function(r,e){for(var t=r.cmap,a=0,n=[t.p0e4,t.p3e1,t.p3e10,t.p0e3,t.p1e0];a<n.length;a++){var s=n[a];if(null!=s){var o=t.tables[s];if(0==o.format){if(e>=o.map.length)continue;return o.map[e]}if(4==o.format){for(var i=-1,h=0;h<o.endCount.length;h++)if(e<=o.endCount[h]){i=h;break}if(-1==i)continue;if(o.startCount[i]>e)continue;return 65535&(0!=o.idRangeOffset[i]?o.glyphIdArray[e-o.startCount[i]+(o.idRangeOffset[i]>>1)-(o.idRangeOffset.length-i)]:e+o.idDelta[i])}if(12!=o.format)throw"unknown cmap table format "+o.format;if(e>o.groups[o.groups.length-1][1])continue;for(h=0;h<o.groups.length;h++){var f=o.groups[h];if(f[0]<=e&&e<=f[1])return f[2]+(e-f[0])}}}return 0},Typr.U.glyphToPath=function(r,e){var t={cmds:[],crds:[]};if(r.SVG&&r.SVG.entries[e]){var a=r.SVG.entries[e];return null==a?t:("string"==typeof a&&(a=Typr.SVG.toPath(a),r.SVG.entries[e]=a),a)}if(r.CFF){var n={x:0,y:0,stack:[],nStems:0,haveWidth:!1,width:r.CFF.Private?r.CFF.Private.defaultWidthX:0,open:!1},s=r.CFF,o=r.CFF.Private;if(s.ROS){for(var i=0;s.FDSelect[i+2]<=e;)i+=2;o=s.FDArray[s.FDSelect[i+1]].Private}Typr.U._drawCFF(r.CFF.CharStrings[e],n,s,o,t)}else r.glyf&&Typr.U._drawGlyf(e,r,t);return t},Typr.U._drawGlyf=function(r,e,t){var a=e.glyf[r];null==a&&(a=e.glyf[r]=Typr.glyf._parseGlyf(e,r)),null!=a&&(a.noc>-1?Typr.U._simpleGlyph(a,t):Typr.U._compoGlyph(a,e,t))},Typr.U._simpleGlyph=function(r,e){for(var t=0;t<r.noc;t++){for(var a=0==t?0:r.endPts[t-1]+1,n=r.endPts[t],s=a;s<=n;s++){var o=s==a?n:s-1,i=s==n?a:s+1,h=1&r.flags[s],f=1&r.flags[o],p=1&r.flags[i],d=r.xs[s],l=r.ys[s];if(s==a)if(h){if(!f){Typr.U.P.moveTo(e,d,l);continue}Typr.U.P.moveTo(e,r.xs[o],r.ys[o])}else f?Typr.U.P.moveTo(e,r.xs[o],r.ys[o]):Typr.U.P.moveTo(e,(r.xs[o]+d)/2,(r.ys[o]+l)/2);h?f&&Typr.U.P.lineTo(e,d,l):p?Typr.U.P.qcurveTo(e,d,l,r.xs[i],r.ys[i]):Typr.U.P.qcurveTo(e,d,l,(d+r.xs[i])/2,(l+r.ys[i])/2)}Typr.U.P.closePath(e)}},Typr.U._compoGlyph=function(r,e,t){for(var a=0;a<r.parts.length;a++){var n={cmds:[],crds:[]},s=r.parts[a];Typr.U._drawGlyf(s.glyphIndex,e,n);for(var o=s.m,i=0;i<n.crds.length;i+=2){var h=n.crds[i],f=n.crds[i+1];t.crds.push(h*o.a+f*o.b+o.tx),t.crds.push(h*o.c+f*o.d+o.ty)}for(i=0;i<n.cmds.length;i++)t.cmds.push(n.cmds[i])}},Typr.U._getGlyphClass=function(r,e){var t=Typr._lctf.getInterval(e,r);return-1==t?0:e[t+2]},Typr.U.getPairAdjustment=function(r,e,t){var a=!1;if(r.GPOS)for(var n=r.GPOS,s=n.lookupList,o=n.featureList,i=[],h=0;h<o.length;h++){var f=o[h];if("kern"==f.tag){a=!0;for(var p=0;p<f.tab.length;p++)if(!i[f.tab[p]]){i[f.tab[p]]=!0;for(var d=s[f.tab[p]],l=0;l<d.tabs.length;l++)if(null!=d.tabs[l]){var u,y=d.tabs[l];if(!y.coverage||-1!=(u=Typr._lctf.coverageIndex(y.coverage,e)))if(1==d.ltype);else if(2==d.ltype){var v=null;if(1==y.fmt){var c=y.pairsets[u];for(h=0;h<c.length;h++)c[h].gid2==t&&(v=c[h])}else if(2==y.fmt){var T=Typr.U._getGlyphClass(e,y.classDef1),U=Typr.U._getGlyphClass(t,y.classDef2);v=y.matrix[T][U]}if(v){var g=0;return v.val1&&v.val1[2]&&(g+=v.val1[2]),v.val2&&v.val2[0]&&(g+=v.val2[0]),g}}}}}}if(r.kern&&!a){var S=r.kern.glyph1.indexOf(e);if(-1!=S){var m=r.kern.rval[S].glyph2.indexOf(t);if(-1!=m)return r.kern.rval[S].vals[m]}}return 0},Typr.U.stringToGlyphs=function(r,e){for(var t=[],a=0;a<e.length;a++)(n=e.codePointAt(a))>65535&&a++,t.push(Typr.U.codeToGlyph(r,n));for(a=0;a<e.length;a++){var n;if(2367==(n=e.codePointAt(a))){var s=t[a-1];t[a-1]=t[a],t[a]=s}n>65535&&a++}var o=r.GSUB;if(null==o)return t;for(var i=o.lookupList,h=o.featureList,f=["rlig","liga","mset","isol","init","fina","medi","half","pres","blws"],p=[],d=0;d<h.length;d++){var l=h[d];if(-1!=f.indexOf(l.tag))for(var u=0;u<l.tab.length;u++)if(!p[l.tab[u]]){p[l.tab[u]]=!0;for(var y=i[l.tab[u]],v=0;v<t.length;v++){var c=Typr.U._getWPfeature(e,v);-1!="isol,init,fina,medi".indexOf(l.tag)&&l.tag!=c||Typr.U._applySubs(t,v,y,i)}}}return t},Typr.U._getWPfeature=function(r,e){var t='\n\t" ,.:;!?()  ،',a="آأؤإاةدذرزوٱٲٳٵٶٷڈډڊڋڌڍڎڏڐڑڒړڔڕږڗژڙۀۃۄۅۆۇۈۉۊۋۍۏےۓەۮۯܐܕܖܗܘܙܞܨܪܬܯݍݙݚݛݫݬݱݳݴݸݹࡀࡆࡇࡉࡔࡧࡩࡪࢪࢫࢬࢮࢱࢲࢹૅેૉ૊૎૏ૐ૑૒૝ૡ૤૯஁ஃ஄அஉ஌எஏ஑னப஫஬",n=0==e||-1!=t.indexOf(r[e-1]),s=e==r.length-1||-1!=t.indexOf(r[e+1]);return n||-1==a.indexOf(r[e-1])||(n=!0),s||-1==a.indexOf(r[e])||(s=!0),s||-1=="ꡲ્૗".indexOf(r[e+1])||(s=!0),n||-1=="ꡲ્૗".indexOf(r[e])||(n=!0),n?s?"isol":"init":s?"fina":"medi"},Typr.U._applySubs=function(r,e,t,a){for(var n=r.length-e-1,s=0;s<t.tabs.length;s++)if(null!=t.tabs[s]){var o,i=t.tabs[s];if(!i.coverage||-1!=(o=Typr._lctf.coverageIndex(i.coverage,r[e])))if(1==t.ltype)r[e],1==i.fmt?r[e]=r[e]+i.delta:r[e]=i.newg[o];else if(4==t.ltype)for(var h=i.vals[o],f=0;f<h.length;f++){var p=h[f],d=p.chain.length;if(!(d>n)){for(var l=!0,u=0,y=0;y<d;y++){for(;-1==r[e+u+(1+y)];)u++;p.chain[y]!=r[e+u+(1+y)]&&(l=!1)}if(l){for(r[e]=p.nglyph,y=0;y<d+u;y++)r[e+y+1]=-1;break}}}else if(5==t.ltype&&2==i.fmt)for(var v=Typr._lctf.getInterval(i.cDef,r[e]),c=i.cDef[v+2],T=i.scset[c],U=0;U<T.length;U++){var g=T[U],S=g.input;if(!(S.length>n)){for(l=!0,y=0;y<S.length;y++){var m=Typr._lctf.getInterval(i.cDef,r[e+1+y]);if(-1==v&&i.cDef[m+2]!=S[y]){l=!1;break}}if(l){var b=g.substLookupRecords;for(f=0;f<b.length;f+=2)b[f],b[f+1]}}}else if(6==t.ltype&&3==i.fmt){if(!Typr.U._glsCovered(r,i.backCvg,e-i.backCvg.length))continue;if(!Typr.U._glsCovered(r,i.inptCvg,e))continue;if(!Typr.U._glsCovered(r,i.ahedCvg,e+i.inptCvg.length))continue;var F=i.lookupRec;for(U=0;U<F.length;U+=2){v=F[U];var _=a[F[U+1]];Typr.U._applySubs(r,e+v,_,a)}}}},Typr.U._glsCovered=function(r,e,t){for(var a=0;a<e.length;a++)if(-1==Typr._lctf.coverageIndex(e[a],r[t+a]))return!1;return!0},Typr.U.glyphsToPath=function(r,e,t){for(var a={cmds:[],crds:[]},n=0,s=0;s<e.length;s++){var o=e[s];if(-1!=o){for(var i=s<e.length-1&&-1!=e[s+1]?e[s+1]:0,h=Typr.U.glyphToPath(r,o),f=0;f<h.crds.length;f+=2)a.crds.push(h.crds[f]+n),a.crds.push(h.crds[f+1]);for(t&&a.cmds.push(t),f=0;f<h.cmds.length;f++)a.cmds.push(h.cmds[f]);t&&a.cmds.push("X"),n+=r.hmtx.aWidth[o],s<e.length-1&&(n+=Typr.U.getPairAdjustment(r,o,i))}}return a},Typr.U.pathToSVG=function(r,e){null==e&&(e=5);for(var t=[],a=0,n={M:2,L:2,Q:4,C:6},s=0;s<r.cmds.length;s++){var o=r.cmds[s],i=a+(n[o]?n[o]:0);for(t.push(o);a<i;){var h=r.crds[a++];t.push(parseFloat(h.toFixed(e))+(a==i?"":" "))}}return t.join("")},Typr.U.pathToContext=function(r,e){for(var t=0,a=r.crds,n=0;n<r.cmds.length;n++){var s=r.cmds[n];"M"==s?(e.moveTo(a[t],a[t+1]),t+=2):"L"==s?(e.lineTo(a[t],a[t+1]),t+=2):"C"==s?(e.bezierCurveTo(a[t],a[t+1],a[t+2],a[t+3],a[t+4],a[t+5]),t+=6):"Q"==s?(e.quadraticCurveTo(a[t],a[t+1],a[t+2],a[t+3]),t+=4):"#"==s.charAt(0)?(e.beginPath(),e.fillStyle=s):"Z"==s?e.closePath():"X"==s&&e.fill()}},Typr.U.P={},Typr.U.P.moveTo=function(r,e,t){r.cmds.push("M"),r.crds.push(e,t)},Typr.U.P.lineTo=function(r,e,t){r.cmds.push("L"),r.crds.push(e,t)},Typr.U.P.curveTo=function(r,e,t,a,n,s,o){r.cmds.push("C"),r.crds.push(e,t,a,n,s,o)},Typr.U.P.qcurveTo=function(r,e,t,a,n){r.cmds.push("Q"),r.crds.push(e,t,a,n)},Typr.U.P.closePath=function(r){r.cmds.push("Z")},Typr.U._drawCFF=function(r,e,t,a,n){for(var s=e.stack,o=e.nStems,i=e.haveWidth,h=e.width,f=e.open,p=0,d=e.x,l=e.y,u=0,y=0,v=0,c=0,T=0,U=0,g=0,S=0,m=0,b=0,F={val:0,size:0};p<r.length;){Typr.CFF.getCharString(r,p,F);var _=F.val;if(p+=F.size,"o1"==_||"o18"==_)s.length%2!=0&&!i&&(h=s.shift()+a.nominalWidthX),o+=s.length>>1,s.length=0,i=!0;else if("o3"==_||"o23"==_)s.length%2!=0&&!i&&(h=s.shift()+a.nominalWidthX),o+=s.length>>1,s.length=0,i=!0;else if("o4"==_)s.length>1&&!i&&(h=s.shift()+a.nominalWidthX,i=!0),f&&Typr.U.P.closePath(n),l+=s.pop(),Typr.U.P.moveTo(n,d,l),f=!0;else if("o5"==_)for(;s.length>0;)d+=s.shift(),l+=s.shift(),Typr.U.P.lineTo(n,d,l);else if("o6"==_||"o7"==_)for(var C=s.length,x="o6"==_,P=0;P<C;P++){var I=s.shift();x?d+=I:l+=I,x=!x,Typr.U.P.lineTo(n,d,l)}else if("o8"==_||"o24"==_){C=s.length;for(var G=0;G+6<=C;)u=d+s.shift(),y=l+s.shift(),v=u+s.shift(),c=y+s.shift(),d=v+s.shift(),l=c+s.shift(),Typr.U.P.curveTo(n,u,y,v,c,d,l),G+=6;"o24"==_&&(d+=s.shift(),l+=s.shift(),Typr.U.P.lineTo(n,d,l))}else{if("o11"==_)break;if("o1234"==_||"o1235"==_||"o1236"==_||"o1237"==_)"o1234"==_&&(y=l,v=(u=d+s.shift())+s.shift(),b=c=y+s.shift(),U=c,S=l,d=(g=(T=(m=v+s.shift())+s.shift())+s.shift())+s.shift(),Typr.U.P.curveTo(n,u,y,v,c,m,b),Typr.U.P.curveTo(n,T,U,g,S,d,l)),"o1235"==_&&(u=d+s.shift(),y=l+s.shift(),v=u+s.shift(),c=y+s.shift(),m=v+s.shift(),b=c+s.shift(),T=m+s.shift(),U=b+s.shift(),g=T+s.shift(),S=U+s.shift(),d=g+s.shift(),l=S+s.shift(),s.shift(),Typr.U.P.curveTo(n,u,y,v,c,m,b),Typr.U.P.curveTo(n,T,U,g,S,d,l)),"o1236"==_&&(u=d+s.shift(),y=l+s.shift(),v=u+s.shift(),b=c=y+s.shift(),U=c,g=(T=(m=v+s.shift())+s.shift())+s.shift(),S=U+s.shift(),d=g+s.shift(),Typr.U.P.curveTo(n,u,y,v,c,m,b),Typr.U.P.curveTo(n,T,U,g,S,d,l)),"o1237"==_&&(u=d+s.shift(),y=l+s.shift(),v=u+s.shift(),c=y+s.shift(),m=v+s.shift(),b=c+s.shift(),T=m+s.shift(),U=b+s.shift(),g=T+s.shift(),S=U+s.shift(),Math.abs(g-d)>Math.abs(S-l)?d=g+s.shift():l=S+s.shift(),Typr.U.P.curveTo(n,u,y,v,c,m,b),Typr.U.P.curveTo(n,T,U,g,S,d,l));else if("o14"==_){if(s.length>0&&!i&&(h=s.shift()+t.nominalWidthX,i=!0),4==s.length){var O=s.shift(),w=s.shift(),k=s.shift(),D=s.shift(),B=Typr.CFF.glyphBySE(t,k),L=Typr.CFF.glyphBySE(t,D);Typr.U._drawCFF(t.CharStrings[B],e,t,a,n),e.x=O,e.y=w,Typr.U._drawCFF(t.CharStrings[L],e,t,a,n)}f&&(Typr.U.P.closePath(n),f=!1)}else if("o19"==_||"o20"==_)s.length%2!=0&&!i&&(h=s.shift()+a.nominalWidthX),o+=s.length>>1,s.length=0,i=!0,p+=o+7>>3;else if("o21"==_)s.length>2&&!i&&(h=s.shift()+a.nominalWidthX,i=!0),l+=s.pop(),d+=s.pop(),f&&Typr.U.P.closePath(n),Typr.U.P.moveTo(n,d,l),f=!0;else if("o22"==_)s.length>1&&!i&&(h=s.shift()+a.nominalWidthX,i=!0),d+=s.pop(),f&&Typr.U.P.closePath(n),Typr.U.P.moveTo(n,d,l),f=!0;else if("o25"==_){for(;s.length>6;)d+=s.shift(),l+=s.shift(),Typr.U.P.lineTo(n,d,l);u=d+s.shift(),y=l+s.shift(),v=u+s.shift(),c=y+s.shift(),d=v+s.shift(),l=c+s.shift(),Typr.U.P.curveTo(n,u,y,v,c,d,l)}else if("o26"==_)for(s.length%2&&(d+=s.shift());s.length>0;)u=d,y=l+s.shift(),d=v=u+s.shift(),l=(c=y+s.shift())+s.shift(),Typr.U.P.curveTo(n,u,y,v,c,d,l);else if("o27"==_)for(s.length%2&&(l+=s.shift());s.length>0;)y=l,v=(u=d+s.shift())+s.shift(),c=y+s.shift(),d=v+s.shift(),l=c,Typr.U.P.curveTo(n,u,y,v,c,d,l);else if("o10"==_||"o29"==_){var A="o10"==_?a:t;if(0==s.length);else{var R=s.pop(),V=A.Subrs[R+A.Bias];e.x=d,e.y=l,e.nStems=o,e.haveWidth=i,e.width=h,e.open=f,Typr.U._drawCFF(V,e,t,a,n),d=e.x,l=e.y,o=e.nStems,i=e.haveWidth,h=e.width,f=e.open}}else if("o30"==_||"o31"==_){var W=s.length,M=(G=0,"o31"==_);for(G+=W-(C=-3&W);G<C;)M?(y=l,v=(u=d+s.shift())+s.shift(),l=(c=y+s.shift())+s.shift(),C-G==5?(d=v+s.shift(),G++):d=v,M=!1):(u=d,y=l+s.shift(),v=u+s.shift(),c=y+s.shift(),d=v+s.shift(),C-G==5?(l=c+s.shift(),G++):l=c,M=!0),Typr.U.P.curveTo(n,u,y,v,c,d,l),G+=4}else{if("o"==(_+"").charAt(0))throw _;s.push(_)}}}e.x=d,e.y=l,e.nStems=o,e.haveWidth=i,e.width=h,e.open=f},Typr$1.Typr=Typr;var Typr_js_1=Typr$1;
  var friendlyTags = { "aalt": "Access All Alternates", "abvf": "Above-base Forms", "abvm": "Above - base Mark Positioning", "abvs": "Above - base Substitutions", "afrc": "Alternative Fractions", "akhn": "Akhands", "blwf": "Below - base Forms", "blwm": "Below - base Mark Positioning", "blws": "Below - base Substitutions", "calt": "Contextual Alternates", "case": "Case - Sensitive Forms", "ccmp": "Glyph Composition / Decomposition", "cfar": "Conjunct Form After Ro", "cjct": "Conjunct Forms", "clig": "Contextual Ligatures", "cpct": "Centered CJK Punctuation", "cpsp": "Capital Spacing", "cswh": "Contextual Swash", "curs": "Cursive Positioning", "c2pc": "Petite Capitals From Capitals", "c2sc": "Small Capitals From Capitals", "dist": "Distances", "dlig": "Discretionary Ligatures", "dnom": "Denominators", "dtls": "Dotless Forms", "expt": "Expert Forms", "falt": "Final Glyph on Line Alternates", "fin2": "Terminal Forms #2", "fin3": "Terminal Forms #3", "fina": "Terminal Forms", "flac": "Flattened accent forms", "frac": "Fractions", "fwid": "Full Widths", "half": "Half Forms", "haln": "Halant Forms", "halt": "Alternate Half Widths", "hist": "Historical Forms", "hkna": "Horizontal Kana Alternates", "hlig": "Historical Ligatures", "hngl": "Hangul", "hojo": "Hojo Kanji Forms(JIS X 0212 - 1990 Kanji Forms)", "hwid": "Half Widths", "init": "Initial Forms", "isol": "Isolated Forms", "ital": "Italics", "jalt": "Justification Alternates", "jp78": "JIS78 Forms", "jp83": "JIS83 Forms", "jp90": "JIS90 Forms", "jp04": "JIS2004 Forms", "kern": "Kerning", "lfbd": "Left Bounds", "liga": "Standard Ligatures", "ljmo": "Leading Jamo Forms", "lnum": "Lining Figures", "locl": "Localized Forms", "ltra": "Left - to - right alternates", "ltrm": "Left - to - right mirrored forms", "mark": "Mark Positioning", "med2": "Medial Forms #2", "medi": "Medial Forms", "mgrk": "Mathematical Greek", "mkmk": "Mark to Mark Positioning", "mset": "Mark Positioning via Substitution", "nalt": "Alternate Annotation Forms", "nlck": "NLC Kanji Forms", "nukt": "Nukta Forms", "numr": "Numerators", "onum": "Oldstyle Figures", "opbd": "Optical Bounds", "ordn": "Ordinals", "ornm": "Ornaments", "palt": "Proportional Alternate Widths", "pcap": "Petite Capitals", "pkna": "Proportional Kana", "pnum": "Proportional Figures", "pref": "Pre - Base Forms", "pres": "Pre - base Substitutions", "pstf": "Post - base Forms", "psts": "Post - base Substitutions", "pwid": "Proportional Widths", "qwid": "Quarter Widths", "rand": "Randomize", "rclt": "Required Contextual Alternates", "rkrf": "Rakar Forms", "rlig": "Required Ligatures", "rphf": "Reph Forms", "rtbd": "Right Bounds", "rtla": "Right - to - left alternates", "rtlm": "Right - to - left mirrored forms", "ruby": "Ruby Notation Forms", "rvrn": "Required Variation Alternates", "salt": "Stylistic Alternates", "sinf": "Scientific Inferiors", "size": "Optical size", "smcp": "Small Capitals", "smpl": "Simplified Forms", "ssty": "Math script style alternates", "stch": "Stretching Glyph Decomposition", "subs": "Subscript", "sups": "Superscript", "swsh": "Swash", "titl": "Titling", "tjmo": "Trailing Jamo Forms", "tnam": "Traditional Name Forms", "tnum": "Tabular Figures", "trad": "Traditional Forms", "twid": "Third Widths", "unic": "Unicase", "valt": "Alternate Vertical Metrics", "vatu": "Vattu Variants", "vert": "Vertical Writing", "vhal": "Alternate Vertical Half Metrics", "vjmo": "Vowel Jamo Forms", "vkna": "Vertical Kana Alternates", "vkrn": "Vertical Kerning", "vpal": "Proportional Alternate Vertical Metrics", "vrt2": "Vertical Alternates and Rotation", "vrtr": "Vertical Alternates for Rotation", "zero": "Slashed Zero" };
  var Font = (
    
    function() {
      function Font2(data) {
        var obj = Typr_js_1.Typr.parse(data);
        if (!obj.length || typeof obj[0] !== "object" || typeof obj[0].hasOwnProperty !== "function") {
          throw "unable to parse font";
        }
        for (var n in obj[0]) {
          this[n] = obj[0][n];
        }
        this.enabledGSUB = {};
      }
      Font2.prototype.getFamilyName = function() {
        return this.name && (this.name.typoFamilyName || this.name.fontFamily) || "";
      };
      Font2.prototype.getSubFamilyName = function() {
        return this.name && (this.name.typoSubfamilyName || this.name.fontSubfamily) || "";
      };
      Font2.prototype.glyphToPath = function(gid) {
        return Typr_js_1.Typr.U.glyphToPath(this, gid);
      };
      Font2.prototype.getPairAdjustment = function(gid1, gid2) {
        return Typr_js_1.Typr.U.getPairAdjustment(this, gid1, gid2);
      };
      Font2.prototype.stringToGlyphs = function(str) {
        return Typr_js_1.Typr.U.stringToGlyphs(this, str);
      };
      Font2.prototype.glyphsToPath = function(gls) {
        return Typr_js_1.Typr.U.glyphsToPath(this, gls);
      };
      Font2.prototype.pathToSVG = function(path, prec) {
        return Typr_js_1.Typr.U.pathToSVG(path, prec);
      };
      Font2.prototype.pathToContext = function(path, ctx) {
        return Typr_js_1.Typr.U.pathToContext(path, ctx);
      };
      Font2.prototype.lookupFriendlyName = function(table, feature) {
        if (this[table] !== void 0) {
          var tbl = this[table];
          var feat = tbl.featureList[feature];
          return this.featureFriendlyName(feat);
        }
        return "";
      };
      Font2.prototype.featureFriendlyName = function(feature) {
        if (friendlyTags[feature.tag]) {
          return friendlyTags[feature.tag];
        }
        if (feature.tag.match(/ss[0-2][0-9]/)) {
          var name_1 = "Stylistic Set " + Number(feature.tag.substr(2, 2)).toString();
          if (feature.featureParams) {
            var version = Typr_js_1.Typr._bin.readUshort(this._data, feature.featureParams);
            if (version === 0) {
              var nameID = Typr_js_1.Typr._bin.readUshort(this._data, feature.featureParams + 2);
              if (this.name && this.name[nameID] !== void 0) {
                return name_1 + " - " + this.name[nameID];
              }
            }
          }
          return name_1;
        }
        if (feature.tag.match(/cv[0-9][0-9]/)) {
          return "Character Variant " + Number(feature.tag.substr(2, 2)).toString();
        }
        return "";
      };
      Font2.prototype.enableGSUB = function(featureNumber) {
        if (this.GSUB) {
          var feature = this.GSUB.featureList[featureNumber];
          if (feature) {
            for (var i = 0; i < feature.tab.length; ++i) {
              this.enabledGSUB[feature.tab[i]] = (this.enabledGSUB[feature.tab[i]] || 0) + 1;
            }
          }
        }
      };
      Font2.prototype.disableGSUB = function(featureNumber) {
        if (this.GSUB) {
          var feature = this.GSUB.featureList[featureNumber];
          if (feature) {
            for (var i = 0; i < feature.tab.length; ++i) {
              if (this.enabledGSUB[feature.tab[i]] > 1) {
                --this.enabledGSUB[feature.tab[i]];
              } else {
                delete this.enabledGSUB[feature.tab[i]];
              }
            }
          }
        }
      };
      Font2.prototype.codeToGlyph = function(code) {
        var g = Typr_js_1.Typr.U.codeToGlyph(this, code);
        if (this.GSUB) {
          var gls = [g];
          for (var n in this.enabledGSUB) {
            var l = this.GSUB.lookupList[n];
            Typr_js_1.Typr.U._applySubs(gls, 0, l, this.GSUB.lookupList);
          }
          if (gls.length === 1)
            return gls[0];
        }
        return g;
      };
      return Font2;
    }()
  );
  var Font_1 = Font;
  
  
  
  
  
  function decodeCipherFont(doc) {
    const styleNodes = doc.querySelectorAll("style");
    let cipherStyle = null;
    for (let i = 0; i < styleNodes.length; i++) {
      if (styleNodes[i].textContent?.includes("font-cxsecret")) {
        cipherStyle = styleNodes[i];
        break;
      }
    }
    if (!cipherStyle) return;
    const b64Match = cipherStyle.textContent?.match(/base64,([\w\W]+?)'/);
    if (!b64Match) return;
    const raw = window.atob(b64Match[1]);
    const buf = new ArrayBuffer(raw.length);
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const fontObj = new Font_1(buf);
    const encryptedEls = doc.querySelectorAll(".font-cxsecret");
    if (!encryptedEls.length) return;
    const ttfTable = JSON.parse(_GM_getResourceText("ttf"));
    const charMap = {};
    const pendingPoints = [];
    const seenPoints = new Set();
    for (let i = 0; i < encryptedEls.length; i++) {
      const html = encryptedEls[i].innerHTML;
      for (let j = 0; j < html.length; j++) {
        const cp = html.charCodeAt(j);
        if (cp >= 19968 && cp <= 40870 && !seenPoints.has(cp)) {
          seenPoints.add(cp);
          pendingPoints.push(cp);
        }
      }
    }
    pendingPoints.sort((a, b) => a - b);
    while (pendingPoints.length) {
      const codePoint = pendingPoints.shift();
      const glyphId = fontObj.codeToGlyph(codePoint);
      if (!glyphId) continue;
      const pathData = fontObj.glyphToPath(glyphId);
      const signature = md5(JSON.stringify(pathData)).slice(24);
      charMap[codePoint] = ttfTable[signature];
      const decodedPoint = String.fromCharCode(charMap[codePoint]).charCodeAt(0);
      if (decodedPoint > codePoint && decodedPoint >= 19968 && decodedPoint <= 40870 && !seenPoints.has(decodedPoint)) {
        seenPoints.add(decodedPoint);
        pendingPoints.push(decodedPoint);
        pendingPoints.sort((a, b) => a - b);
      }
    }
    for (let i = 0; i < encryptedEls.length; i++) {
      const el = encryptedEls[i];
      let text = el.innerHTML;
      for (const cp in charMap) {
        const decoded = String.fromCharCode(charMap[cp]);
        const re = new RegExp(String.fromCharCode(+cp), "g");
        text = text.replace(re, decoded);
      }
      el.innerHTML = text;
      el.classList.remove("font-cxsecret");
    }
  }
  
  
  
  
  
  const CX_FACE_SELECTORS = ["#fcqrimg", ".chapterVideoFaceMaskDiv", ".faceRecognition", ".face-verify"];
  const CX_FACE_TEXT_RE = /(请完成人脸识别|人脸识别验证|请进行人脸识别|请先完成人脸)/;

  const detectCxFacePrompt = () => {
    const doc = (typeof _unsafeWindow !== "undefined" && _unsafeWindow.document) || document;
    if (!doc || !doc.body) return false;
    for (const sel of CX_FACE_SELECTORS) {
      const el = doc.querySelector(sel);
      if (el && el.offsetHeight > 0) return true;
    }
    const layers = doc.querySelectorAll('[class*="face"],[class*="Face"],.maskDiv,.popDiv');
    for (const layer of layers) {
      if (layer.offsetHeight > 0 && CX_FACE_TEXT_RE.test(layer.innerText || "")) return true;
    }
    return false;
  };

  const waitForCxFaceRecognition = async (timeoutMs = 120000, pollMs = 2000) => {
    if (!detectCxFacePrompt()) return false;
    try {
      useLogStore().addLog("检测到人脸识别，请先完成验证，脚本将等待（最多120秒）", "danger");
    } catch (e) {}
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, pollMs));
      if (!detectCxFacePrompt()) return true;
    }
    return true;
  };

  class QuestionProcessor {
    constructor() {
      __publicField(this, "_document", document);           
      __publicField(this, "_window", _unsafeWindow);         
      __publicField(this, "addLog");                          
      __publicField(this, "addQuestion");                     
      __publicField(this, "questions", []);                   
      __publicField(this, "correctNum", 0);                   
      __publicField(this, "isFilling", false);                
      __publicField(this, "parseHtml", () => {                
        throw new Error("Abstract method: parseHtml must be implemented by subclass");
      });
      __publicField(this, "fillQuestion", (question) => {     
        throw new Error("Abstract method: fillQuestion must be implemented by subclass");
      });
      
      
      __publicField(this, "checkIfAnswered", (question) => {
        
        if (question.type === "0" || question.type === "1") {
          for (const key in question.options) {
            const optEl = question.options[key];
            
            if (optEl.getAttribute("aria-checked") === "true") return true;
            
            if (optEl.classList.contains("cur") || optEl.classList.contains("selected")) return true;
            
            const spanEl = optEl.querySelector("span.num_option_dx") || optEl.querySelector("span.num_option") || optEl.querySelector("span[data]");
            if (spanEl && (spanEl.classList.contains("cur") || spanEl.classList.contains("selected"))) return true;
            
            if (optEl.querySelector(".onChecked") || optEl.querySelector(".check_answer")) return true;
          }
          return false;
        }
        
        if (question.type === "2" || question.type === "14" || question.type === "15") {
          
          const taElements = question.element.querySelectorAll("textarea");
          for (const ta of taElements) {
            if (ta.value && ta.value.trim() !== "") {
              return true;
            }
          }
          
          const inpDivs = question.element.querySelectorAll(".InpDIV");
          for (const inpDiv of inpDivs) {
            if (inpDiv.innerHTML && inpDiv.innerHTML.trim() !== "") {
              return true;
            }
          }
          return false;
        }
        
        if (question.type === "3") {
          for (const key in question.options) {
            const optEl = question.options[key];
            
            if (optEl.getAttribute("aria-checked") === "true") return true;
            
            if (optEl.classList.contains("cur") || optEl.classList.contains("selected")) return true;
            
            const spanEl = optEl.querySelector("span.num_option") || optEl.querySelector("span[data]");
            if (spanEl && (spanEl.classList.contains("cur") || spanEl.classList.contains("selected"))) return true;
            
            if (optEl.querySelector(".onChecked") || optEl.querySelector(".check_answer")) return true;
          }
          return false;
        }
        
        if (question.type === "4" || question.type === "5" || question.type === "6" || question.type === "7") {
          const taEl = question.element.querySelector("textarea");
          if (taEl && taEl.value && taEl.value.trim() !== "") {
            return true;
          }
          return false;
        }
        
        
        if (question.type === "11") {
          const selectElements = question.element.querySelectorAll("select.dept_select");
          for (const sel of selectElements) {
            if (!sel.value || sel.value.trim() === "") return false;
          }
          return selectElements.length > 0;
        }
        
        return false;
      });
      
      __publicField(this, "typeMap", new Map([
        ["单选题", "0"], ["A1型题", "0"], ["A1A2型题", "0"],
        ["多选题", "1"], ["X型题", "1"],
        ["填空题", "2"], ["听力填空", "2"], ["听力对话填空", "2"], ["完形填空", "2"], ["短文填空", "2"], ["选词填空", "2"],
        ["填表题", "2"], ["阅读填空", "2"], ["阅读题", "2"], ["阅读理解", "2"],
        ["判断题", "3"],
        ["简答题", "4"], ["名词解释", "5"],
        ["论述题", "6"], ["计算题", "7"],
        ["排序题", "13"],
        ["连线题", "11"]
      ]));
      
      __publicField(this, "stripTags", (html) => {
        if (html == null) return "";
        return html.replace(REGEX.HTML_TAGS, "").replace(REGEX.NBSP, " ").replace(REGEX.WHITESPACE, " ").replace(REGEX.BR_TAG, "\n").replace(REGEX.IMG_TAG, '<img src="$1"/>').trim();
      });

      __publicField(this, "htmlWithAbsoluteImages", (el) => {
        if (!el) return "";
        let clone;
        try {
          clone = el.cloneNode(true);
        } catch (e) {
          return el.innerHTML || "";
        }
        const view = el.ownerDocument && el.ownerDocument.defaultView;
        const dropHidden = (src, dst) => {
          const srcChildren = Array.from(src.children || []);
          const dstChildren = Array.from(dst.children || []);
          for (let i = 0; i < srcChildren.length; i++) {
            const s = srcChildren[i];
            const d = dstChildren[i];
            if (!d) continue;
            const tag = String(s.tagName || "").toLowerCase();
            if (tag === "script" || tag === "style") {
              d.remove();
              continue;
            }
            let hidden = false;
            try {
              hidden = Boolean(view && s.isConnected && view.getComputedStyle(s).display === "none");
            } catch (e) {}
            if (hidden) {
              d.remove();
              continue;
            }
            dropHidden(s, d);
          }
        };
        try {
          dropHidden(el, clone);
        } catch (e) {}
        clone.querySelectorAll("img").forEach((img) => {
          const abs = img.src;
          if (abs) img.setAttribute("src", abs);
        });
        return clone.innerHTML;
      });
      
      __publicField(this, "trimTitle", (str) => {
        return str.replace(REGEX.CLEAN_TITLE, "");
      });
      const logStore = useLogStore();
      const questionStore = useQuestionStore();
      this.addLog = logStore.addLog;
      this.addQuestion = questionStore.addQuestion;
    }
  }
  
  
  
  const buildErrorResponse = (reason) => ({
    code: 50001,
    data: {
      answer: [],
      num: "",
      usenum: ""
    },
    msg: reason
  });
  
  const showNoticeDialog = (title, message, noticeType) => {
    const dialog = document.createElement('div');
    dialog.id = 'server-notice-dialog';
    dialog.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 2147483647; display: flex; align-items: center; justify-content: center;">
        <div style="background: #fff; border-radius: 12px; padding: 32px; max-width: 400px; width: 88%; box-shadow: 0 16px 40px rgba(0,0,0,0.08); animation: noticeFadeIn 0.25s ease-out;">
          <style>
            @keyframes noticeFadeIn {
              from { opacity: 0; transform: scale(0.97); }
              to { opacity: 1; transform: scale(1); }
            }
          </style>
          <div style="font-size: 17px; font-weight: 600; color: #111827; margin-bottom: 18px; letter-spacing: -0.02em;">${title}</div>

          <div style="color: #4b5563; font-size: 14px; line-height: 1.7; margin-bottom: 24px;">${message}</div>

          <div style="display: flex; gap: 10px;">
            <button id="notice-close-btn" style="flex: 1; background: #111827; color: #fff; border: none; padding: 11px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s;">我知道了</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    document.getElementById('notice-close-btn').onclick = () => {
      _GM_setValue('closed_notice_type', noticeType);
      dialog.remove();
    };
  };
  
  
  
  
  
  
  const checkServerNotice = () => {
    _GM_xmlhttpRequest({
      method: "GET",
      url: getRandomServer() + "/notice",
      timeout: 5000,
      onload: (response) => {
        try {
          const result = JSON.parse(response.responseText);
          if (result.code === 200 && result.data && result.data.enabled) {
            const noticeType = result.data.type || 1;
            const noticeMessage = result.data.message || '';
            const noticeTitle = result.data.title || '📢 系统公告';
            const closedNotice = _GM_getValue('closed_notice_type', 0);
            if (closedNotice === noticeType) {

              return;
            }
            showNoticeDialog(noticeTitle, noticeMessage, noticeType);
          }
        } catch (e) {
        }
      },

    });
  };
  
  
  
  
  
  
  
  const readCxParamValue = (partName, paramName, fallback = false) => {
    try {
      const parts = useConfigStore().platformParams?.cx?.parts || [];
      const part = parts.find(p => p.name === partName);
      const param = (part?.params || []).find(p => p.name === paramName);
      const val = param ? param.value : undefined;
      return val === undefined || val === null ? fallback : val;
    } catch (e) {
      return fallback;
    }
  };

  const fetchAnswerData = async (question) => {
    var _a;
    const _self = _unsafeWindow;
    const configStore = useConfigStore();
    const token = configStore.queryApis[0].token;

    window.__answerModeLogged = false;

    
    
    

    
    
    
    let verifyAnswer = false;
    let useAIOnly = false;  
    let enableWebSearch = false;  
    let aiType = globalModelConfig?.typeOptions?.[0] || '';  
    let aiModel = globalModelConfig?.defaultModels?.[aiType] || '';  
    const answerParamsPart = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === "答题参数");
    if (answerParamsPart && answerParamsPart.params) {
      const normalModeParam = answerParamsPart.params.find(p => p.name === "正常模式");
      const aiModeParam = answerParamsPart.params.find(p => p.name === "AI模式");
      const answerVerifyParam = answerParamsPart.params.find(p => p.name === "答案校验");
      const webSearchParam = answerParamsPart.params.find(p => p.name === "联网搜索");
      const aiTypeParam = answerParamsPart.params.find(p => p.name === "AI 类型选择");
      const aiModelParam = answerParamsPart.params.find(p => p.name === "AI 模型选择");
          
      
      if (aiTypeParam && aiTypeParam.value) {
        aiType = aiTypeParam.value;
      }
      if (aiModelParam && aiModelParam.value) {
        aiModel = aiModelParam.value;
      }
          
      
      if (aiModeParam && aiModeParam.value) {
        useAIOnly = true;  
      } else if (answerVerifyParam && answerVerifyParam.value) {
        verifyAnswer = true;  
      }
      
      
      if (webSearchParam && webSearchParam.value && useAIOnly) {
        enableWebSearch = true;
      }
      
    }
    
    
    const modelType = getModelType(aiType, aiModel);
    
    const logStore = useLogStore();
    if (!window.__answerModeLogged && useAIOnly) {
      logStore.addLog(`🎯 AI模型: ${aiType} - ${aiModel}`, 'info');
    }

    const userId = getUidRealtime();
    
    
    const questionData = {
      question: question.title,
      options: question.optionsText,
      type: ["14", "15"].includes(String(question.type)) ? "2" : question.type,
      questionData: question.element.outerHTML,
      workType: question.workType,
      id: ((_a = question.refer.match(/courseId=(\d+)/)) == null ? void 0 : _a[1]) || "",
      refer: question.refer,
      u: userId,
      t: Math.floor(( new Date()).getTime() / 1e3).toString()
    };
    
    
    const startTaskId = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
    
    const answerIntervalParam = answerParamsPart?.params.find(p => p.name === "答题间隔");
    const simulateDelay = answerParamsPart?.params.find(p => p.name === "模拟延迟")?.value ?? true;
    await (simulateDelay ? randomDelay(answerIntervalParam?.value || 1, 0.5) : delay(answerIntervalParam?.value || 1));
    
    
    const currentTaskIdAfterSleep = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
    if (currentTaskIdAfterSleep !== startTaskId) {
      return { code: 499, msg: '用户取消', data: null };
    }
    
    
    const sendRequest = (checkOnly = false) => {
      return new Promise((resolve) => {
        
        if (!checkOnly && !window.__answerModeLogged) {
          window.__answerModeLogged = true;
          const logStore = useLogStore();
          if (useAIOnly) {
            logStore.addLog('🤖 AI答题模式中', 'primary');
          } else if (verifyAnswer) {
            logStore.addLog('✅ 答案校验模式中', 'primary');
          } else {
            logStore.addLog('📚 正常模式答题中', 'primary');
          }
        }

        
        const logStore = useLogStore();
        if (useAIOnly && !checkOnly && !window.__inThinkingMode__) {
          logStore.addLog(`⏳ ${aiType} ${aiModel} 正在处理中，请耐心等待...`, 'info');
        }

        
        const timeout = checkOnly ? 60000 : 90000;
        
        _GM_xmlhttpRequest({
          url: getRandomServer(),
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          data: JSON.stringify({
            token: token,
            questionData: questionData,
            verifyAnswer: verifyAnswer,
            aiMode: useAIOnly,  
            enableWebSearch: enableWebSearch,  
            model: modelType,  
            checkOnly: checkOnly,  
            userId: questionData.u,
            async: true
          }),
          timeout: timeout,  
          onload: (response) => {
            try {
              const apiResponse = JSON.parse(response.responseText);
              
              if (apiResponse.code === 202 && apiResponse.data && apiResponse.data.taskId) {
                const taskId = apiResponse.data.taskId;
                pollQueryTask(taskId, resolve, globalPollInterval);
              } else {
                resolve(apiResponse);
              }
            } catch (e) {
              resolve(buildErrorResponse("解析出错"));
            }
          },
          onerror: () => resolve(buildErrorResponse("请求出错")),
          ontimeout: () => resolve({ code: 404, msg: "请求超时", data: { answer: [] } })
        });
      });
    };

    const pollQueryTask = (taskId, resolve, pollInterval = 1000) => {
      let pollCount = 0;
      const MAX_WAIT_MS = 6 * 60 * 1000;
      const maxPolls = Math.max(120, Math.ceil(MAX_WAIT_MS / Math.max(500, pollInterval)));
      
      const poll = () => {
        pollCount++;
        if (pollCount > maxPolls) {
          resolve(buildErrorResponse("查询超时"));
          return;
        }
        
        _GM_xmlhttpRequest({
          url: getRandomServer() + `/query-task/${taskId}`,
          method: "GET",
          timeout: 10000,
          onload: (response) => {
            try {
              const result = JSON.parse(response.responseText);
              if (result.code === 200 && result.data) {
                const { status, result: taskResult } = result.data;
                if (status === 'completed' && taskResult) {
                  resolve(taskResult);
                } else if (status === 'processing' || status === 'pending') {
                  setTimeout(poll, pollInterval);
                } else {
                  resolve(buildErrorResponse("查询异常"));
                }
              } else if (result.code === 404) {
                resolve(buildErrorResponse("任务过期"));
              } else {
                resolve(buildErrorResponse("轮询异常"));
              }
            } catch (e) {
              setTimeout(poll, pollInterval);
            }
          },
          onerror: () => setTimeout(poll, pollInterval),
          ontimeout: () => setTimeout(poll, pollInterval)
        });
      };
      
      setTimeout(poll, pollInterval);
    };

    
    const firstResponse = useAIOnly ? await sendRequest(false) : await sendRequest(true);

    if (firstResponse.code === 202 && firstResponse.status === "thinking") {
      const logStore = useLogStore();
      
      
      const thinkingModelName = firstResponse.data?.thinkingModel || 'AI模型';
      
      const thinkingStartTaskId = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
      logStore.addLog('🤔 答案校验失败，启动深度思考...', 'warning');
      logStore.addLog(`⏳ ${thinkingModelName} 正在深度思考中，请耐心等待...`, 'info');

      
      window.__inThinkingMode__ = true;

      
      
      const currentTaskId = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
      if (currentTaskId !== thinkingStartTaskId) {
        return { code: 499, msg: '用户取消', data: null };
      }
      
      
      await randomDelay(0.1, 0.15);
      
      
      const currentTaskId2 = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
      if (currentTaskId2 !== thinkingStartTaskId) {
        return { code: 499, msg: '用户取消', data: null };
      }
      
      const finalResponse = await sendRequest(false);

      
      window.__inThinkingMode__ = false;

      return finalResponse;
    }

    return firstResponse;
  };
  
  
  
  const queryAnswer = async (question) => {
    return await fetchAnswerData(question);
  };
  
  
  
  
  
  
  const detectAndReportResults = async (document, maxWaitTime = 10000) => {
    try {
      const logStore = useLogStore();
      const questionStore = useQuestionStore();
      
      
      let questionElements = [];
      const startTime = Date.now();
      while (Date.now() - startTime < maxWaitTime) {
        questionElements = document.querySelectorAll(SELECTORS.CX_QUESTION_ZJ);
        if (questionElements.length === 0) {
          questionElements = document.querySelectorAll(SELECTORS.CX_QUESTION_ZY_KS);
        }
        if (questionElements.length > 0) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (questionElements.length === 0) {
        logStore.addLog(`[正确性检测] 等待${maxWaitTime}ms后仍未找到题目元素，跳过上报`, "warning");
        return;
      }
      
      const questionsWithResults = [];
      let correctCount = 0;
      let wrongCount = 0;
      
      questionElements.forEach((qEl, index) => {
        const question = questionStore.questionList?.[index];
        if (!question) return;
        
        
        const markingDui = qEl.querySelector(".marking_dui");
        const markingCuo = qEl.querySelector(".marking_cuo");
        const markingBandui = qEl.querySelector(".marking_bandui");
        
        if (markingDui) {
          question.isCorrect = 1;
          correctCount++;
        } else if (markingCuo || markingBandui) {
          
          question.isCorrect = 0;
          wrongCount++;
        }
        
        questionsWithResults.push(question);
      });
      
      
      if (correctCount > 0 || wrongCount > 0) {
        logStore.addLog(`检测结果: ${correctCount}题正确, ${wrongCount}题错误`, correctCount > wrongCount ? "success" : "warning");
      }
      
      
      if (questionsWithResults.length > 0) {
        await reportAnswerResults(questionsWithResults);
      }
    } catch (e) {
      try {
        const logStore = useLogStore();
        logStore.addLog(`检测正确性出错: ${e.message}`, "danger");
      } catch (e2) {
      }
    }
  };
  
  
  
  
  
  
  const reportAnswerResults = async (questions) => {
    const configStore = useConfigStore();
    const logStore = useLogStore();
    const token = configStore.queryApis[0].token;
    
    
    const validQuestions = questions.filter(q => (q.type === "0" || q.type === "1" || q.type === "3") && (q.isCorrect === 0 || q.isCorrect === 1));
    
    if (validQuestions.length === 0) {
      logStore.addLog("无选择题/判断题，跳过正确性上报", "info");
      return;
    }
    
    logStore.addLog(`开始上报${validQuestions.length}道题的正确性结果...`, "primary");
    
    
    const reportData = validQuestions.map(q => ({
      question: q.title,
      options: q.optionsText || [],
      type: q.type,
      isCorrect: q.isCorrect 
    }));
    
    
    try {
      _GM_xmlhttpRequest({
        method: "POST",
        url: getRandomServer() + "/report-answer-results",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        data: JSON.stringify({
          results: reportData
        }),
        timeout: 10000,
        onload: (response) => {
          try {
            const res = JSON.parse(response.responseText);
            if (res.code === 200) {
              logStore.addLog(`✓ 正确性上报成功: ${res.data.successCount}/${validQuestions.length}`, "success");
            } else {
              logStore.addLog(`⚠ 正确性上报失败: ${res.msg}`, "warning");
            }
          } catch (e) {
            logStore.addLog(`⚠ 正确性上报响应解析失败`, "warning");
          }
        },
        ontimeout: () => {
          logStore.addLog(`⚠ 正确性上报超时(10秒)`, "warning");
        },
        onerror: () => {
          logStore.addLog(`⚠ 正确性上报网络错误`, "warning");
        }
      });
    } catch (e) {
      logStore.addLog(`⚠ 正确性上报异常: ${e.message}`, "warning");
    }
  };
  
  
  
  
  
  const computeMatch = (str1, str2) => {
    const s1 = str1.trim().toLowerCase();
    const s2 = str2.trim().toLowerCase();
    if (s1 === s2)
      return 100;
    if (s1.length === 0 || s2.length === 0)
      return 0;
    const matrix = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            
            matrix[i][j - 1] + 1,
            
            matrix[i - 1][j] + 1
            
          );
        }
      }
    }
    const distance = matrix[s1.length][s2.length];
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = (maxLength - distance) / maxLength * 100;
    return Math.round(similarity);
  };
  
  
  
  
  


  const ANSWER_SEPARATORS = ["===", "#", "---", "###", "|", ";", "；"];

  const normalizeAnsText = (input) => {
    let s = String(input == null ? "" : input);
    s = s.replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, " ");
    s = s.replace(/<[^>]*>/g, " ");
    return s
      .replace(/[，。！？；：""''、（）【】〈〉《》,.\-!?;:'"()\[\]<>]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();
  };

  const stripOptionPrefix = (input) => String(input == null ? "" : input)
    .trim()
    .replace(/^[A-Ha-h]\s*[.、．，,)）:：\]】]\s*/, "")
    .trim();

  const isPlainLetterAnswer = (input) => {
    const t = String(input == null ? "" : input).trim().replace(/[,，.。．、 #/\\|]/g, "").toUpperCase();
    if (!/^[A-Z]{1,8}$/.test(t)) return false;
    for (let i = 1; i < t.length; i++) {
      if (t.charCodeAt(i) <= t.charCodeAt(i - 1)) return false;
    }
    return true;
  };

  const splitAnswerText = (answer) => {
    if (answer == null) return [];
    if (Array.isArray(answer)) return answer.map((a) => String(a).trim()).filter(Boolean);
    const raw = String(answer).trim();
    if (!raw) return [];
    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map((a) => String(a).trim()).filter(Boolean);
      } catch (e) {}
    }
    for (const sep of ANSWER_SEPARATORS) {
      if (raw.includes(sep)) {
        return raw.split(sep).map((p) => p.trim()).filter(Boolean);
      }
    }
    return [raw];
  };

  const getOptionList = (question) => {
    if (!question) return [];
    if (Array.isArray(question.optionsList) && question.optionsList.length) return question.optionsList;
    const list = [];
    const src = question.options;
    if (Array.isArray(src)) {
      src.forEach((o) => list.push(typeof o === "string" ? { text: o, el: null } : { text: o.text || "", el: o.el || null }));
    } else if (src && typeof src === "object") {
      for (const key in src) list.push({ text: key, el: src[key] });
    }
    return list;
  };

  const matchOptionIndex = (optionList, answer) => {
    if (!optionList || optionList.length === 0 || answer == null) return -1;
    const raw = String(answer).trim();
    if (!raw) return -1;

    for (let i = 0; i < optionList.length; i++) {
      if (String(optionList[i].text).trim() === raw) return i;
    }

    const strippedAnswer = stripOptionPrefix(raw);
    const normAnswer = normalizeAnsText(strippedAnswer);
    for (let i = 0; i < optionList.length; i++) {
      const optText = stripOptionPrefix(optionList[i].text);
      if (optText === strippedAnswer) return i;
      const normOpt = normalizeAnsText(optText);
      if (normAnswer && normOpt && normOpt === normAnswer) return i;
    }

    return -1;
  };

  
  
  
  
  
  class CxQuestionHandler extends QuestionProcessor {
    constructor(type, iframe) {
      super();
      __publicField(this, "type");              
      
      __publicField(this, "init", async () => {
        await waitForCxFaceRecognition();
        this.questions = [];
        this.parseHtml();
        if (this.questions.length) {
          this.addLog(`成功解析到${this.questions.length}个题目`, "primary");
          const configStore = useConfigStore();
          
          const startTaskId = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
          
          const _answerParamsPart1 = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === "答题参数");
          const skipAnswered = _answerParamsPart1?.params.find(p => p.name === "跳过已答")?.value || false;
          let skippedCount = 0;
          for (const [index, question] of this.questions.entries()) {
            
            const currentTaskId = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
            if (currentTaskId !== startTaskId) {
              break;
            }
            
            if (skipAnswered && this.checkIfAnswered(question, this.type)) {
              this.addLog(`第${index + 1}道题已作答，跳过`, "warning");
              skippedCount += 1;
              this.correctNum += 1; 
              this.addQuestion(question);
              continue;
            }
            this.addLog(`正在查找第${index + 1}道题目答案...`, "primary");
            const answerData = await queryAnswer(question);
            
            
            const currentTaskId2 = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
            if (currentTaskId2 !== startTaskId || answerData.code === 499) {
              break;
            }
            if (answerData.code === 200) {
              question.answer = answerData.data.answer;
              question.source = answerData.data.source;  
              await this.fillQuestion(question);
              const sourceHint = answerData.data.source === "ai" ? "(AI生成)" : "";
              const msgLines = (answerData.msg || '').split('\n');
              const firstLine = msgLines.shift();
              const msgHint = firstLine ? ` - ${firstLine}` : "";
              this.addLog(`第${index + 1}道题查询成功${sourceHint}${msgHint}`, "success");
              for (const line of msgLines) {
                if (line.trim()) this.addLog(line, "primary");
              }
              if (answerData.data.cost !== undefined) {
                this.addLog(`本题消耗${answerData.data.cost}次，剩余${answerData.data.num}次`, "primary");
              }
              this.correctNum += 1;
            } else {
              this.addLog(`第${index + 1}道题搜索失败: ${answerData.msg}`, "danger");
              if (answerData.data?.sponsorUrl) {
                this.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
              }
              question.answer[0] = answerData.msg;
            }
            this.addQuestion(question);
          }
          if (skippedCount > 0) {
            this.addLog(`共跳过${skippedCount}道已答题目`, "primary");
          }
        } else
          this.addLog("未解析到题目，请进入正确页面", "danger");
        return Promise.resolve(this.correctNum / this.questions.length * 100);
      });
      
      __publicField(this, "parseHtml", () => {
        if (!this._document)
          return [];
        if (["zj"].includes(this.type)) {
          const questionElements = this._document.querySelectorAll(SELECTORS.CX_QUESTION_ZJ);
          this.addQuestions(questionElements);
        } else if (["zy", "ks"].includes(this.type)) {
          const questionElements = this._document.querySelectorAll(SELECTORS.CX_QUESTION_ZY_KS);
          this.addQuestions(questionElements);
        }
      });
      
      __publicField(this, "fillQuestion", async (question) => {
        if (!this._window)
          return;

        try {
          if (await this.fillQuestionV2(question)) return;
          if (question.type === "4" || question.type === "5" || question.type === "6" || question.type === "7") {
          
          const textareaElement = question.element.querySelector("textarea");
          if (!textareaElement) return;
          
          
          const answerText = Array.isArray(question.answer) 
            ? question.answer.join("\n") 
            : String(question.answer);
          
          
          const htmlContent = answerText.split("\n")
            .map(line => `<p>${line}</p>`)
            .join("");
          
          try {
            const ueditor = this._window.UE.getEditor(textareaElement.id || textareaElement.name);
            if (ueditor && typeof ueditor.setContent === "function") {
              ueditor.setContent(htmlContent);
            } else {
              textareaElement.value = answerText;
              textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
            }
          } catch (e) {
            textareaElement.value = answerText;
            textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
          }
          const saveBtn = question.element.querySelector('[onclick*="saveQuestion"]');
          if (saveBtn) saveBtn.click();
        }
        } catch (error) {
          this.addLog(`答题过程发生错误：${error.message}`, "danger");
        } finally {
          this.isFilling = false;  
        }
      });
      this.type = type;
      if (iframe) {
        this._document = iframe.contentDocument;
        this._window = iframe.contentWindow;
        decodeCipherFont(this._document);
      } else {
        decodeCipherFont(this._document);
      }
    }
    isOptionSelected(optionElement) {
      if (["zj", "zy"].includes(this.type)) {
        if (optionElement.getAttribute("aria-checked") === "true") return true;
        if (optionElement.classList.contains("cur") || optionElement.classList.contains("selected")) return true;
        const spanEl = optionElement.querySelector("span.num_option_dx") || optionElement.querySelector("span.num_option") || optionElement.querySelector("span[data]");
        if (spanEl && (spanEl.classList.contains("cur") || spanEl.classList.contains("selected"))) return true;
        if (optionElement.querySelector(".onChecked") || optionElement.querySelector(".check_answer")) return true;
        return false;
      } else if (["ks"].includes(this.type)) {
        return !!(optionElement.querySelector(".check_answer") || optionElement.querySelector(".check_answer_dx"));
      }
      return false;
    }
    async fillQuestionV2(question) {
      let type = String(question.type);
      if (!["0", "1", "2", "3", "11", "13", "14", "15"].includes(type)) {
        if (type === "999" || !type || type === "undefined" || type === "null") {
          type = getOptionList(question).length > 0 ? "0" : "2";
        } else {
          return false;
        }
      }

      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const configStore = useConfigStore();
      const answerParams = configStore.platformParams[configStore.platformName]?.parts.find((p) => p.name === "答题参数")?.params || [];
      const useSimilarity = answerParams.find((p) => p.name === "相似匹配")?.value !== false;
      const thresholdRaw = Number(answerParams.find((p) => p.name === "正确阈值")?.value);
      const threshold = Math.min(99, Math.max(50, Number.isFinite(thresholdRaw) && thresholdRaw > 0 ? thresholdRaw : 85));

      const optionList = getOptionList(question);
      const rawAnswers = Array.isArray(question.answer) ? question.answer.slice() : splitAnswerText(question.answer);
      const flatAnswers = [];
      for (const a of rawAnswers) {
        const parts = splitAnswerText(a);
        if (parts.length > 1) {
          parts.forEach((p) => flatAnswers.push(p));
        } else {
          const one = String(a == null ? "" : a).trim();
          if (one) flatAnswers.push(one);
        }
      }
      if (flatAnswers.length === 0) {
        return true;
      }

      const clickOption = async (el) => {
        if (!el) return;
        el.setAttribute("data-filling", "true");
        el.click();
        await sleep(200);
        el.removeAttribute("data-filling");
      };

      if (type === "0" || type === "1") {
        const targetIndices = [];
        for (const ans of flatAnswers) {
          const clean = this.stripTags(ans);
          if (!clean) continue;
          const idx = matchOptionIndex(optionList, clean);
          if (idx >= 0 && !targetIndices.includes(idx)) targetIndices.push(idx);
        }

        if (targetIndices.length === 0) {
          return true;
        }

        if (type === "1") {
          for (let i = 0; i < optionList.length; i++) {
            const el = optionList[i].el;
            if (!el || targetIndices.includes(i)) continue;
            if (this.isOptionSelected(el)) {
              await clickOption(el);
            }
          }
          await sleep(300);
        }

        for (const idx of targetIndices) {
          const el = optionList[idx].el;
          if (!el) continue;
          if (this.isOptionSelected(el)) continue;
          await clickOption(el);
        }
        return true;
      }

      if (type === "3") {
        const rawAnswer = String(flatAnswers[0] || "").trim();
        let truth = null;
        if (REGEX.JUDGE_FALSE.test(rawAnswer)) truth = false;
        else if (REGEX.JUDGE_TRUE.test(rawAnswer)) truth = true;

        if (truth === null && rawAnswer) {
          const idx = matchOptionIndex(optionList, rawAnswer);
          const el = idx >= 0 ? optionList[idx].el : null;
          if (el) {
            if (!this.isOptionSelected(el)) await clickOption(el);
            return true;
          }
        }

        if (truth === null) {
          return true;
        }

        let target = null;
        for (const opt of optionList) {
          const el = opt.el;
          if (!el) continue;
          if (["zj", "zy"].includes(this.type)) {
            const aria = el.getAttribute("aria-label") || "";
            const text = opt.text || "";
            if (truth) {
              if ((aria && (aria.includes("正确") || aria.includes("对"))) || REGEX.JUDGE_TRUE.test(text)) {
                target = el;
                break;
              }
            } else if ((aria && aria.includes("错")) || REGEX.JUDGE_FALSE.test(text)) {
              target = el;
              break;
            }
          } else {
            const span = el.querySelector(`span[data='${truth ? "true" : "false"}']`);
            if (span) {
              target = span;
              break;
            }
          }
        }

        if (!target) {
          return true;
        }
        if (target.classList && target.classList.contains("check_answer")) return true;
        await clickOption(target);
        return true;
      }

      if (type === "2" || type === "14" || type === "15") {
        const wordScope =
          (type === "14" ? question.element.querySelector(".filling_answer") : null) ||
          (type === "15" ? question.element.querySelector(".reading_answer") : null) ||
          question.element;
        const wordSpans = Array.from(wordScope.querySelectorAll("span.saveSingleSelect[data]"));
        const selectBoxes = Array.from(question.element.querySelectorAll("select.dept_select"));
        const textareaElements = question.element.querySelectorAll("textarea");

        let blankAnswers = flatAnswers;
        const blankCount = Math.max(wordSpans.length, selectBoxes.length, textareaElements.length);
        if (blankAnswers.length === 1 && blankCount > 1) {
          const parts = String(blankAnswers[0])
            .split(/[、,，;；|]+/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (parts.length === blankCount) blankAnswers = parts;
        }

        const preferTextarea = type === "2" && textareaElements.length > 0;
        if (wordSpans.length > 0 && !preferTextarea) {
          const used = new Set();
          let filled = 0;
          const optionTexts = optionList.map((o) => o.text);
          const resolveWord = (raw) => {
            const clean = this.stripTags(String(raw == null ? "" : raw));
            if (!clean) return "";
            if (optionTexts.length > 0 && isPlainLetterAnswer(clean)) {
              const idx = clean.replace(/[,，.。．、 #/\\|]/g, "").toUpperCase().charCodeAt(0) - 65;
              if (idx >= 0 && idx < optionTexts.length) return optionTexts[idx];
            }
            return clean;
          };
          for (const ans of blankAnswers) {
            const clean = resolveWord(ans);
            if (!clean) continue;
            let pick = -1;
            for (let i = 0; i < wordSpans.length; i++) {
              if (used.has(i)) continue;
              if (normalizeAnsText(wordSpans[i].getAttribute("data") || "") === normalizeAnsText(clean)) {
                pick = i;
                break;
              }
            }
            if (pick < 0 && useSimilarity) {
              let bestScore = threshold;
              for (let i = 0; i < wordSpans.length; i++) {
                if (used.has(i)) continue;
                const score = computeMatch(normalizeAnsText(clean), normalizeAnsText(wordSpans[i].getAttribute("data") || ""));
                if (score > bestScore) {
                  bestScore = score;
                  pick = i;
                }
              }
            }
            if (pick >= 0) {
              used.add(pick);
              wordSpans[pick].click();
              filled += 1;
              await sleep(150);
            }
          }
          if (filled > 0) {
            return true;
          }
        }

        if (selectBoxes.length > 0) {
          const count = Math.min(selectBoxes.length, blankAnswers.length);
          for (let i = 0; i < count; i++) {
            const select = selectBoxes[i];
            const value = String(blankAnswers[i] || "").trim();
            if (!value) continue;
            const options = Array.from(select.options || []);
            let matchedValue = "";
            for (const opt of options) {
              if (opt.value === value || normalizeAnsText(opt.text) === normalizeAnsText(value)) {
                matchedValue = opt.value;
                break;
              }
            }
            if (!matchedValue && useSimilarity) {
              let bestScore = threshold;
              for (const opt of options) {
                const score = computeMatch(normalizeAnsText(value), normalizeAnsText(opt.text));
                if (score > bestScore) {
                  bestScore = score;
                  matchedValue = opt.value;
                }
              }
            }
            if (!matchedValue) continue;
            select.value = matchedValue;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            await sleep(200);
          }
          return true;
        }

        if (textareaElements.length === 0) {
          return true;
        }
        for (let i = 0; i < textareaElements.length; i++) {
          const textareaElement = textareaElements[i];
          const answerText =
            textareaElements.length === 1
              ? blankAnswers.join("，")
              : blankAnswers.length === 1
                ? blankAnswers[0]
                : (blankAnswers[i] == null ? "" : blankAnswers[i]);
          try {
            const blankItemDiv = textareaElement.closest(".blankItemDiv");
            const inpDiv = blankItemDiv ? blankItemDiv.querySelector(".InpDIV") : null;
            if (inpDiv) {
              inpDiv.click();
              await sleep(300);
            }
            const UE = this._window && this._window.UE;
            const ueditor = UE && typeof UE.getEditor === "function" ? UE.getEditor(textareaElement.id || textareaElement.name) : null;
            if (ueditor && typeof ueditor.setContent === "function") {
              if (ueditor.body === null) {
                await new Promise((resolve) => {
                  ueditor.addListener("ready", () => resolve());
                  setTimeout(resolve, 2000);
                });
              }
              ueditor.setContent(answerText);
              ueditor.fireEvent("contentChange");
            } else {
              textareaElement.value = answerText;
              textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
              textareaElement.dispatchEvent(new Event("change", { bubbles: true }));
            }
          } catch (e) {
            textareaElement.value = answerText;
            textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
        const saveBtn = question.element.querySelector('[onclick*="saveQuestion"]');
        if (saveBtn) {
          saveBtn.click();
          await sleep(300);
        }
        return true;
      }

      if (type === "11") {
        const selects = Array.from(question.element.querySelectorAll("select.dept_select"));
        if (selects.length === 0) {
          const boxes = Array.from(
            question.element.querySelectorAll(".line_answer_ct .selectBox, .line_answer .selectBox"),
          );
          if (boxes.length === 0) return false;
          const flat = [];
          for (const a of rawAnswers) splitAnswerText(a).forEach((p) => flat.push(p));
          let clicked = 0;
          for (let i = 0; i < boxes.length && i < flat.length; i++) {
            const value = String(flat[i] || "").trim();
            if (!value) continue;
            const letter = isPlainLetterAnswer(value) ? value.toUpperCase().charAt(0) : "";
            if (!letter) continue;
            const anchor =
              boxes[i].querySelector(`li[data="${letter}"] a`) || boxes[i].querySelector(`li[data='${letter}'] a`);
            if (!anchor) continue;
            anchor.click();
            clicked += 1;
            await sleep(150);
          }
          const hidden = question.element.querySelector('.line_answer input[name^="answer"]');
          if (hidden && flat.length > 0) hidden.value = flat.join("");
          return clicked > 0;
        }
        const flat = [];
        for (const a of rawAnswers) splitAnswerText(a).forEach((p) => flat.push(p));
        if (flat.length === 0) {
          return true;
        }
        let filled = 0;
        for (let i = 0; i < selects.length && i < flat.length; i++) {
          const select = selects[i];
          const value = String(flat[i] || "").trim();
          if (!value) continue;
          const options = Array.from(select.options || []);
          let target = "";
          if (isPlainLetterAnswer(value)) {
            const letter = value.replace(/[,，.。．、 #/\\|]/g, "").toUpperCase().charAt(0);
            const byValue = options.find((o) => String(o.value).toUpperCase() === letter);
            const byIndex = options[letter.charCodeAt(0) - 65];
            target = byValue ? byValue.value : byIndex ? byIndex.value : "";
          }
          if (!target) {
            const norm = normalizeAnsText(value);
            const hit = options.find((o) => normalizeAnsText(o.text) === norm);
            if (hit) target = hit.value;
          }
          if (!target && useSimilarity) {
            let bestScore = threshold;
            for (const o of options) {
              const score = computeMatch(normalizeAnsText(value), normalizeAnsText(o.text));
              if (score > bestScore) {
                bestScore = score;
                target = o.value;
              }
            }
          }
          if (!target) continue;
          select.value = target;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          this.syncChosenSelect(select, target);
          filled += 1;
          await sleep(200);
        }
        return true;
      }

      if (type === "13") {
        const sortSelects = Array.from(question.element.querySelectorAll(".sortQuesSelect .dept_select"));
        if (sortSelects.length === 0) return false;
        const seq = [];
        for (const a of rawAnswers) {
          const parts = splitAnswerText(a);
          const list = parts.length > 1 ? parts : [String(a == null ? "" : a).trim()];
          for (const item of list) {
            if (!item) continue;
            if (isPlainLetterAnswer(item)) {
              item.replace(/[,，.。．、 #/\\|]/g, "").toUpperCase().split("").forEach((ch) => seq.push(ch));
            } else if (/^[A-Za-z]{2,8}$/.test(item)) {
              item.toUpperCase().split("").forEach((ch) => seq.push(ch));
            } else {
              const idx = matchOptionIndex(optionList, item);
              if (idx >= 0 && idx < 26) seq.push(String.fromCharCode(65 + idx));
            }
          }
        }
        if (seq.length === 0) {
          return true;
        }
        let filled = 0;
        for (let i = 0; i < sortSelects.length && i < seq.length; i++) {
          const select = sortSelects[i];
          const letter = seq[i];
          if (!letter) continue;
          const options = Array.from(select.options || []);
          const byValue = options.find((o) => String(o.value).toUpperCase() === letter);
          select.value = byValue ? byValue.value : letter;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          this.syncChosenSelect(select, select.value);
          filled += 1;
        }
        const answerInput = question.element.querySelector('input[name^="answer"]');
        if (answerInput) answerInput.value = seq.join("");
        return true;
      }

      return false;
    }
    syncChosenSelect(select, value) {
      try {
        const container = select.nextElementSibling;
        if (!container || !container.classList || !container.classList.contains("chosen-container")) return;
        const single = container.querySelector(".chosen-single span");
        const options = Array.from(select.options || []);
        const opt = options.find((o) => o.value === value);
        const text = opt ? opt.text : value;
        if (single) {
          single.textContent = text;
          if (single.classList) single.classList.remove("chosen-default");
        }
        container.querySelectorAll(".chosen-results li").forEach((li) => {
          li.classList.remove("result-selected");
          if (li.textContent.trim() === text) li.classList.add("result-selected");
        });
      } catch (e) {}
    }
    resolveQuestionType(questionElement) {
      const numericTypes = {
        0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
        8: "2", 9: "2", 10: "2", 11: "11", 13: "13", 14: "14", 15: "15",
      };
      let input = null;
      if (questionElement) {
        const named = Array.from(questionElement.querySelectorAll('input[name^="type"]')).find((el) =>
          /type\d+/.test(el.getAttribute("name") || ""),
        );
        input =
          questionElement.querySelector('input[id^="answertype"]') || named || questionElement.querySelector('input[name^="type"]');
      }
      const code = input ? String(input.value || "").trim() : "";
      if (Object.prototype.hasOwnProperty.call(numericTypes, code)) return numericTypes[code];
      return "999";
    }
    extractOptions(optionElements, optionSelector) {
      const optionsObject = {};
      const optionTexts = [];
      const optionsList = [];
      optionElements.forEach((optionElement) => {
        var _a;
        const inner = optionElement.querySelector(optionSelector) || optionElement;
        const optionTextContent = this.stripTags(this.htmlWithAbsoluteImages(inner));
        if (!optionTextContent) return;
        optionsList.push({ text: optionTextContent, el: optionElement });
        optionTexts.push(optionTextContent);
        let key = optionTextContent;
        let suffix = 2;
        while (Object.prototype.hasOwnProperty.call(optionsObject, key)) {
          key = optionTextContent + "#" + suffix;
          suffix += 1;
        }
        optionsObject[key] = optionElement;
      });
      return [optionsObject, optionTexts, optionsList];
    }
    addQuestions(questionElements) {
      questionElements.forEach((questionElement) => {
        var _a, _b, _c, _d;
        let questionTitle = "";
        let optionElements;
        let optionsObject = {};
        let optionTexts = [];
        let optionsList = [];
        const resolvedType = this.resolveQuestionType(questionElement);
        const zyKsSelector = SELECTORS.CX_OPTION_ZY_KS;
        const zjSelector = SELECTORS.CX_OPTION_ZJ;
        if (["zy", "ks"].includes(this.type)) {
          const h3Element = questionElement.querySelector("h3");
          const colorShallowElement = questionElement.querySelector(".colorShallow");
          
          
          const fullText = h3Element ? this.stripTags(this.htmlWithAbsoluteImages(h3Element)) : "";
          const typeText = colorShallowElement ? this.stripTags(colorShallowElement.innerHTML) : "";
          questionTitle = fullText.replace(typeText, "").replace(/^\d+\.\s*/, "").replace(/_{2,}/g, "____").trim();
            optionElements = questionElement.querySelectorAll(zyKsSelector);
            [optionsObject, optionTexts, optionsList] = this.extractOptions(optionElements, ".answer_p");
        } else if (["zj"].includes(this.type)) {
          questionTitle = this.stripTags(this.htmlWithAbsoluteImages(questionElement.querySelector(".fontLabel")))
            .replace(/（[\d.]+分）/g, "").trim();
          
          
          const readComprehensionItems = questionElement.querySelectorAll(".readCompreHensionItem");
          if (readComprehensionItems.length > 0) {
            
            readComprehensionItems.forEach((subItem) => {
              const childTypeInput = subItem.querySelector("input[name='readCompreHension-childType']");
              const childType = childTypeInput ? childTypeInput.value : "";
              
              
              const subContentEl = subItem.querySelector(".clearfix");
              const subTitle = this.stripTags((subContentEl == null ? void 0 : subContentEl.innerHTML) || "")
                .replace(/（[\d.]+分）/g, "").trim();
              
              
              const subTypeEl = subItem.querySelector(".index");
              const subTypeText = this.stripTags((subTypeEl == null ? void 0 : subTypeEl.textContent) || "")
                .replace(/^\(\d+\)\s*/, "").replace(/[\[\]【】]/g, "").trim();
              
              
              
              
              
              let subOptionElements;
              let optionSelector = ".fl.after";
              if (childType === "3") {
                
                subOptionElements = subItem.querySelectorAll(SELECTORS.CX_OPTION_ZJ);
              } else if (childType === "0" || childType === "1") {
                
                subOptionElements = subItem.querySelectorAll("ul.choice li");
              } else {
                
                subOptionElements = [];
              }
              let subOptionsObject = {};
              let subOptionTexts = [];
              let subOptionsList = [];
              [subOptionsObject, subOptionTexts, subOptionsList] = this.extractOptions(subOptionElements, optionSelector);
              
              this.questions.push({
                element: subItem,
                type: ["0", "1", "3"].includes(String(childType)) ? String(childType) : "999",
                title: this.trimTitle(questionTitle + " - " + subTitle),
                optionsText: subOptionTexts,
                options: subOptionsObject,
                optionsList: subOptionsList,
                answer: [],
                workType: this.type,
                refer: this._window.location.href
              });
            });
            return; 
          }
          
          
          const isMatchingQuestion = questionElement.getAttribute("data") === "11" ||
                                     String((questionElement.querySelector('input[id^="answertype"], input[name^="type"]') || {}).value || "") === "11" ||
                                     questionElement.querySelector(".matching") ||
                                     questionElement.querySelector(".connLine");
          if (isMatchingQuestion) {
            
            const matchDiv = questionElement.querySelector(".matching") || questionElement.querySelector(".connLine") || questionElement;
            const firstListItems = matchDiv.querySelectorAll("ul.firstUlList li:not(.groupTitile)");
            const secondListItems = matchDiv.querySelectorAll("ul.secondUlList li:not(.groupTitile)");
            const selectElements = matchDiv.querySelectorAll("select.dept_select");
            
            
            const leftItems = [];
            firstListItems.forEach((li, idx) => {
              const numEl = li.querySelector("i");
              const textEl = li.querySelector("div p, div a p");
              const num = numEl ? numEl.textContent.replace(/[、，.]/g, "").trim() : String(idx + 1);
              const text = textEl ? this.stripTags(textEl.innerHTML).trim() : "";
              leftItems.push(`${num}. ${text}`);
            });
            
            
            const rightItems = [];
            secondListItems.forEach((li) => {
              const labelEl = li.querySelector("i");
              const textEl = li.querySelector("div p, div a p");
              const label = labelEl ? labelEl.textContent.replace(/[、，]/g, "").trim() : "";
              const text = textEl ? this.stripTags(textEl.innerHTML).trim() : "";
              rightItems.push(label ? `${label} ${text}` : text);
            });
            
            
            const fullTitle = `${questionTitle} 左侧: ${leftItems.join("；")} 右侧: ${rightItems.join("；")}`;
            
            this.questions.push({
              element: questionElement,
              type: "11", 
              title: this.trimTitle(fullTitle),
              optionsText: rightItems,
              options: Object.fromEntries(rightItems.map((text, i) => [text, secondListItems[i]])),
              optionsList: rightItems.map((text, i) => ({ text, el: secondListItems[i] })),
              answer: [],
              workType: this.type,
              refer: this._window.location.href,
              _selectElements: selectElements,
              _leftItems: leftItems,
              _secondListItems: secondListItems
            });
            return;
          }
          
            optionElements = questionElement.querySelectorAll(zjSelector);
            [optionsObject, optionTexts, optionsList] = this.extractOptions(optionElements, ".fl.after");
        }
        this.questions.push({
          element: questionElement,
          type: resolvedType,
          title: this.trimTitle(questionTitle),
          optionsText: optionTexts,
          options: optionsObject,
          optionsList: optionsList,
          answer: [],
          workType: this.type,
          refer: this._window.location.href
        });
      });
    }
  }
  
  
  
  
  
  const useCxChapterLogic = () => {
    const logStore = useLogStore();
    const progressStore = useProgressStore();
    
    
    const getCookieLocal = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : '';
    };
    const cachedUid = getUid();
    
    const init = () => {
      const currentUrl = window.location.href;
      if (!currentUrl.includes("&mooc2=1")) {
        window.location.href = currentUrl + "&mooc2=1";
      }
      logStore.addLog(`检测到用户进入到章节学习页面`, "primary");
      logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");
    };
    const configStore = useConfigStore();

    const cxVideoParam = (name) => {
      const parts = configStore.platformParams?.cx?.parts || [];
      const part = parts.find(p => p.name === "视频设置");
      return (part?.params || []).find(p => p.name === name) || {};
    };
    const cxVideoParamValue = (name, fallback = false) => {
      const val = cxVideoParam(name).value;
      return val === undefined || val === null ? fallback : val;
    };

    let _justClickedNext = false;
    let _currentIframe = null; 
    let _urlBackupTimer = null; 
    let _urlWatcherInterval = null; 
    let _urlBackupWorkerId = null; 
    
    
    const monitorIframes = () => {
      const afkEnabledMonitor = readCxParamValue("视频设置", "激活挂机", false);
      
      if (_urlBackupTimer) {
        clearTimeout(_urlBackupTimer);
        _urlBackupTimer = null;
      }
      if (_urlBackupWorkerId) {
        BackgroundWorker.stop(_urlBackupWorkerId);
        _urlBackupWorkerId = null;
      }
      
      const documentElement = document.documentElement;
      const iframe = documentElement.querySelector("iframe");
      
      if (!iframe) {
        if (afkEnabledMonitor) {
          BackgroundWorker.start('monitor_iframes_retry', () => { BackgroundWorker.stop('monitor_iframes_retry'); monitorIframes(); }, 2000);
        } else {
          setTimeout(() => monitorIframes(), 2000);
        }
        return;
      }
      
      const currentSrc = iframe.src || '';
      
      
      const srcChanged = currentSrc !== _lastIframeSrc;
      
      
      if (iframe !== _currentIframe) {
        _currentIframe = iframe;
        iframe.addEventListener("load", function onIframeLoad() {
          
          if (_urlBackupTimer) {
            clearTimeout(_urlBackupTimer);
            _urlBackupTimer = null;
          }
          if (_urlBackupWorkerId) {
            BackgroundWorker.stop(_urlBackupWorkerId);
            _urlBackupWorkerId = null;
          }
          
          monitorIframes();
        });
      }
      
      
      try {
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
          if (srcChanged) {
            _lastIframeSrc = currentSrc;
            watchIframe(documentElement);
          }
        }
      } catch (e) {
      }
    };
    const watchUrlChanges = () => {
      let currentUrl = window.location.href;
      const afkEnabled = readCxParamValue("视频设置", "激活挂机", false);
      
      const checkUrlChange = () => {
        if (currentUrl !== window.location.href) {
          currentUrl = window.location.href;
          _justClickedNext = false;
          
          _globalTaskId++;
          
          if (_urlBackupTimer) {
            clearTimeout(_urlBackupTimer);
            _urlBackupTimer = null;
          }
          if (afkEnabled && _urlBackupWorkerId) {
            BackgroundWorker.stop(_urlBackupWorkerId);
            _urlBackupWorkerId = null;
          }
          
          if (afkEnabled) {
            _urlBackupWorkerId = 'url_backup_' + Date.now();
            const workerId = _urlBackupWorkerId;
            BackgroundWorker.start(workerId, () => {
              _urlBackupWorkerId = null;
              BackgroundWorker.stop(workerId);
              monitorIframes();
            }, 2000);
          } else {
            _urlBackupTimer = setTimeout(() => {
              _urlBackupTimer = null;
              monitorIframes();
            }, 2000);
          }
        }
      };
      if (afkEnabled) {
        BackgroundWorker.start('url_watcher', checkUrlChange, 2000);
      } else {
        _urlWatcherInterval = setInterval(checkUrlChange, 2000);
      }
    };
    let _globalTaskId = 0;
    let hasLoggedSkipTip = false;
    let _currentWatchSubscription = null;
    const _processedIframeTasks = new WeakMap(); 
    const _completedMediaIframes = new WeakSet();
    let _lastIframeSrc = null; 
    
    window.__getAnswerTaskId__ = () => _globalTaskId;
    
    const watchIframe = async (documentElement) => {
      if (_currentWatchSubscription) {
        _currentWatchSubscription.unsubscribe();
        _currentWatchSubscription = null;
      }
      forceStopSimulatePlay();
      const thisTaskId = ++_globalTaskId;
      hasLoggedSkipTip = false;
      
      const afkEnabledWatch = readCxParamValue("视频设置", "激活挂机", false);
      if (afkEnabledWatch) {
        await new Promise(resolve => {
          BackgroundWorker.start('watch_iframe_delay', () => { BackgroundWorker.stop('watch_iframe_delay'); resolve(); }, 3000);
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      
      if (thisTaskId !== _globalTaskId) {
        return;
      }
      
      logStore.addLog(`等待页面加载完成，开始扫描任务点`, "info");
      
      FrameScanner.collectDeep(documentElement).subscribe(async (allIframes) => {
        stopSimulatePlayIfNeeded();
        
        const classified = [];
        for (const iframe of allIframes) {
          const type = await classifyFrame(iframe);
          if (type !== 'skip') {
            classified.push({ iframe, type });
          }
        }
        
        _currentWatchSubscription = rxjs.from(classified).pipe(rxjs.concatMap(({ iframe, type }) => executeFrame(iframe, type))).subscribe({
          complete: async () => {
            if (thisTaskId === _globalTaskId) {
              const autoSwitch = readCxParamValue("章节/作业/测验设置", "自动切换", true);
              logStore.addLog(`本页任务点已全部完成，${autoSwitch ? "正前往下一章节" : "自动切换已关闭"}`, "success");
              if (autoSwitch) {
                
                const nextBtn1 = documentElement.querySelector("#prevNextFocusNext");
                const nextBtn2 = document.querySelector(".jb_btn.jb_btn_92.fr.fs14.nextChapter");
                const nextBtn3 = document.querySelector("#nextBtn");
                const nextBtn4 = document.querySelector(".nextChapter");
                
                let targetBtn = null;
                if (nextBtn1 && nextBtn1.style.display !== "none") {
                  targetBtn = nextBtn2 || nextBtn1;
                } else if (nextBtn2 && nextBtn2.style.display !== "none") {
                  targetBtn = nextBtn2;
                } else if (nextBtn3 && nextBtn3.style.display !== "none") {
                  targetBtn = nextBtn3;
                } else if (nextBtn4 && nextBtn4.style.display !== "none") {
                  targetBtn = nextBtn4;
                }
                
                if (!targetBtn) {
                } else {
                  _justClickedNext = true;
                  await delay(3);
                  
                  if (thisTaskId !== _globalTaskId) {
                    return;
                  }
                  targetBtn.click();
                }
              }
            }
          }
        });
      });
    };

    
    
    const calculateEnc = (classId, uid, jobId, objectId, playTime, duration) => {
      const str = `[${classId}][${uid}][${jobId}][${objectId}][${playTime * 1000}][d_yHJ!$pdA~5][${duration * 1000}][0_${duration}]`;
      return md5(str);
    };

    
    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    
    
    const hasVideoOrAudio = () => {
      try {
        const allIframes = FrameScanner.collectDeepSync(document.documentElement);
        for (const iframe of allIframes) {
          const src = iframe.src || '';
          if (src.includes('video') || src.includes('audio')) {
            
            const parent = iframe.parentElement;
            const ansJobIcon = parent?.querySelector('.ans-job-icon');
            if (ansJobIcon) {
              return true;
            }
          }
        }
        return false;
      } catch (e) {

        return false;
      }
    };

    
    const completedSimulatedIds = new Set();
    const processingSimulatedId = { current: null };

    window.clearOverlayAndBanner = () => {
      if (window._blockPlayInterval) {
        if (typeof window._blockPlayInterval === 'string') {
          BackgroundWorker.stop(window._blockPlayInterval);
        } else {
          clearInterval(window._blockPlayInterval);
        }
        window._blockPlayInterval = null;
      }
      if (window._blockOverlay) {
        window._blockOverlay.forEach(o => { try { if (document.contains(o)) o.remove(); } catch(e) {} });
        window._blockOverlay = [];
      }
      const banner = document.getElementById('_simulate_banner_');
      if (banner) banner.remove();
      if (window._blockPlayScroll) {
        window.removeEventListener('scroll', window._blockPlayScroll, true);
        window.removeEventListener('resize', window._blockPlayScroll);
        window._blockPlayScroll = null;
      }
    };

    window.showOverlayAndBanner = () => {
      clearOverlayAndBanner();
      if (!window._blockOverlay) window._blockOverlay = [];
      const getVideoIframes = () => {
        try {
          const allIframes = FrameScanner.collectDeepSync(document.documentElement);
          return allIframes.filter(fr => {
            const src = fr.src || '';
            return src.includes('video') || src.includes('audio');
          });
        } catch (e) { return []; }
      };
      let _banner = null;
      const getOrCreateBanner = () => {
        if (_banner && _banner.parentNode) return _banner;
        _banner = document.getElementById('_simulate_banner_');
        if (!_banner) {
          _banner = document.createElement('div');
          _banner.id = '_simulate_banner_';
          _banner.textContent = '模拟播放中，视频无需真实播放，进度可在脚本主页信息查看';
        }
        return _banner;
      };
      const createOverlay = () => {
        try {
          window._blockOverlay.forEach(o => { try { o.remove(); } catch(e) {} });
          window._blockOverlay = [];
          const videoIframes = getVideoIframes();
          let firstOverlay = null;
          for (const iframe of videoIframes) {
            const rect = iframe.getBoundingClientRect();
            if (rect.width > 50 && rect.height > 50) {
              const overlay = document.createElement('div');
              overlay.className = '_simulate_block_overlay_';
              overlay.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;z-index:2147483647;cursor:not-allowed;background:rgba(0,0,0,0.25);border-radius:8px;display:flex;align-items:flex-end;justify-content:center;`;
              const ownerDoc = iframe.ownerDocument;
              if (ownerDoc && ownerDoc.body && ownerDoc.body !== document.body) {
                ownerDoc.body.appendChild(overlay);
              } else {
                document.body.appendChild(overlay);
              }
              window._blockOverlay.push(overlay);
              if (!firstOverlay) firstOverlay = overlay;
            }
          }
          
          if (firstOverlay) {
            const banner = getOrCreateBanner();
            banner.style.cssText = 'margin-bottom:20px;background:rgba(255,255,255,0.92);backdrop-filter:blur(10px);color:#4a5568;padding:8px 20px;border-radius:10px;font-size:13px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.1);cursor:default;white-space:nowrap;pointer-events:none;letter-spacing:0.3px;display:flex;align-items:center;gap:8px;z-index:auto;';
            if (banner.parentNode !== firstOverlay) {
              firstOverlay.appendChild(banner);
            }
          }
        } catch (e) {}
      };
      const updateOverlayPositions = () => {};
      createOverlay();
      window._blockPlayScroll = updateOverlayPositions;
      window.addEventListener('scroll', updateOverlayPositions, true);
      window.addEventListener('resize', updateOverlayPositions);
      const afkEnabledOverlay = readCxParamValue("视频设置", "激活挂机", false);
      if (afkEnabledOverlay) {
        BackgroundWorker.start('overlay_refresh', createOverlay, 1000);
        window._blockPlayInterval = 'overlay_refresh';
      } else {
        window._blockPlayInterval = setInterval(createOverlay, 1000);
      }
    };

    const stopSimulatePlayIfNeeded = () => {
      if (window._simulateActive) {
        const hasMedia = hasVideoOrAudio();
        if (!hasMedia) {
          window._simulateActive = false;
          logStore.addLog('检测到视频/音频已消失，停止模拟播放', 'warning');
          if (window._currentMediaInterval) {
            clearInterval(window._currentMediaInterval);
            window._currentMediaInterval = null;
          }
          if (window._simulateLoopId) {
            BackgroundWorker.stop(window._simulateLoopId);
            window._simulateLoopId = null;
          }
          progressStore.update({
            isPlaying: false
          });
          processingSimulatedId.current = null;
          simulateVideoPlay._currentObjectId = null;
          clearOverlayAndBanner();
        }
      }
    };
    const forceStopSimulatePlay = () => {
      if (window._simulateActive) {
        window._simulateActive = false;
        if (window._currentMediaInterval) {
          clearInterval(window._currentMediaInterval);
          window._currentMediaInterval = null;
        }
        if (window._simulateLoopId) {
          BackgroundWorker.stop(window._simulateLoopId);
          window._simulateLoopId = null;
        }
        progressStore.update({ isPlaying: false });
        processingSimulatedId.current = null;
        simulateVideoPlay._currentObjectId = null;
        clearOverlayAndBanner();
      }
    };

    
    const getVideoInfo = async (objectId) => {
      return new Promise((resolve, reject) => {
        const host = window.location.host;
        const protocol = window.location.protocol;
        const FID = _unsafeWindow.FID || '';
        const statusUrl = `${protocol}//${host}/ananas/status/${objectId}?k=${FID}&flag=normal&_dc=${Date.now()}`;
        
        
        let vrefer = '';
        try {
          const videoIframe = _unsafeWindow.document.querySelector('.ans-attach-online.ans-insertvideo-online');
          if (videoIframe) {
            vrefer = videoIframe.src;
          }
        } catch (e) {}
        if (!vrefer) {
          vrefer = `${protocol}//${host}/ananas/modules/video/index.html?v=2022-1118-1729`;
        }
        
        _GM_xmlhttpRequest({
          method: "get",
          url: statusUrl,
          headers: {
            'Host': host,
            'Referer': vrefer,
            'Sec-Fetch-Site': 'same-origin'
          },
          onload: function(res) {
            try {
              if (res.status === 200) {
                const data = JSON.parse(res.responseText);
                resolve(data);
              } else {
                reject(new Error(`HTTP ${res.status}`));
              }
            } catch (e) {
              reject(e);
            }
          },
          onerror: function(err) {
            reject(err);
          }
        });
      });
    };

    
    const getTaskParams = () => {
      try {
        
        const topWindow = _unsafeWindow.top;
        if (topWindow.margs) {
          return topWindow.margs;
        }
        
        
        const urlParams = new URLSearchParams(window.location.search);
        return {
          clazzId: urlParams.get('clazzId') || urlParams.get('classId'),
          courseId: urlParams.get('courseId'),
          knowledgeid: urlParams.get('knowledgeid') || urlParams.get('chapterId')
        };
      } catch (e) {
        return null;
      }
    };

    
    const getEvasionRate = (baseRate) => {
      const evasionRate = baseRate * (0.95 + Math.random() * 0.1);
      return Math.max(0.5, Math.min(baseRate * 1.05, evasionRate));
    };

    let behaviorState = { lastMouseMove: 0 };
    const simulateUserBehavior = () => {
      const now = Date.now();
      if (now - behaviorState.lastMouseMove > 300000 + Math.random() * 300000) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
        behaviorState.lastMouseMove = now;
      }
    };

    const compensateDuration = (playTime, duration, baseRate) => playTime;

    
    const BackgroundWorker = (() => {
      let worker = null;
      const callbacks = new Map();

      const workerCode = `
        self.onmessage = function(e) {
          if (e.data.type === 'start') {
            const id = e.data.id;
            const interval = e.data.interval || 1000;
            let timerId = setInterval(() => {
              self.postMessage({ type: 'tick', id: id });
            }, interval);
            self._timers = self._timers || {};
            self._timers[id] = timerId;
            self.postMessage({ type: 'started', id: id });
          } else if (e.data.type === 'stop') {
            const id = e.data.id;
            if (self._timers && self._timers[id]) {
              clearInterval(self._timers[id]);
              delete self._timers[id];
            }
            self.postMessage({ type: 'stopped', id: id });
          }
        };
      `;

      function ensure() {
        if (worker) return;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = (e) => {
          const { type, id } = e.data;
          if (type === 'tick' && callbacks.has(id)) {
            callbacks.get(id)();
          }
        };
        worker.onerror = (e) => {
        };
      }

      return {
        start(id, callback, interval = 1000) {
          ensure();
          callbacks.set(id, callback);
          worker.postMessage({ type: 'start', id, interval });
        },
        stop(id) {
          if (!worker) return;
          callbacks.delete(id);
          worker.postMessage({ type: 'stop', id });
        },
        isActive() {
          return worker !== null;
        },
        destroy() {
          if (worker) {
            worker.terminate();
            worker = null;
            callbacks.clear();
          }
        }
      };
    })();

    
    
    
    
    
    const FakeMediaPlayer = (() => {
      let audioContext = null;
      let audioElement = null;
      let oscillator = null;
      let gainNode = null;
      let isPlaying = false;

      const start = () => {
        if (isPlaying) return;
        try {
          
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          gainNode = audioContext.createGain();
          gainNode.gain.value = 0; 
          oscillator = audioContext.createOscillator();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.start();
          isPlaying = true;
        } catch (e) {
          
          try {
            audioElement = document.createElement('audio');
            audioElement.id = '_fake_audio_player_';
            audioElement.loop = true;
            audioElement.muted = true;
            audioElement.volume = 0;
            
            audioElement.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM1LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU2LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNbrvGAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU2LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNbrvGAAAAAAAAAAAAAAAAAAAA';
            audioElement.style.display = 'none';
            document.body.appendChild(audioElement);
            audioElement.play().catch(() => {});
            isPlaying = true;
          } catch (e2) {
            logStore.addLog('欺骗播放启动失败: ' + e2.message, 'warning');
          }
        }
      };

      const stop = () => {
        if (!isPlaying) return;
        try {
          if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
          }
          if (audioContext) {
            audioContext.close();
            audioContext = null;
          }
          if (audioElement) {
            audioElement.pause();
            audioElement.remove();
            audioElement = null;
          }
          gainNode = null;
          isPlaying = false;
          logStore.addLog('欺骗播放已停止', 'info');
        } catch (e) {
        }
      };

      const isActive = () => isPlaying;

      return { start, stop, isActive };
    })();

    
    
    
    
    
    const simulateVideoPlay = (iframe, iframeDocument, mediaType) => {
      return new Promise((resolve) => {
        (async () => {
        const releaseLock = () => {
          if (processingSimulatedId.current === (simulateVideoPlay._currentObjectId)) {
            processingSimulatedId.current = null;
            simulateVideoPlay._currentObjectId = null;
          }
        };
        const safeResolve = (val) => { releaseLock(); resolve(val); };
        logStore.addLog(`发现一个${mediaType}，当前播放模式: 模拟播放`, "primary");
        
        
        try {
          const mediaElement = iframeDocument?.documentElement?.querySelector(mediaType);
          if (mediaElement) {
            mediaElement.pause();
            mediaElement.muted = true;
            mediaElement.autoplay = false;

          }
        } catch (e) {
        }
        
        
        
        try {
          
          let objectId = null;
          let jobId = null;
          let otherInfo = '';
          let reportUrl = '';
          let classId = null;
          let uid = null;
          let duration = null;
          let dtoken = null;
          let rt = '0.9';
          let iframeSrc = iframe.src || '';
          let videoName = mediaType === 'video' ? '视频' : '音频';
          const reviewMode = readCxParamValue("模式设置", "复习模式", false);

          
          try {
            
            let prevTitleElement = null;
            let parent = iframe.parentElement;
            while (parent && !prevTitleElement) {
              prevTitleElement = parent.querySelector('.prev_title');
              parent = parent.parentElement;
              if (parent === document.body || parent === document.documentElement) break;
            }

            
            if (!prevTitleElement) {
              prevTitleElement = document.querySelector('.prev_title');
            }

            if (prevTitleElement) {
              const titleText = prevTitleElement.innerText || prevTitleElement.textContent || '';
              
              videoName = titleText.replace(/【上】|【下】|【上$|【下$/g, '').trim();
              if (videoName && videoName !== (mediaType === 'video' ? '视频' : '音频')) {
                logStore.addLog(`获取到视频名称: ${videoName}`, "primary");
              } else {
                logStore.addLog(`从.prev_title获取到的文本: "${titleText}"`, "warning");
              }
            } else {
              logStore.addLog(`未找到.prev_title元素`, "warning");
            }
          } catch (e) {
            logStore.addLog(`从标题获取失败: ${e.message}`, "danger");
          }
          
          
          const getStr = (str, start, end) => {
            const startIndex = str.indexOf(start);
            if (startIndex === -1) return null;
            const content = str.substring(startIndex + start.length);
            const endIndex = content.indexOf(end);
            if (endIndex === -1) return null;
            return content.substring(0, endIndex);
          };
          
          
          let pageData = null;
          
          
          try {
            if (_unsafeWindow.param) {
              try {
                const parsed = JSON.parse(_unsafeWindow.param);
                if (parsed?.attachments) pageData = parsed;
              } catch (e) {}
            }
            if (!pageData && _unsafeWindow.mArg?.attachments) {
              pageData = _unsafeWindow.mArg;
            }
          } catch (e) {}
          
          
          if (!pageData) {
            try {
              const allIframes = FrameScanner.collectDeepSync(document.documentElement);
              for (const ifr of allIframes) {
                try {
                  if (!ifr.contentWindow) continue;
                  const win = ifr.contentWindow;
                  if (win.param) {
                    try {
                      const parsed = JSON.parse(win.param);
                      if (parsed?.attachments) { pageData = parsed; break; }
                    } catch (e) {}
                  }
                  if (!pageData && win.mArg?.attachments) {
                    pageData = win.mArg;
                    break;
                  }
                } catch (e) {}
              }
            } catch (e) {}
          }
          
          
          const documentsToTry = [];
          
          
          if (iframeDocument) {
            documentsToTry.push({ name: 'iframeDocument', doc: iframeDocument });
          }
          
          
          documentsToTry.push({ name: 'currentWindow', doc: _unsafeWindow.document });
          
          
          try {
            if (_unsafeWindow.top && _unsafeWindow.top.document) {
              documentsToTry.push({ name: 'topWindow', doc: _unsafeWindow.top.document });
            }
          } catch (e) {}
          
          for (const { name, doc } of documentsToTry) {
            if (pageData) break;
            try {
              const scripts = doc.getElementsByTagName('script');
              
              for (let i = 0; i < scripts.length; i++) {
                const scriptContent = scripts[i].innerHTML;
                
                if (scriptContent.indexOf('mArg = "";') !== -1 && scriptContent.indexOf('==UserScript==') === -1) {
                  const param = getStr(scriptContent, 'try{\n    mArg = ', ';\n}catch(e){');
                  if (param) {
                    pageData = JSON.parse(param);
                    break;
                  }
                }
                
                if (!pageData && scriptContent.indexOf('mArg=') !== -1 && scriptContent.indexOf('==UserScript==') === -1) {
                  const match = scriptContent.match(/mArg\s*=\s*(\{[\s\S]*?\});/);
                  if (match) {
                    try {
                      pageData = JSON.parse(match[1]);
                      break;
                    } catch (e) {}
                  }
                }
              }
              
              
              if (!pageData && name === 'topWindow') {
                for (let i = 0; i < scripts.length; i++) {
                  const content = scripts[i].innerHTML;
                  
                  if (content.indexOf('clazzId') !== -1 && content.length > 10000) {
                    
                    const attachmentsMatch = content.match(/["']attachments["']\s*:\s*(\[[\s\S]*?\])/);
                    if (attachmentsMatch) {
                      try {
                        const jsonStr = `{"attachments": ${attachmentsMatch[1]}}`;
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.attachments && parsed.attachments.length > 0) {
                          pageData = { attachments: parsed.attachments };
                          break;
                        }
                      } catch (e) {
                        logStore.addLog(`[${name}] 解析attachments失败: ${e.message}`, "warning");
                      }
                    }
                    
                    
                    const clazzIdMatch = content.match(/stu_clazzId\s*=\s*["'](\d+)["']/);
                    const courseIdMatch = content.match(/stu_CourseId\s*=\s*["'](\d+)["']/);
                    const knowledgeIdMatch = content.match(/stu_knowledgeId\s*=\s*["'](\d+)["']/);
                    
                    if (clazzIdMatch || courseIdMatch) {
                      if (!pageData) pageData = {};
                      pageData.defaults = {
                        clazzId: clazzIdMatch ? clazzIdMatch[1] : null,
                        courseId: courseIdMatch ? courseIdMatch[1] : null,
                        knowledgeId: knowledgeIdMatch ? knowledgeIdMatch[1] : null
                      };
                    }
                  }
                  
                  
                  if (!pageData && content.indexOf('"attachments"') !== -1) {
                    const jsonMatch = content.match(/\{[\s\S]*?"attachments"[\s\S]*?\}/);
                    if (jsonMatch) {
                      try {
                        pageData = JSON.parse(jsonMatch[0]);
                        break;
                      } catch (e) {}
                    }
                  }
                }
              }
            } catch (e) {
              logStore.addLog(`[${name}] 获取失败: ${e.message}`, "warning");
            }
          }
          
          
          if (!pageData || (pageData.defaults && !pageData.defaults.reportUrl)) {
            try {
              const windowsToTry = [_unsafeWindow];
              try { if (_unsafeWindow.top) windowsToTry.push(_unsafeWindow.top); } catch (e) {}
              try { if (_unsafeWindow.parent) windowsToTry.push(_unsafeWindow.parent); } catch (e) {}

              for (const ifr of FrameScanner.collectDeepSync(document.documentElement)) {
                try {
                  if (ifr.contentWindow) windowsToTry.push(ifr.contentWindow);
                } catch (e) {}
              }

              for (const win of windowsToTry) {
                const props = ['margs', 'mArg', 'pageData', 'courseData'];
                for (const prop of props) {
                  try {
                    const val = win[prop];
                    if (val && typeof val === 'object') {
                      
                      if (val.attachments) {
                        pageData = val;
                        logStore.addLog(`从window.${prop}获取完整数据成功(含attachments)`, "success");
                        break;
                      }
                      
                      if (!pageData && val.defaults && val.defaults.reportUrl) {
                        pageData = val;
                        logStore.addLog(`从window.${prop}获取数据成功(含reportUrl)`, "success");
                        break;
                      }
                    }
                  } catch (e) {}
                }
                if (pageData && pageData.defaults && pageData.defaults.reportUrl) break;
              }
            } catch (e) {
              logStore.addLog(`获取window数据失败: ${e.message}`, "warning");
            }
          }
          
          if (!pageData) {
            logStore.addLog(`无法获取mArg数据，回退到普通播放模式`, "warning");
          }
          
          
          if (pageData) {
            
            if (pageData.defaults) {
              classId = pageData.defaults.clazzId;
              uid = pageData.defaults.userid || getUid();
              reportUrl = pageData.defaults.reportUrl || '';

            }
            
            
            if (pageData.attachments && pageData.attachments.length > 0) {
              
              const iframeSrc = iframe.src;
              let srcObjectId = null;
              const srcMatch = iframeSrc.match(REGEX.OBJECT_ID);
              if (srcMatch) {
                srcObjectId = srcMatch[1];
              }
              if (!srcObjectId) {
                srcObjectId = iframe.getAttribute('objectid') || iframe.getAttribute('data-objectid') || null;
              }

              
              for (const attachment of pageData.attachments) {
                
                if (attachment.isPassed === true && !reviewMode) continue;
                if (completedSimulatedIds.has(attachment.property?.objectid)) continue;
                

                const moduleType = attachment.property?.module || '';
                const isVideo = moduleType === 'video' || moduleType === 'insertvideo' || attachment.type === 'video';
                const isAudio = moduleType === 'audio' || moduleType === 'insertaudio' || attachment.type === 'audio';

                if ((mediaType === 'video' && isVideo) || (mediaType === 'audio' && isAudio)) {

                  if (srcObjectId && attachment.property?.objectid === srcObjectId) {
                    objectId = attachment.property.objectid;
                    jobId = attachment.jobid;
                    otherInfo = attachment.otherInfo || '';
                    videoName = attachment.property?.name || videoName;
                    rt = attachment.property?.rt || '0.9';
                    break;
                  }

                  if (!objectId && attachment.job === true) {
                    objectId = attachment.property?.objectid;
                    jobId = attachment.jobid;
                    otherInfo = attachment.otherInfo || '';
                    videoName = attachment.property?.name || videoName;
                    rt = attachment.property?.rt || '0.9';
                  }
                }
              }
              
              
              if (!objectId) {
                for (const attachment of pageData.attachments) {

                  if (attachment.isPassed === true && !reviewMode) continue;
                  if (completedSimulatedIds.has(attachment.property?.objectid)) continue;

                  const moduleType = attachment.property?.module || '';
                  const isVideo = moduleType === 'video' || moduleType === 'insertvideo' || attachment.type === 'video';
                  const isAudio = moduleType === 'audio' || moduleType === 'insertaudio' || attachment.type === 'audio';

                  if ((mediaType === 'video' && isVideo) || (mediaType === 'audio' && isAudio)) {
                    objectId = attachment.property?.objectid;
                    jobId = attachment.jobid;
                    otherInfo = attachment.otherInfo || '';
                    videoName = attachment.property?.name || videoName;
                    rt = attachment.property?.rt || '0.9';
                    break;
                  }
                }
              }
            }
          }
          
          
          if (!objectId) {
            const iframeSrc = iframe.src || '';
            
            
            const objectIdMatch = iframeSrc.match(REGEX.OBJECT_ID);
            objectId = objectIdMatch ? objectIdMatch[1] : null;
            
            
            if (!objectId) {
              const dataAttrs = ['data-objectid', 'data-object-id', 'objectid'];
              for (const attr of dataAttrs) {
                const val = iframe.getAttribute(attr);
                if (val) {
                  objectId = val;
                  break;
                }
              }
            }
            
            
            if (!objectId) {
              const nameOrId = iframe.name || iframe.id || '';
              const nameMatch = nameOrId.match(/([a-f0-9]{24,})/i);
              if (nameMatch) {
                objectId = nameMatch[1];
              }
            }
          }
          
          if (!objectId) {
            logStore.addLog(`无法获取objectId，回退到普通播放模式`, "danger");
            return safeResolve(await playMediaDirectly(mediaType, iframeDocument));
          }
          
          if (processingSimulatedId.current) {
            logStore.addLog(`该视频正在模拟播放中，跳过重复处理`, "warning");
            return safeResolve();
          }
          processingSimulatedId.current = objectId;
          simulateVideoPlay._currentObjectId = objectId;
          
          
          
          if (!dtoken || !duration) {
            const videoInfo = await getVideoInfo(objectId);
            duration = videoInfo.duration;
            dtoken = videoInfo.dtoken;
          }
          
          if (!duration || !dtoken) {
            logStore.addLog(`获取视频信息失败，回退到普通播放模式`, "danger");
            return safeResolve(await playMediaDirectly(mediaType, iframeDocument));
          }
          
          logStore.addLog(`视频时长: ${formatDuration(duration)}秒`, "primary");
          
          
          if (!uid) {
            uid = cachedUid;
          }
          
          
          if (!classId) {
            const taskParams = getTaskParams();
            classId = taskParams?.clazzId || taskParams?.classId;
          }
          
          
          if (!classId) {
            const pageUrl = window.location.href;
            const classIdMatch = pageUrl.match(/clazzId=(\d+)/) || pageUrl.match(/classId=(\d+)/);
            classId = classIdMatch ? classIdMatch[1] : null;
          }
          
          
          if (!jobId) {
            
            const jobIdAttrs = ['data-jobid', 'data-job-id', 'jobid', 'data-workid'];
            for (const attr of jobIdAttrs) {
              const val = iframe.getAttribute(attr);
              if (val) {
                jobId = val;
                break;
              }
            }
            
            if (!jobId) {
              const urlMatch = window.location.href.match(/[?&]jobid=([^&]+)/i);
              jobId = urlMatch ? urlMatch[1] : null;
            }
            
            if (!jobId && iframe.src) {
              const srcMatch = iframe.src.match(REGEX.JOB_ID);
              jobId = srcMatch ? srcMatch[1] : null;
            }
            
            if (!jobId) {
              jobId = objectId; 
            }
          }
          
          if (!classId || !uid || !jobId) {
            logStore.addLog(`缺少必要参数: classId=${classId}, uid=${uid}, jobId=${jobId}`, "danger");
            logStore.addLog(`回退到普通播放模式`, "warning");
            return safeResolve(await playMediaDirectly(mediaType, iframeDocument));
          }
          
          
          const autoMaxRate = cxVideoParamValue("自动倍速", false);
          let playbackRate = cxVideoParamValue("播放倍速", 1);
          const maxRate = getMaxPlaybackRate(iframeDocument, false);
          const speedDisabled = maxRate === 1;
          
          
          window.__maxPlaybackRate = maxRate;
          
          
          const playbackRateParam = cxVideoParam("播放倍速");
          playbackRateParam.max = autoMaxRate ? maxRate : 3;
          
          if (speedDisabled) {
            logStore.addLog(`⚠️ 此视频已被学习通禁用倍速，使用>1x倍速可能会导致学习进度被清空`, "warning");
          }
          if (autoMaxRate) {
            playbackRate = maxRate;
            logStore.addLog(`自动倍速: ${playbackRate}x`, "success");
          } else {
            const simulateMaxRate = 3;
            if (playbackRate > simulateMaxRate) {
              playbackRate = simulateMaxRate;
              logStore.addLog(`模拟播放倍速已调整为最大值: ${playbackRate}x`, "warning");
            }
          }
          logStore.addLog(`播放倍速: ${playbackRate}x`, "primary");
          
          
          
          const host = window.location.host;
          const protocol = window.location.protocol;

          
          const videojs_id = String(parseInt(Math.random() * 9999999));
          document.cookie = 'videojs_id=' + videojs_id + ';path=/';

          
          const evasionEnabled = cxVideoParamValue("规避检测", false);

          const parseVideoCpi = () => {
            const m = window.location.href.match(/[?&]cpi=(\d+)/);
            if (m) return m[1];
            const om = String(otherInfo || '').match(/cpi_(\d+)/);
            if (om) return om[1];
            const rm = String(reportUrl || '').match(/\/a\/(\d+)/);
            if (rm) return rm[1];
            return uid;
          };

          let videoMid = '';
          let videoCourseId = '';
          try {
            videoCourseId = pageData?.defaults?.courseid || pageData?.defaults?.courseId
              || pageData?.courseid || getTaskParams()?.courseId || '';
            const quizAttachments = pageData?.attachments || [];
            const quizHit = quizAttachments.find(a => a?.property?.objectid === objectId);
            videoMid = (quizHit && quizHit.property && quizHit.property.mid) || '';
          } catch (e) {}

          const videoQuizRequest = (url) => new Promise((resolveQuiz, rejectQuiz) => {
            try {
              _GM_xmlhttpRequest({
                method: "get",
                url: url,
                headers: {
                  'Host': host,
                  'Referer': iframeSrc,
                  'Sec-Fetch-Site': 'same-origin',
                  'User-Agent': navigator.userAgent
                },
                timeout: 10000,
                onload: function(res) {
                  try {
                    if (res.status === 200) {
                      resolveQuiz(JSON.parse(res.responseText));
                    } else {
                      rejectQuiz(new Error('HTTP ' + res.status));
                    }
                  } catch (e) {
                    rejectQuiz(e);
                  }
                },
                onerror: function() { rejectQuiz(new Error('request error')); },
                ontimeout: function() { rejectQuiz(new Error('timeout')); }
              });
            } catch (e) {
              rejectQuiz(e);
            }
          });

          const flattenVideoQuestions = (res) => {
            const out = [];
            const seen = new WeakSet();
            const walk = (node, depth) => {
              if (!node || depth > 6) return;
              if (Array.isArray(node)) {
                node.forEach(n => walk(n, depth + 1));
                return;
              }
              if (typeof node !== 'object') return;
              if (seen.has(node)) return;
              const hasOptions = Array.isArray(node.options) && node.options.length > 0;
              const resourceId = node.resourceId || node.eventid || node.eventId;
              if (hasOptions && (resourceId || node.description || node.title)) {
                seen.add(node);
                out.push(node);
                return;
              }
              if (Array.isArray(node.datas)) {
                node.datas.forEach(d => walk(d, depth + 1));
                return;
              }
              Object.keys(node).forEach(k => {
                if (k !== 'options') walk(node[k], depth + 1);
              });
            };
            walk(res, 0);
            return out;
          };

          const initVideoQuestions = async (mid, cpi) => {
            const dc = Date.now();
            const midEnc = encodeURIComponent(mid);
            const query = `mid=${midEnc}&cpi=${cpi}&classid=${classId}` +
              (videoCourseId ? `&courseid=${videoCourseId}` : '') + `&_dc=${dc}`;
            const candidates = [];
            const seen = {};
            const pushCandidate = (url) => {
              if (!url || seen[url]) return;
              seen[url] = true;
              candidates.push(url);
            };
            pushCandidate(`${protocol}//${host}/mooc-ans/richvideo/initdatawithviewerV2?${query}`);
            const initdataUrl = pageData?.defaults?.initdataUrl || pageData?.initdataUrl;
            if (initdataUrl) {
              const baseInit = String(initdataUrl).startsWith('http')
                ? String(initdataUrl) : `${protocol}//${host}${initdataUrl}`;
              const v2FromInit = baseInit.replace(/initdatawithviewer$/i, 'initdatawithviewerV2');
              if (v2FromInit !== baseInit) pushCandidate(v2FromInit + '?' + query);
              pushCandidate(baseInit + '?start=undefined&mid=' + midEnc + '&_dc=' + dc);
              pushCandidate(baseInit + '?mid=' + midEnc + '&cpi=' + cpi + '&classid=' + classId + '&_dc=' + dc);
            }
            pushCandidate(`${protocol}//${host}/richvideo/initdatawithviewer?start=undefined&mid=${midEnc}&_dc=${dc}`);
            pushCandidate(`${protocol}//${host}/ananas/initdatawithviewer?mid=${midEnc}&cpi=${cpi}&classid=${classId}&_dc=${dc}`);
            for (let i = 0; i < candidates.length; i++) {
              try {
                const res = await videoQuizRequest(candidates[i]);
                const list = flattenVideoQuestions(res);
                if (list.length) return list;
              } catch (e) {}
            }
            return [];
          };

          const pickVideoQuestionAnswer = (q) => {
            const options = q.options || [];
            const right = options.filter(o => o && (o.isRight === true || o.isRight === 1 ||
              o.isRight === '1' || o.isRight === 'true'));
            if (right.length) {
              return right.map(o => String(o.name || o.content || '').trim()).filter(Boolean).join('');
            }
            const fromField = q.rightAnswer || q.answer || q.correctAnswer ||
              q.rightOption || q.standardAnswer;
            if (fromField) {
              return String(fromField).replace(/[^A-Ga-g]/g, '').toUpperCase();
            }
            return '';
          };

          const submitVideoAnswer = (resourceId, memberinfo, answer) => {
            const url = `${protocol}//${host}/question/quiz-validation?classid=${classId}` +
              `&cpi=${parseVideoCpi()}&objectid=${objectId}&_dc=${Date.now()}` +
              `&eventid=${resourceId}&memberinfo=${memberinfo}&answerContent=${encodeURIComponent(answer)}`;
            return videoQuizRequest(url);
          };

          const handleVideoQuestionsByApi = async () => {
            if (mediaType !== 'video') return;
            if (!videoMid) {
              logStore.addLog('视频内题目：缺少 mid，已跳过', "warning");
              return;
            }
            let questionList = [];
            try {
              questionList = await initVideoQuestions(videoMid, parseVideoCpi());
            } catch (e) {
              logStore.addLog(`视频内题目拉取失败：${e.message}`, "warning");
              return;
            }
            if (!questionList.length) {
              logStore.addLog('视频内无题目', "primary");
              return;
            }
            logStore.addLog(`解析到 ${questionList.length} 道视频题，开始作答`, "primary");
            for (const q of questionList) {
              const resourceId = q.resourceId || q.eventid || q.eventId;
              const options = q.options || [];
              if (!resourceId || !options.length) continue;
              const memberinfo = q.memberinfo || q.memberInfo || '';
              const description = String(q.description || q.title || '视频内题目')
                .replace(/<[^>]+>/g, '').slice(0, 40);
              const answers = [];
              const addAnswer = (v) => {
                const ans = String(v || '').trim();
                if (ans && !answers.includes(ans)) answers.push(ans);
              };
              addAnswer(pickVideoQuestionAnswer(q));
              options.forEach(o => addAnswer(o.name || o.content));
              let answered = false;
              for (const ans of answers) {
                try {
                  const res1 = await submitVideoAnswer(resourceId, memberinfo, ans);
                  if (res1 && res1.status) {
                    answered = true;
                    const ansLabel = res1.isRight ? '正确答案' : '尝试答案';
                    logStore.addLog(`[视频内题目] ${description} → ${ansLabel}：${ans}`, "success");
                    break;
                  }
                } catch (e) {}
              }
              if (!answered) {
                logStore.addLog(`[视频内题目] ${description} 提交未通过（已尝试全部选项）`, "warning");
              }
              await delay(1);
            }
            logStore.addLog('视频内题目处理完毕', "success");
          };

          const reportProgress = async (currentTime, isComplete) => {
            return new Promise((resolveReport) => {
              const enc = calculateEnc(classId, uid, jobId, objectId, currentTime, duration);

              if (enc.length !== 32) {
                logStore.addLog(`加密字符串计算失败`, "danger");
                return resolveReport(false);
              }

              const isFullDuration = duration > 0 && currentTime >= targetDuration;
              const currentIsdrag = (isComplete && isFullDuration) ? '4' : (currentTime > 0 ? '0' : '3');
              if (isComplete && !isFullDuration) {
                logStore.addLog(`已播放${Math.round(currentTime)}/${Math.round(duration)}秒，未达完成条件，本次按进度上报`, "warning");
              }
              const baseUrl = reportUrl.startsWith('http') ? reportUrl : `${protocol}//${host}${reportUrl}`;
              const reportsUrl = `${baseUrl}/${dtoken}?clazzId=${classId}&playingTime=${currentTime}&duration=${duration}&clipTime=0_${duration}&objectId=${objectId}&otherInfo=${otherInfo}&jobid=${jobId}&userid=${uid}&isdrag=${currentIsdrag}&view=pc&enc=${enc}&rt=${rt}&dtype=${mediaType === 'video' ? 'Video' : 'Audio'}&_t=${Date.now()}`;

              _GM_xmlhttpRequest({
                method: "get",
                url: reportsUrl,
                headers: {
                  'Host': host,
                  'Referer': iframeSrc,
                  'Sec-Fetch-Site': 'same-origin',
                  'Content-Type': 'application/json'
                },
                onload: function(res) {
                  try {
                    const result = JSON.parse(res.responseText);
                    if (result.isPassed) {
                      logStore.addLog(`✅ 视频任务已完成`, "success");
                      resolveReport(true);
                    } else {
                      resolveReport(false);
                    }
                  } catch (e) {
                    logStore.addLog(`上报响应解析失败(status=${res.status}): ${res.responseText.substring(0, 200)}`, "danger");
                    resolveReport(false);
                  }
                },
                onerror: function(err) {
                  logStore.addLog(`上报请求失败`, "danger");
                  resolveReport(false);
                }
              });
            });
          };

          if (!reportUrl) {
            logStore.addLog(`⚠️ reportUrl为空，将使用默认路径/multimedia/v2`, "warning");
            reportUrl = '/multimedia/v2';
          }

          
          if (mediaType === 'audio') {
            rt = '';
          }

          
          const rtValue = parseFloat(rt) || 1.0;
          let targetDuration = reviewMode ? duration : Math.ceil(duration * rtValue);
          let rtAttempted = false; 
          if (reviewMode) {
            logStore.addLog('复习模式：完整重刷，从 0 秒播放至 100%', "primary");
          }

          
          
          if (window._currentMediaInterval) {
            clearInterval(window._currentMediaInterval);
            window._currentMediaInterval = null;
          }

          
          progressStore.update({
            taskName: videoName,
            percent: 0,
            currentTime: 0,
            totalTime: duration,
            type: mediaType === 'video' ? '视频' : '音频',
            detail: `${formatDuration(0)}/${formatDuration(duration)}`,
            isPlaying: true,
            speedDisabled: speedDisabled
          });

          
          let playTime = 0;
          let playsTime = 0;
          let lastTickMs = 0;
          let isFirst = true;
          let isdrag = '3';
          let completeRetryCount = 0;
          const maxCompleteRetries = 3;
          const reportIntervalSec = 50;
          const rtReportMinGapMs = 5000;
          const completeRetryGapMs = 4000;
          let lastReportWallMs = 0;
          let nextCompleteRetryWallMs = 0;
          let isReporting = false;
          let lastLoggedPercent = 0;

          const afkEnabled = readCxParamValue("视频设置", "激活挂机", false);
          const simulateLoopId = 'simulate_' + Date.now();
          let loopInterval = null;

          const finishSimulateSuccess = (detailText) => {
            if (afkEnabled) { BackgroundWorker.stop(simulateLoopId); } else { clearInterval(loopInterval); }
            window._simulateActive = false;
            completedSimulatedIds.add(objectId);
            logStore.addLog(`🎬 ${mediaType}模拟播放完成`, "success");
            progressStore.update({
              percent: 100,
              currentTime: duration,
              detail: detailText || '播放完成',
              isPlaying: false
            });
            try {
              const mediaElement = iframeDocument?.documentElement?.querySelector(mediaType);
              if (mediaElement) {
                mediaElement.dispatchEvent(new Event('ended', { bubbles: true }));
              }
            } catch (e) {
              logStore.addLog(`触发ended事件失败: ${e.message}`, "warning");
            }
            window._currentMediaInterval = null;
            safeResolve();
          };

          const verifyTaskPassedByStatus = async () => {
            let fid = '';
            try {
              fid = _unsafeWindow.FID || getFid() || '';
            } catch (e) {
              fid = '';
            }
            const statusUrl = `${protocol}//${host}/ananas/status/${objectId}?k=${fid}&_uid=${uid}&flag=normal&_dc=${Date.now()}`;
            return new Promise((resolveStatus) => {
              try {
                _GM_xmlhttpRequest({
                  method: "get",
                  url: statusUrl,
                  headers: {
                    'Host': host,
                    'Referer': iframeSrc,
                    'Sec-Fetch-Site': 'same-origin'
                  },
                  onload: function(res) {
                    try {
                      const info = JSON.parse(res.responseText);
                      if (info && info.isPassed) {
                        logStore.addLog(`✅ 兜底查询确认任务已通过`, "success");
                        resolveStatus(true);
                      } else {
                        logStore.addLog(`❌ 兜底查询确认仍未通过（可能受学时或防刷限制）`, "danger");
                        resolveStatus(false);
                      }
                    } catch (e) {
                      logStore.addLog(`⚠️ 兜底查询解析失败，按未通过处理`, "warning");
                      resolveStatus(false);
                    }
                  },
                  onerror: function() {
                    logStore.addLog(`⚠️ 兜底查询请求失败，按未通过处理`, "warning");
                    resolveStatus(false);
                  }
                });
              } catch (e) {
                resolveStatus(false);
              }
            });
          };

          const loopCallback = async () => {
            if (isReporting) return;
            
            
            if (!window._simulateActive) {
              logStore.addLog('模拟播放已被停止，结束处理', 'warning');
              if (afkEnabled) { BackgroundWorker.stop(simulateLoopId); } else { clearInterval(loopInterval); }
              window._currentMediaInterval = null;
              progressStore.update({ isPlaying: false });
              releaseLock();
              safeResolve();
              return;
            }

            const hasMedia = hasVideoOrAudio();
            if (!hasMedia) {
              window._simulateActive = false;
              logStore.addLog('检测到视频/音频已消失，停止模拟播放（未完成）', 'warning');
              if (afkEnabled) { BackgroundWorker.stop(simulateLoopId); } else { clearInterval(loopInterval); }
              window._currentMediaInterval = null;
              progressStore.update({
                isPlaying: false
              });
              clearOverlayAndBanner();
              releaseLock();
              safeResolve();
              return;
            }

            const autoMaxRateNow = cxVideoParamValue("自动倍速", false);
            let playbackRateNow = autoMaxRateNow ? maxRate : Math.min(playbackRateParam.value || playbackRate, 3);
            let effectiveRate = playbackRateNow;

            if (evasionEnabled) {
              effectiveRate = getEvasionRate(effectiveRate);
              simulateUserBehavior();
            }

            const nowMs = Date.now();
            const elapsedSec = lastTickMs > 0 ? Math.max(0, (nowMs - lastTickMs) / 1000) : 1;
            lastTickMs = nowMs;
            playsTime += effectiveRate * elapsedSec;
            playTime = Math.ceil(playsTime);

            playTime = compensateDuration(playTime, duration, playbackRateNow);

            if (playTime > duration) {
              playTime = duration;
            }

            const progress = Math.floor((playTime / duration) * 100);

            progressStore.update({
              percent: progress,
              currentTime: playTime,
              totalTime: duration,
              detail: `${formatDuration(playTime)}/${formatDuration(duration)}`,
              isPlaying: true,
              speedDisabled: speedDisabled
            });

            let shouldReport = false;
            if (playTime >= duration) {
              shouldReport = completeRetryCount === 0 || nowMs >= nextCompleteRetryWallMs;
            } else if (isFirst) {
              shouldReport = true;
            } else if (!rtAttempted && targetDuration > 0 && targetDuration < duration
              && playTime >= targetDuration && nowMs - lastReportWallMs >= rtReportMinGapMs) {
              shouldReport = true;
            } else if (lastReportWallMs > 0 && nowMs - lastReportWallMs >= reportIntervalSec * 1000) {
              shouldReport = true;
            }

            if (shouldReport) {
              isReporting = true;

              if (isFirst) {
                playTime = 0;
                isFirst = false;
              }

              if (playTime >= duration) {
                playTime = duration;
                isdrag = '4';
              } else if (playTime > 0) {
                isdrag = '0';
              }
              lastReportWallMs = nowMs;

              const percent = Math.round(playTime / duration * 100);
              const rtBoundaryHit = !rtAttempted && targetDuration > 0 && targetDuration < duration
                && playTime > 0 && playTime < duration && playTime >= targetDuration;
              if (!rtBoundaryHit && (percent >= lastLoggedPercent + 20 || percent === 100)) {
                logStore.addLog(`📤 上报进度: ${percent}%（${Math.round(playTime)}/${Math.round(duration)}s）`, "info");
                lastLoggedPercent = percent;
              }

              
              if (rtBoundaryHit) {
                rtAttempted = true;
                logStore.addLog(`📊 已播放至${percent}%（${Math.round(playTime)}/${Math.round(duration)}s），尝试完成上报`, "info");
                const isComplete = await reportProgress(playTime, true);
                isReporting = false;
                if (isComplete) {
                  finishSimulateSuccess();
                  return;
                } else {
                  logStore.addLog(`已播放至${percent}%仍未通过，继续播放至100%`, "warning");
                  targetDuration = duration;
                }
              } else {
                const isComplete = await reportProgress(playTime, isdrag === '4');
                isReporting = false;

                if (isComplete && !reviewMode) {
                  finishSimulateSuccess();
                } else if (isdrag === '4') {
                  if (reviewMode) {
                    logStore.addLog('复习模式：已完整播放至 100%，按复习结束处理', "success");
                    finishSimulateSuccess('复习模式已完成');
                    return;
                  }
                  completeRetryCount++;
                  if (completeRetryCount >= maxCompleteRetries) {
                    isReporting = true;
                    logStore.addLog(`完成上报重试${maxCompleteRetries}次仍未通过，正在查询任务点真实状态…`, "warning");
                    const statusPassed = await verifyTaskPassedByStatus();
                    if (statusPassed) {
                      finishSimulateSuccess('兜底确认通过');
                      return;
                    }
                    if (afkEnabled) { BackgroundWorker.stop(simulateLoopId); } else { clearInterval(loopInterval); }
                    window._simulateActive = false;
                    logStore.addLog(`完成上报重试${maxCompleteRetries}次仍未通过，请检查视频是否需要其他操作`, "danger");
                    progressStore.update({
                      percent: 100,
                      currentTime: duration,
                      detail: '上报未通过',
                      isPlaying: false
                    });
                    window._currentMediaInterval = null;
                    safeResolve();
                  } else {
                    nextCompleteRetryWallMs = nowMs + completeRetryGapMs;
                    logStore.addLog(`完成上报未通过，${Math.round(completeRetryGapMs / 1000)}秒后重试(${completeRetryCount}/${maxCompleteRetries})...`, "warning");
                  }
                }
              }
            }
          };

          window._simulateActive = true;
          showOverlayAndBanner();

          await handleVideoQuestionsByApi();

          if (!window._simulateActive) {
            logStore.addLog('答题期间模拟播放已被停止，结束处理', "warning");
            clearOverlayAndBanner();
            releaseLock();
            safeResolve();
            return;
          }

          if (afkEnabled) {
            window._simulateLoopId = simulateLoopId;
            BackgroundWorker.start(simulateLoopId, loopCallback, 1000);
            logStore.addLog(`🖥️ 挂机模式已启用，使用后台Worker计时`, "success");
          } else {
            loopInterval = setInterval(loopCallback, 1000);
            window._currentMediaInterval = loopInterval;
          }

        } catch (e) {
          window._currentMediaInterval = null;
          window._simulateActive = false;
          clearOverlayAndBanner();
          logStore.addLog(`模拟播放出错: ${e.message}`, "danger");
          logStore.addLog(`回退到普通播放模式`, "warning");
          safeResolve(await playMediaDirectly(mediaType, iframeDocument));
        }
        })();
      });
    };

    
    
    
    
    
    
    const playMediaDirectly = async (mediaType, iframeDocument) => {
      return new Promise((resolve) => {
        logStore.addLog(`正在尝试播放${mediaType}，请稍等5s`, "primary");
        
        const autoMaxRate = cxVideoParamValue("自动倍速", false);
        const playbackRateParam = cxVideoParam("播放倍速");
        let playbackRate = playbackRateParam.value || 1;
        const maxRate = getMaxPlaybackRate(iframeDocument);
        
        
        let videoQuizStopped = false;
        const videoQuizEnabled = cxVideoParamValue("视频答题", false);
        if (videoQuizEnabled) {
          const loop = async () => {
            if (videoQuizStopped) return;
            try {
              const submitBtn = iframeDocument?.querySelector("#videoquiz-submit");
              if (submitBtn) {
                const list = Array.from(iframeDocument.querySelectorAll(".ans-videoquiz-opt label"));
                if (list.length > 0) {
                  const answer = list[Math.floor(Math.random() * list.length)];
                  answer?.click();
                  submitBtn?.click();
                  await delay(3);
                  const container = iframeDocument.querySelector("#video .ans-videoquiz");
                  if (container) {
                    container.remove();
                  }
                  const components = Array.from(iframeDocument.querySelectorAll(".x-component-default"));
                  if (components.length) {
                    for (const com of components) {
                      com.style.display = "none";
                    }
                  }
                  logStore.addLog("已处理视频内题目", "success");
                }
              }
            } catch (e) {
            }
            if (videoQuizStopped) return;
            await delay(3);
            loop();
          };
          loop();
        }
        
        
        
        const simulatePlayEnabled = cxVideoParamValue("模拟播放", false);
        if (!simulatePlayEnabled) {
          
          playbackRateParam.max = maxRate;
          
          if (playbackRate > maxRate) {
            playbackRateParam.value = maxRate;
            playbackRate = maxRate;
          }
        }
        
        if (autoMaxRate) {
          
          playbackRate = maxRate;
          logStore.addLog(`自动倍速: ${playbackRate}x`, "success");
        } else {
          
          if (playbackRate > maxRate) {
            playbackRate = maxRate;
            logStore.addLog(`倍速已调整为播放器最大值: ${playbackRate}x`, "warning");
          }
        }
        let isExecuted = false;
        const afkEnabledPlay = readCxParamValue("视频设置", "激活挂机", false);
        const playLoopId = 'play_media_' + Date.now();
        const healthCheckId = 'play_health_' + Date.now();
        const playLoopCallback = async () => {
          const mediaElement = iframeDocument.documentElement.querySelector(mediaType);
          if (mediaElement && !isExecuted) {
            await mediaElement.pause();
            mediaElement.muted = true;
            await mediaElement.play();
            
            mediaElement.playbackRate = playbackRate;
            logStore.addLog(`${mediaType}播放成功，倍速: ${playbackRate}x`, "primary");
            const listener = async () => {
              
              if (afkEnabledPlay) {
                await new Promise(resolveDelay => {
                  BackgroundWorker.start('play_resume_delay', () => { BackgroundWorker.stop('play_resume_delay'); resolveDelay(); }, 3000);
                });
              } else {
                await delay(3);
              }
              try {
                await mediaElement.play();
              } catch(e) {}
              mediaElement.playbackRate = playbackRate;
            };
            mediaElement.addEventListener("pause", listener);
            mediaElement.addEventListener("ended", () => {
              logStore.addLog(`${mediaType}已播放完成`, "success");
              mediaElement.removeEventListener("pause", listener);
              videoQuizStopped = true;
              
              BackgroundWorker.stop(healthCheckId);
              
              mediaElement.pause();
              const blockReplay = (e) => {
                e.target.pause();
              };
              mediaElement.addEventListener("play", blockReplay);
              resolve();
            });
            isExecuted = true;
            if (afkEnabledPlay) {
              BackgroundWorker.stop(playLoopId);
            } else {
              clearInterval(intervalId);
            }
            
            if (afkEnabledPlay) {
              BackgroundWorker.start(healthCheckId, () => {
                try {
                  const el = iframeDocument.documentElement.querySelector(mediaType);
                  if (el && el.paused && !el.ended) {
                    el.play().catch(() => {});
                    el.playbackRate = playbackRate;
                  }
                } catch (e) {}
              }, 5000);
              logStore.addLog('🖥️ 挂机模式视频健康检查已启动', 'success');
            }
          }
        };
        if (afkEnabledPlay) {
          BackgroundWorker.start(playLoopId, playLoopCallback, 2500);
        } else {
          const intervalId = setInterval(playLoopCallback, 2500);
        }
      });
    };

    
    
    const getMaxPlaybackRate = (iframeDocument, showLog = true) => {
      try {
        const menuItems = iframeDocument.querySelectorAll('.vjs-playback-rate .vjs-menu-content .vjs-menu-item');
        if (menuItems.length === 0) {
          return 1; 
        }
        let maxRate = 1;
        menuItems.forEach(item => {
          const text = item.textContent.trim();
          const rate = parseFloat(text.replace('x', ''));
          if (!isNaN(rate) && rate > maxRate) {
            maxRate = rate;
          }
        });
        if (showLog) {
          logStore.addLog(`播放器最大倍速: ${maxRate}x`, "info");
        }
        return maxRate;
      } catch (e) {
        logStore.addLog(`获取最大倍速失败，使用默认值1x`, "warning");
        return 1;
      }
    };

    
    const handleMediaContent = async (mediaType, iframeDocument, iframe) => {
      
      const useSimulatePlay = cxVideoParamValue("模拟播放", false);
      
      if (useSimulatePlay) {
        return simulateVideoPlay(iframe, iframeDocument, mediaType);
      } else {
        return playMediaDirectly(mediaType, iframeDocument);
      }
    };
    const handleAssignment = async (iframe, iframeDocument, iframeWindow) => {
      logStore.addLog("发现一个作业，正在解析", "warning");
      const taskId = _globalTaskId;
      return new Promise((resolve) => {
        (async () => {
        if (!iframeDocument)
          return resolve();

        decodeCipherFont(iframeDocument);
        logStore.addLog(`题目列表获取成功`, "primary");
        const correctRate = await new CxQuestionHandler("zj", iframe).init();
        if (taskId !== _globalTaskId) {
          return resolve();
        }
        iframeWindow.alert = () => {
        };
        if (readCxParamValue("章节/作业/测验设置", "自动提交", false)) {
          logStore.addLog("自动提交已开启，尝试提交", "primary");
          
          const answerParamsPart = configStore.platformParams.cx.parts.find(p => p.name === "答题参数");
          const correctRateThreshold = answerParamsPart?.params.find(p => p.name === "正确阈值")?.value || 85;
          if (correctRate < Number(correctRateThreshold)) {
            logStore.addLog(`正确率小于${correctRateThreshold}%，暂存`, "danger");
            await iframeWindow.noSubmit();
          } else {
            logStore.addLog(`正确率大于${correctRateThreshold}%，提交`, "success");
            await iframeWindow.btnBlueSubmit();
            await delay(1.5);
            await iframeWindow.submitCheckTimes();
            logStore.addLog("提交成功", "success");
            
            
            await delay(3);
            
            const resultDocument = iframe.contentDocument || iframe.contentWindow.document;
            await detectAndReportResults(resultDocument);
          }
        } else {
          logStore.addLog("未开启自动提交，暂存", "primary");
          await iframeWindow.noSubmit();
        }
        logStore.addLog("作业已完成", "success");
        return resolve();
        })();
      });
    };
    
    const handleSlideshow = async (iframeWindow) => {
      logStore.addLog("发现一个PPT，正在解析", "warning");

      
      if (typeof iframeWindow.finishJob === "function") {
        iframeWindow.finishJob();
        await delay(3);
        logStore.addLog("PPT阅读完成", "success");
        return Promise.resolve();
      }

      
      const swiperContainer = iframeWindow.document.querySelector(".swiper-container");
      if (swiperContainer) {
        
        iframeWindow.document.querySelectorAll("audio").forEach((audio) => {
          audio.addEventListener("play", () => { audio.muted = true; });
        });
        const slides = iframeWindow.document.querySelectorAll(".swiper-container .swiper-slide");
        const len = slides.length;
        logStore.addLog(`检测到带音频PPT，共${len}页，正在翻阅`, "primary");
        for (let i = 0; i < len; i++) {
          if (typeof iframeWindow.swiperNext === "function") {
            iframeWindow.swiperNext();
          }
          await delay(0.5);
        }
        await delay(3);
        logStore.addLog("PPT翻阅完成", "success");
        return Promise.resolve();
      }

      
      const pptWindow = iframeWindow.document.querySelector("#panView")?.contentWindow;
      if (pptWindow) {
        await pptWindow.scrollTo({ top: pptWindow.document.body.scrollHeight, behavior: "smooth" });
        await delay(3);
      }

      logStore.addLog("PPT阅读完成", "success");
      return Promise.resolve();
    };
    const handleEbook = async (iframeWindow) => {
      logStore.addLog("发现一个电子书，正在解析", "warning");
      _unsafeWindow.top.onchangepage(iframeWindow.getFrameAttr("end"));
      logStore.addLog("阅读完成", "success");
      return Promise.resolve();
    };
    
    
    const handleBookReader = async (iframeWindow, iframeDoc) => {
      logStore.addLog("发现一个书籍阅读任务，正在完成", "warning");
      try {
        const src = iframeWindow.location?.href || '';
        const timing = src ? parseInt(new URL(src).searchParams.get('timing') || '60') : 60;
        const waitSec = (timing + 3);
        logStore.addLog(`书籍阅读中，预计${waitSec * 3}秒...`, "primary");

        const jumper = iframeDoc.querySelector('#pagejump');
        if (jumper && iframeWindow.reader?.goPage) {
          
          await delay(waitSec);
          jumper.value = '5';
          jumper.dispatchEvent(new Event('change'));
          logStore.addLog("已跳转正文页", "primary");
          await delay(waitSec);
          jumper.value = '7';
          jumper.dispatchEvent(new Event('change'));
          logStore.addLog("已跳转封底页", "primary");
          await delay(waitSec);
          
          const pagers = Array.from(iframeDoc.querySelectorAll('.readerPager'));
          const lastPager = pagers.filter(el => el.style.zIndex === '101')[0];
          if (lastPager) lastPager.click();
          logStore.addLog("书籍阅读完成", "success");
        } else if (iframeWindow.readweb?.goto && typeof iframeWindow.epage !== 'undefined') {
          
          await delay(5);
          iframeWindow.readweb.goto(iframeWindow.epage);
          logStore.addLog("书籍阅读完成", "success");
        } else {
          logStore.addLog("无法识别书籍阅读器，请手动完成", "danger");
        }
      } catch (e) {
        logStore.addLog(`书籍阅读出错: ${e.message}`, "danger");
      }
      return Promise.resolve();
    };
    const awaitFrameReady = async (iframe) => {
      return new Promise((resolve) => {
        const afkEnabledFrame = readCxParamValue("视频设置", "激活挂机", false);
        const frameReadyId = 'frame_ready_' + Date.now();
        const checkReady = async () => {
          var _a;
          if (iframe.contentDocument && ((_a = iframe.contentDocument) == null ? void 0 : _a.readyState) == "complete") {
            if (afkEnabledFrame) {
              BackgroundWorker.stop(frameReadyId);
            }
            resolve();
          }
        };
        if (afkEnabledFrame) {
          BackgroundWorker.start(frameReadyId, checkReady, 500);
        } else {
          const intervalId = setInterval(() => {
            var _a;
            if (iframe.contentDocument && ((_a = iframe.contentDocument) == null ? void 0 : _a.readyState) == "complete") {
              clearInterval(intervalId);
              resolve();
            }
          }, 500);
        }
      });
    };
    
    
    const classifyFrame = async (iframe) => {
      const iframeSrc = iframe.src;
      const iframeDocument = iframe.contentDocument;
      const iframeWindow = iframe.contentWindow;
      
      if (!iframeDocument || !iframeWindow) return 'skip';
      if (iframeSrc.includes("javascript:")) return 'skip';
      
      const lastTaskId = _processedIframeTasks.get(iframe);
      const currentTaskId = _globalTaskId;
      if (lastTaskId === currentTaskId) return 'skip';
      _processedIframeTasks.set(iframe, currentTaskId);
      
      await awaitFrameReady(iframe);
      
      
      const reviewMode = readCxParamValue("模式设置", "复习模式", false);
      
      
      if (!reviewMode) {
        let element = iframe.parentElement;
        while (element) {
          if (element.classList && element.classList.contains("ans-job-finished")) {
            logStore.addLog("任务点已完成，跳过", "success");
            return 'skip';
          }
          element = element.parentElement;
        }
      }
      
      
      if (!reviewMode && iframeSrc.includes("api/work")) {
        try {
          const pageContent = iframeDocument.documentElement.innerText || "";
          if (pageContent.includes("已完成") || pageContent.includes("待批阅")) return 'skip';
        } catch (e) {}
      }
      
      
      if (!reviewMode) {
        const checkElement = iframe.closest(".ans-job-icon") || iframe.parentElement?.querySelector(".ans-job-icon");
        if (checkElement) {
          const ariaLabel = checkElement.getAttribute("aria-label") || "";
          if (ariaLabel.includes("已完成")) {
            logStore.addLog("任务点已完成，跳过", "success");
            return 'skip';
          }
        }
      }
      
      const _src = iframe.getAttribute('_src') || '';
      const matchSrc = iframeSrc.includes("api/work");
      const matchSrcAttr = _src.includes("api/work");
      const isMediaIframe = iframeSrc.includes("video") || iframeSrc.includes("audio");
      
      
      if (matchSrcAttr && !matchSrc) {
        if (!isMediaIframe) {
          return 'skip';
        }
        
      }
      
      
      if (matchSrc && !isMediaIframe) {
        return 'assignment';
      }
      
      
      const ansJobIcon = iframe.parentElement?.querySelector(".ans-job-icon");
      if (ansJobIcon) {
        if (isMediaIframe) {
          return iframeSrc.includes("video") ? 'video' : 'audio';
        }
        if (iframeDocument.querySelector("#img.imglook") || iframeDocument.querySelector(".swiper-container")) {
          return 'slideshow';
        }
        if (iframeSrc.includes("modules/innerbook")) {
          return 'ebook';
        }
        if (iframeSrc.includes("/readsvr/book/mooc") || iframeDocument.querySelector("#reader")) {
          return 'bookreader';
        }
      }
      
      return 'skip';
    };
    
    
    const executeFrame = async (iframe, frameType) => {
      const iframeSrc = iframe.src;
      const iframeDocument = iframe.contentDocument;
      const iframeWindow = iframe.contentWindow;
      
      const onlyVideo = readCxParamValue("模式设置", "仅视频", false);
      const onlyAnswer = readCxParamValue("模式设置", "仅答题", false);
      
      switch (frameType) {
        case 'assignment':
          if (onlyVideo) {
            if (!hasLoggedSkipTip) {
              logStore.addLog("仅视频模式，跳过答题", "primary");
              hasLoggedSkipTip = true;
            }
            return;
          }
          return handleAssignment(iframe, iframeDocument, iframeWindow);
        
        case 'video':
        case 'audio':
          if (onlyAnswer) {
            if (!hasLoggedSkipTip) {
              logStore.addLog("仅答题模式，跳过视频等其他内容", "primary");
              hasLoggedSkipTip = true;
            }
            return;
          }
          if (_completedMediaIframes.has(iframe)) {
            logStore.addLog("媒体任务点已完成，跳过重复处理", "success");
            return;
          }
          await handleMediaContent(frameType, iframeDocument, iframe);
          _completedMediaIframes.add(iframe);
          return;
        
        case 'slideshow':
          if (onlyAnswer) {
            if (!hasLoggedSkipTip) {
              logStore.addLog("仅答题模式，跳过视频等其他内容", "primary");
              hasLoggedSkipTip = true;
            }
            return;
          }
          return handleSlideshow(iframeWindow);
        
        case 'ebook':
          if (onlyAnswer) {
            if (!hasLoggedSkipTip) {
              logStore.addLog("仅答题模式，跳过视频等其他内容", "primary");
              hasLoggedSkipTip = true;
            }
            return;
          }
          return handleEbook(iframeWindow);
        
        case 'bookreader':
          if (onlyAnswer) {
            if (!hasLoggedSkipTip) {
              logStore.addLog("仅答题模式，跳过书籍阅读", "primary");
              hasLoggedSkipTip = true;
            }
            return;
          }
          return handleBookReader(iframeWindow, iframeDocument);
        
        default:
          return;
      }
    };
    init();
    monitorIframes();
    watchUrlChanges();
    
    
    const afkEnabledGlobal = readCxParamValue("视频设置", "激活挂机", false);
    if (afkEnabledGlobal) {
      FakeMediaPlayer.start();
      logStore.addLog('🖥️ 全局挂机模式已启用', 'success');
    }
  };
  
  
  
  
  
  const clickOption = (element) => {
    element.focus();
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  };

  
  
  
  
  
  
  const useStuActiveLogic = async () => {
    
    try {
      window.parent.postMessage({ source: 'chaoxing-helper-iframe', action: 'closePanel' }, '*');
    } catch (e) {}

    const logStore = useLogStore();
    const questionStore = useQuestionStore();
    const configStore = useConfigStore();
    logStore.addLog(`进入随堂练习答题页面`, "primary");
    logStore.addLog(`等待Vue渲染题目...`, "warning");
    
    
    decodeCipherFont(document);
    
    
    let questionItems = null;
    for (let i = 0; i < 60; i++) {
      await delay(0.5);
      questionItems = document.querySelectorAll(".question-item");
      if (questionItems.length > 0) break;
    }
    
    if (!questionItems || questionItems.length === 0) {
      logStore.addLog("未解析到题目，可能页面尚未加载完成", "danger");
      logStore.addLog("请刷新页面重试", "warning");
      return;
    }
    
    
    const questionTypeMapping = {
      "单选题": "0",
      "多选题": "1",
      "判断题": "3",
      "填空题": "2"
    };
    
    const questions = [];
    questionItems.forEach((questionItem) => {
      const questionNameEl = questionItem.querySelector(".question-name");
      const questionText = questionNameEl ? questionNameEl.innerText.trim() : "";
      
      let questionTypeText = "单选题";
      if (questionItem.classList.contains("multiple-choice")) {
        questionTypeText = "多选题";
      } else if (questionText.includes("判断题")) {
        questionTypeText = "判断题";
      } else if (questionText.includes("填空题")) {
        questionTypeText = "填空题";
      }
      
      const cleanTitle = questionText
        .replace(/^\d+\.\s*/, "")
        .replace(/\[单选题\]|\[多选题\]|\[判断题\]|\[填空题\]/g, "")
        .trim();
      
      const optionLis = questionItem.querySelectorAll(".option-list li");
      const optionsObject = {};
      const optionTexts = [];
      optionLis.forEach((li) => {
        const result = li.querySelector(".option-result")?.innerText?.trim() || "";
        optionsObject[result] = li;
        optionTexts.push(result);
      });
      
      questions.push({
        element: questionItem,
        type: questionTypeMapping[questionTypeText] || "0",
        title: cleanTitle,
        optionsText: optionTexts,
        options: optionsObject,
        answer: [],
        workType: "stuActive",
        refer: window.location.href
      });
    });
    
    logStore.addLog(`成功解析到${questions.length}道题目`, "success");
    
    
    const answerParamsPart = configStore.platformParams.cx?.parts.find(p => p.name === "答题参数");
    const skipAnswered = answerParamsPart?.params.find(p => p.name === "跳过已答")?.value || false;
    const answerInterval = answerParamsPart?.params.find(p => p.name === "答题间隔")?.value || 1;
    const useSimilarity = answerParamsPart?.params.find(p => p.name === "相似匹配")?.value || false;
    const simulateDelay = answerParamsPart?.params.find(p => p.name === "模拟延迟")?.value ?? true;
    
    let skippedCount = 0;
    for (const [index, question] of questions.entries()) {
      
      const isAnswered = Array.from(question.element.querySelectorAll(".option-list li")).some(li => li.classList.contains("active"));
      if (skipAnswered && isAnswered) {
        logStore.addLog(`第${index + 1}题已作答，跳过`, "warning");
        skippedCount += 1;
        questionStore.addQuestion(question);
        continue;
      }
      
      logStore.addLog(`正在查找第${index + 1}道题目答案...`, "primary");
      const answerData = await queryAnswer(question);
      
      if (answerData.code === 499) {
        break;
      }
      if (answerData.code === 200) {
        question.answer = answerData.data.answer;
        question.source = answerData.data.source;
        
        
        if (question.type === "0" || question.type === "1" || question.type === "3") {
          const optionList = getOptionList(question);
          const targetEls = [];
          const answerList = Array.isArray(question.answer) ? question.answer : splitAnswerText(question.answer);
          for (const answer of answerList) {
            const cleanAnswer = String(answer == null ? "" : answer).replace(/<[^>]*>/g, "").trim();
            if (!cleanAnswer) continue;
            if (question.type === "3") {
              const isTrueAnswer = REGEX.JUDGE_TRUE.test(cleanAnswer);
              const isFalseAnswer = REGEX.JUDGE_FALSE.test(cleanAnswer);
              if (!isTrueAnswer && !isFalseAnswer) continue;
              for (const opt of optionList) {
                const isTrueOption = REGEX.JUDGE_TRUE.test(opt.text || "");
                const isFalseOption = REGEX.JUDGE_FALSE.test(opt.text || "");
                if ((isTrueAnswer && isTrueOption) || (isFalseAnswer && isFalseOption)) {
                  if (opt.el && !targetEls.includes(opt.el)) targetEls.push(opt.el);
                  break;
                }
              }
            } else {
              const idx = matchOptionIndex(optionList, cleanAnswer);
              if (idx >= 0) {
                const el = optionList[idx] && optionList[idx].el;
                if (el && !targetEls.includes(el)) targetEls.push(el);
              }
            }
          }
          for (const el of targetEls) {
            clickOption(el);
            await randomDelay(0.1, 0.15);
          }
        }
        
        const sourceHint = answerData.data.source === "ai" ? "(AI生成)" : "";
        const msgLines = (answerData.msg || '').split('\n');
        const firstLine = msgLines.shift();
        const msgHint = firstLine ? ` - ${firstLine}` : "";
        logStore.addLog(`第${index + 1}道题查询成功${sourceHint}${msgHint}`, "success");
        for (const line of msgLines) {
          if (line.trim()) logStore.addLog(line, "primary");
        }
        if (answerData.data.cost !== undefined) {
          logStore.addLog(`本题消耗${answerData.data.cost}次，剩余${answerData.data.num}次`, "primary");
        }
      } else {
        
        if (answerData.code === 403 && answerData.data && answerData.data.limitedMode) {
          logStore.addLog(`第${index + 1}道题搜索失败: ${answerData.msg}`, "danger");
          if (answerData.data.sponsorUrl) {
            logStore.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
          }
          question.answer[0] = answerData.msg;
        } else if (answerData.code === 429 && answerData.data && answerData.data.limitedMode) {
          logStore.addLog(`第${index + 1}道题搜索失败: 今日免费查题已达上限`, "danger");
          logStore.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
          question.answer[0] = answerData.msg;
        } else if (answerData.code === 403 && answerData.data && answerData.data.sponsorUrl) {
          triggerWelfarePromo();
          const sponsorUrl = answerData.data.sponsorUrl;
          const sponsorLink = `<a href="${sponsorUrl}" target="_blank" style="color:#667eea;text-decoration:underline;">点我赞助获取新token</a>`;
          const msgHtml = answerData.msg.includes('[可切换赞助获取token，不限制账户]')
            ? answerData.msg.replace('[可切换赞助获取token，不限制账户]',
              `[<a href="${sponsorUrl}" target="_blank" style="color:#667eea;text-decoration:underline;">可切换赞助获取token，不限制账户</a>]`)
            : `${answerData.msg}，${sponsorLink}`;
          logStore.addLog(`第${index + 1}道题搜索失败: ${msgHtml}`, "danger");
          question.answer[0] = (answerData.data.answer && answerData.data.answer[0]) || answerData.msg;
        } else {
          logStore.addLog(`第${index + 1}道题搜索失败: ${answerData.msg}`, "danger");
          if (answerData.data?.sponsorUrl) {
            logStore.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
          }
          question.answer[0] = answerData.msg;
        }
      }
      questionStore.addQuestion(question);
      await (simulateDelay ? randomDelay(Number(answerInterval), 0.5) : delay(Number(answerInterval)));
    }
    
    if (skippedCount > 0) {
      logStore.addLog(`共跳过${skippedCount}道已答题目`, "primary");
    }
    logStore.addLog("随堂练习答题完成", "success");
    const autoSubmit = readCxParamValue("章节/作业/测验设置", "自动提交", false);
    if (autoSubmit) {
      logStore.addLog("自动提交已开启，3秒后提交...", "warning");
      await delay(3);
      const submitBtn = document.querySelector(".submit-btn");
      if (submitBtn) {
        clickOption(submitBtn);
        logStore.addLog("已点击提交", "success");
        
        
        await delay(3);
        await detectAndReportResults(document);
      } else {
        logStore.addLog("未找到提交按钮，请手动提交", "danger");
      }
    } else {
      logStore.addLog("未开启自动提交，请手动提交", "info");
    }
  };
  
  
  
  
  const useCxWorkLogic = async () => {
    const logStore = useLogStore();
    useConfigStore();
    logStore.addLog(`进入新版作业页面，开始准备答题`, "primary");
    logStore.addLog(`正在解析题目, 请等待5s`, "warning");
    await new CxQuestionHandler("zy").init();
  };
  
  
  
  const answerExamPreview = async () => {
    const logStore = useLogStore();
    logStore.addLog(`进入考试整卷预览页面，开始准备答题`, "primary");
    logStore.addLog(`正在解析题目, 请等待5s`, "warning");
    await new CxQuestionHandler("ks").init();
    logStore.addLog("答题完成，请自行检查后保存或提交", "primary");
  };
  
  
  
  
  
  
  
  
  const useCxExamLogic = async () => {
    const logStore = useLogStore();
    const configStore = useConfigStore();

    
    const inSequentialMode = _GM_getValue('pp_exam_sequential', false);

    if (!inSequentialMode) {
      
      logStore.addLog(`进入新版考试页面，开始准备答题`, "primary");

      
      const markInfo = _unsafeWindow.document.querySelector('.mark_info');
      const disallowPreview = markInfo?.textContent?.includes('不允许整卷预览');

      if (!disallowPreview) {
        
        logStore.addLog(`允许整卷预览，即将跳转到整卷预览页面`, "primary");
        await delay(3);
        _unsafeWindow.topreview();
        
        
        await delay(5);
        await answerExamPreview();
        return;
      }

      
      logStore.addLog(`当前考试不允许整卷预览，进入逐题答题模式`, "warning");
      logStore.addLog(`在考完前禁止手动切换题目，否则会导致重复答题！`, "warning");
      _GM_setValue('pp_exam_sequential', true);
    }

    
    
    const autoSwitch = readCxParamValue("考试设置", "自动切换", true);

    logStore.addLog(`正在解析题目, 请等待5s`, "warning");
    await new CxQuestionHandler("ks").init();

    const currentQuestionNum = parseInt(_unsafeWindow.document.querySelector(".topicNumber_list .current")?.innerText || "0");
    const totalQuestions = _unsafeWindow.document.querySelectorAll(".topicNumber_list li").length;

    if (currentQuestionNum >= totalQuestions) {
      logStore.addLog("当前已是最后一题，答题完成", "warning");
      logStore.addLog("请手动检查答案后提交试卷", "primary");
      _GM_setValue('pp_exam_sequential', false);
      return;
    }

    if (!autoSwitch) {
      logStore.addLog("已经关闭自动切换，在设置里可更改", "danger");
      _GM_setValue('pp_exam_sequential', false);
      return;
    }

    logStore.addLog(`第${currentQuestionNum}题已完成，正在前往下一题`, "success");
    await delay(3);

    
    const nextBtn = _unsafeWindow.document.querySelector('.nextDiv a.jb_btn');
    if (nextBtn) {
      nextBtn.click();
    } else if (typeof _unsafeWindow.getTheNextQuestion === 'function') {
      _unsafeWindow.getTheNextQuestion(1);
    } else {
      logStore.addLog("未找到下一题按钮，请手动切换", "danger");
      _GM_setValue('pp_exam_sequential', false);
    }
  };
  
  
  
  
  const useCxExamPreviewLogic = answerExamPreview;
  
  
  
  
  const useCxPlazaTipLogic = () => {
    const logStore = useLogStore();
    logStore.addLog("检测到积分课页面", "warning");
    logStore.addLog("积分课请进入课程后，开启复习模式，并关闭自动切换", "warning");
    logStore.addLog("课程完成后请手动切换章节，自动跳转可能出现乱跳", "warning");
  };
  
  
  
  
  
  const useCxAutoReadLogic = async () => {
    const logStore = useLogStore();
    const configStore = useConfigStore();
    const currentUrl = window.location.href;

    
    if (!currentUrl.includes('/ztnodedetailcontroller/visitnodedetail')) {
      logStore.addLog(`进入课程目录，即将点击第一个章节开始阅读`, "primary");
      await delay(2);
      const firstChapter = document.querySelector('.course_section .chapterText');
      if (firstChapter) {
        firstChapter.click();
      } else {
        logStore.addLog("未找到章节列表，请手动点击章节", "danger");
      }
      return;
    }

    
    logStore.addLog(`进入阅读页面，开始自动滚动阅读`, "primary");
    logStore.addLog(`阅读任务次日才会统计阅读时长`, "warning");

    
    const scrollDuration = 63;
    const step = (document.documentElement.scrollHeight - window.innerHeight) / 60;
    let currentTop = 0;
    let scrollCount = 0;

    logStore.addLog(`预计${scrollDuration}秒后完成当前章节阅读`, "primary");

    await new Promise((resolve) => {
      const interval = setInterval(() => {
        scrollCount++;
        currentTop += step;
        window.scrollTo({ behavior: 'smooth', top: currentTop });
        if (scrollCount >= 60) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });

    
    await delay(1);
    const nextChapter = document.querySelector('.nodeItem.r i');
    if (nextChapter) {
      logStore.addLog(`当前章节阅读完成，正在进入下一章`, "success");
      await delay(2);
      nextChapter.click();
    } else {
      
      const restartAfterFinish = readCxParamValue("章节/作业/测验设置", "无限阅读", false);
      if (restartAfterFinish) {
        logStore.addLog(`已是最后一章，即将从头重新阅读`, "primary");
        await delay(3);
        const firstChapter = document.querySelectorAll('.course_section .chapterText');
        if (firstChapter.length) firstChapter[0].click();
      } else {
        logStore.addLog(`阅读任务已全部完成`, "success");
      }
    }
  };
  
  
  
  
  class ZhsQuestionHandler extends QuestionProcessor {
    constructor() {
      super();
      
      __publicField(this, "isZhsQuestionAnswered", (question) => {
        
        
        const reverseTypeMapping = {
          "0": "单选题",
          "1": "多选题",
          "2": "填空题", 
          "3": "判断题",
          "4": "简答题",
          "5": "名词解释",
          "6": "论述题",
          "7": "计算题"
        };
        
        const questionTypeText = reverseTypeMapping[question.type] || question.type;
        
        
        if (questionTypeText === "单选题" || questionTypeText === "多选题") {
          for (const key in question.options) {
            const optionElement = question.options[key];
            
            
            if (optionElement.classList.contains("cur") ||
                optionElement.classList.contains("selected") ||
                optionElement.querySelector(".onChecked") ||
                optionElement.querySelector(".cur") ||
                optionElement.querySelector(".selected")) {
              return true;
            }
          }
          return false;
        }
        
        if (questionTypeText === "判断题") {
          for (const key in question.options) {
            const optionElement = question.options[key];
            
            if (optionElement.classList.contains("cur") ||
                optionElement.classList.contains("selected") ||
                optionElement.querySelector(".onChecked")) {
              return true;
            }
          }
          return false;
        }
        return false;
      });
      __publicField(this, "init", async () => {
        var _a;
        this.questions = [];
        this.parseHtml();
        if (this.questions.length) {
          this.addLog(`成功解析到${this.questions.length}个题目`, "primary");
          const configStore = useConfigStore();
          
          const _answerParamsPart2 = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === "答题参数");
          const skipAnswered = _answerParamsPart2?.params.find(p => p.name === "跳过已答")?.value || false;
          let skippedCount = 0;
          for (const [index, question] of this.questions.entries()) {
            
            if (skipAnswered && this.isZhsQuestionAnswered(question)) {
              this.addLog(`第${index + 1}道题已作答，跳过`, "warning");
              skippedCount += 1;
              this.addQuestion(question);
              
              await ((_a = this._document) == null ? void 0 : _a.querySelectorAll(".switch-btn-box > button")[1]).click();
              
              await new Promise(r => setTimeout(r, 1500));
              continue;
            }
            this.addLog(`正在查找第${index + 1}道题目答案...`, "primary");
            const answerData = await queryAnswer(question);
            if (answerData.code === 200) {
              question.answer = answerData.data.answer;
              question.source = answerData.data.source;  
              
              
              this.addQuestion(question);
              
              await new Promise(r => setTimeout(r, 100));
              
              
              await this.fillQuestion(question);
              
              const sourceHint = answerData.data.source === "ai" ? "(AI生成)" : "";
              const msgLines = (answerData.msg || '').split('\n');
              const firstLine = msgLines.shift();
              const msgHint = firstLine ? ` - ${firstLine}` : "";
              this.addLog(`第${index + 1}道题查询成功${sourceHint}${msgHint}`, "success");
              for (const line of msgLines) {
                if (line.trim()) this.addLog(line, "primary");
              }
              if (answerData.data.cost !== undefined) {
                this.addLog(`本题消耗${answerData.data.cost}次，剩余${answerData.data.num}次`, "primary");
              }
            } else {
              this.addLog(`第${index + 1}道题搜索失败：${answerData.msg}`, "danger");
              if (answerData.data?.sponsorUrl) {
                this.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
              }
              question.answer[0] = answerData.msg;
              this.addQuestion(question);
              await new Promise(r => setTimeout(r, 100));
            }
            
            await ((_a = this._document) == null ? void 0 : _a.querySelectorAll(".switch-btn-box > button")[1]).click();
            
            await new Promise(r => setTimeout(r, 1500));
          }
          if (skippedCount > 0) {
            this.addLog(`共跳过${skippedCount}道已答题目`, "primary");
          }
        } else
          this.addLog("未解析到题目，请刷新重试或进入答题页面", "danger");
      });
      __publicField(this, "parseHtml", () => {
        if (!this._document)
          return [];
        const questionElements = this._document.querySelectorAll(SELECTORS.ZHS_QUESTION);
        this.addQuestions(questionElements);
      });
      __publicField(this, "fillQuestion", async (question) => {
        if (!this._window)
          return;
        
        try {
          
          const typeNum = question.type;
          
          if (typeNum === "0" || typeNum === "1") {
            const configStore = useConfigStore();
            const useSimilarity = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === "答题参数")?.params.find(p => p.name === "相似匹配")?.value || false;
            
            
            let hasDeselected = false;
            for (const key in question.options) {
              const optionElement = question.options[key];
              if (this.isZhsOptionSelected(optionElement)) {
                hasDeselected = true;
                optionElement.click();
              }
            }
            
            
            if (hasDeselected) {
              await new Promise(r => setTimeout(r, 500));
            }
            
            
            
            
            
            
            let answers = question.answer;
            if (typeof question.answer === 'string') {
              
              if (question.answer.startsWith('[')) {
                try {
                  answers = JSON.parse(question.answer);
                } catch (e) {
                  answers = question.answer.split(/[,，]/).map(a => a.trim()).filter(a => a);
                }
              } else {
                answers = question.answer.split(/[,，]/).map(a => a.trim()).filter(a => a);
              }
            }
            
            const optionList = getOptionList(question);
            const targetEls = [];
            for (const answer of answers) {
              const cleanAnswer = this.stripTags(answer).trim();
              if (!cleanAnswer) continue;
              const idx = matchOptionIndex(optionList, cleanAnswer);
              if (idx < 0) continue;
              const el = optionList[idx] && optionList[idx].el;
              if (el && !targetEls.includes(el)) targetEls.push(el);
            }

            for (const optionElement of targetEls) {
              if (this.isZhsOptionSelected(optionElement)) continue;
              optionElement.setAttribute("data-filling", "true");
              optionElement.click();
              await new Promise(r => setTimeout(r, 200));
              optionElement.removeAttribute("data-filling");
            }
          } else if (typeNum === "3") {
            
            let answer = null;
            if (REGEX.JUDGE_FALSE.test(question.answer[0])) {
              answer = "错";
            } else if (REGEX.JUDGE_TRUE.test(question.answer[0])) {
              answer = "对";
            }
            if (answer === null) {
              return;
            }
            for (const key in question.options) {
              const optionElement = question.options[key];
              
              
              const isTrueOption = REGEX.JUDGE_TRUE.test(key);  
              const isFalseOption = REGEX.JUDGE_FALSE.test(key); 
              
              if ((isTrueOption && answer === "对") || (isFalseOption && answer === "错")) {
                optionElement.setAttribute("data-filling", "true");
                optionElement.click();
                setTimeout(() => optionElement.removeAttribute("data-filling"), 200);
                break;
              }
            }
          } else if (typeNum === "2") {
            
            const textareaElements = question.element.querySelectorAll("textarea");
            if (textareaElements.length > 0 && question.answer && question.answer.length > 0) {
              
              textareaElements.forEach((textarea, index) => {
                if (index < question.answer.length) {
                  const answerText = this.stripTags(question.answer[index] || question.answer[0]);
                  textarea.value = answerText;
                  textarea.dispatchEvent(new Event("input", { bubbles: true }));
                }
              });
            }
          } else if (["4", "5", "6", "7"].includes(typeNum)) {
            
            const textareaElement = question.element.querySelector("textarea");
            if (textareaElement && question.answer && question.answer.length > 0) {
              const answerText = question.answer.map(a => this.stripTags(a)).join("\n");
              textareaElement.value = answerText;
              textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
            }
          } else {
          }
        } catch (error) {
          this.addLog(`答题过程发生错误：${error.message}`, "danger");
        }
      });
    }
    isZhsOptionSelected(optionElement) {
      return optionElement.classList.contains("cur") ||
             optionElement.classList.contains("selected") ||
             !!optionElement.querySelector(".onChecked") ||
             !!optionElement.querySelector(".cur") ||
             !!optionElement.querySelector(".selected");
    }
    extractOptions(optionElements, optionSelector) {
      const optionsObject = {};
      const optionTexts = [];
      const optionsList = [];
      optionElements.forEach((optionElement) => {
        var _a;
        const inner = optionElement.querySelector(optionSelector) || optionElement;
        const optionTextContent = this.stripTags(this.htmlWithAbsoluteImages(inner));
        if (!optionTextContent) return;
        optionsList.push({ text: optionTextContent, el: optionElement });
        let key = optionTextContent;
        let suffix = 2;
        while (Object.prototype.hasOwnProperty.call(optionsObject, key)) {
          key = optionTextContent + "#" + suffix;
          suffix += 1;
        }
        optionsObject[key] = optionElement;
        optionTexts.push(optionTextContent);  
      });
      return [optionsObject, optionTexts, optionsList];
    }
    addQuestions(questionElements) {
      questionElements.forEach((questionElement) => {
        var _a, _b;
        const questionTitle = (questionElement == null ? void 0 : questionElement.querySelector(".subject_describe div,.smallStem_describe p")).__Ivue__._data.shadowDom.textContent;
        const questionTypeText = ((_b = (_a = questionElement == null ? void 0 : questionElement.querySelector(".subject_type span")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.slice(1, 4)) || "";
        
        
        const zhsTypeMapping = {
          "单选": "单选题",
          "多选": "多选题", 
          "填空": "填空题",
          "判断": "判断题",
          "简答": "简答题",
          "名词": "名词解释",
          "论述": "论述题",
          "计算": "计算题"
        };
        
        
        const fullQuestionType = zhsTypeMapping[questionTypeText] || questionTypeText;
        
        
        const numericType = this.typeMap.get(fullQuestionType) || "999";
        
        const [optionsObject, optionTexts] = this.extractOptions(questionElement == null ? void 0 : questionElement.querySelectorAll(SELECTORS.ZHS_OPTION), ".node_detail");
        this.questions.push({
          element: questionElement,
          type: numericType,  
          title: questionTitle,
          optionsText: optionTexts,
          options: optionsObject,
          answer: [],
          workType: "zhs",
          refer: this._window.location.href
        });
      });
    }
  }
  
  
  
  
  const hookError = () => {
    const oldset = _unsafeWindow.setInterval;
    const oldout = _unsafeWindow.setTimeout;
    _unsafeWindow.setInterval = function(...args) {
      const err = new Error();
      if (err.stack && err.stack.indexOf("checkoutNotTrustScript") !== -1) {
        return -1;
      }
      return oldset.call(this, ...args);
    };
    _unsafeWindow.setTimeout = function(...args) {
      const err = new Error();
      if (err.stack && err.stack.indexOf("checkoutNotTrustScript") !== -1) {
        return -1;
      }
      return oldout.call(this, ...args);
    };
  };
  
  
  
  
  
  class XMLHttpRequestInterceptor {
    constructor(urlList, callback) {
      __publicField(this, "xhr");
      __publicField(this, "originalOpen");
      __publicField(this, "originalSend");
      __publicField(this, "callback");
      this.xhr = new XMLHttpRequest();
      this.originalOpen = this.xhr.open;
      this.originalSend = this.xhr.send;
      this.callback = callback;
      this.intercept(urlList);
    }
    intercept(urlList) {
      const self = this;
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url2) {
        originalOpen.apply(this, [method, url2]);
        const shouldIntercept = urlList.some((urlItem) => url2.includes(urlItem));
        if (shouldIntercept) {
          this.addEventListener('load', function() {
            self.callback(this.responseText);
          });
        }
      };
    }
  }
  
  
  
  
  const useZhsAnswerLogic = async () => {
    hookError();
    const logStore = useLogStore();
    useConfigStore();
    logStore.addLog(`进入答题页面，开始准备答题`, "primary");
    logStore.addLog(`正在解析题目, 请等待5s`, "warning");
    new XMLHttpRequestInterceptor(["gateway/t/v1/answer/hasAnswer"], async () => {
      await delay(1);
      _unsafeWindow.document.getSelection = function() {
        return {
          removeAllRanges: function() {
          }
        };
      };
      _unsafeWindow.document.onselectstart = true;
      _unsafeWindow.document.oncontextmenu = true;
      _unsafeWindow.document.oncut = true;
      _unsafeWindow.document.oncopy = true;
      _unsafeWindow.document.onpaste = true;
      await new ZhsQuestionHandler().init();
      return true;
    });
  };

  

  

  const _sfc_main$3 =  vue.defineComponent({
    __name: "Index",
    emits: ["customEvent"],
    setup(__props, { emit: __emit }) {
      var _a;
      const cardWidth = vue.ref("100%");
      const isShow = vue.ref(false);
      (_a = document.querySelector("li>a.experience:not([onclick])")) == null ? void 0 : _a.click();
      const configStore = useConfigStore();
      const logStore = useLogStore();
      const questionStore = useQuestionStore();
      const url2 = window.location.href;
      logStore.addLog("用户悉知：使用脚本即为完全同意用户协议", "success");
      logStore.addLog("脚本加载成功，正在解析网页", "primary");
      logStore.addLog("请不要多个脚本同时使用，会有脚本冲突问题", "warning");
      logStore.addLog("如果脚本出现异常，请用谷歌浏览器", "warning");
      
      
      
      
      const urlLogicPairs = [
        { keyword: "/mycourse/studentstudy", logic: useCxChapterLogic },   
        { keyword: "/mooc2/work/dowork", logic: useCxWorkLogic },          
        { keyword: "exam/preview", logic: useCxExamPreviewLogic },         
        { keyword: "/exam-ans/", logic: useCxExamLogic },                  
        { keyword: "/exam/test", logic: useCxExamLogic },                  
        { keyword: "/work/index", logic: useCxWorkLogic },                 
        { keyword: "/work/doTest", logic: useCxWorkLogic },                
        { keyword: "/work/calcAnswer", logic: useCxWorkLogic },            
        { keyword: "/knowledge/start", logic: useCxChapterLogic },         
        { keyword: "/ztnodedetailcontroller/visitnodedetail", logic: useCxAutoReadLogic }, 
        { keyword: "/course/", logic: useCxAutoReadLogic },                
        { keyword: "/plaza", logic: useCxPlazaTipLogic },                  
        {
          keyword: "mycourse/stu?courseid",
          logic: () => {
            logStore.addLog("该页面无任务，请进入章节或答题页面使用", "danger");
          }
        },
        { keyword: "/stuExamWeb.html", logic: useZhsAnswerLogic },         
        { keyword: "answerQuestion2", logic: useStuActiveLogic }          
      ];
      const executeLogicByUrl = (url22) => {
        
        if (url22.includes('out_link.shtml')) {
          try {
            const burl = new URL(url22).searchParams.get('burl');
            if (burl) {
              window.location.replace(burl);
              return;
            }
          } catch (e) {}
          isShow.value = false;
          return;
        }
        for (const { keyword, logic } of urlLogicPairs) {
          if (url22.includes(keyword)) {
            isShow.value = true;
            const _ppRunLogic = () => {
              logic();
            };
            if (document.readyState === "complete") {
              _ppRunLogic();
            } else {
              logStore.addLog("⏳ 正在加载脚本功能...", "primary");
              const _ppWaitComplete = setInterval(() => {
                if (document.readyState !== "complete") return;
                clearInterval(_ppWaitComplete);
                logStore.addLog("✅ 加载完成", "success");
                _ppRunLogic();
              }, 100);
            }
            return;
          }
        }
        
        if (!url22.includes('/exam-ans/')) {
          _GM_setValue('pp_exam_sequential', false);
        }
        isShow.value = false;
      };
      executeLogicByUrl(url2);
      const emit = __emit;
      emit("customEvent", isShow.value);
      const tabs = [
        {
          label: "主页信息",
          id: "main-log",
          component: ScriptHome,
          props: { "log-list": logStore.logList, "server-config": CURRENT_SERVER_CONFIG }
        },
        {
          label: "答题记录",
          id: "question-record",
          component: QuestionTable,
          props: { "question-list": questionStore.questionList }
        },
        {
          label: "脚本配置",
          id: "config-panel",
          component: ScriptSetting,
          props: { "global-config": configStore }
        },
        {
          label: "脚本说明",
          id: "script-description",
          component: ScriptDescription
        },
        {
          label: "作者的话",
          id: "author-words",
          component: AuthorWords
        },
        ...(configStore.platformName === "zhs" ? [] : [{
          label: "推广奖励",
          id: "referral-panel",
          component: ReferralPanel
        }]),
        {
          label: "使用查询",
          id: "token-usage",
          component: TokenUsagePanel
        }
      ];
      const activeTab = vue.ref("main-log");
      const switchTab = (tabId) => {
        activeTab.value = tabId;
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", {
          style: vue.normalizeStyle({ width: cardWidth.value }),
          class: "card_content"
        }, [
          vue.createElementVNode("div", {
            class: "config-tabs-container"
          }, [
            (vue.openBlock(), vue.createElementBlock(vue.Fragment, null, vue.renderList(tabs, (tab) => {
              const isUnverified = tab.id === "config-panel" && !configStore.tokenVerified;
              const isActive = activeTab.value === tab.id;
              return vue.createElementVNode("button", {
                key: tab.id,
                class: vue.normalizeClass(["config-tab", { active: isActive }]),
                style: isUnverified && !isActive ? {
                  "background": "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                  "border-color": "#dc3545",
                  "color": "#fff"
                } : {},
                onClick: () => switchTab(tab.id)
              }, vue.toDisplayString(tab.label), 13, ["onClick", "class", "style"]);
            }), 64))
          ]),
          (vue.openBlock(), vue.createElementBlock(vue.Fragment, null, vue.renderList(tabs, (tab) => {
            return vue.withDirectives(vue.createElementVNode("div", {
              key: tab.id,
              class: "config-panel"
            }, [
              tab.component ? (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(tab.component), vue.mergeProps({
                key: 0,
                ref_for: true
              }, tab.props), null, 16)) : vue.createCommentVNode("", true)
            ], 512), [
              [vue.vShow, activeTab.value === tab.id]
            ]);
          }), 128))
        ], 4);
      };
    }
  });
  const _sfc_main$2 =  vue.defineComponent({
    __name: "ZoomButtons",
    emits: ["toggleZoom"],
    setup(__props, { emit: __emit }) {
      const emit = __emit;
      const configStore = useConfigStore();
      const toggleZoom = () => {
        const newValue = !configStore.isMinus;
        emit("toggleZoom", newValue);
      };
      return (_ctx, _cache) => {
        const _component_el_icon = vue.resolveComponent("el-icon");
        return vue.openBlock(), vue.createElementBlock("div", {
          onMousedown: _cache[1] || (_cache[1] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createVNode(_component_el_icon, {
            onClick: _cache[0] || (_cache[0] = () => toggleZoom()),
            size: "small",
            style: { "cursor": "pointer" }
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(vue.unref(configStore.isMinus ? full_screen_default : minus_default))
            ]),
            _: 1
          })
        ], 32);
      };
    }
  });
  const _hoisted_1 = { class: "overlay" };
  const _hoisted_2 = { class: "title" };
  const _hoisted_3 = { class: "minus" };
  const _sfc_main$1 =  vue.defineComponent({
    __name: "layout",
    setup(__props) {
      const isShow = vue.ref(false);
      const configStore = useConfigStore();
      const { autoMode } = pinia.storeToRefs(configStore);
      let saveTimer = null;
      const saveConfig = () => {
        if (saveTimer) {
          clearTimeout(saveTimer);
        }
        saveTimer = setTimeout(() => {
          _GM_setValue("config", JSON.stringify(configStore));
          saveTimer = null;
        }, 300);
      };
      const saveConfigImmediate = () => {
        if (saveTimer) {
          clearTimeout(saveTimer);
          saveTimer = null;
        }
        _GM_setValue("config", JSON.stringify(configStore));
      };
      vue.watch(configStore, () => {
        saveConfig();
      }, { deep: true });

      
      const showAutoMinLabel = vue.computed(() => !configStore.isMinus);
      const labelKey = vue.computed(() => configStore.isMinus ? "min" : "max");
      
      const isDragging = vue.ref(false);
      const offsetX = vue.ref(0);
      const offsetY = vue.ref(0);
      let dragElement = null;
      
      const MIN_TOP = 60;
      const ensureMinTop = (val) => {
        const num = parseInt(val);
        return (isNaN(num) || num < MIN_TOP) ? `${MIN_TOP}px` : val;
      };
      const moveStyle = vue.computed(() => {
        return {
          left: configStore.position.x,
          top: ensureMinTop(configStore.position.y),
          height: configStore.isMinus ? "auto" : "560px",
          maxHeight: configStore.isMinus ? "none" : "560px",
          width: configStore.isMinus ? "280px" : "720px",
          maxWidth: configStore.isMinus ? "280px" : "720px"
        };
      });
      const startDrag = (event) => {
        isDragging.value = true;
        dragElement = event.currentTarget.closest('.main-page');
        offsetX.value = event.clientX - event.currentTarget.getBoundingClientRect().left;
        offsetY.value = event.clientY - event.currentTarget.getBoundingClientRect().top;
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", endDrag);
      };
      const drag = (event) => {
        if (!isDragging.value || !dragElement) return;
        const x = event.clientX - offsetX.value;
        const y = event.clientY - offsetY.value;
        const dragW = configStore.isMinus ? 280 : 720;
        const dragH = configStore.isMinus ? 0 : 560;
        let newX = x - 11;
        let newY = y - 11;
        if (x < 0) newX = 0;
        if (y < MIN_TOP) newY = MIN_TOP;
        if (x > window.innerWidth - dragW) newX = window.innerWidth - dragW;
        if (y > window.innerHeight - dragH) newY = window.innerHeight - dragH;
        
        dragElement.style.left = `${newX}px`;
        dragElement.style.top = `${newY}px`;
        
        configStore.position.x = `${newX}px`;
        configStore.position.y = `${newY}px`;
      };
      const endDrag = () => {
        isDragging.value = false;
        dragElement = null;
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", endDrag);
        saveConfigImmediate();
      };
      
      const startDragTouch = (event) => {
        if (event.touches.length === 1) {
          isDragging.value = true;
          const touch = event.touches[0];
          offsetX.value = touch.clientX - event.currentTarget.getBoundingClientRect().left;
          offsetY.value = touch.clientY - event.currentTarget.getBoundingClientRect().top;
          document.addEventListener("touchmove", dragTouch, { passive: false });
          document.addEventListener("touchend", endDragTouch);
        }
      };
      const dragTouch = (event) => {
        if (!isDragging.value || event.touches.length !== 1 || !dragElement)
          return;
        event.preventDefault(); 
        const touch = event.touches[0];
        const x = touch.clientX - offsetX.value;
        const y = touch.clientY - offsetY.value;
        const dragW = configStore.isMinus ? 280 : 720;
        const dragH = configStore.isMinus ? 0 : 560;
        let newX = x - 11;
        let newY = y - 11;
        if (x < 0) newX = 0;
        if (y < MIN_TOP) newY = MIN_TOP;
        if (x > window.innerWidth - dragW) newX = window.innerWidth - dragW;
        if (y > window.innerHeight - dragH) newY = window.innerHeight - dragH;
        
        dragElement.style.left = `${newX}px`;
        dragElement.style.top = `${newY}px`;
        
        configStore.position.x = `${newX}px`;
        configStore.position.y = `${newY}px`;
      };
      const endDragTouch = () => {
        isDragging.value = false;
        dragElement = null;
        document.removeEventListener("touchmove", dragTouch);
        document.removeEventListener("touchend", endDragTouch);
        saveConfigImmediate();
      };
      
      
      let minimizeTimer = null;
      
      const getMainPage = () => {
        const host = document.getElementById('chaoxing-helper-root');
        const root = host && host.shadowRoot ? host.shadowRoot : document;
        return root.querySelector('.main-page');
      };
      
      const forceRepaint = () => {
        vue.nextTick(() => {
          const parent = getMainPage();
          if (parent) {
            
            
            const card = parent.querySelector('.el-card');
            if (card) {
              card.style.transform = 'translateZ(0)';
              void card.offsetHeight;
              card.style.transform = '';
            } else {
              void parent.offsetHeight;
            }
          }
        });
      };
      
      const clampPosition = () => {
        setTimeout(() => {
          const mainPage = getMainPage();
          if (!mainPage) return;
          const rect = mainPage.getBoundingClientRect();
          let x = parseFloat(configStore.position.x) || 0;
          let y = parseFloat(configStore.position.y) || 0;
          const maxX = Math.max(0, window.innerWidth - rect.width);
          const maxY = Math.max(0, window.innerHeight - rect.height);
          x = Math.max(0, Math.min(x, maxX));
          y = Math.max(0, Math.min(y, maxY));
          configStore.position.x = `${x}px`;
          configStore.position.y = `${y}px`;
        }, 500);
      };
      
      const handleMouseEnter = () => {
        
        if (minimizeTimer) {
          clearTimeout(minimizeTimer);
          minimizeTimer = null;
        }
        if (configStore.autoMode && configStore.isMinus) {
          configStore.isMinus = false;
          forceRepaint();
          clampPosition();
        }
      };
      
      const handleMouseLeave = () => {
        if (configStore.autoMode && !configStore.isMinus) {
          
          minimizeTimer = setTimeout(() => {
            configStore.isMinus = true;
            minimizeTimer = null;
            forceRepaint();
            clampPosition();
          }, 3000);
        }
      };

      return (_ctx, _cache) => {
        const _component_el_tooltip = vue.resolveComponent("el-tooltip");
        const _component_el_tag = vue.resolveComponent("el-tag");
        const _component_el_text = vue.resolveComponent("el-text");
        const _component_el_divider = vue.resolveComponent("el-divider");
        const _component_el_card = vue.resolveComponent("el-card");
        const _component_el_switch = vue.resolveComponent("el-switch");
        return vue.withDirectives((vue.openBlock(), vue.createElementBlock("div", {
          style: vue.normalizeStyle(moveStyle.value),
          class: "main-page",
          onMouseenter: handleMouseEnter,
          onMouseleave: handleMouseLeave
        }, [
          vue.withDirectives(vue.createElementVNode("div", _hoisted_1, null, 512), [
            [vue.vShow, isDragging.value]
          ]),
          vue.createVNode(_component_el_card, {
            style: { "border": "0" },
            "close-on-click-modal": false,
            "lock-scroll": false,
            modal: false,
            "show-close": false,
            "modal-class": "modal"
          }, {
            header: vue.withCtx(() => [
              vue.createElementVNode("div", {
                class: "card-header",
                key: vue.unref(configStore).isMinus ? "header-min" : "header-max",
                onMousedown: startDrag,
                onTouchstart: startDragTouch
              }, [
                vue.createElementVNode("div", _hoisted_2, [
                  vue.createElementVNode("span", null, vue.toDisplayString(vue.unref(configStore).isMinus 
                    ? `网课助手 v${vue.unref(configStore).version}` 
                    : vue.unref(configStore).platformParams?.[vue.unref(configStore).platformName]?.name || `网课小助手-飘飘友情提供 v${vue.unref(configStore).version}`), 1),
                  vue.createVNode(_component_el_tooltip, {
                    teleported: "",
                    effect: "dark",
                    placement: "top-start",
                    content: "<span>注意事项：<br/>请尽量使用新版，不要使用旧版。<br/></span>",
                    "raw-content": ""
                  }),
                  vue.createVNode(_component_el_tag, {
                    size: "small",
                    type: vue.unref(configStore).platformName === "cx" ? "primary" : "success",
                    style: { "margin-left": "10px" }
                  }, {
                    default: vue.withCtx(() => [
                      vue.createTextVNode(vue.toDisplayString(vue.unref(configStore).platformName === "cx" ? "学习通" : vue.unref(configStore).platformName === "zhs" ? "智慧树" : "未知"), 1)
                    ]),
                    _: 1
                  }, 8, ["type"])
                ]),
                vue.createElementVNode("div", { 
                  class: "toggle-switch",
                  style: { 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px"
                  },
                  onMousedown: (e) => { e.stopPropagation(); },
                  onTouchstart: (e) => { e.stopPropagation(); }
                }, [
                  vue.createElementVNode("div", {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }
                  }, [
                    vue.withDirectives(vue.createElementVNode("span", {
                      key: labelKey.value,
                      style: { fontSize: "12px", color: "#374151", fontWeight: "500", whiteSpace: "nowrap" }
                    }, "自动最小化", 8, ["key"]), [
                      [vue.vShow, showAutoMinLabel.value]
                    ]),
                    vue.createVNode(_component_el_switch, {
                      modelValue: autoMode.value,
                      "onUpdate:modelValue": ($event) => { autoMode.value = $event; },
                      size: "small",
                      style: { "--el-switch-on-color": "#0052D9", transition: "all 0.15s ease-out" }
                    }, null, 8, ["modelValue"])
                  ]),
                  vue.createVNode(_sfc_main$2, {
                    onToggleZoom: _cache[0] || (_cache[0] = ($event) => { vue.unref(configStore).isMinus = $event; forceRepaint(); })
                  })
                ])
              ], 32)
            ]),
            default: vue.withCtx(() => [
              vue.withDirectives(vue.createVNode(_sfc_main$3, {
                onCustomEvent: _cache[1] || (_cache[1] = (newValue) => isShow.value = newValue)
              }, null, 512), [
                [vue.vShow, !vue.unref(configStore).isMinus]
              ]),
              vue.withDirectives(vue.createElementVNode("div", _hoisted_3, [
                vue.createVNode(_component_el_text, {
                  type: "info",
                  size: "small"
                }, {
                  default: vue.withCtx(() => _cache[2] || (_cache[2] = [
                    vue.createTextVNode("已最小化，点击上方按钮恢复")
                  ])),
                  _: 1
                }),
                vue.createVNode(_component_el_divider, {
                  "border-style": "dashed",
                  style: { "margin": "0" }
                })
              ], 512), [
                [vue.vShow, vue.unref(configStore).isMinus]
              ])
            ]),
            _: 1
          })
        ], 4)), [
          [vue.vShow, isShow.value]
        ]);
      };
    }
  });
  const _sfc_main =  vue.defineComponent({
    __name: "App",
    setup(__props) {
      const configStore = useConfigStore();
      const url2 = window.location.href;
      if (url2.includes("chaoxing") || url2.includes("xuexitong"))
        configStore.platformName = "cx";  
      else if (url2.includes("zhihuishu"))
        configStore.platformName = "zhs";
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createBlock(_sfc_main$1);
      };
    }
  });
  const layoutCss = LAYOUT_CSS;
  const epCss = _GM_getResourceText("ElementPlusStyle") || "";
  const _PP_STYLE_SHEETS = (() => {
    try {
      if (typeof CSSStyleSheet === "function" && typeof document.adoptedStyleSheets !== "undefined") {
        const epSheet = new CSSStyleSheet();
        epSheet.replaceSync(epCss);
        const layoutSheet = new CSSStyleSheet();
        layoutSheet.replaceSync(layoutCss);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, epSheet];
        return { epSheet, layoutSheet };
      }
    } catch (e) {}
    if (typeof GM_addStyle === "function") {
      GM_addStyle(epCss);
    } else {
      const styleFallback = document.createElement("style");
      styleFallback.textContent = epCss;
      document.head.append(styleFallback);
    }
    return null;
  })();
  const _ppInjectShadowStyles = (shadow) => {
    if (_PP_STYLE_SHEETS) {
      try {
        shadow.adoptedStyleSheets = [_PP_STYLE_SHEETS.epSheet, _PP_STYLE_SHEETS.layoutSheet];
        return;
      } catch (e) {}
    }
    const styleEl = document.createElement("style");
    styleEl.textContent = epCss;
    shadow.appendChild(styleEl);
    const styleEl2 = document.createElement("style");
    styleEl2.textContent = layoutCss;
    shadow.appendChild(styleEl2);
  };
  
  
  
  
  
  const hookWebpack = () => {
    let originCall = _unsafeWindow.Function.prototype.call;
    _unsafeWindow.Function.prototype.call = function(...args) {
      var _a, _b;
      const result = originCall.apply(this, args);
      if (((_b = (_a = args[0]) == null ? void 0 : _a.a) == null ? void 0 : _b.version) === "2.5.0") {
        const install = args[1].exports.a.install;
        args[1].exports.a.install = function(...installArgs) {
          installArgs[0].mixin({
            mounted: function() {
              this.$el["__Ivue__"] = this;
            }
          });
          return install.apply(this, installArgs);
        };
        return result;
      }
      return result;
    };
  };
  const url = _unsafeWindow.location.href;
  
  
  if (window.self === window.top) {
    window.addEventListener('message', (event) => {
      if (event.data?.source === 'chaoxing-helper-iframe' && event.data.action === 'closePanel') {
        const root = document.getElementById('chaoxing-helper-root');
        if (root) root.style.display = 'none';
      }
    });
  }
  
  if (url.includes("zhihuishu.com")) {
    hookWebpack();
    hookError();
  }

  
  
  
  
  
  const timer = setInterval(async () => {
    if (document.readyState !== "loading") {
      clearInterval(timer);
      await preloadBeforeStart();
      
      const app = vue.createApp(_sfc_main);
      const pinia$1 = pinia.createPinia();
      app.use(pinia$1);
      app.use(ElementPlus);
      app.mount(
        (() => {
          const shadow_root = document.createElement("div");
          shadow_root.id = "chaoxing-helper-root";
          const app2 = document.createElement("div");
          document.body.append(shadow_root);
          const shadow = shadow_root.attachShadow({ mode: "open" });
          shadow.appendChild(app2);
          
          _ppInjectShadowStyles(shadow);
          
          return app2;
        })()
      );
      
      
      let _ppLoadingTries = 0;
      const _ppHideLoadingWhenReady = () => {
        const host = document.getElementById('chaoxing-helper-root');
        const panel = host && host.shadowRoot ? host.shadowRoot.querySelector('.main-page') : null;
        if (panel || _ppLoadingTries >= 50) {
          _PP_LOADING_WINDOW.hide();
          return;
        }
        _ppLoadingTries += 1;
        setTimeout(_ppHideLoadingWhenReady, 100);
      };
      _ppHideLoadingWhenReady();
      
      setTimeout(() => {
        checkServerNotice();
      }, 500);

      
      window.addEventListener('beforeunload', () => {
        if (_urlWatcherInterval) {
          clearInterval(_urlWatcherInterval);
          _urlWatcherInterval = null;
        }
        if (window._currentMediaInterval) {
          clearInterval(window._currentMediaInterval);
          window._currentMediaInterval = null;
        }
        if (window._blockPlayInterval && typeof window._blockPlayInterval === 'number') {
          clearInterval(window._blockPlayInterval);
          window._blockPlayInterval = null;
        }
      });
    }
  }, 100);

})(Vue, Pinia, rxjs, md5, ElementPlus);
