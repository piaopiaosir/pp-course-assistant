// ==UserScript==
// @name         |🥇PP网课小助手|飘飘|
// @namespace    飘飘
// @license      MIT
// @version      3.8.4
// @author       PIAOPIAO
// @description  🏆🏆【超星学习通｜知到智慧树｜雨课堂】【永久免费题库】【手机平板支持】【Claude ChatGPT Gemini Deepseek 等7款模型接入】【AI自动答题】 【学习通全题型答题】【挑战全网最全题库】【拥有题库 AI双重校验】。
// @icon         https://tuchuang-1310788589.cos.ap-guangzhou.myqcloud.com/_selftest/icon.webp
// @match        *://*.chaoxing.com/*
// @match        *://*.xuexitong.com/*
// @match        *://*.xueyinonline.com/*
// @match        *://*.edu.cn/*
// @match        *://*.nbdlib.cn/*
// @match        *://*.hnsyu.net/*
// @match        *://*.gdhkmooc.com/*
// @match        *://*.sslibrary.com/*
// @match        *://onlineexamh5new.zhihuishu.com/*
// @match        *://*.zhihuishu.com/*
// @match        *://*.hike-teaching-center.polymas.com/*
// @match        *://*.yuketang.cn/*
// @match        *://*.gdufemooc.cn/*
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
// @tag          ChatGPT|Gemini|Deepseek多模型支持
// @tag          免费题库
// @tag          全题型支持
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

const LAYOUT_CSS = `@keyframes ppFade{from{opacity:0;transform:translateY(-3px);}to{opacity:1;transform:none;}}
@keyframes ppPulse{0%,100%{opacity:1;}50%{opacity:.45;}}
@keyframes ppSpin{to{transform:rotate(360deg);}}
@keyframes ppfxRise{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
@keyframes ppfxPane{from{opacity:0;transform:translateY(var(--ppfx-pane-shift,6px));}to{opacity:1;transform:none;}}
@keyframes ppfxRiseRight{from{opacity:0;transform:translateX(8px);}to{opacity:1;transform:none;}}
@keyframes ppfxPop{from{opacity:0;transform:scale(.94);}to{opacity:1;transform:none;}}
@keyframes ppfxMenuIn{from{opacity:0;transform:translateY(-4px) scale(.98);}to{opacity:1;transform:none;}}
@keyframes ppfxMenuUp{from{opacity:0;transform:translateY(4px) scale(.98);}to{opacity:1;transform:none;}}
@keyframes ppfxOrbIn{from{opacity:0;transform:scale(.72);}to{opacity:1;transform:scale(1);}}
@keyframes ppfxContentIn{from{opacity:0;transform:translateY(4px) scale(.99);}to{opacity:1;transform:none;}}
@keyframes ppfxBreathe{0%,100%{transform:scale(1);}50%{transform:scale(1.055);}}
@keyframes ppfxNudge{0%,100%{transform:translateX(0);}50%{transform:translateX(-2px);}}
@keyframes ppfxRing{0%{opacity:.55;transform:scale(.9);}100%{opacity:0;transform:scale(1.4);}}
@media (prefers-reduced-motion:reduce){
  .main-page,.main-page *,.pp-coach,.pp-coach *{animation-duration:.001ms!important;animation-delay:0ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;}
}

.main-page{
  --pp-brand:#0052d9;--pp-brand-hover:#0047bd;--pp-brand-weak:#eaf1ff;--pp-brand-ring:rgba(0,82,217,.14);
  --pp-text:#1b2433;--pp-text-2:#5d6b82;--pp-text-3:#93a0b4;--pp-text-4:#b3bdcb;
  --pp-line:#e8ecf2;--pp-line-soft:#f1f4f8;--pp-surface:#f7f9fc;--pp-surface-2:#fbfcfe;
  --pp-success:#0f9d58;--pp-success-bg:#f0fbf5;--pp-success-line:#d3f2e1;
  --pp-warning:#b45309;--pp-warning-bg:#fffaeb;--pp-warning-line:#fdecc8;
  --pp-danger:#d92d20;--pp-danger-bg:#fef3f2;--pp-danger-line:#fecdca;
  --ppfx-ease:cubic-bezier(.22,1,.36,1);--ppfx-ease-soft:cubic-bezier(.4,0,.2,1);--ppfx-ease-back:cubic-bezier(.34,1.56,.64,1);
  --ppfx-t-fast:110ms;--ppfx-t-base:180ms;--ppfx-t-slow:260ms;
  z-index:100003;position:fixed;background:#fff;color:var(--pp-text);
  max-width:calc(100vw - 8px);max-height:calc(100vh - 72px);
  border:1px solid rgba(15,23,42,.07);border-radius:16px;
  box-shadow:0 18px 50px -12px rgba(15,23,42,.30),0 2px 6px rgba(15,23,42,.06);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
  font-size:13px;line-height:1.45;display:flex;flex-direction:column;overflow:hidden;
  transition:left var(--ppfx-t-base) var(--ppfx-ease),top var(--ppfx-t-base) var(--ppfx-ease),width var(--ppfx-t-base) var(--ppfx-ease),height var(--ppfx-t-base) var(--ppfx-ease),border-radius var(--ppfx-t-base) var(--ppfx-ease);
  animation:ppFade .2s var(--ppfx-ease) backwards;transform:translateZ(0);
}
.main-page.ppfx-morphing{will-change:left,top,width,height;}
.main-page,.main-page *{box-sizing:border-box;}
.main-page button{font-family:inherit;}
.main-page.pp-dock{border-radius:16px 0 0 16px;max-height:none;}
.main-page.pp-min{border-radius:50%;box-shadow:0 10px 26px -8px rgba(15,23,42,.30),0 1px 3px rgba(15,23,42,.08);}
.main-page.pp-handle-mode{border-radius:12px 0 0 12px;box-shadow:0 6px 18px -6px rgba(15,23,42,.32),0 0 0 1px rgba(15,23,42,.06);}
.main-page.pp-dragging{transition:none;cursor:grabbing!important;user-select:none;}
.main-page.pp-dragging *{cursor:grabbing!important;}

.main-page .pp-head,.main-page .pp-body{transition:opacity var(--ppfx-t-fast) var(--ppfx-ease-soft),transform var(--ppfx-t-fast) var(--ppfx-ease-soft);}
.main-page.ppfx-closing .pp-head,.main-page.ppfx-closing .pp-body{opacity:0;transform:scale(.965);pointer-events:none;transition-duration:90ms;}
.main-page.ppfx-opening .pp-head,.main-page.ppfx-opening .pp-body{animation:ppfxContentIn var(--ppfx-t-base) var(--ppfx-ease) 60ms both;}
.main-page.ppfx-settling .pp-orb,.main-page.ppfx-settling .pp-handle{animation:ppfxOrbIn var(--ppfx-t-base) var(--ppfx-ease-back) 100ms both;}
.main-page.ppfx-settling .pp-orb{position:absolute;left:50%;top:50%;margin:-26px 0 0 -26px;}
.main-page.ppfx-settling .pp-handle{position:absolute;inset:0;}
.main-page.ppfx-undocking{max-height:none!important;}

.main-page ::-webkit-scrollbar{width:6px;height:6px;}
.main-page ::-webkit-scrollbar-track{background:transparent;}
.main-page ::-webkit-scrollbar-thumb{background:#d8dee8;border-radius:99px;}
.main-page ::-webkit-scrollbar-thumb:hover{background:#c3ccd9;}

.pp-head{flex:0 0 54px;height:54px;display:flex;align-items:center;gap:8px;padding:0 8px 0 12px;border-bottom:1px solid var(--pp-line);background:#fff;cursor:grab;touch-action:none;}
.pp-brand{flex:1;min-width:0;display:flex;align-items:center;gap:9px;}
.pp-logo{position:relative;flex:none;display:flex;align-items:center;justify-content:center;border-radius:9px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px #e6ebf2,0 2px 6px -2px rgba(15,23,42,.22);transition:transform .2s var(--ppfx-ease);}
.pp-logo-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#fff;color:var(--pp-brand);font-size:var(--pp-logo-font,15px);font-weight:800;letter-spacing:-.02em;}
.pp-logo-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;background:#fff;}
.pp-titles{min-width:0;display:flex;flex-direction:column;gap:1px;}
.pp-title{font-size:13px;font-weight:600;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--pp-text);}
.pp-sub{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--pp-text-3);white-space:nowrap;overflow:hidden;}
.pp-sub b{font-weight:600;color:var(--pp-brand);}
.pp-sub i{font-style:normal;color:var(--pp-text-4);}
.pp-update-badge{flex:none;display:inline-flex;align-items:center;height:16px;padding:0 5px;border:1px solid #fdecc8;border-radius:99px;background:#fffaeb;color:#b45309;font-size:8px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s;}
.pp-update-badge:hover{background:#fff3d6;border-color:#f8d99a;}
.pp-head-right{flex:none;display:flex;align-items:center;gap:2px;}
.pp-live{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 6px;border-radius:7px;font-size:10px;color:var(--pp-text-3);white-space:nowrap;}
.pp-live.on{background:var(--pp-success-bg);color:#0b7a46;}
.pp-dot{width:6px;height:6px;border-radius:50%;background:#c3ccd9;flex:none;}
.pp-dot.on{background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.14);animation:ppPulse 2.2s ease-in-out infinite;}
.pp-iconbtn{width:28px;height:28px;padding:0;border:0;border-radius:8px;background:transparent;color:#7d899d;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,color .15s;flex:none;}
.pp-iconbtn:hover{background:#f1f4f9;color:#2b3648;}
.pp-iconbtn.pp-on{background:var(--pp-brand-weak);color:var(--pp-brand);}
.pp-iconbtn:disabled{opacity:.4;cursor:not-allowed;}
.pp-auto{display:inline-flex;align-items:center;justify-content:center;width:30px;height:28px;border-radius:8px;color:#9aa6b8;cursor:pointer;}
.pp-auto:hover{background:#f1f4f9;}
.pp-auto .el-switch{transform:scale(.78);transform-origin:center;}
.pp-auto .el-switch__core{--el-switch-on-color:var(--pp-brand);--el-switch-off-color:#dfe4ec;}

.pp-body{flex:1;min-height:0;display:flex;overflow:hidden;}
.pp-shell{flex:1;min-width:0;min-height:0;display:flex;}
.pp-rail{position:relative;flex:0 0 56px;width:56px;background:var(--pp-surface);border-right:1px solid var(--pp-line);display:flex;flex-direction:column;gap:2px;padding:7px 5px;overflow:hidden;}
.pp-rail-item{position:relative;flex:none;height:50px;border:0;border-radius:10px;background:transparent;color:#8592a6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:10px;font-weight:500;letter-spacing:.02em;cursor:pointer;padding:0;transition:background .15s,color .15s,box-shadow .15s;}
.pp-rail-item:hover{background:#edf1f7;color:#3c4a60;}
.pp-rail-item.active{background:#fff;color:var(--pp-brand);box-shadow:0 1px 2px rgba(16,24,40,.06),0 0 0 1px var(--pp-line);}
.pp-rail-ink{position:absolute;left:0;top:0;z-index:1;width:3px;height:0;border-radius:0 3px 3px 0;background:var(--pp-brand);opacity:0;pointer-events:none;transform:translateY(0);}
.pp-rail-ink.ppfx-live{opacity:1;}
.pp-rail-ink.ppfx-slide{transition:transform var(--ppfx-t-base) var(--ppfx-ease),height var(--ppfx-t-base) var(--ppfx-ease),opacity var(--ppfx-t-fast) linear;}
.pp-rail-item.pp-warn::after{content:"";position:absolute;top:7px;right:7px;width:6px;height:6px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 2px var(--pp-surface);}
.pp-rail-item svg{flex:none;}
.pp-rail-spacer{flex:1;min-height:4px;}
.pp-main{position:relative;flex:1;min-width:0;height:100%;background:#fff;}
.config-panel{height:100%;overflow-y:auto;overflow-x:hidden;padding:12px;animation:ppfxPane .16s var(--ppfx-ease) both;}
.config-panel>*{min-width:0;}

.pp-statusrow{display:flex;flex-wrap:wrap;gap:5px;flex:none;}
.pp-chip{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 8px;border-radius:7px;background:var(--pp-surface);border:1px solid var(--pp-line);color:var(--pp-text-2);font-size:10.5px;font-weight:500;white-space:nowrap;}
.pp-chip.ok{background:var(--pp-success-bg);border-color:var(--pp-success-line);color:#0b7a46;}
.pp-chip.bad{background:var(--pp-danger-bg);border-color:var(--pp-danger-line);color:#b42318;}
.pp-chip.warn{background:var(--pp-warning-bg);border-color:var(--pp-warning-line);color:#92400e;}
.pp-chip svg{flex:none;opacity:.85;}
.pp-chip .pp-dot{width:5px;height:5px;}

.pp-home{height:100%;display:flex;flex-direction:column;gap:8px;min-height:0;}
.pp-progress{flex:none;border:1px solid var(--pp-line);border-radius:12px;padding:10px 11px;background:#fff;}
.pp-progress-top{display:flex;align-items:baseline;gap:10px;justify-content:space-between;}
.pp-task{min-width:0;font-size:12.5px;font-weight:600;color:var(--pp-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-pct{flex:none;font-size:17px;font-weight:700;color:var(--pp-brand);letter-spacing:-.02em;font-variant-numeric:tabular-nums;}
.pp-bar{height:6px;border-radius:99px;background:#edf1f7;overflow:hidden;margin:8px 0 6px;}
.pp-bar>i{display:block;width:100%;height:100%;border-radius:99px;background:linear-gradient(90deg,#4d8dff,#0052d9);transform-origin:left center;transform:scaleX(var(--ppfx-p,0));transition:transform .45s var(--ppfx-ease-soft);}
.pp-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;color:var(--pp-text-3);font-variant-numeric:tabular-nums;}
.pp-meta b{font-weight:600;color:var(--pp-text-2);}
.pp-idle{flex:none;display:flex;align-items:center;gap:9px;border:1px dashed #dfe5ee;border-radius:12px;padding:10px 11px;background:var(--pp-surface-2);}
.pp-idle-ico{flex:none;width:30px;height:30px;border-radius:9px;background:#fff;border:1px solid var(--pp-line);display:flex;align-items:center;justify-content:center;color:#a8b3c4;}
.pp-idle-txt{min-width:0;}
.pp-idle-txt b{display:block;font-size:11.5px;font-weight:600;color:var(--pp-text-2);}
.pp-idle-txt span{display:block;font-size:10px;color:var(--pp-text-3);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

.pp-logs{flex:1;min-height:90px;display:flex;flex-direction:column;border:1px solid var(--pp-line);border-radius:12px;overflow:hidden;background:#fff;}
.pp-log-head{flex:none;height:32px;display:flex;align-items:center;gap:6px;padding:0 6px 0 11px;background:var(--pp-surface-2);border-bottom:1px solid var(--pp-line);}
.pp-log-title{font-size:10.5px;font-weight:600;color:var(--pp-text-2);letter-spacing:.04em;}
.pp-log-count{font-size:9px;color:var(--pp-text-3);background:#eef2f7;border-radius:99px;padding:1px 6px;font-variant-numeric:tabular-nums;}
.pp-log-actions{margin-left:auto;display:flex;align-items:center;gap:1px;}
.pp-log-actions .pp-iconbtn{width:24px;height:24px;border-radius:6px;}
.pp-log-list{flex:1;min-height:0;overflow-y:auto;padding:3px 0;}
.pp-log-item{display:flex;gap:7px;padding:4px 10px;font-size:11px;line-height:1.55;}
.pp-log-item:hover{background:#fafcff;}
.pp-log-item[data-new="1"]{animation:ppfxRise .16s var(--ppfx-ease) both;}
.pp-log-time{flex:none;width:42px;padding-top:1px;color:#a6b1c2;font-size:9.5px;font-variant-numeric:tabular-nums;}
.pp-log-msg{min-width:0;color:#3d4a5e;word-break:break-word;}
.pp-log-msg::before{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;margin-right:5px;vertical-align:2px;background:#cbd5e1;}
.pp-log-msg a{color:var(--pp-brand);text-decoration:none;}
.pp-log-msg a:hover{text-decoration:underline;}
.pp-log-item[data-t="success"] .pp-log-msg{color:#3d4a5e;}
.pp-log-item[data-t="success"] .pp-log-msg::before{background:#10b981;}
.pp-log-item[data-t="warning"] .pp-log-msg{color:#8a5a12;}
.pp-log-item[data-t="warning"] .pp-log-msg::before{background:#f59e0b;}
.pp-log-item[data-t="danger"] .pp-log-msg{color:#b42318;}
.pp-log-item[data-t="danger"] .pp-log-msg::before{background:#ef4444;}
.pp-log-item[data-t="primary"] .pp-log-msg{color:#3d4a5e;}
.pp-log-item[data-t="primary"] .pp-log-msg::before{background:var(--pp-brand);}

.pp-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:150px;padding:22px 12px;color:var(--pp-text-3);font-size:10.5px;text-align:center;}
.pp-empty-ico{width:40px;height:40px;border-radius:12px;background:var(--pp-surface);border:1px solid var(--pp-line);display:flex;align-items:center;justify-content:center;color:#b9c3d1;animation:ppfxBreathe 3.8s var(--ppfx-ease-soft) infinite;transform-origin:50% 50%;}
.pp-empty b{font-size:11.5px;font-weight:600;color:var(--pp-text-2);}
.pp-empty span{max-width:200px;line-height:1.5;}

.pp-welfare{flex:none;border:1px solid #f4dfbe;border-radius:12px;padding:10px;background:linear-gradient(135deg,#fffaf1,#fff3df);margin-bottom:10px;}
.pp-welfare-top{display:flex;align-items:center;gap:8px;}
.pp-welfare-ico{width:28px;height:28px;border-radius:8px;background:#fff1d6;color:#c27803;display:flex;align-items:center;justify-content:center;flex:none;}
.pp-welfare-copy{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;}
.pp-welfare-copy b{font-size:12px;color:#7c4a03;}
.pp-welfare-copy span{font-size:10px;color:#a16207;}
.pp-welfare-tag{font-size:9px;color:#b45309;background:#ffedd5;border:1px solid #fed7aa;border-radius:999px;padding:1px 6px;flex:none;}
.pp-welfare-plans{display:flex;flex-wrap:wrap;gap:4px 8px;margin:7px 0 8px;font-size:9px;color:#9a5b0a;font-variant-numeric:tabular-nums;}
.pp-welfare-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.pp-welfare-note{font-size:9px;color:#b48a52;}
.pp-welfare-btn{display:inline-flex;align-items:center;gap:3px;height:24px;padding:0 10px;border-radius:7px;background:#f59e0b;color:#fff;font-size:10px;font-weight:600;text-decoration:none;box-shadow:0 2px 5px rgba(245,158,11,.25);}
.pp-welfare-btn:hover{background:#d97706;color:#fff;}
.pp-token{flex:none;border:1px solid var(--pp-line);border-radius:12px;padding:10px;background:#fff;margin-bottom:10px;}
.pp-token-head{display:flex;align-items:center;gap:7px;}
.pp-token-key{flex:none;width:24px;height:24px;border-radius:7px;background:var(--pp-brand-weak);color:var(--pp-brand);display:flex;align-items:center;justify-content:center;}
.pp-token-title{font-size:11.5px;font-weight:600;}
.pp-token-chips{margin-left:auto;display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end;}
.pp-pill{font-size:9.5px;line-height:1.5;padding:1px 6px;border-radius:99px;font-weight:600;white-space:nowrap;}
.pp-pill.remain{background:var(--pp-success-bg);color:#067647;}
.pp-pill.remain.low{background:var(--pp-warning-bg);color:#b54708;}
.pp-pill.remain.zero{background:var(--pp-danger-bg);color:#b42318;}
.pp-pill.latency{background:#eef2ff;color:#4353b8;}
.pp-input-row{display:flex;align-items:center;gap:6px;margin-top:8px;}
.pp-input-row .el-input{flex:1;min-width:0;}
.pp-input-row .el-button{flex:none;height:28px;padding:0 12px;border-radius:8px;font-size:11.5px;}
.pp-note{display:flex;align-items:flex-start;gap:6px;margin-top:7px;padding:6px 8px;border-radius:8px;background:var(--pp-warning-bg);border:1px solid var(--pp-warning-line);color:#92400e;font-size:10px;line-height:1.5;}
.pp-note.ok{background:var(--pp-success-bg);border-color:var(--pp-success-line);color:#0b7a46;}
.pp-note.bad{background:var(--pp-danger-bg);border-color:var(--pp-danger-line);color:#b42318;}
.pp-note svg{flex:none;margin-top:1px;}
.pp-note a{color:var(--pp-brand);font-weight:600;text-decoration:none;}
.pp-token-list{display:flex;flex-direction:column;gap:4px;margin-top:7px;padding-top:7px;border-top:1px dashed var(--pp-line);}
.pp-token-item{display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:6px;background:var(--pp-surface);font-size:9.5px;color:var(--pp-text-2);}
.pp-token-item code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;color:#475569;}
.pp-token-item .pp-token-mini{margin-left:auto;border:0;background:#fff;border-radius:5px;padding:2px 6px;font-size:9px;color:var(--pp-brand);cursor:pointer;box-shadow:0 0 0 1px var(--pp-line);}

.pp-setting-list{border:1px solid var(--pp-line);border-radius:12px;overflow:hidden;background:#fff;}
.pp-set-row{width:100%;display:flex;align-items:center;gap:9px;padding:9px 10px;border:0;border-top:1px solid var(--pp-line-soft);background:#fff;text-align:left;cursor:pointer;transition:background .15s;}
.pp-set-row:first-child{border-top:0;}
.pp-set-row:hover{background:var(--pp-surface-2);}
.pp-set-ico{flex:none;width:28px;height:28px;border-radius:8px;background:var(--pp-surface);color:#7c899d;display:flex;align-items:center;justify-content:center;}
.pp-set-main{flex:1;min-width:0;}
.pp-set-name{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:var(--pp-text);}
.pp-set-desc{margin-top:1px;font-size:9.5px;color:var(--pp-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-set-chev{flex:none;color:#c3ccd9;display:flex;}
.pp-set-row:hover .pp-set-chev{color:var(--pp-brand);}
.pp-set-badge{font-size:8.5px;font-weight:600;color:#b45309;background:var(--pp-warning-bg);border:1px solid var(--pp-warning-line);border-radius:99px;padding:0 4px;line-height:1.5;}
.pp-settings-note{flex:none;margin-top:8px;text-align:center;font-size:9px;color:var(--pp-text-4);}

.pp-detail-head{position:sticky;top:-12px;z-index:3;display:flex;align-items:center;gap:7px;margin:-12px -12px 8px;padding:10px 10px 9px 8px;background:rgba(255,255,255,.96);backdrop-filter:blur(6px);border-bottom:1px solid var(--pp-line);}
.pp-back{flex:none;width:26px;height:26px;border:0;border-radius:7px;background:transparent;color:#7c899d;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}
.pp-back:hover{background:#f1f4f9;color:var(--pp-text);}
.pp-detail-title{flex:1;min-width:0;font-size:12px;font-weight:600;color:var(--pp-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-detail-desc{margin:-2px 1px 8px;font-size:10px;line-height:1.55;color:#7c899d;}
.pp-detail-extra{flex:none;font-size:9px;font-weight:600;color:#b45309;background:var(--pp-warning-bg);border:1px solid var(--pp-warning-line);border-radius:99px;padding:1px 6px;}
.pp-group{margin:2px 0 8px;}
.pp-group-label{display:flex;align-items:center;gap:5px;margin:0 1px 5px;font-size:9.5px;font-weight:600;letter-spacing:.05em;color:var(--pp-text-3);}
.pp-seg{display:flex;gap:2px;padding:2px;border-radius:9px;background:#f1f4f9;}
.pp-seg-btn{flex:1 1 0;min-width:0;border:0;border-radius:7px;background:transparent;padding:5px 4px;font-size:10.5px;font-weight:500;color:#65738a;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .15s,color .15s,box-shadow .15s;}
.pp-seg-btn:hover{color:#334155;}
.pp-seg-btn.active{background:#fff;color:var(--pp-brand);font-weight:600;box-shadow:0 1px 2px rgba(16,24,40,.08),0 0 0 1px rgba(16,24,40,.04);}
.pp-seg-btn:disabled{opacity:.45;cursor:not-allowed;}
.pp-row{display:flex;align-items:center;gap:8px;min-height:36px;padding:3px 1px;border-top:1px solid var(--pp-line-soft);}
.pp-row:first-child{border-top:0;}
.pp-row-label{flex:1;min-width:0;display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-size:11.5px;color:#334155;line-height:1.4;}
.pp-row-label .pp-unit{font-size:9px;color:var(--pp-text-4);font-weight:400;}
.pp-row-label .pp-muted{font-size:9px;color:var(--pp-text-4);}
.pp-row-control{flex:none;display:flex;align-items:center;gap:5px;}
.pp-row.is-off .pp-row-label{color:#a9b4c4;}
.pp-row .el-switch{--el-switch-on-color:var(--pp-brand);--el-switch-off-color:#dfe4ec;transform:scale(.86);transform-origin:right center;}
.pp-row .el-input-number{width:80px;}
.pp-ai{margin:4px 1px 8px;padding:8px;border:1px solid var(--pp-line);border-radius:10px;background:var(--pp-surface-2);transition:opacity .15s;}
.pp-ai.pp-off{opacity:.55;}
.pp-ai-row{display:flex;align-items:center;gap:7px;min-height:28px;}
.pp-ai-row+.pp-ai-row{margin-top:4px;}
.pp-ai-label{flex:none;width:38px;font-size:9.5px;color:#7c899d;}
.pp-ai .el-select{flex:1;min-width:0;}
.pp-ai-note{margin-left:auto;font-size:9px;color:var(--pp-text-4);white-space:nowrap;}
.pp-hint{display:flex;align-items:flex-start;gap:5px;margin:6px 1px 2px;padding:6px 8px;border-radius:8px;background:var(--pp-surface);border:1px solid var(--pp-line-soft);color:#64748b;font-size:9.5px;line-height:1.5;}
.pp-hint.warn{background:var(--pp-warning-bg);border-color:var(--pp-warning-line);color:#92400e;}
.pp-hint.ok{background:var(--pp-success-bg);border-color:var(--pp-success-line);color:#0b7a46;}
.pp-hint svg{flex:none;margin-top:1px;}

.pp-records{display:flex;flex-direction:column;gap:7px;height:100%;}
.pp-records>.pp-empty{flex:1;}
.pp-scale-card{flex:none;border:1px solid var(--pp-line);border-radius:10px;background:#fff;padding:9px 10px;}
.pp-scale-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.pp-scale-head b{font-size:10.5px;font-weight:600;color:var(--pp-text-2);}
.pp-scale-head span{font-size:9px;color:var(--pp-text-4);}
.pp-scale-options{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:6px;}
.pp-scale-btn{height:24px;border:1px solid var(--pp-line);border-radius:6px;background:#fff;color:var(--pp-text-3);font-size:9.5px;cursor:pointer;transition:border-color .15s,background .15s,color .15s;}
.pp-scale-btn:hover{border-color:#c7d7f5;color:var(--pp-brand);}
.pp-scale-btn.is-active{border-color:#bcd0f4;background:var(--pp-brand-weak);color:var(--pp-brand);font-weight:600;}
.pp-scale-note{margin:5px 0 0;font-size:8.5px;color:var(--pp-text-4);line-height:1.4;}
.pp-rec-tips{flex:none;border:1px solid #dbe8ff;border-radius:10px;background:#f5f9ff;padding:9px 10px;display:flex;flex-direction:column;gap:5px;}
.pp-rec-tips.is-warning{border-color:#f3dfbf;background:#fff9ef;}
.pp-rec-tip{display:flex;align-items:center;gap:6px;font-size:10px;line-height:1.5;color:#4b5b70;flex-wrap:wrap;}
.pp-rec-tips.is-warning .pp-rec-tip{color:#8a5a1f;}
.pp-rec-tip-ico{display:flex;align-items:center;justify-content:center;color:#d97706;flex:none;}
.pp-rec-tip-text{flex:1;min-width:0;}
.pp-rec-config{height:22px;padding:0 8px;border:0;border-radius:6px;background:#0052d9;color:#fff;font-size:9px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:3px;}
.pp-rec-config:hover{background:#0046c0;}
.pp-rec-summary{flex:none;display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 1px;font-size:9.5px;color:var(--pp-text-3);border-top:1px solid var(--pp-line-soft);border-bottom:1px solid var(--pp-line-soft);}
.pp-rec-summary b{color:var(--pp-text-1);font-weight:700;font-variant-numeric:tabular-nums;}
.pp-rec-sum-sep{color:var(--pp-line);}
.pp-rec-legend{flex:none;display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:9px;color:var(--pp-text-3);}
.pp-legend-item{display:inline-flex;align-items:center;gap:3px;}
.pp-legend-dot{width:8px;height:8px;border-radius:50%;background:#fff;border:1px solid #cbd5e1;}
.pp-legend-dot.is-searching{border-color:#93c5fd;background:#eff6ff;}
.pp-legend-dot.is-bank{background:#3b82f6;border-color:#3b82f6;}
.pp-legend-dot.is-ai{background:#22c55e;border-color:#22c55e;}
.pp-legend-dot.is-verify{background:#8b5cf6;border-color:#8b5cf6;}
.pp-legend-dot.is-cache{background:#06b6d4;border-color:#06b6d4;}
.pp-legend-dot.is-error{background:#fff7ed;border-color:#f59e0b;}
.pp-q-circles{flex:none;display:flex;flex-wrap:wrap;gap:5px;padding:2px 0 4px;}
.pp-q-circle{position:relative;width:21px;height:21px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:700;font-variant-numeric:tabular-nums;border:1px solid transparent;transition:background-color .2s var(--ppfx-ease-soft),color .2s var(--ppfx-ease-soft),border-color .2s var(--ppfx-ease-soft);}
.pp-q-circle.is-bank{background:#3b82f6;color:#fff;border-color:#3b82f6;}
.pp-q-circle.is-ai{background:#22c55e;color:#fff;border-color:#22c55e;}
.pp-q-circle.is-verify{background:#8b5cf6;color:#fff;border-color:#8b5cf6;}
.pp-q-circle.is-cache{background:#06b6d4;color:#fff;border-color:#06b6d4;}
.pp-q-circle.is-error{background:#fff7ed;color:#b45309;border-color:#f59e0b;}
.pp-q-circle.is-searching{background:#fff;color:#2563eb;border-color:#93c5fd;}
.pp-q-circle.is-searching::after{content:"";position:absolute;inset:-1px;border-radius:50%;border:1px solid rgba(59,130,246,.45);animation:ppfxQring 1.3s var(--ppfx-ease-soft) infinite;pointer-events:none;}
.pp-q-circle.is-pending{background:#f1f5f9;color:#94a3b8;border-color:#e8eef6;}
@keyframes ppfxQring{0%{transform:scale(1);opacity:.55;}70%{transform:scale(1.35);opacity:0;}100%{opacity:0;}}
.pp-list-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 1px 1px;flex:none;}
.pp-list-head b{font-size:11px;font-weight:600;color:var(--pp-text-2);letter-spacing:.03em;}
.pp-list-head span{font-size:9.5px;color:var(--pp-text-3);}
.pp-rec{border:1px solid var(--pp-line);border-radius:10px;padding:9px 10px;background:#fff;transition:border-color .15s;}
.pp-rec:hover{border-color:#d8e2f2;}
.pp-rec:last-child{animation:ppfxRise .18s var(--ppfx-ease) both;}
.pp-rec-top{display:flex;align-items:center;gap:5px;margin-bottom:4px;}
.pp-rec-idx{width:18px;height:18px;border-radius:6px;background:#f1f4f9;color:#8a96a8;font-size:9px;font-weight:600;display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums;}
.pp-tag{font-size:8.5px;line-height:1.6;padding:0 4px;border-radius:4px;background:var(--pp-warning-bg);border:1px solid var(--pp-warning-line);color:#b45309;font-weight:600;}
.pp-tag.is-ai{background:#ecfdf3;border-color:#bbf7d0;color:#067647;}
.pp-tag.is-verify{background:#f5f3ff;border-color:#ddd6fe;color:#6d28d9;}
.pp-tag.is-cache{background:#ecfeff;border-color:#a5f3fc;color:#0e7490;}
.pp-rec-q{font-size:11.5px;line-height:1.6;color:#2f3b4f;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;}
.pp-rec-q img{max-width:100%;height:auto;vertical-align:middle;}
.pp-rec-a{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;padding-top:6px;border-top:1px dashed var(--pp-line-soft);}
.pp-ans{max-width:100%;font-size:10px;line-height:1.5;color:#0b7a46;background:var(--pp-success-bg);border:1px solid var(--pp-success-line);border-radius:5px;padding:1px 5px;word-break:break-word;}
.pp-ans.is-empty{color:#a0abbb;background:var(--pp-surface);border-color:var(--pp-line-soft);}

.pp-usage{display:flex;flex-direction:column;gap:7px;}
.pp-usage .pp-list-head{margin-top:2px;}
.pp-usage-card{border:1px solid var(--pp-line);border-radius:11px;padding:9px;background:#fff;}
.pp-usage-top{display:flex;align-items:center;gap:6px;}
.pp-usage-top .el-input{flex:1;min-width:0;}
.pp-usage-top .el-button{flex:none;height:28px;padding:0 11px;border-radius:8px;font-size:11px;}
.pp-usage-meta{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:9px;color:var(--pp-text-3);}
.pp-token-chip{display:inline-flex;align-items:center;padding:1px 6px;border-radius:99px;background:#eff6ff;border:1px solid #dbeafe;color:#1d4ed8;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;}
.pp-modebar{display:flex;gap:2px;padding:2px;border-radius:8px;background:#f1f4f9;}
.pp-modebar button{flex:1;border:0;border-radius:6px;background:transparent;padding:4px 2px;font-size:9.5px;color:#65738a;cursor:pointer;white-space:nowrap;}
.pp-modebar button.active{background:#fff;color:var(--pp-brand);font-weight:600;box-shadow:0 1px 2px rgba(16,24,40,.08);}
.pp-u-list{border:1px solid var(--pp-line);border-radius:11px;overflow:hidden;background:#fff;}
.pp-u-list>.pp-empty{min-height:190px;}
.pp-u-row{width:100%;display:flex;align-items:center;gap:7px;padding:7px 9px;border:0;border-top:1px solid var(--pp-line-soft);background:#fff;text-align:left;cursor:pointer;}
.pp-u-row:first-child{border-top:0;}
.pp-u-row:hover{background:var(--pp-surface-2);}
.pp-u-left{flex:1;min-width:0;}
.pp-u-line{display:flex;align-items:center;gap:5px;font-size:10px;color:#4b5a70;}
.pp-u-date{font-weight:600;font-variant-numeric:tabular-nums;}
.pp-u-time{color:#98a4b6;font-size:9px;font-variant-numeric:tabular-nums;}
.pp-u-mode{font-size:8.5px;line-height:1.6;padding:0 4px;border-radius:4px;background:#eef2ff;color:#4353b8;font-weight:600;}
.pp-u-mode.is-ai{background:#ecfdf3;color:#067647;}
.pp-u-mode.is-verify{background:var(--pp-warning-bg);color:#b54708;}
.pp-u-mode.is-normal{background:#eef2ff;color:#4353b8;}
.pp-u-mode.is-chat{background:#eef7ff;color:#0369a1;}
.pp-u-sub{display:flex;align-items:center;gap:6px;margin-top:1px;font-size:9px;color:var(--pp-text-4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-u-sub-text{min-width:0;overflow:hidden;text-overflow:ellipsis;}
.pp-u-model{flex:none;max-width:100px;margin-left:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:#4353b8;cursor:help;}
.pp-u-model.is-empty{color:var(--pp-text-4);font-weight:500;}
.pp-u-right{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:1px;}
.pp-u-cost{font-size:10.5px;font-weight:700;color:#0b7a46;font-variant-numeric:tabular-nums;}
.pp-u-rem{font-size:8.5px;color:var(--pp-text-4);}
.pp-u-detail{padding:0 9px 7px;background:var(--pp-surface-2);border-top:1px dashed var(--pp-line-soft);font-size:9px;line-height:1.5;color:#7c899d;}
.pp-pager{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:1px 2px;font-size:9.5px;color:var(--pp-text-3);}
.pp-pager-btns{display:flex;align-items:center;gap:4px;}
.pp-pager-btns button{width:24px;height:24px;border:1px solid var(--pp-line);border-radius:6px;background:#fff;color:#65738a;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}
.pp-pager-btns button:hover:not(:disabled){border-color:#c7d7f5;color:var(--pp-brand);}
.pp-pager-btns button:disabled{opacity:.4;cursor:not-allowed;}

.pp-ai-chat{position:relative;height:100%;min-height:0;display:flex;flex-direction:column;gap:6px;}
.pp-ai-top{flex:none;display:flex;align-items:center;gap:4px;}
.pp-ai-picker{flex:1;min-width:0;height:30px;display:flex;align-items:center;gap:6px;padding:0 7px;border:1px solid var(--pp-line);border-radius:9px;background:#fff;color:var(--pp-text-2);font-size:11px;cursor:pointer;text-align:left;transition:border-color .15s,background .15s;}
.pp-ai-picker:hover{border-color:#c7d7f5;background:#f8fbff;}
.pp-ai-picker .pp-icon{color:var(--pp-brand);}
.pp-ai-picker-title{flex:1;min-width:0;font-weight:600;color:var(--pp-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-count-pill{flex:none;font-size:8.5px;line-height:1.5;padding:1px 5px;border-radius:99px;background:var(--pp-surface);border:1px solid var(--pp-line);color:var(--pp-text-3);font-variant-numeric:tabular-nums;}
.pp-ai-tool{flex:none;width:30px;height:30px;padding:0;border:1px solid var(--pp-line);border-radius:9px;background:#fff;color:#7d899d;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:border-color .15s,background .15s,color .15s;}
.pp-ai-tool:hover:not(:disabled){border-color:#c7d7f5;background:#f8fbff;color:var(--pp-brand);}
.pp-ai-tool.is-active{background:var(--pp-brand-weak);border-color:#c7d7f5;color:var(--pp-brand);}
.pp-ai-tool.is-danger:hover:not(:disabled){border-color:var(--pp-danger-line);background:var(--pp-danger-bg);color:var(--pp-danger);}
.pp-ai-tool:disabled{opacity:.4;cursor:not-allowed;}
.pp-ai-mini-spin{width:11px;height:11px;border:1.5px solid #dbeafe;border-top-color:var(--pp-brand);border-radius:50%;animation:ppSpin .8s linear infinite;display:block;}
.pp-ai-menu-mask{position:absolute;inset:0;z-index:8;background:transparent;}
.pp-ai-menu{position:absolute;left:0;right:0;top:34px;z-index:9;border:1px solid var(--pp-line);border-radius:10px;background:#fff;box-shadow:0 14px 34px -12px rgba(15,23,42,.30),0 2px 6px rgba(15,23,42,.06);overflow:hidden;transform-origin:top center;animation:ppfxMenuIn .16s var(--ppfx-ease) both;}
.pp-ai-menu-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;border-bottom:1px solid var(--pp-line-soft);font-size:9px;color:var(--pp-text-3);}
.pp-ai-menu-head b{font-size:10px;font-weight:600;color:var(--pp-text-2);letter-spacing:.03em;}
.pp-ai-menu-head span{font-variant-numeric:tabular-nums;}
.pp-ai-session-list{max-height:196px;overflow-y:auto;padding:3px;}
.pp-ai-session{width:100%;display:flex;align-items:center;gap:7px;padding:7px;border:0;border-radius:7px;background:transparent;text-align:left;cursor:pointer;transition:background .12s;}
.pp-ai-session:hover{background:var(--pp-surface);}
.pp-ai-session.active{background:var(--pp-brand-weak);}
.pp-ai-session-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.pp-ai-session-title{font-size:10.5px;font-weight:600;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-session.active .pp-ai-session-title{color:var(--pp-brand);}
.pp-ai-session-time{font-size:8.5px;color:var(--pp-text-4);}
.pp-ai-session-dot{flex:none;width:5px;height:5px;border-radius:50%;background:var(--pp-brand);}
.pp-ai-menu-empty{padding:18px 10px;text-align:center;font-size:9.5px;color:var(--pp-text-4);}
.pp-ai-menu-foot{border-top:1px solid var(--pp-line-soft);padding:4px;}
.pp-ai-menu-foot button{width:100%;height:24px;border:0;border-radius:6px;background:transparent;color:var(--pp-danger);font-size:9.5px;cursor:pointer;}
.pp-ai-menu-foot button:hover{background:var(--pp-danger-bg);}
.pp-ai-callout{flex:none;display:flex;align-items:flex-start;gap:6px;padding:6px 8px;border-radius:8px;background:var(--pp-brand-weak);border:1px solid #d6e4ff;color:#1d4ed8;font-size:9.5px;line-height:1.5;}
.pp-ai-callout .pp-icon{flex:none;margin-top:1px;}
.pp-ai-callout.is-error{background:var(--pp-danger-bg);border-color:var(--pp-danger-line);color:#b42318;}
.pp-ai-callout.is-ok{background:var(--pp-success-bg);border-color:var(--pp-success-line);color:#0b7a46;}
.pp-ai-callout-text{flex:1;min-width:0;word-break:break-word;}
.pp-ai-linkbtn{flex:none;height:20px;padding:0 6px;border:1px solid currentColor;border-radius:5px;background:#fff;color:var(--pp-brand);font-size:9px;font-weight:600;cursor:pointer;white-space:nowrap;}
.pp-ai-linkbtn:hover{background:#f2f7ff;}
.pp-ai-callout.is-error .pp-ai-linkbtn{color:#b42318;}
.pp-ai-callout.is-error .pp-ai-linkbtn:hover{background:#fff5f5;}
.pp-ai-callout-x{flex:none;width:18px;height:18px;padding:0;border:0;border-radius:5px;background:transparent;color:currentColor;opacity:.65;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.pp-ai-callout-x:hover{opacity:1;background:rgba(255,255,255,.6);}
.pp-ai-confirm{flex:none;display:flex;align-items:center;gap:5px;padding:5px 7px;border:1px solid var(--pp-danger-line);border-radius:7px;background:var(--pp-danger-bg);color:#b42318;font-size:9.5px;line-height:1.4;}
.pp-ai-confirm>span{flex:1;min-width:0;}
.pp-ai-confirm button{flex:none;height:21px;padding:0 7px;border:1px solid var(--pp-danger-line);border-radius:5px;background:#fff;color:#b42318;font-size:9px;cursor:pointer;}
.pp-ai-confirm button.primary{background:var(--pp-danger);border-color:var(--pp-danger);color:#fff;}
.pp-ai-confirm button:disabled{opacity:.55;cursor:not-allowed;}
.pp-ai-messages{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:9px;padding:2px 2px 4px;}
.pp-ai-msg{display:flex;align-items:flex-start;gap:6px;max-width:100%;animation:ppfxRise .18s var(--ppfx-ease) both;}
.pp-ai-msg.user{justify-content:flex-end;animation-name:ppfxRiseRight;}
.pp-ai-avatar{flex:none;width:20px;height:20px;border-radius:6px;background:var(--pp-brand-weak);color:var(--pp-brand);display:flex;align-items:center;justify-content:center;margin-top:1px;}
.pp-ai-avatar .pp-logo{box-shadow:none;border-radius:5px;}
.pp-ai-avatar.is-error{background:var(--pp-danger-bg);color:var(--pp-danger);}
.pp-ai-bubble{min-width:0;max-width:calc(100% - 26px);padding:7px 9px;border-radius:10px;font-size:11.5px;line-height:1.6;word-break:break-word;overflow-wrap:anywhere;}
.pp-ai-msg.assistant .pp-ai-bubble{background:var(--pp-surface-2);border:1px solid var(--pp-line-soft);border-top-left-radius:3px;color:#2f3b4f;}
.pp-ai-msg.user .pp-ai-bubble{max-width:86%;background:var(--pp-brand);border-top-right-radius:3px;color:#fff;white-space:pre-wrap;}
.pp-ai-msg.error .pp-ai-bubble{background:var(--pp-danger-bg);border:1px solid var(--pp-danger-line);border-top-left-radius:3px;color:#b42318;font-size:10.5px;}
.pp-ai-error-text{white-space:pre-wrap;}
.pp-ai-msg.error .pp-ai-linkbtn{margin-top:5px;}
.pp-ai-md p{margin:0 0 6px;}
.pp-ai-md p:last-child{margin-bottom:0;}
.pp-ai-md strong{font-weight:600;color:var(--pp-text);}
.pp-ai-md code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;background:#eef2f7;border:1px solid var(--pp-line);border-radius:4px;padding:0 3px;color:#1e293b;}
.pp-ai-md pre{margin:6px 0;padding:7px 8px;border:1px solid var(--pp-line);border-radius:7px;background:#f7f9fc;overflow-x:auto;}
.pp-ai-md pre code{display:block;padding:0;border:0;background:transparent;font-size:9.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;color:#1e293b;}
.pp-ai-md a{color:var(--pp-brand);text-decoration:underline;text-underline-offset:1px;}
.pp-ai-md a:hover{text-decoration:underline;color:var(--pp-brand-hover);}
.pp-ai-sources{margin-top:6px;padding-top:4px;border-top:1px dashed var(--pp-line);}
.pp-ai-sources summary{display:flex;align-items:center;gap:4px;min-height:22px;padding:0;font-size:9px;font-weight:600;color:var(--pp-text-3);cursor:pointer;list-style:none;user-select:none;}
.pp-ai-sources summary::-webkit-details-marker{display:none;}
.pp-ai-sources summary .pp-ai-sources-chev{margin-left:auto;color:#a8b3c4;transition:transform .15s;}
.pp-ai-sources[open] summary .pp-ai-sources-chev{transform:rotate(180deg);}
.pp-ai-sources-count{font-weight:500;color:var(--pp-text-4);}
.pp-ai-sources-list{display:flex;flex-direction:column;gap:1px;max-height:110px;overflow-y:auto;margin-top:2px;}
.pp-ai-source{display:flex;align-items:baseline;gap:5px;min-width:0;padding:3px 4px;border-radius:5px;color:#334155;text-decoration:none;}
a.pp-ai-source:hover{background:#f4f8ff;color:var(--pp-brand);}
.pp-ai-source-title{flex:1;min-width:0;font-size:9.5px;font-weight:600;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-source-host{flex:none;max-width:42%;font-size:8.5px;color:var(--pp-text-4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-cursor{display:inline-block;width:5px;height:11px;margin-left:2px;vertical-align:-1px;border-radius:1px;background:var(--pp-brand);animation:ppAiBlink 1s steps(2,start) infinite;}
.pp-ai-finish-note{margin-top:4px;font-size:8.5px;color:var(--pp-text-4);}
@keyframes ppAiBlink{50%{opacity:0;}}
.pp-ai-status{flex:none;display:flex;align-items:center;gap:6px;min-height:14px;padding:0 1px;font-size:9px;color:var(--pp-text-3);}
.pp-ai-status-main{flex:1;min-width:0;display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ppfx-thinking{flex:none;display:inline-flex;align-items:flex-end;gap:2px;height:9px;}
.ppfx-thinking>i{flex:none;width:2px;height:5px;border-radius:1px;background:currentColor;opacity:.55;transform-origin:50% 100%;animation:ppfxBars .9s var(--ppfx-ease-soft) infinite;}
.ppfx-thinking>i:nth-child(2){height:8px;animation-delay:.12s;}
.ppfx-thinking>i:nth-child(3){height:6px;animation-delay:.24s;}
@keyframes ppfxBars{0%,100%{transform:scaleY(.55);opacity:.45;}45%{transform:scaleY(1);opacity:1;}}
.pp-ai-spinner{flex:none;width:9px;height:9px;border:1.5px solid #dbeafe;border-top-color:var(--pp-brand);border-radius:50%;animation:ppSpin .8s linear infinite;display:block;}
.pp-ai-usage{flex:none;font-size:8.5px;color:var(--pp-text-3);font-variant-numeric:tabular-nums;white-space:nowrap;}
.pp-ai-welcome{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:150px;padding:14px 18px;text-align:center;color:var(--pp-text-3);font-size:9.5px;line-height:1.5;}
.pp-ai-welcome-ico{width:42px;height:42px;border-radius:13px;background:var(--pp-brand-weak);border:1px solid #dbe7ff;color:var(--pp-brand);display:flex;align-items:center;justify-content:center;margin-bottom:2px;}
.pp-ai-welcome b{font-size:11.5px;font-weight:600;color:var(--pp-text-2);}
.pp-ai-welcome span{max-width:210px;}
.pp-ai-welcome .pp-ai-spinner{width:16px;height:16px;border-width:2px;}
.pp-ai-welcome-note{font-size:8.5px;color:var(--pp-text-4);}
.pp-ai-composer{flex:none;padding:6px;border:1px solid var(--pp-line);border-radius:10px;background:#fff;transition:border-color .15s,box-shadow .15s;}
.pp-ai-composer:focus-within{border-color:#c7d7f5;box-shadow:0 0 0 2px var(--pp-brand-ring);}
.pp-ai-input{display:block;width:100%;min-height:36px;max-height:72px;padding:2px 3px;border:0;outline:0;background:transparent;color:var(--pp-text);font-family:inherit;font-size:11.5px;line-height:1.55;resize:none;overflow-y:auto;}
.pp-ai-input::placeholder{color:var(--pp-text-4);}
.pp-ai-input.is-over{color:var(--pp-danger);}
.pp-ai-input:disabled{opacity:.65;cursor:not-allowed;}
.pp-ai-toggles{flex:none;display:flex;align-items:center;gap:4px;margin-bottom:4px;}
.pp-ai-toggle{height:22px;padding:0 6px;border:1px solid var(--pp-line);border-radius:6px;background:#fff;color:var(--pp-text-3);font-size:9px;display:inline-flex;align-items:center;gap:3px;cursor:pointer;white-space:nowrap;transition:border-color .15s,background .15s,color .15s;}
.pp-ai-toggle:hover:not(:disabled){border-color:#c7d7f5;color:var(--pp-text-2);}
.pp-ai-toggle.active{background:var(--pp-brand-weak);border-color:#c7d7f5;color:var(--pp-brand);font-weight:600;}
.pp-ai-toggle:disabled{opacity:.55;cursor:not-allowed;}
.pp-ai-count{flex:none;font-size:9px;color:var(--pp-text-4);font-variant-numeric:tabular-nums;white-space:nowrap;}
.pp-ai-count.is-over{color:var(--pp-danger);font-weight:600;}
.pp-ai-sendrow{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px;}
.pp-ai-model{position:relative;flex:1;min-width:0;display:flex;}
.pp-ai-model-btn{min-width:0;max-width:100%;height:22px;padding:0 6px;border:1px solid var(--pp-line);border-radius:6px;background:#fff;color:var(--pp-text-2);font-size:8.5px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap;transition:border-color .15s,background .15s,color .15s;}
.pp-ai-model-btn:hover:not(:disabled){border-color:#c7d7f5;background:#f8fbff;color:var(--pp-brand);}
.pp-ai-model-btn.is-active{border-color:#c7d7f5;background:var(--pp-brand-weak);color:var(--pp-brand);}
.pp-ai-model-btn:disabled{opacity:.55;cursor:not-allowed;}
.pp-ai-model-btn .pp-icon{color:var(--pp-brand);}
.pp-ai-model-label{min-width:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-model-menu{position:absolute;left:0;bottom:calc(100% + 4px);z-index:12;width:190px;max-height:236px;overflow-y:auto;padding:3px;border:1px solid var(--pp-line);border-radius:8px;background:#fff;box-shadow:0 12px 28px -10px rgba(15,23,42,.28);transform-origin:bottom center;animation:ppfxMenuUp .16s var(--ppfx-ease) both;}
.pp-ai-model-group + .pp-ai-model-group{margin-top:2px;padding-top:2px;border-top:1px solid var(--pp-line-soft);}
.pp-ai-model-group-title{padding:4px 6px 3px;border-radius:4px;background:var(--pp-surface);font-size:9px;font-weight:700;letter-spacing:.03em;color:var(--pp-text-3);}
.pp-ai-model-option{width:100%;height:27px;display:flex;align-items:center;gap:5px;padding:0 6px 0 12px;border:0;border-radius:5px;background:transparent;color:var(--pp-text-2);font-size:10.5px;text-align:left;cursor:pointer;}
.pp-ai-model-option:hover{background:var(--pp-surface);}
.pp-ai-model-option.active{background:var(--pp-brand-weak);color:var(--pp-brand);font-weight:600;}
.pp-ai-model-option span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-enterhint{flex:none;margin-top:-3px;text-align:center;font-size:8.5px;line-height:1.35;color:var(--pp-text-4);user-select:none;pointer-events:none;}
.pp-ai-send{flex:none;height:26px;padding:0 12px;border:0;border-radius:7px;background:var(--pp-brand);color:#fff;font-size:10.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;transition:background .15s;}
.pp-ai-send:hover:not(:disabled){background:var(--pp-brand-hover);}
.pp-ai-send:disabled{background:#c7d2e3;cursor:not-allowed;}
.pp-ai-send.pp-ai-stop{background:#fff;border:1px solid var(--pp-danger-line);color:var(--pp-danger);}
.pp-ai-send.pp-ai-stop:hover{background:var(--pp-danger-bg);}
.pp-ai-send.pp-ai-stop i{width:7px;height:7px;border-radius:1px;background:currentColor;display:block;}
.pp-prose{font-size:11.5px;line-height:1.75;color:#475569;}
.pp-prose p{margin:0 0 7px;}
.pp-prose p:last-child{margin-bottom:0;}
.pp-prose h4{margin:10px 0 4px;font-size:11px;font-weight:600;color:var(--pp-text);}
.pp-prose h4:first-child{margin-top:0;}
.pp-prose .muted{color:var(--pp-text-3);font-size:9.5px;}
.pp-prose a{color:var(--pp-brand);text-decoration:none;}
.pp-prose a:hover{text-decoration:underline;}
.pp-doc{border:1px solid var(--pp-line);border-radius:11px;padding:10px;margin-bottom:7px;background:#fff;}
.pp-doc:last-child{margin-bottom:0;}
.pp-doc-title{display:flex;align-items:center;gap:5px;margin-bottom:6px;font-size:11px;font-weight:600;color:var(--pp-text);}
.pp-doc-title svg{color:#8b98ab;}
.pp-quote{margin:7px 0;padding:8px 10px;border-left:2px solid var(--pp-brand);border-radius:0 7px 7px 0;background:var(--pp-surface-2);color:#334155;font-size:11px;line-height:1.7;}
.pp-links{display:flex;flex-direction:column;gap:5px;}
.pp-link{display:flex;align-items:center;justify-content:space-between;gap:7px;padding:7px 9px;border:1px solid var(--pp-line);border-radius:8px;color:#334155;text-decoration:none;font-size:10.5px;line-height:1.4;}
.pp-link:hover{border-color:#c7d7f5;background:#f8fbff;color:var(--pp-brand);}
.pp-link svg{flex:none;color:#b3bdcb;}
.pp-link:hover svg{color:var(--pp-brand);}
.pp-price-row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:10px;color:#475569;padding:2px 0;}
.pp-price-row b{font-weight:600;color:#334155;}
.pp-price-cost{color:#b45309;font-weight:600;white-space:nowrap;}
.pp-price-sub{padding:0 0 3px;font-size:9px;color:var(--pp-text-4);}
.pp-mode-normal{color:#0b7a46;}
.pp-mode-verify{color:#b45309;}
.pp-mode-ai{color:var(--pp-brand);}

.pp-orb{position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:none;}
.pp-orb-ring{position:absolute;inset:2px;transform:rotate(-90deg);pointer-events:none;transition:transform .2s var(--ppfx-ease);}
.pp-orb:hover .pp-orb-ring{transform:rotate(-90deg) scale(1.04);}
.pp-orb:hover .pp-logo{transform:scale(1.04);}
.pp-orb-ring circle{fill:none;stroke-width:3;}
.pp-orb-ring .bg{stroke:#e9eef5;}
.pp-orb-ring .fg{stroke:var(--pp-brand);stroke-linecap:round;transition:stroke-dashoffset .4s ease;}
.pp-orb-dot{position:absolute;right:2px;bottom:2px;width:10px;height:10px;border-radius:50%;background:#c3ccd9;border:2px solid #fff;}
.pp-orb-dot.on{background:#10b981;}
.pp-orb-dot.on::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid rgba(16,185,129,.35);animation:ppfxRing 1.8s var(--ppfx-ease-soft) infinite;pointer-events:none;}
.pp-handle{position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px 0 8px;cursor:pointer;overflow:hidden;background:#fff;border-radius:12px 0 0 12px;touch-action:none;transition:background .15s,transform .12s var(--ppfx-ease-soft);}
.pp-handle:hover{background:#f8fbff;}
.pp-handle-logo{width:26px;height:26px;display:flex;align-items:center;justify-content:center;flex:none;}
.pp-handle-ring{width:24px;height:24px;display:block;flex:none;transform:rotate(-90deg);}
.pp-handle-ring circle{fill:none;stroke-width:2.5;}
.pp-handle-ring .bg{stroke:#e9eef5;}
.pp-handle-ring .fg{stroke:var(--pp-brand);stroke-linecap:round;transition:stroke-dashoffset .4s ease;}
.pp-handle-dot{position:relative;width:6px;height:6px;border-radius:50%;background:#c3ccd9;flex:none;}
.pp-handle-dot.on{background:#10b981;}
.pp-handle-dot.on::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid rgba(16,185,129,.35);animation:ppfxRing 1.8s var(--ppfx-ease-soft) infinite;pointer-events:none;}
.pp-handle-divider{width:16px;height:1px;background:var(--pp-line);}
.pp-handle-caret{display:flex;align-items:center;justify-content:center;color:#a7b2c2;}
.pp-handle:hover .pp-handle-caret{color:var(--pp-brand);animation:ppfxNudge 1.2s var(--ppfx-ease-soft) infinite;}
.pp-handle:active{transform:scale(.98);}
.main-page.pp-min,.main-page.pp-handle-mode{overflow:visible;}
.pp-orb:focus-visible,.pp-handle:focus-visible{outline:2px solid var(--pp-brand-ring);outline-offset:2px;}

.pp-coach{--pp-brand:#0052d9;--pp-line:#e8ecf2;position:fixed;z-index:100004;width:224px;max-width:calc(100vw - 20px);box-sizing:border-box;display:flex;align-items:flex-start;gap:8px;padding:10px 28px 10px 10px;background:#fff;border-radius:12px;box-shadow:0 16px 40px -14px rgba(15,23,42,.34),0 2px 6px rgba(15,23,42,.08),0 0 0 1px rgba(15,23,42,.06);color:#1b2433;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:12px;line-height:1.45;animation:ppCoachIn .22s ease-out;}
.pp-coach::after{content:"";position:absolute;width:9px;height:9px;background:#fff;transform:rotate(45deg);}
.pp-coach.side-right::after{left:-4.5px;top:22px;border-left:1px solid #e8ecf2;border-bottom:1px solid #e8ecf2;}
.pp-coach.side-left::after{right:-4.5px;top:22px;border-right:1px solid #e8ecf2;border-top:1px solid #e8ecf2;}
.pp-coach.side-bottom::after{top:-4.5px;left:24px;border-left:1px solid #e8ecf2;border-top:1px solid #e8ecf2;}
.pp-coach-body{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px;padding-top:1px;}
.pp-coach-body b{font-size:12px;font-weight:600;color:#1b2433;line-height:1.35;}
.pp-coach-body span{font-size:10px;color:#7c899d;line-height:1.45;}
.pp-coach-close{position:absolute;top:5px;right:5px;width:18px;height:18px;padding:0;border:0;border-radius:5px;background:transparent;color:#a7b2c2;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.pp-coach-close:hover{background:#f1f4f9;color:#334155;}
.pp-orb.pp-attention::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid rgba(0,82,217,.35);pointer-events:none;animation:ppOrbPulse 1.6s ease-out 2;}
.pp-handle.pp-attention{animation:ppHandlePulse 1.6s ease-out 2;}
@keyframes ppCoachIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:none;}}
@keyframes ppOrbPulse{0%{transform:scale(.92);opacity:.85;}75%{transform:scale(1.16);opacity:0;}100%{opacity:0;}}
@keyframes ppHandlePulse{0%,100%{box-shadow:0 6px 18px -6px rgba(15,23,42,.32);}50%{box-shadow:0 0 0 2px rgba(0,82,217,.35),0 6px 18px -6px rgba(15,23,42,.32);}}

.main-page .el-input__wrapper{min-height:28px;padding:1px 8px;border-radius:8px;background:#fff;box-shadow:0 0 0 1px #e3e8f0 inset;transition:box-shadow .15s;}
.main-page .el-input__wrapper:hover{box-shadow:0 0 0 1px #c9d2e0 inset;}
.main-page .el-input__wrapper.is-focus,.main-page .el-input__wrapper:focus-within{box-shadow:0 0 0 1px var(--pp-brand) inset,0 0 0 3px var(--pp-brand-ring);}
.main-page .el-input__inner{height:24px;font-size:11px;color:#263244;}
.main-page .el-input__inner::placeholder{color:#b3bdcb;}
.main-page .el-textarea__inner{border-radius:8px;font-size:11px;box-shadow:0 0 0 1px #e3e8f0 inset;}
.main-page .el-select__wrapper{min-height:28px;padding:0 8px;border-radius:8px;background:#fff;box-shadow:0 0 0 1px #e3e8f0 inset;font-size:11px;}
.main-page .el-select__wrapper.is-focused{box-shadow:0 0 0 1px var(--pp-brand) inset,0 0 0 3px var(--pp-brand-ring);}
.main-page .el-select__placeholder{font-size:11px;color:#263244;}
.main-page .el-select__placeholder.is-transparent{color:#b3bdcb;}
.main-page .el-input-number{line-height:28px;}
.main-page .el-input-number .el-input__wrapper{padding-left:6px;padding-right:22px;}
.main-page .el-input-number__decrease,.main-page .el-input-number__increase{width:19px;background:#f5f7fa;border-color:#e8ecf2;color:#6b7789;}
.main-page .el-input-number__decrease:hover,.main-page .el-input-number__increase:hover{color:var(--pp-brand);}
.main-page .el-button{height:28px;padding:0 12px;border-radius:8px;font-size:11px;font-weight:500;}
.main-page .el-button--primary{background:var(--pp-brand);border-color:var(--pp-brand);}
.main-page .el-button--primary:hover{background:var(--pp-brand-hover);border-color:var(--pp-brand-hover);}
.main-page .el-switch{--el-switch-on-color:var(--pp-brand);--el-switch-off-color:#dfe4ec;}
.main-page .el-loading-mask{border-radius:11px;background:rgba(255,255,255,.72);}
.main-page .el-loading-spinner .circular{width:24px;height:24px;}

@media (max-width:560px){
  .main-page{max-width:calc(100vw - 8px);max-height:calc(100vh - 72px);}
  .pp-rail{flex-basis:52px;width:52px;padding:6px 4px;}
  .pp-rail-item{height:48px;}
  .config-panel{padding:10px;}
  .pp-detail-head{top:-10px;margin:-10px -10px 8px;}
}
.pp-icon{display:block;flex:none;}
.pp-dock .pp-head{cursor:default;}
.pp-u-item{border-top:1px solid var(--pp-line-soft);}
.pp-u-item:first-child{border-top:0;}
.pp-u-row{border-top:0;}
.pp-u-item:first-child .pp-u-row{border-top:0;}
.pp-fb-card{border:1px solid var(--pp-line);border-radius:12px;padding:11px;background:#fff;}
.pp-fb-head{display:flex;align-items:center;gap:7px;margin-bottom:9px;}
.pp-fb-head-ico{flex:none;width:26px;height:26px;border-radius:8px;background:var(--pp-brand-weak);color:var(--pp-brand);display:flex;align-items:center;justify-content:center;}
.pp-fb-title{font-size:12.5px;font-weight:600;color:var(--pp-text);}
.pp-fb-head .pp-chip{margin-left:auto;}
.pp-fb-reward{display:flex;align-items:center;gap:7px;margin-bottom:8px;padding:8px 9px;border:1px solid #f4dfbe;border-radius:9px;background:linear-gradient(135deg,#fffaf1,#fff3df);color:#7c4a03;font-size:11px;font-weight:600;line-height:1.4;}
.pp-fb-reward-ico{flex:none;width:22px;height:22px;border-radius:6px;background:#fff1d6;color:#c27803;display:flex;align-items:center;justify-content:center;}
.pp-fb-explain{margin:0 1px 9px;font-size:9.5px;line-height:1.5;color:var(--pp-text-3);}
.pp-fb-qq-hint{margin:4px 1px 0;color:var(--pp-text-4);}
.pp-fb-field{margin-bottom:8px;}
.pp-fb-label{display:flex;align-items:center;gap:3px;margin:0 1px 4px;font-size:10px;font-weight:600;color:#4b5a70;}
.pp-fb-req{color:#d92d20;}
.pp-fb-input{display:block;width:100%;height:30px;padding:0 9px;border:1px solid #e3e8f0;border-radius:8px;background:#fff;font-family:inherit;font-size:11px;color:#263244;outline:none;transition:border-color .15s,box-shadow .15s;}
.pp-fb-input::placeholder,.pp-fb-textarea::placeholder{color:#b3bdcb;}
.pp-fb-input:hover,.pp-fb-area-wrap:hover{border-color:#c9d2e0;}
.pp-fb-input:focus{border-color:var(--pp-brand);box-shadow:0 0 0 3px var(--pp-brand-ring);}
.pp-fb-input.is-bad,.pp-fb-area-wrap.is-bad{border-color:#fecdca;}
.pp-fb-input.is-bad:focus{border-color:#d92d20;box-shadow:0 0 0 3px rgba(217,45,32,.08);}
.pp-fb-input:disabled,.pp-fb-textarea:disabled{background:#f7f9fc;color:#93a0b4;cursor:not-allowed;}
.pp-fb-area-wrap{position:relative;border:1px solid #e3e8f0;border-radius:8px;background:#fff;transition:border-color .15s,box-shadow .15s;}
.pp-fb-area-wrap:focus-within{border-color:var(--pp-brand);box-shadow:0 0 0 3px var(--pp-brand-ring);}
.pp-fb-area-wrap.is-bad:focus-within{border-color:#d92d20;box-shadow:0 0 0 3px rgba(217,45,32,.08);}
.pp-fb-textarea{display:block;width:100%;height:92px;padding:7px 9px 18px;border:0;background:transparent;font-family:inherit;font-size:11px;line-height:1.55;color:#263244;outline:none;resize:none;}
.pp-fb-count{position:absolute;right:8px;bottom:4px;font-size:9px;line-height:1;color:var(--pp-text-3);font-variant-numeric:tabular-nums;pointer-events:none;}
.pp-fb-count.is-over{color:#d92d20;font-weight:600;}
.pp-fb-field-hint{margin:3px 1px 0;font-size:9px;line-height:1.4;color:#d92d20;}
.pp-fb-actions{display:flex;align-items:center;gap:8px;margin-top:9px;}
.pp-fb-submit{flex:1;height:32px;border:0;border-radius:8px;background:var(--pp-brand);color:#fff;font-family:inherit;font-size:11.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:background .15s,opacity .15s;}
.pp-fb-submit:hover:not(:disabled){background:var(--pp-brand-hover);}
.pp-fb-submit:disabled{opacity:.5;cursor:not-allowed;}
.pp-fb-submit.is-loading{background:#4d78d6;}
.pp-fb-success{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:210px;padding:18px 10px;text-align:center;}
.pp-fb-success-ico{width:38px;height:38px;border-radius:50%;background:var(--pp-success-bg);border:1px solid var(--pp-success-line);color:#0f9d58;display:flex;align-items:center;justify-content:center;animation:ppfxPop .32s var(--ppfx-ease-back) both;}
.pp-fb-success b{font-size:12px;font-weight:600;color:var(--pp-text);}
.pp-fb-success-text{max-width:230px;font-size:10px;line-height:1.55;color:var(--pp-text-3);}
.pp-fb-again{margin-top:2px;height:26px;padding:0 12px;border:1px solid var(--pp-line);border-radius:7px;background:#fff;color:var(--pp-brand);font-family:inherit;font-size:10px;font-weight:600;cursor:pointer;}
.pp-fb-again:hover{border-color:#c7d7f5;background:#f8fbff;}
.pp-fb-community{display:flex;width:max-content;align-items:center;justify-content:center;gap:4px;margin:0 auto 2px;font-size:9.5px;line-height:1.4;color:var(--pp-text-3);text-decoration:none;transition:color .15s;}
.pp-fb-community:hover{color:var(--pp-brand);text-decoration:underline;}
.pp-fb-community svg{flex:none;opacity:.8;}
.pp-fb-notice{display:flex;align-items:flex-start;gap:6px;margin-bottom:9px;padding:7px 9px;border:1px solid #dbe8ff;border-radius:8px;background:#f5f9ff;color:#4b5b70;font-size:9.5px;line-height:1.5;}
.pp-fb-notice svg{flex:none;margin-top:1px;color:var(--pp-brand);}
.pp-fb-notice span{flex:1;min-width:0;}
.pp-fb-notice a{color:var(--pp-brand);font-weight:600;text-decoration:none;white-space:nowrap;}
.pp-fb-notice a:hover{text-decoration:underline;}
.pp-fb-cta{display:flex;flex-direction:column;gap:6px;margin-bottom:9px;padding:9px 10px;border:1px solid #dbe8ff;border-radius:9px;background:#f5f9ff;}
.pp-fb-cta b{font-size:11px;font-weight:600;color:#1e3a5f;}
.pp-fb-cta p{margin:0;font-size:9.5px;line-height:1.5;color:#5d6b82;}
.pp-fb-cta-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:30px;border-radius:8px;background:var(--pp-brand);color:#fff;font-size:11px;font-weight:600;text-decoration:none;box-shadow:0 2px 5px rgba(0,82,217,.18);}
.pp-fb-cta-btn:hover{background:var(--pp-brand-hover);color:#fff;}
.pp-fb-cta-btn svg{flex:none;}

.main-page button{transition-property:background,color,border-color,box-shadow,transform;}
.main-page button:not(:disabled):active{transform:scale(.96);}
.main-page button:not(:disabled):active .pp-icon{opacity:.85;}
.main-page .pp-rail-item:not(:disabled):active{transform:scale(.97);}
.main-page .pp-fb-cta-btn:active{transform:scale(.98);}
.main-page :focus-visible{outline:2px solid var(--pp-brand-ring);outline-offset:1px;}
`;

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

  const PP_PUBLIC_UI_CSS = `
.pp-public-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(15,23,42,.38);backdrop-filter:blur(2px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;}
.pp-public-modal{width:min(360px,100%);background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:14px;box-shadow:0 18px 50px -12px rgba(15,23,42,.36),0 2px 8px rgba(15,23,42,.06);overflow:hidden;animation:ppPublicIn .2s ease-out;}
.pp-public-head{display:flex;align-items:flex-start;gap:10px;padding:16px 16px 0;}
.pp-public-ico{width:34px;height:34px;border-radius:10px;background:#eaf1ff;color:#0052d9;display:flex;align-items:center;justify-content:center;font-size:17px;flex:none;}
.pp-public-titles{min-width:0;flex:1;padding-top:1px;}
.pp-public-title{font-size:14px;font-weight:600;line-height:1.35;color:#1b2433;}
.pp-public-sub{margin-top:2px;font-size:10px;line-height:1.4;color:#8a96a8;}
.pp-public-close{width:24px;height:24px;border:0;border-radius:7px;background:transparent;color:#8a96a8;font-size:16px;line-height:24px;cursor:pointer;flex:none;padding:0;}
.pp-public-close:hover{background:#f2f5fa;color:#1b2433;}
.pp-public-body{padding:12px 16px 0;max-height:52vh;overflow:auto;font-size:12px;line-height:1.7;color:#4b5563;white-space:pre-wrap;word-break:break-word;}
.pp-public-notice{white-space:normal;}
.pp-notice-block{padding:11px 12px;border:1px solid #e6ecf5;border-radius:10px;background:#f8fafc;color:#4b5563;font-size:12px;line-height:1.7;white-space:pre-wrap;word-break:break-word;}
.pp-notice-block + .pp-notice-block{margin-top:8px;}
.pp-notice-block a{color:#0052d9;text-decoration:underline;}
.pp-public-version{display:inline-flex;align-items:center;gap:4px;margin-bottom:8px;padding:3px 8px;border-radius:999px;background:#f4f7fb;color:#5d6b82;font-size:10px;font-variant-numeric:tabular-nums;}
.pp-public-danger{margin:8px 0 0;color:#d14343;font-size:11px;line-height:1.6;}
.pp-public-actions{display:flex;gap:8px;padding:14px 16px 16px;}
.pp-public-btn{height:32px;border:0;border-radius:9px;padding:0 14px;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s,color .15s;}
.pp-public-btn.primary{flex:1;background:#0052d9;color:#fff;}
.pp-public-btn.primary:hover{background:#0046c0;}
.pp-public-btn.ghost{background:#f2f5fa;color:#5d6b82;}
.pp-public-btn.ghost:hover{background:#e8eef8;color:#1b2433;}
.pp-public-loading{display:flex;align-items:center;gap:9px;min-width:190px;padding:10px 13px;background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:10px;box-shadow:0 10px 28px -10px rgba(15,23,42,.32);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;}
.pp-public-spinner{width:16px;height:16px;border:2px solid #e6ecf5;border-top-color:#0052d9;border-right-color:#0052d9;border-radius:50%;animation:ppPublicSpin .8s linear infinite;flex:none;}
.pp-public-loading-text{font-size:12px;font-weight:500;color:#374151;white-space:nowrap;}
@keyframes ppPublicSpin{to{transform:rotate(360deg);}}
@keyframes ppPublicIn{from{opacity:0;transform:translateY(4px) scale(.985);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion:reduce){
  .pp-public-overlay,.pp-public-overlay *{animation-duration:.001ms!important;animation-delay:0ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;}
}
`;
  const _ppEnsurePublicStyles = () => {
    try {
      if (document.getElementById("pp-public-ui-styles")) return;
      const style = document.createElement("style");
      style.id = "pp-public-ui-styles";
      style.textContent = PP_PUBLIC_UI_CSS;
      (document.head || document.documentElement).appendChild(style);
    } catch (e) {}
  };
  const _ppPublicEscape = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const _ppInstallClipboardUnlock = () => {
    const EVENTS = ["contextmenu", "selectstart", "copy", "cut", "paste"];
    const installed = new WeakSet();
    const rewriteCipherCopy = (event) => {
      try {
        if (!event || event.type !== "copy") return;
        const target = event.target;
        const path = typeof event.composedPath === "function" ? event.composedPath() : [];
        if (path.some((node) => node && node.id === "chaoxing-helper-root")) return;
        if (target && target.nodeType === 1 && target.closest("input,textarea,[contenteditable='true']")) return;
        const doc = (target && target.ownerDocument) || document;
        const selection = doc.getSelection ? doc.getSelection() : null;
        const text = selection ? String(selection) : "";
        if (!text) return;
        decodeCipherFont(doc);
        const decoded = _ppApplyCipherMap(text, doc);
        if (decoded !== text && event.clipboardData) {
          event.clipboardData.setData("text/plain", decoded);
          event.preventDefault();
        }
      } catch (e) {}
    };
    const stopPageHandler = (event) => {
      rewriteCipherCopy(event);
      try { event.stopImmediatePropagation(); } catch (e) {}
    };
    const installDoc = (doc) => {
      if (!doc || installed.has(doc)) return;
      try {
        installed.add(doc);
        const styleId = "pp-unlock-clipboard-style";
        if (!doc.getElementById(styleId)) {
          const style = doc.createElement("style");
          style.id = styleId;
          style.textContent = "html,body,body *{-webkit-user-select:text!important;-moz-user-select:text!important;user-select:text!important;}";
          (doc.head || doc.documentElement).appendChild(style);
        }
        const win = doc.defaultView;
        if (win) {
          EVENTS.forEach((type) => win.addEventListener(type, stopPageHandler, true));
        }
        EVENTS.forEach((type) => doc.addEventListener(type, stopPageHandler, true));
        const nativeGetSelection = doc.getSelection;
        if (typeof nativeGetSelection === "function" && !doc.__ppSelectionUnlocked) {
          doc.__ppSelectionUnlocked = true;
          doc.getSelection = function () {
            const selection = nativeGetSelection.call(doc);
            if (!selection) return selection;
            try {
              return new Proxy(selection, {
                get(target, prop) {
                  if (prop === "removeAllRanges") return function () {};
                  const value = target[prop];
                  return typeof value === "function" ? value.bind(target) : value;
                }
              });
            } catch (e) {
              return selection;
            }
          };
        }
        try {
          doc.querySelectorAll("iframe").forEach((frame) => {
            try {
              if (frame.contentDocument) installDoc(frame.contentDocument);
            } catch (e) {}
          });
        } catch (e) {}
      } catch (e) {}
    };
    const scan = () => {
      try {
        installDoc((_unsafeWindow && _unsafeWindow.document) || document);
        const root = (_unsafeWindow && _unsafeWindow.document) || document;
        root.querySelectorAll("iframe").forEach((frame) => {
          try {
            if (frame.contentDocument) installDoc(frame.contentDocument);
          } catch (e) {}
        });
      } catch (e) {}
    };
    scan();
    setInterval(scan, 2000);
  };
  _ppInstallClipboardUnlock();

  const _PP_LOADING_WINDOW = (() => {
    let el = null;
    const show = () => {
      try {
        if (el || document.getElementById('pp-script-loading-window') || document.getElementById('cloud-script-loading-window')) return;
        const create = () => {
          if (el) return;
          _ppEnsurePublicStyles();
          el = document.createElement('div');
          el.id = 'pp-script-loading-window';
          el.innerHTML = '<div class="pp-public-loading"><span class="pp-public-spinner"></span><span class="pp-public-loading-text">正在加载网课小助手</span></div>';
          el.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;animation:ppPublicIn .22s ease-out;';
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
        node.style.transition = 'opacity 0.22s ease';
        node.style.opacity = '0';
        setTimeout(() => {
          try { node.remove(); } catch (e) {}
        }, 220);
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

  const ppJudgeKey = (text) => {
    const key = String(text == null ? "" : text)
      .replace(/^[A-Ha-h]\s*[.、．:：)）]\s*/, "")
      .replace(/[\s，。！？、；：""''“”‘’（）【】,.!?;:'"()\[\]]/g, "")
      .toLowerCase();
    if (["对", "正确", "√", "✓", "是", "对的", "是的", "正确的", "确定", "true", "t", "yes", "1"].includes(key)) return "T";
    if (["错", "错误", "×", "✗", "否", "错的", "不对", "不是", "不是的", "不正确", "不正确的", "非", "false", "f", "no", "0"].includes(key)) return "F";
    return "";
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
  let PP_WELFARE_OFFER = null;


  let globalScriptDescription = null;


  const triggerWelfarePromo = () => {
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
      const welfare = data?.data?.welfare;
      if (welfare) {
        PP_WELFARE_OFFER = welfare.enabled === false ? null : welfare;
      } else if (typeof data?.data?.extraCode === 'string' && data.data.extraCode) {
        PP_WELFARE_OFFER = {
          enabled: true,
          bonus: 30,
          title: "专属福利",
          text: "赞助加赠 30% 额度",
          plans: [],
          link: SPONSOR_URL
        };
      }
      window.__PP_WELFARE__ = PP_WELFARE_OFFER;
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

  const PP_UPDATE_STATE = vue.reactive({
    available: false,
    latestVersion: "",
    updateUrl: "https://scriptcat.org/zh-CN/script-show-page/5597",
    message: ""
  });
  const checkScriptUpdate = () => {
    try {
      if (window.__CLOUD_SCRIPT_LOADED__) return;
      if (typeof _GM_xmlhttpRequest !== "function") return;
      const currentVersion = getScriptInfo().version;
      _GM_xmlhttpRequest({
        method: "GET",
        url: 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C.meta.js?t=' + Date.now(),
        timeout: 5000,
        onload: (response) => {
          try {
            const versionMatch = response.responseText.match(/\/\/\s*@version\s+(\d+\.\d+\.\d+)/);
            if (!versionMatch || !versionMatch[1]) return;
            const latestVersion = versionMatch[1];
            if (compareVersion(currentVersion, latestVersion) < 0) {
              PP_UPDATE_STATE.latestVersion = latestVersion;
              PP_UPDATE_STATE.updateUrl = "https://scriptcat.org/zh-CN/script-show-page/5597";
              PP_UPDATE_STATE.message = "有新版本可用，点击更新";
              PP_UPDATE_STATE.available = true;
            } else {
              PP_UPDATE_STATE.available = false;
            }
          } catch (e) {}
        }
      });
    } catch (e) {}
  };






  const useConfigStore = pinia.defineStore("configStore", {
    state: () => {
      const scriptInfo = getScriptInfo();
      const defaultConfig = {
        version: scriptInfo.version,
        isMinus: false,
        autoMode: false,
        dockMode: false,
        uiScale: 100,
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
                name: "模式设置",
                params: [
                  { name: "正常模式", value: true, type: "boolean", exclusiveGroup: "zhs_mode" },
                  { name: "仅答题", value: false, type: "boolean", exclusiveGroup: "zhs_mode" },
                  { name: "仅视频", value: false, type: "boolean", exclusiveGroup: "zhs_mode" }
                ]
              },
              {
                name: "视频设置",
                params: [
                  { name: "正常播放", value: true, type: "boolean", locked: true },
                  { name: "自动倍速", value: false, type: "boolean", breakBefore: true },
                  { name: "弹题作答", value: true, type: "boolean" },
                  { name: "忽略习惯弹窗", value: false, type: "boolean" },
                  { name: "播放倍速", value: 1, type: "number", min: 1, max: 1.5, step: 0.5 }
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
          },
          ykt: {
            name: `网课小助手-飘飘友情提供 v${scriptInfo.version}`,
            parts: [
              {
                name: "模式设置",
                params: [
                  { name: "仅视频", value: true, type: "boolean", exclusiveGroup: "ykt_mode" },
                  { name: "复习模式", value: false, type: "boolean", exclusiveGroup: "ykt_mode" }
                ]
              },
              {
                name: "视频设置",
                params: [
                  { name: "自动播放", value: true, type: "boolean" },
                  { name: "手动倍速", value: true, type: "boolean", exclusiveGroup: "ykt_rate" },
                  { name: "自动倍速", value: false, type: "boolean", exclusiveGroup: "ykt_rate" },
                  { name: "突破倍速", value: false, type: "boolean", exclusiveGroup: "ykt_rate" },
                  { name: "播放倍速", value: 1.5, type: "number", min: 1, max: 8 }
                ]
              },
              {
                name: "任务设置",
                params: [
                  { name: "自动评论", value: false, type: "boolean" },
                  { name: "自动切换", value: true, type: "boolean" }
                ]
              }
            ]
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

            try {
              const zhsParts = globalConfig.platformParams?.zhs?.parts;
              if (Array.isArray(zhsParts)) {
                const settingIdx = zhsParts.findIndex((p) => p.name === "答题设置");
                if (settingIdx >= 0) zhsParts.splice(settingIdx, 1);
                if (!zhsParts.some((p) => p.name === "模式设置")) {
                  zhsParts.unshift({
                    name: "模式设置",
                    params: [{ name: "答题", value: true, type: "boolean", exclusiveGroup: "zhs_mode" }]
                  });
                }
              }
            } catch (e) {}

            try {
              const yktParts = globalConfig.platformParams?.ykt?.parts;
              if (Array.isArray(yktParts)) {
                const videoPart = yktParts.find((p) => p.name === "视频设置");
                let legacyReview = false;
                if (videoPart && Array.isArray(videoPart.params)) {
                  const idx = videoPart.params.findIndex((p) => p.name === "复习模式");
                  if (idx >= 0) {
                    legacyReview = Boolean(videoPart.params[idx].value);
                    videoPart.params.splice(idx, 1);
                  }
                }
                let modePart = yktParts.find((p) => p.name === "模式设置");
                if (!modePart) {
                  modePart = { name: "模式设置", params: [] };
                  yktParts.unshift(modePart);
                }
                if (!Array.isArray(modePart.params)) modePart.params = [];
                const legacyNormal = modePart.params.find((p) => p.name === "正常模式");
                if (legacyNormal) {
                  legacyNormal.name = "仅视频";
                  legacyNormal.exclusiveGroup = "ykt_mode";
                }
                if (!modePart.params.some((p) => p.name === "仅视频")) {
                  modePart.params.push({ name: "仅视频", value: !legacyReview, type: "boolean", exclusiveGroup: "ykt_mode" });
                }
                if (!modePart.params.some((p) => p.name === "复习模式")) {
                  modePart.params.push({ name: "复习模式", value: legacyReview, type: "boolean", exclusiveGroup: "ykt_mode" });
                }
                const videoPartCfg = yktParts.find((p) => p.name === "视频设置");
                if (videoPartCfg && Array.isArray(videoPartCfg.params)) {
                  const speedParam = videoPartCfg.params.find((p) => p.name === "播放倍速");
                  if (speedParam) speedParam.max = 8;
                  const autoRateParam = videoPartCfg.params.find((p) => p.name === "自动倍速");
                  if (autoRateParam) {
                    if (!autoRateParam.exclusiveGroup) autoRateParam.exclusiveGroup = "ykt_rate";
                  } else {
                    videoPartCfg.params.push({ name: "自动倍速", value: false, type: "boolean", exclusiveGroup: "ykt_rate" });
                  }
                  if (!videoPartCfg.params.some((p) => p.name === "突破倍速")) {
                    const autoIdx = videoPartCfg.params.findIndex((p) => p.name === "自动倍速");
                    const breakParam = { name: "突破倍速", value: false, type: "boolean", exclusiveGroup: "ykt_rate" };
                    if (autoIdx >= 0) {
                      videoPartCfg.params.splice(autoIdx + 1, 0, breakParam);
                    } else {
                      videoPartCfg.params.push(breakParam);
                    }
                  }
                  if (!videoPartCfg.params.some((p) => p.name === "手动倍速")) {
                    const autoIdx2 = videoPartCfg.params.findIndex((p) => p.name === "自动倍速");
                    const manualParam = { name: "手动倍速", value: true, type: "boolean", exclusiveGroup: "ykt_rate" };
                    if (autoIdx2 >= 0) {
                      videoPartCfg.params.splice(autoIdx2, 0, manualParam);
                    } else {
                      videoPartCfg.params.push(manualParam);
                    }
                  }
                }
                const taskPart = yktParts.find((p) => p.name === "任务设置");
                if (taskPart && Array.isArray(taskPart.params)) {
                  const legacyComment = taskPart.params.find((p) => p.name === "自动讨论评论");
                  if (legacyComment) legacyComment.name = "自动评论";
                  if (!taskPart.params.some((p) => p.name === "自动切换")) {
                    taskPart.params.push({ name: "自动切换", value: true, type: "boolean" });
                  }
                }
              }
            } catch (e) {}



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
            if (globalConfig.platformParams && !globalConfig.platformParams.ykt) {
              globalConfig.platformParams.ykt = defaultConfig.platformParams.ykt;
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
      try {
        const yktVideoPart = globalConfig.platformParams?.ykt?.parts?.find((p) => p.name === "视频设置");
        const rateParams = (yktVideoPart?.params || []).filter((p) => p.exclusiveGroup === "ykt_rate");
        if (!globalConfig.yktRateDefaultMigrated) {
          const autoRateParam = rateParams.find((p) => p.name === "自动倍速");
          if (autoRateParam) autoRateParam.value = false;
          const manualRateParam = rateParams.find((p) => p.name === "手动倍速");
          if (manualRateParam) manualRateParam.value = true;
          globalConfig.yktRateDefaultMigrated = true;
        }
        const active = rateParams.filter((p) => p.value);
        if (active.length > 1) {
          const keep = active.find((p) => p.name !== "手动倍速") || active[0];
          rateParams.forEach((p) => { p.value = p.name === keep.name; });
        }
        const speedParamYkt = yktVideoPart?.params?.find((p) => p.name === "播放倍速");
        if (speedParamYkt) {
          const manualOn = rateParams.some((p) => p.name === "手动倍速" && p.value);
          const breakOn = rateParams.some((p) => p.name === "突破倍速" && p.value);
          const limit = breakOn ? 8 : manualOn ? 2 : 8;
          speedParamYkt.max = limit;
          if (Number(speedParamYkt.value) > limit) speedParamYkt.value = limit;
        }
      } catch (e) {}
      try {
        const platforms = globalConfig.platformParams || {};
        let afkValue = false;
        Object.keys(platforms).forEach((key) => {
          const parts = platforms[key] && platforms[key].parts;
          if (!Array.isArray(parts)) return;
          parts.forEach((part) => {
            (part.params || []).forEach((param) => {
              if (param.name === "激活挂机" && param.value === true) afkValue = true;
            });
          });
          for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i];
            if (part.name === "通用设置") {
              parts.splice(i, 1);
              continue;
            }
            if (Array.isArray(part.params)) {
              const idx = part.params.findIndex((p) => p.name === "激活挂机");
              if (idx >= 0) part.params.splice(idx, 1);
            }
          }
        });
        const sharedAfkParam = { name: "激活挂机", value: afkValue, type: "boolean" };
        Object.keys(platforms).forEach((key) => {
          const parts = platforms[key] && platforms[key].parts;
          if (!Array.isArray(parts)) return;
          let modePart = parts.find((p) => p.name === "模式设置");
          if (!modePart) {
            modePart = { name: "模式设置", params: [] };
            parts.unshift(modePart);
          }
          if (!Array.isArray(modePart.params)) modePart.params = [];
          modePart.params.push(sharedAfkParam);
        });
      } catch (e) {}
      if (![100, 125, 150].includes(Number(globalConfig.uiScale))) globalConfig.uiScale = 100;
      _GM_setValue("globalConfig", JSON.stringify(globalConfig));
      return globalConfig;
    },
    actions: {}
  });




  let ppfxLogSeq = 0;
  const useLogStore = pinia.defineStore("logStore", {
    state: () => ({
      logList: []
    }),
    actions: {
      addLog(message, type) {
        const MAX_LOG_SIZE = 500;
        const log = {
          id: ++ppfxLogSeq,
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
      speedDisabled: false,
      questionIndex: 0,
      questionTotal: 0,
      filledCount: 0,
      fillRate: 0,
      remainingCount: null
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
        if (progress.questionIndex !== undefined) this.questionIndex = Math.max(0, Number(progress.questionIndex) || 0);
        if (progress.questionTotal !== undefined) this.questionTotal = Math.max(0, Number(progress.questionTotal) || 0);
        if (progress.filledCount !== undefined) this.filledCount = Math.max(0, Number(progress.filledCount) || 0);
        if (progress.fillRate !== undefined) this.fillRate = Math.min(100, Math.max(0, Number(progress.fillRate) || 0));
        if (progress.remainingCount !== undefined) this.remainingCount = progress.remainingCount === null ? null : Math.max(0, Number(progress.remainingCount) || 0);
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
        this.questionIndex = 0;
        this.questionTotal = 0;
        this.filledCount = 0;
        this.fillRate = 0;
        this.remainingCount = null;
      }
    }
  });

  const PP_ICONS = Object.freeze({
    home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z",
    list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
    sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 4v6M9 14v6",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z",
    heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z",
    search: "M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z",
    key: "M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 8h9M18 8v3M21 8v2",
    check: "M20 6 9 17l-5-5",
    alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
    server: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01",
    wifi: "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
    chevronDown: "M6 9l6 6 6-6",
    chevronRight: "M9 18l6-6-6-6",
    chevronLeft: "M15 18l-6-6 6-6",
    arrowDown: "M12 5v14M6 13l6 6 6-6",
    x: "M18 6 6 18M6 6l12 12",
    trash: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
    refresh: "M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6",
    external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
    sidebar: "M3 4h18v16H3zM9 4v16",
    spark: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1",
    message: "M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    play: "M8 5v14l11-7z",
    gift: "M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
    zap: "M13 2 4 14h7l-1 8 9-12h-7z"
  });

  const PpIcon = vue.defineComponent({
    name: "PpIcon",
    props: {
      name: { type: String, required: true },
      size: { type: [Number, String], default: 15 }
    },
    setup(props) {
      return () => vue.h("svg", {
        class: "pp-icon",
        viewBox: "0 0 24 24",
        width: props.size,
        height: props.size,
        fill: props.name === "play" ? "currentColor" : "none",
        stroke: props.name === "play" ? "none" : "currentColor",
        "stroke-width": 1.8,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "aria-hidden": "true"
      }, [vue.h("path", { d: PP_ICONS[props.name] || "" })]);
    }
  });

  const ppIcon = (name, size) => vue.h(PpIcon, { name, size: size || 15 });

  const PP_LOGO_SOURCES = [
    "https://scriptcat.org/api/v2/scripts/5597/icon/thumb/64?t=1793777938",
    "https://tuchuang-1310788589.cos.ap-guangzhou.myqcloud.com/_selftest/icon.webp"
  ];
  let ppLogoSourceIndex = 0;
  const PpLogo = vue.defineComponent({
    name: "PpLogo",
    props: { size: { type: Number, default: 30 } },
    setup(props) {
      const sourceIndex = vue.ref(ppLogoSourceIndex);
      return () => vue.h("span", {
        class: "pp-logo",
        style: {
          width: props.size + "px",
          height: props.size + "px",
          "--pp-logo-font": Math.round(props.size * 0.5) + "px"
        }
      }, [
        vue.h("i", { class: "pp-logo-fallback" }, "P"),
        sourceIndex.value < PP_LOGO_SOURCES.length
          ? vue.h("img", {
              key: sourceIndex.value,
              class: "pp-logo-img",
              src: PP_LOGO_SOURCES[sourceIndex.value],
              alt: "",
              draggable: false,
              referrerpolicy: "no-referrer",
              onError: () => {
                ppLogoSourceIndex = Math.min(ppLogoSourceIndex + 1, PP_LOGO_SOURCES.length);
                sourceIndex.value = ppLogoSourceIndex;
              }
            })
          : null
      ]);
    }
  });

  const ppIconBtn = (opts) => vue.h("button", {
    type: "button",
    class: ["pp-iconbtn", opts.active ? "pp-on" : ""],
    title: opts.tip || "",
    disabled: !!opts.disabled,
    onClick: opts.onClick
  }, [ppIcon(opts.icon, opts.size || 15)]);

  const ppChip = (label, opts) => {
    const o = opts || {};
    const children = [];
    if (o.dot) children.push(vue.h("span", { class: ["pp-dot", o.dot === "on" ? "on" : ""] }));
    if (o.icon) children.push(ppIcon(o.icon, 11));
    children.push(vue.h("span", null, label));
    return vue.h("span", { class: ["pp-chip", o.tone || ""], title: o.title || "" }, children);
  };

  const ppPill = (label, cls) => vue.h("span", { class: ["pp-pill", cls || ""] }, label);

  const ppHint = (text, opts) => {
    const o = opts || {};
    return vue.h("div", { class: ["pp-hint", o.tone || ""] }, [
      ppIcon(o.icon || "info", 11),
      vue.h("span", null, text)
    ]);
  };

  const ppEmpty = (opts) => {
    const o = opts || {};
    return vue.h("div", { class: "pp-empty" }, [
      vue.h("span", { class: "pp-empty-ico" }, ppIcon(o.icon || "message", 18)),
      vue.h("b", null, o.title || "暂无内容"),
      o.desc ? vue.h("span", null, o.desc) : null
    ]);
  };

  const ppRow = (label, control, opts) => {
    const o = opts || {};
    return vue.h("div", { class: ["pp-row", o.off ? "is-off" : ""] }, [
      vue.h("div", { class: "pp-row-label" }, [
        vue.h("span", null, label),
        o.unit ? vue.h("span", { class: "pp-unit" }, o.unit) : null,
        o.muted ? vue.h("span", { class: "pp-muted" }, o.muted) : null
      ]),
      vue.h("div", { class: "pp-row-control" }, control)
    ]);
  };

  const ppSeg = (options, value, onPick, opts) => {
    const o = opts || {};
    return vue.h("div", { class: "pp-seg" }, options.map((item) => vue.h("button", {
      type: "button",
      class: ["pp-seg-btn", item.value === value ? "active" : ""],
      disabled: !!o.disabled || !!item.disabled,
      onClick: () => {
        if (item.value !== value) onPick(item.value);
      }
    }, item.label)));
  };

  const ppDoc = (title, icon, children) => vue.h("section", { class: "pp-doc" }, [
    vue.h("div", { class: "pp-doc-title" }, [ppIcon(icon, 13), vue.h("span", null, title)]),
    vue.h("div", { class: "pp-prose" }, children)
  ]);

  const ppFormatTime = (seconds) => {
    const safe = Number(seconds) || 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  };

  const StatusCard = vue.defineComponent({
    name: "StatusCard",
    setup() {
      const progress = useProgressStore();
      const questionStore = useQuestionStore();
      const ppfxPctMs = 320;
      const ppfxReadPct = () => Math.min(100, Math.max(0, Math.round(Number(progress.percent) || 0)));
      const ppfxPctShown = vue.ref(ppfxReadPct());
      let ppfxPctRaf = 0;
      let ppfxPctFrom = ppfxPctShown.value;
      let ppfxPctTo = ppfxPctShown.value;
      let ppfxPctStart = -1;
      const ppfxPctStop = () => {
        if (ppfxPctRaf) cancelAnimationFrame(ppfxPctRaf);
        ppfxPctRaf = 0;
        ppfxPctStart = -1;
      };
      const ppfxPctStep = (ts) => {
        if (ppfxPctStart < 0) ppfxPctStart = ts;
        const ppfxT = Math.min(1, (ts - ppfxPctStart) / ppfxPctMs);
        const ppfxEased = 1 - Math.pow(1 - ppfxT, 3);
        ppfxPctShown.value = Math.round(ppfxPctFrom + (ppfxPctTo - ppfxPctFrom) * ppfxEased);
        if (ppfxT < 1) {
          ppfxPctRaf = requestAnimationFrame(ppfxPctStep);
        } else {
          ppfxPctRaf = 0;
          ppfxPctShown.value = ppfxPctTo;
        }
      };
      const ppfxPctTween = (next) => {
        if (ppfxPctRaf && next === ppfxPctTo) return;
        ppfxPctStop();
        ppfxPctTo = next;
        if (next === ppfxPctShown.value) return;
        try {
          if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            ppfxPctShown.value = next;
            return;
          }
        } catch (error) {}
        ppfxPctFrom = ppfxPctShown.value;
        ppfxPctRaf = requestAnimationFrame(ppfxPctStep);
      };
      const ppfxBarStyle = () => ({
        "--ppfx-p": (Math.min(100, Math.max(0, Number(progress.percent) || 0)) / 100).toFixed(4)
      });
      vue.watch(ppfxReadPct, (next) => {
        ppfxPctTween(next);
      });
      vue.onUnmounted(ppfxPctStop);
      return () => {
        const answerTotal = Number(progress.questionTotal) || 0;
        const answering = progress.type === "答题" && (progress.isPlaying || answerTotal > 0);
        if (answering) {
          const index = Math.min(Number(progress.questionIndex) || 0, answerTotal);
          const answered = questionStore.questionList.length;
          return vue.h("div", { class: "pp-progress" }, [
            vue.h("div", { class: "pp-progress-top" }, [
              vue.h("div", { class: "pp-task", title: progress.taskName }, progress.taskName || "答题中"),
              vue.h("div", { class: "pp-pct" }, ppfxPctShown.value + "%")
            ]),
            vue.h("div", { class: "pp-bar" }, [
              vue.h("i", { style: ppfxBarStyle() })
            ]),
            vue.h("div", { class: "pp-meta" }, [
              vue.h("span", null, ["题目 ", vue.h("b", null,
                answerTotal > 0 ? "第 " + index + " / " + answerTotal + " 题" : "已答 " + answered + " 题")]),
              vue.h("span", null, progress.isPlaying ? "答题中" : (progress.detail || "已完成"))
            ])
          ]);
        }
        const hasMediaProgress = (progress.type === "视频" || progress.type === "音频") && Number(progress.totalTime) > 0;
        if (!progress.isPlaying && !hasMediaProgress) {
          return vue.h("div", { class: "pp-idle" }, [
            vue.h("span", { class: "pp-idle-ico" }, ppIcon("play", 13)),
            vue.h("div", { class: "pp-idle-txt" }, [
              vue.h("b", null, "等待任务开始"),
              vue.h("span", { title: progress.detail },
                progress.detail && progress.detail !== "等待任务开始"
                  ? progress.detail
                  : "进入课程章节或答题页面后自动运行"
              )
            ])
          ]);
        }
        return vue.h("div", { class: "pp-progress" }, [
          vue.h("div", { class: "pp-progress-top" }, [
            vue.h("div", { class: "pp-task", title: progress.taskName }, progress.taskName || "正在处理"),
            vue.h("div", { class: "pp-pct" }, ppfxPctShown.value + "%")
          ]),
          vue.h("div", { class: "pp-bar" }, [
            vue.h("i", { style: ppfxBarStyle() })
          ]),
          vue.h("div", { class: "pp-meta" }, [
            vue.h("span", null, ["类型 ", vue.h("b", null, progress.type || "-")]),
            vue.h("span", null, ppFormatTime(progress.currentTime) + " / " + ppFormatTime(progress.totalTime))
          ]),
          progress.speedDisabled
            ? ppHint("此视频已禁用倍速，>1x 可能导致进度被清空", { tone: "warn", icon: "alert" })
            : null
        ]);
      };
    }
  });
  const _sfc_main$8 = vue.defineComponent({
    name: "ScriptHome",
    props: {
      logList: { type: Array, required: true },
      serverConfig: {
        type: Object,
        default: () => ({ url: "", location: "未知", color: "#888" })
      }
    },
    setup(props) {
      const progress = useProgressStore();
      const logs = useLogStore();
      const config = useConfigStore();
      const modeLabel = vue.computed(() => {
        const platform = config.platformParams?.[config.platformName];
        const part = platform?.parts?.find((p) => p.name === "模式设置");
        const active = part?.params?.find((p) => p.value);
        return active ? active.name : "默认模式";
      });
      const listRef = vue.ref(null);
      const scrollBottom = () => {
        const el = listRef.value;
        if (el) el.scrollTop = el.scrollHeight;
      };
      vue.watch(
        () => (props.logList.length ? (props.logList[props.logList.length - 1].id || props.logList.length) : 0),
        () => vue.nextTick(scrollBottom),
        { flush: "post" }
      );
      vue.onMounted(scrollBottom);
      const clearLogs = () => {
        logs.logList.splice(0, logs.logList.length);
      };
      let ppfxLastLogId = -1;
      let ppfxNewLogId = null;
      if (props.logList.length) {
        const ppfxTail0 = props.logList[props.logList.length - 1];
        ppfxLastLogId = ppfxTail0 && ppfxTail0.id != null ? ppfxTail0.id : -1;
      }
      const ppfxMarkNewLog = () => {
        const ppfxLen = props.logList.length;
        if (!ppfxLen) return;
        const ppfxTail = props.logList[ppfxLen - 1];
        const ppfxId = ppfxTail && ppfxTail.id != null ? ppfxTail.id : null;
        if (ppfxId !== null && ppfxId !== ppfxLastLogId) {
          ppfxLastLogId = ppfxId;
          ppfxNewLogId = ppfxId;
        }
      };
      const renderLog = (item, index) => {
        if (index === props.logList.length - 1) ppfxMarkNewLog();
        return vue.h("div", {
          class: "pp-log-item",
          key: item.id != null ? "ppfx-log-" + item.id : "ppfx-log-i" + index,
          "data-t": item.type || "primary",
          "data-new": item.id != null && item.id === ppfxNewLogId ? "1" : null
        }, [
          vue.h("span", { class: "pp-log-time" }, item.time),
          vue.h("span", { class: "pp-log-msg", innerHTML: item.message })
        ]);
      };
      return () => vue.h("div", { class: "pp-home" }, [
        vue.h("div", { class: "pp-statusrow" }, [
          ppChip("服务器 · " + (props.serverConfig.location || "未知"), { icon: "server" }),
          ppChip("已连接", { tone: "ok", dot: "on" }),
          ppChip(modeLabel.value, { icon: "sliders" })
        ]),
        vue.h(StatusCard),
        vue.h("section", { class: "pp-logs" }, [
          vue.h("div", { class: "pp-log-head" }, [
            vue.h("span", { class: "pp-log-title" }, "运行日志"),
            vue.h("span", { class: "pp-log-count" }, props.logList.length),
            vue.h("div", { class: "pp-log-actions" }, [
              ppIconBtn({ icon: "arrowDown", tip: "滚动到底部", size: 14, onClick: scrollBottom }),
              ppIconBtn({ icon: "trash", tip: "清空日志", size: 14, onClick: clearLogs })
            ])
          ]),
          vue.h("div", { class: "pp-log-list", ref: listRef },
            props.logList.length
              ? props.logList.map(renderLog)
              : ppEmpty({ icon: "message", title: "暂无日志", desc: "任务开始后，运行记录会显示在这里" })
          )
        ])
      ]);
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


      const debounce = (fn, delay) => {
        let timer = null;
        return (...args) => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => fn(...args), delay);
        };
      };


      const autoVerifyToken = debounce(() => {

        const currentToken = vue.unref(configStore).queryApis[0].token;


        if (!currentToken || !/^\d{16}$|^\d{24}$/.test(currentToken)) {

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

        } else if (!/^\d{16}$|^\d{24}$/.test(token)) {

          logStore.addLog('❌ Token格式错误，必须是24位数字', 'danger');
          verifyState.value = { status: 'error', message: 'Token格式错误，必须是24位数字' };
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

              if (res.data?.sponsorUrl) {
                SPONSOR_URL = res.data.sponsorUrl;
                const isFreeTokenWithBalance =
                  res.code === 200 &&
                  res.data.valid &&
                  Number(res.data.num) > 0 &&
                  (res.data.newToken || res.data.isNew || res.data.planCode === 'free');
                if (!isFreeTokenWithBalance) triggerWelfarePromo();
              }

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
                    showUpdateDialog(latestVersion, updateUrl, updateMessage, currentVersion);
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


      const showUpdateDialog = (latestVersion, updateUrl, updateMessage, currentVersion) => {
        try {
          if (document.getElementById("update-dialog")) return;
          _ppEnsurePublicStyles();
          const current = currentVersion || _GM_info?.script?.version || "";
          const dialog = document.createElement("div");
          dialog.id = "update-dialog";
          dialog.innerHTML = `
            <div class="pp-public-overlay">
              <div class="pp-public-modal" role="dialog" aria-modal="true" aria-label="发现新版本">
                <div class="pp-public-head">
                  <span class="pp-public-ico">↑</span>
                  <div class="pp-public-titles">
                    <div class="pp-public-title">发现新版本</div>
                    <div class="pp-public-sub">网课小助手 · v${_ppPublicEscape(latestVersion)}</div>
                  </div>
                </div>
                <div class="pp-public-body">
                  <div class="pp-public-version">当前 v${_ppPublicEscape(current)} → 最新 v${_ppPublicEscape(latestVersion)}</div>
                  <div>${_ppPublicEscape(updateMessage || "请更新至最新版本后继续使用")}</div>
                  <p class="pp-public-danger">旧版本已停止使用，必须更新后才能继续使用</p>
                </div>
                <div class="pp-public-actions">
                  <button id="update-btn" class="pp-public-btn primary" type="button">立即更新</button>
                </div>
              </div>
            </div>
          `;
          document.body.appendChild(dialog);
          document.getElementById("update-btn").onclick = () => window.open(updateUrl, "_blank");
        } catch (e) {}
      };

      vue.onMounted(async () => {
        checkUpdate();
        verifyToken();
      });

      const uiView = vue.ref("index");
      const activePartName = vue.ref("");
      const parts = vue.computed(() => configStore.platformParams?.[configStore.platformName]?.parts || []);
      const token = vue.computed(() => configStore.queryApis?.[0]?.token || "");

      const PART_ICONS = {
        "模式设置": "sliders",
        "视频设置": "play",
        "答题参数": "spark",
        "章节/作业/测验设置": "list",
        "考试设置": "shield",
        "任务设置": "check",
        "答题设置": "spark"
      };
      const GROUP_TITLES = {
        cx_mode: "运行模式",
        zhs_mode: "运行模式",
        ykt_mode: "运行模式",
        playMode: "播放方式",
        ykt_rate: "倍速方式",
        mode: "答题方式"
      };
      const PARAM_UNITS = {
        "播放倍速": "x",
        "正确阈值": "%",
        "答题间隔": "秒"
      };
      const PART_DESCS = {
        "模式设置": "选择脚本在当前页面的运行方式，模式之间互斥。",
        "视频设置": "控制播放方式、倍速与视频内答题行为。",
        "答题参数": "选择题库 / AI 答题策略，并控制消耗与准确率。",
        "章节/作业/测验设置": "控制章节测验、作业的提交与自动切换。",
        "考试设置": "控制考试页面的自动切换行为。",
        "任务设置": "控制雨课堂任务的评论与自动切换。",
        "答题设置": "控制智慧树的答题行为。"
      };
      const MODE_DESCS = {
        "正常模式": "自动播放视频并完成章节测验，适合日常刷课。",
        "仅视频": "只处理视频进度，不参与任何答题。",
        "仅答题": "只完成章节测验、作业或考试，不主动播放视频。",
        "复习模式": "重新完成已学内容，适合考前复习。",
        "答题": "开启后执行智慧树答题。"
      };

      const hasParam = (part, name) => part.params.some((p) => p.name === name);
      const getParam = (part, name) => part.params.find((p) => p.name === name);
      const aiActive = (part) => !!(getParam(part, "AI模式") && getParam(part, "AI模式").value);
      const hasAiBlock = (part) => !!getParam(part, "AI 类型选择") && !!getParam(part, "AI 模型选择");

      const isParamDisabled = (part, param) => {
        if (param.locked) return true;
        if (!param.dependsOn) return false;
        const parent = getParam(part, param.dependsOn.param);
        return !parent || parent.value !== param.dependsOn.value;
      };

      const boolGroups = (part) => {
        const groups = new Map();
        part.params.forEach((p) => {
          if (p.type !== "boolean" || !p.exclusiveGroup) return;
          if (!groups.has(p.exclusiveGroup)) groups.set(p.exclusiveGroup, []);
          groups.get(p.exclusiveGroup).push(p);
        });
        return groups;
      };

      const groupTitle = (part, group) => {
        if (part.name === "模式设置") return "";
        return GROUP_TITLES[group] || "选项";
      };

      const looseParams = (part) => {
        const skip = new Set(["AI 类型选择", "AI 模型选择", "联网搜索"]);
        return part.params.filter((p) => !(p.type === "boolean" && p.exclusiveGroup) && !skip.has(p.name));
      };

      const applyBool = (part, param, next) => {
        if (param.dependsOn) {
          const parent = getParam(part, param.dependsOn.param);
          if (parent && parent.value !== param.dependsOn.value) {
            if (next) return;
            param.value = next;
            return;
          }
        }
        if (param.exclusiveGroup) {
          const others = part.params.filter((p) =>
            p.type === "boolean" && p.exclusiveGroup === param.exclusiveGroup && p.name !== param.name
          );
          if (next) {
            others.forEach((other) => {
              other.value = false;
              part.params.filter((p) => p.type === "boolean" && p.dependsOn && p.dependsOn.param === other.name)
                .forEach((dp) => { dp.value = false; });
            });
          } else if (!others.some((other) => other.value)) {
            return;
          }
        }
        param.value = next;

        if ((param.name === "模拟播放" || param.name === "正常播放") && next) {
          const speedParam = getParam(part, "播放倍速");
          if (speedParam) {
            if (param.name === "模拟播放") {
              const autoMax = getParam(part, "自动倍速")?.value || false;
              if (autoMax) {
                let maxRate = window.__maxPlaybackRate;
                if (!maxRate) {
                  try {
                    const iframes = document.querySelectorAll("iframe");
                    for (const iframe of iframes) {
                      try {
                        if (iframe.contentDocument) {
                          const items = iframe.contentDocument.querySelectorAll(".vjs-playback-rate .vjs-menu-content .vjs-menu-item");
                          if (items.length > 0) {
                            maxRate = 1;
                            items.forEach((mi) => {
                              const rate = parseFloat(String(mi.textContent).trim().replace("x", ""));
                              if (!isNaN(rate) && rate > maxRate) maxRate = rate;
                            });
                            window.__maxPlaybackRate = maxRate;
                            break;
                          }
                        }
                      } catch (e) { continue; }
                    }
                  } catch (e) {}
                }
                speedParam.max = maxRate || 3;
              } else {
                speedParam.max = 3;
              }
              if (speedParam.value > speedParam.max) speedParam.value = speedParam.max;
            } else {
              let maxRate = window.__maxPlaybackRate;
              if (!maxRate) {
                try {
                  const iframes = document.querySelectorAll("iframe");
                  for (const iframe of iframes) {
                    try {
                      if (iframe.contentDocument) {
                        const items = iframe.contentDocument.querySelectorAll(".vjs-playback-rate .vjs-menu-content .vjs-menu-item");
                        if (items.length > 0) {
                          maxRate = 1;
                          items.forEach((mi) => {
                            const rate = parseFloat(String(mi.textContent).trim().replace("x", ""));
                            if (!isNaN(rate) && rate > maxRate) maxRate = rate;
                          });
                          window.__maxPlaybackRate = maxRate;
                          break;
                        }
                      }
                    } catch (e) { continue; }
                  }
                } catch (e) {}
              }
              speedParam.max = maxRate || 3;
            }
          }
        }

        triggerUiUpdate();

        if (param.name === "自动倍速") {
          const speedParam = getParam(part, "播放倍速");
          if (speedParam) {
            const isSimulate = getParam(part, "模拟播放")?.value || false;
            if (isSimulate) {
              if (next) {
                speedParam.max = window.__maxPlaybackRate || 3;
              } else {
                speedParam.max = 3;
              }
              if (speedParam.value > speedParam.max) speedParam.value = speedParam.max;
            }
          }
        }

        if (part.name === "视频设置" && (param.name === "手动倍速" || param.name === "突破倍速")) {
          const speedParam = getParam(part, "播放倍速");
          if (speedParam) {
            let menuMax = 2;
            try {
              const listText = document.querySelector("xt-speedlist")?.textContent || "";
              const rates = (listText.match(/(\d+(?:\.\d+)?)\s*X/gi) || []).map((s) => parseFloat(s));
              if (rates.length) menuMax = Math.max(...rates);
            } catch (e) {}
            const limit = param.name === "手动倍速" ? menuMax : 8;
            speedParam.max = limit;
            if (Number(speedParam.value) > limit) speedParam.value = limit;
          }
        }

        const dependents = part.params.filter((p) =>
          p.type === "boolean" && p.dependsOn && p.dependsOn.param === param.name
        );
        if (!next && dependents.length) {
          dependents.forEach((dp) => { dp.value = false; });
        }
        if (next && dependents.length) {
          dependents.forEach((dp) => {
            if (dp.dependsOn && dp.dependsOn.value !== next) dp.value = false;
          });
        }
      };

      const partSummary = (part) => {
        const out = [];
        const active = part.params.find((p) => p.type === "boolean" && p.exclusiveGroup && p.value);
        const flags = part.params.filter((p) => p.type === "boolean" && !p.exclusiveGroup && p.value && p.name !== "联网搜索");
        if (active) out.push(active.name);
        else if (flags.length) out.push(flags[0].name);
        if (part.name === "答题参数" && aiActive(part)) {
          const type = getParam(part, "AI 类型选择");
          const model = getParam(part, "AI 模型选择");
          if (type && model) out.push([type.value, model.value].filter(Boolean).join(" "));
        }
        const speed = getParam(part, "播放倍速");
        if (speed) out.push(speed.value + "x");
        return out.length ? out.join(" · ") : "默认";
      };

      const openPart = (name) => {
        activePartName.value = name;
        uiView.value = "detail";
      };
      const closePart = () => {
        uiView.value = "index";
      };
      vue.watch(() => configStore.platformName, closePart);

      const maskToken = (value) => {
        const raw = String(value || "");
        return raw.length > 8 ? raw.slice(0, 4) + "****" + raw.slice(-4) : raw;
      };

      const hasWelfareCard = () => !!(PP_WELFARE_OFFER || (typeof _unsafeWindow !== "undefined" ? _unsafeWindow.__PP_WELFARE__ : null));
      const sponsorLink = (label) => !hasWelfareCard() && SPONSOR_URL
        ? vue.h("a", { href: SPONSOR_URL, target: "_blank" }, label || "点我赞助获取新 Token")
        : null;

      const renderTokenNote = () => {
        const status = verifyState.value.status;
        if (status === "testing") return ppHint("正在验证 Token，请稍候…", { icon: "clock" });
        if (status === "error") {
          return vue.h("div", { class: "pp-note bad" }, [
            ppIcon("alert", 11),
            vue.h("span", null, [verifyState.value.message || "验证失败", " ", sponsorLink()])
          ]);
        }
        if (!token.value) {
          return vue.h("div", { class: "pp-note" }, [
            ppIcon("alert", 11),
            vue.h("span", null, ["未填写 Token，答题前请先验证。", sponsorLink("获取 Token")])
          ]);
        }
        if (status === "success" && remainingCount.value !== null && remainingCount.value <= 0) {
          return vue.h("div", { class: "pp-note" }, [
            ppIcon("alert", 11),
            vue.h("span", null, ["剩余次数已用完。", sponsorLink()])
          ]);
        }
        if (!configStore.tokenVerified && status !== "success") {
          return ppHint("Token 尚未验证，请点击验证", { tone: "warn", icon: "alert" });
        }
        return null;
      };

      const renderWelfareCard = () => {
        const promo = PP_WELFARE_OFFER || (typeof _unsafeWindow !== "undefined" ? _unsafeWindow.__PP_WELFARE__ : null);
        if (!promo || promo.enabled === false) return null;
        let plans = Array.isArray(promo.plans) ? promo.plans : [];
        if (!plans.length && Array.isArray(globalScriptDescription?.plans)) {
          plans = globalScriptDescription.plans
            .filter((plan) => Number(plan.count) > 0)
            .map((plan) => ({ from: Number(plan.count), to: Math.ceil(Number(plan.count) * 1.3) }));
        }
        const link = promo.link || SPONSOR_URL;
        if (!link) return null;
        return vue.h("section", { class: "pp-welfare" }, [
          vue.h("div", { class: "pp-welfare-top" }, [
            vue.h("span", { class: "pp-welfare-ico" }, ppIcon("gift", 14)),
            vue.h("div", { class: "pp-welfare-copy" }, [
              vue.h("b", null, promo.title || "专属福利"),
              vue.h("span", null, promo.text || "赞助加赠 30% 额度")
            ]),
            vue.h("span", { class: "pp-welfare-tag" }, "未领取")
          ]),
          plans.length
            ? vue.h("div", { class: "pp-welfare-plans" }, plans.map((plan, index) =>
                vue.h("span", { key: index }, plan.from + "→" + plan.to)
              ))
            : null,
          vue.h("div", { class: "pp-welfare-foot" }, [
            vue.h("span", { class: "pp-welfare-note" }, "首单专享 · 仅一次"),
            vue.h("a", {
              class: "pp-welfare-btn",
              href: link,
              target: "_blank",
              rel: "noopener noreferrer"
            }, ["去赞助", ppIcon("external", 11)])
          ])
        ]);
      };

      const renderTokenCard = () => {
        const Input = vue.resolveComponent("el-input");
        const Button = vue.resolveComponent("el-button");
        const remain = remainingCount.value;
        const remainClass = remain === null ? "" : remain <= 0 ? "zero" : remain <= 20 ? "low" : "";
        const onTokenInput = (value) => {
          const oldValue = configStore.queryApis[0].token;
          configStore.queryApis[0].token = value;
          configStore.tokenVerified = false;
          configStore.tokenVerifyError = null;
          remainingCount.value = null;
          pingDelay.value = null;
          verifyState.value = { status: "", message: "" };
          if (oldValue !== value) autoVerifyToken();
        };
        return vue.h("section", { class: "pp-token" }, [
          vue.h("div", { class: "pp-token-head" }, [
            vue.h("span", { class: "pp-token-key" }, ppIcon("key", 13)),
            vue.h("span", { class: "pp-token-title" }, "题库 Token"),
            vue.h("div", { class: "pp-token-chips" }, [
              remain !== null ? ppPill("剩余 " + remain, "remain " + remainClass) : null,
              pingDelay.value !== null
                ? (pingDelay.value === -1 ? ppPill("连接失败", "remain zero") : ppPill(pingDelay.value + "ms", "latency"))
                : null
            ])
          ]),
          vue.h("div", { class: "pp-input-row" }, [
            vue.h(Input, {
              modelValue: token.value,
              size: "small",
              clearable: true,
              placeholder: "请输入 24 位数字 Token",
              "onUpdate:modelValue": onTokenInput,
              onKeyup: (event) => {
                if (event && event.key === "Enter") verifyToken();
              }
            }),
            vue.h(Button, {
              type: "primary",
              size: "small",
              loading: verifyState.value.status === "testing",
              onClick: verifyToken
            }, { default: () => "验证" })
          ]),
          renderTokenNote(),
          existingTokens.value.length
            ? vue.h("div", { class: "pp-token-list" }, existingTokens.value.map((item) =>
                vue.h("div", { class: "pp-token-item", key: item.token }, [
                  vue.h("code", null, maskToken(item.token)),
                  vue.h("span", null, item.remainingCount + " 次"),
                  vue.h("button", {
                    type: "button",
                    class: "pp-token-mini",
                    onClick: () => selectToken(item.token)
                  }, "使用")
                ])
              ))
            : null
        ]);
      };

      const renderIndex = () => vue.h("div", { class: "pp-settings" }, [
        renderWelfareCard(),
        renderTokenCard(),
        vue.h("div", { class: "pp-scale-card" }, [
          vue.h("div", { class: "pp-scale-head" }, [
            vue.h("b", null, "界面缩放"),
            vue.h("span", null, "即时生效")
          ]),
          vue.h("div", { class: "pp-scale-options" }, [100, 125, 150].map((value) =>
            vue.h("button", {
              type: "button",
              key: value,
              class: ["pp-scale-btn", Number(configStore.uiScale) === value ? "is-active" : ""],
              onClick: () => { configStore.uiScale = value; }
            }, value + "%")
          )),
          vue.h("p", { class: "pp-scale-note" }, "放大面板、字体与间距，小屏会自动限制高度")
        ]),
        vue.h("div", { class: "pp-list-head" }, [
          vue.h("b", null, "功能设置"),
          vue.h("span", null, "更改后刷新页面生效")
        ]),
        vue.h("div", { class: "pp-setting-list" }, parts.value.map((part) => vue.h("button", {
          type: "button",
          class: "pp-set-row",
          key: part.name,
          onClick: () => openPart(part.name)
        }, [
          vue.h("span", { class: "pp-set-ico" }, ppIcon(PART_ICONS[part.name] || "sliders", 14)),
          vue.h("span", { class: "pp-set-main" }, [
            vue.h("span", { class: "pp-set-name" }, [
              part.name,
              part.name === "答题参数" && !configStore.tokenVerified
                ? vue.h("span", { class: "pp-set-badge" }, "待验证")
                : null
            ]),
            vue.h("span", { class: "pp-set-desc" }, partSummary(part))
          ]),
          vue.h("span", { class: "pp-set-chev" }, ppIcon("chevronRight", 13))
        ]))),
        vue.h("div", { class: "pp-settings-note" }, "设置会即时保存，部分项刷新页面后生效")
      ]);

      const renderParam = (part, param) => {
        if (param.type === "boolean") {
          const Switch = vue.resolveComponent("el-switch");
          const disabled = isParamDisabled(part, param);
          return ppRow(param.name, vue.h(Switch, {
            modelValue: !!param.value,
            size: "small",
            disabled,
            "onUpdate:modelValue": (value) => applyBool(part, param, value)
          }), {
            off: disabled,
            muted: param.locked ? "固定" : (disabled && param.dependsOn ? "需开启" + param.dependsOn.param : "")
          });
        }
        if (param.type === "number") {
          const NumberInput = vue.resolveComponent("el-input-number");
          return ppRow(param.name, vue.h(NumberInput, {
            modelValue: param.value,
            min: param.min != null ? param.min : 1,
            max: param.max != null ? param.max : 100,
            step: param.step != null ? param.step : 1,
            precision: param.step && param.step < 1 ? 1 : 0,
            controlsPosition: "right",
            size: "small",
            "onUpdate:modelValue": (value) => {
              param.value = value === undefined || value === null ? param.value : value;
              triggerUiUpdate();
            }
          }), { unit: PARAM_UNITS[param.name] || "" });
        }
        return null;
      };

      const renderAiBlock = (part) => {
        const Select = vue.resolveComponent("el-select");
        const Option = vue.resolveComponent("el-option");
        const Switch = vue.resolveComponent("el-switch");
        const typeParam = getParam(part, "AI 类型选择");
        const modelParam = getParam(part, "AI 模型选择");
        const webParam = getParam(part, "联网搜索");
        const active = aiActive(part);
        const typeOptions = typeParam.options || [];
        const modelOptions = (globalModelConfig?.typeModelMap?.[typeParam.value]) || modelParam.options || [];
        const select = (value, options, disabled, onChange) => vue.h(Select, {
          modelValue: value,
          size: "small",
          disabled,
          popperClass: "high-z-index-select",
          "onUpdate:modelValue": onChange
        }, {
          default: () => options.map((option) => vue.h(Option, { key: option, value: option, label: option }))
        });
        return vue.h("div", { class: ["pp-ai", active ? "" : "pp-off"] }, [
          vue.h("div", { class: "pp-ai-row" }, [
            vue.h("span", { class: "pp-ai-label" }, "类型"),
            select(typeParam.value, typeOptions, !active, (value) => {
              typeParam.value = value;
              modelParam.value = (globalModelConfig?.defaultModels || {})[value] || "Standard";
              triggerUiUpdate();
            })
          ]),
          vue.h("div", { class: "pp-ai-row" }, [
            vue.h("span", { class: "pp-ai-label" }, "模型"),
            select(modelParam.value, modelOptions, !active, (value) => {
              modelParam.value = value;
              triggerUiUpdate();
            })
          ]),
          webParam ? vue.h("div", { class: "pp-ai-row" }, [
            vue.h("span", { class: "pp-ai-label" }, "联网"),
            vue.h(Switch, {
              modelValue: !!webParam.value,
              size: "small",
              disabled: !active,
              "onUpdate:modelValue": (value) => applyBool(part, webParam, value)
            }),
            vue.h("span", { class: "pp-ai-note" },
              active ? (webParam.value ? "已开启，增加消耗" : "可选，提高正确率") : "需开启 AI 模式"
            )
          ]) : null
        ]);
      };

      const renderHints = (part) => {
        const hints = [];
        if (hasParam(part, "激活挂机")) {
          hints.push(ppHint("浏览器最小化刷课时，请开启激活挂机", { tone: "ok", icon: "check" }));
        }
        if (part.name === "答题参数") {
          const verify = getParam(part, "答案校验");
          if (verify && verify.value) {
            hints.push(ppHint("校验模式会同时请求题库与 AI，答题次数双倍消耗、耗时更长", { tone: "warn", icon: "alert" }));
          }
          const web = getParam(part, "联网搜索");
          if (aiActive(part) && web && web.value) {
            hints.push(ppHint("联网搜索会显著增加 Token 与答题次数消耗", { tone: "warn", icon: "alert" }));
          }
        }
        if (part.name === "视频设置") {
          const breakRate = getParam(part, "突破倍速");
          const autoRate = getParam(part, "自动倍速");
          const simulate = getParam(part, "模拟播放");
          const manual = getParam(part, "手动倍速");
          if (breakRate && breakRate.value) {
            hints.push(ppHint("突破倍速上限 8x，过高可能导致学习记录被清空", { tone: "warn", icon: "alert" }));
          } else if (autoRate && autoRate.value) {
            hints.push(ppHint("自动倍速受播放器限制，将使用允许的最大值", { icon: "info" }));
          } else if (simulate && simulate.value) {
            hints.push(ppHint("模拟播放会使用播放器允许的最大倍速", { icon: "info" }));
          } else if (manual && manual.value) {
            hints.push(ppHint("手动倍速受播放器限制，最大为播放器允许值", { icon: "info" }));
          }
        }
        return hints;
      };

      const renderPartBody = (part) => {
        const nodes = [];
        boolGroups(part).forEach((params, group) => {
          const active = params.find((p) => p.value);
          const title = groupTitle(part, group);
          nodes.push(vue.h("div", { class: "pp-group", key: "g-" + group }, [
            title ? vue.h("div", { class: "pp-group-label" }, title) : null,
            ppSeg(
              params.map((p) => ({ value: p.name, label: p.name, disabled: isParamDisabled(part, p) })),
              active ? active.name : "",
              (name) => {
                const param = params.find((p) => p.name === name);
                if (param) applyBool(part, param, true);
              }
            )
          ]));
          if (part.name === "模式设置" && active && MODE_DESCS[active.name]) {
            nodes.push(ppHint(MODE_DESCS[active.name], { icon: "info" }));
          }
        });
        if (hasAiBlock(part)) nodes.push(renderAiBlock(part));
        looseParams(part).forEach((param) => {
          const row = renderParam(part, param);
          if (row) nodes.push(row);
        });
        renderHints(part).forEach((hint) => nodes.push(hint));
        return nodes;
      };

      const renderDetail = () => {
        const part = parts.value.find((p) => p.name === activePartName.value);
        if (!part) return renderIndex();
        return vue.h("div", { class: "pp-settings" }, [
          vue.h("div", { class: "pp-detail-head" }, [
            vue.h("button", { type: "button", class: "pp-back", onClick: closePart, title: "返回设置" }, ppIcon("chevronLeft", 14)),
            vue.h("span", { class: "pp-detail-title" }, part.name),
            part.name === "答题参数" ? vue.h("span", { class: "pp-detail-extra" }, consumptionText.value) : null
          ]),
          vue.h("div", { class: "pp-detail-desc" }, PART_DESCS[part.name] || ""),
          ...renderPartBody(part),
          vue.h("div", { class: "pp-settings-note" }, "更改后刷新页面生效")
        ]);
      };

      return () => {
        void _uiUpdateTrigger.value;
        return uiView.value === "index" ? renderIndex() : renderDetail();
      };
    }
  });
  const ScriptSetting =  _export_sfc(_sfc_main$7, [["__scopeId", "data-v-9ea68a6a"]]);
  const _sfc_main$6 = vue.defineComponent({
    name: "QuestionTable",
    props: {
      questionList: { type: Array, required: true },
      onGoSettings: { type: Function, default: null }
    },
    setup(props) {
      const progress = useProgressStore();
      const config = useConfigStore();
      const answersOf = (row) => Array.isArray(row.answer) ? row.answer : (row.answer ? [row.answer] : []);
      const tokenProblem = vue.computed(() => {
        const token = String(config.queryApis?.[0]?.token || "").trim();
        if (!token) return "未配置密钥，无法使用答题功能";
        if (config.tokenVerified) return "";
        if (config.tokenVerifyError === "invalid" || config.tokenVerifyError === "format") {
          return "密钥无效，无法使用答题功能";
        }
        if (config.tokenVerifyError === "network") return "密钥验证失败，无法使用答题功能";
        return "密钥尚未验证，请先验证后使用答题功能";
      });
      const currentTotal = vue.computed(() => {
        const total = Number(progress.questionTotal) || 0;
        return total > 0 ? total : props.questionList.length;
      });
      const currentRecords = vue.computed(() => {
        const total = Number(progress.questionTotal) || 0;
        return total > 0 ? props.questionList.slice(-total) : props.questionList.slice();
      });
      const fillRate = vue.computed(() => {
        const total = currentTotal.value;
        if (total <= 0) return 0;
        const filled = Number(progress.filledCount) || 0;
        if (filled > 0) return Math.min(100, Math.round((filled / total) * 10000) / 100);
        const answered = currentRecords.value.filter((row) => answersOf(row).length).length;
        return Math.min(100, Math.round((answered / total) * 10000) / 100);
      });
      const remaining = vue.computed(() => {
        const value = Number(progress.remainingCount);
        return Number.isFinite(value) ? value : null;
      });
      const statusOf = (index) => {
        const rows = currentRecords.value;
        if (index < rows.length) {
          const row = rows[index];
          if (row.source === "error" || row._fillFailed || !answersOf(row).length) return "error";
          if (row.source === "ai") return "ai";
          if (row.source === "verify") return "verify";
          if (row.source === "cache") return "cache";
          return "bank";
        }
        if (progress.isPlaying && progress.type === "答题" && index === rows.length) return "searching";
        return "pending";
      };
      const SOURCE_LABELS = {
        tiku: "题库",
        ai: "AI",
        verify: "校验",
        cache: "缓存"
      };
      const statusLabel = {
        searching: "搜索中",
        bank: "题库答案",
        ai: "AI答案",
        verify: "校验答案",
        cache: "缓存",
        error: "异常",
        pending: "待处理"
      };
      const goSettings = () => {
        try { if (typeof props.onGoSettings === "function") props.onGoSettings(); } catch (e) {}
      };
      const renderTips = () => tokenProblem.value ? vue.h("section", { class: "pp-rec-tips is-warning" }, [
        vue.h("div", { class: "pp-rec-tip" }, [
          vue.h("span", { class: "pp-rec-tip-ico" }, ppIcon("alert", 11)),
          vue.h("span", { class: "pp-rec-tip-text" }, tokenProblem.value),
          vue.h("button", { type: "button", class: "pp-rec-config", onClick: goSettings }, [
            ppIcon("key", 10),
            "配置密钥"
          ])
        ])
      ]) : null;
      const renderSummary = () => currentTotal.value > 0 ? vue.h("div", { class: "pp-rec-summary" }, [
        vue.h("span", null, ["答题进度 ", vue.h("b", null, currentRecords.value.length + " / " + currentTotal.value)]),
        vue.h("span", { class: "pp-rec-sum-sep" }, "|"),
        vue.h("span", null, ["填涂率 ", vue.h("b", null, fillRate.value + "%")]),
        vue.h("span", { class: "pp-rec-sum-sep" }, "|"),
        vue.h("span", null, ["剩余次数 ", vue.h("b", null, remaining.value === null ? "--" : remaining.value)])
      ]) : null;
      const renderLegend = () => currentTotal.value > 0 ? vue.h("div", { class: "pp-rec-legend" }, [
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-searching" }), "搜索中"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-bank" }), "题库答案"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-ai" }), "AI答案"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-verify" }), "校验答案"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-cache" }), "缓存"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-error" }), "异常"])
      ]) : null;
      const renderCircles = () => currentTotal.value > 0 ? vue.h("div", { class: "pp-q-circles" },
        Array.from({ length: currentTotal.value }, (_, index) => {
          const status = statusOf(index);
          return vue.h("span", {
            key: index,
            class: ["pp-q-circle", "is-" + status],
            title: "第 " + (index + 1) + " 题 · " + (statusLabel[status] || status)
          }, String(index + 1));
        })
      ) : null;
      const renderRecord = (row, index) => vue.h("article", { class: "pp-rec", key: index }, [
        vue.h("div", { class: "pp-rec-top" }, [
          vue.h("span", { class: "pp-rec-idx" }, index + 1),
          row.source === "ai" ? vue.h("span", { class: "pp-tag is-ai" }, "AI") : null,
          row.source === "verify" ? vue.h("span", { class: "pp-tag is-verify" }, "校验") : null,
          row.source === "cache" ? vue.h("span", { class: "pp-tag is-cache" }, "缓存") : null
        ]),
        row.titleHtml
          ? vue.h("div", { class: "pp-rec-q", innerHTML: row.titleHtml, title: row.title || "" })
          : vue.h("div", { class: "pp-rec-q", title: row.title || "" }, row.title || "（无题干）"),
        vue.h("div", { class: "pp-rec-a" },
          answersOf(row).length
            ? answersOf(row).map((answer, i) => vue.h("span", { class: "pp-ans", key: i, title: String(answer) }, answer))
            : vue.h("span", { class: "pp-ans is-empty" }, "暂无答案")
        )
      ]);
      return () => vue.h("div", { class: "pp-records" }, [
        renderTips(),
        renderSummary(),
        renderLegend(),
        renderCircles(),
        vue.h("div", { class: "pp-list-head" }, [
          vue.h("b", null, "答题记录"),
          vue.h("span", null, "共 " + props.questionList.length + " 题")
        ]),
        props.questionList.length
          ? props.questionList.map(renderRecord)
          : ppEmpty({ icon: "list", title: "还没有答题记录", desc: "进入作业、章节测验或考试后，答题结果会汇总在这里" })
      ]);
    }
  });
  const QuestionTable =  _export_sfc(_sfc_main$6, [["__scopeId", "data-v-18523ca7"]]);


  const TOKEN_USAGE_MODE_OPTIONS = [
    { label: "全部模式", value: "" },
    { label: "正常模式", value: "正常模式" },
    { label: "校验模式", value: "校验模式" },
    { label: "AI模式", value: "AI模式" },
    { label: "AI聊天", value: "AI聊天" }
  ];

  const _sfc_main_token_usage =  vue.defineComponent({
    __name: "TokenUsagePanel",
    props: {
      active: { type: Function, default: null }
    },
    setup(__props) {
      const configStore = useConfigStore();

      const getConfigToken = () => {
        const apis = configStore.queryApis || [];
        const raw = apis[0] && apis[0].token ? String(apis[0].token).trim() : "";
        return /^\d{16}$|^\d{24}$/.test(raw) ? raw : "";
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

      const isTokenValid = (value) => /^\d{16}$|^\d{24}$/.test(String(value || "").trim());

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
        return /^\d{16}$|^\d{24}$/.test(raw) ? raw.substring(0, 4) + "****" + raw.substring(raw.length - 4) : "";
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
        "AI聊天": { "background": "#eef7ff", "border": "1px solid #cfe7ff", "color": "#0369a1" },
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
      const modelLabel = (row) => {
        const names = (Array.isArray(row.models) ? row.models : [])
          .map((model) => String(model && model.name ? model.name : "").trim())
          .filter(Boolean);
        if (!names.length) return row.mode === "AI模式" ? "模型未记录" : "";
        const unique = [...new Set(names)];
        return unique.length > 1 ? unique[0] + "（等）" : unique[0];
      };

      const fetchRecords = (targetPage) => {
        const token = String(tokenInput.value || "").trim();
        if (!isTokenValid(token)) {
          loading.value = false;
          records.value = [];
          total.value = 0;
          queried.value = false;
          errorMsg.value = "请输入正确的24位数字Token";
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

      let wasActive = false;
      const isActive = () => typeof __props.active === "function" ? Boolean(__props.active()) : true;
      vue.watch(isActive, (active) => {
        if (active && !wasActive) {
          wasActive = true;
          page.value = 1;
          if (isTokenValid(tokenInput.value)) fetchRecords(1);
        } else if (!active) {
          wasActive = false;
        }
      }, { immediate: true });
      vue.watch(() => configStore.queryApis?.[0]?.token, (value) => {
        if (!tokenInput.value && value) tokenInput.value = value;
      });

      const expandedRow = vue.ref(-1);
      vue.watch(records, () => { expandedRow.value = -1; });
      const totalPages = vue.computed(() => Math.max(1, Math.ceil((Number(total.value) || 0) / (Number(pageSize.value) || 50))));

      const renderModeBar = () => vue.h("div", { class: "pp-modebar" },
        TOKEN_USAGE_MODE_OPTIONS.map((option) => vue.h("button", {
          type: "button",
          key: option.value || "all",
          class: modeFilter.value === option.value ? "active" : "",
          disabled: loading.value,
          onClick: () => handleModeChange(option.value)
        }, option.label))
      );

      const renderRecord = (row, index) => {
        const open = expandedRow.value === index;
        const detail = [];
        if (row.source) detail.push("来源：" + (SOURCE_LABELS[row.source] || row.source));
        if (row.models && Array.isArray(row.models) && row.models.length) detail.push(detailText(row));
        const modelText = modelLabel(row);
        const modelTitle = detailText(row);
        return vue.h("div", { class: "pp-u-item", key: index }, [
          vue.h("button", {
            type: "button",
            class: "pp-u-row",
            onClick: () => { expandedRow.value = open ? -1 : index; }
          }, [
            vue.h("span", { class: "pp-u-left" }, [
              vue.h("span", { class: "pp-u-line" }, [
                vue.h("span", { class: "pp-u-date" }, (() => { const d = formatDate(row.createdAt); return d === "-" ? "-" : d.slice(5); })()),
                vue.h("span", { class: "pp-u-time" }, formatClock(row.createdAt)),
                row.mode ? vue.h("span", { class: "pp-u-mode " + (row.mode === "AI模式" ? "is-ai" : row.mode === "AI聊天" ? "is-chat" : row.mode === "校验模式" ? "is-verify" : row.mode === "正常模式" ? "is-normal" : "") }, row.mode) : null
              ]),
              vue.h("span", { class: "pp-u-sub" }, [
                  vue.h("span", { class: "pp-u-sub-text" },
                    "输入 " + formatNumber(row.promptTokens) + " / 输出 " + formatNumber(row.completionTokens)
                  ),
                  modelText ? vue.h("span", {
                    class: ["pp-u-model", modelText === "模型未记录" ? "is-empty" : ""],
                    title: modelTitle
                  }, modelText) : null
                ])
            ]),
            vue.h("span", { class: "pp-u-right" }, [
              vue.h("span", { class: "pp-u-cost" }, "-" + formatNumber(row.cost)),
              vue.h("span", { class: "pp-u-rem" }, "剩 " + remainingText(row.remainingCount))
            ])
          ]),
          open ? vue.h("div", { class: "pp-u-detail" }, detail.length ? detail.join("  ·  ") : "暂无明细") : null
        ]);
      };

      return (_ctx, _cache) => {
        const Input = vue.resolveComponent("el-input");
        const Button = vue.resolveComponent("el-button");
        const pageCount = totalPages.value;
        return vue.h("div", { class: "pp-usage" }, [
          vue.h("section", { class: "pp-usage-card" }, [
            vue.h("div", { class: "pp-usage-top" }, [
              vue.h(Input, {
                modelValue: tokenInput.value,
                size: "small",
                clearable: true,
                placeholder: "输入 24 位数字 Token",
                "onUpdate:modelValue": (value) => {
                  tokenInput.value = value;
                  errorMsg.value = "";
                },
                onKeyup: handleKeyup
              }),
              vue.h(Button, {
                type: "primary",
                size: "small",
                loading: loading.value,
                onClick: handleQuery
              }, { default: () => "查询" })
            ]),
            vue.h("div", { class: "pp-usage-meta" }, [
              maskedInput.value ? vue.h("span", { class: "pp-token-chip" }, maskedInput.value) : null,
              vue.h("span", null, lastUpdated.value ? "更新于 " + lastUpdated.value : "尚未查询")
            ])
          ]),
          vue.h("div", { class: "pp-list-head" }, [
            vue.h("b", null, "扣费流水"),
            vue.h("span", null, queried.value ? "共 " + formatNumber(total.value) + " 条" : "未查询")
          ]),
          renderModeBar(),
          errorMsg.value
            ? vue.h("div", { class: "pp-note bad" }, [ppIcon("alert", 11), vue.h("span", null, errorMsg.value)])
            : null,
          vue.h("div", { class: "pp-u-list" },
            records.value.length
              ? records.value.map(renderRecord)
              : ppEmpty({
                  icon: "search",
                  title: queried.value ? "暂无使用记录" : "还没有查询",
                  desc: queried.value ? "该 Token 在所选模式下没有扣费记录" : "输入 Token 后点击查询，查看扣费流水"
                })
          ),
          vue.h("div", { class: "pp-pager" }, [
            vue.h("span", null, "第 " + page.value + " / " + pageCount + " 页"),
            vue.h("div", { class: "pp-pager-btns" }, [
              vue.h("button", {
                type: "button",
                disabled: page.value <= 1 || loading.value,
                onClick: () => handlePageChange(page.value - 1),
                title: "上一页"
              }, ppIcon("chevronLeft", 13)),
              vue.h("button", {
                type: "button",
                disabled: page.value >= pageCount || loading.value,
                onClick: () => handlePageChange(page.value + 1),
                title: "下一页"
              }, ppIcon("chevronRight", 13))
            ])
          ])
        ]);
      };
    }
  });
  const TokenUsagePanel = _sfc_main_token_usage;

  const AI_CHAT_STORE_KEY = "pp_ai_sessions";
  const AI_CHAT_MAX_SESSIONS = 10;
  const AI_CHAT_MAX_LENGTH = 500;
  const AI_CHAT_STAGE_TEXT = Object.freeze({
    compressing: "正在压缩上下文",
    searching: "正在搜索",
    thinking: "正在思考",
    generating: "正在生成"
  });
  const AI_CHAT_MODEL_KEY = "pp_ai_model";
  const AI_CHAT_DEEP_KEY = "pp_ai_deep_thinking";
  const AI_CHAT_WEB_KEY = "pp_ai_web_search";
  const AI_CHAT_ICON_PATHS = Object.freeze({
    ai: "M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z",
    plus: "M12 5v14M5 12h14"
  });
  const aiChatIcon = (name, size) => {
    const solid = name === "ai";
    return vue.h("svg", {
      class: "pp-icon pp-ai-icon",
      viewBox: "0 0 24 24",
      width: size || 15,
      height: size || 15,
      fill: solid ? "currentColor" : "none",
      stroke: solid ? "none" : "currentColor",
      "stroke-width": 1.8,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true"
    }, [vue.h("path", { d: AI_CHAT_ICON_PATHS[name] || "" })]);
  };
  const aiChatIsModelError = (text) => {
    const value = String(text || "");
    return /(?:model|模型).{0,20}(?:invalid|unsupported|not\s*found|not\s*allowed|unavailable|rejected|unknown|required|不支持|不可用|无效|不存在|下线|停用|拒绝|未授权)|(?:invalid|unsupported|not\s*found|not\s*allowed|unavailable|rejected|unknown|required).{0,20}(?:model|模型)/i.test(value);
  };
  const AI_CHAT_HTTPS_URLS = Object.freeze([
    "https://122.152.249.109:3001",
    "https://152.136.30.238:3001"
  ]);
  const getAiChatServer = () => {
    try {
      const currentHost = new URL(getRandomServer()).hostname;
      const matched = AI_CHAT_HTTPS_URLS.find((url) => new URL(url).hostname === currentHost);
      return matched || AI_CHAT_HTTPS_URLS[0];
    } catch (e) {
      return AI_CHAT_HTTPS_URLS[0];
    }
  };

  const aiChatEscapeHtml = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const aiChatSafeHref = (raw) => {
    try {
      const href = new URL(String(raw || "").replace(/&amp;/g, "&"), window.location.href);
      if (href.protocol !== "http:" && href.protocol !== "https:" && href.protocol !== "mailto:") return "";
      return href.href.replace(/&/g, "&amp;").replace(/"/g, "%22");
    } catch (e) {
      return "";
    }
  };
  const aiChatSourceLink = (raw) => {
    try {
      const href = new URL(String(raw || "").replace(/&amp;/g, "&"), window.location.href);
      if (href.protocol !== "http:" && href.protocol !== "https:") return null;
      return {
        href: href.href.replace(/&/g, "&amp;").replace(/"/g, "%22"),
        host: href.hostname.replace(/^www\./i, "")
      };
    } catch (e) {
      return null;
    }
  };

  const aiChatRenderInline = (escaped) => {
    const codeSlots = [];
    let text = String(escaped || "").replace(/`([^`\n]+)`/g, (match, code) => {
      codeSlots.push(code);
      return "\u0001C" + (codeSlots.length - 1) + "\u0001";
    });
    text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
      const safe = aiChatSafeHref(href);
      return safe ? '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + label + "</a>" : label;
    });
    return text.replace(/\u0001C(\d+)\u0001/g, (match, index) => {
      const code = codeSlots[Number(index)];
      return code === undefined ? "" : "<code>" + code + "</code>";
    });
  };

  const aiChatRenderProse = (chunk) => {
    const text = String(chunk || "").replace(/^\n+|\n+$/g, "");
    if (!text) return "";
    return text.split(/\n{2,}/).map((paragraph) =>
      "<p>" + aiChatRenderInline(aiChatEscapeHtml(paragraph)).replace(/\n/g, "<br>") + "</p>"
    ).join("");
  };

  const aiChatRenderMarkdown = (raw) => {
    const source = String(raw == null ? "" : raw).replace(/\r\n?/g, "\n");
    if (!source) return "";
    const parts = [];
    let cursor = 0;
    const fence = /```([^\n`]*)\n?([\s\S]*?)(?:```|$)/g;
    let match;
    while ((match = fence.exec(source)) !== null) {
      if (match.index > cursor) parts.push(aiChatRenderProse(source.slice(cursor, match.index)));
      const lang = String(match[1] || "").trim();
      const langClass = /^[\w+#.-]{1,20}$/.test(lang) ? ' class="language-' + aiChatEscapeHtml(lang) + '"' : "";
      parts.push('<pre class="pp-ai-code"><code' + langClass + ">" + aiChatEscapeHtml(String(match[2] || "").replace(/\n$/, "")) + "</code></pre>");
      cursor = fence.lastIndex;
      if (fence.lastIndex <= match.index) fence.lastIndex = match.index + 1;
    }
    if (cursor < source.length) parts.push(aiChatRenderProse(source.slice(cursor)));
    return parts.join("");
  };

  const AiChatPanel = vue.defineComponent({
    name: "AiChatPanel",
    setup() {
      const configStore = useConfigStore();
      const token = vue.computed(() => {
        const raw = configStore.queryApis && configStore.queryApis[0] ? configStore.queryApis[0].token : "";
        return raw == null ? "" : String(raw).trim();
      });
      const hasToken = vue.computed(() => !!token.value);
      const draft = vue.ref("");
      const readStoredFlag = (key) => {
        try {
          const raw = typeof _GM_getValue === "function" ? _GM_getValue(key) : false;
          return raw === true || raw === 1 || raw === "1" || raw === "true";
        } catch (e) {
          return false;
        }
      };
      const deepThinking = vue.ref(readStoredFlag(AI_CHAT_DEEP_KEY));
      const webSearch = vue.ref(readStoredFlag(AI_CHAT_WEB_KEY));
      vue.watch(deepThinking, (value) => {
        try { if (typeof _GM_setValue === "function") _GM_setValue(AI_CHAT_DEEP_KEY, !!value); } catch (e) {}
      });
      vue.watch(webSearch, (value) => {
        try { if (typeof _GM_setValue === "function") _GM_setValue(AI_CHAT_WEB_KEY, !!value); } catch (e) {}
      });
      const messages = vue.ref([]);
      const sessions = vue.ref([]);
      const currentSessionId = vue.ref(null);
      const showSessions = vue.ref(false);
      const deletePending = vue.ref(false);
      const deleting = vue.ref(false);
      const streaming = vue.ref(false);
      const loadingHistory = vue.ref(false);
      const stage = vue.ref("");
      const usage = vue.ref(null);
      const modelName = vue.ref("");
      const models = vue.ref([]);
      const modelGroups = vue.ref([]);
      const defaultModelId = vue.ref("");
      const selectedModelId = vue.ref("");
      const modelsLoaded = vue.ref(false);
      const modelsLoading = vue.ref(false);
      const showModels = vue.ref(false);
      const notice = vue.ref(null);
      const rootRef = vue.ref(null);
      const listRef = vue.ref(null);
      const inputRef = vue.ref(null);
      const hasActivated = vue.ref(false);
      let messageSeq = 0;
      let streamSeq = 0;
      let historySeq = 0;
      let abortController = null;
      let scrollFrame = 0;
      const PPFX_STREAM_FLUSH_MS = 55;
      const PPFX_SCROLL_NEAR_PX = 32;
      let ppfxStickBottom = true;
      let ppfxStreamTarget = null;
      let ppfxStreamBuffer = "";
      let ppfxStreamTimer = 0;
      let noticeTimer = null;
      let activationObserver = null;
      let composing = false;

      const readStoredModelId = () => {
        try {
          const raw = typeof _GM_getValue === "function" ? _GM_getValue(AI_CHAT_MODEL_KEY) : "";
          return raw == null ? "" : String(raw).trim();
        } catch (e) {
          return "";
        }
      };
      selectedModelId.value = readStoredModelId();

      const nextMessageId = () => "m" + (++messageSeq) + "-" + Date.now().toString(36);
      const cleanTitle = (value, max) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max || 60);
      const parseJson = (raw) => {
        try { return JSON.parse(raw); } catch (e) { return null; }
      };
      const pad2 = (value) => String(value).padStart(2, "0");
      const formatNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num.toLocaleString("zh-CN") : String(value);
      };
      const persistModel = (id) => {
        try {
          if (typeof _GM_setValue === "function") _GM_setValue(AI_CHAT_MODEL_KEY, String(id || ""));
        } catch (e) {}
      };
      const normalizeModelEntry = (item) => {
        if (!item) return null;
        if (typeof item === "string") {
          const id = item.trim();
          return id ? { id, label: id, type: "其他" } : null;
        }
        if (typeof item !== "object") return null;
        const id = String(item.id || item.value || item.model || item.key || "").trim();
        if (!id) return null;
        const label = String(item.label || item.name || item.title || id).trim() || id;
        const type = String(item.type || item.group || item.provider || item.vendor || "其他").trim() || "其他";
        return {
          id,
          label,
          type,
          cost: item.cost,
          protocol: item.protocol,
          thinkingControl: ["toggle", "effort", "always", "none"].includes(item.thinkingControl)
            ? item.thinkingControl
            : ""
        };
      };
      const normalizeModelPayload = (payload) => {
        let data = payload;
        if (data && typeof data === "object" && !Array.isArray(data) && data.data !== undefined) data = data.data;
        let rawGroups = [];
        let rawFlat = [];
        let defaultId = "";
        if (Array.isArray(data)) rawFlat = data;
        else if (data && typeof data === "object") {
          defaultId = String(data.default || data.defaultModel || data.default_model || "").trim();
          if (Array.isArray(data.groups)) rawGroups = data.groups;
          if (Array.isArray(data.models)) rawFlat = data.models;
          else if (Array.isArray(data.list)) rawFlat = data.list;
          else if (Array.isArray(data.items)) rawFlat = data.items;
          else if (Array.isArray(data.data)) rawFlat = data.data;
        }
        const seen = Object.create(null);
        const groups = [];
        for (const group of rawGroups) {
          if (!group || typeof group !== "object") continue;
          const type = String(group.type || group.label || group.name || "其他").trim() || "其他";
          const label = String(group.label || group.type || group.name || "其他").trim() || type;
          const items = Array.isArray(group.models) ? group.models
            : Array.isArray(group.items) ? group.items
              : Array.isArray(group.list) ? group.list
                : [];
          const groupModels = [];
          for (const item of items) {
            const model = normalizeModelEntry(item);
            if (!model || seen[model.id]) continue;
            if (model.type === "其他") model.type = type;
            seen[model.id] = true;
            groupModels.push(model);
          }
          if (groupModels.length) groups.push({ type, label, models: groupModels });
        }
        if (!groups.length && rawFlat.length) {
          const groupModels = [];
          for (const item of rawFlat) {
            const model = normalizeModelEntry(item);
            if (!model || seen[model.id]) continue;
            seen[model.id] = true;
            groupModels.push(model);
          }
          if (groupModels.length) groups.push({ type: "models", label: "模型", models: groupModels });
        }
        const list = groups.reduce((all, group) => all.concat(group.models), []);
        return { defaultId, models: list, groups };
      };

      const normalizeStoredSessions = (value) => {
        const seen = Object.create(null);
        const result = [];
        if (!Array.isArray(value)) return result;
        for (const item of value) {
          if (!item || typeof item !== "object") continue;
          const id = String(item.id || "").trim();
          if (!id || seen[id]) continue;
          seen[id] = true;
          result.push({
            id,
            title: cleanTitle(item.title, 60) || "新对话",
            updatedAt: Number(item.updatedAt) || 0
          });
        }
        result.sort((a, b) => b.updatedAt - a.updatedAt);
        return result.slice(0, AI_CHAT_MAX_SESSIONS);
      };

      const readSessions = () => {
        try {
          const raw = typeof _GM_getValue === "function" ? _GM_getValue(AI_CHAT_STORE_KEY) : "";
          if (!raw) return [];
          return normalizeStoredSessions(typeof raw === "string" ? JSON.parse(raw) : raw);
        } catch (e) {
          return [];
        }
      };

      const saveSessions = (list) => {
        const clean = normalizeStoredSessions(list);
        sessions.value = clean;
        try {
          if (typeof _GM_setValue === "function") _GM_setValue(AI_CHAT_STORE_KEY, JSON.stringify(clean));
        } catch (e) {}
        return clean;
      };

      sessions.value = readSessions();

      const currentSession = vue.computed(() =>
        sessions.value.find((item) => item.id === currentSessionId.value) || null
      );
      const currentTitle = vue.computed(() => currentSession.value ? currentSession.value.title : "新对话");
      const titleFromText = (value) => cleanTitle(value, 24);
      const fallbackTitle = () => {
        const first = messages.value.find((item) => item.role === "user");
        return titleFromText(first && first.content) || "新对话";
      };

      const upsertSession = (id, title) => {
        if (id === null || id === undefined || id === "") return;
        const sid = String(id);
        const existing = sessions.value.find((item) => item.id === sid);
        const nextTitle = cleanTitle(title, 60) || (existing && existing.title) || "新对话";
        const list = sessions.value.filter((item) => item.id !== sid);
        list.unshift({ id: sid, title: nextTitle, updatedAt: Date.now() });
        saveSessions(list);
      };

      const removeSession = (id) => {
        saveSessions(sessions.value.filter((item) => item.id !== id));
      };

      const formatSessionTime = (timestamp) => {
        const num = Number(timestamp);
        if (!num) return "";
        const date = new Date(num);
        if (isNaN(date.getTime())) return "";
        const now = new Date();
        const sameDay = date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate();
        if (sameDay) return pad2(date.getHours()) + ":" + pad2(date.getMinutes());
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        if (date.getFullYear() === yesterday.getFullYear() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getDate() === yesterday.getDate()) return "昨天";
        if (date.getFullYear() === now.getFullYear()) return (date.getMonth() + 1) + "月" + date.getDate() + "日";
        return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
      };

      const setNotice = (text, tone, kind) => {
        if (noticeTimer) {
          clearTimeout(noticeTimer);
          noticeTimer = null;
        }
        notice.value = text ? { text: String(text), tone: tone || "info", kind: kind || "" } : null;
        if (notice.value && tone === "ok") {
          noticeTimer = setTimeout(() => {
            notice.value = null;
            noticeTimer = null;
          }, 2400);
        }
      };

      const goConfig = () => {
        try {
          const host = document.getElementById("chaoxing-helper-root");
          const root = host && host.shadowRoot ? host.shadowRoot : document;
          const target = root.querySelector('.pp-rail-item[title="脚本配置"]');
          if (target && typeof target.click === "function") {
            target.click();
            return;
          }
          const items = root.querySelectorAll(".pp-rail-item");
          if (items && items[2] && typeof items[2].click === "function") items[2].click();
        } catch (e) {}
      };

      const ppfxHandleListScroll = () => {
        const el = listRef.value;
        if (!el || !el.clientHeight) return;
        ppfxStickBottom = (el.scrollHeight - el.clientHeight - el.scrollTop) <= PPFX_SCROLL_NEAR_PX;
      };
      const ppfxFollowTail = (force) => {
        if (force) ppfxStickBottom = true;
        if (!ppfxStickBottom) return;
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          const el = listRef.value;
          if (!el || !ppfxStickBottom) return;
          el.scrollTop = el.scrollHeight;
        });
      };
      const scheduleScroll = () => {
        ppfxFollowTail(false);
      };

      const autoGrow = () => {
        const el = inputRef.value;
        if (!el) return;
        try {
          el.style.height = "auto";
          el.style.height = Math.min(72, Math.max(36, el.scrollHeight || 36)) + "px";
        } catch (e) {}
      };

      const focusComposer = () => {
        const el = inputRef.value;
        if (!el) return;
        try { el.focus(); } catch (e) {}
      };

      const isPanelVisible = () => {
        const el = rootRef.value;
        if (!el) return false;
        return el.getClientRects().length > 0 || el.offsetWidth > 0 || el.offsetHeight > 0;
      };

      const aiChatIsTokenError = (text, status) => status === 401 || status === 403 ||
        /(?:token|令牌|密钥).{0,10}(?:无效|过期|错误|缺失|不存在|未授权|失效)|invalid[\s_-]*token|token[\s_-]*(?:invalid|expired|missing|unauthorized)|unauthori[sz]ed|未授权|请先登录|未登录|登录.{0,4}(?:失效|过期)|\b401\b|\b403\b/i.test(String(text || ""));

      const aiChatIsSessionLimit = (text) => /session[\s_-]*(?:limit|max|full)|(?:limit|max)[\s_-]*session|会话.{0,10}(?:上限|达到|超过|已满|超限)|对话.{0,10}(?:上限|达到|超过|已满|超限)|最多.{0,6}(?:会话|对话)/i.test(String(text || ""));

      const extractErrorInfo = (raw, status) => {
        const data = parseJson(raw);
        const nested = data && typeof data === "object" && data.data && typeof data.data === "object" ? data.data : (data && typeof data === "object" ? data : {});
        let code = "";
        if (data && typeof data === "object") {
          if (data.code !== undefined) code = data.code;
          else if (nested.code !== undefined) code = nested.code;
        }
        const candidates = [
          nested.message,
          nested.msg,
          nested.error_description,
          typeof nested.error === "string" ? nested.error : "",
          nested.error && typeof nested.error === "object" ? nested.error.message : "",
          data && data.message,
          data && data.msg
        ];
        let message = "";
        for (const item of candidates) {
          if (typeof item === "string" && item.trim()) {
            message = item.trim();
            break;
          }
        }
        if (!message && raw && raw.length < 300) {
          const trimmed = String(raw).trim();
          const first = trimmed.charAt(0);
          if (trimmed && first !== "<" && first !== "{" && first !== "[") message = trimmed;
        }
        const combined = String(code || "") + " " + message + " " + String(status || "");
        return {
          code: String(code || ""),
          message: message || "请求失败（HTTP " + (status || "未知") + "）",
          status,
          isToken: aiChatIsTokenError(combined, status),
          isSessionLimit: aiChatIsSessionLimit(combined)
        };
      };

      const makeRequestError = (info) => {
        const err = new Error(info && info.message ? info.message : "请求失败，请稍后重试");
        if (info) {
          err.code = info.code;
          err.status = info.status;
          err.isToken = !!info.isToken;
          err.isSessionLimit = !!info.isSessionLimit;
        }
        return err;
      };

      const loadModels = async (force) => {
        if (modelsLoading.value) return;
        if (!force && modelsLoaded.value) return;
        modelsLoading.value = true;
        try {
          const modelUrl = getAiChatServer() + "/ai/chat/models";
          const response = await fetch(modelUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store"
          });
          const raw = await response.text();
          const data = parseJson(raw);
          const codeValue = data && typeof data === "object" && data.code !== undefined ? data.code : null;
          const code = codeValue !== null && Number.isFinite(Number(codeValue)) ? Number(codeValue) : null;
          if (!response.ok || (code !== null && code !== 200 && code !== 0)) {
            throw makeRequestError(extractErrorInfo(raw, response.status));
          }
          const parsed = normalizeModelPayload(data);
          if (!parsed.models.length) throw new Error("模型列表为空");
          models.value = parsed.models;
          modelGroups.value = parsed.groups;
          defaultModelId.value = parsed.models.some((item) => item.id === parsed.defaultId)
            ? parsed.defaultId
            : parsed.models[0].id;
          if (!parsed.models.some((item) => item.id === selectedModelId.value)) {
            selectedModelId.value = defaultModelId.value;
            persistModel(defaultModelId.value);
          }
          modelsLoaded.value = true;
        } catch (error) {
          models.value = [];
          modelGroups.value = [];
          defaultModelId.value = "";
          showModels.value = false;
          modelsLoaded.value = true;
        } finally {
          modelsLoading.value = false;
        }
      };

      const refreshModels = () => {
        selectedModelId.value = "";
        modelName.value = "";
        showModels.value = false;
        modelsLoaded.value = false;
        models.value = [];
        modelGroups.value = [];
        defaultModelId.value = "";
        return loadModels(true);
      };

      const normalizeSources = (items) => (Array.isArray(items) ? items : []).map((item) => ({
        title: String(item && item.title ? item.title : "").trim(),
        url: String(item && item.url ? item.url : "").trim(),
        snippet: String(item && item.snippet ? item.snippet : "").trim()
      })).filter((item) => item.title || item.url || item.snippet).slice(0, 10);

      const normalizeHistoryMessage = (item) => {
        if (!item || typeof item !== "object") return null;
        const rawRole = String(item.role || "").toLowerCase();
        const role = rawRole === "user" || rawRole === "human" ? "user"
          : rawRole === "assistant" || rawRole === "ai" || rawRole === "bot" ? "assistant"
            : "";
        if (!role) return null;
        let content = item.content;
        if (Array.isArray(content)) {
          content = content.map((part) => {
            if (typeof part === "string") return part;
            if (part && typeof part.text === "string") return part.text;
            if (part && typeof part.content === "string") return part.content;
            return "";
          }).join("");
        }
        if (typeof content !== "string") {
          content = typeof item.text === "string" ? item.text : (typeof item.message === "string" ? item.message : "");
        }
        if (!content.trim()) return null;
        return {
          id: nextMessageId(),
          role,
          content,
          sources: normalizeSources(item.sources),
          streaming: false,
          stopped: false
        };
      };

      const normalizeHistory = (payload) => {
        let raw = [];
        if (Array.isArray(payload)) raw = payload;
        else {
          const session = payload && typeof payload === "object" ? (payload.session || payload) : {};
          if (Array.isArray(session)) raw = session;
          else if (Array.isArray(session.messages)) raw = session.messages;
          else if (Array.isArray(session.history)) raw = session.history;
          else if (Array.isArray(payload && payload.messages)) raw = payload.messages;
          else if (Array.isArray(payload && payload.history)) raw = payload.history;
        }
        return raw.map(normalizeHistoryMessage).filter(Boolean);
      };

      const lastAssistant = () => {
        for (let i = messages.value.length - 1; i >= 0; i -= 1) {
          if (messages.value[i].role === "assistant") return messages.value[i];
        }
        return null;
      };

      const trimMessagesToCurrentTurn = () => {
        let index = messages.value.length - 1;
        while (index >= 0 && messages.value[index].role !== "user") index -= 1;
        if (index > 0) messages.value = messages.value.slice(index);
      };

      const ppfxFlushStreamDelta = () => {
        if (ppfxStreamTimer) {
          clearTimeout(ppfxStreamTimer);
          ppfxStreamTimer = 0;
        }
        const target = ppfxStreamTarget;
        const chunk = ppfxStreamBuffer;
        ppfxStreamTarget = null;
        ppfxStreamBuffer = "";
        if (target && chunk) target.content = String(target.content || "") + chunk;
      };
      const ppfxQueueStreamDelta = (target, text) => {
        if (ppfxStreamTarget && ppfxStreamTarget !== target) ppfxFlushStreamDelta();
        ppfxStreamTarget = target;
        ppfxStreamBuffer += text;
        if (ppfxStreamTimer) return;
        ppfxStreamTimer = setTimeout(() => {
          ppfxStreamTimer = 0;
          ppfxFlushStreamDelta();
          scheduleScroll();
        }, PPFX_STREAM_FLUSH_MS);
      };
      const finalizeAssistant = (options) => {
        ppfxFlushStreamDelta();
        const opts = options || {};
        const target = lastAssistant();
        if (!target || !target.streaming) return;
        target.streaming = false;
        if (opts.stopped) {
          target.stopped = true;
          const hasContent = !!target.content || (target.sources && target.sources.length > 0);
          if (!hasContent) {
            target.content = "已停止生成。";
            target.stopped = false;
          }
        }
        if (opts.emptyText && !target.content && !(target.sources && target.sources.length)) {
          target.content = opts.emptyText;
        }
      };

      const dropEmptyAssistant = () => {
        ppfxFlushStreamDelta();
        const target = lastAssistant();
        if (!target || !target.streaming) return;
        if (target.content || (target.sources && target.sources.length)) {
          target.streaming = false;
          target.interrupted = true;
          return;
        }
        const index = messages.value.lastIndexOf(target);
        if (index >= 0) messages.value.splice(index, 1);
      };

      const abortStream = (silent) => {
        ppfxFlushStreamDelta();
        const hadStream = streaming.value;
        streamSeq += 1;
        const controller = abortController;
        abortController = null;
        if (controller) {
          try { controller.abort(); } catch (e) {}
        }
        if (hadStream) {
          streaming.value = false;
          stage.value = "";
          finalizeAssistant({ stopped: !silent });
        }
      };

      const finishStream = (seq, finishReason) => {
        if (seq !== streamSeq) return;
        ppfxFlushStreamDelta();
        const target = lastAssistant();
        if (target) {
          target.streaming = false;
          target.stopped = false;
          if (!target.content && !(target.sources && target.sources.length)) {
            target.content = "（未收到回复）";
          }
          if (finishReason === "length") target.truncated = true;
        }
        streaming.value = false;
        stage.value = "";
        if (currentSessionId.value) {
          upsertSession(currentSessionId.value, currentTitle.value || fallbackTitle());
        }
        streamSeq += 1;
        const controller = abortController;
        abortController = null;
        if (controller) {
          try { controller.abort(); } catch (e) {}
        }
        scheduleScroll();
      };

      const terminateStreamWithError = (seq, info) => {
        if (seq !== streamSeq) return;
        ppfxFlushStreamDelta();
        const target = lastAssistant();
        if (target) {
          target.streaming = false;
          if (target.content || (target.sources && target.sources.length)) target.interrupted = true;
          else {
            const index = messages.value.lastIndexOf(target);
            if (index >= 0) messages.value.splice(index, 1);
          }
        }
        streaming.value = false;
        stage.value = "";
        streamSeq += 1;
        const controller = abortController;
        abortController = null;
        if (controller) {
          try { controller.abort(); } catch (e) {}
        }
        const isToken = !!(info && info.isToken);
        const isLimit = !!(info && info.isSessionLimit);
        const isModel = !isToken && !isLimit && (!!(info && info.isModel) ||
          aiChatIsModelError(String(info && info.code || "") + " " + String(info && info.message || "")));
        const message = isToken
          ? "Token 无效或已失效，请前往「配置」重新填写。"
          : isLimit
            ? "服务器报告会话数量已达上限，请稍后重试或删除一个旧会话。"
            : isModel
              ? "当前模型不可用，请重新选择模型后重试。"
              : (info && info.message ? info.message : "AI 服务请求失败，请稍后重试。");
        messages.value.push({ id: nextMessageId(), role: "error", content: message, action: isToken ? "config" : isLimit ? "sessions" : "" });
        if (isToken) setNotice("Token 无效或已失效，请前往「配置」检查后重试。", "error", "config");
        else if (isLimit) setNotice("服务器报告会话数量已达上限，请稍后重试或删除一个旧会话。", "error", "sessions");
        else if (isModel) {
          setNotice("当前模型不可用，已刷新模型列表，请重新选择。", "error");
          refreshModels();
        }
        ppfxFollowTail(true);
      };

      const applySseEvent = (eventName, payload, seq) => {
        if (seq !== streamSeq) return;
        const data = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
        if (eventName === "meta") {
          const previousSessionId = currentSessionId.value ? String(currentSessionId.value) : "";
          const newSessionId = data.sessionId !== undefined && data.sessionId !== null && data.sessionId !== ""
            ? String(data.sessionId)
            : "";
          const evictedSessionId = data.evictedSessionId !== undefined && data.evictedSessionId !== null && data.evictedSessionId !== ""
            ? String(data.evictedSessionId)
            : "";
          if (newSessionId) currentSessionId.value = newSessionId;
          if (data.model) {
            const actualModel = String(data.model);
            modelName.value = actualModel;
            const knownModel = models.value.find((item) =>
              item.id === actualModel || item.label.toLowerCase() === actualModel.toLowerCase()
            );
            if (knownModel && selectedModelId.value !== knownModel.id) {
              selectedModelId.value = knownModel.id;
              persistModel(knownModel.id);
            }
          }
          if (typeof data.deepThinking === "boolean") deepThinking.value = data.deepThinking;
          if (typeof data.webSearch === "boolean") webSearch.value = data.webSearch;
          if (evictedSessionId && evictedSessionId !== newSessionId) {
            if (previousSessionId === evictedSessionId) {
              deletePending.value = false;
              if (newSessionId) {
                currentSessionId.value = newSessionId;
                trimMessagesToCurrentTurn();
              } else {
                currentSessionId.value = null;
                messages.value = [];
                usage.value = null;
                stage.value = "";
                modelName.value = "";
              }
            }
            removeSession(evictedSessionId);
          }
          if (currentSessionId.value) {
            upsertSession(currentSessionId.value, data.title || fallbackTitle());
          }
          return;
        }
        if (eventName === "stage") {
          if (data.stage && AI_CHAT_STAGE_TEXT[data.stage]) stage.value = AI_CHAT_STAGE_TEXT[data.stage];
          return;
        }
        if (eventName === "sources") {
          if (Array.isArray(data.items)) {
            const target = lastAssistant();
            if (target) {
              target.sources = normalizeSources(data.items);
              scheduleScroll();
            }
          }
          return;
        }
        if (eventName === "delta") {
          if (typeof data.text === "string" && data.text) {
            const target = lastAssistant();
            if (target) {
              target.streaming = true;
              ppfxQueueStreamDelta(target, data.text);
            }
          }
          return;
        }
        if (eventName === "usage") {
          usage.value = {
            count: data.count === undefined || data.count === null ? null : data.count,
            remaining: data.remaining === undefined || data.remaining === null ? null : data.remaining
          };
          return;
        }
        if (eventName === "done") {
          finishStream(seq, typeof data.finishReason === "string" ? data.finishReason : "stop");
          return;
        }
        if (eventName === "error") {
          const combined = String(data.code || "") + " " + String(data.message || "");
          terminateStreamWithError(seq, {
            code: data.code,
            message: data.message || "AI 服务返回错误。",
            isToken: aiChatIsTokenError(combined, 0),
            isSessionLimit: aiChatIsSessionLimit(combined),
            isModel: !aiChatIsTokenError(combined, 0) && !aiChatIsSessionLimit(combined) && aiChatIsModelError(combined)
          });
        }
      };

      const parseSseBlock = (block, seq) => {
        let eventName = "message";
        const dataLines = [];
        for (const line of String(block || "").split(/\r?\n/)) {
          if (!line || line.charAt(0) === ":") continue;
          const colon = line.indexOf(":");
          const field = colon === -1 ? line : line.slice(0, colon);
          let value = colon === -1 ? "" : line.slice(colon + 1);
          if (value.charAt(0) === " ") value = value.slice(1);
          if (field === "event") eventName = value || "message";
          else if (field === "data") dataLines.push(value);
        }
        if (!dataLines.length) return;
        const raw = dataLines.join("\n");
        const parsed = parseJson(raw);
        applySseEvent(eventName, parsed === null ? raw : parsed, seq);
      };

      const drainSseBuffer = (buffer, seq) => {
        let rest = buffer;
        while (true) {
          const match = rest.match(/\r?\n\r?\n/);
          if (!match) break;
          const block = rest.slice(0, match.index);
          rest = rest.slice(match.index + match[0].length);
          parseSseBlock(block, seq);
          if (seq !== streamSeq) break;
        }
        return rest;
      };

      const loadSession = async (id) => {
        if (!id) return;
        if (!hasToken.value) {
          setNotice("尚未配置 Token，请先在「配置」页填写后再载入会话。", "error", "config");
          return;
        }
        const sid = String(id);
        const seq = ++historySeq;
        abortStream(true);
        loadingHistory.value = true;
        currentSessionId.value = sid;
        messages.value = [];
        usage.value = null;
        stage.value = "";
        modelName.value = "";
        showSessions.value = false;
        showModels.value = false;
        deletePending.value = false;
        notice.value = null;
        try {
          const sessionUrl = getAiChatServer() + "/ai/chat/session?id=" + encodeURIComponent(sid) + "&token=" + encodeURIComponent(token.value);
          const response = await fetch(sessionUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store"
          });
          if (seq !== historySeq) return;
          const raw = await response.text();
          if (seq !== historySeq) return;
          const data = parseJson(raw);
          const codeValue = data && typeof data === "object" && data.code !== undefined ? data.code : null;
          const code = codeValue !== null && Number.isFinite(Number(codeValue)) ? Number(codeValue) : null;
          if (!response.ok || (code !== null && code !== 200 && code !== 0)) {
            throw makeRequestError(extractErrorInfo(raw, response.status));
          }
          const payload = data && typeof data === "object" && data.data !== undefined ? data.data : data;
          if (seq !== historySeq) return;
          messages.value = normalizeHistory(payload);
          const session = payload && typeof payload === "object" ? (payload.session || payload) : null;
          const serverTitle = session && !Array.isArray(session) && typeof session.title === "string" ? session.title : "";
          if (serverTitle) upsertSession(sid, serverTitle);
          ppfxFollowTail(true);
        } catch (error) {
          if (seq !== historySeq) return;
          if (error && error.status === 404 && !error.isToken) {
            removeSession(sid);
            if (currentSessionId.value === sid) {
              currentSessionId.value = null;
              messages.value = [];
            }
            setNotice("该会话不存在，已从本地列表移除。", "error");
            return;
          }
          if (error && error.isToken) setNotice("Token 无效或已失效，请前往「配置」检查。", "error", "config");
          else if (error && error.isSessionLimit) setNotice("服务器报告会话数量已达上限，请稍后重试或删除一个旧会话。", "error", "sessions");
          else setNotice(error && error.message ? error.message : "载入会话失败，请稍后重试。", "error");
        } finally {
          if (seq === historySeq) loadingHistory.value = false;
        }
      };

      const selectSession = (id) => {
        if (!id) return;
        if (!hasToken.value) {
          setNotice("尚未配置 Token，请先在「配置」页填写后再选择会话。", "error", "config");
          return;
        }
        if (String(id) === String(currentSessionId.value || "")) {
          showSessions.value = false;
          if (!loadingHistory.value && !messages.value.length) loadSession(id);
          return;
        }
        showSessions.value = false;
        showModels.value = false;
        deletePending.value = false;
        notice.value = null;
        loadSession(id);
      };

      const cancelHistoryLoad = () => {
        historySeq += 1;
        loadingHistory.value = false;
      };

      const newChat = () => {
        showSessions.value = false;
        showModels.value = false;
        deletePending.value = false;
        if (!currentSessionId.value && !messages.value.length) {
          vue.nextTick(focusComposer);
          return;
        }
        abortStream(true);
        cancelHistoryLoad();
        currentSessionId.value = null;
        messages.value = [];
        usage.value = null;
        stage.value = "";
        modelName.value = "";
        notice.value = null;
        vue.nextTick(focusComposer);
      };

      const clearCurrentChat = () => {
        abortStream(true);
        cancelHistoryLoad();
        currentSessionId.value = null;
        messages.value = [];
        usage.value = null;
        stage.value = "";
        modelName.value = "";
        showModels.value = false;
        deletePending.value = false;
      };

      const confirmDelete = async () => {
        if (deleting.value) return;
        const id = currentSessionId.value;
        if (!id) {
          clearCurrentChat();
          return;
        }
        if (!hasToken.value) {
          setNotice("尚未配置 Token，请先在「配置」页填写后再删除会话。", "error", "config");
          deletePending.value = false;
          return;
        }
        abortStream(true);
        deleting.value = true;
        try {
          const deleteUrl = getAiChatServer() + "/ai/chat/session?id=" + encodeURIComponent(id) + "&token=" + encodeURIComponent(token.value);
          const response = await fetch(deleteUrl, {
            method: "DELETE",
            headers: { Accept: "application/json" },
            cache: "no-store"
          });
          const raw = await response.text();
          const data = parseJson(raw);
          const codeValue = data && typeof data === "object" && data.code !== undefined ? data.code : null;
          const code = codeValue !== null && Number.isFinite(Number(codeValue)) ? Number(codeValue) : null;
          const errorInfo = extractErrorInfo(raw, response.status);
          if (response.status === 404 && errorInfo.isToken) throw makeRequestError(errorInfo);
          if (!response.ok && response.status !== 404) throw makeRequestError(errorInfo);
          if (response.status !== 404 && code !== null && code !== 200 && code !== 0 && code !== 204) {
            throw makeRequestError(errorInfo);
          }
          removeSession(id);
          if (currentSessionId.value === id) clearCurrentChat();
          setNotice("会话已删除", "ok");
        } catch (error) {
          if (error && error.isToken) setNotice("Token 无效或已失效，请前往「配置」检查。", "error", "config");
          else if (error && error.isSessionLimit) setNotice("服务器报告会话数量已达上限，请稍后重试或删除一个旧会话。", "error", "sessions");
          else setNotice(error && error.message ? error.message : "删除会话失败，请稍后重试。", "error");
        } finally {
          deleting.value = false;
          deletePending.value = false;
        }
      };

      const stopGeneration = () => {
        if (!streaming.value) return;
        abortStream(false);
      };

      const handleInput = (event) => {
        const el = event && event.target;
        if (!el) return;
        let value = String(el.value || "");
        if (value.length > AI_CHAT_MAX_LENGTH) {
          value = value.slice(0, AI_CHAT_MAX_LENGTH);
          el.value = value;
        }
        draft.value = value;
        autoGrow();
      };

      const handleKeydown = (event) => {
        if (event.key !== "Enter" || event.shiftKey) return;
        if (composing || event.isComposing || event.keyCode === 229) return;
        event.preventDefault();
        sendMessage();
      };

      const sendMessage = async () => {
        const text = String(draft.value || "").trim();
        if (!text || streaming.value || loadingHistory.value) return;
        if (text.length > AI_CHAT_MAX_LENGTH) {
          setNotice("消息超过 500 字，请删减后再发送。", "error");
          return;
        }
        if (!hasToken.value) {
          setNotice("尚未配置 Token，请先在「配置」页填写后再使用 AI 问答。", "error", "config");
          return;
        }
        notice.value = null;
        showSessions.value = false;
        showModels.value = false;
        deletePending.value = false;
        messages.value.push({ id: nextMessageId(), role: "user", content: text });
        messages.value.push({
          id: nextMessageId(),
          role: "assistant",
          content: "",
          sources: [],
          streaming: true,
          stopped: false
        });
        draft.value = "";
        vue.nextTick(() => {
          autoGrow();
          focusComposer();
        });
        ppfxFollowTail(true);
        streaming.value = true;
        stage.value = "";
        usage.value = null;
        modelName.value = "";
        const seq = ++streamSeq;
        const controller = new AbortController();
        abortController = controller;
        try {
          const response = await fetch(getAiChatServer() + "/ai/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream"
            },
            body: JSON.stringify({
              token: token.value,
              sessionId: currentSessionId.value || null,
              message: text,
              model: models.value.length ? (selectedModelId.value || undefined) : undefined,
              deepThinking: deepThinking.value,
              webSearch: webSearch.value
            }),
            signal: controller.signal,
            cache: "no-store"
          });
          if (seq !== streamSeq) return;
          const contentType = String(response.headers.get("content-type") || "").toLowerCase();
          if (!response.ok || contentType.includes("application/json")) {
            const raw = await response.text();
            if (seq !== streamSeq) return;
            throw makeRequestError(extractErrorInfo(raw, response.status));
          }
          if (!response.body || typeof response.body.getReader !== "function") {
            throw makeRequestError({ message: "当前浏览器不支持流式响应，请更换 Chrome 或 Edge。", code: "NO_STREAM" });
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";
          while (true) {
            const chunk = await reader.read();
            if (seq !== streamSeq) return;
            if (chunk.done) break;
            buffer += decoder.decode(chunk.value, { stream: true });
            buffer = drainSseBuffer(buffer, seq);
            if (seq !== streamSeq) return;
          }
          buffer += decoder.decode();
          if (seq !== streamSeq) return;
          if (buffer.trim()) parseSseBlock(buffer, seq);
          if (seq === streamSeq) finishStream(seq, "eof");
        } catch (error) {
          if (seq !== streamSeq) return;
          if (error && error.name === "AbortError") {
            abortStream(false);
            return;
          }
          const isToken = !!(error && error.isToken);
          const isLimit = !!(error && error.isSessionLimit);
          dropEmptyAssistant();
          streaming.value = false;
          stage.value = "";
          const controller = abortController;
          abortController = null;
          if (controller) {
            try { controller.abort(); } catch (e) {}
          }
          const rawMessage = error && error.message ? String(error.message) : "";
          const isModel = !isToken && !isLimit && aiChatIsModelError(String(error && error.code || "") + " " + rawMessage);
          let message = isToken
            ? "Token 无效或已失效，请前往「配置」重新填写。"
            : isLimit
              ? "服务器报告会话数量已达上限，请稍后重试或删除一个旧会话。"
              : isModel
                ? "当前模型不可用，请重新选择模型后重试。"
                : (rawMessage || "AI 服务请求失败，请稍后重试。");
          if (!isToken && !isLimit && !isModel) {
            if (/failed to fetch|networkerror|load failed/i.test(rawMessage)) {
              message = "无法连接 AI 服务，请稍后再试。";
            }
          }
          messages.value.push({ id: nextMessageId(), role: "error", content: message, action: isToken ? "config" : isLimit ? "sessions" : "" });
          if (isToken) setNotice("Token 无效或已失效，请前往「配置」检查后重试。", "error", "config");
          else if (isLimit) setNotice("服务器报告会话数量已达上限，请稍后重试或删除一个旧会话。", "error", "sessions");
          else if (isModel) {
            setNotice("当前模型不可用，已刷新模型列表，请重新选择。", "error");
            refreshModels();
          }
          ppfxFollowTail(true);
        } finally {
          if (seq === streamSeq) {
            streaming.value = false;
            stage.value = "";
            abortController = null;
          }
        }
      };

      const stageText = vue.computed(() => streaming.value ? (stage.value || "正在连接") : "");
      const selectedModelEntry = vue.computed(() =>
        models.value.find((item) => item.id === selectedModelId.value) || null
      );
      const selectedThinkingControl = vue.computed(() => {
        const control = selectedModelEntry.value && selectedModelEntry.value.thinkingControl;
        return ["toggle", "effort", "always", "none"].includes(control) ? control : "toggle";
      });
      const thinkingToggleLocked = vue.computed(() =>
        selectedThinkingControl.value === "always" || selectedThinkingControl.value === "none"
      );
      const thinkingToggleActive = vue.computed(() =>
        selectedThinkingControl.value === "always" ? true : deepThinking.value
      );
      const thinkingToggleTitle = vue.computed(() => {
        if (selectedThinkingControl.value === "always") return "该模型始终思考，无法关闭";
        if (selectedThinkingControl.value === "none") return "该模型不支持深度思考";
        if (selectedThinkingControl.value === "effort") {
          return deepThinking.value ? "深度思考已开启（max）" : "深度思考已关闭（low）";
        }
        return deepThinking.value ? "深度思考已开启" : "深度思考已关闭";
      });
      const selectedModelLabel = vue.computed(() => {
        if (modelName.value) {
          const actual = String(modelName.value);
          const known = models.value.find((item) =>
            item.id === actual || item.label.toLowerCase() === actual.toLowerCase()
          );
          return known ? known.label : actual;
        }
        if (selectedModelEntry.value) return selectedModelEntry.value.label;
        if (modelsLoading.value) return "加载模型…";
        return "默认模型";
      });
      const selectedModelCategory = vue.computed(() => {
        const actual = String(modelName.value || "");
        if (actual) {
          const known = models.value.find((item) =>
            item.id === actual || item.label.toLowerCase() === actual.toLowerCase()
          );
          if (known) return known.type;
        }
        return selectedModelEntry.value ? selectedModelEntry.value.type : "";
      });
      const modelSelectDisabled = vue.computed(() =>
        streaming.value || modelsLoading.value || !models.value.length
      );
      const usageText = vue.computed(() => {
        const value = usage.value;
        if (!value) return "";
        const parts = [];
        if (value.count !== null && value.count !== undefined) parts.push("本次 " + formatNumber(value.count));
        if (value.remaining !== null && value.remaining !== undefined) parts.push("剩余 " + formatNumber(value.remaining));
        return parts.join(" · ");
      });
      const overLimit = vue.computed(() => draft.value.length > AI_CHAT_MAX_LENGTH);
      const sendDisabled = vue.computed(() =>
        !hasToken.value || !draft.value.trim() || streaming.value || loadingHistory.value || overLimit.value
      );

      const toggleDelete = () => {
        if (!currentSessionId.value && !messages.value.length) return;
        deletePending.value = !deletePending.value;
        showSessions.value = false;
        showModels.value = false;
      };

      const handleNoticeAction = () => {
        const kind = notice.value && notice.value.kind;
        if (kind === "config") goConfig();
        else if (kind === "sessions") {
          showSessions.value = true;
          deletePending.value = false;
        }
      };

      const activate = () => {
        if (!isPanelVisible() || hasActivated.value) return;
        hasActivated.value = true;
        loadModels();
        if (hasToken.value && sessions.value.length && !currentSessionId.value && !messages.value.length) {
          loadSession(sessions.value[0].id);
        }
      };

      vue.onMounted(() => {
        vue.nextTick(() => {
          if (isPanelVisible()) activate();
          const parent = rootRef.value && rootRef.value.parentElement;
          if (parent && typeof MutationObserver === "function") {
            activationObserver = new MutationObserver(() => {
              if (isPanelVisible()) activate();
            });
            activationObserver.observe(parent, { attributes: true, attributeFilter: ["style", "class"] });
          }
        });
      });

      vue.onUnmounted(() => {
        if (activationObserver) activationObserver.disconnect();
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        if (noticeTimer) clearTimeout(noticeTimer);
        abortStream(true);
      });

      vue.watch(token, (value) => {
        if (!value) return;
        if (notice.value && notice.value.kind === "token") notice.value = null;
        if (!models.value.length) refreshModels();
        if (hasActivated.value && !currentSessionId.value && !messages.value.length && sessions.value.length) {
          loadSession(sessions.value[0].id);
        }
      });

      const renderSources = (sources) => {
        if (!webSearch.value || !sources || !sources.length) return null;
        const items = sources.map((source, index) => {
          const link = aiChatSourceLink(source.url);
          const props = { key: index, class: "pp-ai-source" };
          if (link) {
            props.href = link.href;
            props.target = "_blank";
            props.rel = "noopener noreferrer";
          }
          const title = String(source.title || "").trim() || (link ? link.host : "") || "未命名来源";
          return vue.h(link ? "a" : "div", props, [
            vue.h("span", { class: "pp-ai-source-title", title }, title),
            link && link.host ? vue.h("span", { class: "pp-ai-source-host", title: link.host }, link.host) : null
          ]);
        });
        return vue.h("details", { class: "pp-ai-sources" }, [
          vue.h("summary", null, [
            ppIcon("search", 10),
            vue.h("span", null, "参考来源"),
            vue.h("span", { class: "pp-ai-sources-count" }, sources.length),
            vue.h("span", { class: "pp-ai-sources-chev" }, ppIcon("chevronDown", 10))
          ]),
          vue.h("div", { class: "pp-ai-sources-list" }, items)
        ]);
      };

      const renderMessage = (message) => {
        if (message.role === "user") {
          return vue.h("div", { class: "pp-ai-msg user", key: message.id }, [
            vue.h("div", { class: "pp-ai-bubble" }, message.content)
          ]);
        }
        if (message.role === "error") {
          return vue.h("div", { class: "pp-ai-msg error", key: message.id }, [
            vue.h("span", { class: "pp-ai-avatar is-error" }, ppIcon("alert", 11)),
            vue.h("div", { class: "pp-ai-bubble" }, [
              vue.h("div", { class: "pp-ai-error-text" }, message.content),
              message.action ? vue.h("button", {
                type: "button",
                class: "pp-ai-linkbtn",
                onClick: message.action === "config" ? goConfig : () => {
                  showSessions.value = true;
                  deletePending.value = false;
                }
              }, message.action === "config" ? "去配置" : "管理会话") : null
            ])
          ]);
        }
        const bubble = [];
        if (message.content) {
          bubble.push(vue.h("div", { class: "pp-ai-md", innerHTML: aiChatRenderMarkdown(message.content) }));
        }
        if (message.streaming) bubble.push(vue.h("span", { class: "pp-ai-cursor" }));
        if (message.sources && message.sources.length) {
          const sourcesBlock = renderSources(message.sources);
          if (sourcesBlock) bubble.push(sourcesBlock);
        }
        if (message.stopped) bubble.push(vue.h("div", { class: "pp-ai-finish-note" }, "已停止生成"));
        if (message.interrupted) bubble.push(vue.h("div", { class: "pp-ai-finish-note" }, "生成中断"));
        if (message.truncated) bubble.push(vue.h("div", { class: "pp-ai-finish-note" }, "回答达到长度上限"));
        return vue.h("div", { class: "pp-ai-msg assistant", key: message.id }, [
          vue.h("span", { class: "pp-ai-avatar" }, vue.h(PpLogo, { size: 18 })),
          vue.h("div", { class: "pp-ai-bubble" }, bubble)
        ]);
      };

      const renderMessages = () => {
        if (loadingHistory.value) {
          return vue.h("div", { class: "pp-ai-welcome" }, [
            vue.h("span", { class: "pp-ai-welcome-ico" }, vue.h("span", { class: "pp-ai-spinner" })),
            vue.h("b", null, "正在载入会话"),
            vue.h("span", null, "正在获取历史消息…")
          ]);
        }
        if (!messages.value.length) {
          return vue.h("div", { class: "pp-ai-welcome" }, [
            vue.h("span", { class: "pp-ai-welcome-ico" }, aiChatIcon("ai", 20)),
            vue.h("b", null, "AI 问答"),
            vue.h("span", null, "可以询问课程知识点、写作思路或代码问题，回答支持 Markdown。"),
            vue.h("span", { class: "pp-ai-welcome-note" }, "支持 Markdown · 可开启深度思考与联网搜索")
          ]);
        }
        return messages.value.map(renderMessage);
      };

      const renderTopBar = () => vue.h("div", { class: "pp-ai-top" }, [
        vue.h("button", {
          type: "button",
          class: "pp-ai-picker",
          title: "选择历史会话",
          onClick: () => {
            showSessions.value = !showSessions.value;
            showModels.value = false;
            deletePending.value = false;
          }
        }, [
          ppIcon("message", 13),
          vue.h("span", { class: "pp-ai-picker-title" }, currentTitle.value || "新对话"),
          vue.h("span", { class: "pp-ai-count-pill" }, sessions.value.length + "/" + AI_CHAT_MAX_SESSIONS),
          ppIcon("chevronDown", 12)
        ]),
        vue.h("button", {
          type: "button",
          class: "pp-ai-tool",
          title: "新建对话",
          onClick: newChat
        }, [aiChatIcon("plus", 14)]),
        vue.h("button", {
          type: "button",
          class: ["pp-ai-tool", deletePending.value ? "is-active" : "", "is-danger"],
          title: "删除当前会话",
          disabled: deleting.value || (!currentSessionId.value && !messages.value.length),
          onClick: toggleDelete
        }, [deleting.value ? vue.h("span", { class: "pp-ai-mini-spin" }) : ppIcon("trash", 14)])
      ]);

      const renderSessionMenu = () => {
        if (!showSessions.value) return null;
        const items = sessions.value.map((item) => vue.h("button", {
          type: "button",
          key: item.id,
          class: ["pp-ai-session", item.id === currentSessionId.value ? "active" : ""],
          onClick: () => selectSession(item.id)
        }, [
          vue.h("span", { class: "pp-ai-session-main" }, [
            vue.h("span", { class: "pp-ai-session-title" }, item.title || "新对话"),
            vue.h("span", { class: "pp-ai-session-time" }, formatSessionTime(item.updatedAt))
          ]),
          item.id === currentSessionId.value ? vue.h("span", { class: "pp-ai-session-dot" }) : null
        ]));
        return [
          vue.h("div", { class: "pp-ai-menu-mask", onClick: () => { showSessions.value = false; } }),
          vue.h("div", { class: "pp-ai-menu" }, [
            vue.h("div", { class: "pp-ai-menu-head" }, [
              vue.h("b", null, "最近会话"),
              vue.h("span", null, sessions.value.length + " / " + AI_CHAT_MAX_SESSIONS)
            ]),
            sessions.value.length
              ? vue.h("div", { class: "pp-ai-session-list" }, items)
              : vue.h("div", { class: "pp-ai-menu-empty" }, "暂无历史会话"),
            currentSessionId.value
              ? vue.h("div", { class: "pp-ai-menu-foot" }, [
                  vue.h("button", {
                    type: "button",
                    onClick: () => {
                      showSessions.value = false;
                      deletePending.value = true;
                    }
                  }, "删除当前会话")
                ])
              : null
          ])
        ];
      };

      const renderTokenCallout = () => {
        if (hasToken.value) return null;
        return vue.h("div", { class: "pp-ai-callout" }, [
          ppIcon("key", 12),
          vue.h("span", { class: "pp-ai-callout-text" }, "尚未配置 Token，AI 问答需要先在「配置」页填写并校验 Token。"),
          vue.h("button", { type: "button", class: "pp-ai-linkbtn", onClick: goConfig }, "去配置")
        ]);
      };

      const renderNotice = () => {
        const value = notice.value;
        if (!value) return null;
        const actionLabel = value.kind === "config" ? "去配置" : value.kind === "sessions" ? "管理会话" : "";
        return vue.h("div", { class: ["pp-ai-callout", value.tone === "error" ? "is-error" : value.tone === "ok" ? "is-ok" : ""] }, [
          ppIcon(value.tone === "error" ? "alert" : value.tone === "ok" ? "check" : "info", 12),
          vue.h("span", { class: "pp-ai-callout-text" }, value.text),
          actionLabel ? vue.h("button", { type: "button", class: "pp-ai-linkbtn", onClick: handleNoticeAction }, actionLabel) : null,
          vue.h("button", {
            type: "button",
            class: "pp-ai-callout-x",
            title: "关闭提示",
            onClick: () => { notice.value = null; }
          }, "×")
        ]);
      };

      const renderDeleteConfirm = () => {
        if (!deletePending.value) return null;
        return vue.h("div", { class: "pp-ai-confirm" }, [
          ppIcon("alert", 12),
          vue.h("span", null, currentSessionId.value ? "删除当前会话？此操作不可恢复。" : "清空当前对话？"),
          vue.h("button", { type: "button", onClick: () => { deletePending.value = false; } }, "取消"),
          vue.h("button", {
            type: "button",
            class: "primary",
            disabled: deleting.value,
            onClick: confirmDelete
          }, deleting.value ? "删除中…" : "删除")
        ]);
      };

      const renderStatus = () => {
        const stageValue = stageText.value;
        const usageValue = usageText.value;
        if (!stageValue && !usageValue) return null;
        const ppfxLast = lastAssistant();
        const ppfxThinking = streaming.value && !(ppfxLast && ppfxLast.content);
        return vue.h("div", { class: "pp-ai-status" }, [
          stageValue
            ? vue.h("span", { class: "pp-ai-status-main" }, [
                vue.h("span", { class: "pp-ai-spinner" }),
                vue.h("span", null, stageValue),
                ppfxThinking
                  ? vue.h("span", { class: "ppfx-thinking", "aria-hidden": "true" }, [
                      vue.h("i"),
                      vue.h("i"),
                      vue.h("i")
                    ])
                  : null
              ])
            : vue.h("span", { class: "pp-ai-status-main" }, [
                ppIcon("check", 10),
                vue.h("span", null, "已完成")
              ]),
          usageValue ? vue.h("span", { class: "pp-ai-usage", title: "本次用量 / 剩余额度" }, usageValue) : null
        ]);
      };

      const chooseModel = (id) => {
        if (streaming.value || !id) return;
        selectedModelId.value = String(id);
        modelName.value = "";
        persistModel(selectedModelId.value);
        showModels.value = false;
      };

      const renderModelSelector = () => {
        const groups = modelGroups.value;
        const disabled = modelSelectDisabled.value;
        return vue.h("div", { class: "pp-ai-model" }, [
          vue.h("button", {
            type: "button",
            class: ["pp-ai-model-btn", showModels.value ? "is-active" : ""],
            title: "当前模型：" + (selectedModelCategory.value ? selectedModelCategory.value + " · " : "") + selectedModelLabel.value,
            disabled,
            onClick: () => {
              if (disabled) return;
              showModels.value = !showModels.value;
              showSessions.value = false;
              deletePending.value = false;
            }
          }, [
            vue.h("span", { class: "pp-ai-model-label" }, selectedModelLabel.value),
            ppIcon("chevronDown", 10)
          ]),
          showModels.value && groups.length ? vue.h("div", { class: "pp-ai-model-menu" }, [
            ...groups.map((group, groupIndex) => vue.h("div", {
              class: "pp-ai-model-group",
              key: group.type + "-" + groupIndex
            }, [
              vue.h("div", { class: "pp-ai-model-group-title" }, group.label || group.type),
              ...group.models.map((model) => vue.h("button", {
                type: "button",
                key: model.id,
                class: ["pp-ai-model-option", selectedModelId.value === model.id ? "active" : ""],
                title: (model.cost ? "费用：" + model.cost + " · " : "") + model.label,
                onClick: () => chooseModel(model.id)
              }, [
                vue.h("span", null, model.label),
                selectedModelId.value === model.id ? ppIcon("check", 10) : null
              ]))
            ]))
          ]) : null
        ]);
      };

      const renderToggles = () => vue.h("div", { class: "pp-ai-toggles" }, [
        vue.h("button", {
          type: "button",
          class: ["pp-ai-toggle", thinkingToggleActive.value ? "active" : ""],
          title: thinkingToggleTitle.value,
          disabled: streaming.value || thinkingToggleLocked.value,
          onClick: () => {
            if (thinkingToggleLocked.value) return;
            deepThinking.value = !deepThinking.value;
          }
        }, [aiChatIcon("ai", 10), vue.h("span", null, "深度思考")]),
        vue.h("button", {
          type: "button",
          class: ["pp-ai-toggle", webSearch.value ? "active" : ""],
          title: "开启后按需联网，寒暄/闲聊不会搜索",
          disabled: streaming.value,
          onClick: () => { webSearch.value = !webSearch.value; }
        }, [ppIcon("search", 10), vue.h("span", null, "联网搜索")])
      ]);

      const renderComposer = () => {
        return vue.h("div", { class: "pp-ai-composer" }, [
          vue.h("textarea", {
            ref: inputRef,
            class: ["pp-ai-input", overLimit.value ? "is-over" : ""],
            value: draft.value,
            rows: 1,
            maxlength: AI_CHAT_MAX_LENGTH,
            placeholder: hasToken.value ? "输入问题，最多 500 字…" : "请先在「配置」页填写 Token",
            disabled: loadingHistory.value,
            onInput: handleInput,
            onKeydown: handleKeydown,
            onCompositionstart: () => { composing = true; },
            onCompositionend: () => { composing = false; }
          }),
          vue.h("div", { class: "pp-ai-sendrow" }, [
            renderModelSelector(),
            vue.h("span", { class: ["pp-ai-count", overLimit.value ? "is-over" : ""] }, draft.value.length + "/" + AI_CHAT_MAX_LENGTH),
            streaming.value
              ? vue.h("button", {
                  type: "button",
                  class: ["pp-ai-send", "pp-ai-stop"],
                  onClick: stopGeneration
                }, [vue.h("i"), "停止"])
              : vue.h("button", {
                  type: "button",
                  class: "pp-ai-send",
                  disabled: sendDisabled.value,
                  onClick: sendMessage
                }, "发送")
          ])
        ]);
      };

      return () => {
        const children = [renderTopBar()];
        const menu = renderSessionMenu();
        if (menu) children.push(...menu);
        const tokenCallout = renderTokenCallout();
        if (tokenCallout) children.push(tokenCallout);
        const noticeBar = renderNotice();
        if (noticeBar) children.push(noticeBar);
        const confirmBar = renderDeleteConfirm();
        if (confirmBar) children.push(confirmBar);
        children.push(vue.h("div", { class: "pp-ai-messages", ref: listRef, onScroll: ppfxHandleListScroll }, renderMessages()));
        const statusRow = renderStatus();
        if (statusRow) children.push(statusRow);
        children.push(renderToggles());
        children.push(renderComposer());
        children.push(vue.h("div", { class: "pp-ai-enterhint" }, "Enter 发送 · Shift+Enter 换行"));
        return vue.h("div", { class: "pp-ai-chat", ref: rootRef }, children);
      };
    }
  });





  const _sfc_main$4 = vue.defineComponent({
    name: "AuthorWords",
    setup() {
      return () => vue.h("div", null, [
        ppDoc("作者的话", "message", [
          vue.h("blockquote", { class: "pp-quote" }, "“快点刷学习通，别卷了”"),
          vue.h("p", { class: "muted" }, "别卷了别卷了，真的别卷了"),
          vue.h("p", null, "不是，你还真看啊，学习通刷完了么你")
        ]),
        ppDoc("免更新版本", "refresh", [
          vue.h("p", null, "轻量级引导脚本，自动获取最新的刷课脚本代码执行，支持热更新，无需手动更新。"),
          vue.h("a", {
            class: "pp-link",
            href: "https://scriptcat.org/zh-CN/script-show-page/5615",
            target: "_blank"
          }, [vue.h("span", null, "获取免更新版本"), ppIcon("external", 12)])
        ]),
        ppDoc("使用教程", "book", [
          vue.h("p", null, "【学习通】功能基本完成；【智慧树】目前只支持答题。"),
          vue.h("p", null, "题库配置：脚本配置 → 填写 24 位 Token → 点击验证。"),
          vue.h("p", null, "如遇问题，请在「反馈」页提交，核实后可获得 100–500 次数奖励。")
        ]),
        ppDoc("用户协议", "shield", [
          vue.h("p", null, "本脚本仅供学习和研究使用，并应在 24 小时内删除；使用不应违反任何法律法规及学术道德。"),
          vue.h("p", null, "因使用脚本产生的任何后果由用户自行承担；题库为第三方收集，相关问题与脚本无关。")
        ])
      ]);
    }
  });
  const FeedbackPanel = vue.defineComponent({
    name: "FeedbackPanel",
    setup() {
      const configStore = useConfigStore();
      const qq = vue.ref("");
      const content = vue.ref("");
      const status = vue.ref("idle");
      const errorMsg = vue.ref("");
      const errorTone = vue.ref("bad");
      const touched = vue.ref(false);
      const cooldown = vue.ref(0);
      const communityCta = vue.ref(false);
      let cooldownTimer = null;

      const countChars = (value) => Array.from(String(value || "")).length;
      const charCount = vue.computed(() => countChars(content.value));
      const qqValid = vue.computed(() => /^[1-9]\d{4,11}$/.test(String(qq.value || "").trim()));
      const qqBad = vue.computed(() => touched.value && !qqValid.value);
      const overLimit = vue.computed(() => charCount.value > 500);
      const readToken = () => String(configStore.queryApis && configStore.queryApis[0] && configStore.queryApis[0].token || "").trim();
      const canSubmit = vue.computed(() => qqValid.value && charCount.value > 0 && !overLimit.value && cooldown.value <= 0 && status.value !== "loading");

      const platformName = () => {
        const key = String(configStore.platformName || "").trim();
        return key === "cx" || key === "zhs" || key === "ykt" ? key : "other";
      };
      const pageHref = () => (typeof location !== "undefined" && location.href) ? String(location.href) : "";

      const stopCooldown = () => {
        if (cooldownTimer) {
          clearTimeout(cooldownTimer);
          cooldownTimer = null;
        }
      };
      const startCooldown = (seconds) => {
        const raw = Number(seconds);
        const safe = Number.isFinite(raw) && raw > 0 ? Math.ceil(raw) : 60;
        cooldown.value = safe;
        stopCooldown();
        cooldownTimer = setTimeout(() => {
          cooldown.value = 0;
          cooldownTimer = null;
          if (status.value === "error" && errorTone.value === "warn") {
            status.value = "idle";
            errorMsg.value = "";
          }
        }, safe * 1000);
      };
      vue.onUnmounted(stopCooldown);

      const clearError = () => {
        if (status.value === "error" && cooldown.value <= 0) {
          status.value = "idle";
          errorMsg.value = "";
          errorTone.value = "bad";
        }
      };
      const handleQqInput = (event) => {
        const raw = String(event && event.target ? event.target.value : "").replace(/\D+/g, "").slice(0, 12);
        qq.value = raw;
        if (event && event.target && event.target.value !== raw) event.target.value = raw;
        touched.value = true;
        clearError();
      };
      const handleContentInput = (event) => {
        content.value = String(event && event.target ? event.target.value : "");
        clearError();
      };

      const pickMessage = (body) => {
        if (!body || typeof body !== "object") return "";
        const values = [body.msg, body.message, body.error, body.data && body.data.msg, body.data && body.data.message, body.data && body.data.error];
        for (let i = 0; i < values.length; i++) {
          const text = typeof values[i] === "string" ? values[i].trim() : "";
          if (text) return text.slice(0, 160);
        }
        return "";
      };
      const pickErrorCode = (body) => {
        if (!body || typeof body !== "object") return "";
        const values = [
          body.code, body.errorCode, body.error_code, body.error,
          body.data && body.data.code, body.data && body.data.errorCode,
          body.data && body.data.error_code, body.data && body.data.error
        ];
        for (let i = 0; i < values.length; i++) {
          if (typeof values[i] !== "string") continue;
          const code = values[i].trim().toUpperCase();
          if (code === "FEEDBACK_TOKEN_INVALID" || code === "FEEDBACK_SPONSORED_ONLY") return code;
        }
        return "";
      };
      const readHeader = (response, name) => {
        const lines = String(response && response.responseHeaders || "").split(/\r?\n/);
        const lower = name.toLowerCase();
        for (let i = 0; i < lines.length; i++) {
          const idx = lines[i].indexOf(":");
          if (idx > 0 && lines[i].slice(0, idx).trim().toLowerCase() === lower) {
            return lines[i].slice(idx + 1).trim();
          }
        }
        return "";
      };
      const retrySeconds = (response, body) => {
        const header = readHeader(response, "retry-after");
        if (header) {
          const asNumber = Number(header);
          if (Number.isFinite(asNumber) && asNumber > 0) return Math.ceil(asNumber);
          const asDate = Date.parse(header);
          if (!isNaN(asDate)) return Math.max(1, Math.ceil((asDate - Date.now()) / 1000));
        }
        const data = body && typeof body === "object" ? body.data : null;
        const values = [
          body && body.retryAfter, body && body.retry_after, body && body.retrySeconds,
          data && data.retryAfter, data && data.retry_after, data && data.retrySeconds, data && data.retry
        ];
        for (let i = 0; i < values.length; i++) {
          const num = Number(values[i]);
          if (Number.isFinite(num) && num > 0) return Math.ceil(num);
        }
        return 60;
      };

      const sendRequest = (payload) => new Promise((resolve, reject) => {
        const url = String(CURRENT_SERVER || "").replace(/\/$/, "") + "/feedback";
        if (typeof _GM_xmlhttpRequest === "function") {
          _GM_xmlhttpRequest({
            method: "POST",
            url,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify(payload),
            timeout: 15000,
            onload: (response) => resolve(response),
            onerror: () => reject(new Error("network")),
            ontimeout: () => reject(new Error("timeout"))
          });
          return;
        }
        if (typeof fetch === "function") {
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }).then((response) => response.text().then((text) => {
            const headers = [];
            if (response.headers && typeof response.headers.forEach === "function") {
              response.headers.forEach((value, key) => { headers.push(key + ": " + value); });
            }
            resolve({ status: response.status, responseText: text, responseHeaders: headers.join("\r\n") });
          })).catch(reject);
          return;
        }
        reject(new Error("unsupported"));
      });

      const handleResponse = (response) => {
        const httpStatus = Number(response && response.status) || 0;
        const responseText = String(response && response.responseText || "");
        let body = null;
        if (responseText.trim()) {
          try {
            body = JSON.parse(responseText);
          } catch (e) {
            body = null;
          }
        }
        const message = pickMessage(body);
        const usableMessage = /^(ok|success|successful|成功)$/i.test(message) ? "" : message;
        const plain = responseText.trim();
        const safePlain = plain && plain.length <= 200 && !/^[<{[]/.test(plain) ? plain : "";
        const bodyCode = body && body.code !== undefined ? Number(body.code) : NaN;
        const errorCode = pickErrorCode(body);
        const tokenError = errorCode === "FEEDBACK_TOKEN_INVALID";
        const sponsoredError = errorCode === "FEEDBACK_SPONSORED_ONLY";
        const explicitFailure = body && (body.success === false || body.ok === false || (body.data && (body.data.success === false || body.data.ok === false)));
        const httpOk = httpStatus >= 200 && httpStatus < 300;
        const bodyOk = !body || (!body.code && isNaN(bodyCode)) || bodyCode === 0 || bodyCode === 200 || bodyCode === 201;
        if (httpOk && !explicitFailure && !errorCode && (body ? bodyOk : httpStatus === 204)) {
          status.value = "success";
          errorMsg.value = "";
          errorTone.value = "bad";
          communityCta.value = false;
          cooldown.value = 0;
          stopCooldown();
          content.value = "";
          return;
        }
        communityCta.value = false;
        let code = httpStatus >= 400 ? httpStatus : 0;
        if (!code && errorCode) code = tokenError ? 401 : 403;
        if (!code && !isNaN(bodyCode) && bodyCode !== 200 && bodyCode !== 201 && bodyCode !== 0) code = bodyCode;
        if (!code && body && body.code && isNaN(bodyCode)) code = 500;
        if (!code) code = 500;
        if (tokenError || sponsoredError || httpStatus === 401 || httpStatus === 403 || code === 401 || code === 403) {
          communityCta.value = true;
          errorTone.value = "bad";
          if (tokenError) {
            errorMsg.value = "Token 无效或已失效，请到「配置」页重新验证；服务器反馈仅限赞助用户，也可使用社区反馈。";
          } else if (sponsoredError) {
            errorMsg.value = "该 Token 未开通赞助权益，服务器反馈仅限赞助用户；请使用社区反馈。";
          } else {
            errorMsg.value = "Token 校验失败，服务器反馈仅限赞助用户；请到「配置」页重新验证，或使用社区反馈。";
          }
          status.value = "error";
          return;
        }
        if (code === 429) {
          const wait = retrySeconds(response, body);
          startCooldown(wait);
          errorTone.value = "warn";
          errorMsg.value = "请 " + wait + " 秒后再试";
          status.value = "error";
          return;
        }
        if (code === 400 || code === 422) {
          errorTone.value = "bad";
          errorMsg.value = usableMessage || safePlain || "提交内容未通过校验，请检查 QQ 号和反馈内容";
          status.value = "error";
          return;
        }
        errorTone.value = "bad";
        errorMsg.value = code >= 500 ? (usableMessage || "服务器繁忙，请稍后重试") : (usableMessage || "提交失败（" + code + "），请稍后重试");
        status.value = "error";
      };

      const handleSubmit = async () => {
        touched.value = true;
        if (status.value === "loading") return;
        if (cooldown.value > 0) {
          status.value = "error";
          errorTone.value = "warn";
          errorMsg.value = "请 " + cooldown.value + " 秒后再试";
          return;
        }
        if (!qqValid.value) {
          status.value = "error";
          errorTone.value = "bad";
          errorMsg.value = "请输入 5–12 位数字 QQ 号";
          return;
        }
        if (charCount.value === 0) {
          status.value = "error";
          errorTone.value = "bad";
          errorMsg.value = "请填写反馈内容";
          return;
        }
        if (overLimit.value) {
          status.value = "error";
          errorTone.value = "bad";
          errorMsg.value = "反馈内容最多 500 个字符";
          return;
        }
        const token = readToken();
        const payload = {
          qq: String(qq.value || "").trim(),
          content: content.value,
          platform: platformName(),
          pageUrl: pageHref()
        };
        if (token) payload.token = token;
        communityCta.value = false;
        status.value = "loading";
        errorMsg.value = "";
        errorTone.value = "bad";
        try {
          const response = await sendRequest(payload);
          handleResponse(response);
        } catch (error) {
          status.value = "error";
          errorTone.value = "bad";
          if (error && error.message === "timeout") {
            errorMsg.value = "请求超时，请检查网络后重试";
          } else {
            errorMsg.value = "网络异常，未能连接反馈服务器，请稍后重试";
          }
        }
      };

      const COMMUNITY_URL = "https://scriptcat.org/zh-CN/script-show-page/5597/issue";
      const communityLink = (label, className) => vue.h("a", {
        class: className,
        href: COMMUNITY_URL,
        target: "_blank",
        rel: "noopener noreferrer"
      }, [label, ppIcon("external", 10)]);
      const renderCommunityCta = (title, desc) => vue.h("div", { class: "pp-fb-cta" }, [
        vue.h("b", null, title),
        vue.h("p", null, desc),
        communityLink("前往脚本社区反馈", "pp-fb-cta-btn")
      ]);
      const submitLabel = () => status.value === "loading" ? "提交中…" : "提交反馈";

      const renderError = () => {
        if (status.value !== "error" || !errorMsg.value) return null;
        return vue.h("div", { class: ["pp-note", errorTone.value === "warn" ? "" : "bad"], role: "alert" }, [
          ppIcon(errorTone.value === "warn" ? "clock" : "alert", 11),
          vue.h("span", null, errorMsg.value)
        ]);
      };
      const renderSuccess = () => vue.h("div", { class: "pp-fb-success", role: "status" }, [
        vue.h("span", { class: "pp-fb-success-ico" }, ppIcon("check", 18)),
        vue.h("b", null, "反馈已提交"),
        vue.h("span", { class: "pp-fb-success-text" }, "核实后会通过 QQ 联系你，请留意好友消息。"),
        vue.h("button", {
          type: "button",
          class: "pp-fb-again",
          onClick: () => {
            status.value = "idle";
            errorMsg.value = "";
            errorTone.value = "bad";
            communityCta.value = false;
          }
        }, "再写一条")
      ]);

      return () => vue.h("div", { class: "pp-fb" }, [
        vue.h("section", { class: "pp-fb-card" }, [
          vue.h("div", { class: "pp-fb-head" }, [
            vue.h("span", { class: "pp-fb-head-ico" }, ppIcon("message", 14)),
            vue.h("span", { class: "pp-fb-title" }, "意见反馈")
          ]),
          status.value === "success" ? renderSuccess() : [
            vue.h("div", { class: "pp-fb-reward" }, [
              vue.h("span", { class: "pp-fb-reward-ico" }, ppIcon("gift", 13)),
              vue.h("span", null, "反馈核实后可获得 100–500 次数奖励")
            ]),
            vue.h("div", { class: "pp-fb-field" }, [
              vue.h("label", { class: "pp-fb-label", for: "pp-fb-content" }, [
                vue.h("span", null, "反馈内容"),
                vue.h("span", { class: "pp-fb-req" }, "*")
              ]),
              vue.h("div", { class: ["pp-fb-area-wrap", overLimit.value ? "is-bad" : ""] }, [
                vue.h("textarea", {
                  id: "pp-fb-content",
                  class: "pp-fb-textarea",
                  rows: 5,
                  maxlength: 500,
                  autocomplete: "off",
                  placeholder: "请描述遇到的问题、建议或想反馈的内容…",
                  value: content.value,
                  disabled: status.value === "loading",
                  onInput: handleContentInput
                }),
                vue.h("span", { class: ["pp-fb-count", overLimit.value ? "is-over" : ""] }, charCount.value + "/500")
              ])
            ]),
            vue.h("div", { class: "pp-fb-field" }, [
              vue.h("label", { class: "pp-fb-label", for: "pp-fb-qq" }, [
                vue.h("span", null, "QQ 号"),
                vue.h("span", { class: "pp-fb-req" }, "*")
              ]),
              vue.h("input", {
                id: "pp-fb-qq",
                class: ["pp-fb-input", qqBad.value ? "is-bad" : ""],
                type: "text",
                inputmode: "numeric",
                maxlength: 12,
                autocomplete: "off",
                required: true,
                placeholder: "请输入 5–12 位 QQ 号",
                value: qq.value,
                disabled: status.value === "loading",
                "aria-required": "true",
                "aria-invalid": qqBad.value ? "true" : "false",
                onInput: handleQqInput,
                onBlur: () => { touched.value = true; }
              }),
              qqBad.value ? vue.h("div", { class: "pp-fb-field-hint" }, "请输入 5–12 位数字 QQ 号") : null
            ]),
            vue.h("p", { class: "pp-fb-explain pp-fb-qq-hint" }, "请您填写真实 QQ 号，核实后我们会通过 QQ 与您联系。"),
            renderError(),
            communityCta.value
              ? renderCommunityCta("服务器反馈仅限赞助用户", "未检测到有效赞助 Token；请到「配置」页重新验证，或使用社区反馈。")
              : null,
            vue.h("div", { class: "pp-fb-actions" }, [
              vue.h("button", {
                type: "button",
                class: ["pp-fb-submit", status.value === "loading" ? "is-loading" : ""],
                disabled: !canSubmit.value,
                onClick: handleSubmit
              }, submitLabel())
            ])
          ]
        ]),
        ppHint("反馈内容仅用于核实处理，不会保存在本地", { icon: "shield" }),
        communityLink("也可以前往脚本社区反馈", "pp-fb-community")
      ]);
    }
  });

const AuthorWords = _sfc_main$4;

  const _sfc_main_description = vue.defineComponent({
    name: "ScriptDescription",
    setup() {
      const desc = vue.ref(globalScriptDescription);
      const modeBlock = (title, titleClass, mode) => {
        const nodes = [
          vue.h("h4", { class: titleClass }, title),
          vue.h("p", null, mode.desc || ""),
          vue.h("p", { class: "muted" }, "消耗：" + (mode.cost || "-"))
        ];
        (mode.details || []).forEach((detail) => nodes.push(vue.h("p", { class: "muted" }, "• " + detail)));
        if (mode.models && mode.models.length) {
          nodes.push(vue.h("p", { class: "muted" }, "校验模型：" + mode.models.join("、")));
        }
        return nodes;
      };
      return () => {
        const d = desc.value;
        if (!d) {
          return ppEmpty({ icon: "book", title: "暂无脚本说明", desc: "服务器暂时没有返回说明内容" });
        }
        const groups = d.modelGroups || [];
        return vue.h("div", null, [
          ppDoc("模式说明", "sliders", [
            ...modeBlock("正常模式", "pp-mode-normal", d.modes.normal || {}),
            ...modeBlock("校验模式", "pp-mode-verify", d.modes.verify || {}),
            ...modeBlock("AI 模式", "pp-mode-ai", d.modes.ai || {})
          ]),
          ppDoc("AI 模型价格", "spark", groups.map((group) => vue.h("div", { key: group.type }, [
            vue.h("h4", null, group.type),
            (group.models || []).map((model) => vue.h("div", { key: model.name }, [
              vue.h("div", { class: "pp-price-row" }, [
                vue.h("b", null, model.name),
                vue.h("span", { class: "pp-price-cost" }, model.cost)
              ]),
              vue.h("div", { class: "pp-price-sub" }, "输入 ¥" + model.inputPrice + " / 输出 ¥" + model.outputPrice)
            ]))
          ]))),
          d.sponsor
            ? ppDoc("赞助支持", "heart", [
                vue.h("p", null, [
                  d.sponsor.text.split(d.sponsor.linkText)[0],
                  vue.h("a", { href: d.sponsor.link, target: "_blank" }, d.sponsor.linkText),
                  d.sponsor.text.split(d.sponsor.linkText)[1] || ""
                ])
              ])
            : null
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





  let _ppFontTableCache = null;
  function _ppGetFontTable() {
    if (_ppFontTableCache) return _ppFontTableCache;
    const text = _GM_getResourceText("ttf");
    if (!text) throw new Error("字体参考表资源缺失（@resource ttf 未取到）");
    _ppFontTableCache = JSON.parse(text);
    return _ppFontTableCache;
  }

  function _ppApplyCipherMap(text, doc) {
    const map = doc && doc.__ppCipherCharMap;
    if (!map || !text) return text;
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const codePoint = text.charCodeAt(i);
      out += map[codePoint] ? String.fromCharCode(map[codePoint]) : text[i];
    }
    return out;
  }

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
    const ttfTable = _ppGetFontTable();
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
    doc.__ppCipherCharMap = charMap;
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

  const ppfxWaitFaceCheck = async (timeoutMs = 120000, pollMs = 2000) => {
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

  const waitForAudioFrames = async (doc, timeoutMs = 5000) => {
    if (!doc) return;
    const frames = Array.from(doc.querySelectorAll('iframe[src*="audioplay"]'));
    if (!frames.length) return;
    const ready = () =>
      frames.every((frame) => {
        try {
          const inner = frame.contentDocument;
          if (!inner) return false;
          const audio = inner.querySelector("audio");
          return Boolean((audio && audio.src) || inner.querySelector("source[src]"));
        } catch (e) {
          return false;
        }
      });
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (ready()) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
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

        if (question.type === "14" && Array.isArray(question._cloze) && question._cloze.length > 0) {
          return question._cloze.every((c) => (c.elements || []).some((el) => el.querySelector(".check_answer")));
        }

        if (question.type === "24" && question._fillBlanks && Array.isArray(question._fillBlanks.blanks)) {
          return question._fillBlanks.blanks.every((b) => b && b.classList && b.classList.contains("hasFill"));
        }

        if (question.type === "20" && Array.isArray(question._shared) && question._shared.length > 0) {
          return question._shared.every((s) =>
            (s.elements || []).some((el) => (el.classList ? el.classList.contains("check_answer") : false)),
          );
        }

        if (
          question.type === "2" ||
          question.type === "14" ||
          question.type === "9" ||
          (question.type === "10" && String(question.workType) !== "zhs")
        ) {

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

        if (question.type === "4" || question.type === "5" || question.type === "6" || question.type === "7" || question.type === "8") {
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

        if (question.type === "17") {
          try {
            const cmHost = question.element.querySelector(".CodeMirror");
            const cm = cmHost && cmHost.CodeMirror;
            if (cm && typeof cm.getValue === "function" && String(cm.getValue() || "").trim() !== "") return true;
          } catch (e) {}
          try {
            const codeEditor = question.element.querySelector("textarea.code-editor");
            if (codeEditor && String(codeEditor.value || "").trim() !== "") return true;
          } catch (e) {}
          return false;
        }

        if (question.type === "26") {
          try {
            const textareaElement = question.element.querySelector("textarea");
            const UE = this._window && this._window.UE;
            const ueditor =
              UE && textareaElement && typeof UE.getEditor === "function"
                ? UE.getEditor(textareaElement.id || textareaElement.name)
                : null;
            if (ueditor && typeof ueditor.getContent === "function" && this.stripTags(ueditor.getContent()).trim() !== "") {
              return true;
            }
          } catch (e) {}
          try {
            const ueFrame = question.element.querySelector("iframe#ueditor_0");
            if (ueFrame) {
              const doc = ueFrame.contentDocument || (ueFrame.contentWindow && ueFrame.contentWindow.document);
              const body = doc && doc.body;
              if (body && String(body.textContent || "").trim() !== "") return true;
            }
          } catch (e) {}
          return false;
        }

        if (Array.isArray(question._reading) && question._reading.length > 0) {
          return question._reading.every((sub) => {
            if (Array.isArray(sub.blanks) && sub.blanks.length > 0) {
              return sub.blanks.every((blankEl) => this.isBlankFilled(blankEl));
            }
            if (sub.el && sub.el.querySelector("textarea, iframe, .InpDIV")) {
              return this.isBlankFilled(sub.el);
            }
            return (sub.elements || []).some((el) =>
              el.querySelector(".check_answer, .onChecked") ||
              (el.classList && el.classList.contains("check_answer"))
            );
          });
        }
        return false;
      });

      __publicField(this, "typeMap", new Map([
        ["单选题", "0"], ["A1型题", "0"], ["A1A2型题", "0"],
        ["多选题", "1"], ["X型题", "1"],
        ["填空题", "2"], ["听力填空", "2"], ["听力对话填空", "2"], ["完形填空", "2"], ["短文填空", "2"], ["选词填空", "2"],
        ["填表题", "2"], ["阅读填空", "2"], ["阅读题", "2"], ["阅读理解", "2"],
        ["程序题", "17"], ["写作题", "26"],
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
          const lazy = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src") || img.getAttribute("data-actualsrc");
          const cur = (img.getAttribute("src") || "").trim();
          if (lazy && (!cur || /^data:/i.test(cur))) {
            try {
              img.setAttribute("src", new URL(lazy, window.location.href).toString());
            } catch (e) {
              img.setAttribute("src", lazy);
            }
            return;
          }
          const abs = img.src;
          if (abs) img.setAttribute("src", abs);
        });
        return clone.innerHTML;
      });

      __publicField(this, "collectAudioUrls", (root) => {
        const urls = [];
        const push = (u) => {
          const s = String(u || "").trim();
          if (!s || !/^https?:\/\//i.test(s)) return;
          if (!urls.includes(s)) urls.push(s);
        };
        try {
          root.querySelectorAll('iframe[src*="audioplay"], audio').forEach((node) => {
            if (String(node.tagName || "").toLowerCase() === "audio") {
              push(node.src);
              node.querySelectorAll("source[src]").forEach((s) => push(s.getAttribute("src")));
              return;
            }
            try {
              const doc = node.contentDocument;
              if (!doc) return;
              const audio = doc.querySelector("audio");
              if (audio && audio.src) push(audio.src);
              doc.querySelectorAll("audio source[src], source[src]").forEach((s) => {
                const u = s.getAttribute("src") || "";
                if (/\.(mp3|m4a|wav|aac)(\?|$)/i.test(u)) push(u);
              });
            } catch (e) {}
          });
          root.querySelectorAll("[data-url]").forEach((el) => {
            const u = el.getAttribute("data-url") || "";
            if (/\.(mp3|m4a|wav|aac)(\?|$)/i.test(u)) push(u);
          });
        } catch (e) {}
        return urls.slice(0, 3);
      });
      __publicField(this, "collectVideoUrls", () => {
        const urls = [];
        const push = (u) => {
          const s = String(u || "").trim();
          if (!s || !/^https?:\/\//i.test(s)) return;
          if (!urls.includes(s)) urls.push(s);
        };
        const scan = (doc, depth) => {
          if (!doc || depth > 3) return;
          try {
            doc.querySelectorAll("video").forEach((v) => push(v.currentSrc || v.src));
          } catch (e) {}
          try {
            doc.querySelectorAll('iframe[src*="video"]').forEach((f) => {
              try {
                scan(f.contentDocument, depth + 1);
              } catch (e) {}
            });
          } catch (e) {}
        };
        let w = this._window;
        for (let i = 0; i < 3 && w; i++) {
          try {
            scan(w.document, 0);
          } catch (e) {}
          if (!w.parent || w.parent === w) break;
          w = w.parent;
        }
        return urls.slice(0, 3);
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

  const showNoticeDialog = (title, message, noticeType, message2) => {
    try {
      if (document.getElementById("server-notice-dialog")) return;
      const blocks = [message, message2]
        .filter((text) => String(text || "").trim() !== "")
        .map((text) => `<div class="pp-notice-block">${text}</div>`)
        .join("");
      if (!blocks) return;
      _ppEnsurePublicStyles();
      const dialog = document.createElement("div");
      dialog.id = "server-notice-dialog";
      dialog.innerHTML = `
        <div class="pp-public-overlay">
          <div class="pp-public-modal" role="dialog" aria-modal="true" aria-label="系统公告">
            <div class="pp-public-head">
              <span class="pp-public-ico">📢</span>
              <div class="pp-public-titles">
                <div class="pp-public-title">${_ppPublicEscape(title || "系统公告")}</div>
                <div class="pp-public-sub">来自服务端</div>
              </div>
              <button id="notice-close-x" class="pp-public-close" type="button" title="关闭">×</button>
            </div>
            <div class="pp-public-body pp-public-notice">${blocks}</div>
            <div class="pp-public-actions">
              <button id="notice-close-btn" class="pp-public-btn primary" type="button">我知道了</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);
      const close = () => {
        try { _GM_setValue("closed_notice_type", noticeType); } catch (e) {}
        document.removeEventListener("keydown", onKey);
        dialog.remove();
      };
      const onKey = (event) => {
        if (event.key === "Escape") close();
      };
      document.getElementById("notice-close-btn").onclick = close;
      document.getElementById("notice-close-x").onclick = close;
      document.addEventListener("keydown", onKey);
    } catch (e) {}
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
            const noticeMessage2 = result.data.message2 || '';
            const noticeTitle = result.data.title || '系统公告';
            const closedNotice = _GM_getValue('closed_notice_type', 0);
            if (closedNotice === noticeType) {

              return;
            }
            showNoticeDialog(noticeTitle, noticeMessage, noticeType, noticeMessage2);
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

  const ANSWER_THRESHOLD_DEFAULT = 85;
  const ANSWER_THRESHOLD_MIN = 50;
  const ANSWER_THRESHOLD_MAX = 99;

  const findAnswerParam = (platformKey, paramName) => {
    try {
      const store = useConfigStore();
      const key = platformKey || store.platformName;
      const parts = store.platformParams?.[key]?.parts || [];
      const part = parts.find((p) => p.name === "答题参数");
      return (part?.params || []).find((p) => p.name === paramName) || null;
    } catch (e) {
      return null;
    }
  };

  const resolveAnswerThreshold = (platformKey) => {
    const raw = Number(findAnswerParam(platformKey, "正确阈值")?.value);
    return Math.min(
      ANSWER_THRESHOLD_MAX,
      Math.max(ANSWER_THRESHOLD_MIN, Number.isFinite(raw) && raw > 0 ? raw : ANSWER_THRESHOLD_DEFAULT),
    );
  };

  const computeFillRate = (filled, total) => {
    const totalNum = Number(total) || 0;
    if (totalNum <= 0) return 0;
    const filledNum = Math.max(0, Math.min(totalNum, Number(filled) || 0));
    return Math.round((filledNum / totalNum) * 10000) / 100;
  };

  const describeFillProgress = (filled, total, skipped = 0) => {
    const filledNum = Math.max(0, Number(filled) || 0);
    const totalNum = Math.max(0, Number(total) || 0);
    const skippedHint = Number(skipped) > 0 ? `，跳过已答 ${Number(skipped) || 0} 题` : "";
    return `已填涂 ${filledNum}/${totalNum} 题，填涂率 ${computeFillRate(filledNum, totalNum)}%${skippedHint}`;
  };

  const logFillProgress = (addLog, pageLabel, filled, total, skipped = 0) => {
    try {
      addLog(`[${pageLabel}] ${describeFillProgress(filled, total, skipped)}`, "primary");
    } catch (e) {}
    return computeFillRate(filled, total);
  };

  const runAnswerSubmitPolicy = async (options) => {
    const opts = options || {};
    const addLog = typeof opts.addLog === "function" ? opts.addLog : () => {};
    const pageLabel = opts.pageLabel || "答题";
    const autoSubmit = Boolean(opts.autoSubmit);
    const threshold = resolveAnswerThreshold(opts.platformKey);
    const fillRate = computeFillRate(opts.filled, opts.total);
    const canSubmit = opts.canSubmit === undefined ? typeof opts.submit === "function" : Boolean(opts.canSubmit);
    const canDraft = opts.canDraft === undefined ? typeof opts.draft === "function" : Boolean(opts.canDraft);
    if (opts.logRate !== false) {
      addLog(`[${pageLabel}] ${describeFillProgress(opts.filled, opts.total, opts.skipped)}`, "primary");
    }
    if (!autoSubmit) {
      if (canDraft) {
        addLog(`[${pageLabel}] 未开启自动提交：不提交，仅暂存`, "primary");
        await opts.draft();
      } else {
        addLog(`[${pageLabel}] 未开启自动提交：不提交，请手动检查后提交`, "primary");
      }
      return { fillRate, threshold, action: "idle" };
    }
    if (!canSubmit) {
      addLog(`[${pageLabel}] 当前页面无自动提交能力：仅填涂，不提交`, "warning");
      return { fillRate, threshold, action: "idle" };
    }
    if (fillRate >= threshold) {
      addLog(`[${pageLabel}] 填涂率 ${fillRate}% ≥ 正确阈值 ${threshold}%：提交`, "success");
      await opts.submit();
      return { fillRate, threshold, action: "submit" };
    }
    if (canDraft) {
      addLog(`[${pageLabel}] 填涂率 ${fillRate}% < 正确阈值 ${threshold}%：不提交，仅暂存`, "warning");
      await opts.draft();
      return { fillRate, threshold, action: "draft" };
    }
    addLog(`[${pageLabel}] 填涂率 ${fillRate}% < 正确阈值 ${threshold}%：不提交，请手动补答后提交`, "warning");
    return { fillRate, threshold, action: "draft" };
  };

  const readGlobalAfk = () => {
    try {
      const store = useConfigStore();
      const parts = store.platformParams?.[store.platformName]?.parts || [];
      const modePart = parts.find((p) => p.name === "模式设置");
      const param = (modePart?.params || []).find((p) => p.name === "激活挂机");
      return Boolean(param && param.value);
    } catch (e) {
      return false;
    }
  };

  const PpWorkerTimer = (() => {
    let worker = null;
    let seq = 0;
    const callbacks = new Map();
    const code = `self.onmessage=function(e){var d=e.data;if(d.type==='start'){self._t=self._t||{};self._t[d.id]=setInterval(function(){self.postMessage({type:'tick',id:d.id})},d.interval)}else if(d.type==='stop'){if(self._t&&self._t[d.id]){clearInterval(self._t[d.id]);delete self._t[d.id]}}else if(d.type==='once'){setTimeout(function(){self.postMessage({type:'once',id:d.id})},d.delay)}};`;
    const ensure = () => {
      if (worker) return true;
      try {
        const blob = new Blob([code], { type: "application/javascript" });
        worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = (e) => {
          const { type, id } = e.data || {};
          if (type === "tick") {
            const cb = callbacks.get(id);
            if (cb) cb();
          } else if (type === "once") {
            const cb = callbacks.get(id);
            callbacks.delete(id);
            if (cb) cb();
          }
        };
        worker.onerror = () => {};
      } catch (e) {
        worker = null;
      }
      return Boolean(worker);
    };
    return {
      interval(cb, ms) {
        if (!ensure()) return null;
        const id = `ppw${++seq}`;
        callbacks.set(id, cb);
        worker.postMessage({ type: "start", id, interval: ms });
        return id;
      },
      once(ms, cb) {
        if (!ensure()) return null;
        const id = `ppo${++seq}`;
        callbacks.set(id, cb);
        worker.postMessage({ type: "once", id, delay: ms });
        return id;
      },
      stop(id) {
        if (!id || !worker) return;
        callbacks.delete(id);
        try {
          worker.postMessage({ type: "stop", id });
        } catch (e) {}
      }
    };
  })();

  const afkWait = (ms) => new Promise((resolve) => {
    if (!readGlobalAfk()) {
      setTimeout(resolve, ms);
      return;
    }
    if (!PpWorkerTimer.once(ms, resolve)) setTimeout(resolve, ms);
  });

  const afkIntervalHandle = (cb, ms) => {
    if (readGlobalAfk()) {
      const id = PpWorkerTimer.interval(cb, ms);
      if (id) return { kind: "worker", id, stop() { PpWorkerTimer.stop(id); } };
    }
    const timer = setInterval(cb, ms);
    return { kind: "timer", id: timer, stop() { clearInterval(timer); } };
  };
  const afkInterval = (cb, ms) => afkIntervalHandle(cb, ms);

  let _afkHeartbeatStarted = false;
  const startAfkHeartbeat = () => {
    if (_afkHeartbeatStarted) return;
    if (!readGlobalAfk()) return;
    _afkHeartbeatStarted = true;
    const tick = () => {
      try {
        const doc = _unsafeWindow.document;
        const view = _unsafeWindow;
        const x = 20 + Math.floor(Math.random() * 200);
        const y = 20 + Math.floor(Math.random() * 200);
        doc.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y, view }));
        doc.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Shift", view }));
        doc.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Shift", view }));
      } catch (e) {}
    };
    PpWorkerTimer.interval(tick, 20000);
  };

  const getCxModeLabel = () => {
    try {
      const platform = useConfigStore().platformName;
      if (platform === "ykt") {
        const review = readYktParam("模式设置", "复习模式", false);
        return `当前模式：${review ? "复习模式" : "正常模式"}`;
      }
      if (platform !== "cx") return "";
    } catch (e) {}
    const taskMode =
      ["复习模式", "仅视频", "仅答题"].find((name) => readCxParamValue("模式设置", name, false)) ||
      "正常模式";
    return `当前模式：${taskMode}`;
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


    const isZhs = String(question.workType) === "zhs";
    try {
      if (question.element && question.element.ownerDocument) {
        decodeCipherFont(question.element.ownerDocument);
      }
    } catch (e) {}
    const questionData = {
      questionData: question.element.outerHTML,
      workType: isZhs ? "zhs" : "cx",
      refer: question.refer,
      u: userId,
      t: Math.floor(( new Date()).getTime() / 1e3).toString()
    };


    if (isZhs) {
      questionData.questionData = question.html || question.element.outerHTML;
    } else {
      questionData.audios = Array.isArray(question.audios) ? question.audios : [];
      questionData.audioReferer = (() => {
        try {
          return new URL(question.refer || window.location.href).origin + "/";
        } catch (e) {
          return "";
        }
      })();
    }


    const startTaskId = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;

    const answerIntervalParam = answerParamsPart?.params.find(p => p.name === "答题间隔");
    const simulateDelay = answerParamsPart?.params.find(p => p.name === "模拟延迟")?.value ?? true;
    await (simulateDelay ? randomDelay(answerIntervalParam?.value || 1, 0.5) : delay(answerIntervalParam?.value || 1));


    const currentTaskIdAfterSleep = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
    if (currentTaskIdAfterSleep !== startTaskId) {
      return { code: 499, msg: '用户取消', data: null };
    }


    let step1TaskId = null;
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
            step1TaskId: step1TaskId || undefined,
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
      const MAX_WAIT_MS = 10 * 60 * 1000;
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
                  if (taskResult.code === 202 && taskResult.status === "thinking") step1TaskId = taskId;
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

  const imageNamesOf = (text) => {
    const names = [];
    try {
      const re = /<img[^>]+src=["']?([^"'\s>]+)["']?/gi;
      const src = String(text || "");
      let m;
      while ((m = re.exec(src))) {
        const url = m[1];
        if (/^data:/i.test(url)) continue;
        const name = url.split(/[?#]/)[0].split("/").pop();
        if (name) names.push(name);
      }
    } catch (e) {}
    return names;
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

    const answerImages = imageNamesOf(raw);
    if (answerImages.length) {
      for (let i = 0; i < optionList.length; i++) {
        const optionImages = imageNamesOf(optionList[i].text);
        if (optionImages.length && optionImages.some((name) => answerImages.includes(name))) return i;
      }
    }

    return -1;
  };






  class CxQuestionHandler extends QuestionProcessor {
    constructor(type, iframe) {
      super();
      __publicField(this, "type");
      __publicField(this, "_fillNoop", false);

      __publicField(this, "init", async () => {
        await ppfxWaitFaceCheck();
        await waitForAudioFrames(this._document, 5000);
        this.questions = [];
        this.parseHtml();
        if (this.questions.length) {
          this.addLog(`成功解析到${this.questions.length}个题目`, "primary");
          const progressStore = useProgressStore();
          const answerLabel = this.type === "ks" ? "考试答题" : this.type === "zj" ? "章节测验" : "作业答题";
          const answerTotal = this.questions.length;
          progressStore.update({
            taskName: answerLabel,
            type: "答题",
            isPlaying: true,
            questionTotal: answerTotal,
            questionIndex: 0,
            percent: 0,
            currentTime: 0,
            totalTime: 0,
            detail: `第 0 / ${answerTotal} 题`
          });
          const configStore = useConfigStore();

          const startTaskId = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;

          const _answerParamsPart1 = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === "答题参数");
          const skipAnswered = _answerParamsPart1?.params.find(p => p.name === "跳过已答")?.value || false;
          this.correctNum = 0;
          this.skippedCount = 0;
          this.failedCount = 0;
          let skippedCount = 0;
          let failedCount = 0;
          let aborted = false;
          for (const [index, question] of this.questions.entries()) {
            progressStore.update({
              questionIndex: index + 1,
              percent: Math.round(index / answerTotal * 100),
              detail: `第 ${index + 1} / ${answerTotal} 题`
            });

            const currentTaskId = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
            if (currentTaskId !== startTaskId) {
              aborted = true;
              break;
            }

            if (skipAnswered && this.checkIfAnswered(question, this.type)) {
              this.addLog(`第${index + 1}道题已作答，跳过`, "warning");
              skippedCount += 1;
              this.addQuestion(question);
              continue;
            }
            this.addLog(`正在查找第${index + 1}道题目答案...`, "primary");
            const answerData = await queryAnswer(question);


            const currentTaskId2 = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
            if (currentTaskId2 !== startTaskId || answerData.code === 499) {
              aborted = true;
              break;
            }
            if (answerData.code === 200) {
              question.answer = answerData.data.answer;
              question.source = answerData.data.source;
              const filledOk = (await this.fillQuestion(question)) === true;
              if (filledOk) {
                this.correctNum += 1;
                progressStore.update({
                  filledCount: this.correctNum,
                  fillRate: computeFillRate(this.correctNum, answerTotal)
                });
              } else {
                failedCount += 1;
                question._fillFailed = true;
                this.addLog(`第${index + 1}道题未能成功填涂`, "warning");
              }
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
                progressStore.update({ remainingCount: answerData.data.num });
              }
            } else {
              this.addLog(`第${index + 1}道题搜索失败: ${answerData.msg}`, "danger");
              if (answerData.data?.sponsorUrl) {
                this.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
              }
              question.source = "error";
              question.answer[0] = answerData.msg;
            }
            this.addQuestion(question);
          }
          if (skippedCount > 0) {
            this.addLog(`共跳过${skippedCount}道已答题目（已答跳过不计入填涂成功数）`, "primary");
          }
          if (failedCount > 0) {
            this.addLog(`共${failedCount}道题未能成功填涂（不计入填涂成功数）`, "warning");
          }
          this.skippedCount = skippedCount;
          this.failedCount = failedCount;
          this.fillRate = logFillProgress((msg, type) => this.addLog(msg, type), answerLabel, this.correctNum, answerTotal, skippedCount);
          progressStore.update({
            filledCount: this.correctNum,
            fillRate: this.fillRate
          });
          if (aborted) {
            progressStore.update({
              isPlaying: false,
              detail: `答题已中断（${this.correctNum} / ${answerTotal}）`
            });
          } else {
            progressStore.update({
              questionIndex: answerTotal,
              percent: 100,
              isPlaying: false,
              detail: `已完成 ${answerTotal} 题`
            });
          }
        } else
          this.addLog("未解析到题目，请进入正确页面", "danger");
        return Promise.resolve(this.questions.length > 0 ? this.correctNum / this.questions.length * 100 : 0);
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

      __publicField(this, "isBlankFilled", (blankEl) => {
        if (!blankEl) return false;
        try {
          const cmHost = blankEl.querySelector(".CodeMirror");
          const cm = cmHost && cmHost.CodeMirror;
          if (cm && typeof cm.getValue === "function" && String(cm.getValue() || "").trim() !== "") return true;
        } catch (e) {}
        try {
          const iframe = blankEl.querySelector(".textDIV iframe") || blankEl.querySelector("iframe");
          if (iframe) {
            const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
            const body = doc && doc.body;
            if (body && String(body.textContent || "").trim() !== "") return true;
          }
        } catch (e) {}
        const textarea = blankEl.querySelector("textarea");
        if (textarea && String(textarea.value || "").trim() !== "") return true;
        const inpDiv = blankEl.querySelector(".InpDIV");
        if (inpDiv && String(inpDiv.textContent || "").trim() !== "") return true;
        return false;
      });

      __publicField(this, "fillReadingBlankFallback", async (question, index, answerText) => {
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const text = String(answerText == null ? "" : answerText).trim();
        if (!text || !question || !question.element) return 0;

        let subEl = null;
        try {
          const subEls = question.element.querySelectorAll(".readCompreHensionItem");
          subEl = subEls[index] || null;
        } catch (e) {}
        if (!subEl) return 0;

        const blanks = Array.from(subEl.querySelectorAll(".blankItemDiv"));
        const parts = text
          .split(/###|\|\||[;；\n]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        const escapeHtml = (s) =>
          String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const writeBlank = async (blankEl, value) => {
          if (!blankEl || !value) return 0;
          const inpDiv = blankEl.querySelector(".InpDIV");
          if (inpDiv) {
            try {
              inpDiv.click();
            } catch (e) {}
            await sleep(120);
          }
          let wrote = 0;
          const UE = this._window && this._window.UE;
          const textarea = blankEl.querySelector("textarea");
          const editor =
            UE && textarea && typeof UE.getEditor === "function"
              ? UE.getEditor(textarea.id || textarea.name)
              : null;
          if (editor && typeof editor.setContent === "function") {
            try {
              if (editor.body === null && typeof editor.addListener === "function") {
                await new Promise((resolve) => {
                  editor.addListener("ready", () => resolve());
                  setTimeout(resolve, 1500);
                });
              }
              editor.setContent(escapeHtml(value));
              if (typeof editor.fireEvent === "function") editor.fireEvent("contentChange");
              wrote += 1;
            } catch (e) {}
          }
          if (!wrote) {
            const cmHost = blankEl.querySelector(".CodeMirror");
            const cm = cmHost && cmHost.CodeMirror;
            if (cm && typeof cm.setValue === "function") {
              try {
                cm.setValue(String(value));
                if (typeof cm.focus === "function") cm.focus();
                wrote += 1;
              } catch (e) {}
            } else {
              const codeEditor = blankEl.querySelector("textarea.code-editor");
              if (codeEditor) {
                try {
                  codeEditor.value = String(value);
                  codeEditor.dispatchEvent(new Event("input", { bubbles: true }));
                  wrote += 1;
                } catch (e) {}
              }
            }
          }
          if (!wrote) {
            const holder = blankEl.querySelector(".textDIV") || blankEl;
            const iframe = holder.querySelector("iframe") || blankEl.querySelector("iframe#ueditor_0");
            if (iframe) {
              try {
                const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
                const body = doc && doc.body;
                if (body) {
                  body.innerHTML = escapeHtml(value);
                  ["input", "keyup", "change"].forEach((name) => {
                    try {
                      body.dispatchEvent(new Event(name, { bubbles: true }));
                    } catch (e) {}
                  });
                  wrote += 1;
                }
              } catch (e) {}
            }
          }
          if (textarea) {
            try {
              textarea.value = value;
              textarea.dispatchEvent(new Event("input", { bubbles: true }));
              textarea.dispatchEvent(new Event("change", { bubbles: true }));
            } catch (e) {}
          }
          return wrote;
        };

        if (blanks.length > 0) {
          let done = 0;
          for (let k = 0; k < blanks.length; k++) {
            const value = parts.length <= 1 ? parts[0] || text : parts[k] || "";
            if (!value) continue;
            done += await writeBlank(blanks[k], value);
            await sleep(100);
          }
          return done;
        }

        if (subEl.querySelector("textarea")) {
          return await writeBlank(subEl, text);
        }
        return 0;
      });

      __publicField(this, "fillReadingQuestion", async (question) => {
        const subs = Array.isArray(question._reading) ? question._reading : [];
        const rawAnswer = question.answer;
        const answers = Array.isArray(rawAnswer)
          ? rawAnswer
          : (rawAnswer == null || rawAnswer === "" ? [] : [rawAnswer]);
        if (!subs.length || !answers.length) return true;

        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const norm = (s) =>
          String(s || "")
            .replace(/\s+/g, "")
            .replace(/[，。．！？、；：""''（）【】《》.,;:!?()\[\]·—–~～％%]/g, "")
            .toLowerCase();
        const clickEl = async (el) => {
          if (!el) return;
          const target = el.querySelector("input") || el;
          try {
            target.click();
          } catch (e) {}
          await sleep(150);
        };
        const indexOfText = (options, text) => {
          const want = norm(text);
          if (!want) return -1;
          const exact = options.findIndex((t) => norm(t) === want);
          if (exact >= 0) return exact;
          const wantJudge = ppJudgeKey(text);
          if (!wantJudge) return -1;
          return options.findIndex((t) => ppJudgeKey(t) === wantJudge);
          };

        let filled = 0;
        let answeredSubs = 0;
        for (let i = 0; i < subs.length; i++) {
          const sub = subs[i];
          const answerText = String(answers[i] == null ? "" : answers[i]).trim();
          if (!answerText) continue;

          const parts = sub.type === "1"
            ? answerText.split(/###|\|\||[;；\n]+/).map((s) => s.trim()).filter(Boolean)
            : [answerText];
          const idxs = [];
          for (const part of parts) {
            const idx = indexOfText(sub.options || [], part);
            if (idx >= 0 && !idxs.includes(idx)) idxs.push(idx);
          }
          if (idxs.length === 0) {
            const blankFilled = await this.fillReadingBlankFallback(question, i, answerText);
            if (blankFilled > 0) {
              filled += blankFilled;
              answeredSubs += 1;
              await sleep(120);
              continue;
            }
            if (typeof this.addLog === "function") {
              this.addLog(
                "阅读理解第 " + (i + 1) + " 小题：答案文本没匹配到选项 - " + answerText.slice(0, 40),
                "warning"
              );
            }
            continue;
          }

          const picked = sub.type === "1" ? idxs : idxs.slice(0, 1);
          answeredSubs += 1;
          for (const idx of picked) {
            const el = (sub.elements || [])[idx];
            if (!el) continue;
            if (this.isOptionSelected(el)) continue;
            await clickEl(el);
            filled += 1;
          }
          await sleep(120);
        }

        return filled > 0;
      });

      __publicField(this, "fillQuestion", async (question) => {
        if (!this._window)
          return false;

        try {
          if (Array.isArray(question._reading) && question._reading.length > 0) {
            return (await this.fillReadingQuestion(question)) === true;
          }
          const rawAnswer = question.answer;
          const hasAnswerPayload = Array.isArray(rawAnswer)
            ? rawAnswer.some((item) => String(item == null ? "" : item).trim() !== "")
            : String(rawAnswer == null ? "" : rawAnswer).trim() !== "";
          this._fillNoop = false;
          if (await this.fillQuestionV2(question)) {
            return hasAnswerPayload && this._fillNoop !== true;
          }
          if (question.type === "4" || question.type === "5" || question.type === "6" || question.type === "7" || question.type === "8") {
          const textareaElement = question.element.querySelector("textarea");
          if (!textareaElement) return false;

          const answerText = Array.isArray(question.answer)
            ? question.answer.join("\n")
            : String(question.answer);
          const htmlContent = answerText
            .split("\n")
            .map((line) => "<p>" + line + "</p>")
            .join("");

          const ue = this._window.UE;
          const ueditor =
            ue && typeof ue.getEditor === "function"
              ? ue.getEditor(textareaElement.id || textareaElement.name)
              : null;
          if (!ueditor || typeof ueditor.setContent !== "function") {
            this.addLog("简答题未取到编辑器实例，已跳过", "warning");
            return false;
          }

          if (ueditor.body === null) {
            await new Promise((resolve) => {
              ueditor.addListener("ready", () => resolve());
              setTimeout(resolve, 2000);
            });
          }

          ueditor.setContent(htmlContent);
          ueditor.fireEvent("contentChange");
          if (typeof ueditor.sync === "function") ueditor.sync();

          const saveBtn = question.element.querySelector('[onclick*="saveQuestion"]');
          if (saveBtn) saveBtn.click();
          return hasAnswerPayload;
        }
          if (question.type === "17") {
            const parts = Array.isArray(question.answer)
              ? question.answer.map((item) => String(item == null ? "" : item))
              : [String(question.answer == null ? "" : question.answer)];
            const hasLang = parts.length >= 2;
            const langName = hasLang ? parts[0].trim() : "";
            const answerText = (hasLang ? parts.slice(1).join("\n") : parts[0]).replace(/^(?:\r?\n)+|(?:\r?\n)+$/g, "");
            if (!answerText.trim()) return false;
            if (langName) {
              try {
                const items = Array.from(question.element.querySelectorAll("[codename]"));
                const langItem = items.find((el) => String(el.getAttribute("codename") || "").trim() === langName);
                if (langItem) langItem.click();
                const langSelect = question.element.querySelector('input[id^="languageSelect"]');
                const langNum = langItem ? langItem.getAttribute("codenum") : "";
                if (langSelect && langNum) langSelect.value = langNum;
                const visible = question.element.querySelector("strong[codename]");
                if (visible) {
                  visible.textContent = langName;
                  visible.setAttribute("codename", langName);
                  if (langNum) visible.setAttribute("codenum", langNum);
                }
              } catch (e) {}
            }
            const cmHost = question.element.querySelector(".CodeMirror");
            const cm = cmHost && cmHost.CodeMirror;
            if (cm && typeof cm.setValue === "function") {
              try {
                cm.setValue(answerText);
                if (typeof cm.save === "function") cm.save();
                if (typeof cm.focus === "function") cm.focus();
                const saveBtn = question.element.querySelector('[onclick*="saveQuestion"]');
                if (saveBtn) saveBtn.click();
                return true;
              } catch (e) {}
            }
            const codeEditor = question.element.querySelector("textarea.code-editor");
            if (codeEditor) {
              try {
                codeEditor.value = answerText;
                codeEditor.dispatchEvent(new Event("input", { bubbles: true }));
                const saveBtn = question.element.querySelector('[onclick*="saveQuestion"]');
                if (saveBtn) saveBtn.click();
                return true;
              } catch (e) {}
            }
            return false;
          }
          if (question.type === "26") {
            const answerText = Array.isArray(question.answer)
              ? question.answer.map((item) => String(item == null ? "" : item)).join("\n")
              : String(question.answer == null ? "" : question.answer);
            if (!answerText.trim()) return false;
            const textareaElement = question.element.querySelector("textarea");
            const UE = this._window && this._window.UE;
            const ueditor =
              UE && textareaElement && typeof UE.getEditor === "function"
                ? UE.getEditor(textareaElement.id || textareaElement.name)
                : null;
            if (ueditor && typeof ueditor.setContent === "function") {
              try {
                if (ueditor.body === null && typeof ueditor.addListener === "function") {
                  await new Promise((resolve) => {
                    ueditor.addListener("ready", () => resolve());
                    setTimeout(resolve, 2000);
                  });
                }
                ueditor.setContent(answerText);
                if (typeof ueditor.fireEvent === "function") ueditor.fireEvent("contentChange");
                if (typeof ueditor.sync === "function") ueditor.sync();
                const saveBtn = question.element.querySelector('[onclick*="saveQuestion"]');
                if (saveBtn) saveBtn.click();
                return true;
              } catch (e) {}
            }
            const ueFrame = question.element.querySelector("iframe#ueditor_0");
            if (ueFrame) {
              try {
                const doc = ueFrame.contentDocument || (ueFrame.contentWindow && ueFrame.contentWindow.document);
                const body = doc && doc.body;
                if (body) {
                  body.innerHTML = String(answerText)
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\n/g, "<br>");
                  ["input", "keyup", "change"].forEach((name) => {
                    try {
                      body.dispatchEvent(new Event(name, { bubbles: true }));
                    } catch (e) {}
                  });
                  const saveBtn = question.element.querySelector('[onclick*="saveQuestion"]');
                  if (saveBtn) saveBtn.click();
                  return true;
                }
              } catch (e) {}
            }
            return false;
          }
          return false;
        } catch (error) {
          this.addLog(`答题过程发生错误：${error.message}`, "danger");
          return false;
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
      const isZhs = String(question.workType) === "zhs";
      const supportedTypes = isZhs
        ? ["0", "1", "2", "3"]
        : ["0", "1", "2", "3", "8", "9", "10", "11", "13", "14", "17", "20", "24", "26"];
      if (!supportedTypes.includes(type)) {
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
      const answerList = Array.isArray(question.answer)
        ? question.answer.map((a) => String(a == null ? "" : a).trim())
        : [];
      const keepEmptySlots = !isZhs && ["2", "9", "10", "14", "15", "19", "24"].includes(type);
      const flatAnswers = keepEmptySlots ? answerList : answerList.filter(Boolean);
      const rawAnswers = flatAnswers;
      if (flatAnswers.length === 0) {
        this._fillNoop = true;
        return true;
      }

      const clickOption = async (el) => {
        if (!el) return;
        el.setAttribute("data-filling", "true");
        el.click();
        await sleep(200);
        el.removeAttribute("data-filling");
      };

      if (type === "24" && question._fillBlanks && Array.isArray(question._fillBlanks.blanks)) {
        const info = question._fillBlanks;
        const normWord = (s) =>
          String(s == null ? "" : s).replace(/\s+/g, "").replace(/[“”"']/g, "").toLowerCase();
        let done = 0;
        for (let i = 0; i < info.blanks.length && i < flatAnswers.length; i++) {
          const blank = info.blanks[i];
          const ans = String(flatAnswers[i] == null ? "" : flatAnswers[i]).trim();
          if (!ans || !blank) continue;
          const word = info.words.find((w) => normWord(w.text) === normWord(ans));
          if (!word) continue;
          blank.innerHTML = word.text;
          blank.classList.add("hasFill");
          blank.setAttribute("data-choose-name", word.code);
          blank.draggable = true;
          done += 1;
        }
        try {
          const fn = this._window && this._window.getFillinBlanksDataForQuestion;
          if (typeof fn === "function") fn.call(this._window, info.qid);
        } catch (e) {}
        return done > 0;
      }

      if (type === "20" && Array.isArray(question._shared) && question._shared.length > 0) {
        let done = 0;
        for (let i = 0; i < question._shared.length && i < flatAnswers.length; i++) {
          const sub = question._shared[i];
          const letter = String(flatAnswers[i] == null ? "" : flatAnswers[i])
            .replace(/[.、:：\s]/g, "")
            .toUpperCase()
            .charAt(0);
          if (!letter) continue;
          const target = (sub.elements || []).find((el) => {
            return String(el.getAttribute("data") || "").toUpperCase() === letter;
          });
          if (!target) continue;
          await clickOption(target);
          done += 1;
        }
        return done > 0;
      }

      if (type === "0" || type === "1") {
        const targetIndices = [];
        for (const ans of flatAnswers) {
          const clean = this.stripTags(ans);
          if (!clean) continue;
          const idx = matchOptionIndex(optionList, clean);
          if (idx >= 0 && !targetIndices.includes(idx)) targetIndices.push(idx);
        }

        if (targetIndices.length === 0) {
          this._fillNoop = true;
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
            if (ppJudgeKey(opt.text || el.getAttribute("aria-label") || "") === (truth ? "T" : "F")) {
              target = el;
              break;
            }
          }
        }

        if (!target) {
          this._fillNoop = true;
          return true;
        }
        if (target.classList && target.classList.contains("check_answer")) return true;
        if (this.isOptionSelected(target)) return true;
        const holder = target.closest ? target.closest(".answerBg") : null;
        if (holder && (holder.querySelector(".check_answer") || holder.querySelector(".check_answer_dx"))) return true;
        await clickOption(target);
        return true;
      }

      if (type === "14" && Array.isArray(question._cloze) && question._cloze.length > 0) {
        const normCloze = (s) =>
          String(s == null ? "" : s)
            .replace(/\s+/g, "")
            .replace(/[，。．！？、；：""''（）【】《》.,;:!?()\[\]·—–~～％%]/g, "")
            .toLowerCase();
        let done = 0;
        for (let i = 0; i < question._cloze.length && i < flatAnswers.length; i++) {
          const cloze = question._cloze[i];
          const ans = String(flatAnswers[i] == null ? "" : flatAnswers[i]).trim();
          if (!ans) continue;
          const target = normCloze(ans);
          const pick = cloze.options.findIndex((t) => normCloze(t) === target);
          if (pick < 0 || !cloze.elements[pick]) continue;
          cloze.elements[pick].click();
          done += 1;
          await sleep(150);
        }
        return done > 0;
      }

      if (type === "2" || type === "10" || type === "14" || type === "9") {
        const wordScope =
          (type === "14" ? question.element.querySelector(".filling_answer") : null) ||
          question.element;
        const wordSpans = Array.from(wordScope.querySelectorAll("span.saveSingleSelect[data]"));
        const selectBoxes = Array.from(question.element.querySelectorAll("select.dept_select"));
        const textareaElements = question.element.querySelectorAll("textarea");

        let blankAnswers = flatAnswers;
        const blankCount = Math.max(wordSpans.length, selectBoxes.length, textareaElements.length);


        const preferTextarea = (type === "2" || type === "10") && textareaElements.length > 0;
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
          let filledSelects = 0;
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
            filledSelects += 1;
            await sleep(200);
          }
          if (filledSelects === 0) this._fillNoop = true;
          return true;
        }

        if (textareaElements.length === 0) {
          this._fillNoop = true;
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
          for (const a of rawAnswers) { if (a) flat.push(a); }
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
        for (const a of rawAnswers) { if (a) flat.push(a); }
        if (flat.length === 0) {
          this._fillNoop = true;
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
            const byText = options.find((o) => String(o.text || "").trim().toUpperCase() === letter);
            const byIndex = options[letter.charCodeAt(0) - 65];
            target = byValue ? byValue.value : byText ? byText.value : byIndex ? byIndex.value : "";
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
        if (filled === 0) this._fillNoop = true;
        return true;
      }

      if (type === "13") {
        const sortSelects = Array.from(question.element.querySelectorAll(".sortQuesSelect .dept_select"));
        if (sortSelects.length === 0) return false;
        const seq = [];
        for (const a of rawAnswers) {
          const list = [String(a == null ? "" : a).trim()];
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
          this._fillNoop = true;
          return true;
        }
        let filled = 0;
        for (let i = 0; i < sortSelects.length && i < seq.length; i++) {
          const select = sortSelects[i];
          const letter = seq[i];
          if (!letter) continue;
          const options = Array.from(select.options || []);
          let pick = options.find((o) => String(o.value).toUpperCase() === letter)
            || options.find((o) => String(o.text || "").trim().toUpperCase() === letter);
          if (!pick) {
            const num = String(letter.charCodeAt(0) - 64);
            pick = options.find((o) => String(o.value) === num);
          }
          select.value = pick ? pick.value : letter;
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
            let input = null;
      if (questionElement) {
        const named = Array.from(questionElement.querySelectorAll('input[name^="type"]')).find((el) =>
          /type\d+/.test(el.getAttribute("name") || ""),
        );
        input =
          questionElement.querySelector('input[id^="answertype"]') || named || questionElement.querySelector('input[name^="type"]');
      }
      const code = input ? String(input.value || "").trim() : "";
      return code || "999";
    }
    extractOptions(optionElements, optionSelector) {
      const optionsObject = {};
      const optionTexts = [];
      const optionsList = [];
      const allElements = Array.from(optionElements || []);
      const topElements = allElements.filter(
        (el) => !allElements.some((other) => other !== el && other.contains(el)),
      );
      topElements.forEach((optionElement) => {
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


        const subItems = Array.from(questionElement.querySelectorAll(".readCompreHensionItem"));
        const subTypeCode = String(resolvedType);
        if ((subTypeCode === "15" || subTypeCode === "19") && subItems.length > 0) {
          const isListening = subTypeCode === "19";
          const passageEl = questionElement.querySelector(".fontLabel") || questionElement.querySelector("h3");
          const passageText = passageEl
            ? this.stripTags(this.htmlWithAbsoluteImages(passageEl))
                .replace(/【(阅读理解|听力题)】/g, "")
                .replace(/（[\d.]+分）/g, "")
                .replace(/\s+/g, " ")
                .trim()
            : "";
          const subs = subItems.map((subItem) => {

            const childTypeEl = subItem.querySelector('input[name="readCompreHension-childType"]');
            const subType = childTypeEl ? String(childTypeEl.value || "").trim() || "0" : "0";
            const contentEl = subItem.querySelector(".clearfix");
            const subTitle = this.stripTags(this.htmlWithAbsoluteImages(contentEl || subItem))
              .replace(/（[\d.]+分）/g, "")
              .replace(/\s+/g, " ")
              .trim();
            const liList = Array.from(subItem.querySelectorAll("ul li"));
            const optionTexts = liList.map((li, j) => {
              const spans = li.querySelectorAll("span.fl");
              const textEl =
                li.querySelector("a.fl.after") ||
                li.querySelector("a.after") ||
                (spans.length >= 2 ? spans[1] : li);
              let text = this.stripTags(this.htmlWithAbsoluteImages(textEl)).replace(/\s+/g, " ").trim();
              const letter = String.fromCharCode(65 + j);
              text = text.replace(new RegExp("^" + letter + "[.、:：\\s]+", "i"), "").trim();
              return text;
            });
            return {
              type: subType,
              title: subTitle,
              options: optionTexts,
              elements: liList,
              el: subItem,
              blanks: Array.from(subItem.querySelectorAll(".blankItemDiv"))
            };
          });
          const subBlocks = subs.map((sub, i) => {
            const optionLines = sub.options.map((text, j) => `${String.fromCharCode(65 + j)}. ${text}`);
            return `(${i + 1}) ${sub.title}\n${optionLines.join("\n")}`;
          });
          this.questions.push({
            element: questionElement,
            type: resolvedType,
            title: this.trimTitle(`【${isListening ? "听力题" : "阅读理解"}】\n${passageText}\n\n${subBlocks.join("\n\n")}`),
            audios: (() => {
              const list = this.collectAudioUrls(questionElement);
              if (isListening && list.length === 0) {
                this.collectVideoUrls().forEach((u) => {
                  if (!list.includes(u)) list.push(u);
                });
              }
              return list.slice(0, 3);
            })(),
            optionsText: [],
            options: {},
            optionsList: [],
            answer: [],
            workType: this.type,
            refer: this._window.location.href,
            _reading: subs
          });
          return;
        }

        if (String(resolvedType) === "14") {
          const clozeLis = Array.from(questionElement.querySelectorAll("ul.Cy_ulTop > li"));
          const cloze = clozeLis
            .map((li) => {
              const optEls = Array.from(li.querySelectorAll("ul.Zy_ulTop > li"));
              const options = optEls.map((o) => {
                const textEl = o.querySelector("div.after") || o.querySelector(".fl.after") || o;
                return this.stripTags(this.htmlWithAbsoluteImages(textEl)).replace(/\s+/g, " ").trim();
              });
              return { options, elements: optEls, el: li, input: li.querySelector('input[id^="answer"]') };
            })
            .filter((c) => c.elements.length > 0);
          if (cloze.length > 0) {
            const clozeTitle = this.stripTags(
              this.htmlWithAbsoluteImages(questionElement.querySelector(".fontLabel") || questionElement),
            )
              .replace(/（[\d.]+分）/g, "")
              .replace(/\s+/g, " ")
              .trim();
            this.questions.push({
              element: questionElement,
              type: "14",
              title: this.trimTitle(clozeTitle),
              audios: this.collectAudioUrls(questionElement),
              optionsText: [],
              options: {},
              optionsList: [],
              answer: [],
              workType: this.type,
              refer: this._window.location.href,
              _cloze: cloze
            });
            return;
          }
        }

        if (String(resolvedType) === "20") {
          const sharedEls = Array.from(questionElement.querySelectorAll("ul.mark_letter > li"));
          const subEls = Array.from(questionElement.querySelectorAll("div.B-answer-ct"));
          if (subEls.length > 0) {
            const sharedOptions = sharedEls
              .map((li) => this.stripTags(li.innerHTML).replace(/\s+/g, " ").trim())
              .filter(Boolean);
            const subs = subEls.map((ct) => {
              const titEl = ct.querySelector(".B-tit");
              const title = this.stripTags((titEl || ct).innerHTML)
                .replace(/^\(\d+\)\s*/, "")
                .replace(/^【[^】]*题】\s*/, "")
                .replace(/（[\d.]+分）/g, "")
                .replace(/\s+/g, " ")
                .trim();
              const els = Array.from(ct.querySelectorAll(".B-answerCon span.num_option"));
              return { title, options: [], elements: els };
            });
            const sharedStem = this.stripTags(
              this.htmlWithAbsoluteImages(questionElement.querySelector(".fontLabel") || questionElement),
            )
              .replace(/（[\d.]+分）/g, "")
              .replace(/\s+/g, " ")
              .trim();
            this.questions.push({
              element: questionElement,
              type: "20",
              title: this.trimTitle(sharedStem),
              audios: this.collectAudioUrls(questionElement),
              optionsText: sharedOptions,
              options: {},
              optionsList: [],
              answer: [],
              workType: this.type,
              refer: this._window.location.href,
              _shared: subs
            });
            return;
          }
        }

        if (String(resolvedType) === "24") {
          const wrap = questionElement.querySelector(".fillBlanksChoose");
          if (wrap) {
            const blankEls = Array.from(wrap.querySelectorAll(".textTarget"));
            const wordEls = Array.from(wrap.querySelectorAll(".blanksBox span"));
            const words = wordEls
              .map((w) => {
                const raw =
                  w.childNodes && w.childNodes[0] && typeof w.childNodes[0].nodeValue === "string"
                    ? w.childNodes[0].nodeValue
                    : w.textContent;
                return {
                  text: String(raw || "").replace(/\s+/g, " ").trim(),
                  code: String(w.getAttribute("data-choose-name") || ""),
                  el: w,
                };
              })
              .filter((w) => w.text);
            const textEl = wrap.querySelector(".textContent");
            let stem = "";
            if (textEl) {
              const clone = textEl.cloneNode(true);
              const doc = textEl.ownerDocument;
              clone.querySelectorAll(".textTarget").forEach((el, i) => {
                el.replaceWith(doc.createTextNode(" __" + (i + 1) + "__ "));
              });
              stem = this.stripTags(clone.innerHTML).replace(/\s+/g, " ").trim();
            }
            const qid = wrap.getAttribute("data") || "";
            this.questions.push({
              element: questionElement,
              type: "24",
              title: this.trimTitle(stem),
              audios: this.collectAudioUrls(questionElement),
              optionsText: words.map((w) => w.text),
              options: {},
              optionsList: [],
              answer: [],
              workType: this.type,
              refer: this._window.location.href,
              _fillBlanks: { qid, blanks: blankEls, words }
            });
            return;
          }
        }

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
              optionsText: leftItems.map((item, i) => {
                const m = String(item).match(/^(\d+)/);
                return (m ? m[1] : String(i + 1)) + "-空";
              }),
              options: {},
              optionsList: [],
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
        if (String(resolvedType) === "13") {
          const sortItems = Array.from(
            questionElement.querySelectorAll("ul.sortQuesOption li, ul.ulTop.sortQuesOption li")
          )
            .map((li) => this.stripTags(li.innerHTML).trim())
            .filter(Boolean);
          if (sortItems.length > 0) {
            questionTitle = `${questionTitle} 选项: ${sortItems.join("；")}`;
          }
        }
        this.questions.push({
          element: questionElement,
          type: resolvedType,
          title: this.trimTitle(questionTitle),
          audios: this.collectAudioUrls(questionElement),
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
      const afkEnabledMonitor = readGlobalAfk();

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
      const afkEnabled = readGlobalAfk();

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

      const afkEnabledWatch = readGlobalAfk();
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
              logStore.addLog("本页任务点已全部完成", "success");
              if (!autoSwitch) {
                logStore.addLog("自动切换已关闭，请手动切换章节", "warning");
              }
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
      const afkEnabledOverlay = readGlobalAfk();
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

          const afkEnabled = readGlobalAfk();
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
        const mediaName = (() => {
          try {
            const el = (iframeDocument && iframeDocument.querySelector(".prev_title")) || document.querySelector(".prev_title");
            const val = el ? String(el.textContent || "").trim().replace(/\s+/g, " ") : "";
            return val.slice(0, 40);
          } catch (e) {
            return "";
          }
        })();
        logStore.addLog(`正在尝试播放${mediaName || mediaType}，请稍等5s`, "primary");

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
        const afkEnabledPlay = readGlobalAfk();
        const playLoopId = 'play_media_' + Date.now();
        const healthCheckId = 'play_health_' + Date.now();
        let playLoopTimer = null;
        const playLoopCallback = async () => {
          const mediaElement = iframeDocument.documentElement.querySelector(mediaType);
          if (mediaElement && !isExecuted) {
            await mediaElement.pause();
            mediaElement.muted = true;
            ppMuteOnce(mediaElement);
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
              clearInterval(playLoopTimer);
              playLoopTimer = null;
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
          playLoopTimer = setInterval(playLoopCallback, 2500);
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
        const handler = new CxQuestionHandler("zj", iframe);
        await handler.init();
        if (taskId !== _globalTaskId) {
          return resolve();
        }
        iframeWindow.alert = () => {
        };
        const canSubmit = typeof iframeWindow.btnBlueSubmit === "function";
        const canDraft = typeof iframeWindow.noSubmit === "function";
        await runAnswerSubmitPolicy({
          addLog: (msg, type) => logStore.addLog(msg, type),
          pageLabel: "章节/作业/测验",
          platformKey: "cx",
          autoSubmit: readCxParamValue("章节/作业/测验设置", "自动提交", false),
          filled: Number(handler.correctNum) || 0,
          total: Number(handler.questions?.length) || 0,
          skipped: Number(handler.skippedCount) || 0,
          canSubmit,
          canDraft,
          logRate: false,
          submit: async () => {
            await iframeWindow.btnBlueSubmit();
            await delay(1.5);
            if (typeof iframeWindow.submitCheckTimes === "function") {
              await iframeWindow.submitCheckTimes();
            }
            logStore.addLog("提交成功", "success");
          },
          draft: async () => {
            await iframeWindow.noSubmit();
          },
        });
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
        const afkEnabledFrame = readGlobalAfk();
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

      if (reviewMode && isCompletedAnswerTaskPoint(iframe)) {
        logStore.addLog("复习模式：答题任务点已完成，跳过", "primary");
        return 'skip';
      }

      if (reviewMode && /api\/work|selectWorkQuestion/.test(iframeSrc)) {
        try {
          const submittedText = iframeDocument.documentElement.innerText || "";
          if (submittedText.includes("已完成") || submittedText.includes("待批阅")) {
            return 'skip';
          }
        } catch (e) {}
      }

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


    const afkEnabledGlobal = readGlobalAfk();
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

  const isCompletedAnswerTaskPoint = (iframe) => {
    if (!iframe) return false;
    const src = String(iframe.src || '');
    if (!/(?:api\/work|\/work\/|selectWorkQuestion|work\/view)/.test(src)) return false;

    if (typeof iframe.closest === 'function' && iframe.closest('.ans-job-finished')) {
      return true;
    }

    const icon =
      (typeof iframe.closest === 'function' && iframe.closest('.ans-job-icon')) ||
      (iframe.parentElement && iframe.parentElement.querySelector('.ans-job-icon'));
    return Boolean(icon && /已完成/.test(icon.getAttribute('aria-label') || ''));
  };







  const useStuActiveLogic = async () => {

    try {
      window.parent.postMessage({ source: 'chaoxing-helper-iframe', action: 'closePanel' }, '*');
    } catch (e) {}

    const logStore = useLogStore();
    const questionStore = useQuestionStore();
    const configStore = useConfigStore();
    const progressStore = useProgressStore();
    logStore.addLog(`检测到用户进入到随堂练习页面`, "primary");
    logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");


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
      "填空题": "2",
      "简答题": "4",
      "名词解释": "5",
      "论述题": "6",
      "计算题": "7",
      "其它": "8",
      "其他": "8",
      "分录题": "9",
      "资料题": "10"
    };

    const questions = [];
    questionItems.forEach((questionItem) => {
      const questionNameEl = questionItem.querySelector(".question-name");
      const questionText = questionNameEl ? questionNameEl.innerText.trim() : "";

      const labelEl = questionItem.querySelector(".grey-text");
      const labelText = labelEl ? labelEl.textContent.replace(/[\[\]\s]/g, "") : "";
      let questionTypeText = "";
      for (const name of Object.keys(questionTypeMapping)) {
        if (labelText && labelText.includes(name)) {
          questionTypeText = name;
          break;
        }
      }
      if (!questionTypeText) {
        if (questionItem.classList.contains("multiple-choice")) {
          questionTypeText = "多选题";
        } else if (questionText.includes("判断题")) {
          questionTypeText = "判断题";
        } else if (questionText.includes("填空题")) {
          questionTypeText = "填空题";
        } else {
          questionTypeText = "单选题";
        }
      }

      const cleanTitle = questionText
        .replace(/^\d+\.\s*/, "")
        .replace(/\[[^\]]{1,10}\]/g, "")
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

    const answerTotal = questions.length;
    progressStore.update({
      taskName: "随堂练习",
      type: "答题",
      isPlaying: true,
      questionTotal: answerTotal,
      questionIndex: 0,
      percent: 0,
      currentTime: 0,
      totalTime: 0,
      detail: `第 0 / ${answerTotal} 题`
    });

    const answerParamsPart = configStore.platformParams.cx?.parts.find(p => p.name === "答题参数");
    const skipAnswered = answerParamsPart?.params.find(p => p.name === "跳过已答")?.value || false;
    const answerInterval = answerParamsPart?.params.find(p => p.name === "答题间隔")?.value || 1;
    const useSimilarity = answerParamsPart?.params.find(p => p.name === "相似匹配")?.value || false;
    const simulateDelay = answerParamsPart?.params.find(p => p.name === "模拟延迟")?.value ?? true;

    let skippedCount = 0;
    let failedCount = 0;
    let filledCount = 0;
    let aborted = false;
    for (const [index, question] of questions.entries()) {
      progressStore.update({
        questionIndex: index + 1,
        percent: Math.round(index / answerTotal * 100),
        detail: `第 ${index + 1} / ${answerTotal} 题`
      });

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
        aborted = true;
        break;
      }
      if (answerData.code === 200) {
        question.answer = answerData.data.answer;
        question.source = answerData.data.source;
        let filledOk = false;


        if (question.type === "0" || question.type === "1" || question.type === "3") {
          const optionList = getOptionList(question);
          const targetEls = [];
          const answerList = Array.isArray(question.answer) ? question.answer : [];
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
          filledOk = targetEls.length > 0;
        }

        if (["2", "9", "10"].includes(String(question.type))) {
          const plainAnswers = Array.isArray(question.answer)
            ? question.answer.map((a) => String(a == null ? "" : a).trim())
            : [];
          const boxInputs = Array.from(question.element.querySelectorAll(".option-fill-list input"))
            .filter((el) => !el.getAttribute("type") || el.getAttribute("type") === "text");
          const textInputs = boxInputs.length
            ? boxInputs
            : Array.from(question.element.querySelectorAll('input[type="text"], input:not([type])'));
          let filledInputs = 0;
          for (let i = 0; i < textInputs.length && i < plainAnswers.length; i++) {
            const el = textInputs[i];
            const value = plainAnswers[i];
            if (!el || !value) continue;
            el.focus();
            el.value = value;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
            filledInputs += 1;
            await randomDelay(0.05, 0.1);
          }
          if (filledInputs > 0) filledOk = true;
        }

        if (["4", "5", "6", "7"].includes(String(question.type))) {
          const plainAnswers = Array.isArray(question.answer)
            ? question.answer.map((a) => String(a == null ? "" : a).trim()).filter(Boolean)
            : [];
          const area =
            question.element.querySelector(".short-answer-textarea textarea") ||
            question.element.querySelector("textarea");
          if (area && plainAnswers.length) {
            area.focus();
            area.value = plainAnswers.join("\n");
            area.dispatchEvent(new Event("input", { bubbles: true }));
            area.dispatchEvent(new Event("change", { bubbles: true }));
            filledOk = true;
          }
        }

        if (filledOk) {
          filledCount += 1;
          progressStore.update({
            filledCount,
            fillRate: computeFillRate(filledCount, answerTotal)
          });
        } else {
          failedCount += 1;
          question._fillFailed = true;
          logStore.addLog(`第${index + 1}道题未能成功填涂`, "warning");
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
        progressStore.update({ remainingCount: answerData.data.num });
        }
      } else {

        if (answerData.code === 403 && answerData.data && answerData.data.limitedMode) {
          logStore.addLog(`第${index + 1}道题搜索失败: ${answerData.msg}`, "danger");
          if (answerData.data.sponsorUrl) {
            logStore.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
          }
          question.source = "error";
          question.answer[0] = answerData.msg;
        } else if (answerData.code === 429 && answerData.data && answerData.data.limitedMode) {
          logStore.addLog(`第${index + 1}道题搜索失败: 今日免费查题已达上限`, "danger");
          logStore.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
          question.source = "error";
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
          question.source = "error";
          question.answer[0] = (answerData.data.answer && answerData.data.answer[0]) || answerData.msg;
        } else {
          logStore.addLog(`第${index + 1}道题搜索失败: ${answerData.msg}`, "danger");
          if (answerData.data?.sponsorUrl) {
            logStore.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
          }
          question.source = "error";
          question.answer[0] = answerData.msg;
        }
      }
      questionStore.addQuestion(question);
      await (simulateDelay ? randomDelay(Number(answerInterval), 0.5) : delay(Number(answerInterval)));
    }

    if (skippedCount > 0) {
      logStore.addLog(`共跳过${skippedCount}道已答题目（已答跳过不计入填涂成功数）`, "primary");
    }
    if (failedCount > 0) {
      logStore.addLog(`共${failedCount}道题未能成功填涂（不计入填涂成功数）`, "warning");
    }
    logStore.addLog("随堂练习答题完成", "success");
    if (aborted) {
      progressStore.update({
        isPlaying: false,
        detail: "答题已中断"
      });
    } else {
      progressStore.update({
        questionIndex: answerTotal,
        percent: 100,
        isPlaying: false,
        detail: `已完成 ${answerTotal} 题`
      });
    }
    progressStore.update({
      filledCount,
      fillRate: computeFillRate(filledCount, answerTotal)
    });
    const hasSubmitBtn = Boolean(document.querySelector(".submit-btn"));
    await runAnswerSubmitPolicy({
      addLog: (msg, type) => logStore.addLog(msg, type),
      pageLabel: "随堂练习",
      platformKey: "cx",
      autoSubmit: readCxParamValue("章节/作业/测验设置", "自动提交", false),
      filled: filledCount,
      total: answerTotal,
      skipped: skippedCount,
      canSubmit: hasSubmitBtn,
      canDraft: false,
      submit: async () => {
        logStore.addLog("自动提交已开启，3秒后提交...", "warning");
        await delay(3);
        const submitBtn = document.querySelector(".submit-btn");
        if (!submitBtn) {
          logStore.addLog("未找到提交按钮，请手动提交", "danger");
          return;
        }
        clickOption(submitBtn);
        logStore.addLog("已点击提交", "success");

        for (let i = 0; i < 15; i++) {
          const affirm = document.querySelector(".dialog_affrim");
          if (affirm) {
            clickOption(affirm);
            logStore.addLog("已确认提交", "primary");
            break;
          }
          await delay(0.2);
        }


      },
    });
  };




  const useCxWorkLogic = async () => {
    const logStore = useLogStore();
    useConfigStore();
    logStore.addLog(`检测到用户进入到作业页面`, "primary");
    logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");
    await new CxQuestionHandler("zy").init();
    logStore.addLog("作业页面无自动提交能力：仅填涂，不自动提交，请检查后手动保存", "primary");
  };



  const answerExamPreview = async () => {
    const logStore = useLogStore();
    logStore.addLog(`检测到用户进入到考试预览页面`, "primary");
    logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");
    await new CxQuestionHandler("ks").init();
    logStore.addLog("考试页面无自动提交能力：仅填涂，不自动交卷", "primary");
    logStore.addLog("答题完成，请自行检查后保存或提交", "primary");
  };








  const useCxExamLogic = async () => {
    const logStore = useLogStore();
    const configStore = useConfigStore();


    const inSequentialMode = _GM_getValue('pp_exam_sequential', false);

    if (!inSequentialMode) {

      logStore.addLog(`检测到用户进入到考试页面`, "primary");
      logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");


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
    logStore.addLog("考试页面无自动提交能力：仅填涂，不自动交卷", "primary");

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
      logStore.addLog(`检测到用户进入到课程目录页面`, "primary");
      await delay(2);
      const firstChapter = document.querySelector('.course_section .chapterText');
      if (firstChapter) {
        firstChapter.click();
      } else {
        logStore.addLog("未找到章节列表，请手动点击章节", "danger");
      }
      return;
    }


    logStore.addLog(`检测到用户进入到阅读页面`, "primary");
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
        this.questions = [];
        const progressStore = useProgressStore();
        const configStore = useConfigStore();

        const _answerParamsPart2 = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === "答题参数");
        const skipAnswered = _answerParamsPart2?.params.find(p => p.name === "跳过已答")?.value || false;

        const waitForPageReady = async () => {
          const startedAt = Date.now();
          let visibleWaitStart = 0;
          let diagLogged = false;
          while (Date.now() - startedAt < 5 * 60 * 1000) {
            const els = this.getZhsQuestionElements();
            if (els.length) {
              const stems = els.map((el) => this.readStem(el));
              const visibleIdx = els.findIndex((el) => {
                const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
                return rect && rect.width > 0 && rect.height > 0;
              });
              const visibleReady = visibleIdx >= 0 && Boolean(stems[visibleIdx].html || stems[visibleIdx].text);
              if (visibleReady) return els;
              if (visibleIdx >= 0) {
                if (!visibleWaitStart) visibleWaitStart = Date.now();
                if (!diagLogged && Date.now() - visibleWaitStart >= 2000) {
                  diagLogged = true;
                  this.addLog(`第${this.zhsQuestionNumber(els[visibleIdx])}题题干暂未读取到（${this.describeStemState(els[visibleIdx])}），继续等待…`, "warning");
                }
                if (Date.now() - visibleWaitStart >= 60000) {
                  this.addLog(`题目渲染超过 60 秒仍未完成，先继续处理（${this.describeStemState(els[visibleIdx])}）`, "warning");
                  return els;
                }
              }
            }
            await afkWait(150);
          }
          return this.getZhsQuestionElements();
        };

        this.addLog("等待页面加载完成，开始扫描任务点", "info");
        const readyElements = await waitForPageReady();
        if (!readyElements.length) {
          this.addLog("未解析到题目，请刷新重试或进入答题页面", "danger");
          return;
        }
        this.addLog("发现一个作业，正在解析", "primary");
        this.addLog("题目列表获取成功", "primary");
        this.addLog(`成功解析到${readyElements.length}个题目`, "primary");

        const answerTotal = readyElements.length;
        progressStore.update({
          taskName: "智慧树答题",
          type: "答题",
          isPlaying: true,
          questionTotal: answerTotal,
          questionIndex: 0,
          percent: 0,
          currentTime: 0,
          totalTime: 0,
          detail: `第 0 / ${answerTotal} 题`
        });

        const handled = new Set();
        let filledCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        let running = false;
        let finishedLogged = false;

        const markFinishedIfDone = () => {
          if (finishedLogged) return;
          const els = this.getZhsQuestionElements();
          if (!els.length) return;
          const allHandled = els.every((el) => handled.has(this.zhsQuestionKey(el)));
          if (!allHandled) return;
          finishedLogged = true;
          this.correctNum = filledCount;
          this.skippedCount = skippedCount;
          this.failedCount = failedCount;
          if (skippedCount > 0) {
            this.addLog(`共跳过${skippedCount}道已答题目（已答跳过不计入填涂成功数）`, "primary");
          }
          if (failedCount > 0) {
            this.addLog(`共${failedCount}道题未能成功填涂（不计入填涂成功数）`, "warning");
          }
          logFillProgress((msg, type) => this.addLog(msg, type), "智慧树答题", filledCount, answerTotal, skippedCount);
          progressStore.update({
            filledCount,
            fillRate: computeFillRate(filledCount, answerTotal)
          });
          this.addLog("智慧树答题页面无自动提交能力：仅填涂，不自动提交，请手动提交", "primary");
          this.addLog("作业已完成", "success");
          progressStore.update({
            questionIndex: answerTotal,
            percent: 100,
            isPlaying: false,
            detail: `已完成 ${answerTotal} 题`
          });
        };

        const clickNextQuestion = async () => {
          const switchBtns = this._document?.querySelectorAll(".switch-btn-box > button");
          const nextBtn = switchBtns && switchBtns[1];
          if (!nextBtn) {
            this.addLog("未找到下一题按钮，请手动切换", "danger");
            return false;
          }
          nextBtn.click();
          await afkWait(1200);
          return true;
        };

        const findPendingQuestion = () => {
          for (const el of this.getZhsQuestionElements()) {
            const key = this.zhsQuestionKey(el);
            if (!key || handled.has(key)) continue;
            const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
            if (rect && rect.width > 0 && rect.height > 0) return el;
          }
          return null;
        };

        const handleCurrentQuestion = async () => {
          if (running) return;
          const el = findPendingQuestion();
          if (!el) return;
          handled.add(this.zhsQuestionKey(el));
          running = true;
          try {
            const label = this.zhsQuestionNumber(el) || String(this.questions.length + 1);
            progressStore.update({
              questionIndex: handled.size,
              percent: Math.round((handled.size - 1) / answerTotal * 100),
              detail: `第 ${handled.size} / ${answerTotal} 题`
            });
            const stemStartedAt = Date.now();
            let stem = this.readStem(el);
            if (!stem.html && !stem.text) {
              this.addLog(`第${label}题题干正在渲染，等待就绪…（${this.describeStemState(el)}）`, "info");
              while (Date.now() - stemStartedAt < 60000 && !stem.html && !stem.text) {
                await afkWait(150);
                stem = this.readStem(el);
              }
              const waited = ((Date.now() - stemStartedAt) / 1000).toFixed(1);
              if (stem.html || stem.text) {
                this.addLog(`第${label}题题干已就绪（等待 ${waited}s）`, "primary");
              } else {
                this.addLog(`第${label}题题干读取失败（等了 ${waited}s，${this.describeStemState(el)}），按空题干上传`, "warning");
              }
            }
            const question = this.buildQuestion(el, stem);
            this.questions.push(question);

            if (skipAnswered && this.isZhsQuestionAnswered(question)) {
              this.addLog(`第${label}道题已作答，跳过`, "warning");
              skippedCount += 1;
              this.addQuestion(question);
              await clickNextQuestion();
              return;
            }

            this.addLog(`正在查找第${label}道题目答案...`, "primary");
            const answerData = await queryAnswer(question);
            if (answerData.code === 200) {
              question.answer = answerData.data.answer;
              question.source = answerData.data.source;


              this.addQuestion(question);

              await new Promise(r => setTimeout(r, 100));


              const filledOk = (await this.fillQuestion(question)) === true;
              if (filledOk) {
                filledCount += 1;
                progressStore.update({
                  filledCount,
                  fillRate: computeFillRate(filledCount, answerTotal)
                });
              } else {
                failedCount += 1;
                question._fillFailed = true;
                this.addLog(`第${label}道题未能成功填涂`, "warning");
              }

              const sourceHint = answerData.data.source === "ai" ? "(AI生成)" : "";
              const msgLines = (answerData.msg || '').split('\n');
              const firstLine = msgLines.shift();
              const msgHint = firstLine ? ` - ${firstLine}` : "";
              this.addLog(`第${label}道题查询成功${sourceHint}${msgHint}`, "success");
              for (const line of msgLines) {
                if (line.trim()) this.addLog(line, "primary");
              }
              if (answerData.data.cost !== undefined) {
                this.addLog(`本题消耗${answerData.data.cost}次，剩余${answerData.data.num}次`, "primary");
                progressStore.update({ remainingCount: answerData.data.num });
              }
            } else {
              this.addLog(`第${label}道题搜索失败：${answerData.msg}`, "danger");
              if (answerData.data?.sponsorUrl) {
                this.addLog(`💎 ${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
              }
              question.source = "error";
              question.answer[0] = answerData.msg;
              this.addQuestion(question);
              await new Promise(r => setTimeout(r, 100));
            }

            await clickNextQuestion();
          } finally {
            running = false;
            markFinishedIfDone();
          }
        };

        await handleCurrentQuestion();

        this._zhsWatchTimer = afkInterval(() => {
          handleCurrentQuestion().catch(() => {});
        }, 800);
      });
      __publicField(this, "parseHtml", () => {
        if (!this._document)
          return [];
        const questionElements = this._document.querySelectorAll(SELECTORS.ZHS_QUESTION);
        this.addQuestions(questionElements);
      });
      __publicField(this, "fillQuestion", async (question) => {
        if (!this._window)
          return false;

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
            return targetEls.length > 0;
          } else if (typeNum === "3") {

            let answer = null;
            if (REGEX.JUDGE_FALSE.test(question.answer[0])) {
              answer = "错";
            } else if (REGEX.JUDGE_TRUE.test(question.answer[0])) {
              answer = "对";
            }
            if (answer === null) {
              return false;
            }
            let judgeClicked = false;
            for (const key in question.options) {
              const optionElement = question.options[key];


              const isTrueOption = REGEX.JUDGE_TRUE.test(key);
              const isFalseOption = REGEX.JUDGE_FALSE.test(key);

              if ((isTrueOption && answer === "对") || (isFalseOption && answer === "错")) {
                optionElement.setAttribute("data-filling", "true");
                optionElement.click();
                setTimeout(() => optionElement.removeAttribute("data-filling"), 200);
                judgeClicked = true;
                break;
              }
            }
            return judgeClicked;
          } else if (typeNum === "2") {

            const textareaElements = question.element.querySelectorAll("textarea");
            let blankFilled = 0;
            if (textareaElements.length > 0 && question.answer && question.answer.length > 0) {

              textareaElements.forEach((textarea, index) => {
                if (index < question.answer.length) {
                  const answerText = this.stripTags(question.answer[index] || question.answer[0]);
                  if (String(answerText == null ? "" : answerText).trim() === "") return;
                  textarea.value = answerText;
                  textarea.dispatchEvent(new Event("input", { bubbles: true }));
                  blankFilled += 1;
                }
              });
            }
            return blankFilled > 0;
          } else if (["4", "5", "6", "7"].includes(typeNum)) {

            const textareaElement = question.element.querySelector("textarea");
            if (textareaElement && question.answer && question.answer.length > 0) {
              const answerText = question.answer.map(a => this.stripTags(a)).join("\n");
              if (String(answerText == null ? "" : answerText).trim() === "") return false;
              textareaElement.value = answerText;
              textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
              return true;
            }
            return false;
          } else {
            return false;
          }
        } catch (error) {
          this.addLog(`答题过程发生错误：${error.message}`, "danger");
          return false;
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
      const allElements = Array.from(optionElements || []);
      const topElements = allElements.filter(
        (el) => !allElements.some((other) => other !== el && other.contains(el)),
      );
      topElements.forEach((optionElement) => {
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
        this.questions.push(this.buildQuestion(questionElement));
      });
    }
    getZhsQuestionElements() {
      try {
        return this._document ? Array.from(this._document.querySelectorAll(SELECTORS.ZHS_QUESTION)) : [];
      } catch (e) {
        return [];
      }
    }
    readStem(questionElement) {
      let bridged = "";
      try {
        bridged = questionElement && questionElement.getAttribute ? questionElement.getAttribute("data-pp-stem") || "" : "";
      } catch (e) {}
      if (bridged) {
        let text = this.stripTags(bridged.replace(/<img\b[^>]*>/gi, "")).trim();
        if (!text && /<img\b/i.test(bridged)) text = "[图片题干]";
        return { html: bridged, text };
      }
      const stemNode = questionElement == null ? void 0 : questionElement.querySelector(".subject_describe div, .smallStem_describe p, .subject_describe, .smallStem_describe");
      const stemVm = stemNode == null ? void 0 : stemNode.__Ivue__;
      let stemShadow = stemVm == null ? void 0 : stemVm._data?.shadowDom;
      if (!stemShadow && stemNode && stemNode.__ppShadowRoot) {
        stemShadow = stemNode.__ppShadowRoot;
      }
      if (!stemShadow) {
        const stemScope = questionElement == null ? void 0 : questionElement.querySelector(".subject_describe, .smallStem_describe");
        stemShadow = readRecordedShadow(stemScope);
      }
      const html = stemShadow ? String(stemShadow.innerHTML || "") : "";
      let text = stemShadow
        ? String(stemShadow.textContent || "").trim()
        : String((stemNode == null ? void 0 : stemNode.textContent) || "").trim();
      if (!text && /<img\b/i.test(html)) {
        text = "[图片题干]";
      }
      return { html, text };
    }
    describeStemState(questionElement) {
      try {
        const stemNode = questionElement == null ? void 0 : questionElement.querySelector(".subject_describe div, .smallStem_describe p, .subject_describe, .smallStem_describe");
        const vm = stemNode && stemNode.__Ivue__;
        const sd = vm && vm._data && vm._data.shadowDom;
        const scope = questionElement == null ? void 0 : questionElement.querySelector(".subject_describe, .smallStem_describe");
        const recorded = readRecordedShadow(scope);
        const originWrapped = (() => {
          try {
            const fn = _unsafeWindow.originFunction;
            return !!(fn && fn.__ppAttachWrapped);
          } catch (e) {
            return false;
          }
        })();
        const htmlLen = sd ? String(sd.innerHTML || "").length : 0;
        let bridged = "";
        try {
          bridged = questionElement && questionElement.getAttribute ? questionElement.getAttribute("data-pp-stem") || "" : "";
        } catch (e) {}
        return `bridge=${bridged ? "有" : "无"} ivue=${vm ? "有" : "无"} shadow=${sd ? "有" : "无"} recorded=${recorded ? "有" : "无"} origin=${originWrapped ? "已接管" : "未接管"} htmlLen=${htmlLen}`;
      } catch (e) {
        return `诊断失败:${e.message}`;
      }
    }
    buildQuestion(questionElement, stem) {
      var _a, _b;
      const stemInfo = stem || this.readStem(questionElement);
      const stemHtml = stemInfo.html || "";
      const questionTitle = stemInfo.text || "";
      const questionTitleHtml = (() => {
        try {
          const tags = String(stemHtml).match(/<img\b[^>]*>/gi) || [];
          const imgs = [];
          for (const tag of tags) {
            const lazyMatch = tag.match(/data-src=["']?([^"'\s>]+)/i);
            const srcMatch = tag.match(/\ssrc=["']?([^"'\s>]+)/i);
            let src = srcMatch ? srcMatch[1] : "";
            if (lazyMatch && (!src || /^data:/i.test(src))) src = lazyMatch[1];
            if (src && !/^data:/i.test(src)) {
              imgs.push(`<img src="${src}" style="max-width:150px;max-height:70px;vertical-align:middle;margin:2px 4px 2px 0;border-radius:3px">`);
            }
          }
          if (imgs.length) return imgs.join("");
        } catch (e) {}
        return "";
      })();
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
      return {
        element: questionElement,
        type: numericType,
        title: questionTitle,
        titleHtml: questionTitleHtml,
        optionsText: optionTexts,
        options: optionsObject,
        answer: [],
        workType: "zhs",
        refer: this._window.location.href,
        html: this.serializeQuestionHtml(questionElement, stemHtml, questionTitle)
      };
    }
    zhsQuestionNumber(questionElement) {
      try {
        const numEl = questionElement.querySelector(".subject_num span, .subject_num");
        const raw = numEl ? String(numEl.textContent || "").trim() : "";
        return raw.replace(/[^\d]/g, "") || raw;
      } catch (e) {
        return "";
      }
    }
    zhsQuestionKey(questionElement) {
      const number = this.zhsQuestionNumber(questionElement);
      let title = "";
      try {
        const stemEl = questionElement.querySelector(".subject_describe, .smallStem_describe");
        title = String((stemEl == null ? void 0 : stemEl.textContent) || "").replace(/\s+/g, "").slice(0, 20);
      } catch (e) {}
      if (number) return `${number}#${title}`;
      try {
        return `idx${Array.prototype.indexOf.call(this._document.querySelectorAll(SELECTORS.ZHS_QUESTION), questionElement)}`;
      } catch (e) {
        return "";
      }
    }
    serializeQuestionHtml(questionElement, stemHtml, stemText) {
      try {
        const clone = questionElement.cloneNode(true);
        const host = clone.querySelector(".subject_describe") || clone.querySelector(".smallStem_describe");
        if (host) {
          if (stemHtml) {
            host.innerHTML = stemHtml;
          } else if (stemText) {
            host.textContent = stemText;
          }
        }
        return clone.outerHTML;
      } catch (e) {
        return questionElement.outerHTML;
      }
    }
  }




  const ppfxGuardTrustTimers = () => {
    const ppfxNativeInterval = _unsafeWindow.setInterval;
    const ppfxNativeTimeout = _unsafeWindow.setTimeout;
    const ppfxFromTrustCheck = () => {
      try {
        return String(new Error().stack || "").indexOf("checkoutNotTrustScript") !== -1;
      } catch (error) {
        return false;
      }
    };
    _unsafeWindow.setInterval = function(...args) {
      return ppfxFromTrustCheck() ? -1 : ppfxNativeInterval.apply(this, args);
    };
    _unsafeWindow.setTimeout = function(...args) {
      return ppfxFromTrustCheck() ? -1 : ppfxNativeTimeout.apply(this, args);
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
    ppfxGuardTrustTimers();
    const logStore = useLogStore();
    useConfigStore();
    if (!zhStudyTuning().answerOn) {
      logStore.addLog("当前为「仅视频」模式，已跳过智慧树答题", "warning");
      return;
    }
    logStore.addLog(`检测到用户进入到答题页面`, "primary");
    logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");

    let started = false;
    const startAnswering = async () => {
      if (started) return;
      started = true;
      await new ZhsQuestionHandler().init();
    };

    new XMLHttpRequestInterceptor(["gateway/t/v1/answer/hasAnswer"], async () => {
      await delay(1);
      await startAnswering();
      return true;
    });

    const waitTimer = setInterval(() => {
      if (started) {
        clearInterval(waitTimer);
        return;
      }
      if (document.querySelectorAll(SELECTORS.ZHS_QUESTION).length) {
        clearInterval(waitTimer);
        startAnswering().catch(() => {});
      }
    }, 500);
  };

  const ZH_SPEED_CEILING = 1.5;

  let _zhSpeedCeilingCache = 0;
  const zhSpeedCeiling = () => {
    try {
      const scope = document.querySelector(".controlsBar") || document;
      let max = 0;
      scope.querySelectorAll("span, div, li, button").forEach((el) => {
        if (el.children.length) return;
        const label = (el.textContent || "").trim();
        if (!/^\d+(\.\d+)?x$/i.test(label)) return;
        const val = parseFloat(label);
        if (Number.isFinite(val) && val > max) max = val;
      });
      if (max > 0 && max > _zhSpeedCeilingCache) _zhSpeedCeilingCache = max;
    } catch (e) {}
    return _zhSpeedCeilingCache || ZH_SPEED_CEILING;
  };
  const ZH_STUDY_PART = "视频设置";

  const zhSleep = (sec) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(sec) || 0) * 1e3));
  const zhPick = (sel, root) => {
    try {
      return (root || document).querySelector(sel);
    } catch (e) {
      return null;
    }
  };
  const zhPickAll = (sel, root) => {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    } catch (e) {
      return [];
    }
  };
  const zhTxtOf = (el, fallback) => {
    const text = el && el.textContent ? el.textContent.replace(/\s+/g, " ").trim() : "";
    if (text) return text;
    return fallback === undefined ? "" : fallback;
  };
  const zhVisible = (el) => {
    try {
      if (!el || !el.isConnected) return false;
      const box = el.getBoundingClientRect();
      if (!box.width && !box.height) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      return true;
    } catch (e) {
      return false;
    }
  };
  const zhTapNode = (el) => {
    if (!el) return false;
    try {
      el.scrollIntoView({ block: "center", inline: "nearest" });
    } catch (e) {}
    const box = (() => {
      try {
        return el.getBoundingClientRect();
      } catch (e) {
        return { left: 0, top: 0, width: 1, height: 1 };
      }
    })();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    let hit = el;
    try {
      hit = document.elementFromPoint(x, y) || el;
    } catch (e) {
      hit = el;
    }
    const atom = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1 };
    const fire = (node, type, extra) => {
      try {
        node.dispatchEvent(new MouseEvent(type, Object.assign({}, atom, extra)));
      } catch (e) {}
    };
    fire(hit, "mousedown");
    fire(hit, "mouseup", { buttons: 0 });
    fire(hit, "click", { buttons: 0 });
    return true;
  };

  const zhRuntime = {
    epoch: 0,
    idle: 0,
    notice: {},
    lastQuizAt: 0,
    lastAdvanceAt: 0,
    quizSignature: "",
    booted: false
  };

  const zhLogCadence = (log, key, message, type, gapSec) => {
    const now = Date.now();
    const last = zhRuntime.notice[key] || 0;
    if (now - last < (gapSec === undefined ? 30 : gapSec) * 1e3) return;
    zhRuntime.notice[key] = now;
    log.addLog(message, type || "primary");
  };

  const zhStudyTuning = () => {
    const readParam = (partName, paramName, fallback) => {
      try {
        const parts = useConfigStore().platformParams?.zhs?.parts || [];
        const part = parts.find((p) => p.name === partName);
        const param = (part?.params || []).find((p) => p.name === paramName);
        if (!param) return fallback;
        return param.value === undefined || param.value === null ? fallback : param.value;
      } catch (e) {
        return fallback;
      }
    };
    const speedRaw = Number(readParam(ZH_STUDY_PART, "播放倍速", zhSpeedCeiling())) || zhSpeedCeiling();
    const onlyAnswer = readParam("模式设置", "仅答题", false) === true;
    const onlyVideo = readParam("模式设置", "仅视频", false) === true;
    return {
      modeOn: !onlyAnswer,
      answerOn: !onlyVideo,
      autoPlay: readParam(ZH_STUDY_PART, "正常播放", true) !== false,
      autoSpeed: readParam(ZH_STUDY_PART, "自动倍速", true) !== false,
      speed: Math.min(Math.max(1, speedRaw), zhSpeedCeiling()),
      autoNext: readParam(ZH_STUDY_PART, "自动切换", true) !== false,
      quizAuto: readParam(ZH_STUDY_PART, "弹题作答", true) !== false,
      ignoreHabit: readParam(ZH_STUDY_PART, "忽略习惯弹窗", false) === true,
      captchaNotify: true
    };
  };


  const zhNativeRateSetter = (() => {
    try {
      const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "playbackRate");
      return desc && typeof desc.set === "function" ? desc.set : null;
    } catch (e) {
      return null;
    }
  })();

  const zhWriteRate = (media, rate) => {
    try {
      if (media.__ppZhRateSet) {
        media.__ppZhRateSet.call(media, rate);
      } else if (zhNativeRateSetter) {
        media.__ppZhRateSet = zhNativeRateSetter;
        zhNativeRateSetter.call(media, rate);
      } else {
        media.playbackRate = rate;
      }
    } catch (e) {}
  };

  const zhPinSpeed = (media, wanted) => {
    if (!media) return 1;
    const rate = Math.min(Math.max(1, Number(wanted) || 1), zhSpeedCeiling());
    try {
      if (!media.__ppZhSpeedHeld) {
        media.__ppZhSpeedHeld = true;
        zhWriteRate(media, rate);
        Object.defineProperty(media, "playbackRate", {
          configurable: true,
          enumerable: true,
          get() {
            return media.__ppZhSpeed || rate;
          },
          set() {}
        });
      } else {
        zhWriteRate(media, rate);
      }
      media.__ppZhSpeed = rate;
    } catch (e) {}
    return rate;
  };

  const zhFindMedia = async (selectors, timeoutSec) => {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    const deadline = Date.now() + (timeoutSec === undefined ? 8 : timeoutSec) * 1e3;
    while (Date.now() < deadline) {
      for (const sel of list) {
        const media = zhPick(sel);
        if (media && (media.currentSrc || media.src || media.readyState > 0)) return media;
      }
      await zhSleep(0.4);
    }
    return null;
  };

  const zhKeepPlaying = async (media, tune) => {
    if (!media) return false;
    const log = useLogStore();
    ppMuteOnce(media);
    if (tune) zhPinSpeed(media, tune.autoSpeed ? zhSpeedCeiling() : tune.speed);
    const markPlayed = () => {
      if (media.__ppZhPlayLogged) return;
      media.__ppZhPlayLogged = true;
      try {
        log.addLog(`video播放成功，倍速: ${Number(media.playbackRate) || 1}x`, "primary");
      } catch (e) {}
    };
    if (!media.paused && !media.ended) {
      markPlayed();
      return true;
    }
    if (!media.__ppZhPlayAnnounced) {
      media.__ppZhPlayAnnounced = true;
      try {
        const holder =
          zhPick(".chapter-content-second.current") ||
          zhPick(".chapter-item.current") ||
          zhPick(".child-main.current") ||
          zhPick(".video.current_play");
        const mediaName = holder ? String(zhTxtOf(holder) || "").replace(/\s+/g, " ").trim().slice(0, 40) : "";
        log.addLog(`正在尝试播放${mediaName || "video"}，请稍等5s`, "primary");
      } catch (e) {}
    }
    try {
      await media.play();
      markPlayed();
      return true;
    } catch (e) {
      try {
        media.muted = true;
        await media.play();
        markPlayed();
        return true;
      } catch (e2) {
        return false;
      }
    }
  };


  const zhVmChainOf = (node) => {
    const chain = [];
    let cursor = node;
    let depth = 0;
    while (cursor && depth < 14 && !chain.length) {
      const vm = cursor.__vue__;
      if (vm) {
        let up = vm;
        let guard = 0;
        while (up && guard < 8) {
          chain.push(up);
          up = up.$parent;
          guard += 1;
        }
      }
      cursor = cursor.parentElement;
      depth += 1;
    }
    return chain;
  };

  const zhVmAnswerQuiz = async (root, log) => {
    const chain = zhVmChainOf(root);
    if (!chain.length) return false;
    const holder = chain.find((vm) => vm && (vm.topicInfo || vm.testDialog !== undefined));
    if (!holder) return false;
    const payload = holder.topicInfo || {};
    const groups = payload.lessonTestQuestionUseInterfaceDtos || payload.testQuestionUseInterfaceDtos || payload.topicDtos || [];
    const bucket = (groups && groups[0]) || {};
    const question = bucket.testQuestion || bucket;
    const options = (question && (question.questionOptions || question.questionOption)) || [];
    const keys = bucket.answerUs || (question && question.answerUs) || [];
    const invokers = ["topicClickQot", "topicClickOption", "chooseTopicOption", "clickTopicOption", "selectQuestionOption"]
      .map((name) => holder[name])
      .filter((fn) => typeof fn === "function");
    if (!options.length || !keys.length || !invokers.length) return false;
    let answered = 0;
    for (const option of options) {
      const key = option.sortUs !== undefined ? option.sortUs : option.sort;
      if (keys.indexOf(key) === -1) continue;
      try {
        invokers[0].call(holder, option);
        answered += 1;
      } catch (e) {}
      await zhSleep(0.6);
    }
    if (!answered) return false;
    log.addLog(`弹题已按页面数据作答（${answered} 个选项）`, "success");
    await zhSleep(1.2);
    if (holder.testDialog !== undefined) {
      try {
        holder.testDialog = false;
      } catch (e) {}
    }
    return true;
  };


  const zhQuizRoot = () => {
    const legacy = zhPick("#playTopic-dialog");
    if (zhVisible(legacy)) return legacy;
    const modern = zhPick(".ai-test-question-wrapper");
    if (zhVisible(modern)) return modern;
    const wisdom = zhPick(".ai-class-exercise-dialog");
    if (zhVisible(wisdom)) return wisdom;
    return null;
  };

  const zhQuizStep = async (tune, log) => {
    const root = zhQuizRoot();
    if (!root) {
      zhRuntime.quizSignature = "";
      return false;
    }
    const signature = zhTxtOf(root).slice(0, 80);
    const now = Date.now();
    if (signature && signature === zhRuntime.quizSignature && now - zhRuntime.lastQuizAt < 15000) return false;
    if (now - zhRuntime.lastQuizAt < 3000) return false;
    zhRuntime.quizSignature = signature;
    const handled = await zhHandleQuiz(root, tune, log);
    zhRuntime.lastQuizAt = Date.now();
    return handled;
  };

  const zhHandleQuiz = async (root, tune, log) => {
    if (await zhVmAnswerQuiz(root, log)) return true;
    if (!tune.quizAuto) {
      zhLogCadence(log, "quiz-off", "出现弹题，但「弹题作答」已关闭，请手动处理后继续", "warning", 20);
      return true;
    }
    zhLogCadence(log, "quiz-guess", "弹题未取到答案，按配置随机作答后关闭", "warning", 8);
    if (root.id === "playTopic-dialog") {
      const pages = zhPickAll("#playTopic-dialog .el-pager .number");
      for (const page of pages) {
        if (!page.isConnected) continue;
        if (!/(^|\s)active(\s|$)/.test(page.className || "")) {
          zhTapNode(page);
          await zhSleep(0.5);
        }
        const items = zhPickAll("#playTopic-dialog ul .topic-item");
        if (!items.length) continue;
        zhTapNode(items[Math.floor(Math.random() * items.length)]);
        await zhSleep(0.8);
      }
      await zhSleep(0.6);
      zhTapNode(zhPick("#playTopic-dialog .close-btn") || zhPick("#playTopic-dialog .btn"));
      return true;
    }
    if (root.classList.contains("ai-test-question-wrapper")) {
      if (zhPick(".done", root)) {
        zhTapNode(zhPick(".close-box", root));
        return true;
      }
      const options = zhPickAll(".options .option", root);
      if (options.length) {
        zhTapNode(options[Math.floor(Math.random() * options.length)]);
        await zhSleep(0.8);
      }
      zhTapNode(zhPick(".submit-btn .submits", root) || zhPick(".submit-btn", root));
      await zhSleep(0.8);
      zhTapNode(zhPick(".close-box", root));
      return true;
    }
    const items = zhPickAll(".ques-list .item", root);
    for (const item of items) {
      const options = zhPickAll(".option", item).filter(zhVisible);
      if (!options.length) continue;
      zhTapNode(options[Math.floor(Math.random() * options.length)]);
      await zhSleep(0.8);
    }
    const footer = zhPick(".el-dialog__footer .el-button.btn", root) || zhPick(".el-dialog__footer .el-button", root);
    zhTapNode(footer);
    await zhSleep(0.8);
    zhTapNode(zhPick(".header-icon", root) || zhPick(".header-box .close-box", root));
    return true;
  };


  const zhCaptchaNode = () => {
    const onScreen = (el) => {
      if (!el || !zhVisible(el)) return false;
      try {
        const box = el.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth || 0;
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;
        return box.bottom > 0 && box.right > 0 && box.top < vh && box.left < vw;
      } catch (e) {
        return false;
      }
    };
    const legacy = zhPick(".yidun_popup, .yidun_modal, .yidun_intellisense, .geetest_panel, .verify-wrap");
    if (onScreen(legacy)) return legacy;
    const tcaptcha = zhPick("#tcaptcha_transform_dy, .tcaptcha-transform");
    if (onScreen(tcaptcha)) return tcaptcha;
    const yidunBox = zhPick("#captchaYidun");
    if (yidunBox) {
      let height = 0;
      try {
        height = yidunBox.getBoundingClientRect().height;
      } catch (e) {}
      if (height >= 50 && onScreen(yidunBox)) return yidunBox;
    }
    return null;
  };

  const zhCaptchaHold = async (tune, log) => {
    if (!zhCaptchaNode()) return false;
    log.addLog("检测到平台验证码，已暂停学习流程；验证完成后会自动继续", "danger");
    const originTitle = document.title;
    let flasher = null;
    if (tune.captchaNotify) {
      let flip = false;
      flasher = setInterval(() => {
        flip = !flip;
        try {
          document.title = flip ? "【需验证】" + originTitle : originTitle;
        } catch (e) {}
      }, 900);
    }
    const startedAt = Date.now();
    while (zhCaptchaNode()) await zhSleep(1.5);
    if (flasher) clearInterval(flasher);
    try {
      document.title = originTitle;
    } catch (e) {}
    log.addLog(`验证码已通过（等待 ${Math.round((Date.now() - startedAt) / 1e3)} 秒），继续学习`, "success");
    return true;
  };


  const zhHabitNode = () =>
    zhPickAll(".el-overlay, .el-dialog__wrapper, .el-message-box__wrapper").find(
      (el) => zhVisible(el) && zhTxtOf(el).indexOf("保持良好的学习习惯") >= 0
    );

  const zhHabitStep = async (tune, log) => {
    const node = zhHabitNode();
    if (!node) return false;
    if (!tune.ignoreHabit) {
      zhLogCadence(
        log,
        "habit-pause",
        "检测到习惯分提示（当天学习时长已满），已暂停自动切换；可在「学习设置」开启忽略",
        "warning",
        60
      );
      return true;
    }
    zhTapNode(zhPick(".el-dialog__header img", node) || zhPick(".el-dialog__headerbtn", node) || zhPick("img", node));
    log.addLog("已忽略习惯分提示并继续（该课程的平时习惯分可能受影响）", "warning");
    await zhSleep(1);
    return true;
  };


  const zhClearNoise = () => {
    zhPickAll(".v-modal, .brush-warning").forEach((el) => {
      try {
        el.remove();
      } catch (e) {}
    });
    const tip = zhPickAll(".el-dialog").find((d) => zhVisible(d) && zhTxtOf(d).indexOf("温馨提示") >= 0);
    if (tip) {
      const btn = zhPick(".el-button.btn", tip);
      if (btn && zhTxtOf(btn).indexOf("我知道了") >= 0) zhTapNode(btn);
    }
    const readTip = zhPick(".dialog-read .iconguanbi");
    if (readTip && zhVisible(readTip.closest ? readTip.closest(".dialog-read") : readTip)) zhTapNode(readTip);
  };

  const zhPptSweep = async (boxSelector, log) => {
    const boxes = Array.isArray(boxSelector) ? boxSelector : [boxSelector];
    const find = (sel) => {
      for (const one of boxes) {
        const node = zhPick(one);
        const hit = node && zhPick(sel, node);
        if (hit) return hit;
      }
      return zhPick(sel);
    };
    const readPage = (sel) => parseInt(zhTxtOf(find(sel)), 10) || 0;
    const current = readPage(".page-current");
    const total = readPage(".page-total");
    if (!total) return false;
    if (current >= total) return true;
    log.addLog(`发现 PPT 资源，共 ${total} 页，开始自动翻页`, "primary");
    let guard = 0;
    while (guard < total + 6) {
      const nowCurrent = readPage(".page-current");
      const nowTotal = readPage(".page-total");
      if (!nowTotal || nowCurrent >= nowTotal) break;
      zhTapNode(find(".next-page-btn"));
      await zhSleep(1.1);
      guard += 1;
    }
    log.addLog("PPT 翻页完成", "success");
    return true;
  };

  const zhBookSweep = async (boxSelector, log) => {
    const box = zhPick(boxSelector);
    if (!box) return false;
    const pages = zhPickAll(".book-mark .canvas-wrapper");
    const pageHeight = (pages[0] && pages[0].getBoundingClientRect().height) || 420;
    log.addLog("发现电子书资源，开始自动翻阅", "primary");
    let guard = 0;
    while (guard < 400 && box.scrollTop + box.clientHeight < box.scrollHeight - 4) {
      box.scrollTo({ top: Math.min(box.scrollTop + Math.max(pageHeight * 0.9, 200), box.scrollHeight), behavior: "smooth" });
      await zhSleep(0.9);
      guard += 1;
    }
    log.addLog("电子书翻阅完成", "success");
    return true;
  };

  const zhSectionProgress = (el) => {
    const text = zhTxtOf(zhPick(".collapse-info-progress .progress-text", el));
    const matched = text.replace(/\s/g, "").match(/(\d+)\/(\d+)/);
    if (!matched) return null;
    const done = parseInt(matched[1], 10);
    const total = parseInt(matched[2], 10);
    if (Number.isNaN(done) || Number.isNaN(total)) return null;
    return { done, total };
  };


  const zhStageLegacyShare = {
    id: "legacy-share",
    label: "共享课",
    match: (host) => /studyvideoh5\.zhihuishu\.com/.test(host),
    chapters: () => zhPickAll("li.video, .clearfix.video"),
    current: () => zhPick(".video.current_play") || zhPick(".current_play"),
    isDone: (el) => !!(el && zhPick(".time_icofinish", el)),
    async step(tune, log) {
      zhClearNoise();
      const media = await zhFindMedia(["#vjs_container_html5_api", "#vjs_container video", "video"], 6);
      if (media) {
        if (media.ended) {
          const current = this.current();
          if (current && this.isDone(current)) return await this.advance(tune, log);
          zhLogCadence(log, "legacy-replay", "视频播放结束但未计入完成，重播补齐时长", "warning", 25);
          try {
            media.currentTime = 1;
          } catch (e) {}
        }
        await zhKeepPlaying(media, tune);
        return true;
      }
      const pendingCurrent = this.current();
      if (pendingCurrent && this.isDone(pendingCurrent)) return await this.advance(tune, log);
      zhLogCadence(log, "wait-media-" + this.id, "当前节点视频尚未加载，等待中…", "warning", 20);
      return false;
    },
    async advance(tune, log) {
      if (!tune.autoNext) return false;
      const list = this.chapters();
      const pending = list.filter((el) => !this.isDone(el));
      if (!pending.length) {
        zhLogCadence(log, "legacy-all", "本页任务点已全部完成", "success", 300);
        return false;
      }
      const current = this.current();
      const index = pending.indexOf(current);
      const target = index >= 0 && pending[index + 1] ? pending[index + 1] : pending[0];
      log.addLog(`切换到下一节：${zhTxtOf(zhPick(".catalogue_title", target), "下一个视频")}`, "primary");
      zhTapNode(target);
      await zhSleep(2.4);
      return true;
    }
  };

  const zhStageNewShare = {
    id: "new-share",
    label: "新共享课",
    match: (host) => /studyplush5\.zhihuishu\.com|studywisdomh5\.zhihuishu\.com/.test(host),
    chapters: () => zhPickAll(".child-main").filter((el) => el.parentElement && zhPick(".child-time", el.parentElement)),
    current: () => zhPick(".child-main.current"),
    isDone: (el) => !!(el && el.parentElement && zhPick(".finish-icon", el.parentElement)),
    async step(tune, log) {
      zhClearNoise();
      const media = await zhFindMedia(["video", "audio"], 6);
      if (media) {
        if (media.ended) {
          const current = this.current();
          if (current && this.isDone(current)) return await this.advance(tune, log);
          try {
            media.currentTime = 1;
          } catch (e) {}
        }
        await zhKeepPlaying(media, tune);
        return true;
      }
      const pendingCurrent = this.current();
      if (pendingCurrent && this.isDone(pendingCurrent)) return await this.advance(tune, log);
      zhLogCadence(log, "wait-media-" + this.id, "当前节点视频尚未加载，等待中…", "warning", 20);
      return false;
    },
    async advance(tune, log) {
      if (!tune.autoNext) return false;
      const list = this.chapters();
      const pending = list.filter((el) => !this.isDone(el));
      if (!pending.length) {
        zhLogCadence(log, "newshare-all", "本页任务点已全部完成", "success", 300);
        return false;
      }
      const current = this.current();
      const index = pending.indexOf(current);
      const target = index >= 0 && pending[index + 1] ? pending[index + 1] : pending[0];
      log.addLog(`切换到下一节：${zhTxtOf(target.parentElement, "下一节")}`, "primary");
      zhTapNode(target);
      await zhSleep(2.4);
      return true;
    }
  };

  const zhStageWisdomMooc = {
    id: "wisdom-mooc",
    label: "新智慧共享课",
    match: (host) => /wisdom-mooc\.zhihuishu\.com/.test(host),
    chapters: () => {
      const flat = [];
      zhPickAll(".chapter-content .chapter-item").forEach((item) => {
        const children = zhPickAll(".chapter-content-second", item);
        if (children.length) flat.push.apply(flat, children);
        else flat.push(item);
      });
      return flat;
    },
    current: () => zhPick(".chapter-content-second.current") || zhPick(".chapter-item.current"),
    isDone: (el) => !!(el && zhPick(".finish-icon", el)),
    async step(tune, log) {
      zhClearNoise();
      const mastery = zhPick(".masterylevel-body");
      if (zhVisible(mastery)) {
        zhTapNode(zhPick(".header-box .close-box") || zhPick(".header-icon"));
        log.addLog("已关闭掌握度弹窗", "primary");
        await zhSleep(1);
        return true;
      }
      const media = await zhFindMedia(["video", "audio"], 6);
      if (media) {
        if (media.ended) {
          const current = this.current();
          if (!current || !this.isDone(current)) {
            zhLogCadence(log, "wisdom-replay", "当前节点未出现完成标记，重新播放补齐时长", "warning", 25);
            try {
              media.currentTime = 1;
            } catch (e) {}
          } else {
            return await this.advance(tune, log);
          }
        }
        await zhKeepPlaying(media, tune);
        return true;
      }
      const pendingCurrent = this.current();
      if (pendingCurrent && this.isDone(pendingCurrent)) return await this.advance(tune, log);
      zhLogCadence(log, "wait-media-" + this.id, "当前节点视频尚未加载，等待中…", "warning", 20);
      return false;
    },
    async advance(tune, log) {
      if (!tune.autoNext) return false;
      const list = this.chapters();
      const pending = list.filter((el) => !this.isDone(el));
      if (!pending.length) {
        zhLogCadence(log, "wisdom-all", "本页任务点已全部完成", "success", 300);
        return false;
      }
      const current = this.current();
      const index = pending.indexOf(current);
      const target = index >= 0 && pending[index + 1] ? pending[index + 1] : pending[0];
      log.addLog(`切换到下一节：${zhTxtOf(target, "下一节")}`, "primary");
      zhTapNode(target);
      await zhSleep(2.6);
      return true;
    }
  };

  const ZH_CARD_SELECTORS = ["[class*=\"card-container\"]", ".resources-list .resources-item"];
  const zhCardList = () => {
    for (const sel of ZH_CARD_SELECTORS) {
      const found = zhPickAll(sel);
      if (found.length) return found;
    }
    return [];
  };
  const zhCardKind = (card) => {
    const icon = (card && zhPick(".icon-box", card)) || (card && zhPick(".file-type", card));
    const cls = (icon && icon.className) || "";
    if (/video/.test(cls)) return "video";
    if (/book/.test(cls)) return "book";
    if (/ppt|other/.test(cls)) return "ppt";
    if (/text/.test(cls)) return "text";
    if (/link/.test(cls)) return "link";
    return "unknown";
  };
  const zhCardDone = (card) => {
    const flag = card && zhPick(".finished-icon", card);
    if (!flag) return false;
    const text = zhTxtOf(flag);
    return !text || text.indexOf("已完成") >= 0;
  };

  const zhStageCard = {
    id: "card",
    label: "新形态课程",
    match: (host) => /ai-smart-course-student-pro\.zhihuishu\.com|smartcoursestudent\.zhihuishu\.com|fusioncourseh5\.zhihuishu\.com/.test(host),
    chapters: () => zhPickAll(".clearfix.video"),
    chapterDone: (el) => !!(el && (zhPick(".finish-icon", el) || zhPick(".time_icofinish", el))),
    activeCard() {
      return zhCardList().find((card) => /(^|\s)active(\s|$)/.test(card.className || "")) || zhCardList()[0] || null;
    },
    async chapterStep(tune, log) {
      const media = await zhFindMedia(["#vjs_container video", "#vjs_container_html5_api", "video", "audio"], 6);
      if (media) {
        if (media.ended) {
          const current = zhPick(".clearfix.video.current_play") || zhPick(".clearfix.video.activeNode");
          if (current && this.chapterDone(current)) return await this.chapterAdvance(tune, log);
          try {
            media.currentTime = 1;
          } catch (e) {}
        }
        await zhKeepPlaying(media, tune);
        return true;
      }
      return await this.chapterAdvance(tune, log);
    },
    async chapterAdvance(tune, log) {
      if (!tune.autoNext) return false;
      const list = this.chapters();
      const pending = list.filter((el) => !this.chapterDone(el));
      if (!pending.length) {
        zhLogCadence(log, "fusion-chapter-all", "本页任务点已全部完成", "success", 300);
        return false;
      }
      const current = zhPick(".clearfix.video.current_play") || zhPick(".clearfix.video.activeNode");
      const index = pending.indexOf(current);
      const target = index >= 0 && pending[index + 1] ? pending[index + 1] : pending[0];
      log.addLog(`切换到下一节：${zhTxtOf(zhPick(".title", target) || zhPick(".catalogue_title", target) || target, "下一个视频")}`, "primary");
      zhTapNode(target);
      await zhSleep(2.4);
      return true;
    },
    async step(tune, log) {
      zhClearNoise();
      const popup = zhPick(".courseRemind.khfaPop");
      if (popup && zhVisible(popup)) {
        zhTapNode(zhPick(".header-slot-box .el-icon-error", popup));
        log.addLog("已关闭课程提醒弹窗", "primary");
      }
      if (!zhCardList().length) return await this.chapterStep(tune, log);
      const card = this.activeCard();
      const kind = card ? zhCardKind(card) : "unknown";
      if (kind === "video") {
        const media = await zhFindMedia(["#vjs_container video", ".video-player-wrapper video", "video"], 6);
        if (media) {
          if (media.ended) {
            if (card && zhCardDone(card)) return await this.advance(tune, log);
            try {
              media.currentTime = 1;
            } catch (e) {}
          }
          await zhKeepPlaying(media, tune);
          return true;
        }
      }
      if (kind === "ppt") {
        if (await zhPptSweep([".ppt-preview-container", ".ppt-btn-container"], log)) return true;
      }
      if (kind === "book") {
        if (await zhBookSweep(".preview-section .book-mark .book-container, .book-container", log)) return true;
      }
      if (kind === "text" || kind === "link") {
        zhLogCadence(log, "card-passive", "文本/链接类资源无法自动完成，已跳过", "warning", 120);
        return await this.advance(tune, log);
      }
      return await this.advance(tune, log);
    },
    async advance(tune, log) {
      if (!tune.autoNext) return false;
      if (!zhCardList().length) return await this.chapterAdvance(tune, log);
      const cards = zhCardList();
      const activeIndex = cards.findIndex((card) => /(^|\s)active(\s|$)/.test(card.className || ""));
      const pending = cards.filter((card) => !zhCardDone(card));
      if (pending.length) {
        const after = pending.find((card) => cards.indexOf(card) > activeIndex);
        const target = after || pending[0];
        log.addLog(`切换到下一节：${zhTxtOf(target.querySelector(".common-text, .video-title, .basic-info-video-card-container")) || "下一个资源"}`, "primary");
        zhTapNode(zhPick(".basic-info-video-card-container", target) || zhPick(".common-text", target) || target);
        await zhSleep(2.4);
        return true;
      }
      const sections = zhPickAll(".section-item-collapse-info");
      if (!sections.length) {
        zhLogCadence(log, "card-all", "本页任务点已全部完成", "success", 300);
        return false;
      }
      const activeSection = sections.find((el) => /(^|\s)active(\s|$)/.test(el.className || ""));
      const unfinished = sections.filter((el) => {
        const progress = zhSectionProgress(el);
        return !progress || progress.done < progress.total;
      });
      if (!unfinished.length) {
        zhLogCadence(log, "card-section-all", "本页任务点已全部完成", "success", 300);
        return false;
      }
      const activePos = unfinished.indexOf(activeSection);
      const nextSection = activePos >= 0 && unfinished[activePos + 1] ? unfinished[activePos + 1] : unfinished[0];
      log.addLog(`切换到下一节：${zhTxtOf(zhPick(".section-item-collapse-title", nextSection), "下一章")}`, "primary");
      zhTapNode(nextSection);
      await zhSleep(2.8);
      return true;
    }
  };

  const zhStagePractice = {
    id: "practice",
    label: "校内课 / 翻转课",
    match: (host) => /hike\.zhihuishu\.com|wenda\.zhihuishu\.com|hike-teaching-center\.polymas\.com/.test(host),
    profiles: [
      {
        list: ".file-item",
        current: ".file-item.active",
        title: "#sourceTit",
        done: ".icon-finish",
        media: "#mediaPlayer, video, audio",
        rate: ".rate"
      },
      {
        list: ".el-tree-node",
        current: ".el-tree-node.is-current",
        title: ".file-name",
        done: "label.success",
        media: "video, audio",
        leafOnly: true
      },
      {
        list: ".source-icon",
        current: ".active-file",
        title: ".file-name",
        done: "i.select",
        media: "video, audio"
      }
    ],
    profile() {
      return this.profiles.find((p) => zhPickAll(p.list).length) || null;
    },
    items(profile) {
      const list = zhPickAll(profile.list);
      if (profile.leafOnly) return list.filter((el) => !(el.querySelector(".el-tree-node__children") || { children: [] }).children.length);
      return list;
    },
    current(profile) {
      const node = zhPick(profile.current);
      if (!node) return null;
      return node.closest ? node.closest(profile.list) : node;
    },
    isDone(profile, item) {
      return !!(item && zhPick(profile.done, item));
    },
    findMediaDeep(selectors) {
      const docs = [document];
      zhPickAll("iframe").forEach((frame) => {
        try {
          if (frame.contentDocument) docs.push(frame.contentDocument);
        } catch (e) {}
      });
      for (const doc of docs) {
        for (const sel of selectors.split(",").map((s) => s.trim())) {
          if (!sel) continue;
          const nodes = zhPickAll(sel, doc);
          for (const node of nodes) {
            if (node.tagName === "VIDEO" || node.tagName === "AUDIO") return node;
            const inner = zhPick("video, audio", node);
            if (inner) return inner;
          }
        }
        const fallback = zhPick("video, audio", doc);
        if (fallback) return fallback;
      }
      return null;
    },
    async step(tune, log) {
      zhClearNoise();
      const profile = this.profile();
      if (!profile) {
        zhLogCadence(log, "practice-nolist", "未识别到章节列表，请确认已进入具体学习资源页", "warning", 90);
        return false;
      }
      const media = this.findMediaDeep(profile.media);
      if (media) {
        if (media.ended) {
          const current = this.current(profile);
          const progress = zhTxtOf(zhPick(profile.rate, current));
          if (current && !this.isDone(profile, current)) {
            zhLogCadence(log, "practice-replay", `播放结束但未计入完成${progress ? `（当前进度 ${progress}）` : ""}，重播补齐`, "warning", 25);
            try {
              media.currentTime = 1;
            } catch (e) {}
          } else {
            return await this.advance(profile, tune, log);
          }
        }
        await zhKeepPlaying(media, tune);
        return true;
      }
      return await this.advance(profile, tune, log);
    },
    async advance(profile, tune, log) {
      if (!tune.autoNext) return false;
      const list = this.items(profile);
      const pending = list.filter((item) => !this.isDone(profile, item));
      if (!pending.length) {
        zhLogCadence(log, "practice-all", "本页任务点已全部完成", "success", 300);
        return false;
      }
      const current = this.current(profile);
      const index = pending.indexOf(current);
      const target = index >= 0 && pending[index + 1] ? pending[index + 1] : pending[0];
      log.addLog(`切换到下一节：${zhTxtOf(target.querySelector(profile.title) || target, "下一个资源")}`, "primary");
      zhTapNode(target);
      await zhSleep(2.6);
      return true;
    }
  };

  const ZH_CLASSROOM_STAGES = [zhStageLegacyShare, zhStageNewShare, zhStageCard, zhStageWisdomMooc, zhStagePractice];

  const zhStageLooksDone = (stage) => {
    try {
      if (stage.id === "practice") {
        const profile = stage.profile();
        if (!profile) return false;
        const current = stage.current(profile);
        return !!(current && stage.isDone(profile, current));
      }
      if (stage.id === "card") {
        const card = stage.activeCard();
        return !!(card && zhCardDone(card));
      }
      const current = stage.current && stage.current();
      return !!(current && stage.isDone && stage.isDone(current));
    } catch (e) {
      return false;
    }
  };


  const zhEntryHint = () => {
    const host = location.hostname;
    const path = location.pathname + location.hash;
    if (/\/singleCourse\//.test(path) || /ai-course-center/.test(path)) {
      return "当前是课程主页，请点击任意章节进入学习页后再使用";
    }
    if (/wenda\./.test(host) && /studyResource/.test(path)) {
      return "当前是资源列表页，请点击具体资源进入学习页后再使用";
    }
    if (/fusioncourseh5/.test(host) && /\/exam/.test(path)) {
      return "当前是考试页面，答题请使用答题功能";
    }
    return "";
  };

  const zhBootClassroom = async (stage, log) => {
    if (zhRuntime.booted) return;
    zhRuntime.booted = true;
    zhRuntime.epoch += 1;
    const epoch = zhRuntime.epoch;
    log.addLog(`检测到用户进入到${stage.label}学习页面`, "primary");
    log.addLog("正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）", "warning");
    log.addLog(`播放器最大倍速: ${zhSpeedCeiling()}x`, "info");
    while (zhRuntime.epoch === epoch) {
      await zhSleep(1.1);
      const tune = zhStudyTuning();
      if (!tune.modeOn) {
        log.addLog("智慧树「学习」已关闭，停止本页任务", "warning");
        break;
      }
      try {
        if (await zhCaptchaHold(tune, log)) continue;
        if (await zhHabitStep(tune, log)) continue;
        if (await zhQuizStep(tune, log)) continue;
        if (zhStageLooksDone(stage)) {
          if (Date.now() - zhRuntime.lastAdvanceAt > 2200 && (await stage.advance(tune, log))) {
            zhRuntime.lastAdvanceAt = Date.now();
            continue;
          }
        }
        const acted = await stage.step(tune, log);
        if (acted) {
          zhRuntime.idle = 0;
        } else {
          zhRuntime.idle += 1;
          if (zhRuntime.idle % 15 === 0) log.addLog("当前没有可推进的内容，等待页面状态刷新…", "primary");
        }
      } catch (error) {
        zhLogCadence(log, "stage-error", `页面处理出现异常：${error && error.message ? error.message : error}`, "warning", 20);
      }
    }
  };

  const useZhClassroomStudy = async () => {
    const log = useLogStore();
    if (zhRuntime.booted) return;
    const host = location.hostname;
    const stage = ZH_CLASSROOM_STAGES.find((item) => item.match(host));
    if (!stage) {
      log.addLog("当前智慧树页面暂不支持自动学习", "warning");
      return;
    }
    const hint = zhEntryHint();
    if (hint) {
      log.addLog(hint, "warning");
      const waiter = setInterval(() => {
        if (zhRuntime.booted) {
          clearInterval(waiter);
          return;
        }
        if (!zhEntryHint()) {
          clearInterval(waiter);
          if (zhStudyTuning().modeOn) zhBootClassroom(stage, log);
        }
      }, 2e3);
      return;
    }
    if (!zhStudyTuning().modeOn) {
      log.addLog("智慧树「学习」已关闭，当前页面不做处理", "warning");
      return;
    }
    zhBootClassroom(stage, log);
  };






  const readYktParam = (partName, paramName, fallback = false) => {
    try {
      const parts = useConfigStore().platformParams?.ykt?.parts || [];
      const part = parts.find((p) => p.name === partName);
      const param = (part?.params || []).find((p) => p.name === paramName);
      const val = param ? param.value : undefined;
      return val === undefined || val === null ? fallback : val;
    } catch (e) {
      return fallback;
    }
  };

  const YKT_SEL = {
    job: "div.leaf-item",
    jobTitle: ".leaf-item-title",
    jobTag: ".leaf-item-tag",
    jobDone: '[class*="yuanquangou"]',
    detail: ".detail-container",
    media: ".detail-container video",
    pptSlide: ".swiper-container .container",
    pptUnread: ".noRead",
    navCollapsed: ".nav-item-title:not(.is-expand)",
    forum: ".detail-container .lms-graph-forum",
    forumStatus: ".learning-space-control-unit .control-right .f12",
    forumInput: ".forum-publish textarea.el-textarea__inner",
    forumComment: ".forum-content .forum-item .comment-text",
    forumSend: ".prompt-send-btn:not(.disabled)"
  };

  const yktJobs = () => Array.from(document.querySelectorAll(YKT_SEL.job));
  const yktJobTag = (el) => (el.querySelector(YKT_SEL.jobTag)?.textContent || "").trim();
  const yktJobTitle = (el) => (el.querySelector(YKT_SEL.jobTitle)?.textContent || "").trim() || "未知任务点";
  const yktJobDone = (el) => !!el.querySelector(YKT_SEL.jobDone);

  const yktExpandTree = async () => {
    for (let i = 0; i < 5; i++) {
      const collapsed = document.querySelectorAll(YKT_SEL.navCollapsed);
      if (!collapsed.length) break;
      collapsed.forEach((el) => el.click());
      await delay(0.15);
    }
  };

  const forceMediaRate = (media, rate) => {
    try {
      const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "playbackRate");
      if (!desc || typeof desc.set !== "function" || typeof desc.get !== "function") return false;
      if (!media.__ppRateLocked) {
        Object.defineProperty(media, "playbackRate", {
          configurable: true,
          get() { return this.__ppForcedRate; },
          set() {}
        });
        media.__ppRateLocked = true;
      }
      media.__ppForcedRate = rate;
      desc.set.call(media, rate);
      try {
        const defDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "defaultPlaybackRate");
        if (defDesc && typeof defDesc.set === "function") defDesc.set.call(media, rate);
      } catch (e) {}
      try {
        const label = document.querySelector("xt-speedvalue");
        if (label) label.textContent = `${Number(rate).toFixed(2)}X`;
      } catch (e) {}
      return true;
    } catch (e) {
      return false;
    }
  };

  const forceMediaMute = (media) => {
    if (!media || media.__ppMuteLocked) return false;
    media.__ppMuteLocked = true;
    media.__ppMutedOnce = true;
    try { media.muted = true; } catch (e) {}
    return true;
  };

  const yktMediaFinished = (media, epsilon = 0.75) => {
    if (!media) return false;
    if (media.ended) return true;
    const duration = Number(media.duration);
    const current = Number(media.currentTime);
    return Number.isFinite(duration) && duration > 0 && Number.isFinite(current) && current >= duration - epsilon;
  };

  const yktPlayMedia = (media, opts) => new Promise((resolve) => {
    let settled = false;
    let lastTime = -1;
    let stallTicks = 0;
    let ticker = null;
    let labelObserver = null;
    const readRate = () => {
      try {
        const raw = typeof opts.getRate === "function" ? opts.getRate() : opts.rate;
        const num = Number(raw);
        return Number.isFinite(num) && num > 0 ? num : 1;
      } catch (e) {
        return 1;
      }
    };
    let currentRate = readRate();
    const syncSpeedLabel = () => {
      try {
        const label = document.querySelector("xt-speedvalue");
        if (!label) return;
        const want = `${currentRate.toFixed(2)}X`;
        if ((label.textContent || "").trim() !== want) label.textContent = want;
      } catch (e) {}
    };
    const finish = (reason) => {
      if (settled) return;
      settled = true;
      if (ticker) ticker.stop();
      if (labelObserver) {
        try { labelObserver.disconnect(); } catch (e) {}
        labelObserver = null;
      }
      try { media.onended = null; media.onpause = null; } catch (e) {}
      resolve(reason);
    };
    forceMediaRate(media, currentRate);
    try { media.loop = false; } catch (e) {}
    const muteMedia = () => {
      forceMediaMute(media);
    };
    muteMedia();
    const verifyRate = () => {
      try {
        const actual = Number(media.playbackRate) || 1;
        const ok = Math.abs(actual - currentRate) < 0.05;
        useLogStore().addLog(
          ok ? `倍速校验通过：实际 ${actual}x` : `倍速校验失败：期望 ${currentRate}x，实际 ${actual}x`,
          ok ? "success" : "warning",
        );
      } catch (e) {}
    };
    try { setTimeout(() => { if (!settled) verifyRate(); }, 1500); } catch (e) {}
    try {
      const label = document.querySelector("xt-speedvalue");
      if (label) {
        labelObserver = new MutationObserver(() => syncSpeedLabel());
        labelObserver.observe(label, { childList: true, characterData: true, subtree: true });
      }
    } catch (e) {}
    syncSpeedLabel();
    try { if (!media.currentTime || media.currentTime < 1) media.currentTime = 1; } catch (e) {}
    media.onended = () => finish("ended");
    media.onpause = () => {
      if (!media.ended && !settled) setTimeout(() => { try { media.play(); } catch (e) {} }, 800);
    };
    const tick = () => {
      try {
        if (!media.isConnected) return finish("switched");
        if (yktMediaFinished(media)) return finish("ended");
        const nextRate = readRate();
        if (Math.abs(nextRate - currentRate) > 0.05) {
          currentRate = nextRate;
          try { useLogStore().addLog(`倍速已更新：${currentRate}x`, "info"); } catch (e) {}
        }
        forceMediaRate(media, currentRate);
        muteMedia();
        syncSpeedLabel();
        if (media.paused && !media.ended) media.play().catch(() => {});
        if (media.currentTime !== lastTime) {
          lastTime = media.currentTime;
          stallTicks = 0;
        } else {
          stallTicks++;
        }
        if (stallTicks > 60) return finish("stalled");
      } catch (e) {}
    };
    ticker = afkIntervalHandle(tick, 1000);
    try {
      useLogStore().addLog(`正在尝试播放${opts.title || "video"}，请稍等5s`, "primary");
    } catch (e) {}
    Promise.resolve(media.play())
      .then(() => {
        try {
          useLogStore().addLog(`video播放成功，倍速: ${Number(media.playbackRate) || 1}x`, "primary");
        } catch (e) {}
      })
      .catch(() => {});
  });

  const yktWaitFor = async (getter, timeoutSeconds = 20, periodMs = 500) => {
    const deadline = Date.now() + timeoutSeconds * 1000;
    while (Date.now() < deadline) {
      const value = getter();
      if (value) return value;
      await afkWait(periodMs);
    }
    return null;
  };

  const yktPostComment = async (forum, logStore) => {
    const statusText = (forum.querySelector(YKT_SEL.forumStatus)?.textContent || "").trim();
    if (statusText.includes("已发言")) {
      logStore.addLog("当前讨论已发言，跳过评论", "success");
      return "skipped";
    }
    const input = await yktWaitFor(() => forum.querySelector(YKT_SEL.forumInput), 20, 500);
    if (!input) throw new Error("讨论区输入框加载超时");

    const samples = Array.from(forum.querySelectorAll(YKT_SEL.forumComment))
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean);
    if (!samples.length) throw new Error("讨论区暂无他人发言可参考，已跳过");

    input.value = samples[Math.floor(Math.random() * samples.length)];
    input.dispatchEvent(new Event("input", { bubbles: true }));

    const sendBtn = await yktWaitFor(() => forum.querySelector(YKT_SEL.forumSend), 10, 500);
    if (!sendBtn) throw new Error("发送按钮未解除禁用，评论未提交");
    sendBtn.click();
    await delay(1.5);
    logStore.addLog("讨论评论已提交", "success");
    return "posted";
  };

  const useYktPptRead = async (logStore) => {
    let switched = 0;
    for (let guard = 0; guard < 500; guard++) {
      const pending = Array.from(document.querySelectorAll(YKT_SEL.pptSlide)).filter((el) => el.querySelector(YKT_SEL.pptUnread));
      if (!pending.length) break;
      pending[0].click();
      switched++;
      await delay(1.2);
    }
    logStore.addLog(`课件阅读完成，共切换 ${switched} 页`, "success");
    return switched;
  };

  const useYktCourseLogic = async () => {
    const logStore = useLogStore();
    const autoPlay = readYktParam("视频设置", "自动播放", true);
    const restudy = readYktParam("模式设置", "复习模式", false);
    const autoComment = readYktParam("任务设置", "自动评论", false);
    const autoSwitch = readYktParam("任务设置", "自动切换", true);
    const readYktMaxRate = () => {
      try {
        const listEl = document.querySelector("xt-speedlist");
        const text = listEl ? listEl.textContent || "" : "";
        const rates = (text.match(/(\d+(?:\.\d+)?)\s*X/gi) || []).map((s) => parseFloat(s));
        if (rates.length) return Math.max(...rates);
      } catch (e) {}
      return 2;
    };
    const computeEffectiveRate = () => {
      const autoRate = readYktParam("视频设置", "自动倍速", false);
      const breakRate = readYktParam("视频设置", "突破倍速", false);
      const userRate = Number(readYktParam("视频设置", "播放倍速", 1.5)) || 1;
      const menuMax = readYktMaxRate();
      if (autoRate) return menuMax;
      if (breakRate) return Math.min(8, Math.max(1, userRate));
      return Math.min(menuMax, Math.max(1, userRate));
    };
    const studyTags = autoComment ? ["视频", "讨论"] : ["视频"];
    if (restudy) {
      logStore.addLog("复习模式：已完成的任务点也会重新学习", "primary");
    }

    if (location.pathname.includes("/v2/web/student-lesson-report")) {
      logStore.addLog("课堂互动任务不支持自动学习，请切换到视频、课件等任务", "warning");
      return;
    }

    logStore.addLog("检测到用户进入到雨课堂页面", "primary");
    logStore.addLog("正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）", "warning");
    let ready = false;
    for (let i = 0; i < 40; i++) {
      if (document.querySelector(YKT_SEL.detail) || document.querySelector(YKT_SEL.pptSlide)) {
        ready = true;
        break;
      }
      await delay(0.5);
    }
    if (!ready) {
      logStore.addLog("未检测到任务内容，请手动点击左侧章节后重试", "warning");
      return;
    }
    logStore.addLog("等待页面加载完成，开始扫描任务点", "info");
    await delay(1.5);
    await yktExpandTree();

    const pickNext = () => {
      const list = yktJobs();
      const activeIndex = list.findIndex((el) => el.classList.contains("is-active"));
      const from = activeIndex < 0 ? 0 : activeIndex + 1;
      for (let i = from; i < list.length; i++) {
        const el = list[i];
        if (!studyTags.includes(yktJobTag(el))) continue;
        if (!restudy && yktJobDone(el)) continue;
        return el;
      }
      return null;
    };

    for (let guard = 0; guard < 200; guard++) {
      const forum = document.querySelector(YKT_SEL.forum);
      if (forum && autoComment) {
        logStore.addLog("发现任务点：讨论，开始自动评论", "primary");
        try {
          await yktPostComment(forum, logStore);
        } catch (e) {
          logStore.addLog(`自动评论失败：${e.message}`, "warning");
        }
      } else if (document.querySelector(YKT_SEL.pptSlide)) {
        logStore.addLog("发现任务点：课件，开始自动阅读", "primary");
        await useYktPptRead(logStore);
      } else {
        const media = document.querySelector(YKT_SEL.media);
        if (!media) {
          logStore.addLog("当前任务点不是视频，跳过", "warning");
        } else if (!autoPlay) {
          logStore.addLog("自动播放已关闭，跳过视频任务", "warning");
        } else {
          const active = yktJobs().find((el) => el.classList.contains("is-active"));
          logStore.addLog(`发现任务点：${active ? yktJobTitle(active) : "当前视频"}（视频），开始学习`, "primary");
          const initialRate = computeEffectiveRate();
          if (readYktParam("视频设置", "自动倍速", false)) {
            logStore.addLog(`自动倍速：使用播放器最大倍速 ${initialRate}x`, "info");
          } else if (readYktParam("视频设置", "突破倍速", false)) {
            logStore.addLog(`突破倍速：强制 ${initialRate}x（上限 8x）`, "info");
          } else if (readYktParam("视频设置", "手动倍速", false)) {
            logStore.addLog(`手动倍速：${initialRate}x（最大 ${readYktMaxRate()}x）`, "info");
          }
          const reason = await yktPlayMedia(media, { getRate: computeEffectiveRate, title: (() => { try { const act = yktJobs().find((el) => el.classList.contains("is-active")); return act ? yktJobTitle(act) : ""; } catch (e) { return ""; } })() });
          logStore.addLog(
            reason === "ended" ? "任务点已完成：视频播放完毕" : reason === "stalled" ? "任务点超时，跳过" : "任务点切换，继续下一节",
            reason === "stalled" ? "warning" : "success",
          );
        }
      }

      const next = pickNext();
      if (!next) {
        const rest = yktJobs().filter((el) => !yktJobDone(el));
        if (rest.length) {
          const brief = rest.slice(0, 3).map((el) => `${yktJobTag(el) || "其他"}·${yktJobTitle(el)}`).join("、");
          logStore.addLog(
            `视频任务已处理完，剩余 ${rest.length} 个非视频任务需手动完成：${brief}${rest.length > 3 ? " 等" : ""}`,
            "warning",
          );
        } else {
          logStore.addLog("本页任务点已全部完成", "success");
        }
        break;
      }
      if (!autoSwitch) {
        logStore.addLog(`自动切换已关闭，请手动切换任务：${yktJobTitle(next)}`, "warning");
        break;
      }
      next.scrollIntoView({ block: "center" });
      next.click();
      logStore.addLog(`切换到下一节：${yktJobTitle(next)}`, "primary");
      await afkWait(3000);
    }
  };

  const PP_PAGE_READY_SELECTORS = [
    ".chapter-content .chapter-item",
    ".clearfix.video",
    "#vjs_container_html5_api",
    ".detail-container",
    ".leaf-item",
    ".prev_title",
    ".questionLi",
    ".TiMu"
  ];
  const ppPageContentReady = () => {
    try {
      return PP_PAGE_READY_SELECTORS.some((sel) => !!document.querySelector(sel));
    } catch (e) {
      return false;
    }
  };

  const ppMuteOnce = (media) => {
    if (!media || media.__ppMutedOnce) return;
    media.__ppMutedOnce = true;
    try { media.muted = true; } catch (e) {}
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
      logStore.addLog("请不要多个脚本同时使用；如果脚本出现异常，请使用谷歌浏览器", "warning");




      const urlLogicPairs = [
        { keyword: "/v2/web/studentLog", logic: useYktCourseLogic },
        { keyword: "/v2/web/student-lesson-report", logic: useYktCourseLogic },
        { keyword: "/ai-workspace/lms-graph", logic: useYktCourseLogic },
        { keyword: "/m/v2/course/normalcourse/logs", logic: useYktCourseLogic },
        { keyword: "/pro/lms", logic: useYktCourseLogic },
        { keyword: "/v2/web/studentcards", logic: useYktCourseLogic },
        { keyword: "/v2/web/studentcard/", logic: useYktCourseLogic },
        { keyword: "studyvideoh5.zhihuishu.com", logic: useZhClassroomStudy },
        { keyword: "studyplush5.zhihuishu.com", logic: useZhClassroomStudy },
        { keyword: "studywisdomh5.zhihuishu.com", logic: useZhClassroomStudy },
        { keyword: "wisdom-mooc.zhihuishu.com", logic: useZhClassroomStudy },
        { keyword: "ai-smart-course-student-pro.zhihuishu.com", logic: useZhClassroomStudy },
        { keyword: "smartcoursestudent.zhihuishu.com", logic: useZhClassroomStudy },
        { keyword: "fusioncourseh5.zhihuishu.com", logic: useZhClassroomStudy },
        { keyword: "hike.zhihuishu.com", logic: useZhClassroomStudy },
        { keyword: "wenda.zhihuishu.com", logic: useZhClassroomStudy },
        { keyword: "hike-teaching-center.polymas.com", logic: useZhClassroomStudy },
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
            const modeLabel = getCxModeLabel();
            if (modeLabel) logStore.addLog(modeLabel, "info");
            startAfkHeartbeat();
            const _ppRunLogic = () => {
              logic();
            };
            const _ppWaitStart = Date.now();
            if (document.readyState === "complete" && ppPageContentReady()) {
              _ppRunLogic();
            } else {
              logStore.addLog("⏳ 正在加载脚本功能...", "primary");
              const _ppWaitComplete = setInterval(() => {
                if (document.readyState === "complete" && ppPageContentReady()) {
                  clearInterval(_ppWaitComplete);
                  logStore.addLog("✅ 加载完成", "success");
                  _ppRunLogic();
                  return;
                }
                if (Date.now() - _ppWaitStart > 20000) {
                  clearInterval(_ppWaitComplete);
                  logStore.addLog("⚠️ 页面内容加载超时，先继续执行", "warning");
                  _ppRunLogic();
                }
              }, 200);
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
          label: "主页",
          full: "主页信息",
          id: "main-log",
          icon: "home",
          component: ScriptHome,
          props: { "log-list": logStore.logList, "server-config": CURRENT_SERVER_CONFIG }
        },
        {
          label: "记录",
          full: "答题记录",
          id: "question-record",
          icon: "list",
          component: QuestionTable,
          props: {
            "question-list": questionStore.questionList,
            "on-go-settings": () => switchTab("config-panel")
          }
        },
        {
          label: "配置",
          full: "脚本配置",
          id: "config-panel",
          icon: "sliders",
          component: ScriptSetting,
          props: { "global-config": configStore }
        },
        {
          label: "AI问答",
          full: "AI 问答",
          id: "ai-chat",
          icon: "ai",
          iconNode: () => aiChatIcon("ai", 17),
          component: AiChatPanel,
          props: {}
        },
        {
          label: "说明",
          full: "脚本说明",
          id: "script-description",
          icon: "book",
          component: ScriptDescription,
          props: {}
        },
        {
          label: "作者",
          full: "作者的话",
          id: "author-words",
          icon: "heart",
          component: AuthorWords,
          props: {}
        },
        {
          label: "查询",
          full: "使用查询",
          id: "token-usage",
          icon: "search",
          component: TokenUsagePanel,
          props: { active: () => activeTab.value === "token-usage" }
        },
        {
          label: "反馈",
          full: "意见反馈",
          id: "feedback-panel",
          icon: "message",
          component: FeedbackPanel,
          props: {}
        }
      ];
      const activeTab = vue.ref("main-log");
      const ppfxPaneShift = vue.ref("6px");
      const ppfxRailRef = vue.ref(null);
      let ppfxInkRO = null;
      const switchTab = (tabId) => {
        const ppfxFrom = tabs.findIndex((tab) => tab.id === activeTab.value);
        const ppfxTo = tabs.findIndex((tab) => tab.id === tabId);
        if (ppfxFrom >= 0 && ppfxTo >= 0 && ppfxFrom !== ppfxTo) {
          ppfxPaneShift.value = ppfxTo > ppfxFrom ? "7px" : "-7px";
        }
        activeTab.value = tabId;
      };
      const ppfxSyncInk = () => {
        const rail = ppfxRailRef.value;
        if (!rail) return;
        const ink = rail.querySelector(".pp-rail-ink");
        if (!ink) return;
        const item = rail.querySelector(".pp-rail-item.active");
        if (!item || !item.offsetHeight) {
          ink.classList.remove("ppfx-live");
          return;
        }
        const ppfxInset = 14;
        ink.style.height = Math.max(6, item.offsetHeight - ppfxInset * 2) + "px";
        ink.style.transform = "translateY(" + (item.offsetTop + ppfxInset) + "px)";
        if (!ink.classList.contains("ppfx-live")) {
          ink.classList.add("ppfx-live");
          ink.getBoundingClientRect();
          ink.classList.add("ppfx-slide");
        }
      };
      vue.watch(activeTab, ppfxSyncInk, { flush: "post" });
      vue.onMounted(() => {
        vue.nextTick(ppfxSyncInk);
        window.addEventListener("resize", ppfxSyncInk);
        if (typeof ResizeObserver === "function" && ppfxRailRef.value) {
          ppfxInkRO = new ResizeObserver(ppfxSyncInk);
          ppfxInkRO.observe(ppfxRailRef.value);
        }
      });
      vue.onUnmounted(() => {
        window.removeEventListener("resize", ppfxSyncInk);
        if (ppfxInkRO) {
          ppfxInkRO.disconnect();
          ppfxInkRO = null;
        }
      });
      return () => vue.h("div", { class: "pp-shell" }, [
        vue.h("nav", { class: "pp-rail", ref: ppfxRailRef }, [
          vue.h("div", { class: "pp-rail-ink", "aria-hidden": "true" }),
          ...tabs.map((tab) => {
            const warn = tab.id === "config-panel" && !configStore.tokenVerified;
            return vue.h("button", {
              type: "button",
              key: tab.id,
              class: ["pp-rail-item", activeTab.value === tab.id ? "active" : "", warn ? "pp-warn" : ""],
              title: tab.full,
              onClick: () => switchTab(tab.id)
            }, [
              typeof tab.iconNode === "function" ? tab.iconNode() : ppIcon(tab.icon, 17),
              vue.h("span", null, tab.label)
            ]);
          }),
          vue.h("div", { class: "pp-rail-spacer" })
        ]),
        vue.h("div", { class: "pp-main", style: { "--ppfx-pane-shift": ppfxPaneShift.value } }, tabs.map((tab) => vue.withDirectives(
          vue.h("div", { class: "config-panel", key: tab.id }, [
            vue.h(tab.component, tab.props || {})
          ]),
          [[vue.vShow, activeTab.value === tab.id]]
        )))
      ]);
    }
  });
  const _sfc_main$1 = vue.defineComponent({
    name: "Layout",
    setup() {
      const isShow = vue.ref(false);
      const configStore = useConfigStore();
      const progressStore = useProgressStore();
      const { autoMode } = pinia.storeToRefs(configStore);
      const viewport = vue.ref({ w: window.innerWidth, h: window.innerHeight });
      const isDragging = vue.ref(false);

      const SIZE = { floatW: 388, floatH: 520, orb: 52, dockW: 360, handleW: 44, handleH: 120, margin: 8, minTop: 56 };
      const RING = 2 * Math.PI * 23;
      const HANDLE_RING = 2 * Math.PI * 10;

      let saveTimer = null;
      const saveConfig = () => {
        if (saveTimer) clearTimeout(saveTimer);
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
      let ppfxConfigWatchStop = null;
      const ppfxResumeConfigWatch = () => {
        if (ppfxConfigWatchStop) {
          ppfxConfigWatchStop();
          ppfxConfigWatchStop = null;
        }
        ppfxConfigWatchStop = vue.watch(configStore, saveConfig, { deep: true });
      };
      const ppfxPauseConfigWatch = () => {
        if (!ppfxConfigWatchStop) return;
        ppfxConfigWatchStop();
        ppfxConfigWatchStop = null;
      };
      ppfxResumeConfigWatch();

      const dockMode = vue.computed({
        get: () => !!configStore.dockMode,
        set: (value) => { configStore.dockMode = value; }
      });
      const platformLabel = vue.computed(() => {
        const key = configStore.platformName;
        return key === "cx" ? "学习通" : key === "zhs" ? "智慧树" : key === "ykt" ? "雨课堂" : "通用";
      });
      const ensureMinTop = (value) => {
        const num = parseInt(value, 10);
        return (isNaN(num) || num < SIZE.minTop) ? SIZE.minTop + "px" : value;
      };

      const uiScale = vue.computed(() => {
        const value = Number(configStore.uiScale);
        return [100, 125, 150].includes(value) ? value : 100;
      });
      const scaleFactor = vue.computed(() => uiScale.value / 100);
      const scaledPosition = (value) => {
        const num = parseFloat(value);
        return ((Number.isFinite(num) ? num : 0) / scaleFactor.value) + "px";
      };

      const panelStyle = vue.computed(() => {
        const scale = scaleFactor.value;
        const transition = undefined;
        if (dockMode.value) {
          if (configStore.isMinus) {
            return {
              left: Math.max(0, viewport.value.w / scale - SIZE.handleW) + "px",
              top: Math.max(0, (viewport.value.h / scale - SIZE.handleH) / 2) + "px",
              width: SIZE.handleW + "px",
              height: SIZE.handleH + "px",
              zoom: scale,
              transition
            };
          }
          return {
            left: Math.max(0, viewport.value.w / scale - SIZE.dockW) + "px",
            top: "0px",
            width: SIZE.dockW + "px",
            height: (viewport.value.h / scale) + "px",
            maxWidth: (viewport.value.w / scale) + "px",
            zoom: scale,
            transition
          };
        }
        const position = configStore.position || { x: "50px", y: "50px" };
        if (configStore.isMinus) {
          return {
            left: scaledPosition(position.x),
            top: scaledPosition(ensureMinTop(position.y)),
            width: SIZE.orb + "px",
            height: SIZE.orb + "px",
            zoom: scale,
            transition
          };
        }
        return {
          left: scaledPosition(position.x),
          top: scaledPosition(ensureMinTop(position.y)),
          width: SIZE.floatW + "px",
          height: SIZE.floatH + "px",
          maxWidth: ((viewport.value.w - SIZE.margin * 2) / scale) + "px",
          maxHeight: ((viewport.value.h - SIZE.minTop - SIZE.margin) / scale) + "px",
          zoom: scale,
          transition
        };
      });

      const getMainPage = () => {
        const host = document.getElementById("chaoxing-helper-root");
        const root = host && host.shadowRoot ? host.shadowRoot : document;
        return root.querySelector(".main-page");
      };

      let clampTimer = null;
      const clampFloat = (delay = 260) => {
        if (dockMode.value) return;
        if (clampTimer) clearTimeout(clampTimer);
        clampTimer = setTimeout(() => {
          clampTimer = null;
          if (dockMode.value) return;
          const root = getMainPage();
          if (!root) return;
          const rect = root.getBoundingClientRect();
          const current = configStore.position || {};
          let x = parseFloat(current.x);
          let y = parseFloat(current.y);
          if (isNaN(x)) x = rect.left;
          if (isNaN(y)) y = rect.top;
          const maxX = Math.max(SIZE.margin, viewport.value.w - rect.width - SIZE.margin);
          const maxY = Math.max(SIZE.minTop, viewport.value.h - rect.height - SIZE.margin);
          configStore.position.x = Math.min(Math.max(SIZE.margin, x), maxX) + "px";
          configStore.position.y = Math.min(Math.max(SIZE.minTop, y), maxY) + "px";
        }, delay);
      };

      const MORPH = { out: 90, box: 180, in: 60, orbDelay: 100, orb: 180, tail: 40 };
      const morphPhase = vue.ref("idle");
      let morphTimer = null;
      const morphStop = () => {
        if (morphTimer) {
          clearTimeout(morphTimer);
          morphTimer = null;
        }
      };
      const morphLater = (delay, run) => {
        morphStop();
        morphTimer = setTimeout(() => {
          morphTimer = null;
          run();
        }, delay);
      };
      const morphIdle = () => {
        morphStop();
        morphPhase.value = "idle";
      };
      const morphMs = (value) => {
        try {
          if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
        } catch (error) {}
        return value;
      };
      const morphClass = vue.computed(() => morphPhase.value === "idle" ? "" : "ppfx-" + morphPhase.value);
      const clampFloatBox = (width, height) => {
        const x = parseFloat(configStore.position?.x);
        const y = parseFloat(configStore.position?.y);
        configStore.position.x = Math.min(Math.max(SIZE.margin, isNaN(x) ? SIZE.margin : x), Math.max(SIZE.margin, viewport.value.w - width - SIZE.margin)) + "px";
        configStore.position.y = Math.min(Math.max(SIZE.minTop, isNaN(y) ? SIZE.minTop : y), Math.max(SIZE.minTop, viewport.value.h - height - SIZE.margin)) + "px";
      };
      const beginCollapse = () => {
        morphStop();
        morphPhase.value = "closing";
        morphLater(morphMs(MORPH.out), () => {
          if (morphPhase.value !== "closing") return;
          morphPhase.value = "settling";
          configStore.isMinus = true;
          if (!dockMode.value) clampFloat();
          morphLater(morphMs(MORPH.orbDelay + MORPH.orb + MORPH.tail), () => {
            if (morphPhase.value === "settling") morphPhase.value = "idle";
          });
        });
      };
      const beginExpand = () => {
        morphStop();
        if (clampTimer) {
          clearTimeout(clampTimer);
          clampTimer = null;
        }
        if (!dockMode.value) clampFloatBox(SIZE.floatW, SIZE.floatH);
        morphPhase.value = "opening";
        configStore.isMinus = false;
        morphLater(morphMs(MORPH.in + MORPH.box + MORPH.tail), () => {
          if (morphPhase.value === "opening") morphPhase.value = "idle";
        });
      };

      const setMinimized = (value) => {
        const next = !!value;
        if (next) {
          if (configStore.isMinus || morphPhase.value === "closing") return;
          beginCollapse();
          return;
        }
        if (configStore.isMinus) {
          beginExpand();
          return;
        }
        if (morphPhase.value === "closing") morphIdle();
      };
      const expand = () => setMinimized(false);
      const collapse = () => setMinimized(true);
      const toggleMinus = () => setMinimized(!(configStore.isMinus || morphPhase.value === "closing"));

      const toggleDock = () => {
        morphStop();
        if (clampTimer) {
          clearTimeout(clampTimer);
          clampTimer = null;
        }
        const next = !dockMode.value;
        const wasMinus = configStore.isMinus;
        if (!next) clampFloatBox(SIZE.floatW, SIZE.floatH);
        configStore.dockMode = next;
        configStore.isMinus = false;
        morphPhase.value = wasMinus ? "opening" : (next ? "docking" : "undocking");
        morphLater(morphMs(MORPH.box + MORPH.tail), () => {
          const phase = morphPhase.value;
          if (phase === "opening" || phase === "docking" || phase === "undocking") morphPhase.value = "idle";
        });
        saveConfigImmediate();
      };

      const COACH = { width: 224, height: 56, gap: 12, margin: 10 };
      const COACH_DURATION = 3000;
      const COACH_STORE_KEYS = {
        orb: "pp_coach_last_shown_orb",
        dock: "pp_coach_last_shown_dock"
      };
      const coachVisible = vue.ref(false);
      const coachStyle = vue.ref({});
      const coachSide = vue.ref("right");
      const coachTitle = vue.computed(() => dockMode.value ? "脚本停靠在右侧" : "脚本在这里");
      const coachText = vue.computed(() => dockMode.value ? "点击胶囊展开面板" : "点击悬浮球展开网课小助手");
      let coachTimer = null;
      let coachShowTimer = null;
      let coachMoveTimer = null;
      const coachModeState = {
        orb: { shown: false },
        dock: { shown: false }
      };

      const coachDateKey = () => {
        const now = new Date();
        return now.getFullYear() + "-" +
          String(now.getMonth() + 1).padStart(2, "0") + "-" +
          String(now.getDate()).padStart(2, "0");
      };
      const coachSeenToday = (mode) => {
        try {
          if (typeof _GM_getValue !== "function") return false;
          return _GM_getValue(COACH_STORE_KEYS[mode], "") === coachDateKey();
        } catch (error) {
          return false;
        }
      };
      const markCoachSeen = (mode) => {
        try {
          if (typeof _GM_setValue !== "function") return;
          _GM_setValue(COACH_STORE_KEYS[mode], coachDateKey());
        } catch (error) {
        }
      };

      const clearCoachTimers = () => {
        if (coachTimer) {
          clearTimeout(coachTimer);
          coachTimer = null;
        }
        if (coachShowTimer) {
          clearTimeout(coachShowTimer);
          coachShowTimer = null;
        }
        if (coachMoveTimer) {
          clearTimeout(coachMoveTimer);
          coachMoveTimer = null;
        }
      };
      const hideCoach = () => {
        coachVisible.value = false;
        clearCoachTimers();
      };
      const placeCoach = () => {
        const root = getMainPage();
        if (!root) return;
        const rect = root.getBoundingClientRect();
        const { width, height, gap, margin } = COACH;
        const spaceRight = viewport.value.w - rect.right;
        const spaceLeft = rect.left;
        let side = "right";
        let left = rect.right + gap;
        if (spaceRight < width + gap && spaceLeft >= width + gap) {
          side = "left";
          left = rect.left - width - gap;
        } else if (spaceRight < width + gap && spaceLeft < width + gap) {
          side = "bottom";
          left = Math.min(Math.max(margin, rect.left), Math.max(margin, viewport.value.w - width - margin));
        }
        let top = rect.top + rect.height / 2 - height / 2;
        top = Math.min(Math.max(margin, top), Math.max(margin, viewport.value.h - height - margin));
        coachSide.value = side;
        coachStyle.value = { left: Math.round(left) + "px", top: Math.round(top) + "px" };
      };
      const schedulePlaceCoach = (delay) => {
        if (coachMoveTimer) clearTimeout(coachMoveTimer);
        coachMoveTimer = setTimeout(() => {
          coachMoveTimer = null;
          placeCoach();
        }, delay || 280);
      };
      const showCoach = () => {
        const mode = dockMode.value ? "dock" : "orb";
        if (coachModeState[mode].shown || coachShowTimer || !isShow.value || !configStore.isMinus) return;
        if (coachSeenToday(mode)) {
          coachModeState[mode].shown = true;
          return;
        }
        coachShowTimer = setTimeout(() => {
          coachShowTimer = null;
          if (!isShow.value || !configStore.isMinus) return;
          if ((dockMode.value ? "dock" : "orb") !== mode) {
            showCoach();
            return;
          }
          coachModeState[mode].shown = true;
          markCoachSeen(mode);
          placeCoach();
          coachVisible.value = true;
          coachTimer = setTimeout(hideCoach, COACH_DURATION);
        }, 200);
      };
      vue.watch(isShow, (value) => {
        if (value) showCoach();
        else hideCoach();
      }, { immediate: true });
      vue.watch([() => configStore.isMinus, () => dockMode.value], ([minus], [prevMinus]) => {
        if (!minus) {
          hideCoach();
          return;
        }
        if (!prevMinus) {
          showCoach();
          return;
        }
        if (coachVisible.value) schedulePlaceCoach(280);
      });

      let dragRoot = null;
      let offsetX = 0;
      let offsetY = 0;
      let startX = 0;
      let startY = 0;
      let moved = false;
      let rafId = 0;
      let pendingPos = null;
      let ppfxDragW = 0;
      let ppfxDragH = 0;

      const flushPosition = () => {
        rafId = 0;
        if (!pendingPos) return;
        configStore.position.x = pendingPos.x + "px";
        configStore.position.y = pendingPos.y + "px";
        pendingPos = null;
      };
      const onDrag = (event) => {
        if (!isDragging.value || !dragRoot || dockMode.value) return;
        event.preventDefault();
        if (Math.abs(event.clientX - startX) > 3 || Math.abs(event.clientY - startY) > 3) moved = true;
        const x = Math.min(Math.max(SIZE.margin, event.clientX - offsetX), viewport.value.w - ppfxDragW - SIZE.margin);
        const y = Math.min(Math.max(SIZE.minTop, event.clientY - offsetY), viewport.value.h - ppfxDragH - SIZE.margin);
        dragRoot.style.left = (x / scaleFactor.value) + "px";
        dragRoot.style.top = (y / scaleFactor.value) + "px";
        pendingPos = { x, y };
        if (!rafId) rafId = requestAnimationFrame(flushPosition);
      };
      const endDrag = () => {
        if (!isDragging.value) return;
        isDragging.value = false;
        document.removeEventListener("pointermove", onDrag);
        document.removeEventListener("pointerup", endDrag);
        document.removeEventListener("pointercancel", endDrag);
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        flushPosition();
        const wasMinimized = configStore.isMinus;
        dragRoot = null;
        if (!moved && wasMinimized) expand();
        ppfxResumeConfigWatch();
        saveConfigImmediate();
      };
      const startDrag = (event) => {
        if (dockMode.value) return;
        if (event.button !== undefined && event.button !== 0) return;
        if (event.target && event.target.closest && event.target.closest(".pp-no-drag")) return;
        if (morphPhase.value === "closing") morphIdle();
        hideCoach();
        const root = getMainPage();
        if (!root) return;
        const rect = root.getBoundingClientRect();
        dragRoot = root;
        ppfxDragW = rect.width;
        ppfxDragH = rect.height;
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
        startX = event.clientX;
        startY = event.clientY;
        moved = false;
        isDragging.value = true;
        ppfxPauseConfigWatch();
        document.addEventListener("pointermove", onDrag, { passive: false });
        document.addEventListener("pointerup", endDrag);
        document.addEventListener("pointercancel", endDrag);
      };

      let hoverTimer = null;
      const handleEnter = () => {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        if (autoMode.value && (configStore.isMinus || morphPhase.value === "closing") && !isDragging.value) expand();
      };
      const handleLeave = () => {
        if (!autoMode.value || configStore.isMinus || isDragging.value || coachVisible.value) return;
        const host = document.getElementById("chaoxing-helper-root");
        const active = host && host.shadowRoot ? host.shadowRoot.activeElement : null;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        hoverTimer = setTimeout(() => {
          hoverTimer = null;
          collapse();
        }, 2500);
      };

      let resizeTimer = null;
      let ppfxResizeRaf = 0;
      const ppfxApplyViewport = () => {
        ppfxResizeRaf = 0;
        viewport.value = { w: window.innerWidth, h: window.innerHeight };
        if (coachVisible.value) schedulePlaceCoach(80);
      };
      const handleResize = () => {
        if (!ppfxResizeRaf) ppfxResizeRaf = requestAnimationFrame(ppfxApplyViewport);
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resizeTimer = null;
          if (!dockMode.value) clampFloat();
        }, 180);
      };
      const handleKeydown = (event) => {
        if (event.key !== "Escape" || configStore.isMinus) return;
        const tag = event.target && event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        collapse();
      };
      const handleWindowBlur = () => {
        if (isDragging.value) endDrag();
      };
      vue.onMounted(() => {
        window.addEventListener("resize", handleResize);
        window.addEventListener("keydown", handleKeydown);
        window.addEventListener("blur", handleWindowBlur);
        setTimeout(checkScriptUpdate, 800);
        if (!dockMode.value) clampFloat();
      });
      vue.onUnmounted(() => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("keydown", handleKeydown);
        window.removeEventListener("blur", handleWindowBlur);
        document.removeEventListener("pointermove", onDrag);
        document.removeEventListener("pointerup", endDrag);
        document.removeEventListener("pointercancel", endDrag);
        if (hoverTimer) clearTimeout(hoverTimer);
        if (resizeTimer) clearTimeout(resizeTimer);
        if (clampTimer) {
          clearTimeout(clampTimer);
          clampTimer = null;
        }
        if (ppfxResizeRaf) cancelAnimationFrame(ppfxResizeRaf);
        if (ppfxConfigWatchStop) {
          ppfxConfigWatchStop();
          ppfxConfigWatchStop = null;
        }
        clearCoachTimers();
        morphStop();
      });

      const renderHeader = () => {
        const Switch = vue.resolveComponent("el-switch");
        return vue.h("header", {
          class: "pp-head",
          onPointerdown: startDrag
        }, [
          vue.h("div", { class: "pp-brand" }, [
            vue.h(PpLogo, { size: 30 }),
            vue.h("div", { class: "pp-titles" }, [
              vue.h("div", { class: "pp-title" }, "网课小助手"),
              vue.h("div", { class: "pp-sub" }, [
                vue.h("b", null, platformLabel.value),
                vue.h("i", null, "/"),
                vue.h("span", null, "v" + configStore.version),
                PP_UPDATE_STATE.available ? vue.h("button", {
                  type: "button",
                  class: "pp-update-badge",
                  title: "发现新版本 v" + PP_UPDATE_STATE.latestVersion + "，点击更新",
                  onPointerdown: (event) => event.stopPropagation(),
                  onClick: (event) => {
                    event.stopPropagation();
                    window.open(PP_UPDATE_STATE.updateUrl, "_blank", "noopener,noreferrer");
                  }
                }, "有新版本") : null
              ])
            ])
          ]),
          vue.h("div", {
            class: "pp-head-right pp-no-drag",
            onPointerdown: (event) => event.stopPropagation()
          }, [
            vue.h("span", {
              class: ["pp-live", progressStore.isPlaying ? "on" : ""],
              title: progressStore.isPlaying ? "脚本正在运行" : "等待任务"
            }, [
              vue.h("span", { class: ["pp-dot", progressStore.isPlaying ? "on" : ""] }),
              progressStore.isPlaying ? "运行中" : "待机"
            ]),
            ppIconBtn({
              icon: "sidebar",
              tip: dockMode.value ? "取消贴边停靠" : "贴边停靠",
              active: dockMode.value,
              onClick: toggleDock
            }),
            vue.h("span", { class: "pp-auto", title: "自动最小化" }, [
              vue.h(Switch, {
                modelValue: autoMode.value,
                size: "small",
                "onUpdate:modelValue": (value) => { autoMode.value = value; }
              })
            ]),
            ppIconBtn({
              icon: dockMode.value ? "chevronRight" : "chevronDown",
              tip: "收起",
              onClick: toggleMinus
            })
          ])
        ]);
      };

      const renderOrb = () => {
        const percent = Math.min(100, Math.max(0, Number(progressStore.percent) || 0));
        return vue.h("div", {
          class: ["pp-orb", coachVisible.value ? "pp-attention" : ""],
          title: "展开网课小助手",
          role: "button",
          tabindex: 0,
          "aria-label": "展开网课小助手",
          onPointerdown: startDrag,
          onKeydown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              expand();
            }
          }
        }, [
          vue.h("svg", { class: "pp-orb-ring", viewBox: "0 0 52 52" }, [
            vue.h("circle", { class: "bg", cx: 26, cy: 26, r: 23 }),
            vue.h("circle", {
              class: "fg",
              cx: 26,
              cy: 26,
              r: 23,
              style: {
                strokeDasharray: RING.toFixed(1),
                strokeDashoffset: (RING * (1 - percent / 100)).toFixed(1)
              }
            })
          ]),
          vue.h(PpLogo, { size: 28 }),
          vue.h("span", { class: ["pp-orb-dot", progressStore.isPlaying ? "on" : ""] })
        ]);
      };

      const renderHandle = () => {
        const percent = Math.min(100, Math.max(0, Number(progressStore.percent) || 0));
        return vue.h("div", {
          class: ["pp-handle", coachVisible.value ? "pp-attention" : ""],
          title: "展开网课小助手",
          role: "button",
          tabindex: 0,
          "aria-label": "展开网课小助手",
          onClick: expand,
          onKeydown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              expand();
            }
          }
        }, [
          vue.h("span", { class: "pp-handle-logo" }, vue.h(PpLogo, { size: 26 })),
          vue.h("svg", { class: "pp-handle-ring", viewBox: "0 0 24 24" }, [
            vue.h("circle", { class: "bg", cx: 12, cy: 12, r: 10 }),
            vue.h("circle", {
              class: "fg",
              cx: 12,
              cy: 12,
              r: 10,
              style: {
                strokeDasharray: HANDLE_RING.toFixed(1),
                strokeDashoffset: (HANDLE_RING * (1 - percent / 100)).toFixed(1)
              }
            })
          ]),
          vue.h("span", { class: ["pp-handle-dot", progressStore.isPlaying ? "on" : ""] }),
          vue.h("span", { class: "pp-handle-divider" }),
          vue.h("span", { class: "pp-handle-caret" }, ppIcon("chevronLeft", 12))
        ]);
      };

      const renderCoach = () => {
        if (!coachVisible.value || !isShow.value) return null;
        return vue.h("div", {
          class: ["pp-coach", "side-" + coachSide.value],
          style: coachStyle.value,
          role: "status",
          "aria-live": "polite"
        }, [
          vue.h(PpLogo, { size: 24 }),
          vue.h("div", { class: "pp-coach-body" }, [
            vue.h("b", null, coachTitle.value),
            vue.h("span", null, coachText.value)
          ]),
          vue.h("button", {
            type: "button",
            class: "pp-coach-close",
            title: "关闭提示",
            "aria-label": "关闭提示",
            onClick: hideCoach
          }, "×")
        ]);
      };

      return (_ctx, _cache) => [
        vue.withDirectives(vue.h("div", {
          class: [
            "main-page",
            dockMode.value ? "pp-dock" : "",
            configStore.isMinus ? (dockMode.value ? "pp-handle-mode" : "pp-min") : "",
            isDragging.value ? "pp-dragging" : "",
            morphClass.value,
            morphPhase.value !== "idle" ? "ppfx-morphing" : ""
          ],
          style: panelStyle.value,
          onMouseenter: handleEnter,
          onMouseleave: handleLeave
        }, [
          vue.withDirectives(renderHeader(), [[vue.vShow, !configStore.isMinus]]),
          vue.withDirectives(vue.h("div", { class: "pp-body" }, [
            vue.h(_sfc_main$3, {
              onCustomEvent: (value) => { isShow.value = value; }
            })
          ]), [[vue.vShow, !configStore.isMinus]]),
          configStore.isMinus ? (dockMode.value ? renderHandle() : renderOrb()) : null
        ]), [[vue.vShow, isShow.value]]),
        renderCoach()
      ];
    }
  });
  const _sfc_main =  vue.defineComponent({
    __name: "App",
    setup(__props) {
      const configStore = useConfigStore();
      const url2 = window.location.href;
      if (url2.includes("chaoxing") || url2.includes("xuexitong") || url2.includes("xueyin"))
        configStore.platformName = "cx";
      else if (url2.includes("zhihuishu") || url2.includes("polymas"))
        configStore.platformName = "zhs";
      else if (url2.includes("yuketang") || url2.includes("gdufemooc"))
        configStore.platformName = "ykt";
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
  const _ppShadowRoots = new WeakMap();
  const hookAttachShadow = () => {
    try {
      const proto = _unsafeWindow.Element && _unsafeWindow.Element.prototype;
      if (!proto || proto.__ppShadowHooked) return;
      const origin = proto.attachShadow;
      proto.attachShadow = function(init) {
        const root = origin.apply(this, [init]);
        try {
          _ppShadowRoots.set(this, root);
          this.__ppShadowRoot = root;
        } catch (e) {}
        return root;
      };
      proto.__ppShadowHooked = true;
    } catch (e) {}
  };
  const readRecordedShadow = (scopeEl) => {
    if (!scopeEl) return null;
    try {
      const list = [scopeEl, ...scopeEl.querySelectorAll("*")];
      for (const el of list) {
        const root = _ppShadowRoots.get(el);
        if (root) return root;
      }
    } catch (e) {}
    return null;
  };
  const ZHS_BRIDGE_SOURCE = `(function () {
    if (window.__ppZhsBridge) return;
    window.__ppZhsBridge = true;

    try {
      var originCall = Function.prototype.call;
      Function.prototype.call = function () {
        var args = arguments;
        var result = originCall.apply(this, args);
        try {
          var mod = args[0];
          var exp = args[1];
          if (mod && mod.a && mod.a.version === "2.5.0" && exp && exp.exports && exp.exports.a &&
              typeof exp.exports.a.install === "function" && !exp.exports.a.__ppWrapped) {
            var install = exp.exports.a.install;
            exp.exports.a.install = function () {
              var a = arguments;
              try {
                a[0].mixin({
                  mounted: function () {
                    try { this.$el.__Ivue__ = this; } catch (e) {}
                  }
                });
              } catch (e) {}
              return install.apply(this, a);
            };
            exp.exports.a.__ppWrapped = true;
          }
        } catch (e) {}
        return result;
      };
    } catch (e) {}

    var roots = (window.__ppShadowRoots = []);
    var wrapAttach = function (holder) {
      try {
        if (!holder || typeof holder.AttachShadow !== "function" || holder.__ppWrapped) return holder;
        var orig = holder.AttachShadow;
        holder.AttachShadow = function (init) {
          var root = orig.apply(this, arguments);
          try {
            roots.push({ host: this, root: root });
            this.__ppShadowRoot = root;
          } catch (e) {}
          return root;
        };
        holder.__ppWrapped = true;
      } catch (e) {}
      return holder;
    };
    try {
      var cur = window.originFunction;
      cur = wrapAttach(cur);
      Object.defineProperty(window, "originFunction", {
        configurable: true,
        get: function () { return cur; },
        set: function (v) { cur = wrapAttach(v); }
      });
    } catch (e) {}
    try { wrapAttach(window.originFunction); } catch (e) {}
    try {
      var proto = Element.prototype;
      var protoAttach = proto.attachShadow;
      proto.attachShadow = function () {
        var root = protoAttach.apply(this, arguments);
        try { roots.push({ host: this, root: root }); this.__ppShadowRoot = root; } catch (e) {}
        return root;
      };
    } catch (e) {}

    setInterval(function () {
      try {
        var qs = document.querySelectorAll(".examPaper_subject");
        for (var i = 0; i < qs.length; i++) {
          var q = qs[i];
          var scope = q.querySelector(".subject_describe") || q.querySelector(".smallStem_describe");
          var sd = null;
          if (scope) {
            var all = [scope].concat([].slice.call(scope.querySelectorAll("*")));
            for (var j = 0; j < all.length; j++) {
              var el = all[j];
              if (el.__ppShadowRoot) { sd = el.__ppShadowRoot; break; }
              var vm = el.__Ivue__;
              var vmSd = vm && vm._data && vm._data.shadowDom;
              if (vmSd && vmSd.innerHTML) { sd = vmSd; break; }
            }
          }
          if (!sd || !sd.innerHTML) continue;
          var html = sd.innerHTML;
          if (q.getAttribute("data-pp-stem") !== html) q.setAttribute("data-pp-stem", html);
        }
      } catch (e) {}
    }, 400);
  })();`;
  const installZhsPageBridge = () => {
    try {
      if (document.documentElement.hasAttribute("data-pp-zhs-bridge")) return;
      document.documentElement.setAttribute("data-pp-zhs-bridge", "1");
      const script = document.createElement("script");
      script.textContent = ZHS_BRIDGE_SOURCE;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    } catch (e) {}
  };
  const hookOriginFunction = () => {
    try {
      const win = _unsafeWindow;
      let current = win.originFunction;
      const wrap = (holder) => {
        try {
          if (!holder || typeof holder.AttachShadow !== "function" || holder.__ppAttachWrapped) return holder;
          const origin = holder.AttachShadow;
          holder.AttachShadow = function(init) {
            const root = origin.apply(this, [init]);
            try {
              _ppShadowRoots.set(this, root);
              this.__ppShadowRoot = root;
            } catch (e) {}
            return root;
          };
          holder.__ppAttachWrapped = true;
        } catch (e) {}
        return holder;
      };
      current = wrap(current);
      try {
        Object.defineProperty(win, "originFunction", {
          configurable: true,
          enumerable: true,
          get() { return current; },
          set(value) { current = wrap(value); }
        });
      } catch (e) {}
    } catch (e) {}
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
    ppfxGuardTrustTimers();
    hookAttachShadow();
    hookOriginFunction();
    installZhsPageBridge();
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


      (() => {
        const PPFX_MEDIA_MISS_SLOW = 6;
        const PPFX_MEDIA_MISS_IDLE = 12;
        const PPFX_MEDIA_DEEP_SLOW_MS = 2000;
        const PPFX_MEDIA_DEEP_IDLE_MS = 5000;
        let ppfxMediaDeepAllowed = true;
        let ppfxMediaMissCount = 0;
        let ppfxMediaNextDeepAt = 0;
        let ppfxMediaHref = "";
        const collectMedia = (doc, out, depth) => {
          if (!doc || depth > 2) return;
          let found = 0;
          try {
            doc.querySelectorAll("video,audio").forEach((el) => {
              out.push(el);
              found += 1;
            });
          } catch (error) {}
          try {
            doc.querySelectorAll("iframe").forEach((frame) => {
              try {
                if (frame.contentDocument) collectMedia(frame.contentDocument, out, depth + 1);
              } catch (error) {}
            });
          } catch (error) {}
          if (!found && ppfxMediaDeepAllowed) {
            try {
              doc.querySelectorAll("*").forEach((el) => {
                if (el.shadowRoot) collectMedia(el.shadowRoot, out, depth + 1);
              });
            } catch (error) {}
          }
        };
        const pickMedia = () => {
          const now = Date.now();
          const href = String(location.href || "");
          if (href !== ppfxMediaHref) {
            ppfxMediaHref = href;
            ppfxMediaMissCount = 0;
            ppfxMediaNextDeepAt = 0;
          }
          let probe = null;
          try { probe = document.querySelector("video,audio"); } catch (error) {}
          if (probe) {
            ppfxMediaMissCount = 0;
            ppfxMediaNextDeepAt = 0;
          }
          ppfxMediaDeepAllowed = now >= ppfxMediaNextDeepAt;
          const list = [];
          collectMedia(document, list, 0);
          ppfxMediaDeepAllowed = true;
          let best = null;
          let bestScore = -1;
          for (const media of list) {
            const duration = Number(media.duration);
            if (!Number.isFinite(duration) || duration <= 0) continue;
            const current = Number(media.currentTime) || 0;
            const paused = !!media.paused;
            if (paused && !media.ended && current <= 0) continue;
            const rect = media.getBoundingClientRect ? media.getBoundingClientRect() : null;
            const visible = media.tagName === "AUDIO" || (rect && rect.width > 0 && rect.height > 0);
            if (!visible) continue;
            let score = (paused ? 0 : 1000000) + (media.ended ? 500 : 0) + (current > 0 ? 1000 : 0);
            if (rect) score += Math.min(10000, (rect.width * rect.height) / 100);
            if (score > bestScore) {
              best = media;
              bestScore = score;
            }
          }
          if (best) {
            ppfxMediaMissCount = 0;
            ppfxMediaNextDeepAt = 0;
          } else {
            ppfxMediaMissCount = Math.min(PPFX_MEDIA_MISS_IDLE, ppfxMediaMissCount + 1);
            const delay = ppfxMediaMissCount >= PPFX_MEDIA_MISS_IDLE ? PPFX_MEDIA_DEEP_IDLE_MS
              : ppfxMediaMissCount >= PPFX_MEDIA_MISS_SLOW ? PPFX_MEDIA_DEEP_SLOW_MS : 0;
            ppfxMediaNextDeepAt = delay ? now + delay : 0;
          }
          return best;
        };
        const formatMediaTime = (seconds) => {
          const total = Math.max(0, Math.floor(Number(seconds) || 0));
          return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
        };
        const store = (() => {
          try {
            return useProgressStore(pinia$1);
          } catch (error) {
            return pinia$1._s.get("progressStore");
          }
        })();
        if (!store) return;
        let lastKey = "";
        let pausedTicks = 0;
        const tick = () => {
          try {
            if (store.type === "答题" && store.isPlaying) return;
            const media = pickMedia();
            if (!media) return;
            const duration = Number(media.duration);
            if (!Number.isFinite(duration) || duration <= 0) return;
            const current = Math.min(duration, Math.max(0, Number(media.currentTime) || 0));
            const ended = !!media.ended || current >= duration - 0.35;
            const paused = !!media.paused;
            if (paused && !ended && store.isPlaying) {
              pausedTicks += 1;
              if (pausedTicks < 2) return;
            } else {
              pausedTicks = 0;
            }
            const percent = ended ? 100 : Math.min(100, Math.round((current / duration) * 100));
            const keepTask = (store.type === "视频" || store.type === "音频") &&
              store.taskName && store.taskName !== "暂无任务" && store.taskName !== "等待任务开始";
            const pageTitle = String(document.title || "").split(/[—–\-_|]/)[0].trim().slice(0, 40);
            const taskName = keepTask ? store.taskName : (pageTitle || "视频播放");
            const detail = ended ? "播放完成" : (paused ? "已暂停" : formatMediaTime(current) + "/" + formatMediaTime(duration));
            const key = taskName + "|" + duration + "|" + current + "|" + paused + "|" + percent;
            if (key === lastKey) return;
            lastKey = key;
            store.update({
              taskName: taskName,
              type: media.tagName === "AUDIO" ? "音频" : "视频",
              percent: percent,
              currentTime: current,
              totalTime: duration,
              detail: detail,
              isPlaying: !paused && !ended && Number(media.readyState) >= 2
            });
          } catch (error) {}
        };
        tick();
        if (window.__PP_MEDIA_SYNC_TIMER__) clearInterval(window.__PP_MEDIA_SYNC_TIMER__);
        window.__PP_MEDIA_SYNC_TIMER__ = window.setInterval(tick, 500);
      })();
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