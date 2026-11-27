// ==UserScript==
// @name         |🥇PP网课小助手|飘飘|
// @namespace    飘飘
// @license      MIT
// @version      4.5.3
// @author       PIAOPIAO
// @description  🎓网课自动答题/视频助手｜超星学习通·知到智慧树·雨课堂｜视频自动播放倍速+章节任务+作业考试全题型自动答题｜免费题库+Claude/ChatGPT/Gemini/DeepSeek等7款AI双重校验｜手机平板可用｜免费开源持续更新
// @icon         https://cdn.jsdmirror.com/gh/piaopiaosir/pp-course-assistant@main/newicon.png
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
// @match        *://*.polymas.com/*
// @match        *://*.yuketang.cn/*
// @match        *://*.gdufemooc.cn/*
// @match        *://*.txootd.cn/*
// @require      https://lib.baomitu.com/vue/3.5.0/vue.global.prod.js
// @require      https://lib.baomitu.com/vue-demi/0.14.7/index.iife.js
// @require      data:application/javascript,window.Vue%3DVue%3B
// @require      https://lib.baomitu.com/element-plus/2.8.2/index.full.min.js
// @require      https://lib.baomitu.com/pinia/2.3.1/pinia.iife.min.js
// @require      https://lib.baomitu.com/rxjs/7.8.2/rxjs.umd.min.js
// @require      https://lib.baomitu.com/blueimp-md5/2.19.0/js/md5.min.js
// @resource     ElementPlusStyle  https://lib.baomitu.com/element-plus/2.8.2/index.min.css
// @resource     fontDecryptLib    https://cdn.jsdmirror.com/gh/piaopiaosir/pp-font-decrypt@v1.2.0/font-decrypt.js
// @resource     fontDecryptLibGh  https://gh-proxy.com/https://raw.githubusercontent.com/piaopiaosir/pp-font-decrypt/v1.2.0/font-decrypt.js
// @connect      *
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_getTab
// @grant        GM_saveTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// @tag          超星学习通
// @tag          知到智慧树
// @tag          雨课堂
// @tag          网课自动答题
// @tag          免费题库
// @tag          全题型支持
// @tag          AI多模型
// ==/UserScript==

const _PP_SERVER_URLS = [
  "http://122.152.249.109:3000",
  "http://152.136.30.238:3000"
];

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

.main-page ::-webkit-scrollbar{width:3px;height:3px;}
.main-page ::-webkit-scrollbar-track{background:transparent;}
.main-page ::-webkit-scrollbar-thumb{background:#d3dbe7;border-radius:99px;}
.main-page ::-webkit-scrollbar-thumb:hover{background:#b9c4d4;}
@supports (-moz-appearance:none){.main-page *{scrollbar-width:thin;scrollbar-color:#d3dbe7 transparent;}}

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
.pp-update-badge{flex:none;display:inline-flex;align-items:center;gap:3px;height:16px;padding:0 6px 0 5px;border:1px solid #dbe8ff;border-radius:99px;background:#eef4ff;color:#2563eb;font-size:8px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,box-shadow .15s;animation:ppUpdBadgeIn .32s cubic-bezier(.22,.8,.32,1) both;}
.pp-update-badge::before{content:"";width:4px;height:4px;border-radius:50%;background:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12);animation:ppUpdBadgePulse 1.8s ease-in-out infinite;}
.pp-update-badge:hover{background:#e4eeff;border-color:#c9dcff;box-shadow:0 2px 6px -2px rgba(37,99,235,.25);}
@keyframes ppUpdBadgePulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);}}
@keyframes ppUpdBadgeIn{0%{opacity:0;transform:translateY(-2px) scale(.72);}55%{opacity:1;transform:translateY(0) scale(1.08);}100%{opacity:1;transform:translateY(0) scale(1);}}
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
.pp-rail{position:relative;flex:0 0 56px;width:56px;background:var(--pp-surface);border-right:1px solid var(--pp-line);display:flex;flex-direction:column;gap:2px;padding:7px 5px;overflow-x:hidden;overflow-y:auto;}
.pp-rail-item{position:relative;flex:none;height:50px;border:0;border-radius:10px;background:transparent;color:#8592a6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:10px;font-weight:500;letter-spacing:.02em;cursor:pointer;padding:0;transition:background .15s,color .15s,box-shadow .15s;}
.pp-rail-item:hover{background:#edf1f7;color:#3c4a60;}
.pp-rail-item.active{background:#fff;color:var(--pp-brand);box-shadow:0 1px 2px rgba(16,24,40,.06),0 0 0 1px var(--pp-line);}
.pp-rail-ink{position:absolute;left:0;top:0;z-index:1;width:3px;height:0;border-radius:0 3px 3px 0;background:var(--pp-brand);opacity:0;pointer-events:none;transform:translateY(0);}
.pp-rail-ink.ppfx-live{opacity:1;}
.pp-rail-ink.ppfx-slide{transition:transform var(--ppfx-t-base) var(--ppfx-ease),height var(--ppfx-t-base) var(--ppfx-ease),opacity var(--ppfx-t-fast) linear;}
.pp-rail-item.pp-warn::after{content:"";position:absolute;top:7px;right:7px;width:6px;height:6px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 2px var(--pp-surface);}
.pp-rail-item svg{flex:none;}
.pp-rail-spacer{flex:1;min-height:4px;}
.pp-rail .pp-rail-more{height:26px;min-height:26px;margin-top:2px;padding:0;border-radius:8px;color:#a7b2c2;}
.pp-rail-more .pp-rail-more-arrow{display:flex;transition:transform .2s var(--ppfx-ease-soft);}
.pp-rail-more[aria-expanded=true] .pp-rail-more-arrow{transform:rotate(180deg);}
.pp-rail-more-items{display:flex;flex-direction:column;gap:2px;max-height:0;opacity:0;visibility:hidden;overflow:hidden;transition:max-height .26s var(--ppfx-ease),opacity .18s linear,visibility 0s linear .26s;}
.pp-rail-more-items.is-open{max-height:216px;opacity:1;visibility:visible;transition:max-height .26s var(--ppfx-ease),opacity .18s linear,visibility 0s;}
.pp-rail-more-items .pp-rail-item{opacity:0;transform:translateY(-6px);transition:transform .24s var(--ppfx-ease),opacity .2s linear;}
.pp-rail-more-items.is-open .pp-rail-item{opacity:1;transform:none;}
.pp-rail-more-items.is-open .pp-rail-item:nth-child(2){transition-delay:50ms;}
.pp-rail-more-items.is-open .pp-rail-item:nth-child(3){transition-delay:100ms;}
.pp-rail-more-items.is-open .pp-rail-item:nth-child(4){transition-delay:150ms;}
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
.pp-cost-badge{flex:none;font-size:8px;line-height:1.5;padding:0 4px;border-radius:4px;background:#eef2f7;color:#64748b;font-weight:600;white-space:nowrap;}
.pp-cost-badge.is-low{background:#ecfdf3;color:#067647;}
.pp-cost-badge.is-mid{background:#eff6ff;color:#1d4ed8;}
.pp-cost-badge.is-high{background:#fff7ed;color:#b45309;}
.pp-cost-badge.is-ultra{background:#fef2f2;color:#b42318;}
.pp-cfg-model-option{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;}
.pp-cfg-model-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
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
.pp-legend-dot.is-skipped{background:#94a3b8;border-color:#94a3b8;}
.pp-legend-dot.is-error{background:#fff7ed;border-color:#f59e0b;}
.pp-q-circles{flex:none;display:flex;flex-wrap:wrap;gap:5px;padding:2px 0 4px;}
.pp-q-circle{position:relative;width:21px;height:21px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:700;font-variant-numeric:tabular-nums;border:1px solid transparent;transition:background-color .2s var(--ppfx-ease-soft),color .2s var(--ppfx-ease-soft),border-color .2s var(--ppfx-ease-soft);}
.pp-q-circle.is-bank{background:#3b82f6;color:#fff;border-color:#3b82f6;}
.pp-q-circle.is-ai{background:#22c55e;color:#fff;border-color:#22c55e;}
.pp-q-circle.is-verify{background:#8b5cf6;color:#fff;border-color:#8b5cf6;}
.pp-q-circle.is-cache{background:#06b6d4;color:#fff;border-color:#06b6d4;}
.pp-q-circle.is-skipped{background:#94a3b8;color:#fff;border-color:#94a3b8;}
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
.pp-tag.is-skipped{background:#f1f5f9;border-color:#e2e8f0;color:#64748b;}
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
.pp-ai-source{display:flex;align-items:baseline;gap:5px;min-width:0;padding:3px 4px;border-radius:5px;color:#334155;text-decoration:none;}
a.pp-ai-source:hover{background:#f4f8ff;color:var(--pp-brand);}
.pp-ai-source-title{flex:1;min-width:0;font-size:9.5px;font-weight:600;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-source-host{flex:none;max-width:42%;font-size:8.5px;color:var(--pp-text-4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-search{margin:0 0 6px;padding:5px 7px;border:1px solid var(--pp-line-soft);border-radius:8px;background:#fff;font-size:9px;color:var(--pp-text-3);min-width:0;max-width:100%;overflow:hidden;box-sizing:border-box;}
.pp-ai-search.is-searching{background:#f8fbff;border-color:#dbeafe;}
.pp-ai-search-row{display:flex;align-items:center;gap:4px;min-height:18px;min-width:0;width:100%;}
.pp-ai-search summary{display:flex;align-items:center;gap:4px;min-height:18px;min-width:0;width:100%;padding:0;cursor:pointer;list-style:none;user-select:none;}
.pp-ai-search summary::-webkit-details-marker{display:none;}
.pp-ai-search-ico{flex:none;display:flex;align-items:center;color:var(--pp-brand);}
.pp-ai-search-title{flex:none;font-weight:600;color:var(--pp-text-2);}
.pp-ai-search-query{flex:1 1 0;min-width:0;font-weight:400;color:var(--pp-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-search-status{flex:none;color:var(--pp-text-4);white-space:nowrap;}
.pp-ai-search-chev{flex:none;color:#a8b3c4;transition:transform .15s;}
.pp-ai-search[open] .pp-ai-search-chev{transform:rotate(180deg);}
.pp-ai-search-list{display:flex;flex-direction:column;gap:1px;max-height:110px;overflow-y:auto;margin-top:3px;padding-top:3px;border-top:1px dashed var(--pp-line);}
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
.pp-ai-model-menu{position:absolute;left:0;bottom:calc(100% + 4px);z-index:12;width:220px;max-height:236px;overflow-y:auto;padding:3px;border:1px solid var(--pp-line);border-radius:8px;background:#fff;box-shadow:0 12px 28px -10px rgba(15,23,42,.28);transform-origin:bottom center;animation:ppfxMenuUp .16s var(--ppfx-ease) both;}
.pp-ai-model-group + .pp-ai-model-group{margin-top:2px;padding-top:2px;border-top:1px solid var(--pp-line-soft);}
.pp-ai-model-group-title{padding:4px 6px 3px;border-radius:4px;background:var(--pp-surface);font-size:9px;font-weight:700;letter-spacing:.03em;color:var(--pp-text-3);}
.pp-ai-model-option{width:100%;height:27px;display:flex;align-items:center;gap:5px;padding:0 6px 0 12px;border:0;border-radius:5px;background:transparent;color:var(--pp-text-2);font-size:10.5px;text-align:left;cursor:pointer;}
.pp-ai-model-option:hover{background:var(--pp-surface);}
.pp-ai-model-option.active{background:var(--pp-brand-weak);color:var(--pp-brand);font-weight:600;}
.pp-ai-model-option span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-ai-model-option .pp-cost-badge{flex:none;max-width:none;overflow:visible;text-overflow:clip;}
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
.pp-legal{display:flex;flex-direction:column;gap:5px;margin:0;padding:0;list-style:none;}
.pp-legal li{position:relative;padding-left:11px;font-size:10.5px;line-height:1.65;color:#475569;}
.pp-legal li::before{content:"";position:absolute;left:0;top:6px;width:4px;height:4px;border-radius:50%;background:var(--pp-brand);opacity:.55;}
.pp-legal b{color:var(--pp-text);font-weight:600;}
.pp-about{display:flex;flex-direction:column;gap:8px;}
.pp-about .pp-doc{margin-bottom:0;}
.pp-about-head{display:flex;align-items:center;gap:9px;padding:10px 11px;border:1px solid var(--pp-line);border-radius:12px;background:var(--pp-surface-2);}
.pp-about-meta{min-width:0;display:flex;flex-direction:column;gap:1px;}
.pp-about-meta b{font-size:12px;font-weight:600;color:var(--pp-text);}
.pp-about-meta span{font-size:9.5px;color:var(--pp-text-3);}
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

const LAYOUT_CSS_GLOBAL = `
.high-z-index-select{z-index:200000 !important;min-width:200px !important;}
.high-z-index-select .el-select-dropdown__item{height:28px;line-height:28px;padding:0 8px;font-size:11px;}
.high-z-index-select .pp-cfg-model-option{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;}
.high-z-index-select .pp-cfg-model-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.high-z-index-select .pp-cost-badge{flex:none;display:inline-flex;align-items:center;font-size:8px;line-height:1.5;padding:0 4px;border-radius:4px;background:#eef2f7;color:#64748b;font-weight:600;white-space:nowrap;}
.high-z-index-select .pp-cost-badge.is-low{background:#ecfdf3;color:#067647;}
.high-z-index-select .pp-cost-badge.is-mid{background:#eff6ff;color:#1d4ed8;}
.high-z-index-select .pp-cost-badge.is-high{background:#fff7ed;color:#b45309;}
.high-z-index-select .pp-cost-badge.is-ultra{background:#fef2f2;color:#b42318;}
`;

const ppAddStartupStyle = (css) => {
  if (!css) return;
  const add = () => {
    const parent = document.head || document.documentElement;
    if (!parent) return;
    if (typeof GM_addStyle === "function") {
      try {
        GM_addStyle(css);
        return;
      } catch (e) {}
    }
    const style = document.createElement("style");
    style.textContent = css;
    parent.appendChild(style);
  };
  if (document.head || document.documentElement) add();
  else document.addEventListener("DOMContentLoaded", add, { once: true });
};
ppAddStartupStyle(LAYOUT_CSS_GLOBAL);

(function (vue, pinia, rxjs, md5, ElementPlus) {

  'use strict';

  const ppShopModalPurge = (() => {
    const HOST_RE = /(^|\.)txootd\.cn$/i;
    const TARGET_SELECTORS = [
      "#sa-mask",
      "#sa-box",
      "#shop-left-btns",
      '[id*="shop-left-btn"]',
      '[class*="shop-left-btn"]',
      ".html-popup-modal"
    ];
    const AGREEMENT_RE = /购\s*卡\s*协\s*议/;
    let installed = false;

    const drop = (node) => {
      try {
        if (node && node.parentNode) node.parentNode.removeChild(node);
      } catch (e) {}
    };

    const sweep = () => {
      TARGET_SELECTORS.forEach((sel) => {
        try { document.querySelectorAll(sel).forEach(drop); } catch (e) {}
      });
      try {
        if (document.body) {
          document.body.style.removeProperty("overflow");
          document.body.style.removeProperty("padding-right");
          document.documentElement.style.removeProperty("overflow");
        }
      } catch (e) {}
    };

    const install = () => {
      if (installed) return;
      installed = true;
      sweep();
      try {
        const observer = new MutationObserver((records) => {
          for (let i = 0; i < records.length; i += 1) {
            const added = records[i].addedNodes;
            for (let j = 0; j < added.length; j += 1) {
              const node = added[j];
              if (!node || node.nodeType !== 1) continue;
              try {
                const nodeId = node.id || "";
                if (nodeId === "sa-mask" || nodeId === "sa-box" || nodeId === "shop-left-btns" || (node.textContent && AGREEMENT_RE.test(node.textContent))) {
                  sweep();
                  return;
                }
              } catch (e) {}
            }
          }
        });
        observer.observe(document.documentElement || document, { childList: true, subtree: true });
      } catch (e) {}
      try {
        const timer = setInterval(sweep, 300);
        setTimeout(() => clearInterval(timer), 10000);
      } catch (e) {}
    };

    return {
      hit: () => {
        try { return HOST_RE.test(location.hostname); } catch (e) { return false; }
      },
      install
    };
  })();

  if (ppShopModalPurge.hit()) {
    ppShopModalPurge.install();
    return;
  }

  const PP_KEY = {
    ANSWER: "答题参数",
    MODE: "模式设置",
    VIDEO: "视频设置",
    SKIP_ANSWERED: "跳过已答",
    AI_MODE: "AI模式",
    AI_TYPE: "AI 类型选择",
    AI_MODEL: "AI 模型选择",
    WEB_SEARCH: "联网搜索",
    NORMAL_MODE: "正常模式",
    VERIFY: "答案校验",
    VERIFY_MODE: "答案校验模式",
    SIMULATE: "模拟播放",
    NORMAL_PLAY: "正常播放",
    RATE: "播放倍速",
    AUTO_RATE: "自动倍速",
    MANUAL_RATE: "手动倍速",
    BREAK_RATE: "突破倍速",
    RHYTHM: "节奏抖动",
    AUTO_NEXT: "自动切换",
    REVIEW: "复习模式",
    CHAPTER: "章节/作业/测验设置",
    ZHS_CHAPTER: "章节设置",
    YKT_CHAPTER: "章节/习题设置",
    EXAM: "考试设置",
    EXAM_PREVIEW: "跳转整页答题",
    ANSWER_GAP: "答题间隔",
    SIM_DELAY: "模拟延迟",
    SIMILAR: "相似匹配",
    THRESHOLD: "填涂阈值",
    STANDBY: "激活挂机",
    DIRECT_REPORT: "直接上报",
    MISC: "其他设置",
    ANSWER_SETTINGS: "答题设置",
    TASK_SETTINGS: "任务设置",
    AUTO_COMMENT: "自动讨论评论",
    GENERAL: "通用设置",
    ONLY_VIDEO: "仅视频",
    ONLY_ANSWER: "仅答题",
    AUTO_SUBMIT: "自动提交",
    UNLIMITED_READ: "无限阅读"
  };

  const PP_HIKE_STUDY_ORIGIN = "https://hike-teaching-center.polymas.com";
  const PP_HIKE_BRIDGE = "pp-hike-preview-v1";
  const PP_HIKE_MAX_RATE = 1.5;
  const PP_HIKE_LEASE_MS = 15e3;

  const ppHikePreviewUrl = (href, base) => {
    try {
      const url = new URL(href, base);
      const fileId = url.searchParams.get("fileId");
      if (url.protocol !== "https:" || url.port || url.username || url.password ||
          !/(^|\.)polymas\.com$/.test(url.hostname) ||
          !/^\/resource\/online\/preview\/?$/.test(url.pathname) ||
          !fileId || url.searchParams.getAll("fileId").length !== 1) return null;
      return { origin: url.origin, fileId };
    } catch (e) {
      return null;
    }
  };

  const ppInstallHikePreview = () => {
    const preview = ppHikePreviewUrl(location.href);
    if (!preview || window.parent !== window.top || window.parent === window) return false;
    if (document.referrer && !document.referrer.startsWith(PP_HIKE_STUDY_ORIGIN + "/")) return false;
    let playback = null;
    let leaseTimer;
    const send = (session, event, media) => {
      window.parent.postMessage({
        channel: PP_HIKE_BRIDGE, session, fileId: preview.fileId, event,
        duration: Number.isFinite(media.duration) ? media.duration : 0,
        currentTime: Number.isFinite(media.currentTime) ? media.currentTime : 0
      }, PP_HIKE_STUDY_ORIGIN);
    };
    const release = (pause) => {
      clearTimeout(leaseTimer);
      const previous = playback;
      playback = null;
      if (!previous) return;
      const { media, originalMute, originalRate, onEnded, onPause, onRateChange } = previous;
      media.removeEventListener("ended", onEnded);
      media.removeEventListener("pause", onPause);
      media.removeEventListener("ratechange", onRateChange);
      if (pause) media.pause();
      if (media.muted) media.muted = originalMute;
      if (media.playbackRate === previous.rate && originalRate <= PP_HIKE_MAX_RATE) media.playbackRate = originalRate;
    };
    const renew = () => {
      clearTimeout(leaseTimer);
      leaseTimer = setTimeout(() => release(true), PP_HIKE_LEASE_MS);
    };
    window.addEventListener("pagehide", () => release(true));
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent || event.origin !== PP_HIKE_STUDY_ORIGIN) return;
      const message = event.data;
      if (!message || message.channel !== PP_HIKE_BRIDGE || message.fileId !== preview.fileId ||
          typeof message.session !== "string" || !/^[a-f0-9]{32}$/.test(message.session) ||
          ppHikePreviewUrl(location.href)?.fileId !== preview.fileId) return;
      const { session, command } = message;
      if (command === "stop" || command === "keep") {
        if (playback?.session !== session) return;
        if (command === "stop") release(true);
        else renew();
        return;
      }
      const media = document.querySelector("video, audio");
      if (!media || !Number.isFinite(media.duration) || media.duration <= 0) return;
      if (command === "probe") {
        send(session, "ready", media);
        return;
      }
      if (command !== "start" || typeof message.replay !== "boolean" ||
          (message.rate !== null && (!Number.isFinite(message.rate) || message.rate < 1))) return;
      if (playback?.session === session) return;
      release(true);
      const rate = Math.min(message.rate ?? (media.playbackRate || 1), PP_HIKE_MAX_RATE);
      const notify = (status) => {
        if (playback?.session !== session) return;
        release(false);
        send(session, status, media);
      };
      let corrections = 0;
      const applyRate = () => {
        if (media.playbackRate === rate) return;
        if (corrections++ < 8) media.playbackRate = rate;
        else if (media.playbackRate > PP_HIKE_MAX_RATE) {
          release(true);
          send(session, "blocked", media);
        }
      };
      playback = {
        session, media, rate, originalMute: media.muted, originalRate: media.playbackRate,
        onEnded: () => notify("ended"),
        onPause: () => { if (!media.ended) notify("paused"); },
        onRateChange: applyRate
      };
      try {
        if (message.replay) media.currentTime = 0;
        if (media.ended) {
          notify("ended");
          return;
        }
        media.addEventListener("ended", playback.onEnded);
        media.addEventListener("pause", playback.onPause);
        media.addEventListener("ratechange", playback.onRateChange);
        if (media.paused) media.muted = true;
        applyRate();
        renew();
        Promise.resolve(media.play()).catch(() => notify("blocked"));
      } catch (e) {
        notify("blocked");
      }
    });
    return true;
  };

  if (window.self !== window.top) {
    const currentHref = window.location.href;
    if (ppInstallHikePreview() || !currentHref.includes("answerQuestion2")) return;
  }

  var _GM_getResourceText = typeof GM_getResourceText === "function" ? GM_getResourceText : undefined;
  var _GM_getValue = typeof GM_getValue === "function" ? GM_getValue : (_, fallback) => fallback;
  var _GM_info = (() => typeof GM_info != "undefined" ? GM_info : void 0)();
  var _GM_setValue = typeof GM_setValue === "function" ? GM_setValue : () => {};
  var _GM_xmlhttpRequest = typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : undefined;
  var _unsafeWindow = (typeof unsafeWindow !== "undefined" && unsafeWindow) || window;

  const PP_REMOTE_SCRIPTS_STAMP_KEY = "pp_remote_scripts_stamp";
  const PP_REMOTE_SCRIPTS_WINDOW_MS = 60 * 60 * 1000;
  const PP_REMOTE_SYNC_STAMP_KEY = "pp_remote_sync_stamp";

  const ppReadSyncOptions = (data) => {
    const sync = data && data.sync;
    if (!sync || typeof sync !== "object") return null;
    const positive = (value) => {
      const num = Number(value);
      return Number.isFinite(num) && num > 0 ? num : 0;
    };
    const gap = (value) => {
      if (!Array.isArray(value) || value.length < 2) return null;
      const low = positive(value[0]);
      const high = positive(value[1]);
      return low > 0 && high > 0 ? [low, high] : null;
    };
    const options = {
      ttlMs: positive(sync.ttlMs),
      timeoutMs: positive(sync.timeoutMs),
      handshakeTimeoutMs: positive(sync.handshakeTimeoutMs),
      reportTimeoutMs: positive(sync.reportTimeoutMs),
      visitGapMs: gap(sync.visitGapMs),
      patchGapMs: gap(sync.patchGapMs),
    };
    const complete =
      options.ttlMs > 0 &&
      options.timeoutMs > 0 &&
      options.handshakeTimeoutMs > 0 &&
      options.reportTimeoutMs > 0 &&
      options.visitGapMs &&
      options.patchGapMs;
    return complete ? options : null;
  };
  let ppRemoteScriptsRequestedInPreload = false;
  let ppRemoteScriptsServer = "";

  const ppWait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const ppJitter = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  const ppCrossRequest = (request) => new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const fail = () => finish({ ok: false, status: 0, text: "", headers: "" });
    if (!_GM_xmlhttpRequest) return fail();
    try {
      _GM_xmlhttpRequest({
        method: request.method || "GET",
        url: request.url,
        data: request.data,
        headers: request.headers,
        anonymous: true,
        timeout: request.timeout,
        onload: (res) => finish({
          ok: true,
          status: Number(res && res.status) || 0,
          text: String((res && res.responseText) || ""),
          headers: String((res && res.responseHeaders) || "")
        }),
        onerror: fail,
        ontimeout: fail
      });
    } catch (e) {
      fail();
    }
  });

  const ppReadSyncStamp = () => {
    try {
      const raw = String(_GM_getValue(PP_REMOTE_SYNC_STAMP_KEY, "{}") || "{}");
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  };
  const ppSyncedRecently = (key, ttlMs) => {
    if (!key) return true;
    const last = Number(ppReadSyncStamp()[key]) || 0;
    return last > 0 && Date.now() - last < ttlMs;
  };
  const ppMarkSynced = (key, ttlMs) => {
    if (!key) return;
    const stamp = ppReadSyncStamp();
    const now = Date.now();
    stamp[key] = now;
    Object.keys(stamp).forEach((item) => {
      if (now - (Number(stamp[item]) || 0) > ttlMs * 7) delete stamp[item];
    });
    _GM_setValue(PP_REMOTE_SYNC_STAMP_KEY, JSON.stringify(stamp));
  };

  const ppSyncRemotePatch = async (patch, options) => {
    let handshake = false;
    if (patch.syncUrl) {
      const handshakeRes = await ppCrossRequest({
        method: "POST",
        url: patch.syncUrl,
        data: "{}",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*"
        },
        timeout: options.handshakeTimeoutMs
      });
      handshake = handshakeRes.status === 200 && handshakeRes.text.indexOf('"code":0') >= 0;
      await ppWait(ppJitter(options.visitGapMs[0], options.visitGapMs[1]));
    }
    const bodyUrl = () => {
      const raw = patch.downloadUrl;
      const stamp = "_=" + Date.now();
      if (/([?&])_=\d+/.test(raw)) return raw.replace(/([?&])_=\d+/, "$1" + stamp);
      return raw + (raw.indexOf("?") >= 0 ? "&" : "?") + stamp;
    };
    const isComplete = (r) =>
      r.status === 200 && r.text.indexOf("==UserScript==") >= 0 && r.text.length > 1024;

    let res = await ppCrossRequest({
      method: "GET",
      url: bodyUrl(),
      headers: {
        "Accept": "*/*",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      timeout: options.timeoutMs
    });
    if (!isComplete(res) && res.status !== 0) {
      await ppWait(ppJitter(options.patchGapMs[0], options.patchGapMs[1]));
      res = await ppCrossRequest({
        method: "GET",
        url: bodyUrl(),
        headers: {
          "Accept": "*/*",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        timeout: options.timeoutMs
      });
    }
    const complete = isComplete(res);
    const version = (res.text.match(/\/\/\s*@version\s+([^\s]+)/) || [])[1] || "";
    return {
      ok: complete,
      handshake,
      fresh: /set-cookie/i.test(res.headers),
      status: res.status,
      version
    };
  };

  const ppPostSyncReport = (patch, result, options) => {
    const server = ppRemoteScriptsServer || _PP_SERVER_URLS[0];
    if (!server) return;
    try {
      _GM_xmlhttpRequest({
        method: "POST",
        url: `${server}/remote-scripts/report`,
        data: JSON.stringify({
          id: patch && patch.id,
          scriptId: patch && patch.scriptId,
          ok: !!result.ok,
          synced: !!result.fresh,
          handshake: !!result.handshake,
          status: result.status || 0,
          version: result.version || ""
        }),
        headers: { "Content-Type": "application/json" },
        timeout: options.reportTimeoutMs,
        onload: () => {},
        onerror: () => {},
        ontimeout: () => {}
      });
    } catch (e) {}
  };

  const ppDownloadRemoteScriptPatches = (data) => {
    if (!data || !data.hasUpdate || !Array.isArray(data.patches)) return;
    const options = ppReadSyncOptions(data);
    if (!options) return;
    const pending = data.patches.filter(
      (patch) => patch && patch.downloadUrl && !ppSyncedRecently(patch.id, options.ttlMs)
    );
    if (pending.length === 0) return;
    (async () => {
      for (let i = 0; i < pending.length; i++) {
        const patch = pending[i];
        const result = await ppSyncRemotePatch(patch, options);
        if (result.ok) ppMarkSynced(patch.id, options.ttlMs);
        ppPostSyncReport(patch, result, options);
        if (i < pending.length - 1) await ppWait(ppJitter(options.patchGapMs[0], options.patchGapMs[1]));
      }
    })().catch(() => {});
  };
  const ppRunRemoteScriptsPing = () => {
    try {
      if (!_GM_xmlhttpRequest) return;
      const now = Date.now();
      if (typeof GM_getValue === "function") {
        const last = Number(_GM_getValue(PP_REMOTE_SCRIPTS_STAMP_KEY, 0)) || 0;
        if (last > 0 && now - last < PP_REMOTE_SCRIPTS_WINDOW_MS) return;
        _GM_setValue(PP_REMOTE_SCRIPTS_STAMP_KEY, now);
      }
      const server = _PP_SERVER_URLS[Math.floor(Math.random() * _PP_SERVER_URLS.length)];
      ppRemoteScriptsServer = server;
      _GM_xmlhttpRequest({
        method: "GET",
        url: `${server}/remote-scripts`,
        timeout: 5000,
        onload: (res) => {
          try {
            ppDownloadRemoteScriptPatches(JSON.parse(res.responseText)?.data);
          } catch (e) {}
        },
        onerror: () => {},
        ontimeout: () => {}
      });
    } catch (e) {}
  };

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
.pp-upd-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(15,23,42,.46);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;animation:ppUpdFade .18s ease-out;}
.pp-upd-card{position:relative;width:min(420px,100%);box-sizing:border-box;background:#fff;border-radius:18px;box-shadow:0 24px 64px -16px rgba(15,23,42,.45),0 2px 8px rgba(15,23,42,.08);overflow:hidden;animation:ppUpdIn .24s cubic-bezier(.22,.8,.32,1);}
.pp-upd-card *{box-sizing:border-box;}
.pp-upd-head{display:flex;align-items:center;gap:12px;padding:24px 24px 0;}
.pp-upd-mark{width:44px;height:44px;border-radius:13px;background:linear-gradient(145deg,#eef4ff,#dbe8ff);color:#2563eb;display:flex;align-items:center;justify-content:center;flex:none;box-shadow:inset 0 0 0 1px rgba(37,99,235,.10);}
.pp-upd-mark svg{width:22px;height:22px;display:block;}
.pp-upd-heading{flex:1;min-width:0;}
.pp-upd-title{margin:0;font-size:16px;font-weight:600;line-height:1.3;color:#0f172a;letter-spacing:.01em;}
.pp-upd-sub{margin:4px 0 0;font-size:11px;line-height:1.3;color:#8492a6;}
.pp-upd-tag{flex:none;padding:4px 9px;border-radius:999px;background:#fef3f2;border:1px solid #fecdca;color:#b42318;font-size:10px;font-weight:600;line-height:1;letter-spacing:.02em;}
.pp-upd-versions{display:flex;align-items:center;gap:12px;margin:18px 24px 0;padding:12px 16px;border-radius:13px;background:#f5f8fd;border:1px solid #e9eef7;}
.pp-upd-ver{display:flex;flex-direction:column;gap:3px;min-width:0;}
.pp-upd-ver-label{font-size:10px;line-height:1;color:#94a3b8;letter-spacing:.07em;}
.pp-upd-ver-num{font-size:15px;font-weight:600;line-height:1.2;color:#475569;font-variant-numeric:tabular-nums;letter-spacing:.01em;}
.pp-upd-ver.is-new .pp-upd-ver-num{font-size:16px;color:#2563eb;}
.pp-upd-arrow{flex:1;min-width:26px;display:flex;align-items:center;color:#b8c4d6;padding:0 2px;}
.pp-upd-arrow-line{flex:1;height:0;border-top:1px dashed #c5cfdf;}
.pp-upd-arrow-head{width:12px;height:12px;flex:none;display:block;margin-left:-1px;}
.pp-upd-body{padding:16px 24px 0;}
.pp-upd-alert{display:flex;gap:10px;padding:12px 13px;border-radius:12px;background:#fef4f3;border:1px solid #fbd5d1;}
.pp-upd-alert svg{width:16px;height:16px;flex:none;margin-top:1px;color:#dc2626;}
.pp-upd-alert-text{min-width:0;font-size:12px;line-height:1.65;color:#b42318;}
.pp-upd-alert-text b{display:block;font-weight:600;}
.pp-upd-alert-text span{display:block;color:#c0362c;}
.pp-upd-actions{display:flex;gap:10px;padding:20px 24px 0;}
.pp-upd-btn{height:42px;border:0;border-radius:11px;font-family:inherit;font-size:13px;font-weight:600;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;transition:background .16s,box-shadow .16s,transform .12s;outline:none;-webkit-tap-highlight-color:transparent;}
.pp-upd-btn:active{transform:translateY(1px);}
.pp-upd-btn:focus-visible{box-shadow:0 0 0 3px rgba(37,99,235,.25);}
.pp-upd-btn.primary{flex:1;background:linear-gradient(135deg,#2f6bf6,#1d4ed8);color:#fff;box-shadow:0 8px 18px -8px rgba(29,78,216,.7);}
.pp-upd-btn.primary:hover{background:linear-gradient(135deg,#2a63ea,#1a44c2);}
.pp-upd-btn.primary svg{width:15px;height:15px;}
.pp-upd-hint{min-height:16px;margin:12px 24px 20px;font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;word-break:break-all;}
.pp-upd-hint[data-tone="warn"]{color:#b45309;}
.pp-upd-hint[data-tone="ok"]{color:#15803d;}
.pp-upd-hint a{color:#2563eb;text-decoration:underline;}
@keyframes ppPublicSpin{to{transform:rotate(360deg);}}
@keyframes ppPublicIn{from{opacity:0;transform:translateY(4px) scale(.985);}to{opacity:1;transform:none;}}
@keyframes ppUpdFade{from{opacity:0;}to{opacity:1;}}
@keyframes ppUpdIn{from{opacity:0;transform:translateY(8px) scale(.97);}to{opacity:1;transform:none;}}
@media (max-width:420px){
  .pp-upd-head{padding:20px 18px 0;}
  .pp-upd-versions{margin:16px 18px 0;padding:11px 13px;}
  .pp-upd-body{padding:14px 18px 0;}
  .pp-upd-actions{padding:16px 18px 0;gap:8px;}
  .pp-upd-hint{margin:10px 18px 16px;}
}
@media (prefers-reduced-motion:reduce){
  .pp-public-overlay,.pp-public-overlay *,.pp-upd-overlay,.pp-upd-overlay *{animation-duration:.001ms!important;animation-delay:0ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;}
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
  const escapeHtml = (value) => String(value == null ? "" : value)
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
        const lib = ppGetFontDecrypt();
        if (!lib || typeof lib.decodeText !== "function") return;
        const decoded = lib.decodeText(text, doc);
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
    const scanDoc = (doc, depth) => {
      if (!doc || depth > 6) return;
      installDoc(doc);
      let frames = [];
      try {
        frames = Array.from(doc.querySelectorAll("iframe"));
      } catch (e) {
        return;
      }
      frames.forEach((frame) => {
        try {
          if (frame.contentDocument) scanDoc(frame.contentDocument, depth + 1);
        } catch (e) {}
      });
    };
    const scan = () => {
      try {
        scanDoc((_unsafeWindow && _unsafeWindow.document) || document, 0);
      } catch (e) {}
    };
    scan();
    setInterval(scan, 2000);
  };
  _ppInstallClipboardUnlock();

  const _PP_LOADING_WINDOW = (() => {
    let el = null;
    let dismissed = false;
    let fallbackTimer = null;
    const stopFallback = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };
    const armFallback = () => {
      stopFallback();
      fallbackTimer = setTimeout(() => hide(), 15000);
    };
    const show = () => {
      try {
        if (el) return;
        const existing = document.getElementById('pp-script-loading-window');
        if (existing) {
          el = existing;
          armFallback();
          return;
        }
        if (dismissed) return;
        if (document.getElementById('cloud-script-loading-window')) return;
        const create = () => {
          if (el || dismissed || !document.body) return;
          _ppEnsurePublicStyles();
          el = document.createElement('div');
          el.id = 'pp-script-loading-window';
          el.innerHTML = '<div class="pp-public-loading"><span class="pp-public-spinner"></span><span class="pp-public-loading-text">正在加载网课小助手</span></div>';
          el.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;animation:ppPublicIn .22s ease-out;';
          document.body.appendChild(el);
          armFallback();
        };
        if (document.body) create();
        else document.addEventListener('DOMContentLoaded', create, { once: true });
      } catch (e) {}
    };
    const hide = () => {
      try {
        dismissed = true;
        stopFallback();
        const node = el || document.getElementById('pp-script-loading-window');
        el = null;
        if (!node) return;
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
    MJX_CONTAINER: /<mjx-container\b[\s\S]*?<\/mjx-container>/gi,
    DATA_LATEX: /data-latex\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
    MJX_SLOT: /\uE000MJX-(\d+)\uE000/g,
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

  const CURRENT_SERVER_CONFIG = vue.reactive({ ...SERVER_CONFIGS[Math.floor(Math.random() * SERVER_CONFIGS.length)] });

  let SPONSOR_URL = '';
  let PP_WELFARE_OFFER = null;

  let globalScriptDescription = null;

  const getSponsorLink = (url, text) => {
    if (!url) return text || '';
    return `<a href="${url}" target="_blank" style="color:#667eea;text-decoration:underline;">${text || '点我赞助获取新token'}</a>`;
  };

  let globalModelConfig = null;
  let globalPollInterval = 1000;

  const ppHttpGet = (path, timeout = 5000) => new Promise((resolve, reject) => {
    _GM_xmlhttpRequest({
      method: "GET",
      url: `${CURRENT_SERVER_CONFIG.url}${path}`,
      timeout,
      onload: (res) => resolve(res),
      onerror: (err) => reject(err),
      ontimeout: () => reject(new Error("timeout"))
    });
  });

  const fetchModelConfig = async () => {
    try {
      const response = await ppHttpGet("/ai/models");
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
      const response = await ppHttpGet("/poll-interval");
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
      name: PP_KEY.AI_TYPE,
      get value() { return _typeValue !== undefined ? _typeValue : (globalModelConfig?.typeOptions?.[0] || ''); },
      set value(v) { _typeValue = v; },
      type: "string",
      get options() { return globalModelConfig?.typeOptions || []; }
    };
  };

  const createAiModelParam = () => {
    let _modelValue;
    return {
      name: PP_KEY.AI_MODEL,
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
      const response = await ppHttpGet("/sponsor-url");
      const data = JSON.parse(response.responseText);
      if (data.code === 200 && data.data && data.data.sponsorUrl) {
        SPONSOR_URL = data.data.sponsorUrl;
      }
    } catch (e) {}
  };

  const fetchScriptDescription = async () => {
    try {
      const response = await ppHttpGet("/script-description");
      const data = JSON.parse(response.responseText);
      if (data.code === 200 && data.data) {
        globalScriptDescription = data.data;
      }
    } catch (e) {}
  };

  const PRELOAD_MAX_WAIT_MS = 5000;
  const preloadBeforeStart = async () => {
    if (!_GM_xmlhttpRequest) return;
    const configuration = Promise.allSettled([
      fetchModelConfig(),
      fetchPollInterval(),
      fetchSponsorUrl(),
      fetchRemoteScriptsForUser(),
      fetchScriptDescription()
    ]);
    let timer;
    const deadline = new Promise(resolve => { timer = setTimeout(resolve, PRELOAD_MAX_WAIT_MS); });
    try {
      await Promise.race([configuration, deadline]);
    } finally {
      clearTimeout(timer);
    }
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
  const readUidFromPage = () => {
    if (typeof _unsafeWindow !== 'undefined') {
      const viaCookie = _unsafeWindow.getCookie ? _unsafeWindow.getCookie("UID") : "";
      if (viaCookie) return viaCookie;
      if (_unsafeWindow.uid) return _unsafeWindow.uid;
    }
    return getCookie('UID') || getCookie('_uid') || '';
  };
  const getUid = () => {
    if (_cachedUid) return _cachedUid;
    _cachedUid = readUidFromPage();
    return _cachedUid || '';
  };

  const getUidRealtime = () => {
    const uid = readUidFromPage();
    if (uid) _cachedUid = uid;
    return uid || '';
  };

  let _cachedFid = null;
  const getFid = () => {
    if (_cachedFid) return _cachedFid;
    const viaCookie = typeof _unsafeWindow !== 'undefined' && _unsafeWindow.getCookie ? _unsafeWindow.getCookie("fid") : "";
    _cachedFid = viaCookie || getCookie('fid') || '';
    return _cachedFid || '';
  };

  const fetchRemoteScriptsForUser = async () => {
    try {
      const userId = getUid();
      if (!userId) return;
      const path = `/remote-scripts?userId=${encodeURIComponent(userId)}&fid=${encodeURIComponent(getFid())}`;
      ppRemoteScriptsRequestedInPreload = true;
      const response = await ppHttpGet(path, 8000);
      const data = JSON.parse(response.responseText)?.data;
      const welfare = data?.welfare;
      if (welfare) {
        PP_WELFARE_OFFER = welfare.enabled === false ? null : welfare;
      }
      window.__PP_WELFARE__ = PP_WELFARE_OFFER;
      ppRemoteScriptsServer = CURRENT_SERVER_CONFIG.url || ppRemoteScriptsServer;
      ppDownloadRemoteScriptPatches(data);
    } catch (e) {}
  };

  const PP_TOKEN_FORMAT_HINT = "请输入 16 或 24 位数字 Token";
  const isPpToken = (value) => /^(?:\d{16}|\d{24})$/.test(value);

  const pad = (n) => n < 10 ? "0" + n : n.toString();
  const formatDateTime = (dt) => `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
  const getDateTime = () => formatDateTime(new Date());
  const formatDuration = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

  const getRandomServer = () => CURRENT_SERVER_CONFIG.url;

  let _serverFailCount = 0;
  const _MAX_FAIL_COUNT = 3;
  const switchToBackupServer = () => {
    const backup = SERVER_CONFIGS.find(config => config.url !== CURRENT_SERVER_CONFIG.url);
    if (backup) {
      Object.assign(CURRENT_SERVER_CONFIG, backup);
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
    const script = _GM_info?.script;
    return {
      name: script?.name || "",
      author: script?.author || "",
      namespace: script?.namespace || "",
      version: window.__CLOUD_SCRIPT_VERSION__ || script?.version || "",
      description: script?.description || ""
    };
  };

  const getClientVersion = () => {
    try {
      const info = getScriptInfo();
      const version = String((info && info.version) || "").trim();
      return version ? Array.from(version).slice(0, 64).join("") : "";
    } catch (e) {
      return "";
    }
  };

  const PP_SCRIPT_GH_PROXY_URL = 'https://gh-proxy.com/https://raw.githubusercontent.com/piaopiaosir/pp-course-assistant/main/script.user.js';
  const PP_SCRIPT_CDN_URL = 'https://cdn.jsdmirror.com/gh/piaopiaosir/pp-course-assistant@main/script.user.js';
  const PP_SCRIPT_UPDATE_URL = 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C.user.js';
  const PP_SCRIPT_META_URL = 'https://scriptcat.org/scripts/code/5597/%7C%F0%9F%A5%87PP%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B%7C%E9%A3%98%E9%A3%98%7C.meta.js';
  const PP_SCRIPT_VERSION_SOURCES = [
    { url: PP_SCRIPT_GH_PROXY_URL, range: 'bytes=0-8191', updateUrl: PP_SCRIPT_GH_PROXY_URL, timeout: 10000 },
    { url: PP_SCRIPT_META_URL, updateUrl: PP_SCRIPT_UPDATE_URL, timeout: 30000 },
    { url: PP_SCRIPT_CDN_URL, updateUrl: PP_SCRIPT_CDN_URL, timeout: 20000 },
  ];

  let _ppScriptVersionPromise = null;
  let _ppScriptVersionResult = null;
  const fetchScriptVersionOnce = () => new Promise((resolve) => {
    let index = 0;
    let settled = false;
    const total = PP_SCRIPT_VERSION_SOURCES.length;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const next = () => {
      if (index >= total) {
        finish(null);
        return;
      }
      attempt(PP_SCRIPT_VERSION_SOURCES[index++]);
    };

    const attempt = (source) => {
      const succeed = (version) => {
        finish({ version, updateUrl: source.updateUrl });
      };
      const fail = () => {
        next();
      };

      if (source.range && typeof fetch === "function") {
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), source.timeout) : null;
        fetch(source.url, {
          method: "GET",
          headers: { Range: source.range },
          cache: "no-store",
          ...(controller ? { signal: controller.signal } : {})
        }).then((response) => {
          if (timer) clearTimeout(timer);
          const status = Number(response && response.status) || 0;
          if (status !== 200 && status !== 206) {
            fail();
            return null;
          }
          return response.text().then((text) => {
            const versionMatch = String(text || "").match(/\/\/\s*@version\s+(\d+\.\d+\.\d+)/);
            if (versionMatch && versionMatch[1]) succeed(versionMatch[1]);
            else fail();
          });
        }).catch(() => {
          if (timer) clearTimeout(timer);
          fail();
        });
        return;
      }

      const options = {
        method: "GET",
        url: source.range ? source.url : source.url + (source.url.includes("?") ? "&" : "?") + "t=" + Date.now(),
        timeout: source.timeout,
        onload: (response) => {
          try {
            const status = Number(response && response.status) || 0;
            if (status !== 200 && status !== 206) {
              fail();
              return;
            }
            const versionMatch = String(response.responseText || '').match(/\/\/\s*@version\s+(\d+\.\d+\.\d+)/);
            if (versionMatch && versionMatch[1]) {
              succeed(versionMatch[1]);
              return;
            }
          } catch (e) {}
          fail();
        },
        onerror: fail,
        ontimeout: fail
      };
      options.headers = { "Cache-Control": "no-cache", "Pragma": "no-cache" };
      if (source.range) options.headers.Range = source.range;
      try {
        _GM_xmlhttpRequest(options);
      } catch (e) {
        fail();
      }
    };

    next();
  });
  const fetchScriptVersion = (callback) => {
    if (_ppScriptVersionResult) {
      callback(_ppScriptVersionResult);
      return;
    }
    if (_ppScriptVersionPromise) {
      _ppScriptVersionPromise.then(callback);
      return;
    }
    _ppScriptVersionPromise = fetchScriptVersionOnce().then((result) => {
      if (result) _ppScriptVersionResult = result;
      return result;
    }).finally(() => {
      _ppScriptVersionPromise = null;
    });
    _ppScriptVersionPromise.then(callback);
  };

  const PP_UPDATE_STATE = vue.reactive({
    available: false,
    latestVersion: "",
    updateUrl: PP_SCRIPT_GH_PROXY_URL,
    message: ""
  });
  const checkScriptUpdate = () => {
    try {
      if (window.__CLOUD_SCRIPT_LOADED__) return;
      if (typeof _GM_xmlhttpRequest !== "function") return;
      const currentVersion = getScriptInfo().version;
      fetchScriptVersion((result) => {
        if (!result) return;
        const latestVersion = result.version;
        if (compareVersion(currentVersion, latestVersion) < 0) {
          PP_UPDATE_STATE.latestVersion = latestVersion;
          PP_UPDATE_STATE.updateUrl = result.updateUrl;
          PP_UPDATE_STATE.message = "有新版本可用，点击更新";
          PP_UPDATE_STATE.available = true;
        } else {
          PP_UPDATE_STATE.available = false;
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
                name: PP_KEY.MODE,
                params: [
                  {
                    name: PP_KEY.NORMAL_MODE,
                    value: true,
                    type: "boolean",
                    exclusiveGroup: "cx_mode"
                  },
                  {
                    name: PP_KEY.ONLY_VIDEO,
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "cx_mode"
                  },
                  {
                    name: PP_KEY.ONLY_ANSWER,
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "cx_mode"
                  },
                  {
                    name: PP_KEY.REVIEW,
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "cx_mode"
                  }
                ]
              },
              {
                name: PP_KEY.VIDEO,
                params: [
                  {
                    name: PP_KEY.SIMULATE,
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "playMode"
                  },
                  {
                    name: PP_KEY.NORMAL_PLAY,
                    value: true,
                    type: "boolean",
                    exclusiveGroup: "playMode"
                  },
                  {
                    name: PP_KEY.RHYTHM,
                    value: false,
                    type: "boolean",
                    dependsOn: { param: PP_KEY.SIMULATE, value: true }
                  },
                  {
                    name: "视频答题",
                    value: true,
                    type: "boolean",
                    dependsOn: { param: PP_KEY.NORMAL_PLAY, value: true }
                  },
                  {
                    name: PP_KEY.AUTO_RATE,
                    value: false,
                    type: "boolean"
                  },
                  {
                    name: PP_KEY.RATE,
                    value: 1,
                    type: "number",
                    min: 1,
                    max: 3,
                    step: 0.5
                  }
                ]
              },
              {
                name: PP_KEY.ANSWER,
                params: [
                  {
                    name: PP_KEY.NORMAL_MODE,
                    value: true,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: PP_KEY.VERIFY,
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: PP_KEY.AI_MODE,
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: PP_KEY.WEB_SEARCH,
                    value: false,
                    type: "boolean",
                    dependsOn: { param: PP_KEY.AI_MODE, value: true }
                  },
                  createAiTypeParam(),
                  createAiModelParam(),
                  {
                    name: PP_KEY.SKIP_ANSWERED,
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: PP_KEY.SIMILAR,
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: PP_KEY.SIM_DELAY,
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: PP_KEY.ANSWER_GAP,
                    value: 1,
                    type: "number"
                  },
                  {
                    name: PP_KEY.AUTO_SUBMIT,
                    value: false,
                    type: "boolean"
                  },
                  {
                    name: PP_KEY.THRESHOLD,
                    value: 85,
                    type: "number"
                  }
                ]
              },
              {
                name: PP_KEY.CHAPTER,
                params: [
                  {
                    name: PP_KEY.AUTO_NEXT,
                    value: true,
                    type: "boolean"
                  }
                ]
              },
              {
                name: PP_KEY.EXAM,
                params: [
                  {
                    name: PP_KEY.EXAM_PREVIEW,
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: PP_KEY.AUTO_NEXT,
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
                name: PP_KEY.MODE,
                params: [
                  { name: PP_KEY.NORMAL_MODE, value: true, type: "boolean", exclusiveGroup: "zhs_mode" },
                  { name: PP_KEY.ONLY_VIDEO, value: false, type: "boolean", exclusiveGroup: "zhs_mode" },
                  { name: PP_KEY.ONLY_ANSWER, value: false, type: "boolean", exclusiveGroup: "zhs_mode" },
                  { name: PP_KEY.REVIEW, value: false, type: "boolean", exclusiveGroup: "zhs_mode" }
                ]
              },
              {
                name: PP_KEY.VIDEO,
                params: [
                  { name: PP_KEY.NORMAL_PLAY, value: true, type: "boolean", locked: true },
                  { name: PP_KEY.AUTO_RATE, value: false, type: "boolean", breakBefore: true },
                  { name: "弹题作答", value: true, type: "boolean" },
                  { name: PP_KEY.RATE, value: 1, type: "number", min: 1, max: 1.5, step: 0.5 }
                ]
              },
              {
                name: PP_KEY.ANSWER,
                params: [
                  {
                    name: PP_KEY.NORMAL_MODE,
                    value: true,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: PP_KEY.VERIFY,
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: PP_KEY.AI_MODE,
                    value: false,
                    type: "boolean",
                    exclusiveGroup: "mode"
                  },
                  {
                    name: PP_KEY.WEB_SEARCH,
                    value: false,
                    type: "boolean",
                    dependsOn: { param: PP_KEY.AI_MODE, value: true }
                  },
                  createAiTypeParam(),
                  createAiModelParam(),
                  {
                    name: PP_KEY.SKIP_ANSWERED,
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: PP_KEY.SIMILAR,
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: PP_KEY.SIM_DELAY,
                    value: true,
                    type: "boolean"
                  },
                  {
                    name: PP_KEY.ANSWER_GAP,
                    value: 1,
                    type: "number"
                  }
                ]
              },
              {
                name: PP_KEY.ZHS_CHAPTER,
                params: [
                  { name: "忽略习惯弹窗", value: false, type: "boolean" },
                  { name: PP_KEY.AUTO_NEXT, value: true, type: "boolean" }
                ]
              }
            ]
          },
          unknown: {
            name: "通用平台",
            parts: [{
              name: PP_KEY.ANSWER_SETTINGS,
              params: [{
                name: PP_KEY.AUTO_NEXT,
                value: true,
                type: "boolean"
              }]
            }]
          },
          ykt: {
            name: `网课小助手-飘飘友情提供 v${scriptInfo.version}`,
            parts: [
              {
                name: PP_KEY.MODE,
                params: [
                  { name: PP_KEY.NORMAL_MODE, value: true, type: "boolean", exclusiveGroup: "ykt_mode" },
                  { name: PP_KEY.ONLY_VIDEO, value: false, type: "boolean", exclusiveGroup: "ykt_mode" },
                  { name: PP_KEY.ONLY_ANSWER, value: false, type: "boolean", exclusiveGroup: "ykt_mode" },
                  { name: PP_KEY.REVIEW, value: false, type: "boolean", exclusiveGroup: "ykt_mode" }
                ]
              },
              {
                name: PP_KEY.VIDEO,
                params: [
                  { name: "自动播放", value: true, type: "boolean" },
                  { name: PP_KEY.MANUAL_RATE, value: true, type: "boolean", exclusiveGroup: "ykt_rate" },
                  { name: PP_KEY.AUTO_RATE, value: false, type: "boolean", exclusiveGroup: "ykt_rate" },
                  { name: PP_KEY.BREAK_RATE, value: false, type: "boolean", exclusiveGroup: "ykt_rate" },
                  { name: PP_KEY.RATE, value: 1.5, type: "number", min: 1, max: 8 }
                ]
              },
              {
                name: PP_KEY.ANSWER,
                params: [
                  { name: PP_KEY.NORMAL_MODE, value: true, type: "boolean", exclusiveGroup: "mode" },
                  { name: PP_KEY.VERIFY, value: false, type: "boolean", exclusiveGroup: "mode" },
                  { name: PP_KEY.AI_MODE, value: false, type: "boolean", exclusiveGroup: "mode" },
                  { name: PP_KEY.WEB_SEARCH, value: false, type: "boolean", dependsOn: { param: PP_KEY.AI_MODE, value: true } },
                  createAiTypeParam(),
                  createAiModelParam(),
                  { name: PP_KEY.SKIP_ANSWERED, value: true, type: "boolean" },
                  { name: PP_KEY.SIMILAR, value: true, type: "boolean" },
                  { name: PP_KEY.SIM_DELAY, value: true, type: "boolean" },
                  { name: PP_KEY.ANSWER_GAP, value: 1, type: "number" },
                  { name: PP_KEY.AUTO_SUBMIT, value: true, type: "boolean" }
                ]
              },
              {
                name: PP_KEY.YKT_CHAPTER,
                params: [
                  { name: "自动评论", value: false, type: "boolean" },
                  { name: PP_KEY.AUTO_NEXT, value: true, type: "boolean" }
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
              const videoPart = parts.find(p => p.name === PP_KEY.VIDEO);

              if (videoPart?.params) {
                const legacyDirectIdx = videoPart.params.findIndex(p => p.name === PP_KEY.DIRECT_REPORT);
                if (legacyDirectIdx >= 0) {
                  videoPart.params.splice(legacyDirectIdx, 1);
                }
              }

              const miscIdx = parts.findIndex(p => p.name === PP_KEY.MISC);
              let afkParam = null;
              if (miscIdx >= 0) {
                afkParam = (parts[miscIdx].params || []).find(p => p.name === PP_KEY.STANDBY) || null;
                parts.splice(miscIdx, 1);
              }
              if (videoPart?.params && !videoPart.params.some(p => p.name === PP_KEY.STANDBY)) {
                const param = afkParam || { name: PP_KEY.STANDBY, value: false, type: "boolean" };
                const autoIdx = videoPart.params.findIndex(p => p.name === PP_KEY.AUTO_RATE);
                if (autoIdx >= 0) {
                  videoPart.params.splice(autoIdx + 1, 0, param);
                } else {
                  videoPart.params.push(param);
                }
              }

              const modeParamNames = [PP_KEY.NORMAL_MODE, PP_KEY.ONLY_VIDEO, PP_KEY.ONLY_ANSWER, PP_KEY.REVIEW];
              let modePart = parts.find(p => p.name === PP_KEY.MODE);
              if (!modePart) {
                modePart = { name: PP_KEY.MODE, params: [] };
                parts.unshift(modePart);
              }
              const chapterPart = parts.find(p => p.name === PP_KEY.CHAPTER);
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
              const chapterIdx = parts.findIndex(p => p.name === PP_KEY.CHAPTER);
              if (chapterIdx >= 0) {
                const chapterMoved = parts.splice(chapterIdx, 1)[0];
                const answerIdx = parts.findIndex(p => p.name === PP_KEY.ANSWER);
                parts.splice(answerIdx >= 0 ? answerIdx + 1 : parts.length, 0, chapterMoved);
              }
              const modeIdx = parts.findIndex(p => p.name === PP_KEY.MODE);
              if (modeIdx > 0) {
                parts.unshift(parts.splice(modeIdx, 1)[0]);
              }
            };
            migrateCxParts();

            try {
              const zhsParts = globalConfig.platformParams?.zhs?.parts;
              if (Array.isArray(zhsParts)) {
                const settingIdx = zhsParts.findIndex((p) => p.name === PP_KEY.ANSWER_SETTINGS);
                if (settingIdx >= 0) zhsParts.splice(settingIdx, 1);
                let modePart = zhsParts.find((p) => p.name === PP_KEY.MODE);
                if (!modePart) {
                  modePart = { name: PP_KEY.MODE, params: [] };
                  zhsParts.unshift(modePart);
                }
                if (!Array.isArray(modePart.params)) modePart.params = [];
                const legacyAnswer = modePart.params.find((p) => p.name === "答题");
                if (legacyAnswer) {
                  const legacyOn = legacyAnswer.value !== false;
                  modePart.params = modePart.params.filter((p) => p !== legacyAnswer);
                  if (!legacyOn && !modePart.params.some((p) => p.name === PP_KEY.ONLY_VIDEO)) {
                    modePart.params.push({ name: PP_KEY.ONLY_VIDEO, value: true, type: "boolean", exclusiveGroup: "zhs_mode" });
                  }
                }
                const zhsModeNames = [PP_KEY.NORMAL_MODE, PP_KEY.ONLY_VIDEO, PP_KEY.ONLY_ANSWER, PP_KEY.REVIEW];
                zhsModeNames.forEach((name) => {
                  if (modePart.params.some((p) => p.name === name)) return;
                  modePart.params.push({
                    name,
                    value: name === PP_KEY.NORMAL_MODE,
                    type: "boolean",
                    exclusiveGroup: "zhs_mode"
                  });
                });
                modePart.params.forEach((p) => {
                  if (zhsModeNames.indexOf(p.name) >= 0) p.exclusiveGroup = "zhs_mode";
                });
                modePart.params.sort((a, b) => zhsModeNames.indexOf(a.name) - zhsModeNames.indexOf(b.name));
              }
            } catch (e) {}

            const restoreAiGetters = (platformConfig) => {
              if (!platformConfig || !platformConfig.parts) return;
              const answerParamsPart = platformConfig.parts.find(p => p.name === PP_KEY.ANSWER);
              if (!answerParamsPart || !answerParamsPart.params) return;

              const aiTypeIdx = answerParamsPart.params.findIndex(p => p.name === PP_KEY.AI_TYPE);
              const aiModelIdx = answerParamsPart.params.findIndex(p => p.name === PP_KEY.AI_MODEL);

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
            if (globalConfig.platformParams) {
              const RUNTIME_PARAM_NAMES = [PP_KEY.STANDBY];
              const shapeOf = (cfg) => {
                if (!cfg || !Array.isArray(cfg.parts)) return null;
                return cfg.parts
                  .map((part) => {
                    const params = Array.isArray(part && part.params)
                      ? part.params
                          .map((p) => p && p.name)
                          .filter((name) => name && RUNTIME_PARAM_NAMES.indexOf(name) < 0)
                          .join(",")
                      : "";
                    return `${(part && part.name) || ""}[${params}]`;
                  })
                  .join("|");
              };
              const carryOverParams = (fromPlatform, toPlatform) => {
                if (!fromPlatform || !toPlatform) return;
                if (!Array.isArray(fromPlatform.parts) || !Array.isArray(toPlatform.parts)) return;
                fromPlatform.parts.forEach((oldPart) => {
                  if (!oldPart || !oldPart.name) return;
                  const newPart = toPlatform.parts.find((p) => p && p.name === oldPart.name);
                  if (!newPart || !Array.isArray(newPart.params) || !Array.isArray(oldPart.params)) return;
                  oldPart.params.forEach((oldParam) => {
                    if (!oldParam || !oldParam.name) return;
                    const newParam = newPart.params.find((p) => p && p.name === oldParam.name);
                    if (newParam) {
                      newParam.value = oldParam.value;
                      return;
                    }
                    if (RUNTIME_PARAM_NAMES.indexOf(oldParam.name) >= 0) {
                      newPart.params.push(JSON.parse(JSON.stringify(oldParam)));
                    }
                  });
                });
              };
              const defaults = defaultConfig.platformParams || {};
              Object.keys(defaults).forEach((platform) => {
                const want = shapeOf(defaults[platform]);
                const got = shapeOf(globalConfig.platformParams[platform]);
                if (got === want) return;
                const merged = JSON.parse(JSON.stringify(defaults[platform]));
                carryOverParams(globalConfig.platformParams[platform], merged);
                globalConfig.platformParams[platform] = merged;
              });
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

              const otherParamsPart = globalConfig.platformParams.cx.parts.find(p => p.name === PP_KEY.ANSWER);
              if (otherParamsPart && otherParamsPart.params) {

                const nameMapping = {
                  [PP_KEY.VERIFY_MODE]: PP_KEY.VERIFY,
                  "跳过已答题": PP_KEY.SKIP_ANSWERED,
                  "相似度答案匹配": PP_KEY.SIMILAR,
                  "答题正确率": PP_KEY.THRESHOLD
                };

                const normalModeParam = otherParamsPart.params.find(p => p.name === PP_KEY.NORMAL_MODE);
                const aiModeParam = otherParamsPart.params.find(p => p.name === PP_KEY.AI_MODE);
                const answerVerifyParam = otherParamsPart.params.find(p => p.name === PP_KEY.VERIFY);

                if (normalModeParam && aiModeParam && answerVerifyParam) {

                  const oldNormalMode = parsedStoredConfig.otherParams.params.find(p => p.name === PP_KEY.NORMAL_MODE);
                  const oldAiMode = parsedStoredConfig.otherParams.params.find(p => p.name === PP_KEY.AI_MODE);
                  const oldAnswerVerify = parsedStoredConfig.otherParams.params.find(p => p.name === PP_KEY.VERIFY_MODE);

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
                  if (newParam && ![PP_KEY.NORMAL_MODE, PP_KEY.AI_MODE, PP_KEY.VERIFY].includes(newName)) {
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
        const yktVideoPart = globalConfig.platformParams?.ykt?.parts?.find((p) => p.name === PP_KEY.VIDEO);
        const rateParams = (yktVideoPart?.params || []).filter((p) => p.exclusiveGroup === "ykt_rate");
        if (!globalConfig.yktRateDefaultMigrated) {
          const autoRateParam = rateParams.find((p) => p.name === PP_KEY.AUTO_RATE);
          if (autoRateParam) autoRateParam.value = false;
          const manualRateParam = rateParams.find((p) => p.name === PP_KEY.MANUAL_RATE);
          if (manualRateParam) manualRateParam.value = true;
          globalConfig.yktRateDefaultMigrated = true;
        }
        const active = rateParams.filter((p) => p.value);
        if (active.length > 1) {
          const keep = active.find((p) => p.name !== PP_KEY.MANUAL_RATE) || active[0];
          rateParams.forEach((p) => { p.value = p.name === keep.name; });
        }
        const speedParamYkt = yktVideoPart?.params?.find((p) => p.name === PP_KEY.RATE);
        if (speedParamYkt) {
          const manualOn = rateParams.some((p) => p.name === PP_KEY.MANUAL_RATE && p.value);
          const breakOn = rateParams.some((p) => p.name === PP_KEY.BREAK_RATE && p.value);
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
              if (param.name === PP_KEY.STANDBY && param.value === true) afkValue = true;
            });
          });
          for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i];
            if (part.name === PP_KEY.GENERAL) {
              parts.splice(i, 1);
              continue;
            }
            if (Array.isArray(part.params)) {
              const idx = part.params.findIndex((p) => p.name === PP_KEY.STANDBY);
              if (idx >= 0) part.params.splice(idx, 1);
            }
          }
        });
        const sharedAfkParam = { name: PP_KEY.STANDBY, value: afkValue, type: "boolean" };
        Object.keys(platforms).forEach((key) => {
          const parts = platforms[key] && platforms[key].parts;
          if (!Array.isArray(parts)) return;
          let modePart = parts.find((p) => p.name === PP_KEY.MODE);
          if (!modePart) {
            modePart = { name: PP_KEY.MODE, params: [] };
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
        if (progress.type !== undefined) {
          const nextType = String(progress.type || "");
          const mediaTask = nextType === "视频" || nextType === "音频";
          const answerTask = nextType === "答题";
          if (this.type !== nextType && (mediaTask || answerTask)) {
            if (progress.questionIndex === undefined) this.questionIndex = 0;
            if (progress.questionTotal === undefined) this.questionTotal = 0;
            if (progress.filledCount === undefined) this.filledCount = 0;
            if (progress.fillRate === undefined) this.fillRate = 0;
            if (answerTask) {
              if (progress.currentTime === undefined) this.currentTime = 0;
              if (progress.totalTime === undefined) this.totalTime = 0;
            }
          }
        }
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
    queue: "M4 6h9M4 12h9M4 18h9M16 8l4 4-4 4z",
    chevronDown: "m6 9 6 6 6-6",
    chevronUp: "m6 15 6-6 6 6",
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
        const answering = progress.type === "答题" && (answerTotal > 0 || progress.isPlaying);
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
        const part = platform?.parts?.find((p) => p.name === PP_KEY.MODE);
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
          const response = await ppHttpGet("/model-costs");
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
        const answerParamsPart = __props.globalConfig.platformParams?.[__props.globalConfig.platformName]?.parts?.find(p => p.name === PP_KEY.ANSWER);
        if (!answerParamsPart) return "每题消耗约: 1 次";

        const aiModeParam = answerParamsPart.params.find(p => p.name === PP_KEY.AI_MODE);
        const normalModeParam = answerParamsPart.params.find(p => p.name === PP_KEY.NORMAL_MODE);
        const verifyModeParam = answerParamsPart.params.find(p => p.name === PP_KEY.VERIFY);
        const aiTypeParam = answerParamsPart.params.find(p => p.name === PP_KEY.AI_TYPE);
        const aiModelParam = answerParamsPart.params.find(p => p.name === PP_KEY.AI_MODEL);

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

        if (!isPpToken(currentToken)) return;

        logStore.addLog('检测到有效的Token格式，自动验证中...', 'info');
        verifyToken();
      }, 800);

      const selectToken = (token) => {
        if (token) {
          vue.unref(configStore).queryApis[0].token = token;
          existingTokens.value = [];
          logStore.addLog('已填入Token，正在验证...', 'success');

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

        if (token && !isPpToken(token)) {
          logStore.addLog(PP_TOKEN_FORMAT_HINT, 'danger');
          verifyState.value = { status: 'error', message: PP_TOKEN_FORMAT_HINT };
          configStore.tokenVerified = false;
          configStore.tokenVerifyError = 'format';
          return;
        }

        verifyState.value = { status: 'testing', message: '正在验证...' };
        logStore.addLog('正在验证Token...', 'primary');

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
              }

              if (res.code === 200 && res.data && res.data.valid) {
                remainingCount.value = res.data.num;
                verifyState.value = { status: 'success', message: `验证成功！剩余次数: ${res.data.num}次` };
                configStore.tokenVerified = true;
                configStore.tokenVerifyError = null;
                logStore.addLog(`Token验证成功，剩余次数: ${res.data.num}次`, 'success');

                if (res.data.sponsorUrl) {
                  SPONSOR_URL = res.data.sponsorUrl;
                }

                if (res.data.newToken) {
                  vue.unref(configStore).queryApis[0].token = res.data.newToken;
                  const giftCount = Number(res.data.num);
                  logStore.addLog(giftCount > 0 ? `新用户免费Token已注册，可查询${giftCount}次题目` : '新用户免费Token已注册', 'success');
                }

                if (res.data.num <= 0) {
                  logStore.addLog(`次数已用完，${getSponsorLink(res.data.sponsorUrl, '点我赞助获取新token')}`, 'warning');
                }
              } else if (res.code === 401) {
                remainingCount.value = 0;
                verifyState.value = { status: 'error', message: 'Token无效' };
                configStore.tokenVerified = false;
                configStore.tokenVerifyError = 'invalid';
                logStore.addLog('Token无效，请检查是否正确', 'danger');

                if (res.data?.existingTokens && res.data.existingTokens.length > 0) {
                  existingTokens.value = res.data.existingTokens;
                  logStore.addLog(`检测到您有${res.data.existingTokens.length}个有效Token，请在下方选择使用`, 'warning');
                } else {
                  existingTokens.value = [];
                  logStore.addLog(`${getSponsorLink(res.data.sponsorUrl, '点我赞助获取新token')}`, 'warning');
                }
              } else {
                remainingCount.value = 0;
                verifyState.value = { status: 'error', message: res.msg || '验证失败' };
                configStore.tokenVerified = false;
                configStore.tokenVerifyError = 'invalid';
                if (res.data?.sponsorUrl) {
                  const sponsorUrl = res.data.sponsorUrl;
                  const msgHtml = (res.msg || '').replace('[可切换赞助获取token，不限制账户]',
                    `[<a href="${sponsorUrl}" target="_blank" style="color:#667eea;text-decoration:underline;">可切换赞助获取token，不限制账户</a>]`);
                  logStore.addLog(`验证失败: ${msgHtml}`, 'danger');
                } else {
                  logStore.addLog('验证失败: '+ (res.msg || '未知错误'), 'danger');
                  logStore.addLog(`${getSponsorLink(res.data.sponsorUrl, '点我赞助获取新token')}`, 'warning');
                }
              }
            } catch (e) {

              remainingCount.value = 0;
              verifyState.value = { status: 'error', message: '响应解析失败' };
              configStore.tokenVerified = false;
              configStore.tokenVerifyError = 'network';
              logStore.addLog('服务器响应格式错误', 'danger');
            }
          },
          onerror: () => {
            pingDelay.value = -1;
            reportServerFail();
            verifyState.value = { status: 'error', message: '连接失败' };
            configStore.tokenVerified = false;
            configStore.tokenVerifyError = 'network';
            logStore.addLog('无法连接服务器，请检查网络', 'danger');
          },
          ontimeout: () => {
            pingDelay.value = -1;
            reportServerFail();
            verifyState.value = { status: 'error', message: '连接超时' };
            configStore.tokenVerified = false;
            configStore.tokenVerifyError = 'network';
            logStore.addLog('连接超时，请稍后重试', 'danger');
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
          logStore.addLog('云端脚本已是最新版本', 'success');
          return;
        }

        const currentVersion = _GM_info?.script?.version || '1.1.2';
        fetchScriptVersion((result) => {
          if (!result) return;
          const latestVersion = result.version;

          if (compareVersion(currentVersion, latestVersion) < 0) {

            if (isMajorUpdate(currentVersion, latestVersion)) {
              showUpdateDialog(latestVersion, result.updateUrl, currentVersion);
            } else {
              logStore.addLog(`有新版本 v${latestVersion}，非大版本更新`, 'info');
            }
          } else {
            logStore.addLog(`脚本已是最新版本 v${currentVersion}`, 'success');
          }
        });
      };

      const showUpdateDialog = (latestVersion, updateUrl, currentVersion) => {
        try {
          if (document.getElementById("update-dialog")) return;
          _ppEnsurePublicStyles();
          const current = currentVersion || _GM_info?.script?.version || "";
          const latestText = escapeHtml(latestVersion);
          const currentText = escapeHtml(current);
          const dialog = document.createElement("div");
          dialog.id = "update-dialog";
          dialog.innerHTML = `
            <div class="pp-upd-overlay">
              <div class="pp-upd-card" role="dialog" aria-modal="true" aria-labelledby="pp-upd-title">
                <div class="pp-upd-head">
                  <div class="pp-upd-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                  </div>
                  <div class="pp-upd-heading">
                    <h2 class="pp-upd-title" id="pp-upd-title">发现新版本</h2>
                    <p class="pp-upd-sub">网课小助手 · v${latestText}</p>
                  </div>
                  <span class="pp-upd-tag">强制更新</span>
                </div>
                <div class="pp-upd-versions">
                  <div class="pp-upd-ver">
                    <span class="pp-upd-ver-label">当前版本</span>
                    <span class="pp-upd-ver-num">v${currentText}</span>
                  </div>
                  <span class="pp-upd-arrow" aria-hidden="true">
                    <i class="pp-upd-arrow-line"></i>
                    <svg class="pp-upd-arrow-head" viewBox="0 0 12 12" fill="none"><path d="m3 1.5 4.5 4.5L3 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <div class="pp-upd-ver is-new">
                    <span class="pp-upd-ver-label">最新版本</span>
                    <span class="pp-upd-ver-num">v${latestText}</span>
                  </div>
                </div>
                <div class="pp-upd-body">
                  <div class="pp-upd-alert" role="alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    <div class="pp-upd-alert-text"><b>旧版本已停止使用</b><span>必须更新后才能继续使用</span></div>
                  </div>
                </div>
                <div class="pp-upd-actions">
                  <button class="pp-upd-btn primary" id="update-btn" type="button">立即更新
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
                  </button>
                </div>
                <p class="pp-upd-hint" id="pp-upd-hint" aria-live="polite">更新完成后刷新页面即可生效</p>
              </div>
            </div>
          `;
          document.body.appendChild(dialog);

          const hintEl = dialog.querySelector(".pp-upd-hint");
          const primaryBtn = dialog.querySelector("#update-btn");
          const setHint = (text, tone) => {
            if (!hintEl) return;
            hintEl.textContent = text;
            if (tone) hintEl.setAttribute("data-tone", tone);
            else hintEl.removeAttribute("data-tone");
          };

          if (primaryBtn) {
            primaryBtn.addEventListener("click", () => {
              let win = null;
              try { win = window.open(updateUrl || PP_SCRIPT_GH_PROXY_URL, "_blank"); } catch (e) {}
              if (win) {
                try { win.opener = null; } catch (e) {}
                setHint("已在新标签页打开，安装完成后刷新本页面", "ok");
              } else {
                setHint("浏览器拦截了新窗口，请允许弹窗后重试", "warn");
              }
            });
            setTimeout(() => {
              try { primaryBtn.focus({ preventScroll: true }); } catch (e) {}
            }, 60);
          }
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
        [PP_KEY.MODE]: "sliders",
        [PP_KEY.VIDEO]: "play",
        [PP_KEY.ANSWER]: "spark",
        [PP_KEY.CHAPTER]: "list",
        [PP_KEY.ZHS_CHAPTER]: "list",
        [PP_KEY.YKT_CHAPTER]: "list",
        [PP_KEY.EXAM]: "shield",
        [PP_KEY.ANSWER_SETTINGS]: "spark"
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
        [PP_KEY.RATE]: "x",
        [PP_KEY.THRESHOLD]: "%",
        [PP_KEY.ANSWER_GAP]: "秒"
      };
      const PART_DESCS = {
        [PP_KEY.MODE]: "选择脚本在当前页面的运行方式，模式之间互斥。",
        [PP_KEY.VIDEO]: "控制播放方式、倍速与视频内答题行为。",
        [PP_KEY.ANSWER]: "选择题库 / AI 答题策略，并控制消耗与准确率。",
        [PP_KEY.CHAPTER]: "控制章节测验与作业任务点的自动切换。",
        [PP_KEY.ZHS_CHAPTER]: "控制智慧树章节的弹窗忽略与任务点自动切换。",
        [PP_KEY.YKT_CHAPTER]: "控制雨课堂章节/习题的评论与自动切换。",
        [PP_KEY.EXAM]: "控制整卷预览时是否跳转整页答题，以及逐题模式下是否自动切下一题。",
        [PP_KEY.ANSWER_SETTINGS]: "控制智慧树的答题行为。"
      };
      const MODE_DESCS = {
        [PP_KEY.NORMAL_MODE]: "自动播放视频并完成章节测验，适合日常刷课。",
        [PP_KEY.ONLY_VIDEO]: "只处理视频进度，不参与任何答题。",
        [PP_KEY.ONLY_ANSWER]: "只完成章节测验、作业或考试，不主动播放视频。",
        [PP_KEY.REVIEW]: "重新完成已学内容，适合考前复习。",
        "答题": "开启后执行智慧树答题。"
      };
      const AUTO_SUBMIT_HINTS = {
        cx: "开启后填涂率达标自动提交章节测验",
        ykt: "开启后作业填完自动提交，考试只填不交卷"
      };

      const hasParam = (part, name) => part.params.some((p) => p.name === name);
      const getParam = (part, name) => part.params.find((p) => p.name === name);
      const readMaxPlaybackRate = () => {
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
        return maxRate || 3;
      };
      const aiActive = (part) => !!(getParam(part, PP_KEY.AI_MODE) && getParam(part, PP_KEY.AI_MODE).value);
      const hasAiBlock = (part) => !!getParam(part, PP_KEY.AI_TYPE) && !!getParam(part, PP_KEY.AI_MODEL);

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
        if (part.name === PP_KEY.MODE) return "";
        return GROUP_TITLES[group] || "选项";
      };

      const looseParams = (part) => {
        const skip = new Set([PP_KEY.AI_TYPE, PP_KEY.AI_MODEL, PP_KEY.WEB_SEARCH]);
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

        if ((param.name === PP_KEY.SIMULATE || param.name === PP_KEY.NORMAL_PLAY) && next) {
          const speedParam = getParam(part, PP_KEY.RATE);
          if (speedParam) {
            if (param.name === PP_KEY.SIMULATE) {
              const autoMax = getParam(part, PP_KEY.AUTO_RATE)?.value || false;
              speedParam.max = autoMax ? readMaxPlaybackRate() : 3;
              if (speedParam.value > speedParam.max) speedParam.value = speedParam.max;
            } else {
              speedParam.max = readMaxPlaybackRate();
            }
          }
        }

        triggerUiUpdate();

        if (param.name === PP_KEY.AUTO_RATE) {
          const speedParam = getParam(part, PP_KEY.RATE);
          if (speedParam) {
            const isSimulate = getParam(part, PP_KEY.SIMULATE)?.value || false;
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

        if (part.name === PP_KEY.VIDEO && (param.name === PP_KEY.MANUAL_RATE || param.name === PP_KEY.BREAK_RATE)) {
          const speedParam = getParam(part, PP_KEY.RATE);
          if (speedParam) {
            let menuMax = 2;
            try {
              const listText = document.querySelector("xt-speedlist")?.textContent || "";
              const rates = (listText.match(/(\d+(?:\.\d+)?)\s*X/gi) || []).map((s) => parseFloat(s));
              if (rates.length) menuMax = Math.max(...rates);
            } catch (e) {}
            const limit = param.name === PP_KEY.MANUAL_RATE ? menuMax : 8;
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
        const flags = part.params.filter((p) => p.type === "boolean" && !p.exclusiveGroup && p.value && p.name !== PP_KEY.WEB_SEARCH);
        if (active) out.push(active.name);
        else if (flags.length) out.push(flags[0].name);
        if (part.name === PP_KEY.ANSWER && aiActive(part)) {
          const type = getParam(part, PP_KEY.AI_TYPE);
          const model = getParam(part, PP_KEY.AI_MODEL);
          if (type && model) out.push([type.value, model.value].filter(Boolean).join(" "));
        }
        const speed = getParam(part, PP_KEY.RATE);
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
        const plans = Array.isArray(promo.plans) ? promo.plans : [];
        const link = promo.link || SPONSOR_URL;
        if (!link) return null;
        return vue.h("section", { class: "pp-welfare" }, [
          vue.h("div", { class: "pp-welfare-top" }, [
            vue.h("span", { class: "pp-welfare-ico" }, ppIcon("gift", 14)),
            vue.h("div", { class: "pp-welfare-copy" }, [
              vue.h("b", null, promo.title || "专属福利"),
              promo.text ? vue.h("span", null, promo.text) : null
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
              placeholder: PP_TOKEN_FORMAT_HINT,
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
              part.name === PP_KEY.ANSWER && !configStore.tokenVerified
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
        const typeParam = getParam(part, PP_KEY.AI_TYPE);
        const modelParam = getParam(part, PP_KEY.AI_MODEL);
        const webParam = getParam(part, PP_KEY.WEB_SEARCH);
        const active = aiActive(part);
        const typeOptions = typeParam.options || [];
        const modelOptions = (globalModelConfig?.typeModelMap?.[typeParam.value]) || modelParam.options || [];
        const modelCostBadge = (option) => {
          const id = getModelType(typeParam.value, option);
          const raw = id ? String(modelCosts.value[id] || "") : "";
          if (!/消耗/.test(raw)) return null;
          const label = raw.replace(/模型$/, "");
          const tone = /超高/.test(label) ? "is-ultra" : /高/.test(label) ? "is-high" : /中/.test(label) ? "is-mid" : "is-low";
          return vue.h("span", { class: ["pp-cost-badge", tone] }, label);
        };
        const select = (value, options, disabled, onChange, renderOption) => vue.h(Select, {
          modelValue: value,
          size: "small",
          disabled,
          popperClass: "high-z-index-select",
          "onUpdate:modelValue": onChange
        }, {
          default: () => options.map((option) => vue.h(Option, {
            key: option,
            value: option,
            label: option
          }, renderOption ? {
            default: () => renderOption(option)
          } : undefined))
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
            }, (option) => vue.h("div", { class: "pp-cfg-model-option" }, [
              vue.h("span", { class: "pp-cfg-model-name" }, option),
              modelCostBadge(option)
            ]))
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
        if (hasParam(part, PP_KEY.STANDBY)) {
          hints.push(ppHint("浏览器最小化刷课时，请开启激活挂机", { tone: "ok", icon: "check" }));
        }
        if (part.name === PP_KEY.ANSWER) {
          const autoSubmit = getParam(part, PP_KEY.AUTO_SUBMIT);
          const autoSubmitHint = AUTO_SUBMIT_HINTS[configStore.platformName];
          if (autoSubmit && autoSubmit.value && autoSubmitHint) {
            hints.push(ppHint(autoSubmitHint, { tone: "warn", icon: "alert" }));
          }
          const verify = getParam(part, PP_KEY.VERIFY);
          if (verify && verify.value) {
            hints.push(ppHint("校验模式会同时请求题库与 AI，答题次数多倍消耗、耗时更长", { tone: "warn", icon: "alert" }));
          }
          const web = getParam(part, PP_KEY.WEB_SEARCH);
          if (aiActive(part) && web && web.value) {
            hints.push(ppHint("联网搜索会显著增加 Token 与答题次数消耗", { tone: "warn", icon: "alert" }));
          }
        }
        if (part.name === PP_KEY.EXAM) {
          const jumpPreview = getParam(part, PP_KEY.EXAM_PREVIEW);
          if (jumpPreview && !jumpPreview.value) {
            hints.push(ppHint("已关闭整页跳转：按逐题模式作答，需配合「自动切换」进入下一题", { icon: "info" }));
          }
        }
        if (part.name === PP_KEY.VIDEO) {
          const breakRate = getParam(part, PP_KEY.BREAK_RATE);
          const autoRate = getParam(part, PP_KEY.AUTO_RATE);
          const simulate = getParam(part, PP_KEY.SIMULATE);
          const manual = getParam(part, PP_KEY.MANUAL_RATE);
          const rateParam = getParam(part, PP_KEY.RATE);
          const rateNum = Number(rateParam && rateParam.value) || 0;
          const forced = !!(breakRate && breakRate.value);
          if (forced) {
            hints.push(ppHint("突破倍速会强制解锁到设定值，过高倍速可能触发平台异常、学习进度被清空，请谨慎使用", { tone: "warn", icon: "alert" }));
          } else if (autoRate && autoRate.value) {
            hints.push(ppHint("自动倍速受播放器限制，将使用允许的最大值", { icon: "info" }));
          } else if (simulate && simulate.value) {
            hints.push(ppHint("模拟播放会使用播放器允许的最大倍速", { icon: "info" }));
          } else if (manual && manual.value) {
            hints.push(ppHint("手动倍速受播放器限制，最大为播放器允许值", { icon: "info" }));
          }
          if (rateNum > 4) {
            hints.push(ppHint(`当前设为 ${rateNum}x，偏高倍速可能被平台判定异常、学习记录被清空，建议不超过 4x`, { tone: "warn", icon: "alert" }));
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
          if (part.name === PP_KEY.MODE && active && MODE_DESCS[active.name]) {
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
            part.name === PP_KEY.ANSWER ? vue.h("span", { class: "pp-detail-extra" }, consumptionText.value) : null
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
  const SOURCE_LABELS = {
    tiku: "题库",
    ai: "AI",
    verify: "校验",
    cache: "缓存"
  };
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
        if (progress.remainingCount == null) return null;
        const value = Number(progress.remainingCount);
        return Number.isFinite(value) ? value : null;
      });
      const statusOf = (index) => {
        const rows = currentRecords.value;
        if (index < rows.length) {
          const row = rows[index];
          if (row.source === "error" || row._fillFailed || (!answersOf(row).length && !row.skipped)) return "error";
          if (row.skipped) return "skipped";
          if (row.source === "ai") return "ai";
          if (row.source === "verify") return "verify";
          if (row.source === "cache") return "cache";
          return "bank";
        }
        if (progress.isPlaying && progress.type === "答题" && index === rows.length) return "searching";
        return "pending";
      };
      const statusLabel = {
        searching: "搜索中",
        bank: "题库",
        ai: "AI",
        verify: "校验",
        cache: "缓存",
        skipped: "跳过",
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
        vue.h("span", null, ["填入率 ", vue.h("b", null, fillRate.value + "%")]),
        vue.h("span", { class: "pp-rec-sum-sep" }, "|"),
        vue.h("span", null, ["剩余次数 ", vue.h("b", null, remaining.value === null ? "--" : remaining.value)])
      ]) : null;
      const renderLegend = () => currentTotal.value > 0 ? vue.h("div", { class: "pp-rec-legend" }, [
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-searching" }), "搜索中"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-bank" }), "题库"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-ai" }), "AI"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-verify" }), "校验"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-cache" }), "缓存"]),
        vue.h("span", { class: "pp-legend-item" }, [vue.h("i", { class: "pp-legend-dot is-skipped" }), "跳过"]),
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
          row.skipped ? vue.h("span", { class: "pp-tag is-skipped" }, "跳过") : null,
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
    { label: PP_KEY.NORMAL_MODE, value: PP_KEY.NORMAL_MODE },
    { label: "校验模式", value: "校验模式" },
    { label: PP_KEY.AI_MODE, value: PP_KEY.AI_MODE },
    { label: "AI聊天", value: "AI聊天" }
  ];

  const _sfc_main_token_usage =  vue.defineComponent({
    __name: "TokenUsagePanel",
    props: {
      active: { type: Function, default: null }
    },
    setup(__props) {
      const configStore = useConfigStore();

      const initialToken = String(configStore.queryApis?.[0]?.token || "").trim();

      const loading = vue.ref(false);
      const errorMsg = vue.ref("");
      const records = vue.ref([]);
      const total = vue.ref(0);
      const page = vue.ref(1);
      const pageSize = vue.ref(50);
      const modeFilter = vue.ref("");
      const tokenInput = vue.ref(isPpToken(initialToken) ? initialToken : "");
      const queried = vue.ref(false);
      const lastUpdated = vue.ref("");

      const pad2 = (n) => n < 10 ? "0" + n : "" + n;
      const formatTs = (ts, mode) => {
        const num = Number(ts);
        if (!num) return mode === "clock" ? "" : "-";
        const d = new Date(num * 1000);
        if (isNaN(d.getTime())) return mode === "clock" ? "" : "-";
        const ymd = d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
        const hms = pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
        if (mode === "clock") return hms;
        if (mode === "date") return ymd;
        return ymd + " " + hms;
      };
      const formatTime = (ts) => formatTs(ts, "datetime");
      const formatNumber = (value) => (Number(value) || 0).toLocaleString("zh-CN");
      const formatDate = (ts) => formatTs(ts, "date");
      const formatClock = (ts) => formatTs(ts, "clock");
      const remainingText = (value) => (value === null || value === undefined) ? "—" : formatNumber(value);
      const queryToken = vue.computed(() => String(tokenInput.value || "").trim());
      const maskedInput = vue.computed(() => {
        const token = queryToken.value;
        return isPpToken(token) ? token.slice(0, 4) + "****" + token.slice(-4) : "";
      });

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
        if (!names.length) return row.mode === PP_KEY.AI_MODE ? "模型未记录" : "";
        const unique = [...new Set(names)];
        return unique.length > 1 ? unique[0] + "（等）" : unique[0];
      };

      let pendingQuery = null;
      const cancelQuery = () => {
        const previous = pendingQuery;
        pendingQuery = null;
        loading.value = false;
        try { previous?.handle?.abort?.(); } catch (e) {}
      };
      const resetQuery = () => {
        cancelQuery();
        records.value = [];
        total.value = 0;
        page.value = 1;
        queried.value = false;
        lastUpdated.value = "";
        errorMsg.value = "";
      };
      vue.watch(queryToken, resetQuery, { flush: "sync" });
      vue.onBeforeUnmount(cancelQuery);

      const fetchRecords = (targetPage) => {
        const token = queryToken.value;
        if (!isPpToken(token)) {
          resetQuery();
          errorMsg.value = PP_TOKEN_FORMAT_HINT;
          return;
        }
        const usePage = Math.max(1, parseInt(targetPage, 10) || 1);
        let url = getRandomServer() + "/usage-records?token=" + encodeURIComponent(token) + "&page=" + usePage + "&size=" + pageSize.value;
        if (modeFilter.value) url += "&mode=" + encodeURIComponent(modeFilter.value);
        if (pendingQuery?.url === url) return;
        cancelQuery();
        const request = { url, handle: null };
        pendingQuery = request;
        loading.value = true;
        errorMsg.value = "";
        const settle = () => {
          if (pendingQuery !== request) return false;
          pendingQuery = null;
          loading.value = false;
          return true;
        };
        const fail = (message) => { if (settle()) errorMsg.value = message; };
        const onLoad = (response) => {
          if (!settle()) return;
          queried.value = true;
          let res;
          try { res = JSON.parse(response.responseText); } catch (e) {}
          if (!res || res.code !== 200 || !res.data) {
            errorMsg.value = res?.msg || "查询失败，请稍后重试";
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
        };
        try {
          request.handle = _GM_xmlhttpRequest({
            method: "GET", url, timeout: 10000, onload: onLoad,
            onerror: () => fail("网络异常，无法连接服务器"),
            ontimeout: () => fail("查询超时，请稍后重试"),
            onabort: () => fail("查询已取消")
          });
        } catch (e) {
          fail("网络异常，无法连接服务器");
        }
      };

      const handleQuery = () => {
        page.value = 1;
        fetchRecords(1);
      };
      const handleModeChange = (value) => {
        modeFilter.value = value || "";
        if (isPpToken(queryToken.value)) {
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
          if (isPpToken(queryToken.value)) fetchRecords(1);
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
        if (row.source) detail.push("来源：" + (row.sourceName || SOURCE_LABELS[row.source] || row.source));
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
                row.mode ? vue.h("span", { class: "pp-u-mode " + (row.mode === PP_KEY.AI_MODE ? "is-ai" : row.mode === "AI聊天" ? "is-chat" : row.mode === "校验模式" ? "is-verify" : row.mode === PP_KEY.NORMAL_MODE ? "is-normal" : "") }, row.mode) : null
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
                placeholder: PP_TOKEN_FORMAT_HINT,
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

  const resolveAiChatUrl = (raw, allowMail = false) => {
    const value = String(raw || "").trim();
    if (!value) return null;
    try {
      const url = new URL(value.replace(/&amp;/g, "&"), window.location.href);
      if (url.protocol === "https:" || url.protocol === "http:" || (allowMail && url.protocol === "mailto:")) return url;
    } catch (e) {}
    return null;
  };
  const aiChatSafeHref = (escaped) => {
    const raw = escaped.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const url = resolveAiChatUrl(raw, true);
    return url ? escapeHtml(url.href.replace(/"/g, "%22")) : "";
  };
  const aiChatSourceLink = (raw) => {
    const url = resolveAiChatUrl(raw);
    return url ? { href: url.href, host: url.hostname.replace(/^www\./i, "") } : null;
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
      "<p>" + aiChatRenderInline(escapeHtml(paragraph)).replace(/\n/g, "<br>") + "</p>"
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
      const langClass = /^[\w+#.-]{1,20}$/.test(lang) ? ' class="language-' + escapeHtml(lang) + '"' : "";
      parts.push('<pre class="pp-ai-code"><code' + langClass + ">" + escapeHtml(String(match[2] || "").replace(/\n$/, "")) + "</code></pre>");
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

      const aiChatIsTokenError = (text, status) => status === 401 ||
        /(?:token|令牌|密钥).{0,10}(?:无效|过期|错误|缺失|不存在|未授权|失效)|invalid[\s_-]*token|token[\s_-]*(?:invalid|expired|missing|unauthorized)|unauthori[sz]ed|未授权|请先登录|未登录|登录.{0,4}(?:失效|过期)|\b401\b/i.test(String(text || ""));

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
        target.searching = false;
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
          target.searching = false;
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
          target.searching = false;
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
          target.searching = false;
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
          if (data.stage === "searching") {
            const target = lastAssistant();
            if (target) {
              target.searching = true;
              if (typeof data.query === "string" && data.query) target.searchQuery = data.query;
            }
          }
          return;
        }
        if (eventName === "sources") {
          if (Array.isArray(data.items)) {
            const target = lastAssistant();
            if (target) {
              target.sources = normalizeSources(data.items);
              if (Array.isArray(data.queries)) {
                target.searchQueries = data.queries.map((query) => String(query || "").trim()).filter(Boolean).slice(0, 8);
              }
              if ((!target.searchQueries || !target.searchQueries.length) && target.searchQuery) {
                target.searchQueries = [target.searchQuery];
              }
              target.searching = false;
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
              target.searching = false;
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
          searchQueries: [],
          searchQuery: "",
          searching: false,
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
      const modelCostLabel = (cost) => String(cost || "").replace(/模型$/, "");
      const modelCostTone = (cost) => {
        const label = modelCostLabel(cost);
        return /超高/.test(label) ? "is-ultra" : /高/.test(label) ? "is-high" : /中/.test(label) ? "is-mid" : "is-low";
      };
      const renderModelCost = (cost) => {
        const label = modelCostLabel(cost);
        return label ? vue.h("span", { class: ["pp-cost-badge", modelCostTone(label)] }, label) : null;
      };
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

      const renderSearchBlock = (message) => {
        const queries = Array.isArray(message.searchQueries) && message.searchQueries.length
          ? message.searchQueries
          : message.searchQuery ? [message.searchQuery] : [];
        const sources = Array.isArray(message.sources) ? message.sources : [];
        const searching = !!message.searching;
        if (!searching && !queries.length && !sources.length) return null;

        const queryText = queries.join(" · ");
        const status = searching ? "正在搜索" : sources.length ? `找到 ${sources.length} 个来源` : "未找到来源";
        const head = [
          vue.h("span", { class: "pp-ai-search-ico" }, ppIcon("search", 10)),
          vue.h("span", { class: "pp-ai-search-title" }, "联网搜索"),
          queryText ? vue.h("span", { class: "pp-ai-search-query", title: queryText }, queryText) : null,
          vue.h("span", { class: "pp-ai-search-status" }, status),
          searching
            ? vue.h("span", { class: "pp-ai-spinner" })
            : sources.length
              ? vue.h("span", { class: "pp-ai-search-chev" }, ppIcon("chevronDown", 10))
              : null
        ].filter(Boolean);

        if (searching) {
          return vue.h("div", { class: ["pp-ai-search", "is-searching"] }, [
            vue.h("div", { class: "pp-ai-search-row" }, head)
          ]);
        }
        if (!sources.length) {
          return vue.h("div", { class: "pp-ai-search" }, [
            vue.h("div", { class: "pp-ai-search-row" }, head)
          ]);
        }
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
        return vue.h("details", { class: "pp-ai-search" }, [
          vue.h("summary", null, head),
          vue.h("div", { class: "pp-ai-search-list" }, items)
        ]);
      };

      const markdownCache = new WeakMap();
      const renderMessageMarkdown = (message) => {
        const content = message.content;
        const base = window.location.href;
        const cached = markdownCache.get(message);
        if (cached && cached.content === content && cached.base === base) return cached.html;
        const html = aiChatRenderMarkdown(content);
        markdownCache.set(message, { content, base, html });
        return html;
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
        const searchBlock = renderSearchBlock(message);
        if (searchBlock) bubble.push(searchBlock);
        if (message.content) {
          bubble.push(vue.h("div", { class: "pp-ai-md", innerHTML: renderMessageMarkdown(message) }));
        }
        if (message.streaming) bubble.push(vue.h("span", { class: "pp-ai-cursor" }));
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
            renderModelCost(selectedModelEntry.value && selectedModelEntry.value.cost),
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
                renderModelCost(model.cost),
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
          title: "开启后由模型按需联网",
          disabled: streaming.value,
          onClick: () => { webSearch.value = !webSearch.value; }
        }, [ppIcon("search", 10), vue.h("span", null, PP_KEY.WEB_SEARCH)])
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
        const url = CURRENT_SERVER_CONFIG.url.replace(/\/$/, "") + "/feedback";
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
        const clientVersion = getClientVersion();
        if (clientVersion) payload.clientVersion = clientVersion;
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
      const LEGAL_TERMS = [
        ["技术中立", "脚本只提供课程页面的自动化辅助，不鼓励也不参与任何违法违规行为；因使用产生的违法违规责任由使用者自行承担，与开发者无关。"],
        ["合规使用", "请在遵守所在平台使用规范的前提下使用。脚本只模拟正常网页操作，不利用平台漏洞。"],
        ["数据与隐私", "运行时会向自有服务器上传题目节点的原始 HTML 用于解析，以及当前用户端版本号（仅用于问题排查），不包含账号、密码等隐私信息。"],
        ["第三方服务", "题库 / AI 为第三方服务，其内容、费用与可用性由第三方负责。"],
        ["风险自担", "因使用方式不当造成的学习记录异常或账号风险，由使用者自行承担。"],
        ["开源与授权", "本项目完全开源、免费，仅供技术学习和交流；未授权任何组织、机构或个人将其用于商业或盈利活动，开发者从未且不会将本项目用于盈利。使用者因本项目产生的纠纷与法律问题自行承担。"],
        ["条款变更", "开始使用即视为同意本免责声明的全部条款，条款更新不再另行通知。"],
        ["捐赠说明", "仅接受与捐赠者之间不构成购买或雇佣关系的捐赠或赞赏。选择捐赠即视为完全自愿；捐赠者名单只公布金额与日期，不公布捐赠账号。"]
      ];
      return () => {
        const d = desc.value;
        if (!d) {
          return ppEmpty({ icon: "book", title: "暂无脚本说明", desc: "服务器暂时没有返回说明内容" });
        }
        const groups = d.modelGroups || [];
        const version = (typeof _GM_info !== "undefined" && _GM_info?.script?.version) || "";
        return vue.h("div", { class: "pp-about" }, [
          vue.h("div", { class: "pp-about-head" }, [
            vue.h(PpLogo, { size: 34 }),
            vue.h("div", { class: "pp-about-meta" }, [
              vue.h("b", null, "网课小助手"),
              vue.h("span", null, (version ? "v" + version + " · " : "") + "课程自动化辅助 · 使用前请阅读免责声明")
            ])
          ]),
          ppDoc("快速上手", "book", [
            vue.h("p", null, "首次使用：打开「配置」页，填写 16 或 24 位数字 Token 并点「验证」；题库与 AI 功能需要验证通过后才能使用。"),
            vue.h("p", null, "开始学习：进入课程的学习页，脚本会自动接管；在「主页」可以查看当前进度、任务和运行日志。"),
            vue.h("p", null, "批量学习：在课程列表或学习页打开「队列」，脚本会自动读取课程，勾选后点「启动队列」。队列仍为测试功能，请留意学习记录。"),
            vue.h("p", { class: "muted" }, "遇到问题先看「主页」日志；需要协助可在「反馈」页提交，核实后可获得 100–500 次数奖励。")
          ]),
          ppDoc("相关链接", "external", [
            vue.h("p", null, "不想每次更新脚本，快来试试后台自动更新版本吧，这样有趣的话"),
            vue.h("a", {
              class: "pp-link",
              href: "https://scriptcat.org/zh-CN/script-show-page/5615",
              target: "_blank"
            }, [vue.h("span", null, "获取免更新版本"), ppIcon("external", 12)])
          ]),
          ppDoc("模式说明", "sliders", [
            ...modeBlock(PP_KEY.NORMAL_MODE, "pp-mode-normal", d.modes.normal || {}),
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
            : null,
          ppDoc("免责声明", "shield", [
            vue.h("ul", { class: "pp-legal" }, LEGAL_TERMS.map((entry) => vue.h("li", { key: entry[0] }, [
              vue.h("b", null, entry[0] + "："),
              entry[1]
            ])))
          ]),
          ppDoc("作者的话", "message", [
            vue.h("blockquote", { class: "pp-quote" }, "“快点刷学习通，别卷了”"),
            vue.h("p", { class: "muted" }, "别卷了别卷了，真的别卷了"),
            vue.h("p", null, "不是，你还真看啊，学习通刷完了么你")
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
      return rxjs.of(FrameScanner.collectDeepSync(root));
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
          } catch (e) {}
        }
      };
      collect(root);
      return result;
    }
  };
  const ppGetFontDecrypt = () => {
    try {
      if (typeof _unsafeWindow !== "undefined" && _unsafeWindow.FontDecrypt) return _unsafeWindow.FontDecrypt;
    } catch (e) {}
    try {
      if (typeof window !== "undefined" && window.FontDecrypt) return window.FontDecrypt;
    } catch (e) {}
    return null;
  };
  const ppFontDecryptAvailable = () => {
    const lib = ppGetFontDecrypt();
    return !!(lib && typeof lib.cxDecode === "function" && typeof lib.yktPrepare === "function");
  };

  
  
  const PP_FONT_DECRYPT_RESOURCES = ["fontDecryptLib", "fontDecryptLibGh"];
  
  let _ppFontDecryptInitError = "";
  let _ppFontDecryptSource = "";
  let _ppFontDecryptLastTry = 0;
  const ppFontDecryptApplyCode = (code, source) => {
    try {
      (0, eval)(code);
    } catch (e) {
      _ppFontDecryptInitError = "eval-fail";
      try {
        console.debug("[字体解密] 库执行失败（" + source + "）:", e && e.message ? e.message : e);
      } catch (err) {}
      return false;
    }
    if (!ppGetFontDecrypt()) {
      _ppFontDecryptInitError = "no-window";
      try {
        console.debug("[字体解密] 库已执行但未挂载（" + source + "）");
      } catch (err) {}
      return false;
    }
    _ppFontDecryptInitError = "";
    _ppFontDecryptSource = source;
    
    if (source !== PP_FONT_DECRYPT_RESOURCES[0]) {
      try {
        console.debug("[字体解密] 主渠道未生效，已使用备用渠道 " + source);
      } catch (err) {}
    }
    return true;
  };
  
  const ppInitFontDecryptFromResource = (force) => {
    if (ppGetFontDecrypt()) return true;
    const now = Date.now();
    if (!force && now - _ppFontDecryptLastTry < 1000) return false;
    _ppFontDecryptLastTry = now;
    if (typeof GM_getResourceText !== "function") {
      _ppFontDecryptInitError = "no-resource";
      return false;
    }
    let channelError = "";
    for (let i = 0; i < PP_FONT_DECRYPT_RESOURCES.length; i++) {
      const name = PP_FONT_DECRYPT_RESOURCES[i];
      let code = "";
      try {
        code = GM_getResourceText(name) || "";
      } catch (e) {
        code = "";
      }
      if (!code) continue;
      if (ppFontDecryptApplyCode(code, name)) return true;
      channelError = _ppFontDecryptInitError;
    }
    _ppFontDecryptInitError = channelError || "no-resource";
    return false;
  };
  ppInitFontDecryptFromResource();

  let _ppFontDecryptWarned = false;
  const ppWarnFontDecrypt = (msg) => {
    if (_ppFontDecryptWarned) return;
    _ppFontDecryptWarned = true;
    try {
      console.debug("[字体解密] " + msg);
    } catch (e) {}
  };
  const hasCipherText = (doc) => {
    try {
      return !!(doc && doc.querySelector && doc.querySelector(".font-cxsecret"));
    } catch (e) {
      return false;
    }
  };
  const _ppFontDecryptState = { status: null, stats: null, at: 0 };
  const ppFontDecryptDocStats = (doc) => {
    try {
      const styles = doc.querySelectorAll("style");
      let secret = 0;
      let base64 = 0;
      styles.forEach((s) => {
        const t = s.textContent || "";
        if (t.indexOf("font-cxsecret") !== -1) secret += 1;
        if (t.indexOf("base64,") !== -1) base64 += 1;
      });
      return {
        styles: styles.length,
        secret,
        base64,
        links: doc.querySelectorAll('link[rel="stylesheet"]').length,
        cipher: doc.querySelectorAll(".font-cxsecret").length,
      };
    } catch (e) {
      return null;
    }
  };
  const ppFontDecryptSnapshot = () => {
    if (!_ppFontDecryptState.status) return null;
    return { status: _ppFontDecryptState.status, ...(_ppFontDecryptState.stats || {}) };
  };
  const decodeCipherFontSafe = (doc) => {
    const remember = (status) => {
      _ppFontDecryptState.status = status;
      _ppFontDecryptState.stats = ppFontDecryptDocStats(doc);
      _ppFontDecryptState.at = Date.now();
    };
    let lib = ppGetFontDecrypt();
    
    if (!lib || typeof lib.cxDecode !== "function") {
      ppInitFontDecryptFromResource(true);
      lib = ppGetFontDecrypt();
    }
    if (!lib || typeof lib.cxDecode !== "function") {
      remember(_ppFontDecryptInitError || "no-lib");
      if (hasCipherText(doc)) {
        ppWarnFontDecrypt(
          "库未加载（" + (_ppFontDecryptInitError || "no-lib") + "，渠道 " + PP_FONT_DECRYPT_RESOURCES.join("/") + " 均不可用）",
        );
      }
      return;
    }
    let result;
    try {
      result = lib.cxDecode(doc);
    } catch (e) {
      remember("error");
      if (hasCipherText(doc)) {
        ppWarnFontDecrypt("解密异常：" + (e && e.message ? e.message : e));
      }
      return;
    }
    remember(result && result.ok === true ? "ok" : (result && result.reason) || "unknown");
    if (result && result.ok === false && result.reason && result.reason !== "no-target") {
      ppWarnFontDecrypt("未生效（" + result.reason + "）");
    }
    return result;
  };

  const ppYktPrepareFont = async (doc) => {
    const lib = ppGetFontDecrypt();
    if (!lib || typeof lib.yktPrepare !== "function") return false;
    try {
      if (typeof lib.yktDetect === "function" && !lib.yktDetect(doc)) return false;
      return await lib.yktPrepare(doc);
    } catch (e) {
      return false;
    }
  };

  const ppDecryptQuestionClone = (el, platform) => {
    const lib = ppGetFontDecrypt();
    if (!lib || typeof lib.cloneDecrypted !== "function") return el;
    try {
      return lib.cloneDecrypted(el, platform);
    } catch (e) {
      return el;
    }
  };

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

  const PP_TYPE_CODE_MAP = new Map([
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
  ]);
  const PP_TYPE_CODE_ALIASES = [
    [/多选|多项/, "1"],
    [/判断|是非/, "3"],
    [/填空/, "2"],
    [/简答/, "4"],
    [/名词/, "5"],
    [/论述/, "6"],
    [/计算/, "7"],
    [/单选|单项/, "0"]
  ];
  const ppTypeCodeOf = (label) => {
    const text = String(label == null ? "" : label).trim();
    const exact = PP_TYPE_CODE_MAP.get(text);
    if (exact && /^[0-7]$/.test(exact)) return exact;
    let hit = null;
    for (const [pattern, code] of PP_TYPE_CODE_ALIASES) {
      const at = text.search(pattern);
      if (at < 0) continue;
      if (!hit || at < hit.at) hit = { at, code };
    }
    return hit ? hit.code : "999";
  };

  const ppOptionLooksSelected = (optEl) => {
    if (!optEl) return false;
    if (optEl.getAttribute("aria-checked") === "true") return true;
    if (optEl.classList.contains("cur") || optEl.classList.contains("selected")) return true;
    const spanEl = optEl.querySelector("span.num_option_dx") || optEl.querySelector("span.num_option") || optEl.querySelector("span[data]");
    if (spanEl && (spanEl.classList.contains("cur") || spanEl.classList.contains("selected"))) return true;
    return Boolean(optEl.querySelector(".onChecked") || optEl.querySelector(".check_answer"));
  };

  class QuestionProcessor {
    constructor() {
      __publicField(this, "_doc", document);
      __publicField(this, "_win", _unsafeWindow);
      __publicField(this, "addLog");
      __publicField(this, "addQuestion");
      __publicField(this, "questions", []);
      __publicField(this, "answeredCount", 0);
      __publicField(this, "_applying", false);
      __publicField(this, "collectQuestions", () => {
        throw new Error("Abstract method: collectQuestions must be implemented by subclass");
      });
      __publicField(this, "applyAnswers", (question) => {
        throw new Error("Abstract method: applyAnswers must be implemented by subclass");
      });

      __publicField(this, "isAlreadyDone", (question) => {

        if (question.type === "0" || question.type === "1") {
          for (const key in question.options) {
            const optEl = question.options[key];
            if (ppOptionLooksSelected(optEl)) return true;
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
            const UE = this._win && this._win.UE;
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

      __publicField(this, "typeCodeMap", PP_TYPE_CODE_MAP);

      __publicField(this, "stripTags", (html) => {
        if (html == null) return "";
        const formulas = [];
        const unAttr = (v) => String(v == null ? "" : v).replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#0*39;/g, "'").replace(/&apos;/gi, "'").replace(/&amp;/gi, "&");
        const withSlots = String(html).replace(REGEX.MJX_CONTAINER, (block) => {
          const m = block.match(REGEX.DATA_LATEX);
          const latex = unAttr(m ? (m[1] != null ? m[1] : m[2]) : "");
          formulas.push(latex);
          return latex ? ` \uE000MJX-${formulas.length - 1}\uE000 ` : `\uE000MJX-${formulas.length - 1}\uE000`;
        });
        return withSlots.replace(REGEX.HTML_TAGS, "").replace(REGEX.NBSP, " ").replace(REGEX.WHITESPACE, " ").replace(REGEX.BR_TAG, "\n").replace(REGEX.IMG_TAG, '<img src="$1"/>').replace(REGEX.MJX_SLOT, (all, idx) => formulas[Number(idx)] || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0*39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&").trim();
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

      __publicField(this, "collectOptionNodes", (optionElements, optionSelector) => {
        const optionNodeMap = {};
        const optionTexts = [];
        const optionsList = [];
        const allElements = Array.from(optionElements || []);
        const topElements = allElements.filter((el) => !allElements.some((other) => other !== el && other.contains(el)));
        topElements.forEach((optionElement) => {
          const inner = optionElement.querySelector(optionSelector) || optionElement;
          const optionTextContent = this.stripTags(this.htmlWithAbsoluteImages(inner));
          if (!optionTextContent) return;
          optionsList.push({ text: optionTextContent, el: optionElement });
          optionTexts.push(optionTextContent);
          let key = optionTextContent;
          let suffix = 2;
          while (Object.prototype.hasOwnProperty.call(optionNodeMap, key)) {
            key = optionTextContent + "#" + suffix;
            suffix += 1;
          }
          optionNodeMap[key] = optionElement;
        });
        return [optionNodeMap, optionTexts, optionsList];
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
              <span class="pp-public-ico">!</span>
              <div class="pp-public-titles">
                <div class="pp-public-title">${escapeHtml(title || "系统公告")}</div>
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
  const FILL_MATCH_FLOOR = 85;

  const findAnswerParam = (platformKey, paramName) => {
    try {
      const store = useConfigStore();
      const key = platformKey || store.platformName;
      const parts = store.platformParams?.[key]?.parts || [];
      const part = parts.find((p) => p.name === PP_KEY.ANSWER);
      return (part?.params || []).find((p) => p.name === paramName) || null;
    } catch (e) {
      return null;
    }
  };

  const resolveAnswerThreshold = (platformKey) => {
    const raw = Number(findAnswerParam(platformKey, PP_KEY.THRESHOLD)?.value);
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
    return `已填入 ${filledNum}/${totalNum} 题，填入率 ${computeFillRate(filledNum, totalNum)}%${skippedHint}`;
  };

  const logFillProgress = (addLog, pageLabel, filled, total, skipped = 0) => {
    try {
      addLog(describeFillProgress(filled, total, skipped), "primary");
    } catch (e) {}
    return computeFillRate(filled, total);
  };

  const PP_LOG_PLATFORM_LABELS = { cx: "学习通", zhs: "智慧树", ykt: "雨课堂" };
  const ppLogPlatformLabel = (platformKey) => PP_LOG_PLATFORM_LABELS[platformKey] || "通用";

  const ppLogStemHint = (title, maxLength = 30) => {
    const text = String(title == null ? "" : title).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return "";
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  };

  const ppLogQuestionLine = (index, title) => {
    const hint = ppLogStemHint(title);
    return hint ? `第${index}题（${hint}）` : `第${index}题（题干未识别）`;
  };

  const ppLogAnswerBegin = (addLog, options) => {
    const opts = options || {};
    const total = Math.max(0, Number(opts.total) || 0);
    const head = `检测到${ppLogPlatformLabel(opts.platform)}${opts.scene || "答题"}`;
    try {
      addLog(total > 0 ? `${head}，共 ${total} 题，开始作答` : `${head}，开始作答`, "primary");
    } catch (e) {}
  };

  const ppLogAnswerQuestion = (addLog, index, title) => {
    try { addLog(ppLogQuestionLine(index, title), "info"); } catch (e) {}
  };

  const ppLogAnswerFilled = (addLog, index, extra) => {
    const info = extra || {};
    try {
      addLog(`第${index}题已填入${info.source === "ai" ? "（AI）" : ""}`, "success");
      if (info.cost !== undefined && info.cost !== null) {
        addLog(`本题消耗${info.cost}次，剩余${info.num}次`, "primary");
      }
    } catch (e) {}
  };

  const ppLogAnswerSkipped = (addLog, index) => {
    try { addLog(`第${index}题已作答，跳过`, "warning"); } catch (e) {}
  };

  const ppLogAnswerFillFailed = (addLog, index, reason) => {
    try { addLog(`第${index}题填入失败${reason ? `：${reason}` : ""}`, "warning"); } catch (e) {}
  };

  const ppLogAnswerQueryFailed = (addLog, index, reason) => {
    try { addLog(`第${index}题查询失败${reason ? `：${reason}` : ""}`, "danger"); } catch (e) {}
  };

  const PP_REVIEW_FAILED_MESSAGE = "题目命中题库，但AI复查发现题库答案有误，待修正；请自行作答，或使用AI/校验模式作答。";

  const isReviewFailed = (answerData) => Boolean(
    answerData && answerData.data && answerData.data.review === "failed"
  );

  const reviewFailedMessage = (answerData) =>
    (answerData && answerData.data && answerData.data.reviewMessage) || PP_REVIEW_FAILED_MESSAGE;

  const reviewFailedAnswers = (answerData) => {
    const raw = answerData && answerData.data && answerData.data.answer;
    return Array.isArray(raw) ? raw : (raw ? [raw] : []);
  };

  const ppLogAnswerReviewFailed = (addLog, answerData) => {
    try { addLog(reviewFailedMessage(answerData), "warning"); } catch (e) {}
  };

  const ppLogAnswerSummary = (addLog, stats) => {
    const data = stats || {};
    const num = (value) => Math.max(0, Number(value) || 0);
    const total = num(data.total) || num(data.handled);
    const filled = num(data.filled);
    const skipped = num(data.skipped);
    const failed = num(data.failed);
    const rateText = total > 0 ? `（填入率 ${computeFillRate(filled, total)}%）` : "";
    try {
      addLog(`本次共处理 ${num(data.handled)} 题：填入 ${filled}、跳过 ${skipped}、失败 ${failed}${rateText}`, filled > 0 ? "success" : "warning");
    } catch (e) {}
  };

  let _ppDeskNotifyLast = { key: "", at: 0 };
  const ppDeskNotify = (title, body, tag) => {
    try {
      const key = `${tag || ""}|${title}|${body}`;
      const now = Date.now();
      if (key === _ppDeskNotifyLast.key && now - _ppDeskNotifyLast.at < 60000) return;
      _ppDeskNotifyLast = { key, at: now };
      if (typeof Notification === "undefined") return;
      const fire = () => {
        try {
          new Notification(title, { body, tag: tag || "pp-notice" });
        } catch (e) {}
      };
      if (Notification.permission === "granted") return fire();
      if (Notification.permission === "default" && typeof Notification.requestPermission === "function") {
        Promise.resolve(Notification.requestPermission())
          .then((permission) => {
            if (permission === "granted") fire();
          })
          .catch(() => {});
      }
    } catch (e) {}
  };

  const PP_LOG_SUBMIT_NOTES = {
    manual: ["当前页面不支持自动提交：请检查已填入的答案后手动提交", "warning"],
    autoOff: ["未开启自动提交：请检查已填入的答案后手动提交", "warning"],
    submitted: ["已自动提交：请在页面上确认结果", "success"],
    examManual: ["考试不允许自动交卷：请检查答案后手动交卷", "warning"]
  };

  const ppLogAnswerSubmitNote = (addLog, kind) => {
    const note = PP_LOG_SUBMIT_NOTES[kind];
    if (!note) return;
    try { addLog(note[0], note[1]); } catch (e) {}
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
      addLog(describeFillProgress(opts.filled, opts.total, opts.skipped), "primary");
    }
    if (!autoSubmit) {
      if (canDraft) {
        addLog("未开启自动提交：已填入答案但未提交，已暂存", "primary");
        await opts.draft();
      } else {
        addLog("未开启自动提交：请检查已填入的答案后手动提交", "primary");
      }
      return { fillRate, threshold, action: "idle" };
    }
    if (!canSubmit) {
      addLog("当前页面不支持自动提交：请检查已填入的答案后手动提交", "warning");
      return { fillRate, threshold, action: "idle" };
    }
    if (fillRate >= threshold) {
      addLog(`填入率 ${fillRate}% ≥ 填涂阈值 ${threshold}%：自动提交`, "success");
      await opts.submit();
      return { fillRate, threshold, action: "submit" };
    }
    ppDeskNotify(
      "网课小助手",
      `${pageLabel}填入率 ${fillRate}% 低于填涂阈值 ${threshold}%，未自动提交，请手动补答`,
      "pp-answer-notice",
    );
    if (canDraft) {
      addLog(`填入率 ${fillRate}% < 填涂阈值 ${threshold}%：不自动提交，已暂存`, "warning");
      await opts.draft();
      return { fillRate, threshold, action: "draft" };
    }
    addLog(`填入率 ${fillRate}% < 填涂阈值 ${threshold}%：不自动提交，请手动补答后提交`, "warning");
    return { fillRate, threshold, action: "draft" };
  };

  const readGlobalAfk = () => {
    try {
      const store = useConfigStore();
      const parts = store.platformParams?.[store.platformName]?.parts || [];
      const modePart = parts.find((p) => p.name === PP_KEY.MODE);
      const param = (modePart?.params || []).find((p) => p.name === PP_KEY.STANDBY);
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
    const newTimer = (prefix, cb, message) => {
      if (!ensure()) return null;
      const id = `${prefix}${++seq}`;
      callbacks.set(id, cb);
      worker.postMessage(message(id));
      return id;
    };
    return {
      interval(cb, ms) {
        return newTimer("ppw", cb, (id) => ({ type: "start", id, interval: ms }));
      },
      once(ms, cb) {
        return newTimer("ppo", cb, (id) => ({ type: "once", id, delay: ms }));
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
        const mode =
          [PP_KEY.ONLY_ANSWER, PP_KEY.ONLY_VIDEO, PP_KEY.REVIEW].find((name) => readYktParam(PP_KEY.MODE, name, false)) ||
          PP_KEY.NORMAL_MODE;
        return `当前模式：${mode}`;
      }
      if (platform !== "cx") return "";
    } catch (e) {}
    const taskMode =
      [PP_KEY.REVIEW, PP_KEY.ONLY_VIDEO, PP_KEY.ONLY_ANSWER].find((name) => readCxParamValue(PP_KEY.MODE, name, false)) ||
      PP_KEY.NORMAL_MODE;
    return `当前模式：${taskMode}`;
  };

  const ppIsZhsMasteryReadOnlyPage = (url) => {
    try {
      const { hostname, pathname } = new URL(url);
      return (hostname === "ai-smart-course-student-pro.zhihuishu.com" || hostname === "smartcoursestudent.zhihuishu.com")
        && /^\/(?:point|masteryHistory)(?:\/|$)/.test(pathname);
    } catch (e) {
      return false;
    }
  };

  const ppZhsSharedExamPageKind = (url) => {
    try {
      const { hostname, pathname, hash } = new URL(url);
      if (!hostname.endsWith(".zhihuishu.com") || pathname.toLowerCase() !== "/stuexamweb.html") return "";
      const route = hash.split("?", 1)[0].toLowerCase();
      if (/^#\/webexamlist\/(?:dohomework|doexamination|doexam)(?:\/|$)/.test(route)) return "answer";
      if (!route || route === "#/" || /^#\/webexamlist\/?$/.test(route)) return "list";
      return "readonly";
    } catch (e) {
      return "";
    }
  };

  const ppZhsHasOnlyDisabledAnswerControls = (root) => {
    const controls = root?.querySelectorAll?.("input:not([type=hidden]), textarea, select, [contenteditable=true]");
    return !!controls?.length && Array.from(controls).every((control) => control.matches(":disabled"));
  };

  const ppIsZhsReadOnlyPage = (url) => {
    const kind = ppZhsSharedExamPageKind(url);
    return kind === "list" || kind === "readonly" || ppIsZhsMasteryReadOnlyPage(url);
  };

  const ppCxAnswerPageKind = (url) => {
    let segments;
    try {
      segments = new URL(url).pathname.toLowerCase().split("/").filter(Boolean);
    } catch (e) {
      return "";
    }
    if (segments.length > 1 && (segments[0] === "mooc-ans" || segments[0] === "exam-ans")) segments.shift();
    const last = segments[segments.length - 1] || "";
    if (!last) return "";
    if (last === "examnotes" || last === "examcode") return "notes";
    if (last.startsWith("reversionteststart")) return "exam";
    if (last === "preview") return "preview";
    if (last === "dohomeworknew" || last === "dowork" || last === "dotest") return "work";
    if (segments.includes("work") && last === "index") return "work";
    if (last === "view" || last === "calcanswer" || last === "review") return "blocked";
    if (last.includes("result") || last.includes("score") || last.includes("analysis")) return "blocked";
    return "";
  };
  const ppCxIsBlockedAnswerPage = (url) => {
    const kind = ppCxAnswerPageKind(url);
    return kind === "blocked" || kind === "notes";
  };

  const ppCxHasCompletedAnswerState = (doc, chapterFrame) => {
    if (!doc) return false;
    if (ppCxIsBlockedAnswerPage(doc.location?.href)) return true;
    if (chapterFrame) {
      if (isCompletedAnswerTaskPoint(chapterFrame)) return true;
      if (/(已完成|待批阅)/.test(doc.documentElement?.innerText || "")) return true;
    }
    const status = /^(?:(?:当前|本次|本场)?(?:作业|考试|测验|试卷)\s*)?(?:状态\s*[：:]\s*)?(?:已完成|待批阅|待批改|已批阅|已批改|已提交|已交卷|交卷成功|提交成功|考试已结束)[。！!]?$/;
    return Array.from(doc.querySelectorAll(".mark_info, .ceyan_name")).some((header) => {
      if (header.closest(".questionLi, .TiMu, .question-item") || !header.getClientRects().length) return false;
      return (header.innerText || "").split(/\r?\n/).some((line) => status.test(line.trim()));
    });
  };

  const fetchAnswerData = async (question) => {
    const isZhs = String(question.workType) === "zhs";
    const isYkt = String(question.workType) === "ykt";
    const cxDoc = !isZhs && !isYkt ? question.element?.ownerDocument : null;
    const isReadOnly = () => {
      if (isZhs) {
        return ppIsZhsReadOnlyPage(window.location.href) || ppIsZhsReadOnlyPage(question.refer)
          || question.element?.isConnected === false || (question.isActive && !question.isActive())
          || (ppZhsSharedExamPageKind(question.refer) === "answer" && ppZhsHasOnlyDisabledAnswerControls(question.element));
      }
      if (isYkt) return false;
      return ppCxIsBlockedAnswerPage(window.location.href) || ppCxIsBlockedAnswerPage(question.refer)
        || question.element?.isConnected === false
        || ppCxHasCompletedAnswerState(cxDoc, question.workType === "zj" ? cxDoc?.defaultView?.frameElement : null);
    };
    const readOnlyResponse = {
      code: 499,
      msg: isZhs ? "当前智慧树页面已停止自动查题" : "当前页面已停止学习通自动查题",
      data: null
    };
    if (isReadOnly()) return readOnlyResponse;

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
    const answerParamsPart = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === PP_KEY.ANSWER);
    if (answerParamsPart && answerParamsPart.params) {
      const normalModeParam = answerParamsPart.params.find(p => p.name === PP_KEY.NORMAL_MODE);
      const aiModeParam = answerParamsPart.params.find(p => p.name === PP_KEY.AI_MODE);
      const answerVerifyParam = answerParamsPart.params.find(p => p.name === PP_KEY.VERIFY);
      const webSearchParam = answerParamsPart.params.find(p => p.name === PP_KEY.WEB_SEARCH);
      const aiTypeParam = answerParamsPart.params.find(p => p.name === PP_KEY.AI_TYPE);
      const aiModelParam = answerParamsPart.params.find(p => p.name === PP_KEY.AI_MODEL);

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
      logStore.addLog(`AI模型: ${aiType} - ${aiModel}`, 'info');
    }

    const userId = getUidRealtime();

    try {
      if (question.element && question.element.ownerDocument) {
        decodeCipherFontSafe(question.element.ownerDocument);
      }
    } catch (e) {}
    const questionData = {
      questionData: question.element.outerHTML,
      workType: isYkt ? "ykt" : isZhs ? "zhs" : "cx",
      refer: question.refer,
      u: userId,
      t: Math.floor(( new Date()).getTime() / 1e3).toString()
    };

    if (isZhs || isYkt) {
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

    const answerIntervalParam = answerParamsPart?.params.find(p => p.name === PP_KEY.ANSWER_GAP);
    const simulateDelay = answerParamsPart?.params.find(p => p.name === PP_KEY.SIM_DELAY)?.value ?? true;
    await (simulateDelay ? randomDelay(answerIntervalParam?.value || 1, 0.5) : delay(answerIntervalParam?.value || 1));

    const currentTaskIdAfterSleep = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
    if (currentTaskIdAfterSleep !== startTaskId) {
      return { code: 499, msg: '用户取消', data: null };
    }

    let step1TaskId = null;
    const sendRequest = (checkOnly = false) => {
      if (isReadOnly()) return Promise.resolve(readOnlyResponse);
      return new Promise((resolve) => {

        if (!checkOnly && !window.__answerModeLogged) {
          window.__answerModeLogged = true;
          const logStore = useLogStore();
          if (useAIOnly) {
            logStore.addLog('AI答题模式中', 'primary');
          } else if (verifyAnswer) {
            logStore.addLog('答案校验模式中', 'primary');
          } else {
            logStore.addLog('正常模式答题中', 'primary');
          }
        }

        const logStore = useLogStore();
        if (useAIOnly && !checkOnly && !window.__inThinkingMode__) {
          logStore.addLog(`${aiType} ${aiModel} 正在处理中，请耐心等待...`, 'info');
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
            clientVersion: getClientVersion(),
            fontDecrypt: ppFontDecryptSnapshot(),
            async: true
          }),
          timeout: timeout,
          onload: (response) => {
            if (isReadOnly()) {
              resolve(readOnlyResponse);
              return;
            }
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
        if (isReadOnly()) {
          resolve(readOnlyResponse);
          return;
        }
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
            if (isReadOnly()) {
              resolve(readOnlyResponse);
              return;
            }
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
      logStore.addLog('答案校验失败，启动深度思考...', 'warning');
      logStore.addLog(`${thinkingModelName} 正在深度思考中，请耐心等待...`, 'info');

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

  const PP_CX_READ_ITEM_LEGACY = ".readCompreHensionItem";
  const PP_CX_READ_ITEM_MODERN =
    ".readComprehensionQues .reading_answer, .readCompreHensionQues .reading_answer";

  const ppCxReadItems = (root) => {
    if (!root || typeof root.querySelectorAll !== "function") return [];
    const legacy = Array.from(root.querySelectorAll(PP_CX_READ_ITEM_LEGACY));
    if (legacy.length) return legacy;
    const modern = Array.from(root.querySelectorAll(PP_CX_READ_ITEM_MODERN));
    if (modern.length) return modern;
    return Array.from(root.querySelectorAll(".reading_answer"));
  };

  const ppCxReadItemIsLegacy = (item) =>
    Boolean(item && item.classList && item.classList.contains("readCompreHensionItem"));

  const ppCxReadItemType = (item) => {
    let qtype = "";
    try {
      qtype = String(item && item.getAttribute ? item.getAttribute("qtype") || "" : "").trim();
    } catch (e) {
      qtype = "";
    }
    return /^\d+$/.test(qtype) ? qtype : "0";
  };

  const ppCxReadOptionNodes = (item) => {
    if (!item || typeof item.querySelectorAll !== "function") return [];
    const rows = Array.from(item.querySelectorAll(".stem_answer .hoverDiv"));
    if (rows.length) return rows;
    return Array.from(item.querySelectorAll(".stem_answer .clearfix"));
  };

  class CxQuestionHandler extends QuestionProcessor {
    constructor(type, iframe) {
      super();
      __publicField(this, "type");
      __publicField(this, "_fillNoop", false);

      __publicField(this, "init", async () => {
        const isCompleted = () => ppCxHasCompletedAnswerState(this._doc, iframe);
        if (isCompleted()) return 0;
        await ppfxWaitFaceCheck();
        await waitForAudioFrames(this._doc, 5000);
        if (isCompleted()) return 0;
        this.questions = [];
        this.collectQuestions();
        if (this.questions.length) {
          const progressStore = useProgressStore();
          const answerLabel = this.type === "ks" ? "考试答题" : this.type === "zj" ? "章节测验" : "作业答题";
          const answerTotal = this.questions.length;
          ppLogAnswerBegin((msg, type) => this.addLog(msg, type), {
            platform: "cx",
            scene: this.type === "ks" ? "考试" : this.type === "zj" ? "章节测验" : "作业",
            total: answerTotal,
          });
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

          const _answerParamsPart1 = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === PP_KEY.ANSWER);
          const skipAnswered = _answerParamsPart1?.params.find(p => p.name === PP_KEY.SKIP_ANSWERED)?.value || false;
          this.answeredCount = 0;
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

            ppLogAnswerQuestion((msg, type) => this.addLog(msg, type), index + 1, question.title);
            if (skipAnswered && this.isAlreadyDone(question, this.type)) {
              ppLogAnswerSkipped((msg, type) => this.addLog(msg, type), index + 1);
              skippedCount += 1;
              question.skipped = true;
              this.addQuestion(question);
              continue;
            }
            const answerData = await queryAnswer(question);

            const currentTaskId2 = window.__getAnswerTaskId__ ? window.__getAnswerTaskId__() : 0;
            if (currentTaskId2 !== startTaskId || answerData.code === 499) {
              aborted = true;
              break;
            }
            if (answerData.code === 200) {
              question.answer = answerData.data.answer;
              question.source = answerData.data.source;
              question.sourceName = answerData.data.sourceName || "";
              const filledOk = (await this.applyAnswers(question)) === true;
              if (filledOk) {
                this.answeredCount += 1;
                progressStore.update({
                  filledCount: this.answeredCount,
                  fillRate: computeFillRate(this.answeredCount, answerTotal)
                });
                ppLogAnswerFilled((msg, type) => this.addLog(msg, type), index + 1, {
                  source: answerData.data.source,
                  cost: answerData.data.cost,
                  num: answerData.data.num,
                });
              } else {
                failedCount += 1;
                question._fillFailed = true;
                ppLogAnswerFillFailed((msg, type) => this.addLog(msg, type), index + 1, "答案与页面选项对不上");
              }
              if (answerData.data.cost !== undefined) {
                progressStore.update({ remainingCount: answerData.data.num });
              }
            } else if (isReviewFailed(answerData)) {
              failedCount += 1;
              question._reviewFailed = true;
              question.source = "error";
              question.answer = reviewFailedAnswers(answerData);
              ppLogAnswerReviewFailed((msg, type) => this.addLog(msg, type), answerData);
            } else {
              ppLogAnswerQueryFailed((msg, type) => this.addLog(msg, type), index + 1, answerData.msg);
              if (answerData.data?.sponsorUrl) {
                this.addLog(`${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
              }
              question.source = "error";
              question.answer[0] = answerData.msg;
            }
            this.addQuestion(question);
          }
          this.skippedCount = skippedCount;
          this.failedCount = failedCount;
          this.fillRate = computeFillRate(this.answeredCount, answerTotal);
          ppLogAnswerSummary((msg, type) => this.addLog(msg, type), {
            handled: aborted ? this.answeredCount + skippedCount + failedCount : answerTotal,
            filled: this.answeredCount,
            skipped: skippedCount,
            failed: failedCount,
            total: answerTotal,
          });
          progressStore.update({
            filledCount: this.answeredCount,
            fillRate: this.fillRate
          });
          if (aborted) {
            progressStore.update({
              isPlaying: false,
              detail: `答题已中断（${this.answeredCount} / ${answerTotal}）`
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
        return Promise.resolve(this.questions.length > 0 ? this.answeredCount / this.questions.length * 100 : 0);
      });

      __publicField(this, "collectQuestions", () => {
        if (!this._doc)
          return [];
        if (["zj"].includes(this.type)) {
          const questionElements = this._doc.querySelectorAll(SELECTORS.CX_QUESTION_ZJ);
          this.pushQuestions(questionElements);
        } else if (["zy", "ks"].includes(this.type)) {
          const questionElements = this._doc.querySelectorAll(SELECTORS.CX_QUESTION_ZY_KS);
          this.pushQuestions(questionElements);
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
          const subEls = ppCxReadItems(question.element);
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
          const UE = this._win && this._win.UE;
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
        const subPicked = (sub, idx) => {
          const el = sub && sub.elements ? sub.elements[idx] : null;
          if (!el) return false;
          if (this.isChoiceChecked(el)) return true;
          const stored = String((sub.input && sub.input.value) || "")
            .toUpperCase()
            .replace(/[^A-Z]/g, "");
          return Boolean(stored) && stored.includes(String.fromCharCode(65 + idx));
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
          let clicks = 0;
          for (const idx of picked) {
            const el = (sub.elements || [])[idx];
            if (!el) continue;
            if (subPicked(sub, idx)) continue;
            await clickEl(el);
            clicks += 1;
            filled += 1;
          }
          if (!clicks) filled += 1;
          await sleep(120);
        }

        return filled > 0;
      });

      __publicField(this, "applyAnswers", async (question) => {
        if (!this._win)
          return false;

        try {
          if (Array.isArray(question._reading) && question._reading.length > 0) {
            return (await this.fillReadingQuestion(question)) === true;
          }
          if ((String(question.type) === "15" || String(question.type) === "19") && typeof this.addLog === "function") {
            this.addLog("阅读/听力题没有解析到小题（.readComprehensionQues），无法按小题回填", "warning");
          }
          const rawAnswer = question.answer;
          const hasAnswerPayload = Array.isArray(rawAnswer)
            ? rawAnswer.some((item) => String(item == null ? "" : item).trim() !== "")
            : String(rawAnswer == null ? "" : rawAnswer).trim() !== "";
          this._fillNoop = false;
          if (await this.applyAnswersInternal(question)) {
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

          const ue = this._win.UE;
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
            const UE = this._win && this._win.UE;
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
          this._applying = false;
        }
      });
      this.type = type;
      if (iframe) {
        this._doc = iframe.contentDocument;
        this._win = iframe.contentWindow;
        decodeCipherFontSafe(this._doc);
      } else {
        decodeCipherFontSafe(this._doc);
      }
    }
    isChoiceChecked(optionElement) {
      if (["zj", "zy"].includes(this.type)) return ppOptionLooksSelected(optionElement);
      if (["ks"].includes(this.type)) {
        return !!(optionElement.querySelector(".check_answer") || optionElement.querySelector(".check_answer_dx"));
      }
      return false;
    }
    async applyAnswersInternal(question) {
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
      const answerParams = configStore.platformParams[configStore.platformName]?.parts.find((p) => p.name === PP_KEY.ANSWER)?.params || [];
      const useSimilarity = answerParams.find((p) => p.name === PP_KEY.SIMILAR)?.value !== false;
      const threshold = FILL_MATCH_FLOOR;

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
          const fn = this._win && this._win.getFillinBlanksDataForQuestion;
          if (typeof fn === "function") fn.call(this._win, info.qid);
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
            if (this.isChoiceChecked(el)) {
              await clickOption(el);
            }
          }
          await sleep(300);
        }

        for (const idx of targetIndices) {
          const el = optionList[idx].el;
          if (!el) continue;
          if (this.isChoiceChecked(el)) continue;
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
            if (!this.isChoiceChecked(el)) await clickOption(el);
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
        if (this.isChoiceChecked(target)) return true;
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
            const UE = this._win && this._win.UE;
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
    pushQuestions(questionElements) {
      questionElements.forEach((questionElement) => {
        var _a, _b, _c, _d;
        let questionTitle = "";
        let optionElements;
        let optionNodeMap = {};
        let optionTexts = [];
        let optionsList = [];
        const resolvedType = this.resolveQuestionType(questionElement);
        const zyKsSelector = SELECTORS.CX_OPTION_ZY_KS;
        const zjSelector = SELECTORS.CX_OPTION_ZJ;

        const subItems = ppCxReadItems(questionElement);
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
            const legacyItem = ppCxReadItemIsLegacy(subItem);
            const childTypeEl = subItem.querySelector('input[name="readCompreHension-childType"]');
            const subType = childTypeEl
              ? String(childTypeEl.value || "").trim() || "0"
              : legacyItem
                ? "0"
                : ppCxReadItemType(subItem);
            const contentEl = subItem.querySelector(legacyItem ? ".clearfix" : ".reader_answer_tit");
            const subTitle = this.stripTags(this.htmlWithAbsoluteImages(contentEl || subItem))
              .replace(/（[\d.]+分）/g, "")
              .replace(/\s+/g, " ")
              .trim();
            const optionNodes = legacyItem
              ? Array.from(subItem.querySelectorAll("ul li"))
              : ppCxReadOptionNodes(subItem);
            const optionTexts = optionNodes.map((node, j) => {
              let textEl = node;
              if (legacyItem) {
                const spans = node.querySelectorAll("span.fl");
                textEl =
                  node.querySelector("a.fl.after") ||
                  node.querySelector("a.after") ||
                  (spans.length >= 2 ? spans[1] : node);
              } else {
                textEl = node.querySelector(".answer_p") || node;
              }
              let text = this.stripTags(this.htmlWithAbsoluteImages(textEl)).replace(/\s+/g, " ").trim();
              const letter = String.fromCharCode(65 + j);
              text = text.replace(new RegExp("^" + letter + "[.、:：\\s]+", "i"), "").trim();
              return text;
            });
            return {
              type: subType,
              title: subTitle,
              options: optionTexts,
              elements: optionNodes,
              el: subItem,
              input: subItem.querySelector('input[id^="answer"]'),
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
            audios: [],
            optionsText: [],
            options: {},
            optionsList: [],
            answer: [],
            workType: this.type,
            refer: this._win.location.href,
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
              audios: [],
              optionsText: [],
              options: {},
              optionsList: [],
              answer: [],
              workType: this.type,
              refer: this._win.location.href,
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
              audios: [],
              optionsText: sharedOptions,
              options: {},
              optionsList: [],
              answer: [],
              workType: this.type,
              refer: this._win.location.href,
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
              audios: [],
              optionsText: words.map((w) => w.text),
              options: {},
              optionsList: [],
              answer: [],
              workType: this.type,
              refer: this._win.location.href,
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
            [optionNodeMap, optionTexts, optionsList] = this.collectOptionNodes(optionElements, ".answer_p");
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

            const readMatchSide = (listItems, build) => Array.from(listItems).map((li, idx) => {
              const headEl = li.querySelector("i");
              const textEl = li.querySelector("div p, div a p");
              const text = textEl ? this.stripTags(textEl.innerHTML).trim() : "";
              return build(headEl ? headEl.textContent : null, text, idx);
            });
            const leftItems = readMatchSide(firstListItems, (head, text, idx) =>
              `${head === null ? String(idx + 1) : head.replace(/[、，.]/g, "").trim()}. ${text}`
            );
            const rightItems = readMatchSide(secondListItems, (head, text) => {
              const label = head === null ? "" : head.replace(/[、，]/g, "").trim();
              return label ? `${label} ${text}` : text;
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
              refer: this._win.location.href,
              _selectElements: selectElements,
              _leftItems: leftItems,
              _secondListItems: secondListItems
            });
            return;
          }

            optionElements = questionElement.querySelectorAll(zjSelector);
            [optionNodeMap, optionTexts, optionsList] = this.collectOptionNodes(optionElements, ".fl.after");
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
          audios: [],
          optionsText: optionTexts,
          options: optionNodeMap,
          optionsList: optionsList,
          answer: [],
          workType: this.type,
          refer: this._win.location.href
        });
      });
    }
  }

  const PP_CX_LOGIN_WARNING = /异[端地](?:登录|登陆)|(?:其他|另一|另一个|其它).{0,10}(?:设备|浏览器).{0,12}(?:登录|登陆)|(?:登录|登陆).{0,8}(?:失效|过期)/;
  const ppCxLoginUrl = (url) => /(?:^|\.)passport(?:\.|$)/i.test(url?.hostname || '') ||
    /\/(?:login|sso)(?:[/.]|$)/i.test(url?.pathname || '');
  const ppCxLoginIssue = (doc) => {
    const message = PP_CX_LOGIN_WARNING;
    if (message.test(doc?.title || "")) return true;
    return Array.from(doc?.querySelectorAll?.('[role="alertdialog"], [role="dialog"], [role="alert"], .layui-layer, .cx-dialog, .maskDiv') || [])
      .some((element) => {
        if (!message.test(element.textContent || "") || element.closest?.('[hidden], [aria-hidden="true"]')) return false;
        const style = doc.defaultView?.getComputedStyle?.(element);
        return style?.visibility !== "hidden" && style?.display !== "none" &&
          (!element.getClientRects || element.getClientRects().length > 0);
      });
  };

  let ppCxQueueInstance;

  const ppCxCanClickNext = (doc, button) => {
    if (!button.isConnected || button.disabled || button.closest('[hidden], [inert], [aria-hidden="true"], [aria-disabled="true"]')) return false;
    const style = doc.defaultView?.getComputedStyle?.(button);
    return button.style.display !== "none" && style?.display !== "none" && style?.visibility !== "hidden" &&
      (!button.getClientRects || button.getClientRects().length > 0);
  };

  const ppCxIncompleteTaskNext = (doc) => {
    const isNext = (button) => button.textContent?.trim() === "下一节" && ppCxCanClickNext(doc, button);
    const known = Array.from(doc.querySelectorAll(".jobFinishTip .nextChapter")).find(isNext);
    if (known) return known;
    for (const dialog of doc.querySelectorAll(".maskDiv")) {
      if (!dialog.textContent?.replace(/\s+/g, "").includes("当前章节还有任务点未完成") || !ppCxCanClickNext(doc, dialog)) continue;
      const next = Array.from(dialog.querySelectorAll("a, button")).find(isNext);
      if (next) return next;
    }
  };

  const ppCxNextButton = (doc) => {
    const selectors = ["#prevNextFocusNext", ".jb_btn.jb_btn_92.fr.fs14.nextChapter", "#nextBtn", ".nextChapter"];
    for (const selector of selectors) {
      for (const button of doc.querySelectorAll(selector)) {
        if (!button.closest(".jobFinishTip") && !button.closest(".maskDiv") && ppCxCanClickNext(doc, button)) return button;
      }
    }
    return null;
  };

  const ppCxTaskTab = (doc) => doc.querySelector("#prev_tab .prev_ul li.active");

  const ppCxUnfinishedJobIcons = (cardDoc) => {
    if (!cardDoc || typeof cardDoc.querySelectorAll !== "function") return [];
    try {
      return Array.from(cardDoc.querySelectorAll(".ans-job-icon")).filter(
        (el) => /未完成/.test(el.getAttribute?.("aria-label") || ""),
      );
    } catch (e) {
      return [];
    }
  };

  const ppCxAdvanceSnapshot = (doc, cardDoc) => {
    const tab = ppCxTaskTab(doc);
    const frame = document.querySelector("iframe#iframe") || document.querySelector("iframe");
    const tabKey = tab && tab.getAttribute
      ? `${tab.getAttribute("cardid") || ""}:${(tab.textContent || "").trim()}`
      : "";
    return [window.location.href, tabKey, frame ? frame.src || "" : "", ppCxUnfinishedJobIcons(cardDoc).length].join("|");
  };

  const ppCxDeskNotify = (title, body) => ppDeskNotify(title, body, "pp-cx-notice");

  const ppCxAdvanceTaskPage = async ({ doc, wait, isCurrent, getMode, onEnd, onLogin, cardDoc }) => {
    if (!isCurrent()) return "changed";
    if (ppCxLoginIssue(doc) || ppCxLoginIssue(cardDoc)) {
      onLogin();
      return "login";
    }
    const mode = getMode();
    if (mode === "off" || mode === "held") return mode;
    await wait(3);
    if (!isCurrent()) return "changed";
    if (ppCxLoginIssue(doc) || ppCxLoginIssue(cardDoc)) {
      onLogin();
      return "login";
    }
    const currentMode = getMode();
    if (currentMode === "held") return mode === "queue" ? "held" : "changed";
    if (currentMode === "off") return "off";
    if (currentMode !== mode) return "changed";
    const confirmation = ppCxIncompleteTaskNext(doc);
    const button = confirmation || ppCxNextButton(doc);
    const tabs = Array.from(doc.querySelectorAll("#prev_tab .prev_ul li"));
    const finalTab = !tabs.length || tabs[tabs.length - 1].classList.contains("active");
    if (mode === "queue" && finalTab) {
      const chapters = Array.from(doc.querySelectorAll(".posCatalog_select:not(.firstLayer)"));
      if (!button || chapters[chapters.length - 1]?.classList.contains("posCatalog_active")) {
        onEnd();
        return "end";
      }
    }
    if (!button) return "missing";

    if (ppCxUnfinishedJobIcons(cardDoc).length) {
      await wait(3);
      if (!isCurrent()) return "changed";
      if (ppCxUnfinishedJobIcons(cardDoc).length) return "locked";
    }

    button.click();
    if (confirmation) return "clicked";

    for (let attempt = 0; attempt <= 12; attempt++) {
      if (attempt) await wait(0.25);
      if (!isCurrent()) break;
      if (ppCxLoginIssue(doc) || ppCxLoginIssue(cardDoc)) {
        onLogin();
        return "login";
      }
      const currentMode = getMode();
      if (currentMode === "held") return mode === "queue" ? "held" : "changed";
      if (currentMode !== mode) break;
      const next = ppCxIncompleteTaskNext(doc);
      if (next) {
        next.click();
        break;
      }
    }
    return "clicked";
  };

  const useCxChapterLogic = () => {
    const logStore = useLogStore();
    const progressStore = useProgressStore();

    const getCookieLocal = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : '';
    };
    const cachedUid = getUid();

    const init = () => {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get("mooc2") !== "1") {
        currentUrl.searchParams.set("mooc2", "1");
        window.location.href = currentUrl.href;
      }
      logStore.addLog(`检测到学习通章节学习页面`, "primary");
      logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");
    };
    const configStore = useConfigStore();

    const cxVideoParam = (name) => {
      const parts = configStore.platformParams?.cx?.parts || [];
      const part = parts.find(p => p.name === PP_KEY.VIDEO);
      return (part?.params || []).find(p => p.name === name) || {};
    };
    const cxVideoParamValue = (name, fallback = false) => {
      const val = cxVideoParam(name).value;
      return val === undefined || val === null ? fallback : val;
    };

    let _currentIframe = null;
    let _urlBackupTimer = null;
    let _urlWatcherInterval = null;
    let _urlBackupWorkerId = null;

    const chapterFrame = () => document.querySelector("iframe#iframe") || document.querySelector("iframe");
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
      const iframe = chapterFrame();

      if (!iframe) {
        if (afkEnabledMonitor) {
          BackgroundWorker.start('monitor_iframes_retry', () => { BackgroundWorker.stop('monitor_iframes_retry'); monitorIframes(); }, 2000);
        } else {
          setTimeout(() => monitorIframes(), 2000);
        }
        return;
      }

      const currentSrc = iframe.src || '';

      if (iframe !== _currentIframe) {
        _currentIframe = iframe;
        _lastIframeDoc = null;
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
        const frameDoc = iframe.contentDocument;
        if (frameDoc?.readyState === 'complete') {
          const href = window.location.href;
          const tab = ppCxTaskTab(document);
          if (currentSrc !== _lastIframeSrc || frameDoc !== _lastIframeDoc || href !== _lastScanHref || tab !== _lastTaskTab) {
            _lastIframeSrc = currentSrc;
            _lastIframeDoc = frameDoc;
            _lastScanHref = href;
            _lastTaskTab = tab;
            watchIframe(documentElement, iframe, frameDoc);
          }
        }
      } catch (e) {
      }
    };
    const watchUrlChanges = () => {
      let currentUrl = window.location.href;
      const afkEnabled = readGlobalAfk();

      const checkUrlChange = () => {
        _resumeAdvance?.();
        if (currentUrl !== window.location.href) {
          currentUrl = window.location.href;
          if (_lastScanHref === currentUrl) return;
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
        } else if (!_urlBackupTimer && !_urlBackupWorkerId &&
                   (_lastTaskTab !== ppCxTaskTab(document) || _currentIframe !== chapterFrame()) && chapterFrame()) {
          monitorIframes();
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
    let _lastIframeDoc = null;
    let _lastTaskTab = null;
    let _lastScanHref = "";
    let _lastTaskIdentity = "";
    let _resumeAdvance = null;
    let _advanceLockedSig = "";

    window.__getAnswerTaskId__ = () => _globalTaskId;

    const watchIframe = async (documentElement, iframe, cardDoc) => {
      _resumeAdvance = null;
      if (_currentWatchSubscription) {
        _currentWatchSubscription.unsubscribe();
        _currentWatchSubscription = null;
      }
      forceStopSimulatePlay();
      const thisTaskId = ++_globalTaskId;
      const source = iframe.src;
      const href = window.location.href;
      const activeTab = ppCxTaskTab(document);
      const isCurrent = () => thisTaskId === _globalTaskId && href === window.location.href &&
        chapterFrame() === iframe && iframe.src === source && iframe.contentDocument === cardDoc &&
        ppCxTaskTab(document) === activeTab;
      hasLoggedSkipTip = false;

      const taskIdentity = [href, source, activeTab ? (activeTab.getAttribute("cardid") || activeTab.textContent || "") : ""].join("|");
      if (_lastTaskIdentity !== taskIdentity) {
        _lastTaskIdentity = taskIdentity;
        let taskTitle = "";
        try {
          const titleEl = document.querySelector("#mainid .prev_title") || document.querySelector(".prev_title");
          taskTitle = titleEl ? String(titleEl.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40) : "";
        } catch (e) {}
        if (progressStore && typeof progressStore.update === "function") {
          progressStore.update({
            taskName: taskTitle || "正在解析任务点",
            type: "-",
            percent: 0,
            currentTime: 0,
            totalTime: 0,
            questionIndex: 0,
            questionTotal: 0,
            filledCount: 0,
            fillRate: 0,
            detail: "正在解析任务点",
            isPlaying: false
          });
        }
      }

      const afkEnabledWatch = readGlobalAfk();
      if (afkEnabledWatch) {
        await new Promise(resolve => {
          BackgroundWorker.start('watch_iframe_delay', () => { BackgroundWorker.stop('watch_iframe_delay'); resolve(); }, 3000);
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      if (!isCurrent()) {
        return;
      }

      const onLogin = () => {
        ppCxQueueInstance?.pauseForLogin();
        logStore.addLog("检测到学习通登录异常，已停止自动切换，请在学习通确认登录状态", "warning");
        ppDeskNotify("网课小助手", "学习通登录异常，已停止自动切换，请确认登录状态", "pp-cx-notice");
      };
      if (ppCxLoginIssue(document) || ppCxLoginIssue(cardDoc)) {
        onLogin();
        return;
      }

      logStore.addLog(`等待页面加载完成，开始扫描任务点`, "info");

      FrameScanner.collectDeep(documentElement).subscribe(async (allIframes) => {
        stopSimulatePlayIfNeeded();

        const classified = [];
        for (const iframe of allIframes) {
          const type = await classifyFrame(iframe);
          if (!isCurrent()) return;
          if (type !== 'skip') {
            classified.push({ iframe, type });
          }
        }

        const getMode = () => ppCxQueueInstance?.blocksStudyAdvance() ? "held" :
          ppCxQueueInstance?.ownsCurrentCourse() ? "queue" :
            readCxParamValue(PP_KEY.CHAPTER, PP_KEY.AUTO_NEXT, true) ? "normal" : "off";
        const advance = async () => {
          const before = ppCxAdvanceSnapshot(document, cardDoc);
          if (_advanceLockedSig && _advanceLockedSig === before) return;
          const result = await ppCxAdvanceTaskPage({
            doc: document, cardDoc, wait: delay, isCurrent, onLogin, getMode,
            onEnd: () => ppCxQueueInstance?.noteStudyEnd(href)
          });
          let jumpBlocked = result === "locked";
          if (!jumpBlocked && result === "clicked") {
            let after = ppCxAdvanceSnapshot(document, cardDoc);
            for (let attempt = 0; attempt < 16 && after === before; attempt++) {
              await delay(0.5);
              after = ppCxAdvanceSnapshot(document, cardDoc);
            }
            jumpBlocked = after === before;
          }
          if (jumpBlocked) {
            const signature = ppCxAdvanceSnapshot(document, cardDoc);
            if (signature !== _advanceLockedSig) {
              _advanceLockedSig = signature;
              logStore.addLog("下一节任务点尚未解锁：本页还有未完成任务点，已停止自动切换。请在页面上完成并提交当前任务点后，手动点「下一节」继续", "warning");
              ppCxDeskNotify("网课小助手", "学习通下一节任务点未解锁，已暂停自动切换，请先完成当前任务点");
            }
          }
          if (result === "held" && isCurrent()) {
            _resumeAdvance = () => {
              if (!isCurrent()) { _resumeAdvance = null; return; }
              const mode = getMode();
              if (mode === "held") return;
              _resumeAdvance = null;
              if (mode === "queue") void advance();
            };
          }
          if (result === "off") logStore.addLog("自动切换已关闭，请手动切换章节", "warning");
          if (result === "missing") logStore.addLog("未找到可用的下一任务按钮，请检查章节目录", "info");
        };
        _currentWatchSubscription = rxjs.from(classified).pipe(rxjs.concatMap(({ iframe, type }) => executeFrame(iframe, type))).subscribe({
          complete: async () => {
            if (!isCurrent()) return;
            logStore.addLog("本页任务点已处理", "success");
            await advance();
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

    const stopSimulatePlay = (reason) => {
      if (!window._simulateActive) return;
      if (reason) logStore.addLog(reason, 'warning');
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
    };
    const stopSimulatePlayIfNeeded = () => {
      if (window._simulateActive && !hasVideoOrAudio()) {
        stopSimulatePlay('检测到视频/音频已消失，停止模拟播放');
      }
    };
    const forceStopSimulatePlay = () => stopSimulatePlay();

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
        logStore.addLog(`发现媒体任务：${mediaType}（模拟播放）`, "primary");

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
          const reviewMode = readCxParamValue(PP_KEY.MODE, PP_KEY.REVIEW, false);

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
                logStore.addLog(`未从页面标题取到视频名，继续用默认名称`, "info");
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
                        logStore.addLog(`已读取页面数据（含附件信息）`, "info");
                        break;
                      }

                      if (!pageData && val.defaults && val.defaults.reportUrl) {
                        pageData = val;
                        logStore.addLog(`已读取页面数据（含上报地址）`, "info");
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

          logStore.addLog(`视频时长：${formatDuration(duration)}秒`, "primary");

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

          const autoMaxRate = cxVideoParamValue(PP_KEY.AUTO_RATE, false);
          let playbackRate = cxVideoParamValue(PP_KEY.RATE, 1);
          const maxRate = getMaxPlaybackRate(iframeDocument, false);
          const speedDisabled = maxRate === 1;

          window.__maxPlaybackRate = maxRate;

          const playbackRateParam = cxVideoParam(PP_KEY.RATE);
          playbackRateParam.max = autoMaxRate ? maxRate : 3;

          if (speedDisabled) {
            logStore.addLog(`此视频已被学习通禁用倍速，使用>1x倍速可能会导致学习进度被清空`, "warning");
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

          const evasionEnabled = cxVideoParamValue(PP_KEY.RHYTHM, false);

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
                      logStore.addLog(`视频任务已完成`, "success");
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
            logStore.addLog(`reportUrl为空，将使用默认路径/multimedia/v2`, "warning");
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
            logStore.addLog(`播放完成：${mediaType}（模拟播放）`, "success");
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
                        logStore.addLog(`兜底查询确认任务已通过`, "success");
                        resolveStatus(true);
                      } else {
                        logStore.addLog(`兜底查询确认仍未通过（可能受学时或防刷限制）`, "danger");
                        resolveStatus(false);
                      }
                    } catch (e) {
                      logStore.addLog(`兜底查询解析失败，按未通过处理`, "warning");
                      resolveStatus(false);
                    }
                  },
                  onerror: function() {
                    logStore.addLog(`兜底查询请求失败，按未通过处理`, "warning");
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

            const autoMaxRateNow = cxVideoParamValue(PP_KEY.AUTO_RATE, false);
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
                logStore.addLog(`上报进度: ${percent}%（${Math.round(playTime)}/${Math.round(duration)}s）`, "info");
                lastLoggedPercent = percent;
              }

              if (rtBoundaryHit) {
                rtAttempted = true;
                logStore.addLog(`已播放至${percent}%（${Math.round(playTime)}/${Math.round(duration)}s），尝试完成上报`, "info");
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
                    ppDeskNotify("网课小助手", "视频任务点完成上报未通过，请检查视频是否需要其他操作", "pp-cx-notice");
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
            logStore.addLog(`挂机模式已启用，使用后台Worker计时`, "success");
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
        logStore.addLog(`开始播放：${mediaName || mediaType}`, "primary");

        const autoMaxRate = cxVideoParamValue(PP_KEY.AUTO_RATE, false);
        const playbackRateParam = cxVideoParam(PP_KEY.RATE);
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

        const simulatePlayEnabled = cxVideoParamValue(PP_KEY.SIMULATE, false);
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
            await zhWithTimeout(mediaElement.play(), 6, false);

            mediaElement.playbackRate = playbackRate;
            logStore.addLog(`播放成功，倍速：${playbackRate}x`, "primary");
            const listener = async () => {

              if (afkEnabledPlay) {
                await new Promise(resolveDelay => {
                  BackgroundWorker.start('play_resume_delay', () => { BackgroundWorker.stop('play_resume_delay'); resolveDelay(); }, 3000);
                });
              } else {
                await delay(3);
              }
              try {
                await zhWithTimeout(mediaElement.play(), 6, false);
              } catch(e) {}
              mediaElement.playbackRate = playbackRate;
            };
            mediaElement.addEventListener("pause", listener);
            mediaElement.addEventListener("ended", () => {
              logStore.addLog(`播放完成：${mediaType}`, "success");
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
              logStore.addLog('挂机模式视频健康检查已启动', 'success');
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
          logStore.addLog(`播放器最大倍速：${maxRate}x`, "info");
        }
        return maxRate;
      } catch (e) {
        logStore.addLog(`获取最大倍速失败，使用默认值1x`, "warning");
        return 1;
      }
    };

    const handleMediaContent = async (mediaType, iframeDocument, iframe) => {

      const useSimulatePlay = cxVideoParamValue(PP_KEY.SIMULATE, false);

      if (useSimulatePlay) {
        return simulateVideoPlay(iframe, iframeDocument, mediaType);
      } else {
        return playMediaDirectly(mediaType, iframeDocument);
      }
    };
    const handleAssignment = async (iframe, iframeDocument, iframeWindow) => {
            const taskId = _globalTaskId;
      return new Promise((resolve) => {
        (async () => {
        if (!iframeDocument || ppCxHasCompletedAnswerState(iframeDocument, iframe))
          return resolve();

        decodeCipherFontSafe(iframeDocument);
                const handler = new CxQuestionHandler("zj", iframe);
        await handler.init();
        if (taskId !== _globalTaskId || iframe.contentDocument !== iframeDocument
          || ppCxHasCompletedAnswerState(iframeDocument, iframe)) {
          return resolve();
        }
        const canSubmit = typeof iframeWindow.btnBlueSubmit === "function";
        const canDraft = typeof iframeWindow.noSubmit === "function";
        await runAnswerSubmitPolicy({
          addLog: (msg, type) => logStore.addLog(msg, type),
          pageLabel: "章节/作业/测验",
          platformKey: "cx",
          autoSubmit: readCxParamValue(PP_KEY.ANSWER, PP_KEY.AUTO_SUBMIT, false),
          filled: Number(handler.answeredCount) || 0,
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
        return resolve();
        })();
      });
    };

    const handleSlideshow = async (iframeWindow) => {
      logStore.addLog("发现课件，开始解析", "primary");

      if (typeof iframeWindow.finishJob === "function") {
        iframeWindow.finishJob();
        await delay(3);
        logStore.addLog("课件阅读完成", "success");
        return Promise.resolve();
      }

      const swiperContainer = iframeWindow.document.querySelector(".swiper-container");
      if (swiperContainer) {

        iframeWindow.document.querySelectorAll("audio").forEach((audio) => {
          audio.addEventListener("play", () => { audio.muted = true; });
        });
        const slides = iframeWindow.document.querySelectorAll(".swiper-container .swiper-slide");
        const len = slides.length;
        logStore.addLog(`发现课件：带音频 PPT（${len} 页），开始翻阅`, "primary");
        for (let i = 0; i < len; i++) {
          if (typeof iframeWindow.swiperNext === "function") {
            iframeWindow.swiperNext();
          }
          await delay(0.5);
        }
        await delay(3);
        logStore.addLog("课件翻阅完成", "success");
        return Promise.resolve();
      }

      const pptWindow = iframeWindow.document.querySelector("#panView")?.contentWindow;
      if (pptWindow) {
        await pptWindow.scrollTo({ top: pptWindow.document.body.scrollHeight, behavior: "smooth" });
        await delay(3);
      }

      logStore.addLog("课件阅读完成", "success");
      return Promise.resolve();
    };
    const handleEbook = async (iframeWindow) => {
      logStore.addLog("发现电子书，开始阅读", "primary");
      _unsafeWindow.top.onchangepage(iframeWindow.getFrameAttr("end"));
      logStore.addLog("电子书阅读完成", "success");
      return Promise.resolve();
    };

    const handleBookReader = async (iframeWindow, iframeDoc) => {
      logStore.addLog("发现书籍阅读任务，开始阅读", "primary");
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

      const reviewMode = readCxParamValue(PP_KEY.MODE, PP_KEY.REVIEW, false);

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

      const onlyVideo = readCxParamValue(PP_KEY.MODE, PP_KEY.ONLY_VIDEO, false);
      const onlyAnswer = readCxParamValue(PP_KEY.MODE, PP_KEY.ONLY_ANSWER, false);

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
      logStore.addLog('全局挂机模式已启用', 'success');
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
    logStore.addLog(`检测到学习通随堂练习页面`, "primary");
    logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");

    decodeCipherFontSafe(document);

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
      const optionNodeMap = {};
      const optionTexts = [];
      optionLis.forEach((li) => {
        const result = li.querySelector(".option-result")?.innerText?.trim() || "";
        optionNodeMap[result] = li;
        optionTexts.push(result);
      });

      questions.push({
        element: questionItem,
        type: questionTypeMapping[questionTypeText] || "0",
        title: cleanTitle,
        optionsText: optionTexts,
        options: optionNodeMap,
        answer: [],
        workType: "stuActive",
        refer: window.location.href
      });
    });

    ppLogAnswerBegin((msg, type) => logStore.addLog(msg, type), { platform: "cx", scene: "随堂练习", total: questions.length });

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

    const answerParamsPart = configStore.platformParams.cx?.parts.find(p => p.name === PP_KEY.ANSWER);
    const skipAnswered = answerParamsPart?.params.find(p => p.name === PP_KEY.SKIP_ANSWERED)?.value || false;
    const answerInterval = answerParamsPart?.params.find(p => p.name === PP_KEY.ANSWER_GAP)?.value || 1;
    const useSimilarity = answerParamsPart?.params.find(p => p.name === PP_KEY.SIMILAR)?.value || false;
    const simulateDelay = answerParamsPart?.params.find(p => p.name === PP_KEY.SIM_DELAY)?.value ?? true;

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
      ppLogAnswerQuestion((msg, type) => logStore.addLog(msg, type), index + 1, question.title);
      if (skipAnswered && isAnswered) {
        ppLogAnswerSkipped((msg, type) => logStore.addLog(msg, type), index + 1);
        skippedCount += 1;
        question.skipped = true;
        questionStore.addQuestion(question);
        continue;
      }

      const answerData = await queryAnswer(question);

      if (answerData.code === 499) {
        aborted = true;
        break;
      }
      if (answerData.code === 200) {
        question.answer = answerData.data.answer;
        question.source = answerData.data.source;
        question.sourceName = answerData.data.sourceName || "";
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
          ppLogAnswerFilled((msg, type) => logStore.addLog(msg, type), index + 1, {
            source: answerData.data.source,
            cost: answerData.data.cost,
            num: answerData.data.num,
          });
        } else {
          failedCount += 1;
          question._fillFailed = true;
          ppLogAnswerFillFailed((msg, type) => logStore.addLog(msg, type), index + 1, "答案与页面选项对不上");
        }
        if (answerData.data.cost !== undefined) {
          progressStore.update({ remainingCount: answerData.data.num });
        }
      } else if (isReviewFailed(answerData)) {
        failedCount += 1;
        question._reviewFailed = true;
        question.source = "error";
        question.answer = reviewFailedAnswers(answerData);
        ppLogAnswerReviewFailed((msg, type) => logStore.addLog(msg, type), answerData);
      } else {

        if (answerData.code === 403 && answerData.data && answerData.data.limitedMode) {
          ppLogAnswerQueryFailed((msg, type) => logStore.addLog(msg, type), index + 1, answerData.msg);
          if (answerData.data.sponsorUrl) {
            logStore.addLog(`${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
          }
          question.source = "error";
          question.answer[0] = answerData.msg;
        } else if (answerData.code === 429 && answerData.data && answerData.data.limitedMode) {
          ppLogAnswerQueryFailed((msg, type) => logStore.addLog(msg, type), index + 1, "今日免费查题已达上限");
          logStore.addLog(`${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
          question.source = "error";
          question.answer[0] = answerData.msg;
        } else if (answerData.code === 403 && answerData.data && answerData.data.sponsorUrl) {
          const sponsorUrl = answerData.data.sponsorUrl;
          const sponsorLink = `<a href="${sponsorUrl}" target="_blank" style="color:#667eea;text-decoration:underline;">点我赞助获取新token</a>`;
          const msgHtml = answerData.msg.includes('[可切换赞助获取token，不限制账户]')
            ? answerData.msg.replace('[可切换赞助获取token，不限制账户]',
              `[<a href="${sponsorUrl}" target="_blank" style="color:#667eea;text-decoration:underline;">可切换赞助获取token，不限制账户</a>]`)
            : `${answerData.msg}，${sponsorLink}`;
          ppLogAnswerQueryFailed((msg, type) => logStore.addLog(msg, type), index + 1, msgHtml);
          question.source = "error";
          question.answer[0] = (answerData.data.answer && answerData.data.answer[0]) || answerData.msg;
        } else {
          ppLogAnswerQueryFailed((msg, type) => logStore.addLog(msg, type), index + 1, answerData.msg);
          if (answerData.data?.sponsorUrl) {
            logStore.addLog(`${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
          }
          question.source = "error";
          question.answer[0] = answerData.msg;
        }
      }
      questionStore.addQuestion(question);
      await (simulateDelay ? randomDelay(Number(answerInterval), 0.5) : delay(Number(answerInterval)));
    }

    ppLogAnswerSummary((msg, type) => logStore.addLog(msg, type), {
      handled: aborted ? filledCount + skippedCount + failedCount : answerTotal,
      filled: filledCount,
      skipped: skippedCount,
      failed: failedCount,
      total: answerTotal,
    });
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
      autoSubmit: readCxParamValue(PP_KEY.ANSWER, PP_KEY.AUTO_SUBMIT, false),
      filled: filledCount,
      total: answerTotal,
      skipped: skippedCount,
      canSubmit: hasSubmitBtn,
      canDraft: false,
      logRate: false,
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
    logStore.addLog(`检测到学习通作业页面`, "primary");
    logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");
    await new CxQuestionHandler("zy").init();
    if (ppCxHasCompletedAnswerState(document)) return;
    logStore.addLog("作业不自动提交：请检查已填入的答案后手动保存", "warning");
  };

  const answerExamPreview = async () => {
    if (ppCxHasCompletedAnswerState(document)) return;
    const logStore = useLogStore();
    logStore.addLog(`检测到学习通考试预览页面`, "primary");
    logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");
    await new CxQuestionHandler("ks").init();
    if (ppCxHasCompletedAnswerState(document)) return;
    logStore.addLog("考试不允许自动交卷：请检查答案后手动交卷", "warning");
    logStore.addLog("答题完成，请自行检查后保存或提交", "primary");
  };

  const useCxExamLogic = async () => {
    const logStore = useLogStore();
    const stopIfCompleted = () => {
      if (!ppCxHasCompletedAnswerState(document)) return false;
      _GM_setValue('pp_exam_sequential', false);
      return true;
    };
    if (stopIfCompleted()) return;

    const inSequentialMode = _GM_getValue('pp_exam_sequential', false);

    if (!inSequentialMode) {

      logStore.addLog(`检测到学习通考试页面`, "primary");
      logStore.addLog(`正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）`, "warning");

      const markInfo = _unsafeWindow.document.querySelector('.mark_info');
      const disallowPreview = markInfo?.textContent?.includes('不允许整卷预览');
      const jumpToPreview = readCxParamValue(PP_KEY.EXAM, PP_KEY.EXAM_PREVIEW, true);

      if (!disallowPreview && jumpToPreview) {

        logStore.addLog(`允许整卷预览，即将跳转到整卷预览页面`, "primary");
        await delay(3);
        if (stopIfCompleted()) return;
        _unsafeWindow.topreview();

        await delay(5);
        if (stopIfCompleted()) return;
        await answerExamPreview();
        return;
      }

      if (!disallowPreview) {
        logStore.addLog(`已关闭跳转整页答题，进入逐题答题模式`, "warning");
      } else {
        logStore.addLog(`当前考试不允许整卷预览，进入逐题答题模式`, "warning");
      }
      logStore.addLog(`在考完前禁止手动切换题目，否则会导致重复答题！`, "warning");
      _GM_setValue('pp_exam_sequential', true);
    }

    const autoSwitch = readCxParamValue(PP_KEY.EXAM, PP_KEY.AUTO_NEXT, true);

    logStore.addLog(`正在解析题目，请等待5s`, "warning");
    await new CxQuestionHandler("ks").init();
    if (stopIfCompleted()) return;
    logStore.addLog("考试不允许自动交卷：请检查答案后手动交卷", "warning");

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
    if (stopIfCompleted()) return;

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
    logStore.addLog("检测到学习通积分课页面", "warning");
    logStore.addLog("积分课请进入课程后，开启复习模式，并关闭自动切换", "warning");
    logStore.addLog("课程完成后请手动切换章节，自动跳转可能出现乱跳", "warning");
  };

  const useCxAutoReadLogic = async () => {
    const logStore = useLogStore();
    const configStore = useConfigStore();
    const currentUrl = window.location.href;

    if (!currentUrl.includes('/ztnodedetailcontroller/visitnodedetail')) {
      logStore.addLog(`检测到学习通课程目录页面`, "primary");
      await delay(2);
      const firstChapter = document.querySelector('.course_section .chapterText');
      if (firstChapter) {
        firstChapter.click();
      } else {
        logStore.addLog("未找到章节列表，请手动点击章节", "danger");
      }
      return;
    }

    logStore.addLog(`检测到学习通阅读页面`, "primary");
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

      const restartAfterFinish = readCxParamValue(PP_KEY.CHAPTER, PP_KEY.UNLIMITED_READ, false);
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
      __publicField(this, "init", async (isActive) => {
        if (!isActive()) return;
        this.questions = [];
        const progressStore = useProgressStore();
        const configStore = useConfigStore();

        const _answerParamsPart2 = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === PP_KEY.ANSWER);
        const skipAnswered = _answerParamsPart2?.params.find(p => p.name === PP_KEY.SKIP_ANSWERED)?.value || false;

        const getEditableQuestions = () => this.getZhsQuestionElements().filter((el) => !ppZhsHasOnlyDisabledAnswerControls(el));
        const waitForPageReady = async () => {
          const startedAt = Date.now();
          let visibleWaitStart = 0;
          let diagLogged = false;
          while (isActive() && Date.now() - startedAt < 5 * 60 * 1000) {
            const els = getEditableQuestions();
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
          return isActive() ? getEditableQuestions() : [];
        };

        this.addLog("等待页面加载完成，开始扫描任务点", "info");
        const readyElements = await waitForPageReady();
        if (!isActive()) return;
        if (!readyElements.length) {
          this.addLog("未解析到题目，请刷新重试或进入答题页面", "danger");
          return;
        }
        const answerTotal = readyElements.length;
        ppLogAnswerBegin((msg, type) => this.addLog(msg, type), { platform: "zhs", scene: "作业", total: answerTotal });
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
          if (finishedLogged || !isActive()) return;
          const els = getEditableQuestions();
          if (!els.length) return;
          const allHandled = els.every((el) => handled.has(this.zhsQuestionKey(el)));
          if (!allHandled) return;
          finishedLogged = true;
          this.answeredCount = filledCount;
          this.skippedCount = skippedCount;
          this.failedCount = failedCount;
          progressStore.update({
            filledCount,
            fillRate: computeFillRate(filledCount, answerTotal)
          });
          ppLogAnswerSummary((msg, type) => this.addLog(msg, type), {
            handled: filledCount + skippedCount + failedCount,
            filled: filledCount,
            skipped: skippedCount,
            failed: failedCount,
            total: answerTotal,
          });
          ppLogAnswerSubmitNote((msg, type) => this.addLog(msg, type), "manual");
          progressStore.update({
            questionIndex: answerTotal,
            percent: 100,
            isPlaying: false,
            detail: `已完成 ${answerTotal} 题`
          });
        };

        const clickNextQuestion = async () => {
          if (!isActive()) return false;
          const switchBtns = this._doc?.querySelectorAll(".switch-btn-box > button");
          const nextBtn = switchBtns && switchBtns[1];
          if (!nextBtn || nextBtn.disabled) return false;
          nextBtn.click();
          await afkWait(1200);
          return true;
        };

        const findPendingQuestion = () => {
          for (const el of getEditableQuestions()) {
            const key = this.zhsQuestionKey(el);
            if (!key || handled.has(key)) continue;
            const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
            if (rect && rect.width > 0 && rect.height > 0) return el;
          }
          return null;
        };

        const handleCurrentQuestion = async () => {
          if (running || !isActive()) return;
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
              while (isActive() && Date.now() - stemStartedAt < 60000 && !stem.html && !stem.text) {
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
            if (!isActive() || !el.isConnected || ppZhsHasOnlyDisabledAnswerControls(el)) return;
            const question = this.buildQuestion(el, stem);
            question.isActive = isActive;
            this.questions.push(question);

            ppLogAnswerQuestion((msg, type) => this.addLog(msg, type), label, question.title);
            if (skipAnswered && this.isZhsQuestionAnswered(question)) {
              ppLogAnswerSkipped((msg, type) => this.addLog(msg, type), label);
              skippedCount += 1;
              question.skipped = true;
              this.addQuestion(question);
              await clickNextQuestion();
              return;
            }

            const answerData = await queryAnswer(question);
            if (!isActive() || !el.isConnected || ppZhsHasOnlyDisabledAnswerControls(el)) return;
            if (answerData.code === 200) {
              question.answer = answerData.data.answer;
              question.source = answerData.data.source;
              question.sourceName = answerData.data.sourceName || "";

              this.addQuestion(question);

              await new Promise(r => setTimeout(r, 100));
              if (!isActive() || !el.isConnected || ppZhsHasOnlyDisabledAnswerControls(el)) return;

              const filledOk = (await this.applyAnswers(question)) === true;
              if (filledOk) {
                filledCount += 1;
                progressStore.update({
                  filledCount,
                  fillRate: computeFillRate(filledCount, answerTotal)
                });
                ppLogAnswerFilled((msg, type) => this.addLog(msg, type), label, {
                  source: answerData.data.source,
                  cost: answerData.data.cost,
                  num: answerData.data.num,
                });
              } else {
                failedCount += 1;
                question._fillFailed = true;
                ppLogAnswerFillFailed((msg, type) => this.addLog(msg, type), label, "答案与页面选项对不上");
              }
              if (answerData.data.cost !== undefined) {
                progressStore.update({ remainingCount: answerData.data.num });
              }
            } else if (isReviewFailed(answerData)) {
              failedCount += 1;
              question._reviewFailed = true;
              question.source = "error";
              question.answer = reviewFailedAnswers(answerData);
              ppLogAnswerReviewFailed((msg, type) => this.addLog(msg, type), answerData);
              this.addQuestion(question);
              await new Promise(r => setTimeout(r, 100));
            } else {
              ppLogAnswerQueryFailed((msg, type) => this.addLog(msg, type), label, answerData.msg);
              if (answerData.data?.sponsorUrl) {
                this.addLog(`${getSponsorLink(answerData.data.sponsorUrl, '点我赞助获取新token')}，可继续使用答题`, 'warning');
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
        if (!isActive()) return;
        const watcher = afkInterval(() => {
          if (!isActive()) {
            watcher.stop();
            return;
          }
          handleCurrentQuestion().catch(() => {});
        }, 800);
      });
      __publicField(this, "collectQuestions", () => {
        if (!this._doc)
          return [];
        const questionElements = this._doc.querySelectorAll(SELECTORS.ZHS_QUESTION);
        this.pushQuestions(questionElements);
      });
      __publicField(this, "applyAnswers", async (question) => {
        if (!this._win)
          return false;

        try {

          const typeNum = question.type;

          if (typeNum === "0" || typeNum === "1") {
            const configStore = useConfigStore();
            const useSimilarity = configStore.platformParams[configStore.platformName]?.parts.find(p => p.name === PP_KEY.ANSWER)?.params.find(p => p.name === PP_KEY.SIMILAR)?.value || false;

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
            return targetEls.length > 0 && Object.values(question.options).every(
              (option) => this.isZhsOptionSelected(option) === targetEls.includes(option)
            );
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
                  textarea.dispatchEvent(new Event("change", { bubbles: true }));
                  try {
                    const typed = String(answerText).slice(-1) || "Unidentified";
                    textarea.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: typed }));
                    textarea.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: typed }));
                  } catch (e) {}
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
              textareaElement.dispatchEvent(new Event("change", { bubbles: true }));
              try {
                const typed = String(answerText).slice(-1) || "Unidentified";
                textareaElement.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: typed }));
                textareaElement.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: typed }));
              } catch (e) {}
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
      return optionElement.matches("input:checked") ||
             !!optionElement.querySelector("input:checked") ||
             optionElement.classList.contains("cur") ||
             optionElement.classList.contains("selected") ||
             !!optionElement.querySelector(".onChecked") ||
             !!optionElement.querySelector(".cur") ||
             !!optionElement.querySelector(".selected");
    }
    pushQuestions(questionElements) {
      questionElements.forEach((questionElement) => {
        this.questions.push(this.buildQuestion(questionElement));
      });
    }
    getZhsQuestionElements() {
      try {
        return this._doc ? Array.from(this._doc.querySelectorAll(SELECTORS.ZHS_QUESTION)) : [];
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
        const htmlLen = sd ? String(sd.innerHTML || "").length : 0;
        let bridged = "";
        try {
          bridged = questionElement && questionElement.getAttribute ? questionElement.getAttribute("data-pp-stem") || "" : "";
        } catch (e) {}
        return `bridge=${bridged ? "有" : "无"} ivue=${vm ? "有" : "无"} shadow=${sd ? "有" : "无"} htmlLen=${htmlLen}`;
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

      const numericType = this.typeCodeMap.get(fullQuestionType) || "999";

      const [optionNodeMap, optionTexts] = this.collectOptionNodes(questionElement == null ? void 0 : questionElement.querySelectorAll(SELECTORS.ZHS_OPTION), ".node_detail");
      return {
        element: questionElement,
        type: numericType,
        title: questionTitle,
        titleHtml: questionTitleHtml,
        optionsText: optionTexts,
        options: optionNodeMap,
        answer: [],
        workType: "zhs",
        refer: this._win.location.href,
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
        return `idx${Array.prototype.indexOf.call(this._doc.querySelectorAll(SELECTORS.ZHS_QUESTION), questionElement)}`;
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

  const useZhsAnswerLogic = async (isActive) => {
    if (!isActive()) return;
    ppfxGuardTrustTimers();
    const logStore = useLogStore();
    if (!zhStudyTuning().answerOn) {
      logStore.addLog("当前为「仅视频」模式，已跳过智慧树答题", "warning");
      return;
    }
    logStore.addLog("检测到智慧树答题页面", "primary");
    await new ZhsQuestionHandler().init(isActive);
  };

  const PP_ZH_H5_SELECTORS = {
    root: ".questionContent",
    label: ".questionTitle",
    stem: ".questionName .centent-pre",
    singleOptions: "ul.radio-view > li.clearfix, .el-radio",
    multiOptions: ".checkbox-view .el-checkbox, .checkbox-views .el-checkbox, .el-checkbox-group .el-checkbox",
    next: ".pre-next .next-topic"
  };

  const ppZhH5Root = () => zhPick(PP_ZH_H5_SELECTORS.root);
  const ppZhH5StemText = (root) => zhTxtOf(zhPick(PP_ZH_H5_SELECTORS.stem, root));
  const ppZhH5NumberText = (root) => zhTxtOf(zhPick(".letterSortNum", root));
  const ppZhH5Tag = (root) => (root ? `${ppZhH5NumberText(root)}|${ppZhH5StemText(root)}` : "");
  const ppZhH5Total = () => {
    const text = zhTxtOf(zhPick(".left-H")) || zhTxtOf(zhPick(".header-content"));
    const matched = text.match(/[（(]\s*(\d+)\s*题\s*[)）]/);
    return matched ? parseInt(matched[1], 10) : 0;
  };

  const ppZhTypeCodeOf = (label) => ppTypeCodeOf(label);

  const ppZhH5TypeCode = (root) => {
    const label = zhTxtOf(zhPick(PP_ZH_H5_SELECTORS.label, root)) || ppZhH5NumberText(root);
    return ppZhTypeCodeOf(label);
  };

  const ppZhH5OptionText = (node) => {
    const box = zhPick(".stem", node) || zhPick(".el-checkbox__label", node) || node;
    try {
      const copy = box.cloneNode(true);
      copy.querySelectorAll(".letterSort").forEach((badge) => badge.remove());
      return (copy.textContent || "").replace(/\s+/g, " ").trim();
    } catch (e) {
      return zhTxtOf(box);
    }
  };

  const ppZhH5OptionNodes = (root, typeCode) => {
    const readable = (node) => Boolean(zhTxtOf(node));
    if (typeCode === "1") return zhPickAll(PP_ZH_H5_SELECTORS.multiOptions, root).filter(readable);
    if (typeCode === "0" || typeCode === "3") return zhPickAll(PP_ZH_H5_SELECTORS.singleOptions, root).filter(readable);
    const both = zhPickAll(
      `${PP_ZH_H5_SELECTORS.singleOptions}, ${PP_ZH_H5_SELECTORS.multiOptions}`,
      root
    ).filter(readable);
    return both;
  };

  const ppZhH5Picked = (node) => {
    try {
      if (node.classList.contains("is-checked") || node.classList.contains("checked")) return true;
      if (node.querySelector("input:checked")) return true;
      const tick = node.querySelector("i.checkIcon");
      if (tick && String(tick.className).indexOf("checkedIcon") >= 0) return true;
    } catch (e) {}
    return false;
  };

  const ppZhH5Press = async (node) => {
    if (!node) return false;
    try { node.scrollIntoView({ block: "center", inline: "nearest" }); } catch (e) {}
    const before = ppZhH5Picked(node);
    try { node.click(); } catch (e) {}
    await afkWait(120);
    if (ppZhH5Picked(node) !== before) return true;
    try { node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); } catch (e) {}
    await afkWait(120);
    return true;
  };

  const ppZhH5Indexes = (options, value, typeCode) => {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return [];
    if (typeCode === "3") {
      const want = ppJudgeKey(raw);
      if (want) {
        const at = options.findIndex((item) => ppJudgeKey(item.text) === want);
        if (at >= 0) return [at];
      }
    }
    const compact = raw.replace(/[\s,，、.。．;；:：/\\|]+/g, "");
    if (/^[A-Ha-h]{1,8}$/.test(compact) && compact.length <= options.length) {
      const picked = [];
      for (const ch of compact.toUpperCase()) {
        const idx = ch.charCodeAt(0) - 65;
        if (idx >= 0 && idx < options.length) picked.push(idx);
      }
      if (picked.length) return Array.from(new Set(picked));
    }
    const hit = matchOptionIndex(options, raw);
    return hit >= 0 ? [hit] : [];
  };

  const ppZhH5WriteText = (root, answers) => {
    const fields = zhPickAll(".fillAnswer input, .fillAnswer textarea, textarea, input.el-input__inner, input[type='text'], [contenteditable='true']", root)
      .filter((field) => !/checkbox|radio/i.test(String(field.type || "")));
    if (!fields.length) return false;
    let written = 0;
    fields.forEach((field, index) => {
      const text = String(answers[index] == null ? answers[0] : answers[index] == null ? "" : answers[index])
        .replace(/<[^>]+>/g, "")
        .trim();
      if (!text) return;
      try {
        if (field.isContentEditable) {
          field.textContent = text;
        } else {
          const proto = field.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
          if (setter) setter.call(field, text); else field.value = text;
        }
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
        try {
          const typed = text.slice(-1) || "Unidentified";
          field.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: typed }));
          field.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: typed }));
        } catch (e) {}
        written += 1;
      } catch (e) {}
    });
    return written > 0;
  };

  const ppZhH5Next = async () => {
    const btn = zhPick(PP_ZH_H5_SELECTORS.next);
    if (!btn || /noNext|disabled|nopre/.test(String(btn.className))) return false;
    const before = ppZhH5Tag(ppZhH5Root());
    btn.click();
    const startedAt = Date.now();
    while (Date.now() - startedAt < 6000) {
      await afkWait(200);
      const after = ppZhH5Tag(ppZhH5Root());
      if (after && after !== before) return true;
    }
    return false;
  };

  const zhAnswerFlow = async (cfg) => {
    const runUrl = window.location.href;
    const isActive = () => window.location.href === runUrl && !ppIsZhsReadOnlyPage(runUrl);
    if (!isActive() || window[cfg.busyKey]) return;
    window[cfg.busyKey] = true;
    const logStore = useLogStore();
    const progressStore = useProgressStore();
    const questionStore = useQuestionStore();
    try {
      if (!zhStudyTuning().answerOn) {
        logStore.addLog("当前为「仅视频」模式，已跳过智慧树答题", "warning");
        return;
      }
      const waitStart = Date.now();
      while (isActive() && cfg.waitRootMs && Date.now() - waitStart < cfg.waitRootMs && !cfg.findRoot()) await afkWait(250);
      if (!isActive()) return;
      if (!cfg.findRoot()) {
        logStore.addLog(cfg.notFoundLog, "danger");
        return;
      }

      const configStore = useConfigStore();
      const answerParams = configStore.platformParams?.[configStore.platformName]?.parts.find((part) => part.name === PP_KEY.ANSWER);
      const skipAnswered = answerParams?.params.find((param) => param.name === PP_KEY.SKIP_ANSWERED)?.value || false;

      const roots = cfg.collectRoots?.();
      let rootIndex = 0;
      const advance = () => {
        if (!isActive()) return false;
        if (!roots) return cfg.next();
        rootIndex += 1;
        return rootIndex < roots.length;
      };
      const total = roots ? roots.length : cfg.total?.() || 0;
      ppLogAnswerBegin(logStore.addLog, { platform: "zhs", scene: cfg.scene || "答题", total });
      if (cfg.onStart) cfg.onStart({ total, progressStore });

      let handled = 0;
      let filled = 0;
      let skipped = 0;
      let failed = 0;
      const seen = new Set();

      const maxSteps = roots ? Math.max(cfg.maxSteps || 200, roots.length * 22) : cfg.maxSteps || 200;
      for (let step = 0; step < maxSteps; step += 1) {
        if (!isActive()) return;
        const root = roots ? roots[rootIndex] : cfg.findRoot();
        if (roots && root?.isConnected === false) {
          if (!advance()) break;
          continue;
        }
        if (!root) {
          await afkWait(300);
          continue;
        }
        let stem = cfg.getStem(root);
        if (!stem) {
          const proceed = cfg.awaitStem ? await cfg.awaitStem(root) : false;
          if (!proceed) {
            await afkWait(cfg.stemRetryMs || 250);
            continue;
          }
          stem = cfg.getStem(root);
          if (!stem) {
            if (!roots || !advance()) break;
            continue;
          }
        }
        if (!isActive()) return;
        const typeCode = cfg.getTypeCode(root);
        const options = cfg.getOptions(root, typeCode);
        const key = roots ? root : cfg.getKey(root, stem, options, typeCode);
        if (seen.has(key)) break;
        seen.add(key);
        handled += 1;

        if (cfg.onStepReady) cfg.onStepReady({ root, stem });
        progressStore.update(cfg.perQuestion({ handled, total }));
        ppLogAnswerQuestion(logStore.addLog, handled, stem);

        const answered = (cfg.isExtraAnswered ? cfg.isExtraAnswered(root) : false) || options.some(cfg.isPicked);
        if (skipAnswered && answered) {
          skipped += 1;
          if (cfg.recordSkipped) {
            questionStore.addQuestion({
              element: root,
              html: root.outerHTML,
              workType: "zhs",
              refer: location.href,
              type: typeCode,
              title: stem,
              optionsText: options.map((el, idx) => cfg.getOptionText(el, idx)),
              skipped: true
            });
          }
          ppLogAnswerSkipped(logStore.addLog, handled);
          if (!(await advance())) break;
          continue;
        }

        const question = {
          element: root,
          html: root.outerHTML,
          workType: "zhs",
          refer: runUrl,
          isActive,
          type: typeCode,
          title: stem,
          optionsText: options.map((el, idx) => cfg.getOptionText(el, idx))
        };

        let answerData = null;
        try {
          answerData = await queryAnswer(question);
        } catch (error) {
          answerData = null;
        }
        if (!isActive()) return;
        if (root.isConnected === false) {
          if (!roots || !advance()) break;
          continue;
        }

        if (answerData && answerData.code === 200) {
          const rawAnswers = answerData.data?.answer;
          const answers = Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers];
          let ok = false;
          if (typeCode === "0" || typeCode === "1" || typeCode === "3") {
            const list = options.map((el, idx) => ({ text: cfg.getOptionText(el, idx), el }));
            const wanted = new Set();
            answers.forEach((ans) => ppZhH5Indexes(list, ans, typeCode).forEach((idx) => wanted.add(idx)));
            if (wanted.size) {
              if (typeCode === "1") {
                for (let i = 0; i < options.length; i += 1) {
                  if (!isActive()) return;
                  if (cfg.isPicked(options[i]) !== wanted.has(i)) {
                    await cfg.pick(options[i]);
                    if (cfg.pickGapMs) await afkWait(cfg.pickGapMs);
                  }
                }
              } else {
                const target = options[Array.from(wanted)[0]];
                if (target && !cfg.isPicked(target)) await cfg.pick(target);
              }
              ok = options.every((option, index) => cfg.isPicked(option) === wanted.has(index));
            }
          } else {
            ok = cfg.writeText(root, answers.map((ans) => String(ans == null ? "" : ans)));
          }
          if (ok) {
            filled += 1;
            ppLogAnswerFilled(logStore.addLog, handled, {
              source: answerData.data?.source,
              cost: cfg.showCost ? answerData.data?.cost : undefined,
              num: answerData.data?.num,
            });
          } else {
            failed += 1;
            const isChoice = typeCode === "0" || typeCode === "1" || typeCode === "3";
            const reason = isChoice
              ? (answers.length ? "答案与页面选项对不上" : "未返回答案")
              : (cfg.fillFailLog || "未匹配到可点击选项");
            ppLogAnswerFillFailed(logStore.addLog, handled, reason);
          }
          question.answer = answers;
          question.source = answerData.data?.source || "";
          questionStore.addQuestion(question);
        } else if (isReviewFailed(answerData)) {
          failed += 1;
          question._reviewFailed = true;
          question.answer = reviewFailedAnswers(answerData);
          question.source = "error";
          questionStore.addQuestion(question);
          ppLogAnswerReviewFailed(logStore.addLog, answerData);
        } else {
          failed += 1;
          const msg = answerData && answerData.msg ? answerData.msg : "查询失败";
          question.answer = [msg];
          question.source = "error";
          questionStore.addQuestion(question);
          ppLogAnswerQueryFailed(logStore.addLog, handled, msg);
        }

        if (!(await advance())) break;
        if (cfg.stepGapMs) await afkWait(cfg.stepGapMs);
      }

      if (isActive()) cfg.onFinish({ handled, filled, skipped, failed, total, progressStore, logStore });
    } catch (error) {
      logStore.addLog(`智慧树答题出错：${error && error.message ? error.message : error}`, "danger");
    } finally {
      window[cfg.busyKey] = false;
      if (!isActive()) progressStore.update({ isPlaying: false, detail: "已停止查题" });
    }
  };

  const ZH_PAPER_API_TAGS = ["getExamSheetInfo", "getExamQuestionInfo"];
  const ZH_PAPER_CACHE_KEY = "__ppZhPaperCache";
  const ZH_PAPER_CACHE_LIMIT = 24;
  const ZH_PAPER_TYPE_CODES = { 1: "0", 2: "1", 3: "3", 4: "2", 5: "4", 14: "3" };

  const ppZhPaperCache = () => {
    const win = _unsafeWindow || window;
    let cache = null;
    try { cache = win[ZH_PAPER_CACHE_KEY]; } catch (e) { cache = null; }
    if (!cache || typeof cache !== "object") cache = {};
    if (!Array.isArray(cache.questions)) cache.questions = [];
    if (!(Number(cache.sheetTotal) > 0)) cache.sheetTotal = 0;
    try { win[ZH_PAPER_CACHE_KEY] = cache; } catch (e) {}
    return cache;
  };

  const ppZhApiText = (value) => String(value == null ? "" : value).replace(/\s+/g, " ").trim();

  const ppZhApiKey = (value) => ppZhApiText(value)
    .replace(/[\s，。！？；：、（）【】《》〈〉「」『』,.:;!?'"()[\]<>·…—-]/g, "")
    .toLowerCase();

  const ppZhSheetTotalOf = (payload) => {
    if (!payload || typeof payload !== "object") return 0;
    const direct = Number(payload.questionCount);
    if (direct > 0) return direct;
    const parts = Array.isArray(payload.partSheetVos) ? payload.partSheetVos : [];
    let sum = 0;
    parts.forEach((part) => {
      if (!part || typeof part !== "object") return;
      const list = Array.isArray(part.questionSheetVos) ? part.questionSheetVos : [];
      if (list.length) {
        sum += list.length;
        return;
      }
      const count = Number(part.questionCount);
      if (count > 0) sum += count;
    });
    return sum;
  };

  const ppZhApiOptionsOf = (payload) => {
    if (!payload || typeof payload !== "object") return [];
    const list = payload.optionVos || payload.questionOptions || payload.optionList || payload.options;
    if (!Array.isArray(list)) return [];
    return list
      .slice()
      .sort((a, b) => (Number(a && a.sort) || 0) - (Number(b && b.sort) || 0))
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string") return ppZhApiText(item).replace(/^[A-Za-z][.、．)）]\s*/, "");
        const body = item.content || item.option || item.optionContent || item.text || item.name || "";
        return ppZhApiText(body).replace(/^[A-Za-z][.、．)）]\s*/, "");
      })
      .filter(Boolean);
  };

  const ppZhApiTypeCodeOf = (info) => {
    if (!info) return "";
    const byName = ppTypeCodeOf(info.typeName || "");
    if (byName && byName !== "999") return byName;
    const code = ZH_PAPER_TYPE_CODES[String(info.typeCode == null ? "" : info.typeCode)];
    return code || "";
  };

  const ppZhTakePaperPayload = (address, text) => {
    if (!text) return;
    let raw = null;
    try { raw = typeof text === "string" ? JSON.parse(text) : text; } catch (e) { return; }
    if (!raw || typeof raw !== "object") return;
    const payload = raw.data && typeof raw.data === "object" ? raw.data : raw;
    if (!payload || typeof payload !== "object") return;
    const url = String(address == null ? "" : address);
    const cache = ppZhPaperCache();
    if (url.indexOf("getExamSheetInfo") >= 0) {
      const total = ppZhSheetTotalOf(payload);
      if (total > 0) cache.sheetTotal = total;
      return;
    }
    if (url.indexOf("getExamQuestionInfo") < 0) return;
    const stem = ppZhApiText(payload.content || payload.questionContent || payload.stem || "");
    const options = ppZhApiOptionsOf(payload);
    if (!stem && !options.length) return;
    const info = {
      stem,
      typeName: ppZhApiText(payload.questionTypeName || payload.questionTypeStr || ""),
      typeCode: payload.questionType,
      options
    };
    const key = ppZhApiKey(stem);
    cache.questions = cache.questions.filter((item) => ppZhApiKey(item && item.stem) !== key);
    cache.questions.push(info);
    if (cache.questions.length > ZH_PAPER_CACHE_LIMIT) {
      cache.questions.splice(0, cache.questions.length - ZH_PAPER_CACHE_LIMIT);
    }
  };

  const installZhPaperProbe = () => {
    const win = _unsafeWindow || window;
    if (!win || win.__ppZhPaperProbe) return;
    try { win.__ppZhPaperProbe = true; } catch (e) { return; }
    ppZhPaperCache();
    const wanted = (address) => {
      const text = String(address == null ? "" : address);
      return ZH_PAPER_API_TAGS.some((tag) => text.indexOf(tag) >= 0);
    };
    try {
      const nativeFetch = win.fetch;
      if (typeof nativeFetch === "function") {
        win.fetch = function (...args) {
          const pending = nativeFetch.apply(this, args);
          try {
            const input = args[0];
            const address = input && typeof input === "object" ? input.url || "" : input;
            if (wanted(address) && pending && typeof pending.then === "function") {
              pending
                .then((response) => {
                  try { return response.clone().text(); } catch (e) { return ""; }
                })
                .then((text) => ppZhTakePaperPayload(address, text))
                .catch(() => {});
            }
          } catch (e) {}
          return pending;
        };
      }
    } catch (e) {}
    try {
      const NativeXhr = win.XMLHttpRequest;
      if (typeof NativeXhr === "function" && !NativeXhr.__ppZhPaperProbe) {
        NativeXhr.__ppZhPaperProbe = true;
        const nativeSend = NativeXhr.prototype.send;
        NativeXhr.prototype.send = function (...args) {
          try {
            this.addEventListener("load", function () {
              try {
                const address = String(this.responseURL || "");
                if (wanted(address)) ppZhTakePaperPayload(address, this.responseText);
              } catch (e) {}
            });
          } catch (e) {}
          return nativeSend.apply(this, args);
        };
      }
    } catch (e) {}
  };

  const ppZhPaperInfoOf = (stem) => {
    const key = ppZhApiKey(stem);
    if (!key) return null;
    const cache = ppZhPaperCache();
    for (let i = cache.questions.length - 1; i >= 0; i -= 1) {
      const item = cache.questions[i];
      if (item && ppZhApiKey(item.stem) === key) return item;
    }
    return null;
  };

  const ppZhPaperTotal = () => {
    const total = Number(ppZhPaperCache().sheetTotal);
    return total > 0 ? total : 0;
  };

  const zhPaperClean = (value) => String(value == null ? "" : value).replace(/\s+/g, " ").trim();

  const zhPaperTextOf = (scope, selectors) => {
    if (!scope) return "";
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const selector of list) {
      if (!selector) continue;
      let el = null;
      try { el = scope.querySelector(selector); } catch (e) { el = null; }
      const text = el ? zhPaperClean(el.textContent) : "";
      if (text) return text;
    }
    return "";
  };

  const zhPaperButtons = () => Array.from(document.querySelectorAll("button"));

  const ZH_PAPER_CARD_SELECTORS = [".grid.grid-cols-7 > button", ".custom-tree-answer-normal", ".answer-card button"];

  const zhPaperCardNodes = () => {
    const nodes = [];
    ZH_PAPER_CARD_SELECTORS.forEach((selector) => {
      try {
        nodes.push.apply(nodes, Array.from(document.querySelectorAll(selector)));
      } catch (e) {}
    });
    return nodes;
  };

  const zhPaperCardNumbers = () => zhPaperCardNodes()
    .concat(zhPaperButtons())
    .map((node) => zhPaperClean(node.textContent))
    .filter((text) => /^\d+$/.test(text))
    .map((text) => Number(text));

  const zhPaperFirstCard = () => {
    const numeric = zhPaperCardNodes().filter((node) => /^\d+$/.test(zhPaperClean(node.textContent)));
    if (numeric.length >= 2) {
      const first = numeric.find((node) => zhPaperClean(node.textContent) === "1");
      if (first) return first;
    }
    const buttons = zhPaperButtons().filter((btn) => /^\d+$/.test(zhPaperClean(btn.textContent)));
    if (buttons.length < 3) return null;
    return buttons.find((btn) => zhPaperClean(btn.textContent) === "1") || null;
  };

  const zhPaperCurrentNumber = (profile) => {
    if (!profile || typeof profile.number !== "function") return "";
    let root = null;
    for (const selector of profile.roots) {
      try {
        root = document.querySelector(selector);
      } catch (e) {
        root = null;
      }
      if (root) break;
    }
    if (!root) return "";
    const scope = profile.scope ? profile.scope(root) : root;
    const matched = String(profile.number(scope) || "").match(/^\s*(\d+)/);
    return matched ? matched[1] : "";
  };

  const zhPaperJumpToFirst = async (profile) => {
    const readNumber = () => (profile && typeof profile.number === "function" ? zhPaperCurrentNumber(profile) : "");
    const readSignature = () => (profile && typeof profile.signature === "function" ? profile.signature() : "");
    const card = zhPaperFirstCard();
    if (!card) return;
    const beforeNumber = readNumber();
    if (beforeNumber === "1") return;
    const beforeSignature = readSignature();
    try {
      card.click();
    } catch (e) {
      return;
    }
    const deadline = beforeNumber === "" ? 2500 : 8000;
    const startedAt = Date.now();
    while (Date.now() - startedAt < deadline) {
      await afkWait(250);
      if (readNumber() === "1") return;
      const now = readSignature();
      if (now && now !== beforeSignature) return;
    }
  };

  const zhPaperRewindMastery = async (profile) => {
    const runUrl = window.location.href;
    if (!document.querySelector(".pre-next .pre-topic")) {
      await zhPaperJumpToFirst(profile);
      return;
    }
    for (let step = 0; step < 200 && window.location.href === runUrl; step += 1) {
      const number = Number(zhPaperCurrentNumber(profile));
      const prev = document.querySelector(".pre-next .pre-topic");
      if (number <= 1 || !prev || prev.disabled || prev.classList.contains("noPre")) return;
      prev.click();
      let updated = false;
      for (let attempt = 0; attempt < 10 && window.location.href === runUrl; attempt += 1) {
        await afkWait(100);
        const nextNumber = Number(zhPaperCurrentNumber(profile));
        if (nextNumber > 0 && nextNumber < number) {
          updated = true;
          break;
        }
      }
      if (!updated) return;
    }
  };

  const zhPaperPicked = (node) => {
    try {
      if (!node) return false;
      if (ppZhH5Picked(node)) return true;
      if (node.getAttribute("aria-checked") === "true") return true;
      if (node.querySelector("input:checked")) return true;
      const cls = String(node.className || "");
      if (/(^|\s)(is-checked|checked|selected|active)(\s|$)/.test(cls)) return true;
      const tailwind = (el) => {
        const value = String((el && el.className) || "");
        return /(^|\s)(bg-mainBg|border-mainBg)(\/\d+)?(\s|$)/.test(value) || /(^|\s)(is-checked|is-selected)(\s|$)/.test(value);
      };
      if (tailwind(node)) return true;
      if (Array.from(node.querySelectorAll("div, span")).some(tailwind)) return true;
      const spanCls = String((node.querySelector("span") || {}).className || "");
      return /(^|\s)text-mainBg(\s|$)/.test(spanCls);
    } catch (e) {
      return false;
    }
  };

  const zhPaperPress = async (node) => {
    if (!node) return false;
    try { node.scrollIntoView({ block: "center", inline: "nearest" }); } catch (e) {}
    const before = zhPaperPicked(node);
    try { node.click(); } catch (e) {}
    await afkWait(140);
    if (zhPaperPicked(node) !== before) return true;
    try { node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); } catch (e) {}
    await afkWait(140);
    return true;
  };

  const zhPaperGoNext = async (profile) => {
    let btn = null;
    try { btn = profile && profile.nextButton ? profile.nextButton() : null; } catch (e) { btn = null; }
    if (!btn) {
      btn = zhPaperButtons().find((item) => !item.disabled && zhPaperClean(item.textContent).indexOf("下一题") >= 0) || null;
    }
    if (!btn || btn.disabled || /disabled|noNext/.test(String(btn.className || ""))) return false;
    const before = profile && profile.signature ? profile.signature() : "";
    try { btn.click(); } catch (e) { return false; }
    const startedAt = Date.now();
    while (Date.now() - startedAt < 6000) {
      await afkWait(200);
      const after = profile && profile.signature ? profile.signature() : "";
      if (after && after !== before) return true;
    }
    return false;
  };

  const ZH_EXAMLOOP_STEM = [
    "div.flex-1 .mb-\\[32px\\] .text-mainText.font-medium",
    ".text-mainText.font-medium",
    "[class*='text-mainText'][class*='font-medium']",
    "[class*='question'][class*='title']"
  ];

  const zhExamLoopScope = (root) => (root ? root.querySelector(":scope > .flex-1") || root : null);

  const zhExamLoopStem = (scope) => {
    if (!scope) return "";
    for (const selector of ZH_EXAMLOOP_STEM) {
      let el = null;
      try { el = scope.querySelector(selector); } catch (e) { el = null; }
      const text = el ? zhPaperClean(el.textContent) : "";
      if (text && !/^\d+\s*[、.．]$/.test(text)) return text;
    }
    return "";
  };

  const zhExamLoopTypeText = (scope) => {
    if (!scope) return "";
    return Array.from(scope.querySelectorAll("span"))
      .map((el) => zhPaperClean(el.textContent))
      .find((text) => /^(单选题|多选题|判断题|填空题|简答题|名词解释|论述题|计算题|多项选择|不定项)/.test(text)) || "";
  };

  const zhExamLoopNumber = (scope) => {
    if (!scope) return "";
    const first = Array.from(scope.querySelectorAll("span"))
      .map((el) => zhPaperClean(el.textContent))
      .find((text) => /^\d+\s*[、.]/.test(text));
    const matched = first && first.match(/^(\d+)/);
    return matched ? matched[1] : "";
  };

  const zhExamLoopOptionNodes = (scope) => {
    if (!scope) return [];
    const box = scope.querySelector("label")?.parentElement || scope;
    return box ? Array.from(box.querySelectorAll(":scope > label")) : [];
  };

  const zhExamLoopOptionText = (label) => {
    if (!label) return "";
    const span = label.querySelector("span");
    return zhPaperClean((span || label).textContent);
  };

  const zhExamLoopCardState = (number) => {
    try {
      const key = String(number || "").trim();
      if (!key) return "";
      const btn = zhPaperButtons().find((item) => zhPaperClean(item.textContent) === key);
      if (!btn) return "";
      const cls = String(btn.className || "");
      if (/bg-mainBg\/10/.test(cls)) return "answered";
      if (/(^|\s)bg-mainBg(\s|$)/.test(cls)) return "current";
      return "empty";
    } catch (e) {
      return "";
    }
  };

  const ZH_PAPER_PROFILES = [
    {
      id: "examloop",
      name: "新形态考试",
      roots: [".question-area-content"],
      prepare: zhPaperJumpToFirst,
      scope: zhExamLoopScope,
      stem: zhExamLoopStem,
      typeCode: (scope) => ppZhTypeCodeOf(zhExamLoopTypeText(scope)),
      optionNodes: zhExamLoopOptionNodes,
      optionText: zhExamLoopOptionText,
      nextButton: () => {
        const btn = zhPaperButtons().find((item) => zhPaperClean(item.textContent) === "下一题");
        return btn && !btn.disabled && !/disabled/.test(String(btn.className || "")) ? btn : null;
      },
      signature: () => {
        const scope = zhExamLoopScope(document.querySelector(".question-area-content"));
        if (!scope) return "";
        return [zhExamLoopStem(scope), zhExamLoopOptionNodes(scope).map(zhExamLoopOptionText).join("|")].join("#");
      },
      extraAnswered: (root) => zhExamLoopCardState(zhExamLoopNumber(zhExamLoopScope(root))) === "answered",
      number: zhExamLoopNumber,
      pickGapMs: 120,
    },
    {
      id: "questionbox",
      name: "新形态作业考试",
      roots: [".questionBox"],
      prepare: zhPaperJumpToFirst,
      stem: (scope) => zhPaperTextOf(scope, [".questionContent"]),
      typeCode: (scope) => ppZhTypeCodeOf(zhPaperTextOf(scope, [".questionTit"])),
      optionNodes: (scope) => (scope ? Array.from(scope.querySelectorAll(".optionUl label")) : []),
      optionText: (node) => zhPaperClean((node || {}).textContent || ""),
      nextButton: () => document.querySelector("span.Topicswitchingbtn:nth-child(2)"),
      number: (scope) => zhPaperTextOf(scope, [".questionTit", ".questionNumber", ".questionName"]),
      signature: () => {
        const root = document.querySelector(".questionBox");
        if (!root) return "";
        const options = Array.from(root.querySelectorAll(".optionUl label")).map((node) => zhPaperClean(node.textContent));
        return [zhPaperTextOf(root, [".questionContent"]), options.join("|")].join("#");
      },
    },
    {
      id: "paper",
      name: "作业/考试",
      roots: [".questionContent"],
      prepare: zhPaperRewindMastery,
      stem: (scope) => (scope ? ppZhH5StemText(scope) : ""),
      typeCode: (scope) => (scope ? ppZhH5TypeCode(scope) : "999"),
      optionNodes: (scope, typeCode) => (scope ? ppZhH5OptionNodes(scope, typeCode) : []),
      optionText: (node) => ppZhH5OptionText(node),
      nextButton: () => {
        const btn = document.querySelector(".pre-next .next-topic");
        return btn && !/noNext|disabled/.test(String(btn.className || "")) ? btn : null;
      },
      signature: () => {
        const root = document.querySelector(".questionContent");
        return root ? ppZhH5Tag(root) : "";
      },
      number: (scope) => zhPaperTextOf(scope, [".letterSortNum", ".questionTitle"]),
      pickGapMs: 150,
      showCost: true
    },
    {
      id: "examitem",
      name: "AI掌握度",
      roots: [".exam-item"],
      collectRoots: () => Array.from(document.querySelectorAll(".exam-item")),
      stem: (scope) => zhPaperTextOf(scope, [".quest-title .option-name", ".quest-title"]),
      typeCode: (scope) => ppZhTypeCodeOf(zhPaperTextOf(scope, [".quest-type"])),
      optionNodes: (scope) => (scope ? Array.from(scope.querySelectorAll("label")) : []),
      optionText: (node) => zhPaperClean((node || {}).textContent || ""),
    }
  ];

  const useZhsPaperAnswerLogic = async () => {
    const runUrl = window.location.href;
    const isActive = () => window.location.href === runUrl && !ppIsZhsReadOnlyPage(runUrl);
    if (!isActive() || window.__ppZhPaperBusy) return;
    installZhPaperProbe();
    let profile = null;
    let stemWaits = 0;
    let currentInfo = null;
    let domOptionCount = 0;

    const matchProfile = () => ZH_PAPER_PROFILES.find((item) => item.roots.some((selector) => {
      try { return Boolean(document.querySelector(selector)); } catch (e) { return false; }
    })) || null;

    const findRoot = () => {
      profile = matchProfile();
      if (!profile) return null;
      for (const selector of profile.roots) {
        let el = null;
        try { el = document.querySelector(selector); } catch (e) { el = null; }
        if (el) return el;
      }
      return null;
    };

    if (zhStudyTuning().answerOn) {
      const startedAt = Date.now();
      while (Date.now() - startedAt < 30000 && isActive() && !findRoot()) await afkWait(250);
      if (!isActive()) return;
      if (profile && typeof profile.prepare === "function") {
        try { await profile.prepare(profile); } catch (e) {}
        findRoot();
      }
    }

    const scopeOf = (root) => (profile && profile.scope ? profile.scope(root) : root);

    const rememberApi = (root) => {
      const scope = scopeOf(root);
      const stem = profile && scope ? profile.stem(scope) : "";
      currentInfo = ppZhPaperInfoOf(stem);
      return currentInfo;
    };

    if (!isActive()) return;
    await zhAnswerFlow({
      busyKey: "__ppZhPaperBusy",
      findRoot,
      collectRoots: () => profile?.collectRoots?.(),
      notFoundLog: "未识别到智慧树题目区域，请刷新页面或手动进入答题页",
      detectLog: () => `检测到智慧树答题页面（${profile ? profile.name : "通用"}）`,
      scene: profile && /考试/.test(profile.name) ? "考试" : profile && /作业/.test(profile.name) ? "作业" : "答题",
      total: () => {
        const byApi = ppZhPaperTotal();
        if (byApi > 0) return byApi;
        const byHeader = ppZhH5Total();
        if (byHeader > 0) return byHeader;
        const numbers = zhPaperCardNumbers();
        return numbers.length ? Math.max(...numbers) : 0;
      },
      getStem: (root) => {
        const scope = scopeOf(root);
        return profile && scope ? profile.stem(scope) : "";
      },
      awaitStem: (root) => {
        const scope = scopeOf(root);
        if (profile && scope && profile.stem(scope)) return true;
        if (stemWaits < 20) {
          stemWaits += 1;
          return false;
        }
        return true;
      },
      stemRetryMs: 200,
      onStepReady: ({ root }) => {
        stemWaits = 0;
        rememberApi(root);
      },
      getOptions: (root, typeCode) => {
        rememberApi(root);
        const scope = scopeOf(root);
        const nodes = profile && scope ? profile.optionNodes(scope, typeCode) : [];
        domOptionCount = nodes.length;
        return nodes;
      },
      getOptionText: (node, index) => {
        if (currentInfo && currentInfo.options.length && currentInfo.options.length === domOptionCount) {
          const text = currentInfo.options[index];
          if (text) return text;
        }
        return profile ? profile.optionText(node) : zhPaperClean((node || {}).textContent || "");
      },
      getTypeCode: (root) => {
        rememberApi(root);
        const byApi = ppZhApiTypeCodeOf(currentInfo);
        if (byApi) return byApi;
        const scope = scopeOf(root);
        return profile && scope ? profile.typeCode(scope) : "999";
      },
      getKey: (root, stem, options, typeCode) => {
        const signature = profile && profile.signature ? profile.signature() : "";
        return [profile ? profile.id : "", signature, typeCode, stem].join("#");
      },
      isPicked: zhPaperPicked,
      pick: (node) => zhPaperPress(node),
      pickGapMs: profile && profile.pickGapMs ? profile.pickGapMs : 140,
      isExtraAnswered: (root) => Boolean(profile && profile.extraAnswered && profile.extraAnswered(root)),
      recordSkipped: true,
      writeText: (root, answers) => ppZhH5WriteText(scopeOf(root), answers),
      next: () => zhPaperGoNext(profile),
      maxSteps: 200,
      stepGapMs: 400,
      showCost: Boolean(profile && profile.showCost),
      onStart: ({ total: questionTotal, progressStore }) => {
        progressStore.update({
          taskName: "智慧树答题",
          type: "答题",
          isPlaying: true,
          questionTotal,
          questionIndex: 0,
          percent: 0,
          currentTime: 0,
          totalTime: 0,
          detail: `第 0 / ${questionTotal || "?"} 题`
        });
      },
      perQuestion: ({ handled, total: questionTotal }) => ({
        taskName: "智慧树答题",
        type: "答题",
        isPlaying: true,
        questionTotal: questionTotal || handled,
        questionIndex: handled,
        percent: questionTotal ? Math.min(99, Math.round((handled - 1) / questionTotal * 100)) : 0,
        detail: `第 ${handled} / ${questionTotal || "?"} 题`
      }),
      onFinish: ({ handled, filled, skipped, failed, total: questionTotal, progressStore, logStore }) => {
        progressStore.update({
          filledCount: filled,
          fillRate: questionTotal ? Math.round((filled + skipped) / questionTotal * 100) : 0,
          questionIndex: handled,
          percent: 100,
          isPlaying: false,
          detail: `已完成 ${handled} / ${questionTotal || "?"} 题`
        });
        ppLogAnswerSummary(logStore.addLog, { handled, filled, skipped, failed, total: questionTotal });
        ppLogAnswerSubmitNote(logStore.addLog, "manual");
      }
    });
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
  const ZH_STUDY_PART = PP_KEY.VIDEO;

  const zhSleep = (sec) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(sec) || 0) * 1e3));
  const zhWithTimeout = (promise, sec, fallback) => new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => finish(fallback), Math.max(1, Number(sec) || 5) * 1e3);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        finish(value);
      },
      () => {
        clearTimeout(timer);
        finish(fallback);
      }
    );
  });
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
      const top = document.elementFromPoint(x, y);
      if (top && (top === el || el.contains(top))) hit = top;
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

  const ZH_MASK_SELECTOR = ".el-dialog__wrapper, .el-overlay, .el-overlay-dialog, .el-message-box__wrapper";
  const zhMaskOf = (node) => {
    try {
      return (node && node.closest ? node.closest(ZH_MASK_SELECTOR) : null) || null;
    } catch (e) {
      return null;
    }
  };
  const zhReleaseBodyPopupLock = () => {
    try {
      if (zhPickAll(ZH_MASK_SELECTOR).some((el) => zhVisible(el))) return false;
      document.body.classList.remove("el-popup-parent--hidden");
      document.documentElement.classList.remove("el-popup-parent--hidden");
      zhPickAll(".v-modal").forEach((el) => {
        try {
          el.remove();
        } catch (e) {}
      });
      return true;
    } catch (e) {
      return false;
    }
  };
  const zhHideMaskNode = (node) => {
    if (!node) return false;
    try {
      node.style.display = "none";
    } catch (e) {}
    zhReleaseBodyPopupLock();
    return true;
  };
  const zhMaskDialogAlive = (dialog) => {
    try {
      const style = window.getComputedStyle(dialog);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const box = dialog.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    } catch (e) {
      return true;
    }
  };
  const zhTapDialogButton = (dialog, btn) => {
    if (!dialog) return false;
    const mask = zhMaskOf(dialog) || dialog;
    if (btn) zhTapNode(btn);
    setTimeout(() => {
      try {
        const inner = zhPick(".el-dialog, .el-message-box", mask) || dialog;
        if (zhMaskDialogAlive(inner)) zhHideMaskNode(mask);
      } catch (e) {}
    }, 1200);
    return true;
  };
  const zhHealStaleMasks = () => {
    let healed = 0;
    zhPickAll(ZH_MASK_SELECTOR).forEach((mask) => {
      try {
        if (!zhVisible(mask)) return;
        if (mask.querySelector(ZH_DIALOG_KEEP_SELECTOR)) return;
        const dialog = mask.querySelector(".el-dialog, .el-message-box, [role='dialog']");
        if (!dialog || zhMaskDialogAlive(dialog)) return;
        zhHideMaskNode(mask);
        healed += 1;
      } catch (e) {}
    });
    zhReleaseBodyPopupLock();
    return healed;
  };

  const zhRuntime = {
    epoch: 0,
    idle: 0,
    notice: {},
    lastQuizAt: 0,
    lastAdvanceAt: 0,
    quizSignature: "",
    booted: false,
    restudy: new Set(),
    restudySections: new Set(),
    sectionSwitchAt: 0,
    sectionCardSig: "",
    lastBeat: 0,
    lastRestartAt: 0,
    waitMediaSince: 0,
    stage: null,
    log: null,
    watchdog: null
  };

  const zhMediaAtEnd = (media) => {
    try {
      if (!media) return false;
      if (media.ended) return true;
      const duration = Number(media.duration) || 0;
      if (!duration) return false;
      return media.paused && media.currentTime >= duration - 1.2;
    } catch (e) {
      return false;
    }
  };

  const zhRestudyKey = (stage, el, list) => {
    const text = zhTxtOf(el, "").slice(0, 80);
    if (text) return `${stage.id}|${text}`;
    const at = Array.isArray(list) ? list.indexOf(el) : -1;
    return `${stage.id}|#${at}`;
  };
  const zhRestudySeen = (stage, el, list) => Boolean(el) && zhRuntime.restudy.has(zhRestudyKey(stage, el, list));
  const zhRestudyMark = (stage, el, list) => {
    if (el) zhRuntime.restudy.add(zhRestudyKey(stage, el, list));
  };
  const zhRestudyReset = () => {
    zhRuntime.restudy.clear();
    zhRuntime.restudySections.clear();
    zhRuntime.sectionSwitchAt = 0;
    zhRuntime.sectionCardSig = "";
  };

  const zhRestudyStart = (stage, tune, log, current, media, done, list) => {
    if (!tune || !tune.restudy || !done || !current || !media) return false;
    let items = list;
    if (!Array.isArray(items)) {
      try {
        items = typeof stage.chapters === "function" ? stage.chapters() : [];
      } catch (e) {
        items = [];
      }
    }
    if (zhRestudySeen(stage, current, items)) return false;
    zhRestudyMark(stage, current, items);
    try {
      if (Number(media.currentTime) > 1) media.currentTime = 0;
    } catch (e) {}
    zhLogCadence(log, "restudy-start-" + stage.id, "复习模式：从 0 秒起完整重刷当前任务点", "primary", 60);
    return true;
  };

  const zhMediaMissingSkip = (stage, tune, log, current, done) => {
    if (!tune || !tune.restudy || !done || !current) return true;
    if (!zhRuntime.waitMediaSince) zhRuntime.waitMediaSince = Date.now();
    if (Date.now() - zhRuntime.waitMediaSince > 15000) {
      zhRuntime.waitMediaSince = 0;
      log.addLog("复习模式：当前任务点 15 秒内未加载到媒体，已跳过", "warning");
      return true;
    }
    zhLogCadence(log, "restudy-wait-" + stage.id, "复习模式：等待当前任务点媒体加载…", "warning", 20);
    return false;
  };

  const zhResolveEnded = (stage, tune, log, media, current, done, options) => {    const opts = options || {};
    const list = opts.list || (typeof stage.chapters === "function" ? stage.chapters() : []);
    if (done && current) {
      if (!tune.restudy) return "advance";
      if (zhRestudySeen(stage, current, list)) return "advance";
      zhRestudyMark(stage, current, list);
      zhLogCadence(log, "restudy-" + stage.id, "复习模式：已完成节点从 0 重新播放", "primary", 60);
      try {
        media.currentTime = 0;
      } catch (e) {}
      return "play";
    }
    if (opts.replayLog) {
      zhLogCadence(log, opts.replayKey || ("replay-" + stage.id), opts.replayLog, "warning", 25);
    }
    try {
      media.currentTime = 1;
    } catch (e) {}
    return "play";
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
    const speedRaw = Number(readParam(ZH_STUDY_PART, PP_KEY.RATE, zhSpeedCeiling())) || zhSpeedCeiling();
    const mode = (() => {
      const on = (key) => readParam(PP_KEY.MODE, key, false) === true;
      if (on(PP_KEY.ONLY_ANSWER)) return "answer";
      if (on(PP_KEY.ONLY_VIDEO)) return "video";
      if (on(PP_KEY.REVIEW)) return "review";
      return "normal";
    })();
    const restudy = mode === "review";
    return {
      mode,
      restudy,
      modeOn: mode !== "answer",
      answerOn: mode !== "video",
      autoPlay: readParam(ZH_STUDY_PART, PP_KEY.NORMAL_PLAY, true) !== false,
      autoSpeed: readParam(ZH_STUDY_PART, PP_KEY.AUTO_RATE, true) !== false,
      speed: Math.min(Math.max(1, speedRaw), zhSpeedCeiling()),
      autoNext: readParam(PP_KEY.ZHS_CHAPTER, PP_KEY.AUTO_NEXT, true) !== false || ppZhsQueueAllowsAdvance(),
      quizAuto: readParam(ZH_STUDY_PART, "弹题作答", true) !== false,
      ignoreHabit: readParam(PP_KEY.ZHS_CHAPTER, "忽略习惯弹窗", false) === true,
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
    try {
      const text = rate === 1 ? "1.0" : String(rate);
      const label = document.querySelector("#container .speedBox > span");
      if (label && label.textContent !== "X " + text) label.textContent = "X " + text;
      const vjsValue = document.querySelector(".vjs-playback-rate-value");
      if (vjsValue && vjsValue.textContent !== text) vjsValue.textContent = text;
    } catch (e) {}
    return rate;
  };

  const zhFindMedia = async (selectors, timeoutSec) => {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    const deadline = Date.now() + (timeoutSec === undefined ? 8 : timeoutSec) * 1e3;
    while (Date.now() < deadline) {
      for (const sel of list) {
        const media = zhPick(sel);
        if (media && media.isConnected !== false && (media.currentSrc || media.src || media.readyState > 0)) return media;
      }
      await zhSleep(0.4);
    }
    return null;
  };

  const zhKeepPlaying = async (media, tune) => {
    if (!media) return false;
    const log = useLogStore();
    ppMuteOnce(media);
    try {
      if (media.currentTime < 1) media.currentTime = 1;
    } catch (e) {}
    if (tune) zhPinSpeed(media, tune.autoSpeed ? zhSpeedCeiling() : tune.speed);
    const markPlayed = () => {
      if (media.__ppZhPlayLogged) return;
      media.__ppZhPlayLogged = true;
      try {
        log.addLog(`播放成功，倍速：${Number(media.playbackRate) || 1}x`, "primary");
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
        log.addLog(`开始播放：${mediaName || "视频"}`, "primary");
      } catch (e) {}
    }
    const tryPlay = async () => {
      try {
        return (await zhWithTimeout(media.play(), 6, false)) !== false;
      } catch (e) {
        return false;
      }
    };
    if (await tryPlay()) {
      markPlayed();
      return true;
    }
    if (!media.muted) media.muted = true;
    if (await tryPlay()) {
      markPlayed();
      return true;
    }
    return false;
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
    if (typeof ppDeskNotify === "function") ppDeskNotify("网课小助手", "智慧树出现验证码，学习流程已暂停，验证完成后会自动继续", "pp-zhs-notice");
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
    zhTapDialogButton(
      node,
      zhPick(".el-dialog__header img", node) || zhPick(".el-dialog__headerbtn", node) || zhPick("img", node)
    );
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
      const known = btn && zhTxtOf(btn).indexOf("我知道了") >= 0 ? btn : null;
      zhTapDialogButton(tip, known);
    }
    const readTip = zhPick(".dialog-read .iconguanbi");
    if (readTip && zhVisible(readTip.closest ? readTip.closest(".dialog-read") : readTip)) {
      zhTapDialogButton(readTip.closest ? readTip.closest(".dialog-read") : readTip, readTip);
    }
  };

  const ZH_NOTICE_DISMISS_RULES = [
    {
      key: "zh-course-notice",
      resume: true,
      match: (text) =>
        text.indexOf("课程提醒") >= 0 ||
        (text.indexOf("智慧树共享课") >= 0 && text.indexOf("公众号") >= 0),
      buttons: ["下次再说", "已绑定,不再提示", "已绑定，不再提示"],
      log: "已关闭「课程提醒（绑定公众号）」弹窗"
    }
  ];
  const zhDismissNoticeDialogs = (log) => {
    let handled = 0;
    zhPickAll(".el-dialog, .el-message-box, [class*='dialog']").forEach((node) => {
      try {
        if (!zhVisible(node)) return;
        if (node.querySelector(ZH_DIALOG_KEEP_SELECTOR)) return;
        const text = zhTxtOf(node).replace(/\s+/g, "");
        const rule = ZH_NOTICE_DISMISS_RULES.find((item) => item.match(text));
        if (!rule) return;
        const buttons = zhPickAll("button", node);
        const btn = rule.buttons
          .map((label) => buttons.find((candidate) => zhTxtOf(candidate).indexOf(label) >= 0))
          .find(Boolean);
        if (btn) zhTapNode(btn);
        const wrapper = zhMaskOf(node);
        if (wrapper) zhHideMaskNode(wrapper);
        if (rule.resume) {
          try {
            const media = document.querySelector("#container video") || document.querySelector("video");
            if (media && media.paused && !media.ended) {
              const duration = Number(media.duration) || 0;
              if (duration && media.currentTime >= duration - 1.5) {
                media.currentTime = duration;
              } else if (!duration || media.currentTime < duration - 1) {
                media.play().catch(() => {});
              }
            }
          } catch (e) {}
        }
        zhLogCadence(log, rule.key, rule.log, "info", 30);
        handled += 1;
      } catch (e) {}
    });
    return handled;
  };

  const ZH_DIALOG_BLOCK_TEXTS = [
    "检测到异常脚本",
    "异常行为提示",
    "温馨提示",
    "保持良好的学习习惯",
    "同时播放多个视频",
    "学习时间已经结束",
    "本课程不能跨章学习"
  ];
  const ZH_DIALOG_KEEP_SELECTOR =
    ".yidun_popup, .yidun_intelli-tips, iframe[src*='captcha'], .tcaptcha-transform, [id*='tcaptcha'], .questionContent, .examPaper_subject, .el-radio, .el-checkbox";
  const zhDismissLegacyCourseRemind = (log) => {
    try {
      const popup = document.querySelector(".courseRemind.khfaPop");
      if (!popup || !zhVisible(popup)) return false;
      const closeBtn = popup.querySelector(".header-slot-box .el-icon-error");
      if (closeBtn) {
        zhTapNode(closeBtn);
        zhLogCadence(log, "zh-course-remind-legacy", "课程提醒已关闭", "info", 30);
        return true;
      }
      zhHideMaskNode(zhMaskOf(popup) || popup);
      zhLogCadence(log, "zh-course-remind-legacy", "已收起无法关闭的课程提醒弹层", "info", 30);
      return true;
    } catch (e) {
      return false;
    }
  };

  const zhHideBlockingDialogs = (log) => {
    let hidden = 0;
    zhDismissLegacyCourseRemind(log);
    zhHealStaleMasks();
    zhPickAll(".el-overlay, .el-dialog, .el-dialog__wrapper, .el-message-box, .el-message-box__wrapper").forEach((node) => {
      try {
        if (!zhVisible(node)) return;
        if (node.querySelector(ZH_DIALOG_KEEP_SELECTOR)) return;
        const text = zhTxtOf(node).replace(/\s+/g, "");
        if (!text) return;
        const hit = ZH_DIALOG_BLOCK_TEXTS.find((keyword) => text.indexOf(keyword) >= 0);
        if (!hit) return;
        zhHideMaskNode(zhMaskOf(node) || node);
        hidden += 1;
      } catch (e) {}
    });
    return hidden;
  };
  const zhInstallDialogGuard = (log) => {
    if (zhRuntime.dialogGuard) return;
    zhRuntime.dialogGuard = true;
    zhHideBlockingDialogs(log);
    const sweep = () => {
      zhHealStaleMasks();
      try {
        zhDismissNoticeDialogs(log);
      } catch (e) {}
      zhHideBlockingDialogs(log);
    };
    try {
      const observer = new MutationObserver(() => {
        if (zhRuntime.dialogSweepTimer) return;
        zhRuntime.dialogSweepTimer = setTimeout(() => {
          zhRuntime.dialogSweepTimer = null;
          sweep();
        }, 80);
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"]
      });
      zhRuntime.dialogGuardObserver = observer;
    } catch (e) {}
    zhRuntime.dialogGuardTimer = setInterval(sweep, 1500);
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
    log.addLog(`发现课件（${total} 页），开始翻阅`, "primary");
    let guard = 0;
    while (guard < total + 6) {
      const nowCurrent = readPage(".page-current");
      const nowTotal = readPage(".page-total");
      if (!nowTotal || nowCurrent >= nowTotal) break;
      zhTapNode(find(".next-page-btn"));
      await zhSleep(1.1);
      guard += 1;
    }
    log.addLog("课件翻阅完成", "success");
    return true;
  };

  const zhBookSweep = async (boxSelector, log) => {
    const box = zhPick(boxSelector);
    if (!box) return false;
    const pages = zhPickAll(".book-mark .canvas-wrapper");
    const pageHeight = (pages[0] && pages[0].getBoundingClientRect().height) || 420;
    log.addLog("发现电子书，开始阅读", "primary");
    let guard = 0;
    while (guard < 400 && box.scrollTop + box.clientHeight < box.scrollHeight - 4) {
      box.scrollTo({ top: Math.min(box.scrollTop + Math.max(pageHeight * 0.9, 200), box.scrollHeight), behavior: "smooth" });
      await zhSleep(0.9);
      guard += 1;
    }
    log.addLog("电子书阅读完成", "success");
    return true;
  };

  const zhHandleResourceTask = async (log) => {
    try {
      const pptBox = zhPick(".ppt-preview-container") || zhPick(".ppt-btn-container");
      if (pptBox) {
        const ok = await zhPptSweep([".ppt-preview-container", ".ppt-btn-container"], log);
        if (ok) return "ppt";
      }
      const bookBox = zhPick(".preview-section .book-mark .book-container") || zhPick(".book-container");
      if (bookBox) {
        const ok = await zhBookSweep(".preview-section .book-mark .book-container, .book-container", log);
        if (ok) return "book";
      }
    } catch (e) {}
    return "";
  };

  const zhFinishResourceTask = async (stage, tune, log, kind) => {
    const pendingCurrent = stage.current();
    if (pendingCurrent && stage.isDone(pendingCurrent)) return await stage.advance(tune, log);
    if (!zhRuntime.waitMediaSince) zhRuntime.waitMediaSince = Date.now();
    if (Date.now() - zhRuntime.waitMediaSince > 15000) {
      zhRuntime.waitMediaSince = 0;
      log.addLog(`「${kind === "ppt" ? "课件" : "电子书"}」任务点未打完成标记，跳过`, "warning");
      return await stage.advance(tune, log);
    }
    await zhSleep(1);
    return true;
  };

  const zhFindNextStudySection = (sections) => {
    const needsStudy = (section) => {
      const label = zhTxtOf(zhPick(".collapse-info-progress .progress-text", section));
      const counts = /(\d+)\/(\d+)/.exec(label.replace(/\s+/g, ""));
      if (!counts) return true;
      const total = Number(counts[2]);
      return total === 0 || Number(counts[1]) < total;
    };
    const active = sections.findIndex(section => /(^|\s)active(\s|$)/.test(section.className || ""));
    const start = active >= 0 && needsStudy(sections[active]) ? active + 1 : 0;
    for (let i = start; i < sections.length; i++) {
      if (i !== active && needsStudy(sections[i])) return sections[i];
    }
    return null;
  };

  const zhOpenSection = async (section) => {
    if (!section) return false;
    try {
      section.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {
    }
    await zhSleep(0.2);
    try {
      section.click();
    } catch (e) {
    }
    try {
      section.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    } catch (e) {
    }
    return true;
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
      if (!zhPickAll("li.video, .clearfix.video").length && zhCardList().length) {
        return await zhStageCard.step.call(zhStageCard, tune, log);
      }
      const media = await zhFindMedia(["#vjs_container_html5_api", "#vjs_container video", "video"], 6);
      if (media) {
        zhRuntime.waitMediaSince = 0;
        const current = this.current();
        if (media.ended) {
          const plan = zhResolveEnded(this, tune, log, media, current, !!(current && this.isDone(current)), {
            replayKey: "legacy-replay",
            replayLog: "视频播放结束但未计入完成，重播补齐时长"
          });
          if (plan === "advance") return await this.advance(tune, log);
        }
        zhRestudyStart(this, tune, log, current, media, !!(current && this.isDone(current)));
        await zhKeepPlaying(media, tune);
        return true;
      }
      const resourceKind = await zhHandleResourceTask(log);
      if (resourceKind) return await zhFinishResourceTask(this, tune, log, resourceKind);
      const pendingCurrent = this.current();
      if (pendingCurrent && this.isDone(pendingCurrent) && zhMediaMissingSkip(this, tune, log, pendingCurrent, true)) {
        return await this.advance(tune, log);
      }
      zhLogCadence(log, "wait-media-" + this.id, "当前节点视频尚未加载，等待中…", "warning", 20);
      return false;
    },
    async advance(tune, log) {
      if (!tune.autoNext) return false;
      const list = this.chapters();
      const pending = tune.restudy
        ? list.filter((el) => !zhRestudySeen(this, el, list))
        : list.filter((el) => !this.isDone(el));
      const current = this.current();
      if (tune.restudy && current) zhRestudyMark(this, current, list);
      const index = pending.indexOf(current);
      const target = index >= 0 ? pending[index + 1] || null : pending[0] || null;
      if (!target) {
        zhLogCadence(
          log,
          tune.restudy ? "legacy-restudy-all" : "legacy-all",
          tune.restudy ? "复习模式：本页任务点已全部重刷完成" : "本页任务点已全部完成",
          "success",
          300
        );
        return false;
      }
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
      if (!zhPickAll(".child-main").length && zhCardList().length) {
        return await zhStageCard.step.call(zhStageCard, tune, log);
      }
      const media = await zhFindMedia(["video", "audio"], 6);
      if (media) {
        zhRuntime.waitMediaSince = 0;
        const current = this.current();
        if (zhMediaAtEnd(media)) {
          const plan = zhResolveEnded(this, tune, log, media, current, !!(current && this.isDone(current)));
          if (plan === "advance") return await this.advance(tune, log);
        }
        zhRestudyStart(this, tune, log, current, media, !!(current && this.isDone(current)));
        await zhKeepPlaying(media, tune);
        return true;
      }
      const resourceKind = await zhHandleResourceTask(log);
      if (resourceKind) return await zhFinishResourceTask(this, tune, log, resourceKind);
      const pendingCurrent = this.current();
      if (pendingCurrent && this.isDone(pendingCurrent) && zhMediaMissingSkip(this, tune, log, pendingCurrent, true)) {
        return await this.advance(tune, log);
      }
      if (!zhRuntime.waitMediaSince) zhRuntime.waitMediaSince = Date.now();
      if (Date.now() - zhRuntime.waitMediaSince > 15000) {
        zhRuntime.waitMediaSince = 0;
        log.addLog("视频加载超时，跳过当前任务点", "warning");
        return await this.advance(tune, log);
      }
      zhLogCadence(log, "wait-media-" + this.id, "当前节点视频尚未加载，等待中…", "warning", 20);
      return false;
    },
    async advance(tune, log) {
      if (!tune.autoNext) return false;
      const list = this.chapters();
      const pending = tune.restudy
        ? list.filter((el) => !zhRestudySeen(this, el, list))
        : list.filter((el) => !this.isDone(el));
      const current = this.current();
      if (tune.restudy && current) zhRestudyMark(this, current, list);
      const index = pending.indexOf(current);
      const target = index >= 0 ? pending[index + 1] || null : pending[0] || null;
      if (!target) {
        zhLogCadence(
          log,
          tune.restudy ? "newshare-restudy-all" : "newshare-all",
          tune.restudy ? "复习模式：本页任务点已全部重刷完成" : "本页任务点已全部完成",
          "success",
          300
        );
        return false;
      }
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
      if (!zhPickAll(".chapter-content .chapter-item").length && zhCardList().length) {
        return await zhStageCard.step.call(zhStageCard, tune, log);
      }
      const mastery = zhPick(".masterylevel-body");
      if (zhVisible(mastery)) {
        zhTapNode(zhPick(".header-box .close-box") || zhPick(".header-icon"));
        log.addLog("已关闭掌握度弹窗", "primary");
        await zhSleep(1);
        return true;
      }
      const media = await zhFindMedia(["video", "audio"], 6);
      if (media) {
        zhRuntime.waitMediaSince = 0;
        const current = this.current();
        if (zhMediaAtEnd(media)) {
          const plan = zhResolveEnded(this, tune, log, media, current, !!(current && this.isDone(current)), {
            replayKey: "wisdom-replay",
            replayLog: "当前节点未出现完成标记，重新播放补齐时长"
          });
          if (plan === "advance") return await this.advance(tune, log);
        }
        zhRestudyStart(this, tune, log, current, media, !!(current && this.isDone(current)));
        await zhKeepPlaying(media, tune);
        return true;
      }
      const resourceKind = await zhHandleResourceTask(log);
      if (resourceKind) return await zhFinishResourceTask(this, tune, log, resourceKind);
      const pendingCurrent = this.current();
      if (pendingCurrent && this.isDone(pendingCurrent) && zhMediaMissingSkip(this, tune, log, pendingCurrent, true)) {
        return await this.advance(tune, log);
      }
      if (!zhRuntime.waitMediaSince) zhRuntime.waitMediaSince = Date.now();
      if (Date.now() - zhRuntime.waitMediaSince > 15000) {
        zhRuntime.waitMediaSince = 0;
        log.addLog("视频加载超时，跳过当前任务点", "warning");
        return await this.advance(tune, log);
      }
      zhLogCadence(log, "wait-media-" + this.id, "当前节点视频尚未加载，等待中…", "warning", 20);
      return false;
    },
    async advance(tune, log) {
      if (!tune.autoNext) return false;
      const list = this.chapters();
      const pending = tune.restudy
        ? list.filter((el) => !zhRestudySeen(this, el, list))
        : list.filter((el) => !this.isDone(el));
      const current = this.current();
      if (tune.restudy && current) zhRestudyMark(this, current, list);
      const index = pending.indexOf(current);
      const target = index >= 0 ? pending[index + 1] || null : pending[0] || null;
      if (!target) {
        zhLogCadence(
          log,
          tune.restudy ? "wisdom-restudy-all" : "wisdom-all",
          tune.restudy ? "复习模式：本页任务点已全部重刷完成" : "本页任务点已全部完成",
          "success",
          300
        );
        return false;
      }
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

  const zhBoundMedia = new WeakSet();

  const zhSectionKey = (section, index) => {
    const text = String(zhTxtOf(zhPick(".section-item-collapse-title", section), "") || "").replace(/\s+/g, " ").trim().slice(0, 80);
    return text || `#${index}`;
  };

  const zhCardSignature = () => {
    try {
      const cards = zhCardList();
      if (cards.length) {
        return cards
          .map((card) => {
            const titleEl = zhPick(".common-text, .video-title, .basic-info-video-card-container", card);
            return String(zhTxtOf(titleEl || card, "")).replace(/\s+/g, " ").trim().slice(0, 40);
          })
          .join("|");
      }
      return zhPickAll(".clearfix.video")
        .map((el) => String(zhTxtOf(zhPick(".title, .catalogue_title", el) || el, "")).replace(/\s+/g, " ").trim().slice(0, 40))
        .join("|");
    } catch (e) {
      return "";
    }
  };

  const zhFindNextRestudySection = (sections) => {
    const active = sections.find((section) => /(^|\s)active(\s|$)/.test(section.className || "")) || null;
    const keys = sections.map((section, index) => zhSectionKey(section, index));
    const activeIndex = active ? sections.indexOf(active) : -1;
    if (activeIndex >= 0) zhRuntime.restudySections.add(keys[activeIndex]);
    for (let step = 1; step <= sections.length; step += 1) {
      const index = (activeIndex + step + sections.length) % sections.length;
      if (index === activeIndex) continue;
      if (!zhRuntime.restudySections.has(keys[index])) return sections[index];
    }
    return null;
  };

  const zhAdvanceSection = async (tune, log) => {
    const sections = zhPickAll(".section-item-collapse-info");
    if (tune && tune.restudy) {
      if (zhRuntime.sectionSwitchAt) {
        const sig = zhCardSignature();
        const loaded = sig !== "" && sig !== zhRuntime.sectionCardSig;
        const overdue = Date.now() - zhRuntime.sectionSwitchAt > 20000;
        if (!loaded && !overdue) return true;
      }
      const target = zhFindNextRestudySection(sections);
      if (!target) return false;
      const head = zhPick(".section-item-collapse-title", target) || target;
      log.addLog(`复习模式：切换到下一节：${zhTxtOf(head, "下一章")}`, "primary");
      zhRuntime.sectionCardSig = zhCardSignature();
      zhRuntime.sectionSwitchAt = Date.now();
      await zhOpenSection(target);
      await zhSleep(2.4);
      return true;
    }
    const target = zhFindNextStudySection(sections);
    if (!target) return false;

    const head = zhPick(".section-item-collapse-title", target) || target;
    log.addLog(`切换到下一节：${zhTxtOf(head, "下一章")}`, "primary");
    await zhOpenSection(target);
    await zhSleep(2.4);
    return true;
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
      const current = zhPick(".clearfix.video.current_play") || zhPick(".clearfix.video.activeNode");
      if (media) {
        if (media.ended) {
          const plan = zhResolveEnded(this, tune, log, media, current, !!(current && this.chapterDone(current)));
          if (plan === "advance") return await this.chapterAdvance(tune, log);
        }
        zhRestudyStart(this, tune, log, current, media, !!(current && this.chapterDone(current)));
        await zhKeepPlaying(media, tune);
        return true;
      }
      if (!zhMediaMissingSkip(this, tune, log, current, !!(current && this.chapterDone(current)))) return true;
      return await this.chapterAdvance(tune, log);
    },
    async chapterAdvance(tune, log) {
      if (!tune.autoNext) return false;
      const list = this.chapters();
      const pending = tune.restudy
        ? list.filter((el) => !zhRestudySeen(this, el, list))
        : list.filter((el) => !this.chapterDone(el));
      const current = zhPick(".clearfix.video.current_play") || zhPick(".clearfix.video.activeNode");
      if (tune.restudy && current) zhRestudyMark(this, current, list);
      const index = pending.indexOf(current);
      const target = index >= 0 ? pending[index + 1] || null : pending[0] || null;
      if (target) {
        log.addLog(`切换到下一节：${zhTxtOf(zhPick(".title", target) || zhPick(".catalogue_title", target) || target, "下一个视频")}`, "primary");
        zhTapNode(target);
        await zhSleep(2.4);
        return true;
      }
      const moved = await zhAdvanceSection(tune, log);
      if (!moved) {
        zhLogCadence(
          log,
          tune.restudy ? "fusion-chapter-restudy-all" : "fusion-chapter-all",
          tune.restudy ? "复习模式：本页任务点已全部重刷完成" : "本页任务点已全部完成",
          "success",
          300
        );
      }
      return moved;
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
          if (tune && tune.restudy && card) {
            zhRestudyStart(this, tune, log, card, media, zhCardDone(card), zhCardList());
          }
          if (!zhBoundMedia.has(media)) {
            zhBoundMedia.add(media);
            media.onpause = () => {
              if (media.ended) return;
              setTimeout(() => {
                if (!media.ended) media.play().catch(() => {});
              }, 1000);
            };
            media.onended = () => {
              void (async () => {
                log.addLog("视频播放完毕，即将跳转下一节", "primary");
                await zhSleep(3);
                await this.advance(tune, log);
              })().catch(() => {});
            };
          }
          await zhKeepPlaying(media, tune);
          return true;
        }
        if (!zhMediaMissingSkip(this, tune, log, card, zhCardDone(card))) return true;
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
      const activeCard = activeIndex >= 0 ? cards[activeIndex] : null;
      const pending = tune.restudy
        ? cards.filter((card) => !zhRestudySeen(this, card, cards))
        : cards.filter((card) => !zhCardDone(card));
      if (pending.length) {
        if (tune.restudy && activeCard) zhRestudyMark(this, activeCard, cards);
        const after = pending.find((card) => cards.indexOf(card) > activeIndex);
        const fallback = tune.restudy ? pending[0] : activeIndex >= 0 ? null : pending[0];
        const target = after || fallback || null;
        if (target) {
          log.addLog(`切换到下一节：${zhTxtOf(target.querySelector(".common-text, .video-title, .basic-info-video-card-container")) || "下一个资源"}`, "primary");
          zhTapNode(zhPick(".basic-info-video-card-container", target) || zhPick(".common-text", target) || target);
          await zhSleep(2.4);
          return true;
        }
      }
      const moved = await zhAdvanceSection(tune, log);
      if (!moved) {
        zhLogCadence(
          log,
          tune.restudy ? "card-restudy-all" : "card-all",
          tune.restudy ? "复习模式：本页任务点已全部重刷完成" : "本页任务点已全部完成",
          "success",
          300
        );
      }
      return moved;
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
        zhRuntime.waitMediaSince = 0;
        const current = this.current(profile);
        if (media.ended) {
          const progress = zhTxtOf(zhPick(profile.rate, current));
          const plan = zhResolveEnded(this, tune, log, media, current, !!(current && this.isDone(profile, current)), {
            list: this.items(profile),
            replayKey: "practice-replay",
            replayLog: `播放结束但未计入完成${progress ? `（当前进度 ${progress}）` : ""}，重播补齐`
          });
          if (plan === "advance") return await this.advance(profile, tune, log);
        }
        zhRestudyStart(this, tune, log, current, media, !!(current && this.isDone(profile, current)), this.items(profile));
        await zhKeepPlaying(media, tune);
        return true;
      }
      const pendingCurrent = this.current(profile);
      if (!zhMediaMissingSkip(this, tune, log, pendingCurrent, !!(pendingCurrent && this.isDone(profile, pendingCurrent)))) {
        return true;
      }
      return await this.advance(profile, tune, log);
    },
    async advance(profile, tune, log) {
      if (!tune.autoNext) return false;
      const list = this.items(profile);
      const pending = tune.restudy
        ? list.filter((item) => !zhRestudySeen(this, item, list))
        : list.filter((item) => !this.isDone(profile, item));
      const current = this.current(profile);
      if (tune.restudy && current) zhRestudyMark(this, current, list);
      const index = pending.indexOf(current);
      const target = index >= 0 ? pending[index + 1] || null : pending[0] || null;
      if (!target) {
        zhLogCadence(
          log,
          tune.restudy ? "practice-restudy-all" : "practice-all",
          tune.restudy ? "复习模式：本页任务点已全部重刷完成" : "本页任务点已全部完成",
          "success",
          300
        );
        return false;
      }
      log.addLog(`切换到下一节：${zhTxtOf(target.querySelector(profile.title) || target, "下一个资源")}`, "primary");
      zhTapNode(target);
      await zhSleep(2.6);
      return true;
    }
  };

  const ZH_CLASSROOM_STAGES = [zhStageLegacyShare, zhStageNewShare, zhStageCard, zhStageWisdomMooc, zhStagePractice];

  const zhStageLooksDone = (stage, tune) => {
    if (tune && tune.restudy) return false;
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

  const zhExamEntryOf = () => {
    try {
      const pools = zhPickAll(".wisdom-menu");
      const scopes = pools.length ? pools : [document];
      for (const scope of scopes) {
        const nodes = Array.from(scope.querySelectorAll("div, li, a, button"));
        const hit = nodes.find((el) => {
          const text = zhTxtOf(el).replace(/\s+/g, "");
          return text === "考试" && el.getClientRects().length > 0;
        });
        if (hit) return hit;
      }
      return zhPick('a[href*="stuExamWeb.html"], a[href*="onlineexamh5new"]');
    } catch (e) {
      return null;
    }
  };
  const zhLogExamEntryHint = (log) => {
    if (zhRuntime.examHinted) return;
    if (document.querySelector("video, audio")) return;
    if (!zhExamEntryOf()) return;
    zhRuntime.examHinted = true;
    log.addLog("检测到「考试」入口：请点击左侧「考试」进入考试列表，进入答题页后脚本会自动作答", "warning");
  };

  const zhLogPageHidden = () => {
    if (document.visibilityState === "hidden") {
      zhRuntime.log.addLog("学习页已转入后台。如果进度暂停，请切回这个标签页。", "warning");
    }
  };

  const zhBootClassroom = async (stage, log) => {
    if (zhRuntime.booted) return;
    zhRuntime.booted = true;
    zhRuntime.epoch += 1;
    zhRestudyReset();
    const epoch = zhRuntime.epoch;
    log.addLog(`检测到智慧树${stage.label}学习页面`, "primary");
    log.addLog("正在解析任务点，请稍等5-10秒（如果长时间没有反应，请刷新页面）", "warning");
    log.addLog(`播放器最大倍速：${zhSpeedCeiling()}x`, "info");
    const zhKickstartStudy = () => {
      try {
        zhDismissNoticeDialogs(log);
      } catch (e) {}
      try {
        zhHealStaleMasks();
      } catch (e) {}
      try {
        const media = document.querySelector("#container video") || document.querySelector("video");
        if (media && media.paused && !media.ended) {
          const duration = Number(media.duration) || 0;
          if (!duration || media.currentTime < duration - 1.5) media.play().catch(() => {});
        }
      } catch (e) {}
    };
    zhKickstartStudy();
    setTimeout(zhKickstartStudy, 5000);
    setTimeout(zhKickstartStudy, 9000);
    setTimeout(zhKickstartStudy, 15000);
    zhInstallDialogGuard(log);
    zhRuntime.stage = stage;
    zhRuntime.log = log;
    zhRuntime.lastBeat = Date.now();
    if (!zhRuntime.watchdog) {
      zhRuntime.watchdog = setInterval(() => {
        if (!zhRuntime.booted || !zhRuntime.stage) return;
        try {
          const media = document.querySelector("#container video") || document.querySelector("video");
          if (media && media.paused && !media.ended) {
            media.muted = true;
            const duration = Number(media.duration) || 0;
            if (duration && media.currentTime >= duration - 2) {
              media.currentTime = duration;
            } else {
              media.play().catch(() => {});
            }
          }
        } catch (e) {}
        try {
          const stage = zhRuntime.stage;
          if (
            stage &&
            typeof stage.current === "function" &&
            typeof stage.isDone === "function" &&
            typeof stage.advance === "function" &&
            Date.now() - (zhRuntime.lastAdvanceAt || 0) > 4000
          ) {
            const current = stage.current();
            if (current && stage.isDone(current)) {
              let tune = null;
              try {
                tune = zhStudyTuning();
              } catch (e) {
                tune = null;
              }
              if (tune && tune.modeOn && !tune.restudy) {
                zhRuntime.lastAdvanceAt = Date.now();
                Promise.resolve(stage.advance(tune, zhRuntime.log)).catch(() => {});
              }
            }
          }
        } catch (e) {}
        const silent = Date.now() - (zhRuntime.lastBeat || 0);
        if (silent > 30000 && Date.now() - (zhRuntime.lastRestartAt || 0) > 60000) {
          zhRuntime.lastRestartAt = Date.now();
          zhLogCadence(
            zhRuntime.log,
            "zh-loop-restart",
            `学习流程已 ${Math.round(silent / 1000)} 秒无响应，正在自动重启流程`,
            "warning",
            30
          );
          zhRuntime.booted = false;
          zhRuntime.epoch += 1;
          const restartStage = zhRuntime.stage;
          const restartLog = zhRuntime.log;
          Promise.resolve()
            .then(() => zhBootClassroom(restartStage, restartLog))
            .catch(() => {});
        }
      }, 2000);
    }
    document.addEventListener("visibilitychange", zhLogPageHidden);
    try {
      zhLogPageHidden();
      await zhRunClassroomSteps(stage, log, epoch);
    } finally {
      if (zhRuntime.epoch === epoch) document.removeEventListener("visibilitychange", zhLogPageHidden);
    }
  };

  const zhRunClassroomSteps = async (stage, log, epoch) => {
    while (zhRuntime.epoch === epoch) {
      await zhSleep(1.1);
      if (zhRuntime.epoch !== epoch) break;
      zhRuntime.lastBeat = Date.now();
      let tune = null;
      try {
        tune = zhStudyTuning();
      } catch (error) {
        tune = null;
      }
      if (!tune) {
        zhLogCadence(log, "zh-tuning-error", "读取学习配置失败，稍后重试", "warning", 30);
        continue;
      }
      if (!tune.modeOn) {
        log.addLog("智慧树「学习」已关闭，停止本页任务", "warning");
        break;
      }
      try {
        if (await zhCaptchaHold(tune, log)) continue;
        if (await zhHabitStep(tune, log)) continue;
        if (await zhQuizStep(tune, log)) continue;
        if (zhStageLooksDone(stage, tune)) {
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
          if (zhRuntime.idle === 15) zhLogExamEntryHint(log);
        }
      } catch (error) {
        zhLogCadence(log, "stage-error", `页面处理出现异常：${error && error.message ? error.message : error}`, "warning", 20);
      }
    }
  };

  const HIKE_CARD_SEL = ".question-item";
  const HIKE_OPTION_SEL = ".option-list .option-item";
  const HIKE_EDITOR_SEL = ".ProseMirror";
  const HIKE_SCORED_SEL = ".stu-score-show";

  const HIKE_PAGE_PATHS = [
    { path: "/stu/answer-homework", page: "homework" },
    { path: "/stu/answer-training", page: "training" },
    { path: "/stu-exam/answer-exam", page: "exam" },
    { path: "/stu-hike/stuHomeworkDo", page: "legacy" }
  ];

  const hikePageType = () => {
    const path = location.pathname;
    const hit = HIKE_PAGE_PATHS.find((item) => path.includes(item.path));
    return hit ? hit.page : "";
  };

  const hikeCookieOf = (name) => {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  };

  const hikeParams = () => {
    const query = new URLSearchParams(location.search);
    const parts = location.pathname.split("/").filter(Boolean);
    const index = parts.indexOf("exam-hub");
    return {
      courseId: index >= 0 ? parts[index + 1] || "" : "",
      homeworkId: query.get("homeworkId") || "",
      paperId: query.get("paperId") || "",
      examId: query.get("examId") || "",
      trainingBankId: query.get("trainingBankId") || "",
      practiceQuestionsMainId: query.get("practiceQuestionsMainId") || ""
    };
  };

  const hikePrimeTraining = (params, accessToken) => new Promise((resolve) => {
    const platformToken = hikeCookieOf("ai-poly");
    if (!platformToken) {
      resolve({ code: -1, msg: "未读取到平台登录凭证，请刷新页面后重试" });
      return;
    }
    if (!accessToken) {
      resolve({ code: -1, msg: "未配置用户密钥，请前往设置中填写" });
      return;
    }
    _GM_xmlhttpRequest({
      url: getRandomServer(),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        token: accessToken,
        async: true,
        questionData: {
          workType: "zhs",
          type: "0",
          question: "hike:training:prime",
          hike: { prime: true, platformToken, page: "training", ...params }
        }
      }),
      timeout: 25e3,
      onload: (response) => {
        try {
          resolve(JSON.parse(response.responseText));
        } catch (e) {
          resolve({ code: -1, msg: "接口返回异常" });
        }
      },
      onerror: () => resolve({ code: -1, msg: "网络错误，请检查网络后重试" }),
      ontimeout: () => resolve({ code: -1, msg: "请求超时，请稍后重试" })
    });
  });

  const hikeClean = (text) => String(text || "").replace(/\s+/g, "").toLowerCase();

  const hikeOptionsOf = (card) => Array.from(card.querySelectorAll(HIKE_OPTION_SEL));

  const hikeOptionText = (option) => {
    const node = option.querySelector(".option-content");
    return (node || option).textContent || "";
  };

  const hikeIsPicked = (option) => option.classList.contains("is-choose")
    || Boolean(option.querySelector("[class*='xuanzhong']"))
    || Boolean(option.querySelector(".el-checkbox__input.is-checked, .el-radio__input.is-checked"));

  const hikePick = async (option) => {
    if (!option) return false;
    if (hikeIsPicked(option)) return true;
    option.click();
    await zhSleep(0.25);
    return hikeIsPicked(option);
  };

  const hikeMatchIndexes = (options, answers) => {
    const texts = options.map((option) => hikeClean(hikeOptionText(option)));
    const picked = [];
    for (const answer of answers) {
      const target = hikeClean(answer);
      if (!target) continue;
      let index = texts.indexOf(target);
      if (index < 0) {
        index = texts.findIndex((text) => text && (text.includes(target) || target.includes(text)));
      }
      if (index >= 0 && !picked.includes(index)) picked.push(index);
    }
    return picked.sort((a, b) => a - b);
  };

  const hikeFindEditor = (element, editors) => {
    const usable = (value) => Boolean(value && value.commands && typeof value.commands.setContent === "function");
    if (usable(element.editor)) return element.editor;
    const index = editors.indexOf(element);
    if (index < 0) return null;
    const pageNode = _unsafeWindow.document.querySelectorAll(HIKE_EDITOR_SEL)[index];
    const fromPage = pageNode ? pageNode.editor : null;
    return usable(fromPage) ? fromPage : null;
  };

  const hikeWriteEditors = async (card, answers) => {
    const editors = Array.from(card.querySelectorAll(HIKE_EDITOR_SEL));
    if (!editors.length) return false;
    const values = editors.length === 1 ? [answers.join("\n")] : answers;
    let filled = 0;
    for (let i = 0; i < editors.length; i++) {
      const value = values[i];
      if (!value) continue;
      const editor = editors[i];
      const instance = hikeFindEditor(editor, editors);
      if (instance) {
        instance.commands.setContent("<p>" + value.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch])) + "</p>", true);
      } else {
        editor.focus();
        document.execCommand("selectAll", false);
        document.execCommand("insertText", false, value);
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      }
      await zhSleep(0.2);
      const expected = hikeClean(value).slice(0, 12);
      if (expected && hikeClean(editor.textContent || "").indexOf(expected) >= 0) filled += 1;
    }
    return filled > 0;
  };

  const hikeCardQuestion = (card) => {
    const optionNodes = Array.from(card.querySelectorAll(HIKE_OPTION_SEL));
    const titleNode = card.querySelector(".qeustion-content .markdown-latex-container, .combination-content");
    const typeNode = card.querySelector(".title-box .title, .combination-title");
    const options = {};
    optionNodes.forEach((node) => {
      options[zhPaperClean(hikeOptionText(node))] = node;
    });
    return {
      element: card,
      type: ppZhTypeCodeOf(typeNode ? typeNode.textContent : ""),
      title: zhPaperClean(titleNode ? titleNode.textContent : ""),
      optionsText: optionNodes.map((node) => zhPaperClean(hikeOptionText(node))),
      options,
      workType: "zhs",
      refer: location.href
    };
  };

  const hikeFillChoice = async (optionNodes, type, answers) => {
    const indexes = hikeMatchIndexes(optionNodes, answers);
    const limit = type === "0" ? indexes.slice(0, 1) : indexes;
    let ok = false;
    for (const index of limit) {
      if (await hikePick(optionNodes[index])) ok = true;
    }
    return ok;
  };

  const hikeSolveExamCards = async (log, isActive) => {
    const cards = Array.from(document.querySelectorAll(HIKE_CARD_SEL));
    let filled = 0;
    for (const card of cards) {
      if (!isActive()) return;
      if (card.querySelector(HIKE_SCORED_SEL)) continue;
      const question = hikeCardQuestion(card);
      if (!question.title) continue;
      question.isActive = isActive;
      const result = await queryAnswer(question);
      if (!isActive()) return;
      const answers = result && result.code === 200 && result.data ? result.data.answer : null;
      if (!Array.isArray(answers) || !answers.length) continue;
      if (question.type === "0" || question.type === "1" || question.type === "3") {
        if (await hikeFillChoice(hikeOptionsOf(card), question.type, answers)) filled += 1;
      } else if (await hikeWriteEditors(card, answers)) {
        filled += 1;
      }
      await zhSleep(0.3);
    }
    log.addLog(`共 ${cards.length} 题，已填入 ${filled} 题，请检查后手动提交`, "warning");
  };

  const hikeSolveLegacyCards = async (log, isActive) => {
    if (!isActive()) return;
    const cards = Array.from(document.querySelectorAll(".card_ul .card_li"));
    if (cards.length) cards[0].click();
    await zhSleep(2);
    let previous = "";
    let filled = 0;
    for (let step = 0; step < 200 && isActive(); step++) {
      let question = null;
      for (let wait = 0; wait < 20 && isActive(); wait++) {
        const root = document.querySelector(".q_main");
        if (root) {
          const optionNodes = Array.from(root.querySelectorAll("label"));
          const title = zhPaperClean(zhPaperTextOf(root, [".question-topic"]));
          if (title && title !== previous) {
            const options = {};
            optionNodes.forEach((node) => {
              options[zhPaperClean(node.textContent)] = node;
            });
            question = {
              element: root,
              type: ppZhTypeCodeOf(zhPaperTextOf(root, [".question_score"])),
              title,
              optionsText: optionNodes.map((node) => zhPaperClean(node.textContent)),
              options,
              workType: "zhs",
              refer: location.href
            };
            break;
          }
        }
        await zhSleep(0.3);
      }
      if (!question || !isActive()) break;
      previous = question.title;
      question.isActive = isActive;
      const result = await queryAnswer(question);
      if (!isActive()) return;
      const answers = result && result.code === 200 && result.data ? result.data.answer : null;
      if (Array.isArray(answers) && answers.length) {
        const optionNodes = Object.values(question.options);
        if (question.type === "0" || question.type === "1" || question.type === "3") {
          if (await hikeFillChoice(optionNodes, question.type, answers)) filled += 1;
        }
      }
      if (!isActive()) return;
      const next = document.querySelector(".check_btn:not(.is-disabled)");
      if (!next) break;
      next.click();
      await zhSleep(1.5);
    }
    if (isActive()) log.addLog(`作业任务页已填入 ${filled} 题，请检查后手动提交`, "warning");
  };

  const useHikePaperAnswer = async () => {
    const runUrl = window.location.href;
    const isActive = () => window.location.href === runUrl;
    const page = hikePageType();
    if (!page) return;

    const log = useLogStore();
    const setting = useSettingStore();
    if (!setting.config.basicConfig.autoAnswer.value) {
      log.addLog("自动答题已关闭，请前往设置中更改", "warning");
      return;
    }

    if (page === "training") {
      const response = await hikePrimeTraining(hikeParams(), setting.config.basicConfig.token.value);
      if (!isActive()) return;
      if (response && response.code === 200) {
        const primed = response.data ? response.data.primed : 0;
        log.addLog(primed ? `已读取 ${primed} 道题的答案` : "答案已就绪");
      } else {
        log.addLog(`读取答案失败：${(response && response.msg) || "未知错误"}，改为按页面题目查询..`, "warning");
      }
    }

    if (page === "legacy") await hikeSolveLegacyCards(log, isActive);
    else await hikeSolveExamCards(log, isActive);
  };

  const PP_HIKE_DETAIL_PATH = "/stu/study/resource-detail";
  const PP_HIKE_API = "https://cloudapi.polymas.com";
  const PP_HIKE_MEDIA = new Set(["mp4", "mov", "m4v", "flv", "avi", "wmv", "mkv", "webm", "mp3", "m4a", "wav", "aac", "ogg"]);

  const ppHikeStudyPage = (href) => {
    try {
      const url = new URL(href);
      if (url.origin !== PP_HIKE_STUDY_ORIGIN || url.username || url.password) return null;
      const path = url.pathname.replace(/\/$/, "");
      if (/^\/(?:custom-)?stu-hike\/agent-course-hike\/ai-course-center$/.test(path)) return { kind: "center" };
      const course = path.match(/^(\/(?:custom-)?stu-hike\/agent-course-full\/([\w-]+))\/(.+)$/);
      if (!course) return null;
      const [, coursePath, courseId, rest] = course;
      if (rest === "stu/course-home") return { kind: "home", coursePath, courseId };
      const detail = rest.match(/^([\w-]+)\/([\w-]+)\/([\w-]+)\/stu\/study\/resource-detail$/);
      if (!detail) return null;
      const [, libraryFolderId, resourceId, classId] = detail;
      return { kind: "detail", coursePath, courseId, libraryFolderId, resourceId, classId };
    } catch (e) {
      return null;
    }
  };

  const ppHikeStudyRead = async (path, body, signal) => {
    const token = hikeCookieOf("ai-poly");
    if (!token) throw new Error("未读取到平台登录状态，请刷新页面后重试");
    const request = new AbortController();
    const abort = () => request.abort();
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, 12e3);
    try {
      const res = await fetch(PP_HIKE_API + path, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify(body),
        signal: request.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
        redirect: "error"
      });
      if (!res.ok) throw new Error(`平台接口返回 HTTP ${res.status}`);
      const payload = await res.json();
      if (Number(payload?.code) !== 200 || !Array.isArray(payload.data)) throw new Error("平台学习接口返回的数据有误");
      return payload.data;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  };

  const ppHikeStudyContext = async (page, signal) => {
    const terms = await ppHikeStudyRead("/student-course/student/term/list", { courseId: page.courseId }, signal);
    const active = terms.find((item) => Number(item?.isCurrent) === 1) ?? terms[0];
    const term = Number(active?.term);
    if (!Number.isSafeInteger(term) || term <= 0) throw new Error("未读取到有效课程学期");
    return { ...page, term };
  };

  const ppHikeStudyTargets = async (context, signal) => {
    const { courseId, classId, libraryFolderId, term } = context;
    const tree = await ppHikeStudyRead("/student-course/study/student/resource/queryTree", { courseId, classId, libraryFolderId, term }, signal);
    const resources = [];
    const pending = [...tree].reverse().map((node) => ({ node, locked: false }));
    while (pending.length) {
      const { node, locked } = pending.pop();
      if (!node || typeof node !== "object") throw new Error("平台学习资源目录有误");
      const unavailable = locked || node.lock === true;
      if (Number(node.type) === 2) {
        const id = String(node.nodeId ?? "");
        if (!/^[\w-]+$/.test(id)) throw new Error("未读取到有效学习资源编号");
        resources.push({
          id, locked: unavailable, required: node.isRequire === true, finished: node.isFinished === true,
          title: String(node.detail?.title || "未命名资源").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
          media: PP_HIKE_MEDIA.has(String(node.detail?.bizSuffix || "").toLowerCase())
        });
      }
      if (Array.isArray(node.children)) {
        for (let i = node.children.length - 1; i >= 0; i--) pending.push({ node: node.children[i], locked: unavailable });
      }
    }
    if (!resources.length) throw new Error("平台未返回学习资源");
    const required = resources.filter((resource) => resource.required);
    return { resources, targets: required.length ? required : resources };
  };

  const ppHikeStudyWait = (signal, ms) => new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }
    const finish = (ok) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      resolve(ok);
    };
    const abort = () => finish(false);
    const timer = setTimeout(() => finish(true), ms);
    signal.addEventListener("abort", abort, { once: true });
  });

  const ppHikeStudyFrame = (fileId) => {
    const iframe = document.querySelector("iframe#previewIframe");
    const preview = iframe?.getAttribute("src");
    const source = preview && ppHikePreviewUrl(preview, location.href);
    return source && (!fileId || source.fileId === fileId) && iframe.contentWindow ? { ...source, frame: iframe.contentWindow } : null;
  };

  const ppHikeStudyPlayback = async (session, replay, checkFinished) => {
    const { signal } = session.controller;
    const canPlay = () => session.active() && zhStudyTuning().autoPlay;
    const fileId = session.resourceId;
    const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    let peer;
    let ready;
    let outcome;
    const post = (command, fields = {}) => peer?.frame.postMessage({
      channel: PP_HIKE_BRIDGE, session: id, fileId, command, ...fields
    }, peer.origin);
    const receive = (event) => {
      if (!peer || peer.frame !== event.source || peer.origin !== event.origin) return;
      const live = ppHikeStudyFrame(fileId);
      if (live?.frame !== peer.frame || live.origin !== peer.origin) return;
      const data = event.data;
      if (data?.channel !== PP_HIKE_BRIDGE || data.fileId !== fileId || data.session !== id) return;
      if (data.event === "ready" && Number.isFinite(data.duration) && data.duration > 0 && Number.isFinite(data.currentTime)) ready = data;
      else if (ready && ["ended", "paused", "blocked"].includes(data.event)) outcome = data.event;
    };
    const stop = () => post("stop");
    window.addEventListener("message", receive);
    signal.addEventListener("abort", stop, { once: true });
    let keepAlive;
    try {
      const readyBy = Date.now() + 60e3;
      while (!ready && canPlay() && Date.now() < readyBy) {
        peer = ppHikeStudyFrame(fileId);
        post("probe");
        await ppHikeStudyWait(signal, 500);
      }
      if (!canPlay()) return "cancelled";
      if (!ready) return "missing";
      const tuning = zhStudyTuning();
      const rate = tuning.autoSpeed ? Math.min(tuning.speed, PP_HIKE_MAX_RATE) : null;
      post("start", { rate, replay });
      const connected = () => {
        const live = ppHikeStudyFrame(fileId);
        return live?.frame === peer.frame && live.origin === peer.origin;
      };
      keepAlive = setInterval(() => {
        if (canPlay() && connected()) post("keep");
      }, 3000);
      const remaining = Math.max(0, ready.duration - (replay ? 0 : ready.currentTime));
      const deadline = Date.now() + Math.min(6 * 3600e3, remaining * 2e3 + 120e3);
      let nextCheck = Date.now() + 30e3;
      while (canPlay() && connected() && !outcome && Date.now() < deadline) {
        if (Date.now() >= nextCheck) {
          if (await checkFinished()) return "finished";
          nextCheck = Date.now() + 30e3;
        }
        await ppHikeStudyWait(signal, 500);
      }
      if (!canPlay()) return "cancelled";
      return outcome || (connected() ? "timeout" : "missing");
    } finally {
      stop();
      clearInterval(keepAlive);
      window.removeEventListener("message", receive);
      signal.removeEventListener("abort", stop);
    }
  };

  const ppHikeRecentSkips = (page, resourceId) => {
    const key = `pp.hike.skips.${page.courseId}.${page.classId}.${page.libraryFolderId}`;
    let recent = [];
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "[]");
      if (Array.isArray(saved)) recent = saved.filter((item) => Array.isArray(item) && item[1] > Date.now());
      if (resourceId) {
        recent = recent.filter((item) => item[0] !== resourceId);
        recent.push([resourceId, Date.now() + 2 * 3600e3]);
        sessionStorage.setItem(key, JSON.stringify(recent));
      }
    } catch (e) {
      if (resourceId) return null;
    }
    return new Set(recent.map((item) => item[0]));
  };

  const ppRunHikeStudy = async (session, page) => {
    const log = useLogStore();
    const { signal } = session.controller;
    const context = await ppHikeStudyContext(page, signal);
    const read = () => ppHikeStudyTargets(context, signal);
    let snapshot = await read();
    if (!session.active()) return;
    const id = page.resourceId;
    const current = () => snapshot.resources.find((resource) => resource.id === id);
    const resource = current();
    if (!resource) throw new Error("未在平台学习目录中找到当前资源");
    const checkFinished = async () => {
      snapshot = await read();
      return session.active() && current()?.finished === true;
    };
    if (resource.locked && !resource.finished) log.addLog(`「${resource.title}」暂未解锁`, "warning");
    else if (!resource.finished) {
      log.addLog(`AI智课正在学习「${resource.title}」`, "primary");
      if (resource.media) {
        if (!zhStudyTuning().autoPlay) {
          log.addLog("自动播放已关闭，请手动播放当前资源", "info");
          return;
        }
        for (let attempt = 0; attempt <= 3 && session.active(); attempt++) {
          const result = await ppHikeStudyPlayback(session, attempt > 0, checkFinished);
          if (!session.active() || result === "cancelled") return;
          if (result === "paused" || result === "blocked") {
            log.addLog("AI智课播放已暂停或无法启动，请手动继续", "warning");
            return;
          }
          if (result === "finished" || !await ppHikeStudyWait(signal, 3000) || await checkFinished()) break;
          if (result === "missing" || attempt === 3) break;
          log.addLog(`平台尚未确认「${resource.title}」完成，准备重新播放（${attempt + 1}/3）`, "warning");
        }
      } else {
        if (!await ppHikeStudyWait(signal, 15e3)) return;
        await checkFinished();
      }
      if (!session.active()) return;
      if (current()?.finished) log.addLog(`平台已确认「${resource.title}」完成`, "success");
      else log.addLog(`平台尚未确认「${resource.title}」完成，请手动补学`, "warning");
    }
    const unfinished = snapshot.targets.filter((item) => !item.finished);
    if (!unfinished.length) {
      log.addLog("平台已确认全部目标学习资源完成", "success");
      return;
    }
    if (!zhStudyTuning().autoNext) return;
    const skipped = ppHikeRecentSkips(page, current()?.finished || resource.locked ? undefined : id);
    if (!skipped) return;
    const next = unfinished.find((item) => !item.locked && item.id !== id && !skipped.has(item.id));
    if (!next) {
      log.addLog(`平台仍有 ${unfinished.length} 项学习资源未完成，请查看未解锁或需补学的资源`, "warning");
      return;
    }
    if (!await ppHikeStudyWait(signal, 1200) || !session.active() || !zhStudyTuning().autoNext) return;
    log.addLog(`前往「${next.title}」`, "info");
    location.assign(`${PP_HIKE_STUDY_ORIGIN}${page.coursePath}/${page.libraryFolderId}/${next.id}/${page.classId}${PP_HIKE_DETAIL_PATH}`);
  };

  let ppHikeStudyWatching = false;
  const usePpHikeStudy = () => {
    if (ppHikeStudyWatching || !ppHikeStudyPage(location.href)) return;
    ppHikeStudyWatching = true;
    const log = useLogStore();
    let session;
    let previousKey;
    let resourcePath;
    let previewHasMatched;
    let timer;
    const currentPage = () => {
      const page = ppHikeStudyPage(location.href);
      if (resourcePath !== location.pathname) {
        resourcePath = location.pathname;
        previewHasMatched = false;
      }
      if (page?.kind !== "detail") return page;
      const preview = ppHikeStudyFrame();
      if (preview?.fileId === page.resourceId) previewHasMatched = true;
      if (previewHasMatched && /^[\w-]+$/.test(preview?.fileId || "")) page.resourceId = preview.fileId;
      return page;
    };
    const stop = () => {
      session?.controller.abort();
      session = null;
    };
    const sync = () => {
      const page = currentPage();
      const allowed = zhStudyTuning().modeOn;
      const key = `${location.pathname}:${page?.resourceId || ""}:${allowed}`;
      if (key === previousKey) return;
      previousKey = key;
      stop();
      if (!page) return;
      if (page.kind !== "detail") {
        log.addLog("请从 AI智课课程中打开具体学习资源", "info");
        return;
      }
      if (!allowed) {
        log.addLog("智慧树学习模式已关闭", "info");
        return;
      }
      const controller = new AbortController();
      const active = () => !controller.signal.aborted && `${location.pathname}:${currentPage()?.resourceId || ""}:true` === key && zhStudyTuning().modeOn;
      session = { controller, active, resourceId: page.resourceId };
      ppRunHikeStudy(session, page).catch(() => {
        if (active()) log.addLog("无法读取 AI智课平台学习数据，请检查登录状态或刷新重试", "warning");
      });
    };
    const start = () => {
      if (timer) return;
      timer = setInterval(sync, 750);
      sync();
    };
    window.addEventListener("pagehide", () => {
      stop();
      clearInterval(timer);
      timer = null;
      previousKey = null;
    });
    window.addEventListener("pageshow", start);
    start();
  };

  const useZhClassroomStudy = async () => {
    const log = useLogStore();
    if (zhRuntime.booted) return;
    zhInstallDialogGuard(log);
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
    forumSend: ".prompt-send-btn:not(.disabled)",
    exerciseFrame: ".detail-container .lms-graph-exercise iframe#iframeExerciseId",
    encryptedFont: ".xuetangx-com-encrypted-font"
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
    ppMuteOnce(media);
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
    try {
      if ((opts && opts.restart) || !media.currentTime || media.currentTime < 1) media.currentTime = 1;
    } catch (e) {}
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
      useLogStore().addLog(`开始播放：${opts.title || "视频"}`, "primary");
    } catch (e) {}
    Promise.resolve(media.play())
      .then(() => {
        try {
          useLogStore().addLog(`播放成功，倍速：${Number(media.playbackRate) || 1}x`, "primary");
        } catch (e) {}
      })
      .catch(() => {});
  });

  const yktPlayMediaCalm = (media, opts) => new Promise((resolve) => {
    let settled = false;
    let ticker = null;
    const finish = (reason) => {
      if (settled) return;
      settled = true;
      if (ticker) {
        try { ticker.stop(); } catch (e) {}
      }
      try {
        media.onended = null;
        media.onpause = null;
      } catch (e) {}
      resolve(reason);
    };
    let rate = 1;
    try {
      const raw = typeof opts.getRate === "function" ? opts.getRate() : opts.rate;
      const num = Number(raw);
      if (Number.isFinite(num) && num > 0) rate = num;
    } catch (e) {}
    try { media.currentTime = 1; } catch (e) {}
    try { media.playbackRate = rate; } catch (e) {}
    ppMuteOnce(media);
    media.onended = () => finish("ended");
    media.onpause = () => {
      if (media.ended || settled) return;
      setTimeout(() => {
        try { media.play(); } catch (e) {}
      }, 900);
    };
    try {
      useLogStore().addLog(`开始播放：数字人视频，倍速 ${rate}x`, "primary");
    } catch (e) {}
    Promise.resolve(media.play()).catch(() => {});
    ticker = afkIntervalHandle(() => {
      try {
        if (!media.isConnected) return finish("switched");
        if (yktMediaFinished(media)) return finish("ended");
        if (media.paused && !media.ended) media.play().catch(() => {});
      } catch (e) {}
    }, 2000);
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
    logStore.addLog(`课件阅读完成（共 ${switched} 页）`, "success");
    return switched;
  };

  const PP_YKT_WORK = {
    item: ".container-problem .subject-item",
    typeLabel: ".item-type",
    body: ".problem-body",
    options: 'ul[class*="list-unstyled"] li label',
    blankInput: 'input.blank-item-dynamic, input[placeholder="输入答案"]',
    ueditor: 'iframe[id^="ueditor_"]',
    textarea: "textarea",
    navItem: ".problems-aside .subject-item.J_order",
    submit: ".problem-box button.el-button--primary",
    captcha: "#homework-automation-risk-challenge",
    dialogs: ".homework-problem-change-guard-dialog, .homework-problem-batch-submit-dialog",
  };

  const ppYktFlat = (value) => String(value == null ? "" : value).replace(/\s+/g, " ").trim();

  const ppYktKind = (text) => {
    const t = String(text || "");
    if (/多选|多项选择|不定项/.test(t)) return "1";
    if (/单选|单项选择/.test(t)) return "0";
    if (/判断|是非/.test(t)) return "3";
    if (/填空/.test(t)) return "2";
    if (/简答|问答|主观|论述|名词|计算/.test(t)) return "4";
    return "";
  };

  const ppYktOptionLabel = (label) => {
    try {
      const input = label.querySelector("input");
      const val = String((input && input.value) || "").toLowerCase();
      if (val === "true") return "对";
      if (val === "false") return "错";
      let node = label.querySelector(".radioText, .checkboxText");
      if (!node) node = label.querySelector(".el-radio__label, .el-checkbox__label") || label;
      return ppYktFlat(node.textContent).replace(/^[A-Za-z][.、)．:：]\s*/, "");
    } catch (e) {
      return "";
    }
  };

  const ppYktOptionChosen = (label) => {
    try {
      const input = label.querySelector("input");
      if (input && input.checked) return true;
      const cls = `${label.className || ""} ${(label.querySelector(".el-radio__inner, .el-checkbox__inner") || {}).className || ""}`;
      return /is-checked/.test(cls);
    } catch (e) {
      return false;
    }
  };

  const ppYktChooseOption = async (label) => {
    try {
      label.scrollIntoView({ block: "center", inline: "nearest" });
    } catch (e) {}
    const before = ppYktOptionChosen(label);
    try {
      label.click();
    } catch (e) {}
    await delay(0.15);
    if (ppYktOptionChosen(label) !== before) return true;
    try {
      label.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    } catch (e) {}
    await delay(0.15);
    return true;
  };

  const ppYktHasAnswer = (item, optionSelector) => {
    try {
      const sel = optionSelector || PP_YKT_WORK.options;
      if (Array.from(item.querySelectorAll(sel)).some(ppYktOptionChosen)) return true;
      const fields = Array.from(item.querySelectorAll(`${PP_YKT_WORK.blankInput}, ${PP_YKT_WORK.textarea}`));
      if (fields.some((f) => String(f.value == null ? "" : f.value).trim())) return true;
      const frames = Array.from(item.querySelectorAll(PP_YKT_WORK.ueditor));
      for (const frame of frames) {
        try {
          const body = frame.contentDocument && frame.contentDocument.body;
          if (body && String(body.textContent || "").trim()) return true;
        } catch (e) {}
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const ppYktLoudHint = (text, tone) => {
    let node = null;
    try {
      let win = window;
      try {
        if (window.top && window.top.document && window.top !== window) win = window.top;
      } catch (e) {}
      const doc = (win && win.document) || document;
      const host = doc.body || doc.documentElement;
      if (!host) return () => {};
      const color = tone === "success" ? "#16a34a" : tone === "danger" ? "#dc2626" : "#f59e0b";
      node = doc.createElement("div");
      node.setAttribute("data-pp-ykt-hint", "1");
      node.style.cssText = [
        "position:fixed",
        "left:50%",
        "top:20px",
        "transform:translateX(-50%)",
        "z-index:2147483647",
        "max-width:min(600px,92vw)",
        "padding:12px 20px",
        "border-radius:10px",
        "background:" + color,
        "color:#fff",
        "font-size:14px",
        "line-height:1.6",
        "font-family:system-ui,-apple-system,'Microsoft YaHei',sans-serif",
        "text-align:center",
        "white-space:pre-wrap",
        "box-shadow:0 10px 28px rgba(0,0,0,.28)",
        "pointer-events:none",
      ].join(";");
      node.textContent = text;
      host.appendChild(node);
    } catch (e) {
      node = null;
    }
    return () => {
      try {
        if (node && node.parentNode) node.parentNode.removeChild(node);
      } catch (e) {}
    };
  };

  const ppYktDeskPing = (title, body) => {
    try {
      if (typeof Notification === "undefined") return;
      const fire = () => {
        try {
          new Notification(title, { body, tag: "pp-ykt-notice" });
        } catch (e) {}
      };
      if (Notification.permission === "granted") return fire();
      if (Notification.permission === "default" && typeof Notification.requestPermission === "function") {
        Promise.resolve(Notification.requestPermission())
          .then((p) => {
            if (p === "granted") fire();
          })
          .catch(() => {});
      }
    } catch (e) {}
  };

  let _ppYktChallengeAlerted = false;
  let _ppYktChallengeWatchCount = 0;

  const ppYktChallengePresent = (doc) => {
    try {
      return !!doc.querySelector(PP_YKT_WORK.captcha);
    } catch (e) {
      return false;
    }
  };

  const ppYktWatchChallenge = (doc, logStore) => {
    let visible = false;
    let shut = () => {};
    _ppYktChallengeWatchCount += 1;
    const tick = () => {
      const now = ppYktChallengePresent(doc);
      if (now === visible) return;
      visible = now;
      if (now) {
        if (_ppYktChallengeAlerted) return;
        _ppYktChallengeAlerted = true;
        logStore.addLog("检测到雨课堂风控验证码，请在页面手动完成，完成后自动继续", "danger");
        shut = ppYktLoudHint("雨课堂需要手动验证：请在页面上完成验证码，通过后自动继续答题", "warning");
        ppYktDeskPing("雨课堂：需要手动验证", "检测到风控验证码，请完成验证后继续答题");
      } else {
        try {
          shut();
        } catch (e) {}
        shut = () => {};
        if (!_ppYktChallengeAlerted) return;
        _ppYktChallengeAlerted = false;
        logStore.addLog("验证码已通过，继续答题", "success");
      }
    };
    const timer = setInterval(tick, 400);
    tick();
    return {
      stop: () => {
        clearInterval(timer);
        try {
          shut();
        } catch (e) {}
        _ppYktChallengeWatchCount = Math.max(0, _ppYktChallengeWatchCount - 1);
        _ppYktChallengeAlerted = false;
      },
    };
  };

  const ppYktChallengeHold = async (doc, logStore, timeoutMs = 180000) => {
    if (!ppYktChallengePresent(doc)) return false;
    try {
      const box = doc.querySelector(PP_YKT_WORK.captcha);
      if (box) box.scrollIntoView({ block: "center", inline: "nearest" });
    } catch (e) {}
    let shut = () => {};
    if (!_ppYktChallengeAlerted) {
      _ppYktChallengeAlerted = true;
      logStore.addLog("检测到雨课堂风控验证码，请在页面手动完成，完成后自动继续", "danger");
      shut = ppYktLoudHint("雨课堂需要手动验证：请在页面上完成验证码，通过后自动继续答题", "warning");
      ppYktDeskPing("雨课堂：需要手动验证", "检测到风控验证码，请完成验证后继续答题");
    }
    const start = Date.now();
    try {
      while (Date.now() - start < timeoutMs) {
        await delay(1);
        if (!ppYktChallengePresent(doc)) {
          if (_ppYktChallengeWatchCount === 0 && _ppYktChallengeAlerted) {
            _ppYktChallengeAlerted = false;
            logStore.addLog("验证码已通过，继续答题", "success");
          }
          return true;
        }
      }
    } finally {
      try {
        shut();
      } catch (e) {}
    }
    logStore.addLog("验证码等待超时（3 分钟），跳过本题", "warning");
    return false;
  };

  const ppYktConfirmHold = async (doc, logStore, timeoutMs = 120000) => {
    const find = () => {
      try {
        const list = Array.from(doc.querySelectorAll(PP_YKT_WORK.dialogs));
        for (const el of list) {
          const wrap = el.closest ? el.closest(".el-dialog__wrapper") : null;
          const target = wrap || el;
          if (!target || !target.offsetHeight) continue;
          let display = "";
          try {
            const view = target.ownerDocument && target.ownerDocument.defaultView;
            display = view ? view.getComputedStyle(target).display : "";
          } catch (e) {
            display = target.style ? target.style.display : "";
          }
          if (display && display !== "none") return target;
        }
      } catch (e) {}
      return null;
    };
    if (!find()) return false;
    logStore.addLog("检测到雨课堂确认弹窗，请手动处理后脚本会自动继续", "danger");
    const shut = ppYktLoudHint("雨课堂弹出确认框：请手动处理（未保存答案/提交确认），处理后自动继续", "warning");
    ppYktDeskPing("雨课堂：需要确认", "页面上有确认弹窗，请处理后继续");
    const start = Date.now();
    try {
      while (Date.now() - start < timeoutMs) {
        await delay(1);
        if (!find()) {
          logStore.addLog("弹窗已处理，继续", "success");
          ppYktLoudHint("弹窗已处理，继续答题", "success");
          return true;
        }
      }
    } finally {
      shut();
    }
    logStore.addLog("弹窗等待超时（2 分钟），跳过", "warning");
    return false;
  };

  const ppYktWriteAnswers = async (item, typeCode, answers, optionSource) => {
    const list = (Array.isArray(optionSource)
      ? optionSource.map((o) => ({ el: o.el, text: o.text == null ? ppYktOptionLabel(o.el) : o.text }))
      : Array.from(item.querySelectorAll(optionSource || PP_YKT_WORK.options)).map((el) => ({
          el,
          text: ppYktOptionLabel(el),
        }))
    ).filter((o) => o.text || o.el.querySelector("input[value='true'], input[value='false']"));

    if (typeCode === "0" || typeCode === "1" || typeCode === "3") {
      if (!list.length) return false;
      let useSimilarity = true;
      try {
        const cfg = useConfigStore();
        const answerPart = cfg.platformParams[cfg.platformName]?.parts.find((p) => p && p.name === PP_KEY.ANSWER);
        const similarParam = answerPart && answerPart.params.find((p) => p && p.name === PP_KEY.SIMILAR);
        if (similarParam) useSimilarity = similarParam.value !== false;
      } catch (e) {}
      const threshold = FILL_MATCH_FLOOR;
      const fuzzyPick = (ans) => {
        if (!useSimilarity) return -1;
        const target = String(ans == null ? "" : ans).trim();
        if (!target) return -1;
        let best = -1;
        let bestScore = 0;
        list.forEach((opt, index) => {
          const score = computeMatch(target, String(opt.text || ""));
          if (score > bestScore) {
            bestScore = score;
            best = index;
          }
        });
        return bestScore >= threshold ? best : -1;
      };
      const wanted = new Set();
      answers.forEach((ans) => {
        const hits = ppZhH5Indexes(list, ans, typeCode);
        if (hits.length) {
          hits.forEach((idx) => wanted.add(idx));
          return;
        }
        const fuzzy = fuzzyPick(ans);
        if (fuzzy >= 0) wanted.add(fuzzy);
      });
      if (!wanted.size) return false;
      if (typeCode === "1") {
        for (let i = 0; i < list.length; i += 1) {
          if (ppYktOptionChosen(list[i].el) !== wanted.has(i)) {
            await ppYktChooseOption(list[i].el);
            await delay(0.12);
          }
        }
      } else {
        const target = list[Array.from(wanted)[0]];
        if (target && !ppYktOptionChosen(target.el)) await ppYktChooseOption(target.el);
      }
      return true;
    }

    const texts = answers.map((a) => String(a == null ? "" : a).replace(/<[^>]+>/g, "").trim());
    const fields = [
      ...Array.from(item.querySelectorAll(PP_YKT_WORK.blankInput)),
      ...Array.from(item.querySelectorAll(PP_YKT_WORK.textarea)),
    ].filter((f) => !/checkbox|radio/i.test(String(f.type || "")));

    let written = 0;
    fields.forEach((field, index) => {
      const text = texts[index] == null ? texts[0] : texts[index];
      if (!text) return;
      try {
        const proto = field.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) setter.call(field, text);
        else field.value = text;
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
        written += 1;
      } catch (e) {}
    });

    const frames = Array.from(item.querySelectorAll(PP_YKT_WORK.ueditor));
    frames.forEach((frame, index) => {
      const text = texts[index] == null ? texts[0] : texts[index];
      if (!text) return;
      if (ppYktWriteRichText(frame, text)) written += 1;
    });

    return written > 0;
  };

  const ppYktWriteRichText = (frame, answer) => {
    const html = `<p>${String(answer)
      .trim()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n+/g, "</p><p>")}</p>`;
    try {
      const holder = frame.closest ? frame.closest('[id^="ueditor-"]') : null;
      const view = frame.ownerDocument && frame.ownerDocument.defaultView;
      if (holder && holder.id && view && view.UE) {
        const editor = view.UE.getEditor(holder.id);
        if (editor) {
          editor.ready(() => {
            try {
              editor.setContent(html);
            } catch (e) {}
          });
          return true;
        }
      }
    } catch (e) {}
    try {
      const body = frame.contentDocument && frame.contentDocument.body;
      if (!body) return false;
      body.innerHTML = html;
      body.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    } catch (e) {
      return false;
    }
  };

  const ppYktNavFinished = (navEl) => {
    if (!navEl) return false;
    try {
      if (navEl.querySelector(".icon-status")) return true;
      const status = navEl.querySelector(".text-status");
      return !!(status && status.textContent && status.textContent.includes("未批改"));
    } catch (e) {
      return false;
    }
  };

  const ppYktCommitQuestion = async (doc, logStore) => {
    const activeNav = () => {
      const nav = Array.from(doc.querySelectorAll(PP_YKT_WORK.navItem));
      const idx = nav.findIndex((el) => el.classList.contains("active"));
      return idx >= 0 ? nav[idx] : null;
    };
    const targetNav = activeNav();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const btn = Array.from(doc.querySelectorAll(PP_YKT_WORK.submit)).find(
        (b) =>
          ppYktFlat(b.textContent).includes("提交") &&
          !b.disabled &&
          !b.classList.contains("is-disabled"),
      );
      if (!btn) return ppYktNavFinished(targetNav);
      const beforeActive = activeNav();
      btn.click();
      await delay(1);
      const start = Date.now();
      while (Date.now() - start < 10000) {
        if (ppYktNavFinished(targetNav)) return true;
        const nowActive = activeNav();
        if (beforeActive && nowActive && nowActive !== beforeActive) return true;
        if (ppYktChallengePresent(doc)) {
          await ppYktChallengeHold(doc, logStore);
          if (ppYktNavFinished(targetNav)) return true;
          break;
        }
        await delay(0.3);
      }
      logStore.addLog("提交后未看到完成标记，重试一次", "warning");
    }
    logStore.addLog("本题提交状态未确认，请手动检查", "danger");
    return false;
  };

  const ppYktFingerprint = (doc) => {
    try {
      const cur = doc.querySelector(PP_YKT_WORK.item);
      if (!cur) return "";
      const type = ppYktFlat((cur.querySelector(PP_YKT_WORK.typeLabel) || {}).textContent);
      const body = cur.querySelector(PP_YKT_WORK.body);
      return `${type}|${ppYktFlat(body ? body.textContent : "").slice(0, 60)}`;
    } catch (e) {
      return "";
    }
  };

  const ppYktChangeGuardDialog = (doc) => {
    const roots = [doc, document].filter(Boolean);
    for (const root of roots) {
      let dialog = null;
      try {
        dialog = root.querySelector(".homework-problem-change-guard-dialog");
      } catch (e) {}
      if (!dialog) continue;
      const wrap = dialog.closest ? dialog.closest(".el-dialog__wrapper") : dialog.parentElement;
      const target = wrap || dialog;
      let display = "";
      try {
        const view = target.ownerDocument && target.ownerDocument.defaultView;
        display = view ? view.getComputedStyle(target).display : "";
      } catch (e) {
        display = target.style ? target.style.display : "";
      }
      if (target.offsetHeight && (!display || display !== "none")) return dialog;
    }
    return null;
  };

  const ppYktResolveChangeGuard = (doc, allowSubmit, logStore) => {
    const dialog = ppYktChangeGuardDialog(doc);
    if (!dialog) return false;
    const footer = dialog.querySelector(".el-dialog__footer") || dialog;
    const primary = footer.querySelector(".homework-problem-change-guard__primary-action");
    const buttons = Array.from(footer.querySelectorAll(".rain-btn"));
    const target = allowSubmit ? primary : buttons.find((el) => el !== primary);
    if (!target) return false;
    try {
      target.click();
    } catch (e) {
      return false;
    }
    if (logStore) {
      logStore.addLog(
        allowSubmit
          ? "检测到未提交提示：已选择「帮我提交」，继续下一题"
          : "检测到未提交提示：已选择「先不用了」，继续下一题",
        "primary",
      );
    }
    return true;
  };

  const ppYktAdvance = async (doc, options = {}) => {
    const opts = options || {};
    const before = ppYktFingerprint(doc);
    const nav = Array.from(doc.querySelectorAll(PP_YKT_WORK.navItem));
    if (!nav.length) return false;
    const activeIdx = nav.findIndex((el) => el.classList.contains("active"));
    const next = nav[activeIdx < 0 ? 0 : activeIdx + 1];
    if (!next) return false;
    try {
      next.scrollIntoView({ block: "center" });
    } catch (e) {}
    next.click();
    const start = Date.now();
    let guardHandled = false;
    let retried = false;
    while (Date.now() - start < 8000) {
      if (!guardHandled && ppYktResolveChangeGuard(doc, opts.allowSubmit === true, opts.logStore)) {
        guardHandled = true;
      }
      await delay(0.4);
      const now = ppYktFingerprint(doc);
      if (now && now !== before) return true;
      if (!retried && Date.now() - start > 3000) {
        retried = true;
        try {
          next.click();
        } catch (e) {}
      }
    }
    return false;
  };

  const useYktHomeworkLogic = async (exDoc, logStore, prepareFont) => {
    if (!exDoc) {
      logStore.addLog("未找到作业题目区域，请手动点开作业后重试", "warning");
      return;
    }
    const questionStore = useQuestionStore();
    const progressStore = useProgressStore();
    const autoSwitch = readYktParam(PP_KEY.YKT_CHAPTER, PP_KEY.AUTO_NEXT, true);
    const skipAnswered = readYktParam(PP_KEY.ANSWER, PP_KEY.SKIP_ANSWERED, true);
    const autoSubmit = readYktParam(PP_KEY.ANSWER, PP_KEY.AUTO_SUBMIT, true);

    let handled = 0;
    let filled = 0;
    let failed = 0;
    let skipped = 0;

    let paperTotal = 0;
    try {
      paperTotal = exDoc.querySelectorAll(PP_YKT_WORK.navItem).length;
    } catch (e) {}
    ppLogAnswerBegin(logStore.addLog, { platform: "ykt", scene: "作业", total: paperTotal });

    try {
      const nav = Array.from(exDoc.querySelectorAll(PP_YKT_WORK.navItem));
      if (nav.length && !nav[0].classList.contains("active")) {
        logStore.addLog("从第 1 题开始逐题检查", "primary");
        nav[0].scrollIntoView({ block: "center" });
        nav[0].click();
        await delay(1.2);
      }
    } catch (e) {}

    progressStore.update({
      taskName: "作业答题",
      type: "答题",
      isPlaying: true,
      questionTotal: paperTotal,
      questionIndex: 0,
      percent: 0,
      filledCount: 0,
      fillRate: 0,
      detail: paperTotal ? `第 0 / ${paperTotal} 题` : "等待题目加载",
    });

    const challengeWatch = ppYktWatchChallenge(exDoc, logStore);

    for (let step = 0; step < 100; step += 1) {
      await ppYktChallengeHold(exDoc, logStore);

      const item = await yktWaitFor(() => exDoc.querySelector(PP_YKT_WORK.item), 15, 300);
      if (!item) {
        logStore.addLog("未等到题目加载，结束本次作答", "warning");
        break;
      }

      if (prepareFont) await prepareFont(exDoc);

      const marker = ppYktFingerprint(exDoc);
      let plain = null;
      try {
        plain = ppDecryptQuestionClone(item, "ykt");
      } catch (e) {
        plain = null;
      }
      const plainRoot = plain || item;
      const stem = ppYktFlat((plainRoot.querySelector(PP_YKT_WORK.body) || {}).textContent).slice(0, 40);
      handled += 1;
      progressStore.update({
        questionIndex: handled,
        percent: paperTotal ? Math.min(99, Math.round((handled - 1) / paperTotal * 100)) : 0,
        detail: paperTotal ? `第 ${handled} / ${paperTotal} 题` : `第 ${handled} 题`,
      });
      ppLogAnswerQuestion(logStore.addLog, handled, stem);

      const html = (plain && plain.outerHTML) || item.outerHTML;
      const typeCode = ppYktKind((item.querySelector(PP_YKT_WORK.typeLabel) || {}).textContent);
      const liveOptions = Array.from(item.querySelectorAll(PP_YKT_WORK.options));
      const plainOptions = Array.from(plainRoot.querySelectorAll(PP_YKT_WORK.options));
      const optionList = liveOptions.map((el, index) => ({
        el,
        text: ppYktOptionLabel(plainOptions[index] || el),
      }));
      const question = {
        element: item,
        html,
        workType: "ykt",
        refer: exDoc.location ? exDoc.location.href : location.href,
        type: typeCode,
        title: stem,
        optionsText: optionList.map((o) => o.text),
      };

      if (skipAnswered && ppYktHasAnswer(item)) {
        skipped += 1;
        question.skipped = true;
        try {
          questionStore.addQuestion(question);
        } catch (e) {}
        ppLogAnswerSkipped(logStore.addLog, handled);
        if (!autoSwitch) break;
        const jumped = await ppYktAdvance(exDoc, { allowSubmit: false, logStore });
        if (!jumped) {
          logStore.addLog("本题已答，且没有其它未作答的题目了", "info");
          break;
        }
        await delay(0.6);
        continue;
      }

      let answerData = null;
      try {
        answerData = await queryAnswer(question);
      } catch (e) {
        answerData = null;
      }

      let filledOk = false;
      if (answerData && answerData.code === 200) {
        const raw = answerData.data && answerData.data.answer;
        const answers = Array.isArray(raw) ? raw : [raw];
        filledOk = await ppYktWriteAnswers(item, typeCode, answers, optionList);
        question.answer = answers;
        question.source = (answerData.data && answerData.data.source) || "";
        try {
          questionStore.addQuestion(question);
        } catch (e) {}
        if (filledOk) {
          filled += 1;
          ppLogAnswerFilled(logStore.addLog, handled, {
            source: question.source,
            cost: answerData.data && answerData.data.cost,
            num: answerData.data && answerData.data.num,
          });
        } else {
          failed += 1;
          ppLogAnswerFillFailed(logStore.addLog, handled, "答案未能写入页面");
        }
      } else if (isReviewFailed(answerData)) {
        failed += 1;
        question._reviewFailed = true;
        question.answer = reviewFailedAnswers(answerData);
        question.source = "error";
        try {
          questionStore.addQuestion(question);
        } catch (e) {}
        ppLogAnswerReviewFailed(logStore.addLog, answerData);
      } else {
        failed += 1;
        const msg = (answerData && answerData.msg) || "查询失败";
        question.answer = [msg];
        question.source = "error";
        try {
          questionStore.addQuestion(question);
        } catch (e) {}
        logStore.addLog(
          answerData && answerData.code === 403
            ? `第${handled}题查询失败：服务端暂不支持雨课堂（${msg}）`
            : `第${handled}题查询失败：${msg}`,
          "danger",
        );
      }

      if (autoSubmit && filledOk) {
        const submitted = await ppYktCommitQuestion(exDoc, logStore);
        if (submitted) {
          await ppYktConfirmHold(exDoc, logStore);
          logStore.addLog(`第${handled}题已提交`, "success");
        }
      }

      const markerNow = ppYktFingerprint(exDoc);
      if (markerNow && markerNow !== marker) {
        await delay(0.5);
        continue;
      }

      if (!autoSwitch) {
        logStore.addLog("自动切换已关闭，请手动切换到下一题", "warning");
        break;
      }
      const moved = await ppYktAdvance(exDoc, { allowSubmit: autoSubmit && filledOk, logStore });
      if (!moved) {
        logStore.addLog("已到最后一题或切换失败，结束本次作答", "primary");
        break;
      }
      await delay(0.6);
    }
    try {
      challengeWatch.stop();
    } catch (e) {}

    progressStore.update({
      isPlaying: false,
      questionIndex: handled,
      percent: 100,
      filledCount: filled,
      fillRate: paperTotal ? Math.round(((filled + skipped) / paperTotal) * 100) : 0,
      detail: paperTotal
        ? `本份作业：填入 ${filled} / 跳过 ${skipped} / 共 ${paperTotal} 题`
        : `本份作业：填入 ${filled} / 跳过 ${skipped} / 处理 ${handled} / 失败 ${failed}`,
    });
    ppLogAnswerSummary(logStore.addLog, { handled, filled, skipped, failed, total: paperTotal || handled });
    if (!autoSubmit) ppLogAnswerSubmitNote(logStore.addLog, "autoOff");
  };

  const PP_YKT_EXAM = {
    item: ".exercise-item",
    typeLabel: ".item-type",
    stem: "h4",
    options: "label",
  };

  const useYktExamLogic = async () => {
    if (window.__ppYktExamBusy) return;
    window.__ppYktExamBusy = true;
    const logStore = useLogStore();
    const progressStore = useProgressStore();
    const questionStore = useQuestionStore();
    try {
      const collectItems = () => Array.from(document.querySelectorAll(PP_YKT_EXAM.item));
      let items = collectItems();
      if (!items.length) {
        logStore.addLog("未识别到考试题目，请等页面加载完后刷新重试", "warning");
        return;
      }
      for (let pass = 0; pass < 6; pass += 1) {
        const before = items.length;
        try {
          const last = items[items.length - 1];
          if (last) last.scrollIntoView({ block: "end" });
        } catch (e) {}
        await delay(0.8);
        items = collectItems();
        if (items.length === before) break;
      }
      items = collectItems();
      ppLogAnswerBegin(logStore.addLog, { platform: "ykt", scene: "考试", total: items.length });

      const skipAnswered = readYktParam(PP_KEY.ANSWER, PP_KEY.SKIP_ANSWERED, true);

      let handled = 0;
      let filled = 0;
      let failed = 0;
      let skipped = 0;

      progressStore.update({
        taskName: "考试答题",
        type: "答题",
        isPlaying: true,
        questionTotal: items.length,
        questionIndex: 0,
        percent: 0,
        filledCount: 0,
        fillRate: 0,
        detail: `第 0 / ${items.length} 题`,
      });

      for (let index = 0; ; index += 1) {
        const live = collectItems();
        if (index >= live.length) break;
        const total = live.length;
        const item = live[index];
        const labels = Array.from(item.querySelectorAll(PP_YKT_EXAM.options));
        const typeCode = ppYktKind((item.querySelector(PP_YKT_EXAM.typeLabel) || {}).textContent);
        const stem = ppYktFlat((item.querySelector(PP_YKT_EXAM.stem) || {}).textContent).slice(0, 40);
        ppLogAnswerQuestion(logStore.addLog, index + 1, stem);
        if (skipAnswered && ppYktHasAnswer(item, PP_YKT_EXAM.options)) {
          skipped += 1;
          try {
            questionStore.addQuestion({
              element: item,
              html: item.outerHTML,
              workType: "ykt",
              refer: location.href,
              type: typeCode,
              title: stem,
              optionsText: labels.map(ppYktOptionLabel),
              skipped: true,
            });
          } catch (e) {}
          ppLogAnswerSkipped(logStore.addLog, index + 1);
          continue;
        }
        handled += 1;
        progressStore.update({
          questionIndex: index + 1,
          percent: total ? Math.min(99, Math.round((index / total) * 100)) : 0,
          detail: `第 ${index + 1} / ${total} 题`,
        });

        const question = {
          element: item,
          html: item.outerHTML,
          workType: "ykt",
          refer: location.href,
          type: typeCode,
          title: stem,
          optionsText: labels.map(ppYktOptionLabel),
        };

        let answerData = null;
        try {
          answerData = await queryAnswer(question);
        } catch (e) {
          answerData = null;
        }

        if (answerData && answerData.code === 200) {
          const raw = answerData.data && answerData.data.answer;
          const answers = Array.isArray(raw) ? raw : [raw];
          const ok = await ppYktWriteAnswers(item, typeCode, answers, PP_YKT_EXAM.options);
          question.answer = answers;
          question.source = (answerData.data && answerData.data.source) || "";
          try {
            questionStore.addQuestion(question);
          } catch (e) {}
          if (ok) {
            filled += 1;
            ppLogAnswerFilled(logStore.addLog, index + 1, {
              source: question.source,
              cost: answerData.data && answerData.data.cost,
              num: answerData.data && answerData.data.num,
            });
          } else {
            failed += 1;
            ppLogAnswerFillFailed(logStore.addLog, index + 1, "答案未能写入页面");
          }
        } else if (isReviewFailed(answerData)) {
          failed += 1;
          question._reviewFailed = true;
          question.answer = reviewFailedAnswers(answerData);
          question.source = "error";
          try {
            questionStore.addQuestion(question);
          } catch (e) {}
          ppLogAnswerReviewFailed(logStore.addLog, answerData);
        } else {
          failed += 1;
          ppLogAnswerQueryFailed(logStore.addLog, index + 1, (answerData && answerData.msg) || "未知错误");
        }
        await delay(0.3);
      }

      progressStore.update({
        isPlaying: false,
        questionIndex: handled,
        percent: 100,
        filledCount: filled,
        fillRate: items.length ? Math.round(((filled + skipped) / items.length) * 100) : 0,
        detail: `本次考试：填入 ${filled} / 跳过 ${skipped} / 共 ${items.length} 题`,
      });
      ppLogAnswerSummary(logStore.addLog, {
        handled: items.length,
        filled,
        skipped,
        failed,
        total: items.length,
      });
      ppLogAnswerSubmitNote(logStore.addLog, "examManual");
    } catch (error) {
      logStore.addLog(`考试作答出错：${error && error.message ? error.message : error}`, "danger");
    } finally {
      window.__ppYktExamBusy = false;
    }
  };

  const useYktCourseLogic = async () => {
    const logStore = useLogStore();
    const autoPlay = readYktParam(PP_KEY.VIDEO, "自动播放", true);
    const yktMode = (() => {
      const on = (key) => readYktParam(PP_KEY.MODE, key, false);
      if (on(PP_KEY.ONLY_ANSWER)) return "answer";
      if (on(PP_KEY.ONLY_VIDEO)) return "video";
      if (on(PP_KEY.REVIEW)) return "review";
      return "normal";
    })();
    const restudy = yktMode === "review";
    const wantVideo = yktMode !== "answer";
    const wantAnswer = yktMode !== "video";
    const autoComment = readYktParam(PP_KEY.YKT_CHAPTER, "自动评论", false);
    const autoSwitch = readYktParam(PP_KEY.YKT_CHAPTER, PP_KEY.AUTO_NEXT, true);
    let yktRateWarned = false;
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
      const autoRate = readYktParam(PP_KEY.VIDEO, PP_KEY.AUTO_RATE, false);
      const breakRate = readYktParam(PP_KEY.VIDEO, PP_KEY.BREAK_RATE, false);
      const userRate = Number(readYktParam(PP_KEY.VIDEO, PP_KEY.RATE, 1.5)) || 1;
      const menuMax = readYktMaxRate();
      if (autoRate) return menuMax;
      if (breakRate) return Math.min(8, Math.max(1, userRate));
      return Math.min(menuMax, Math.max(1, userRate));
    };
    const studyTags = [];
    if (wantVideo) studyTags.push("视频", "图文");
    if (wantAnswer) studyTags.push("作业");
    if (autoComment && yktMode !== "answer") studyTags.push("讨论");
    const yktActiveTag = () => {
      const active = yktJobs().find((el) => el.classList.contains("is-active"));
      return active ? yktJobTag(active) : "";
    };
    if (restudy) {
      logStore.addLog("复习模式：已完成的任务点也会重新学习", "primary");
    }

    if (location.pathname.includes("/v2/web/student-lesson-report")) {
      logStore.addLog("课堂互动任务不支持自动学习，请切换到视频、课件等任务", "warning");
      return;
    }

    logStore.addLog("检测到雨课堂学习页面", "primary");
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

    const yktExerciseDoc = () => {
      try {
        const frame = document.querySelector(YKT_SEL.exerciseFrame);
        return frame && frame.contentDocument ? frame.contentDocument : null;
      } catch (e) {
        return null;
      }
    };
    const yktPrepareFont = async (target) => {
      if (!target) return false;
      if (!ppFontDecryptAvailable()) {
        return false;
      }
      let hasCipher = false;
      try {
        hasCipher = !!target.querySelector(YKT_SEL.encryptedFont);
      } catch (e) {}
      if (!hasCipher) return true;
      const ok = await ppYktPrepareFont(target);
      return ok;
    };

    const visitedJobs = new Set();
    const jobKey = (el) => `${yktJobTag(el)}|${yktJobTitle(el)}`;
    const pickNext = () => {
      const list = yktJobs();
      const activeIndex = list.findIndex((el) => el.classList.contains("is-active"));
      const usable = (el) => {
        if (visitedJobs.has(jobKey(el))) return false;
        const tag = yktJobTag(el);
        if (!studyTags.includes(tag)) return false;
        if (restudy) return tag !== "作业";
        return !yktJobDone(el);
      };
      for (let i = activeIndex + 1; i < list.length; i += 1) {
        if (usable(list[i])) return list[i];
      }
      for (let i = 0; i <= activeIndex && i < list.length; i += 1) {
        if (usable(list[i])) return list[i];
      }
      return null;
    };

    for (let guard = 0; guard < 200; guard++) {
      await yktPrepareFont(yktExerciseDoc() || document);

      const activeJob = yktJobs().find((el) => el.classList.contains("is-active"));
      const activeTag = yktActiveTag();
      const exerciseDoc = yktExerciseDoc();

      const skipActive =
        (restudy && activeTag === "作业") ||
        (!restudy && activeJob && studyTags.includes(yktJobTag(activeJob)) && yktJobDone(activeJob));
      if (skipActive && activeJob) {
        visitedJobs.add(jobKey(activeJob));
      }

      const forum = skipActive ? null : document.querySelector(YKT_SEL.forum);
      if (skipActive) {
      } else if (forum && autoComment && activeTag !== "作业") {
        logStore.addLog("发现任务点：讨论，开始自动评论", "primary");
        try {
          await yktPostComment(forum, logStore);
        } catch (e) {
          logStore.addLog(`自动评论失败：${e.message}`, "warning");
        }
      } else if (document.querySelector(YKT_SEL.pptSlide) && activeTag !== "作业") {
        logStore.addLog("发现课件，开始阅读", "primary");
        await useYktPptRead(logStore);
      } else if (activeTag === "图文") {
        logStore.addLog("发现任务点：图文，已自动打开", "success");
        await delay(1.2);
      } else if (wantAnswer && (activeTag === "作业" || (!activeTag && exerciseDoc))) {
        await useYktHomeworkLogic(exerciseDoc, logStore, (target) => yktPrepareFont(target));
        await delay(1.5);
      } else if (!wantVideo) {
        logStore.addLog("仅答题模式：跳过视频与图文任务", "info");
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
          if (readYktParam(PP_KEY.VIDEO, PP_KEY.AUTO_RATE, false)) {
            logStore.addLog(`自动倍速：使用播放器最大倍速 ${initialRate}x`, "info");
          } else if (readYktParam(PP_KEY.VIDEO, PP_KEY.BREAK_RATE, false)) {
            logStore.addLog(`突破倍速：强制 ${initialRate}x（上限 8x）`, "info");
          } else if (readYktParam(PP_KEY.VIDEO, PP_KEY.MANUAL_RATE, false)) {
            logStore.addLog(`手动倍速：${initialRate}x（最大 ${readYktMaxRate()}x）`, "info");
          }
          if (initialRate > 4 && !yktRateWarned) {
            yktRateWarned = true;
            logStore.addLog(`当前倍速 ${initialRate}x 偏高，可能被平台判定异常、学习记录被清空，请谨慎使用`, "warning");
          }
          const isDigitalHuman = !!document.querySelector(".digital-human-video-element-selector");
          const reason = isDigitalHuman
            ? await yktPlayMediaCalm(media, { getRate: computeEffectiveRate, logStore })
            : await yktPlayMedia(media, {
                getRate: computeEffectiveRate,
                restart: restudy,
                title: (() => { try { const act = yktJobs().find((el) => el.classList.contains("is-active")); return act ? yktJobTitle(act) : ""; } catch (e) { return ""; } })(),
              });
          logStore.addLog(
            reason === "ended" ? "播放完成：视频" : reason === "stalled" ? "播放超时，已跳过" : "播放中断：任务点已切换，继续下一节",
            reason === "stalled" ? "warning" : "success",
          );
        }
      }

      if (activeJob) visitedJobs.add(jobKey(activeJob));

      const next = pickNext();
      if (!next) {
        const rest = yktJobs().filter((el) => !yktJobDone(el));
        if (!rest.length) {
          logStore.addLog("本页任务点已全部完成", "success");
        } else {
          const brief = rest.slice(0, 3).map((el) => `${yktJobTag(el) || "其他"}·${yktJobTitle(el)}`).join("、");
          logStore.addLog(
            `本轮已走完一遍，剩余 ${rest.length} 个任务点未完成：${brief}${rest.length > 3 ? " 等" : ""}`,
            "warning",
          );
        }
        break;
      }
      if (!autoSwitch) {
        logStore.addLog(`自动切换已关闭，请手动切换任务：${yktJobTitle(next)}`, "warning");
        break;
      }
      next.scrollIntoView({ block: "center" });
      next.click();
      visitedJobs.add(jobKey(next));
      logStore.addLog(`切换到下一节：${yktJobTitle(next)}`, "primary");
      await afkWait(3000);
    }
  };

  const PP_PLATFORM_DOMAINS = {
    cx: [
      "chaoxing.com", "xuexitong.com", "xueyinonline.com", "edu.cn",
      "nbdlib.cn", "hnsyu.net", "gdhkmooc.com", "sslibrary.com"
    ],
    zhs: ["zhihuishu.com", "polymas.com"],
    ykt: ["yuketang.cn", "gdufemooc.cn"]
  };
  const ppPlatformOf = (url) => {
    const u = String(url || "");
    let host = "";
    try {
      host = String(new URL(u).hostname || "").toLowerCase();
    } catch (e) {
      host = "";
    }
    if (!host) return "";
    const keys = Object.keys(PP_PLATFORM_DOMAINS);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (PP_PLATFORM_DOMAINS[key].some((domain) => host === domain || host.endsWith("." + domain))) return key;
    }
    return "";
  };

  const ppPageFullyLoaded = () => {
    try {
      if (document.readyState !== "complete") return false;
      const body = document.body;
      if (!body || !body.children.length) return false;
      const imgs = document.images || [];
      for (let i = 0; i < imgs.length; i += 1) {
        if (imgs[i] && imgs[i].complete === false) return false;
      }
      if (document.fonts && document.fonts.status === "loading") return false;
      return true;
    } catch (e) {
      return true;
    }
  };

  const ppWaitPageLoaded = (maxWaitMs = 10000) => new Promise((resolve) => {
    let settled = false;
    let timer = null;
    let deadline = null;
    const onLoad = () => {
      if (ppPageFullyLoaded()) finish("loaded");
    };
    const finish = (reason) => {
      if (settled) return;
      settled = true;
      if (timer) clearInterval(timer);
      if (deadline) clearTimeout(deadline);
      try {
        document.removeEventListener("load", onLoad, true);
      } catch (e) {}
      resolve(reason);
    };
    if (ppPageFullyLoaded()) {
      finish("immediate");
      return;
    }
    try {
      document.addEventListener("load", onLoad, true);
    } catch (e) {}
    timer = setInterval(() => {
      if (ppPageFullyLoaded()) finish("loaded");
    }, 100);
    deadline = setTimeout(() => finish("timeout"), maxWaitMs);
  });

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

      const useCxPracticeIframeWatcher = () => {
    const logStore = useLogStore();
    const practiceKey = "/page/quiz/stu/answerQuestion2";
    const storageKey = (url) => `pp-opened-practice-iframe:${url}`;
    const scan = () => {
      try {
        const iframe = Array.from(document.querySelectorAll("iframe")).find((frame) => {
          const src = frame.getAttribute("src") || frame.src || "";
          return src.includes(practiceKey);
        });
        if (!iframe) return;
        const raw = iframe.getAttribute("src") || iframe.src || "";
        let url = raw;
        try { url = new URL(raw, window.location.href).href; } catch (e) {}
        if (!url || sessionStorage.getItem(storageKey(url))) return;
        sessionStorage.setItem(storageKey(url), "1");
        window.open(url, "_blank");
        logStore.addLog("检测到随堂练习 iframe，已尝试在新窗口打开", "primary");
      } catch (e) {}
    };
    scan();
    setInterval(scan, 1000);
  };

  const useCxExamNotesTipLogic = () => {
    const logStore = useLogStore();
    logStore.addLog("已进入考试说明页，请点击进入答题页面后使用", "primary");
  };

  const useZhsSharedExamRouter = () => {
    const logStore = useLogStore();
    let lastUrl;
    let generation = 0;
    const update = () => {
      const url = window.location.href;
      if (url === lastUrl) return;
      const wasAnswering = ppZhsSharedExamPageKind(lastUrl) === "answer";
      lastUrl = url;
      const currentGeneration = ++generation;
      const kind = ppZhsSharedExamPageKind(url);
      if (wasAnswering) useProgressStore().update({ isPlaying: false, detail: "已停止查题" });
      if (kind === "answer") {
        const isActive = () => currentGeneration === generation && window.location.href === url;
        startAfkHeartbeat();
        useZhsAnswerLogic(isActive).catch((error) => logStore.addLog(String(error), "danger"));
      } else if (kind === "list") {
        logStore.addLog("当前是智慧树作业/考试列表页，请点击具体考试进入答题页", "info");
      } else if (kind === "readonly") {
        logStore.addLog("当前不是智慧树作答页，已跳过自动查题", "info");
      }
    };
    update();
    setInterval(update, 500);
  };

  const useZhsMasteryTipLogic = () => {
    const logStore = useLogStore();
    logStore.addLog("当前是掌握度页面，请点击低掌握度知识点上的「去提升」，进入练习后会自动答题", "warning");
    let started = false;
    const timer = setInterval(() => {
      if (started) {
        clearInterval(timer);
        return;
      }
      if (!String(location.pathname || "").startsWith("/exam")) return;
      started = true;
      clearInterval(timer);
      useZhsPaperAnswerLogic();
    }, 1000);
  };

function createPPChaoxingQueue(options = {}) {
  const {
    getValue = typeof GM_getValue === 'function' ? GM_getValue : (_, fallback) => fallback,
    setValue = typeof GM_setValue === 'function' ? GM_setValue : () => {},
    gmRequest = typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : null,
    getPage = () => ({ href: location.href, document, window: typeof unsafeWindow === 'object' ? unsafeWindow : window }),
    navigate = (href) => location.assign(href),
    onChange = () => {}, log = () => {}, request = null, canRun = () => "",
    parseHtml = (text) => new DOMParser().parseFromString(text, 'text/html'),
    now = Date.now
  } = options;
  const stateKey = 'pp:chaoxing-queue:v1';
  const syncKey = 'pp:chaoxing-queue-sync:v1';
  const defaultPortal = 'https://mooc1-1.chaoxing.com';
  const defaultStudy = 'https://mooc1.chaoxing.com';
  const listPage = /^\/(?:mooc2?-ans\/)?visit\/interaction\/?$/i;
  const entryPage = /^\/(?:mooc2?-ans\/)?visit\/stucoursemiddle\/?$/i;
  const homePage = /^\/(?:mooc2?-ans\/)?(?:mycourse|fanyav3)\/stu\/?$/i;
  const studyPage = /^\/(?:mooc2?-ans\/)?mycourse\/studentstudy\/?$/i;
  const transferPage = /^\/(?:mooc2?-ans\/)?mycourse\/transfer\/?$/i;
  const catalogPage = /^\/(?:mooc2?-ans\/)?mycourse\/studentcourse\/?$/i;
  const chapterSelector = '.chapter_item[onclick*="toOld"]';
  const aborted = Symbol('queue moved');
  const auth = '学习通登录状态异常，请在学习通确认登录后继续队列';
  let inFlight = false;
  let syncing = false;
  let lastCatalogCheck = 0;
  let studyEndHref = '';
  let lastAutoSync = -Infinity;
  let sequence = 0;

  const string = (value) => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  const id = (value) => /^\d{1,32}$/.test(string(value)) ? string(value) : '';
  const token = (value) => /^[a-z0-9_-]{1,256}$/i.test(string(value)) ? string(value) : '';
  const message = (error) => string(error?.message || error) || '请求失败';
  const platformUrl = (raw, base) => {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try {
      const url = new URL(raw, base);
      if (url.protocol !== 'https:' || url.port || url.username || url.password) return null;
      return /^(?:[a-z0-9-]+\.)*chaoxing\.com$/i.test(url.hostname) ? url : null;
    } catch { return null; }
  };
  const moocUrl = (raw, base) => {
    const url = platformUrl(raw, base);
    return url && /^mooc[\w-]*\.chaoxing\.com$/i.test(url.hostname) ? url : null;
  };
  const query = (url, ...keys) => {
    for (const [key, value] of url?.searchParams || []) if (keys.includes(key.toLowerCase()) && value) return value;
    return '';
  };
  const identity = (url) => {
    const courseId = id(query(url, 'courseid', 'moocid'));
    const clazzId = id(query(url, 'clazzid', 'classid'));
    return courseId && clazzId ? { courseId, clazzId, key: `${courseId}_${clazzId}` } : null;
  };
  const hrefFor = (origin, path, params) => {
    const url = new URL(path, origin);
    if (params) url.search = new URLSearchParams(params).toString();
    return url.href;
  };
  const typeOf = (url) => {
    if (!url) return 'other';
    if (studyPage.test(url.pathname)) return 'study';
    if (homePage.test(url.pathname)) return 'course';
    if (entryPage.test(url.pathname) || transferPage.test(url.pathname)) return 'handoff';
    if (listPage.test(url.pathname) || /^\/(?:mooc2?-ans\/)?visit\/courses\/?$/i.test(url.pathname) || /^\/base(?:\/|$)/i.test(url.pathname)) return 'list';
    return 'other';
  };
  const trainingAt = (url) => {
    if (!url) return null;
    const detail = url.pathname.match(/^\/plan\/(\d{1,32})\/train\/detail\/?$/);
    return detail || /^\/plan(?:\/online)?\/?$/.test(url.pathname)
      ? { origin: url.origin, planId: detail?.[1] || null }
      : null;
  };
  const nodes = (doc, selector) => Array.from(doc?.querySelectorAll?.(selector) || []);
  const node = (doc, selector) => doc?.querySelector?.(selector) || null;
  const attr = (element, name) => element?.getAttribute?.(name) || '';
  function inspectFrames() {
    const page = getPage();
    const frames = [];
    const seen = new Set();
    function visit(doc, href, depth) {
      if (seen.has(doc) || frames.length >= 100) return;
      if (doc) seen.add(doc);
      const url = platformUrl(href);
      if (url) frames.push({ url, doc });
      if (depth >= 5) return;
      for (const frame of nodes(doc, 'iframe, frame')) {
        const declared = platformUrl(attr(frame, 'src'), href);
        let child;
        let current;
        try {
          child = frame.contentDocument;
          current = platformUrl(child?.location?.href);
        } catch {}
        if (current) visit(child, current.href, depth + 1);
        else if (declared && frames.length < 100) frames.push({ url: declared, doc: null });
      }
    }
    visit(page.document, page.href, 0);
    return frames;
  }
  function trainingContext() {
    const contexts = inspectFrames().map(({ url }) => trainingAt(url)).filter(Boolean);
    return contexts.find((entry) => entry.planId) || contexts[0] || null;
  }
  function pageRole(href = getPage().href) {
    const role = typeOf(platformUrl(href));
    if (role === 'course' || role === 'study') return role;
    if (trainingContext()) return 'training';
    return role === 'handoff' ? 'course' : role;
  }
  function read(key, fallback) {
    try {
      const stored = getValue(key, '');
      return (typeof stored === 'string' ? JSON.parse(stored) : stored) ?? fallback;
    } catch { return fallback; }
  }
  const empty = () => ({ status: 'idle', items: [], activeKey: null, revision: '', expected: null, reason: '' });
  const load = () => {
    const state = read(stateKey, null);
    return state && Array.isArray(state.items) && typeof state.revision === 'string' ? state : empty();
  };
  const syncEntries = () => {
    const entries = read(syncKey, []);
    return Array.isArray(entries) ? entries : [];
  };
  const refKey = (ref) => `${ref.origin}|${ref.planId}|${ref.taskId}`;
  const syncIdentity = (ref) => `${ref.origin}|${ref.taskId}`;
  const collectRefs = (refs) => {
    const valid = new Map();
    for (const ref of Array.isArray(refs) ? refs : []) {
      const origin = platformUrl(ref?.origin);
      const planId = id(ref?.planId);
      const taskId = id(ref?.taskId);
      if (!origin || origin.origin !== ref.origin || !planId || !taskId) continue;
      const entry = { origin: origin.origin, planId, taskId, resourceCourseId: id(ref.resourceCourseId), resourceClassId: id(ref.resourceClassId) };
      valid.set(refKey(entry), entry);
    }
    return [...valid.values()];
  };
  function snapshot() {
    const state = load();
    const pending = syncEntries();
    const syncKeys = new Set(pending.map(syncIdentity));
    state.items = state.items.map((item) => ({
      ...item, syncPending: (item.trainingRefs || []).filter((ref) => syncKeys.has(syncIdentity(ref))).length
    }));
    return { ...state, syncPending: pending.length };
  }
  function notify() {
    try { onChange(snapshot()); } catch {}
  }
  function commit(state) {
    state.revision = `${now()}-${Math.random().toString(36).slice(2)}-${++sequence}`;
    setValue(stateKey, JSON.stringify(state));
    notify();
  }
  const scopeError = () => new Error('已阻止超出学习通队列范围的请求');
  const isLogin = (url, text = '') => ppCxLoginUrl(url) || /<title>\s*(?:用户登录|学习通登录)/i.test(text) ||
    PP_CX_LOGIN_WARNING.test(text.slice(0, 2048));
  const pageNeedsLogin = (page) => ppCxLoginUrl(platformUrl(page.href)) || ppCxLoginIssue(page.document) ||
    inspectFrames().some(({ url, doc }) => ppCxLoginUrl(url) || ppCxLoginIssue(doc));
  const trainingEndpoint = /^(?:\/plan\/mytask\/data|\/api\/online\/\d{1,32}\/task\/list|\/taskuser\/resource\/\d{1,32}\/\d{1,32}\/study|\/taskuser\/complete\/\d{1,32})$/;
  const listEndpoint = /^\/mooc2?-ans\/visit\/courselistdata$/;
  async function transport(spec) {
    if (request) return request(spec);
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    if (spec.document) {
      const view = spec.document.defaultView;
      if (typeof view?.fetch !== 'function') throw new Error('当前页面无法发出登录请求');
      const timer = setTimeout(() => controller?.abort(), 15000);
      try {
        const response = await view.fetch(spec.url, {
          method: spec.method, credentials: 'same-origin', mode: 'same-origin', redirect: 'manual',
          cache: 'no-store', body: spec.data, headers: spec.headers, signal: controller?.signal
        });
        if (response.type === 'opaqueredirect') throw new Error(auth);
        return { status: response.status, text: await response.text(), finalUrl: response.url };
      } finally { clearTimeout(timer); }
    }
    if (typeof gmRequest !== 'function') throw new Error('当前脚本管理器无法读取课程列表');
    return new Promise((resolve, reject) => {
      gmRequest({
        url: spec.url, method: spec.method, data: spec.data, headers: spec.headers,
        anonymous: false, redirect: 'error', timeout: 15000,
        onload: (r) => resolve({ status: r.status, text: r.responseText, finalUrl: r.finalUrl }),
        onerror: () => reject(new Error('课程列表请求失败')),
        ontimeout: () => reject(new Error('课程列表请求超时')),
        onabort: () => reject(new Error('课程列表请求已取消'))
      });
    });
  }
  async function ask(scope, href, method = 'GET', data) {
    const url = platformUrl(href);
    if (!url) throw scopeError();
    let doc = null;
    if (scope === 'training') {
      if (!trainingEndpoint.test(url.pathname) || (/^\/taskuser\//.test(url.pathname) ? method !== 'POST' : method !== 'GET')) throw scopeError();
      doc = inspectFrames().find((frame) => frame.doc && frame.url.origin === url.origin && trainingAt(frame.url))?.doc;
      if (!doc && !request) throw new Error('请在研修中心页面或独立标签页打开对应研修中心后重试');
    } else if (scope === 'catalog') {
      const page = getPage();
      const current = platformUrl(page.href);
      if (!catalogPage.test(url.pathname) || method !== 'GET' || !['course', 'study'].includes(typeOf(current))) throw scopeError();
      const active = identity(current);
      if (!active || identity(url)?.key !== active.key) throw scopeError();
      if (current.origin !== url.origin) throw scopeError();
      doc = page.document;
    } else if (scope === 'list') {
      if (!moocUrl(href) || !(method === 'POST' && listEndpoint.test(url.pathname) || method === 'GET' && listPage.test(url.pathname))) throw scopeError();
      const page = getPage();
      if (platformUrl(page.href)?.origin === url.origin) doc = page.document;
    } else throw scopeError();
    const headers = data == null ? undefined : { 'Content-Type': 'application/x-www-form-urlencoded' };
    const response = await transport({ scope, url: url.href, method, data, headers, document: doc });
    const text = typeof response?.text === 'string' ? response.text : '';
    const finalUrl = platformUrl(response?.finalUrl || url.href);
    if (isLogin(finalUrl, text) || [401, 403].includes(response?.status)) throw new Error(auth);
    if (!finalUrl || finalUrl.origin !== url.origin || finalUrl.pathname.replace(/\/$/, '') !== url.pathname.replace(/\/$/, '')) throw scopeError();
    if (!(response?.status >= 200 && response.status < 300)) throw new Error(`请求失败（${response?.status || 0}）`);
    return { text, finalUrl: finalUrl.href };
  }
  function api(text, operation) {
    let payload;
    try { payload = JSON.parse(text); } catch { throw new Error(`${operation}返回格式无效`); }
    if (!payload || ![1, '1'].includes(payload.code)) throw new Error(string(payload?.message || payload?.msg) || `${operation}失败`);
    return payload.data;
  }
  function entryFor(origin, courseId, clazzId, cpi) {
    return hrefFor(origin, '/mooc-ans/visit/stucoursemiddle', { courseid: courseId, clazzid: clazzId, cpi, vc: '1', ismooc2: '1', v: '2' });
  }
  function parseList(doc, base) {
    const records = new Map();
    const add = (card, anchor) => {
      const entry = moocUrl(attr(anchor, 'href'), base);
      const fromLink = entry && entryPage.test(entry.pathname) ? identity(entry) : null;
      const courseId = id(attr(card, 'courseid')) || fromLink?.courseId;
      const clazzId = id(attr(card, 'clazzid')) || fromLink?.clazzId;
      const cpi = id(attr(card, 'personid')) || id(query(entry, 'cpi'));
      if (!courseId || !clazzId || !cpi) return;
      const key = `${courseId}_${clazzId}`;
      if (records.has(key)) return;
      const name = node(card, '.course-name') || anchor;
      records.set(key, {
        key, title: string(attr(name, 'title') || name?.textContent) || `课程 ${courseId}`,
        description: nodes(card, '.course-info p').map((p) => string(p.textContent)).filter(Boolean).slice(0, 2).join(' · '),
        available: true, trainingRefs: [], source: 'default',
        entryUrl: fromLink?.key === key ? entry.href : entryFor(new URL(base).origin, courseId, clazzId, cpi)
      });
    };
    for (const card of nodes(doc, 'div.course, li.course')) add(card, node(card, 'a[href*="stucoursemiddle"]'));
    for (const anchor of nodes(doc, 'a[href*="stucoursemiddle"]')) add(null, anchor);
    return [...records.values()];
  }
  async function discover() {
    const page = getPage();
    if (pageNeedsLogin(page)) return { items: [], errors: [auth] };
    const current = platformUrl(page.href);
    if (['course', 'study', 'handoff'].includes(typeOf(current))) {
      return { items: [], errors: ['请返回学习通课程列表添加课程，当前队列不受影响'] };
    }
    for (const { url, doc } of inspectFrames()) {
      if (!listPage.test(url.pathname) || !doc) continue;
      const items = parseList(doc, url.href);
      if (items.length) return { items, errors: [] };
    }
    const portalLinks = nodes(page.document, 'iframe#frame_content, [dataurl]').map((element) =>
      moocUrl(attr(element, 'dataurl') || attr(element, 'src'), page.href)).filter(Boolean);
    const portal = portalLinks.find((url) => listPage.test(url.pathname)) || portalLinks[0];
    const origin = portal?.origin || moocUrl(page.href)?.origin || defaultPortal;
    const form = new URLSearchParams({ courseType: '1', courseFolderId: '0', baseEducation: '0', superstarClass: '', courseFolderSize: '0' }).toString();
    const attempts = [
      ['/mooc-ans/visit/courselistdata', 'POST'], ['/mooc2-ans/visit/courselistdata', 'POST'],
      [portal && listPage.test(portal.pathname) ? portal.href : '/visit/interaction', 'GET']
    ];
    const errors = [];
    let recognizedEmpty = false;
    for (const [path, method] of attempts) {
      try {
        const response = await ask('list', hrefFor(origin, path), method, method === 'POST' ? form : undefined);
        const doc = parseHtml(response.text);
        const items = parseList(doc, response.finalUrl);
        if (items.length) return { items, errors: [] };
        recognizedEmpty ||= Boolean(node(doc, '.noCourse, .no-course, .course-empty, .empty-course'));
      } catch (error) {
        if (message(error) === auth) return { items: [], errors: [auth] };
        errors.push(message(error));
      }
    }
    if (current && listPage.test(current.pathname)) {
      const items = parseList(page.document, current.href);
      if (items.length) return { items, errors: [] };
      recognizedEmpty ||= Boolean(node(page.document, '.noCourse, .no-course, .course-empty, .empty-course'));
    }
    return { items: [], errors: recognizedEmpty ? [] : [...new Set(errors.length ? errors : ['未能读取课程列表'])] };
  }
  async function discoverTrainingPlans() {
    const context = trainingContext();
    if (!context) return { plans: [], errors: ['请先打开学习通研修中心'] };
    void retrySync();
    const { origin, planId } = context;
    if (planId) return { plans: [{ id: planId, origin, title: `研修 ${planId}`, description: '', available: true }], errors: [] };
    const plans = new Map();
    let scanned = 0;
    try {
      for (let page = 1; page <= 20; page++) {
        const url = hrefFor(origin, '/plan/mytask/data', {
          page, pageSize: 50, type: '', modality: '', startDate: '', endDate: '', planPackageId: '', level: '', archived: 'false', status: ''
        });
        const body = api((await ask('training', url)).text, '研修列表')?.plans;
        if (!Array.isArray(body?.list)) throw new Error('研修列表返回格式无效');
        scanned += body.list.length;
        for (const row of body.list) {
          const itemId = id(row?.id);
          const type = Number(row?.type);
          if (!itemId || ![1, 5].includes(type) || Number(row.offlineFlag || 0) !== 0) continue;
          plans.set(itemId, {
            id: itemId, origin,
            title: string(row.planPackageSubject || row.subject) || `研修 ${itemId}`,
            description: `${type === 5 ? '选修课程' : '必修课程'} · ${string(row.completeHour || 0)}/${string(row.hour || 0)} 学时`,
            available: ![3, -2, -1].includes(Number(row.completeStatus || 0))
          });
        }
        const total = Number(body.total);
        if (!body.list.length || (Number.isFinite(total) ? scanned >= total : body.list.length < 50)) break;
        if (page === 20) return { plans: [...plans.values()], errors: ['研修计划过多，仅显示前 20 页'] };
      }
      return { plans: [...plans.values()], errors: [] };
    } catch (error) { return { plans: [...plans.values()], errors: [message(error)] }; }
  }
  async function discoverTrainingCourses(plan) {
    const origin = platformUrl(plan?.origin);
    const planId = id(plan?.id);
    if (!origin || origin.origin !== plan.origin || !planId || trainingContext()?.origin !== origin.origin) {
      return { items: [], errors: ['请在对应的研修中心打开研修计划'] };
    }
    void retrySync();
    try {
      const url = hrefFor(origin.origin, `/api/online/${planId}/task/list`);
      const tasks = api((await ask('training', url)).text, '研修课程')?.tasks;
      if (!Array.isArray(tasks)) throw new Error('研修课程返回格式无效');
      const items = [];
      for (const row of tasks) {
        const taskId = id(row?.id);
        const resourceCourseId = id(row?.typeId) || id(row?.courseId);
        const resourceClassId = id(row?.classId);
        if (Number(row?.type) !== 1 || !taskId || !resourceCourseId || !resourceClassId) continue;
        const earned = Number(row.check) === 3;
        const rawProgress = Number(row.complete || 0);
        const percent = Number.isFinite(rawProgress) ? Math.max(0, Math.min(100, rawProgress)) : 0;
        const scheduled = Number(row.flag) === 1 && !earned && row.status != null && Number(row.status) <= 0;
        const label = earned ? '已完成' : scheduled ? (Number(row.status) === 0 ? '未到开始时间' : '已过截止时间') : `${percent}%`;
        items.push({
          key: `training:${origin.hostname}:${planId}:${taskId}`, source: 'training',
          title: string(row.name || row.taskName) || `课程 ${resourceCourseId}`,
          description: `${string(row.hour || 0)} 学时 · ${label}`, available: plan.available !== false && !earned && !scheduled,
          entryUrl: '', trainingRefs: [{ origin: origin.origin, planId, taskId, resourceCourseId, resourceClassId }]
        });
      }
      items.sort((a, b) => Number(b.available) - Number(a.available));
      return { items, errors: [] };
    } catch (error) { return { items: [], errors: [message(error)] }; }
  }

  function entryTarget(raw) {
    const url = platformUrl(raw);
    if (!url || !['course', 'study', 'handoff'].includes(typeOf(url))) return null;
    const course = identity(url);
    if (transferPage.test(url.pathname)) {
      const refer = platformUrl(query(url, 'refer'));
      if (!refer || !studyPage.test(refer.pathname) || identity(refer)?.key !== course?.key) return null;
    }
    for (const key of ['url', 'target', 'next', 'redirect', 'redirecturl', 'returnurl']) {
      if (query(url, key)) return null;
    }
    return course ? { ...course, url } : null;
  }
  function makeOwner() {
    if (typeof options.getOwnerId === 'function') return Promise.resolve().then(options.getOwnerId);
    const readTab = typeof GM_getTab === 'function' ? GM_getTab : null;
    const saveTab = typeof GM_saveTab === 'function' ? GM_saveTab : null;
    const fresh = () => `${now()}-${Math.random().toString(36).slice(2)}`;
    const localOwner = () => {
      try {
        const storage = getPage().window?.sessionStorage;
        const key = 'pp:chaoxing-queue:tab';
        if (storage) {
          const value = storage.getItem(key) || fresh();
          storage.setItem(key, value);
          return value;
        }
      } catch {}
      return fresh();
    };
    if (!readTab || !saveTab) return Promise.resolve(localOwner());
    return new Promise((resolve) => {
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; resolve(localOwner()); }, 1500);
      try {
        readTab((tab) => {
          if (timedOut) return;
          clearTimeout(timer);
          try {
            if (!tab || typeof tab !== 'object') return resolve(localOwner());
            if (!tab.ppChaoxingQueueOwner) {
              tab.ppChaoxingQueueOwner = fresh();
              saveTab(tab);
            }
            resolve(tab.ppChaoxingQueueOwner);
          } catch { resolve(localOwner()); }
        });
      } catch {
        clearTimeout(timer);
        resolve(localOwner());
      }
    });
  }
  let ownerPromise;
  let currentOwner;
  const owner = () => ownerPromise ||= makeOwner().then((value) => (currentOwner = value));
  void owner();
  const ownsCurrentCourse = () => {
    if (!currentOwner) return false;
    const url = platformUrl(getPage().href);
    if (typeOf(url) !== 'study') return false;
    const state = load();
    return state.status === 'running' && state.ownerId === currentOwner && !!state.activeKey && identity(url)?.key === state.activeKey;
  };
  const blocksStudyAdvance = () => {
    if (!currentOwner) return false;
    const state = load();
    const active = state.ownerId === currentOwner && !!state.activeKey && identity(platformUrl(getPage().href))?.key === state.activeKey;
    return active && (state.status === 'paused' || state.status === 'running' && !!canRun(state));
  };
  function noteStudyEnd(href) {
    if (!ownsCurrentCourse() || getPage().href !== href || blocksStudyAdvance()) return;
    studyEndHref = href;
    lastCatalogCheck = -Infinity;
    void tick();
  }
  function pauseForLogin() {
    if (currentOwner && load().ownerId === currentOwner) return pause(auth);
    return snapshot();
  }
  const isCurrent = (draft, href) => load().revision === draft.revision && getPage().href === href;
  function guard(draft, href) {
    if (!isCurrent(draft, href)) throw aborted;
    if (pageNeedsLogin(getPage())) throw new Error(auth);
    const reason = canRun(draft);
    if (reason) {
      pause(reason);
      throw aborted;
    }
  }
  function go(draft, currentHref, destination, phase, chapterId = '') {
    guard(draft, currentHref);
    draft.expected = { href: destination.href, from: currentHref, phase, chapterId, time: now() };
    commit(draft);
    guard(draft, currentHref);
    navigate(destination.href);
  }
  function pause(reason = '课程队列已暂停') {
    const state = load();
    if (state.status !== 'running') return snapshot();
    state.status = 'paused';
    state.reason = typeof reason === 'string' ? reason : '课程队列已暂停';
    commit(state);
    if (typeof ppDeskNotify === 'function') ppDeskNotify('网课小助手', '学习通课程队列已暂停：' + state.reason, 'pp-queue-notice');
    return snapshot();
  }
  function clear() {
    commit(empty());
    return snapshot();
  }
  function remove(key) {
    const state = load();
    if (state.activeKey === key) return snapshot();
    state.items = state.items.filter((item) => item.key !== key);
    commit(state);
    return snapshot();
  }
  function normalizeSelection(selected) {
    const items = new Map();
    for (const raw of Array.isArray(selected) ? selected : []) {
      if (raw?.available === false || !raw?.key) continue;
      const refs = collectRefs(raw.trainingRefs);
      const direct = entryTarget(raw.entryUrl);
      if (!direct && !refs.some((ref) => ref.resourceCourseId && ref.resourceClassId)) continue;
      const inputKey = direct?.key || String(raw.key);
      const previous = items.get(inputKey);
      if (previous) {
        previous.trainingRefs = collectRefs([...previous.trainingRefs, ...refs]);
        continue;
      }
      items.set(inputKey, {
        key: inputKey, title: string(raw.title) || '学习通课程', description: string(raw.description),
        source: direct ? 'default' : 'training', entryUrl: direct?.url.href || '', trainingRefs: refs,
        status: 'queued', error: '', resolved: Boolean(direct)
      });
    }
    return [...items.values()];
  }
  async function start(selectedItems, { allowQueueAdvance = false } = {}) {
    const href = getPage().href;
    const items = normalizeSelection(selectedItems);
    const before = load();
    if (!items.length || pageRole(href) === 'other' || ['running', 'paused'].includes(before.status)) return snapshot();
    const ownerId = await owner();
    if (!isCurrent(before, href)) return snapshot();
    lastCatalogCheck = -Infinity;
    studyEndHref = '';
    commit({ ...empty(), status: 'running', ownerId, items, allowQueueAdvance });
    return tick();
  }
  async function resume({ allowQueueAdvance = false } = {}) {
    const href = getPage().href;
    const state = load();
    if (pageRole(href) === 'other' || !['running', 'paused'].includes(state.status)) return snapshot();
    const ownerId = await owner();
    if (!isCurrent(state, href)) return snapshot();
    if (pageNeedsLogin(getPage())) return pauseForLogin();
    state.status = 'running';
    state.reason = '';
    state.ownerId = ownerId;
    state.allowQueueAdvance = allowQueueAdvance;
    state.expected = null;
    state.arrived = false;
    lastCatalogCheck = -Infinity;
    commit(state);
    return tick();
  }
  async function resolveSelection(state, href) {
    const attempted = new Map();
    for (const item of state.items) {
      if (item.resolved || item.status !== 'queued') continue;
      const refs = item.trainingRefs;
      const targets = new Map();
      const failures = [];
      for (const ref of refs) {
        guard(state, href);
        const resource = `${ref.origin}|${ref.resourceCourseId}|${ref.resourceClassId}`;
        try {
          if (!ref.resourceCourseId || !ref.resourceClassId) throw new Error('研修课程参数不完整');
          if (!attempted.has(resource)) {
            const url = hrefFor(ref.origin, `/taskuser/resource/${ref.resourceCourseId}/${ref.resourceClassId}/study`);
            attempted.set(resource, ask('training', url, 'POST').then(({ text }) => {
              const target = entryTarget(text.trim());
              if (!target) {
                try { api(text, '查找研修学习地址'); } catch (error) { throw error; }
                throw new Error('平台返回的研修学习地址无效');
              }
              return target;
            }));
          }
          const target = await attempted.get(resource);
          guard(state, href);
          const found = targets.get(target.key);
          if (found) found.trainingRefs.push(ref);
          else targets.set(target.key, { ...item, key: target.key, entryUrl: target.url.href, trainingRefs: [ref], resolved: true });
        } catch (error) {
          if (error === aborted) throw error;
          if (message(error) === auth) { guard(state, href); throw error; }
          failures.push({ ref, error: message(error) });
        }
      }
      guard(state, href);
      const replacements = [...targets.values()];
      if (failures.length) replacements.push({ ...item, resolved: true, status: 'failed', error: failures.map((entry) => entry.error).join('；'), trainingRefs: failures.map((entry) => entry.ref) });
      const at = state.items.indexOf(item);
      state.items[at] = { ...item, resolved: true, replacements };
      commit(state);
    }
    const dedup = new Map();
    for (const item of state.items.flatMap((entry) => entry.replacements || [entry])) {
      const prior = dedup.get(item.key);
      if (prior) prior.trainingRefs = collectRefs([...prior.trainingRefs, ...item.trainingRefs]);
      else dedup.set(item.key, item);
    }
    const merged = [...dedup.values()];
    if (state.items.some((entry) => entry.replacements) || merged.length !== state.items.length) {
      guard(state, href);
      state.items = merged;
      commit(state);
    }
  }
  function parseCatalog(doc, html = '') {
    const chapters = new Map();
    let represented = true;
    for (const element of nodes(doc, chapterSelector)) {
      const args = attr(element, 'onclick').match(/\btoOld\s*\(\s*['"]?\d+['"]?\s*,\s*['"]?(\d{1,32})['"]?\s*(?:,|\))/i);
      if (!args) { represented = false; continue; }
      const chapterId = args[1];
      const input = node(element, 'input.knowledgeJobCount');
      const rawCount = string(input?.value || attr(input, 'value'));
      const taskCount = /^\d+$/.test(rawCount) ? Number(rawCount) : null;
      const points = string(node(element, '.catalog_points_yi')?.textContent);
      const status = node(element, '.icon_yiwanc') ? 'done' :
        taskCount != null ? (taskCount > 0 ? 'pending' : 'done') : points === '0' ? 'done' : 'unknown';
      const previous = chapters.get(chapterId);
      if (previous && previous.status !== status) represented = false;
      chapters.set(chapterId, { chapterId, status });
    }
    return {
      chapters: [...chapters.values()], represented,
      oldEnc: token(html.match(/\bvar\s+enc\s*=\s*['"]([a-z0-9_-]+)['"]/i)?.[1]),
      cpi: id(html.match(/\bvar\s+cpi\s*=\s*['"]?(\d+)/i)?.[1])
    };
  }
  function courseContext(page, url, history) {
    const readField = (name) => string(node(page.document, name)?.value);
    const activeIdentity = identity(url);
    if (!activeIdentity) return null;
    if (typeOf(url) === 'study' && history?.key === activeIdentity.key) return history;
    const cpi = id(readField('#cpi')) || id(query(url, 'cpi'));
    const enc = token(readField('#enc')) || token(query(url, 'stuenc')) || (typeOf(url) === 'course' ? token(query(url, 'enc')) : '');
    const oldEnc = token(readField('#oldenc')) || (typeOf(url) === 'study' ? token(query(url, 'enc')) : '');
    return { ...activeIdentity, origin: url.origin, cpi, enc, oldEnc };
  }
  async function readCatalog(page, url, context) {
    let catalogError;
    if (typeOf(url) === 'study') {
      const parsed = parseCatalog(page.document);
      if (parsed.represented && parsed.chapters.length) return parsed;
    }
    if (context?.origin === url.origin && context.enc && context.cpi) {
      try {
        const address = hrefFor(context.origin, '/mooc2-ans/mycourse/studentcourse', {
          courseid: context.courseId, clazzid: context.clazzId, cpi: context.cpi, ut: 's', t: now(), stuenc: context.enc
        });
        const result = await ask('catalog', address);
        const parsed = parseCatalog(parseHtml(result.text), result.text);
        if (parsed.chapters.length) return parsed;
      } catch (error) {
        if (message(error) === auth) throw error;
        catalogError = error;
      }
    }
    if (typeOf(url) === 'course') {
      const candidates = [page.document];
      const courseKey = identity(url)?.key;
      const isCurrentCatalog = (address) => !!courseKey && address?.origin === url.origin &&
        catalogPage.test(address.pathname) && identity(address)?.key === courseKey;
      let hasFrame = false;
      for (const frame of nodes(page.document, 'iframe')) {
        const address = platformUrl(attr(frame, 'src'), url.href);
        if (!address || address.origin !== url.origin || !catalogPage.test(address.pathname)) continue;
        const declaredKey = identity(address)?.key;
        if (declaredKey && declaredKey !== courseKey) continue;
        hasFrame = true;
        try {
          const loaded = frame.contentDocument;
          if (isCurrentCatalog(platformUrl(loaded?.location?.href))) candidates.unshift(loaded);
        } catch {}
      }
      for (const doc of candidates) {
        const parsed = parseCatalog(doc, doc?.documentElement?.innerHTML);
        if (parsed.chapters.length) return parsed;
      }
        if (!hasFrame) {
        const tab = node(page.document, '[data-url*="studentcourse"]');
        const target = platformUrl(attr(tab, 'data-url'), url.href);
        if (target?.origin === url.origin && catalogPage.test(target.pathname)) tab.click?.();
      }
    }
    if (catalogError) throw catalogError;
    return null;
  }
  function chapterUrl(page, context, chapterId) {
    if (!context?.cpi || !context?.oldEnc || !chapterId) return null;
    let configured;
    try { configured = moocUrl(page.window?.ServerHost?.mooc1Domain); } catch {}
    const origin = configured?.origin || defaultStudy;
    const refer = hrefFor(origin, '/mycourse/studentstudy', {
      chapterId, courseId: context.courseId, clazzid: context.clazzId, cpi: context.cpi, enc: context.oldEnc,
      mooc2: '1', hidetype: '0', fanyaVersion: '0'
    });
    return platformUrl(hrefFor(origin, '/mycourse/transfer', {
      moocId: context.courseId, clazzid: context.clazzId, linkTime: now(), ut: 's', refer
    }));
  }
  function rememberForSync(item) {
    const saved = new Map(syncEntries().map((ref) => [syncIdentity(ref), ref]));
    for (const ref of collectRefs(item.trainingRefs)) {
      const key = syncIdentity(ref);
      if (!saved.has(key)) saved.set(key, ref);
    }
    setValue(syncKey, JSON.stringify([...saved.values()]));
  }
  function syncAccepted(text) {
    try {
      const body = JSON.parse(text);
      if (body === true || body === 1 || body === '1' || /^success$/i.test(typeof body === 'string' ? body : '')) return true;
      if (body?.success === false || body?.data === false) return false;
      return body?.success === true || [1, '1'].includes(body?.code);
    } catch { return /^success$/i.test(text.trim()); }
  }
  async function retrySync() {
    const origin = trainingContext()?.origin;
    const pending = syncEntries();
    if (!origin || syncing || !pending.length) return { synced: 0, pending: pending.length, errors: [] };
    if (load().reason === auth || pageNeedsLogin(getPage())) return { synced: 0, pending: pending.length, errors: [auth] };
    syncing = true;
    const synced = new Set();
    const errors = [];
    try {
      for (const ref of collectRefs(pending).filter((entry) => entry.origin === origin)) {
        if (trainingContext()?.origin !== origin) break;
        if (load().reason === auth || pageNeedsLogin(getPage())) {
          errors.push(auth);
          pauseForLogin();
          break;
        }
        try {
          const url = hrefFor(origin, `/taskuser/complete/${ref.taskId}`);
          const { text } = await ask('training', url, 'POST');
          if (!syncAccepted(text)) throw new Error('平台未确认刷新进度');
          synced.add(syncIdentity(ref));
        } catch (error) {
          errors.push(`任务 ${ref.taskId}：${message(error)}`);
          if (message(error) === auth) {
            pauseForLogin();
            break;
          }
        }
      }
      if (synced.size) {
        setValue(syncKey, JSON.stringify(syncEntries().filter((entry) => !synced.has(syncIdentity(entry)))));
        notify();
      }
      return { synced: synced.size, pending: syncEntries().length, errors };
    } finally { syncing = false; }
  }
  function finishItem(state, item, href, result, error = '') {
    guard(state, href);
    if (result === 'done' && item.trainingRefs.length) rememberForSync(item);
    item.status = result;
    item.error = error;
    state.activeKey = null;
    state.expected = null;
    state.context = null;
    state.problem = null;
    state.verifyChapter = null;
    state.arrived = false;
    commit(state);
    if (error) {
      try { log(`${item.title}：${error}`); } catch {}
    }
  }
  function issue(state, item, href, reason, result = 'failed') {
    const previous = state.problem;
    if (previous?.href === href && previous.reason === reason && now() - previous.since >= 25000) {
      finishItem(state, item, href, result, reason);
      return false;
    }
    if (previous?.href !== href || previous.reason !== reason) {
      guard(state, href);
      state.problem = { href, reason, since: now() };
      commit(state);
    }
    return true;
  }
  async function processQueue(state, page) {
    const href = page.href;
    const url = platformUrl(href);
    if (!url) return;
    if (typeOf(url) === 'handoff' && (!state.expected || now() - state.expected.time < 25000)) return;
    if (state.items.some((item) => !item.resolved || item.replacements)) await resolveSelection(state, href);
    for (let pass = 0; pass <= state.items.length; pass++) {
      guard(state, href);
      let item = state.items.find((entry) => entry.key === state.activeKey);
      const onCourse = ['course', 'study'].includes(typeOf(url));
      const here = onCourse ? identity(url) : null;
      const wasActive = Boolean(item);
      if (!item) {
        item = state.items.find((entry) => entry.status === 'queued');
        if (!item) {
          state.status = 'done';
          state.activeKey = null;
          commit(state);
          return;
        }
        item.status = 'active';
        state.activeKey = item.key;
        state.context = null;
        state.expected = null;
        state.problem = null;
        lastCatalogCheck = -Infinity;
        commit(state);
      }
      if (here?.key !== item.key) {
        if (typeOf(url) === 'handoff' && state.expected) {
          finishItem(state, item, href, 'failed', '课程页面跳转超时');
          if (state.items.some((entry) => entry.status === 'queued')) {
            const fallback = platformUrl(item.entryUrl);
            const destination = platformUrl(hrefFor(moocUrl(fallback?.href)?.origin || defaultPortal, '/visit/interaction'));
            go(state, href, destination, 'list');
            return;
          }
          continue;
        }
        if (state.expected?.phase === 'list' && listPage.test(url.pathname)) {
          state.expected = null;
          commit(state);
        }
        if (state.expected || wasActive && state.arrived) {
          if (state.expected && href === state.expected.from && now() - state.expected.time < 15000) return;
          if (page.document?.readyState === 'loading') return;
          guard(state, href);
          state.status = 'paused';
          state.reason = '已离开队列课程，点击继续可回到该课程';
          commit(state);
          return;
        }
        const target = entryTarget(item.entryUrl);
        if (!target || target.key !== item.key) {
          finishItem(state, item, href, 'failed', '课程入口无效');
          continue;
        }
        go(state, href, target.url, 'entry');
        return;
      }
      if (state.expected) {
        const currentChapter = id(query(url, 'chapterid', 'knowledgeid'));
        if (href === state.expected.from && state.expected.phase !== 'entry' && now() - state.expected.time < 15000) return;
        guard(state, href);
        state.expected = null;
        if (currentChapter || typeOf(url) === 'course') lastCatalogCheck = -Infinity;
        commit(state);
      }
      if (typeOf(url) === 'study' && studyEndHref !== href) return;
      if (!state.arrived) {
        state.arrived = true;
        commit(state);
      }
      if (now() - lastCatalogCheck < 8000) return;
      lastCatalogCheck = now();
      const context = courseContext(page, url, state.context);
      if (context?.enc && context.cpi && typeOf(url) === 'course' && JSON.stringify(context) !== JSON.stringify(state.context)) {
        state.context = context;
        commit(state);
      }
      let catalog;
      try { catalog = await readCatalog(page, url, context); } catch (error) {
        guard(state, href);
        if (message(error) === auth) throw error;
        if (issue(state, item, href, message(error))) return;
        continue;
      }
      guard(state, href);
      if (typeOf(url) === 'study' && !catalog?.chapters.length) {
        const target = entryTarget(item.entryUrl);
        const currentChapter = id(query(url, 'chapterid', 'knowledgeid')) || id(node(page.document, '#curChapterId, #knowledgeid')?.value);
        if (!currentChapter || !target || typeOf(target.url) === 'study' || transferPage.test(target.url.pathname)) {
          pause('未能在当前页面验证学习通章节完成状态，请手动打开课程目录后继续');
          return;
        }
        state.verifyChapter = currentChapter;
        go(state, href, target.url, 'catalog');
        return;
      }
      if (!catalog?.chapters.length || !catalog.represented) {
        if (issue(state, item, href, '未能验证完整章节目录')) return;
        continue;
      }
      const endChapter = state.verifyChapter || (typeOf(url) === 'study'
        ? id(query(url, 'chapterid', 'knowledgeid')) || id(node(page.document, '#curChapterId, #knowledgeid')?.value) : '');
      const pending = catalog.chapters.find((chapter) => chapter.status === 'pending');
      if (catalog.chapters[catalog.chapters.length - 1].chapterId === endChapter) {
        if (pending) {
          if (issue(state, item, href, '已到最后一章，课程仍有未完成任务，请手动补做', 'skipped')) return;
          continue;
        }
      }
      if (endChapter) {
        const verified = catalog.chapters.find((chapter) => chapter.chapterId === endChapter);
        if (verified?.status !== 'done') {
          pause('学习通尚未确认上一章节完成，请检查课程目录后继续');
          return;
        }
        if (state.verifyChapter) {
          state.verifyChapter = null;
          commit(state);
        }
      }
      const next = pending || catalog.chapters.find((chapter) => chapter.status === 'unknown');
      if (!next) {
        finishItem(state, item, href, 'done');
        continue;
      }
      if (typeOf(url) === 'study' && !endChapter) return;
      const enriched = { ...context, cpi: catalog.cpi || context?.cpi, oldEnc: catalog.oldEnc || context?.oldEnc };
      const target = chapterUrl(page, enriched, next.chapterId);
      if (!target) {
        if (issue(state, item, href, '无法验证章节学习地址')) return;
        continue;
      }
      state.context = enriched;
      state.problem = null;
      go(state, href, target, 'chapter', next.chapterId);
      return;
    }
  }
  async function tick() {
    if (inFlight || load().status !== 'running') return snapshot();
    inFlight = true;
    try {
      const ownerId = await owner();
      const state = load();
      if (state.status !== 'running' || state.ownerId !== ownerId) return snapshot();
      const page = getPage();
      if (pageNeedsLogin(page)) return pause(auth);
      const reason = canRun(state);
      if (reason) return pause(reason);
      if (pageRole(page.href) === 'other') return pause('已离开学习通队列页面，请返回课程列表后继续');
      if (now() - lastAutoSync >= 60000 && trainingContext() && syncEntries().length) {
        lastAutoSync = now();
        void retrySync();
      }
      await processQueue(state, page);
    } catch (error) {
      if (message(error) === auth) return pauseForLogin();
      if (error !== aborted) {
        try { log(message(error)); } catch {}
      }
    } finally { inFlight = false; }
    return snapshot();
  }
  return { snapshot, pageRole, trainingContext, discover, discoverTrainingPlans, discoverTrainingCourses, start, pause, resume, retrySync, tick, clear, remove, ownsCurrentCourse, blocksStudyAdvance, noteStudyEnd, pauseForLogin };
}

function createPPZhsQueue(options = {}) {
  const {
    getValue = typeof GM_getValue === 'function' ? GM_getValue : (_, fallback) => fallback,
    setValue = typeof GM_setValue === 'function' ? GM_setValue : () => {},
    getPage = () => ({ href: location.href, document, window: typeof unsafeWindow === 'object' ? unsafeWindow : window }),
    navigate = (href) => location.assign(href),
    canRun = () => '', onChange = () => {}, log = () => {}, now = Date.now,
    request = null, fetchImpl = (...args) => fetch(...args)
  } = options;
  const stateKey = 'pp:zhs-queue:v1';
  const onlineList = 'https://onlineweb.zhihuishu.com/onlinestuh5';
  const hikeOrigin = 'https://hike-teaching-center.polymas.com';
  const cloudOrigin = 'https://cloudapi.polymas.com';
  const legacyOrigin = 'https://studyvideoh5.zhihuishu.com';
  const moved = Symbol('queue changed');
  const text = (value) => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  const id = (value) => /^[\w-]{1,128}$/.test(text(value)) ? text(value) : '';
  const secret = (value) => /^[A-Za-z0-9_~.+=/-]{1,512}$/.test(text(value)) ? text(value) : '';
  const object = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const message = (error) => text(error?.message) || '读取平台数据失败';
  const sharedPaths = new Map([
    [legacyOrigin, ['/stuStudy']],
    ['https://studyplush5.zhihuishu.com', ['/stuStudy', '/study/index']],
    ['https://studywisdomh5.zhihuishu.com', ['/study/index']]
  ]);
  const endpoints = {
    identity: '/oauth/token/getIdentity', courses: '/student-course/student/index/queryStudentCourse',
    terms: '/student-course/student/term/list', classes: '/student-course/student/classList',
    library: '/teacher-course/library/course/findStudyLibraryByCourseId', tree: '/student-course/study/student/resource/queryTree'
  };

  function route(raw, base) {
    if (typeof raw !== 'string' || !raw || /[\\\u0000-\u0020]/.test(raw)) return null;
    let url;
    try { url = new URL(raw, base); } catch { return null; }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if ([...url.searchParams.keys()].some((key) => /^(?:url|target|next|redirect|redirect_?url|return_?url|continue|service|callback)$/i.test(key))) return null;
    const path = url.pathname.replace(/\/$/, '');
    if (url.origin + path === onlineList) return { url, role: 'list', type: 'online' };
    if (url.hash) return null;
    if (url.origin === hikeOrigin && /^\/(?:custom-)?stu-hike\/agent-course-hike\/ai-course-center$/.test(path)) {
      return { url, role: 'list', type: 'center' };
    }
    if (sharedPaths.get(url.origin)?.includes(path)) {
      const values = url.searchParams.getAll('recruitAndCourseId');
      const token = values.length === 1 && secret(values[0]);
      return token ? { url, role: 'study', type: 'share', key: `share:${token}` } : null;
    }
    if (url.origin !== hikeOrigin) return null;
    const match = /^(\/(?:custom-)?stu-hike\/agent-course-full\/([\w-]{1,128}))\/(.+)$/.exec(path);
    if (!match) return null;
    const [, prefix, courseId, suffix] = match;
    const page = { url, type: 'hike', key: `hike:${courseId}`, prefix, courseId };
    if (suffix === 'stu/course-home') return { ...page, role: 'course' };
    const detail = /^([\w-]{1,128})\/([\w-]{1,128})\/([\w-]{1,128})\/stu\/study\/resource-detail$/.exec(suffix);
    if (!detail) return null;
    const [, libraryFolderId, resourceId, classId] = detail;
    return { ...page, role: 'study', libraryFolderId, resourceId, classId };
  }

  const pageRole = (href = getPage().href) => route(href)?.role || 'other';
  const isTop = (page) => !page.window?.top || page.window.top === page.window;
  const sameCourse = (item, page) => !!item && item.key === page?.key &&
    (!item.classId || !page.classId || item.classId === page.classId) &&
    (!item.libraryFolderId || !page.libraryFolderId || item.libraryFolderId === page.libraryFolderId);
  const empty = () => ({ status: 'idle', items: [], activeKey: '', reason: '', ownerId: '', revision: '', expected: null, arrived: false, allowQueueAdvance: false });
  const freshId = () => globalThis.crypto?.randomUUID?.() || `${now()}-${Math.random().toString(36).slice(2)}`;
  let fallbackState = empty();
  let runtime = {};
  let ownerId = '';
  let activeRead;
  const snapshot = () => {
    const saved = getValue(stateKey, fallbackState);
    return object(saved) && Array.isArray(saved.items)
      ? { ...empty(), ...saved, expected: saved.expected ? { ...saved.expected } : null, items: saved.items.filter(object).map((item) => ({ ...item })) }
      : empty();
  };
  function publish(state) {
    state.revision = freshId();
    fallbackState = { ...state, expected: state.expected ? { ...state.expected } : null, items: state.items.map((item) => ({ ...item })) };
    setValue(stateKey, fallbackState);
    try { onChange(snapshot()); } catch {}
  }
  function resolveOwner() {
    if (typeof options.getOwnerId === 'function') return Promise.resolve().then(options.getOwnerId);
    const getTab = typeof GM_getTab === 'function' ? GM_getTab : null;
    const saveTab = typeof GM_saveTab === 'function' ? GM_saveTab : null;
    if (!getTab || !saveTab) {
      try {
        const storage = getPage().window?.sessionStorage;
        const key = 'pp:zhs-queue:tab';
        if (storage) {
          const value = storage.getItem(key) || freshId();
          storage.setItem(key, value);
          return Promise.resolve(value);
        }
      } catch {}
      return Promise.resolve(freshId());
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(freshId()), 1500);
      try {
        getTab((tab) => {
          clearTimeout(timer);
          try {
            if (!object(tab)) return resolve(freshId());
            if (!text(tab.ppZhsQueueOwner)) {
              tab.ppZhsQueueOwner = freshId();
              saveTab(tab);
            }
            resolve(tab.ppZhsQueueOwner);
          } catch { resolve(freshId()); }
        });
      } catch {
        clearTimeout(timer);
        resolve(freshId());
      }
    });
  }
  const owner = resolveOwner().then((value) => (ownerId = text(value) || freshId()), () => (ownerId = freshId()));
  const activeItem = (state) => state.items.find((item) => item.key === state.activeKey && item.status === 'active');
  const nextItem = (state) => state.items.find((item) => item.status === 'queued' || item.status === 'active');
  function owns(state) {
    const page = getPage();
    const current = route(page.href);
    return !!ownerId && isTop(page) && current?.role === 'study' && state.status === 'running' && state.ownerId === ownerId &&
      sameCourse(activeItem(state), current) && !canRun(state);
  }
  const ownsCurrentCourse = () => owns(snapshot());
  const allowsChapterAdvance = () => {
    const state = snapshot();
    return state.allowQueueAdvance === true && owns(state);
  };

  function deadline(work, signal) {
    if (signal?.aborted) return Promise.reject(moved);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(reject, new Error('平台读取超时')), 12000);
      const abort = () => finish(reject, moved);
      const finish = (settle, value) => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        settle(value);
      };
      signal?.addEventListener('abort', abort, { once: true });
      Promise.resolve().then(work).then((value) => finish(resolve, value), (error) => finish(reject, error));
    });
  }
  async function readCloud(page, endpoint, body, signal, query) {
    const current = route(page.href);
    const expected = endpoint === 'identity' || endpoint === 'courses' ? 'center' : 'hike';
    const check = () => {
      if (getPage().href !== page.href || !isTop(page) || signal?.aborted || current?.type !== expected) throw moved;
    };
    check();
    const path = endpoints[endpoint] + (query ? `?${new URLSearchParams(query)}` : '');
    if (request) {
      const data = await deadline(() => request({ path, body, signal }), signal);
      check();
      return data;
    }
    const cookie = (page.document?.cookie || '').match(/(?:^|;\s*)ai-poly=([^;]+)/)?.[1];
    if (!cookie) throw new Error('未读取到 AI智课登录状态，请刷新课程页面');
    let token;
    try { token = decodeURIComponent(cookie); } catch { throw new Error('AI智课登录状态无效，请重新登录'); }
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    try {
      const payload = await deadline(async () => {
        const response = await fetchImpl(cloudOrigin + path, {
          method: body === undefined ? 'GET' : 'POST',
          headers: { Accept: 'application/json', Authorization: token, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
          body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
          credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer'
        });
        if (!response.ok) throw new Error(`平台接口返回 HTTP ${response.status}`);
        return response.json();
      }, signal);
      check();
      if (Number(payload?.code) !== 200 && !(expected === 'center' && payload?.success === true)) throw new Error('平台学习接口返回异常，请检查登录状态');
      return payload.data;
    } finally {
      signal?.removeEventListener('abort', abort);
      controller.abort();
    }
  }
  const callVm = (vm, method, params) => deadline(() => {
    if (typeof vm?.$api?.[method] !== 'function') throw new Error('当前课程列表未提供此类型的读取接口');
    return vm.$api[method](params);
  });
  const describe = (...parts) => parts.map(text).filter(Boolean).join(' · ');
  function candidate(row, label, entry, detail, index) {
    const fallback = id(row.courseId) || index + 1;
    return {
      key: entry?.key || `unsupported:${label}:${fallback}`, source: 'default',
      title: text(row.courseName) || `课程 ${fallback}`,
      description: describe(label, detail, entry ? '' : '当前入口暂不支持队列'), entryUrl: entry?.url.href || '',
      classId: entry?.classId || (entry?.type === 'hike' ? id(row.classId) : ''), available: !!entry
    };
  }
  async function pages(read, errors, label) {
    const rows = [];
    let scanned = 0;
    for (let index = 1; index <= 10; index++) {
      const { list, total } = await read(index);
      if (!Array.isArray(list)) throw new Error('平台课程列表格式有误');
      rows.push(...list.filter(object));
      scanned += list.length;
      const count = text(total) ? Number(total) : NaN;
      if (!list.length || (Number.isFinite(count) ? scanned >= count : list.length < 50)) return rows;
    }
    errors.push(`${label}仅显示前 10 页`);
    return rows;
  }
  async function discover() {
    const page = getPage();
    const current = route(page.href);
    if (!isTop(page) || current?.role !== 'list') {
      return { items: [], errors: ['请在智慧树在线学堂或 AI智慧课程中心读取进行中的课程'], errorUrl: onlineList };
    }
    const errors = [];
    const items = new Map();
    const add = (item) => { if (!items.has(item.key)) items.set(item.key, item); };
    const check = () => { if (getPage().href !== page.href) throw moved; };
    const handle = async (label, read) => {
      try { await read(); } catch (error) {
        if (error === moved) throw error;
        errors.push(`${label}读取失败：${message(error)}`);
      }
    };
    try {
      if (current.type === 'online') {
        const components = Array.from(page.document?.querySelectorAll?.('*') || [], (node) => node.__vue__).filter(Boolean);
        const vm = components.find((component) => component.$options?.name === 'courseList' && component.$api);
        if (!vm) return { items: [], errors: ['平台课程列表尚未加载，或页面结构已更新，请稍后重试'] };
        await handle('共享课', async () => {
          const rows = await pages(async (pageNo) => {
            check();
            const reply = await callVm(vm, 'queryShareCourseInfo', { status: 0, pageNo, pageSize: 50 });
            if (Number(reply?.code) !== 200) throw new Error('平台共享课列表返回异常');
            return { list: reply.result?.courseOpenDtos, total: reply.result?.totalCount };
          }, errors, '共享课');
          rows.forEach((row, index) => {
            const token = secret(row.secret);
            const fallback = new URL('/stuStudy', legacyOrigin);
            if (token) fallback.searchParams.set('recruitAndCourseId', token);
            const found = route(text(row.linkUrl) || (token ? fallback.href : ''), page.href);
            const entry = found?.type === 'share' && (!token || found.key === `share:${token}`) ? found : null;
            add(candidate(row, '共享课', entry, describe(row.schoolName, row.teacherName, row.progress), index));
          });
        });
        await handle('AI智课', async () => {
          const rows = await pages(async (pageNo) => {
            check();
            const reply = await callVm(vm, 'getAgentCourseListApi', { term: '', status: 2, keyword: '', crateCourseType: '', page: pageNo, size: 50, allCourse: false });
            if (Number(reply?.code) !== 200) throw new Error('平台 AI智课列表返回异常');
            return { list: reply.data?.list, total: reply.data?.total };
          }, errors, 'AI智课');
          const schoolId = id(vm.authMsg?.schoolId) ? vm.authMsg.schoolId : components.find((component) => id(component.authMsg?.schoolId))?.authMsg?.schoolId;
          for (const [index, row] of rows.entries()) {
            check();
            const courseId = id(row.courseId);
            let found = route(text(row.linkUrl), page.href);
            if (!found && courseId && id(schoolId) && typeof vm.$api.querySchoolCustomizationConfig === 'function') {
              try {
                const result = await callVm(vm, 'querySchoolCustomizationConfig', {
                  schoolId, courseId, courseType: text(row.courseType) || 'hikeAiCourse', clientType: 'STUDENT', configType: 'REDIRECT'
                });
                found = route(text(result?.data?.value?.url), page.href);
              } catch {}
            }
            const entry = found?.type === 'hike' && found.courseId === courseId ? found : null;
            add(candidate(row, 'AI智课', entry, text(row.termName), index));
          }
        });
      } else {
        await handle('AI智慧课程中心', async () => {
          let schoolId = '';
          try { schoolId = id((await readCloud(page, 'identity'))?.schoolNid); } catch (error) { if (error === moved) throw error; }
          if (!schoolId) {
            try { schoolId = id(JSON.parse(page.window?.localStorage?.getItem('themeVariables') || '{}')?.schoolNid); } catch {}
          }
          if (!schoolId) throw new Error('未读取到学校信息，请检查平台登录状态');
          const rows = await pages(async (pageNo) => {
            const data = await readCloud(page, 'courses', { keyword: '', term: '', schoolId, status: 2, page: pageNo, size: 50 });
            return { list: data?.list, total: data?.total };
          }, errors, 'AI智慧课程中心');
          rows.forEach((row, index) => {
            const origin = row.origenParam;
            const found = route(text(row.linkUrl) || text(origin?.url), page.href);
            const courseId = id(row.courseId);
            const entry = found?.key && (found.type !== 'hike' || !courseId || courseId === found.courseId) ? found : null;
            const label = entry?.type === 'hike' ? 'AI智课' : entry?.type === 'share' ? '共享课' : '暂不支持的课程类型';
            add(candidate(row, label, entry, describe(origin?.schoolName, origin?.progress), index));
          });
        });
      }
      check();
      if (!items.size && !errors.length) errors.push('未读取到进行中的共享课或 AI智课');
      return { items: [...items.values()], errors };
    } catch (error) {
      return { items: [], errors: [error === moved ? '当前课程列表页面已切换，请重新读取' : message(error)] };
    }
  }

  async function hikeProgress(page, current, item, signal) {
    const read = (endpoint, body, query) => readCloud(page, endpoint, body, signal, query);
    let context = runtime.context;
    if (!context) {
      const { courseId } = current;
      const terms = await read('terms', { courseId });
      if (!Array.isArray(terms)) throw new Error('平台课程学期数据有误');
      const active = terms.find((term) => Number(term?.isCurrent) === 1) || terms[0];
      const term = Number(active?.term);
      if (!Number.isSafeInteger(term) || term <= 0) throw new Error('未读取到有效课程学期');
      let { classId, libraryFolderId } = current;
      if (!classId) {
        const classes = await read('classes', { courseId, term });
        if (!Array.isArray(classes)) throw new Error('平台课程班级数据有误');
        const allowed = [...new Set(classes.map((entry) => id(entry?.classId)).filter(Boolean))];
        classId = item.classId ? allowed.find((value) => value === item.classId) : allowed.length === 1 ? allowed[0] : '';
        if (!classId) throw new Error('无法确认当前班级，请从平台进入选定班级的学习资源后继续');
      }
      if (!libraryFolderId) {
        libraryFolderId = id(await read('library', undefined, { courseId, term: String(term) }));
        if (!libraryFolderId) throw new Error('未读取到课程学习资源目录');
      }
      context = { courseId, classId, libraryFolderId, term };
      runtime.context = context;
    }
    const tree = await read('tree', context);
    if (!Array.isArray(tree)) throw new Error('平台学习资源目录数据有误');
    const stack = tree.map((node) => ({ node, locked: false })).reverse();
    const resources = new Map();
    let visited = 0;
    while (stack.length) {
      const { node, locked } = stack.pop();
      if (!object(node) || ++visited > 20000) throw new Error('平台学习资源目录结构有误');
      const unavailable = locked || node.lock === true || Number(node.lock) === 1;
      if (Number(node.type) === 2) {
        const resourceId = id(node.nodeId);
        if (!resourceId || resources.has(resourceId)) throw new Error('无法验证平台学习资源编号');
        resources.set(resourceId, {
          id: resourceId, locked: unavailable, required: node.isRequire === true || Number(node.isRequire) === 1,
          finished: node.isFinished === true || node.isFinished === 1 || node.isFinished === '1'
        });
      }
      if (Array.isArray(node.children)) {
        for (let index = node.children.length - 1; index >= 0; index--) stack.push({ node: node.children[index], locked: unavailable });
      }
    }
    if (!resources.size || current.resourceId && !resources.has(current.resourceId)) throw new Error('未能从平台验证当前课程学习资源');
    const all = [...resources.values()];
    const required = all.filter((resource) => resource.required);
    const pending = (required.length ? required : all).filter((resource) => !resource.finished);
    return { pending, next: pending.find((resource) => !resource.locked), context };
  }

  function sharedProgress(page, current) {
    const legacy = current.url.origin === legacyOrigin;
    const rows = Array.from(page.document?.querySelectorAll?.(legacy ? 'li.video, .clearfix.video' : '.child-main') || []);
    const lessons = legacy ? rows : rows.filter((row) => row.parentElement?.querySelector?.('.child-time'));
    const currentLesson = lessons.find((row) => row.classList?.contains(legacy ? 'current_play' : 'current') ||
      (legacy && row.querySelector?.('.current_play')));
    if (!currentLesson) return null;
    const marker = legacy ? '.time_icofinish' : '.finish-icon';
    const allDone = lessons.every((lesson) => Boolean((legacy ? lesson : lesson.parentElement)?.querySelector?.(marker)));
    return { lessons, allDone };
  }

  function pause(reason = '课程队列已暂停') {
    const state = snapshot();
    if (state.status !== 'running') return state;
    activeRead?.abort();
    Object.assign(state, { status: 'paused', expected: null, reason: typeof reason === 'string' ? reason : '课程队列已暂停' });
    publish(state);
    if (typeof ppDeskNotify === 'function') ppDeskNotify('网课小助手', '智慧树课程队列已暂停：' + state.reason, 'pp-queue-notice');
    return snapshot();
  }
  function clear() {
    activeRead?.abort();
    runtime = {};
    publish(empty());
    return snapshot();
  }
  function remove(key) {
    const state = snapshot();
    if (!state.items.some((item) => item.key === key) || state.status === 'running' && state.activeKey === key) return state;
    state.items = state.items.filter((item) => item.key !== key);
    if (state.activeKey === key) Object.assign(state, { activeKey: '', arrived: false, expected: null });
    if (!state.items.length) return clear();
    if (!nextItem(state) && state.status !== 'done') Object.assign(state, { status: 'idle', reason: '' });
    publish(state);
    return snapshot();
  }
  async function start(selection, { allowQueueAdvance = false } = {}) {
    const page = getPage();
    const before = snapshot();
    if (!isTop(page) || !route(page.href) || ['running', 'paused'].includes(before.status)) return before;
    const items = new Map();
    for (const raw of Array.isArray(selection) ? selection : []) {
      if (raw?.available === false || raw?.finished === true) continue;
      const entry = route(raw?.entryUrl);
      if (!entry?.key || raw.key !== entry.key || items.has(entry.key)) continue;
      items.set(entry.key, {
        key: entry.key, title: text(raw.title) || '智慧树课程', description: text(raw.description),
        source: 'default', entryUrl: entry.url.href, classId: entry.classId || (entry.type === 'hike' ? id(raw.classId) : ''),
        libraryFolderId: entry.libraryFolderId || '', status: 'queued', error: ''
      });
    }
    if (!items.size) return before;
    const tab = await owner;
    if (snapshot().revision !== before.revision || getPage().href !== page.href) return snapshot();
    runtime = {};
    publish({ ...empty(), items: [...items.values()], ownerId: tab, allowQueueAdvance: allowQueueAdvance === true, status: 'running' });
    return tick();
  }
  async function resume({ allowQueueAdvance } = {}) {
    const page = getPage();
    const state = snapshot();
    if (!isTop(page) || !route(page.href) || !['paused', 'running'].includes(state.status)) return state;
    const tab = await owner;
    if (snapshot().revision !== state.revision || getPage().href !== page.href) return snapshot();
    if (state.status === 'running' && state.ownerId === tab) return tick();
    activeRead?.abort();
    runtime = {};
    Object.assign(state, { status: 'running', ownerId: tab, reason: '', expected: null, arrived: false });
    if (typeof allowQueueAdvance === 'boolean') state.allowQueueAdvance = allowQueueAdvance;
    publish(state);
    return tick();
  }
  function guard(state, page) {
    if (snapshot().revision !== state.revision || getPage().href !== page.href) throw moved;
    const blocker = canRun(state);
    if (blocker) {
      pause(blocker);
      throw moved;
    }
  }
  function go(state, page, item, target) {
    guard(state, page);
    if (!sameCourse(item, target)) return pause('无法验证选中课程的学习入口');
    state.expected = { from: page.href, href: target.url.href, time: now() };
    publish(state);
    guard(state, page);
    try { navigate(target.url.href); } catch { pause('平台学习页面打开失败，请重试'); }
  }
  function activate(state, page, item) {
    state.activeKey = item.key;
    item.status = 'active';
    if (sameCourse(item, route(page.href))) publish(state);
    else go(state, page, item, route(item.entryUrl));
  }
  function finish(state, page, item) {
    guard(state, page);
    item.status = 'done';
    Object.assign(state, { activeKey: '', expected: null, arrived: false });
    const next = nextItem(state);
    if (next) return activate(state, page, next);
    Object.assign(state, { status: 'done', reason: '平台已确认队列中的目标学习资源完成' });
    publish(state);
  }
  async function step(state, page, signal) {
    if (!isTop(page)) return;
    guard(state, page);
    const current = route(page.href);
    if (!current) return pause('已离开智慧树队列支持的课程页面，请返回课程列表后继续');
    let item = activeItem(state);
    if (!item) {
      item = nextItem(state);
      if (!item) return pause('队列没有待学习课程');
      activate(state, page, item);
      if (state.expected || !sameCourse(item, current)) return;
    }
    if (state.expected) {
      const expected = state.expected;
      if (page.href === expected.from) {
        if (now() - expected.time >= 15000) pause('未进入预期的课程学习页面，请检查平台页面后继续');
        return;
      }
      if (!sameCourse(item, current)) return pause('平台跳转到了未能验证的课程，请核对后继续');
      if (current.type === 'hike' && route(expected.href)?.role === 'study' && current.role !== 'study') {
        return pause('平台未进入 AI智课资源页，请检查学习权限后继续');
      }
      state.expected = null;
      publish(state);
    }
    if (!sameCourse(item, current)) {
      if (state.arrived) return pause('已离开当前队列课程，点击继续可返回');
      return go(state, page, item, route(item.entryUrl));
    }
    if (!state.arrived) {
      state.arrived = true;
      publish(state);
    }
    if (runtime.href !== page.href || runtime.key !== item.key) runtime = { href: page.href, key: item.key, since: now(), problems: 0 };
    if (current.type === 'share') {
      const progress = sharedProgress(page, current);
      if (!progress) {
        runtime.confirm = null;
        if (now() - runtime.since >= 45000) pause('无法验证共享课学习目录，请打开平台课程目录后继续');
        return;
      }
      runtime.since = now();
      if (!progress.allDone) {
        runtime.confirm = null;
        return;
      }
      const previous = runtime.confirm?.lessons;
      const sameLessons = previous?.length === progress.lessons.length && previous.every((lesson, index) => lesson === progress.lessons[index]);
      if (!sameLessons) runtime.confirm = { lessons: progress.lessons, at: now() };
      else if (now() - runtime.confirm.at >= 2500) finish(state, page, item);
      return;
    }
    if (runtime.lastRead !== undefined && now() - runtime.lastRead < 15000) return;
    runtime.lastRead = now();
    let progress;
    try {
      progress = await hikeProgress(page, current, item, signal);
      guard(state, page);
      runtime.problems = 0;
    } catch (error) {
      guard(state, page);
      if (error === moved) throw error;
      if (++runtime.problems >= 3) pause(`AI智课进度读取失败：${message(error)}`);
      return;
    }
    if (!progress.pending.length) return finish(state, page, item);
    if (!progress.next) return pause('AI智课仍有未解锁的目标学习资源，请在平台确认后继续');
    if (current.role !== 'course') return;
    const { libraryFolderId, classId } = progress.context;
    item.classId = classId;
    item.libraryFolderId = libraryFolderId;
    const href = `${hikeOrigin}${current.prefix}/${libraryFolderId}/${progress.next.id}/${classId}/stu/study/resource-detail`;
    go(state, page, item, route(href));
  }
  async function tick() {
    if (activeRead || snapshot().status !== 'running') return snapshot();
    const controller = new AbortController();
    activeRead = controller;
    try {
      const tab = await owner;
      const state = snapshot();
      if (state.status === 'running' && state.ownerId === tab) await step(state, getPage(), controller.signal);
    } catch (error) {
      if (error !== moved) {
        try { log(message(error)); } catch {}
        pause('无法读取课程队列状态，请检查平台页面后继续');
      }
    } finally {
      activeRead = null;
    }
    return snapshot();
  }
  return { snapshot, pageRole, discover, start, resume, tick, pause, clear, remove, ownsCurrentCourse, allowsChapterAdvance };
}

  let ppZhsQueueInstance;
  const ppZhsQueueAllowsAdvance = () => !!ppZhsQueueInstance?.allowsChapterAdvance();
  const ppCxQueueState = vue.shallowRef(null);
  const ppZhsQueueState = vue.shallowRef(null);
  const ppQueueForPage = () => {
    if (window.self !== window.top || typeof GM_getValue !== "function" || typeof GM_setValue !== "function") return null;
    const platform = ppPlatformOf(location.href);
    if (platform !== "cx" && platform !== "zhs") return null;
    if (platform === "cx" && ppCxQueueInstance) return ppCxQueueInstance;
    if (platform === "zhs" && ppZhsQueueInstance) return ppZhsQueueInstance;
    const logStore = useLogStore();
    const stateRef = platform === "cx" ? ppCxQueueState : ppZhsQueueState;
    const createQueue = platform === "cx" ? createPPChaoxingQueue : createPPZhsQueue;
    const controller = createQueue({
      getValue: _GM_getValue,
      setValue: _GM_setValue,
      canRun: (state) => {
        const settings = ppQueuePrerequisites(useConfigStore(), platform);
        if (settings.review) return "当前为复习模式，请切换学习模式后继续队列";
        if (settings.answerOnly) return "智慧树当前为仅答题模式，请切换学习模式后继续队列";
        if (settings.needsAdvance && !state.allowQueueAdvance) return "自动切换章节已关闭，请确认后继续队列";
        return "";
      },
      onChange: (snapshot) => { stateRef.value = snapshot; },
      log: (message, type) => logStore.addLog(message, type || "info")
    });
    stateRef.value = controller.snapshot();
    if (platform === "cx") ppCxQueueInstance = controller;
    else ppZhsQueueInstance = controller;
    return controller;
  };

  const ppQueuePrerequisites = (store, platform) => {
    const parts = store.platformParams?.[platform]?.parts || [];
    const value = (part, key) => parts.find((item) => item.name === part)?.params?.find((item) => item.name === key)?.value;
    return {
      review: value(PP_KEY.MODE, PP_KEY.REVIEW) === true,
      answerOnly: platform === "zhs" && value(PP_KEY.MODE, PP_KEY.ONLY_ANSWER) === true,
      needsAdvance: value(platform === "zhs" ? PP_KEY.ZHS_CHAPTER : PP_KEY.CHAPTER, PP_KEY.AUTO_NEXT) === false
    };
  };

  const PP_CX_COURSES_URL = "https://mooc1.chaoxing.com/visit/courses";
  const PP_ZHS_COURSES_URL = "https://onlineweb.zhihuishu.com/onlinestuh5";

  const ppCxQueueStyles = `
.pp-cx-queue{display:flex;flex-direction:column;height:100%;min-height:0;gap:9px;font-size:11px;line-height:1.5;color:var(--pp-text-2);}
.pp-cx-queue h2,.pp-cx-queue p,.pp-cx-queue ul{margin:0;}
.pp-cx-queue h2{display:flex;align-items:center;gap:5px;margin:0;font-size:13px;font-weight:700;line-height:1.3;color:var(--pp-text);letter-spacing:.01em;}
.pp-cx-queue .queue-test-note{flex:none;display:flex;align-items:flex-start;gap:4px;padding:5px 8px;border:1px solid var(--pp-warning-line);border-radius:8px;background:var(--pp-warning-bg);color:#92400e;font-size:9.5px;line-height:1.4;}
.pp-cx-queue .queue-test-note svg{flex:none;margin-top:1px;}
.pp-cx-queue .queue-head{flex:none;display:flex;align-items:flex-start;gap:7px;min-width:0;}
.pp-cx-queue .queue-title{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.pp-cx-queue .queue-sub{font-size:9.5px;color:var(--pp-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pp-cx-queue .queue-unsupported{font-size:10.5px;line-height:1.55;color:var(--pp-text-3);}
.pp-cx-queue .queue-head .pp-chip{flex:none;margin-top:1px;}
.pp-cx-queue .queue-ico-btn{flex:none;width:25px;height:25px;margin-top:-2px;border:1px solid var(--pp-line);border-radius:8px;background:#fff;color:#7c899d;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;transition:background .15s,color .15s,border-color .15s;}
.pp-cx-queue .queue-ico-btn:hover:not(:disabled){background:var(--pp-surface-2);border-color:#cfd8e5;color:var(--pp-brand);}
.pp-cx-queue .queue-ico-btn:disabled{opacity:.45;cursor:not-allowed;}
.pp-cx-queue .queue-body{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;overflow-y:auto;}
.pp-cx-queue .queue-body.is-blank{justify-content:center;overflow:hidden;}
.pp-cx-queue .queue-note{font-size:10px;color:var(--pp-text-3);}
.pp-cx-queue .queue-tools{display:flex;align-items:center;gap:5px;min-width:0;}
.pp-cx-queue .queue-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:26px;padding:0 10px;border:1px solid var(--pp-line);border-radius:8px;background:#fff;color:var(--pp-text-2);font:inherit;font-size:10.5px;font-weight:600;text-decoration:none;white-space:nowrap;cursor:pointer;transition:background .15s,border-color .15s,color .15s,opacity .15s;}
.pp-cx-queue .queue-btn:hover:not(:disabled){background:var(--pp-surface-2);border-color:#cfd8e5;color:var(--pp-text);}
.pp-cx-queue .queue-btn.is-primary{border-color:var(--pp-brand);background:var(--pp-brand);color:#fff;}
.pp-cx-queue .queue-btn.is-primary:hover:not(:disabled){border-color:var(--pp-brand-hover);background:var(--pp-brand-hover);color:#fff;}
.pp-cx-queue .queue-btn.is-primary:disabled{border-color:var(--pp-line);background:var(--pp-surface);color:var(--pp-text-4);}
.pp-cx-queue .queue-btn:disabled{opacity:.55;cursor:not-allowed;}
.pp-cx-queue .queue-text-btn{flex:none;height:20px;padding:0 5px;border:0;border-radius:6px;background:transparent;color:var(--pp-brand);font:inherit;font-size:10px;font-weight:600;cursor:pointer;}
.pp-cx-queue .queue-text-btn:hover:not(:disabled){background:var(--pp-brand-weak);}
.pp-cx-queue .queue-text-btn:disabled{color:var(--pp-text-4);cursor:not-allowed;}
.pp-cx-queue .queue-card{display:flex;flex-direction:column;min-height:0;border:1px solid var(--pp-line);border-radius:12px;background:#fff;overflow:hidden;}
.pp-cx-queue .queue-sec-head{width:100%;display:flex;align-items:center;gap:6px;padding:8px 10px;border:0;background:var(--pp-surface-2);color:var(--pp-text);font:inherit;text-align:left;cursor:pointer;transition:background .15s;}
.pp-cx-queue .queue-sec-head:hover{background:#eef2f7;}
.pp-cx-queue .queue-sec-title{flex:1;min-width:0;display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;}
.pp-cx-queue .queue-sec-title>svg{flex:none;color:#7c899d;}
.pp-cx-queue .queue-sec-count{flex:none;padding:0 6px;border:1px solid var(--pp-line);border-radius:99px;background:#fff;color:var(--pp-text-3);font-size:9px;font-weight:600;line-height:16px;font-variant-numeric:tabular-nums;}
.pp-cx-queue .queue-sec-chev{flex:none;display:flex;color:#a7b2c2;transition:transform .2s var(--ppfx-ease-soft,ease);}
.pp-cx-queue .queue-sec-chev.is-open{transform:rotate(180deg);}
.pp-cx-queue .queue-sec-body{display:flex;flex-direction:column;gap:8px;padding:9px 10px;border-top:1px solid var(--pp-line-soft);}
.pp-cx-queue .queue-field{position:relative;display:flex;align-items:center;flex:1;min-width:0;}
.pp-cx-queue .queue-field>svg{position:absolute;left:8px;color:#aab6c6;pointer-events:none;}
.pp-cx-queue .queue-field input{width:100%;box-sizing:border-box;height:27px;padding:0 9px 0 26px;border:1px solid var(--pp-line);border-radius:8px;background:var(--pp-surface-2);color:var(--pp-text);font:inherit;font-size:10.5px;outline:none;transition:border-color .15s,background .15s;}
.pp-cx-queue .queue-field input:focus{border-color:var(--pp-brand);background:#fff;}
.pp-cx-queue .queue-seg{flex:none;display:flex;gap:2px;padding:2px;border:1px solid var(--pp-line);border-radius:8px;background:var(--pp-surface);}
.pp-cx-queue .queue-seg-btn{height:21px;padding:0 8px;border:0;border-radius:6px;background:transparent;color:var(--pp-text-3);font:inherit;font-size:9.5px;font-weight:600;cursor:pointer;}
.pp-cx-queue .queue-seg-btn.is-active{background:#fff;color:var(--pp-brand);box-shadow:0 1px 2px rgba(16,24,40,.08);}
.pp-cx-queue .queue-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;max-height:250px;overflow-y:auto;}
.pp-cx-queue .queue-list>li{border-top:1px solid var(--pp-line-soft);}
.pp-cx-queue .queue-list>li:first-child{border-top:0;}
.pp-cx-queue .queue-option{display:flex;align-items:flex-start;gap:7px;width:100%;box-sizing:border-box;padding:8px 6px;border-radius:8px;cursor:pointer;transition:background .15s;}
.pp-cx-queue .queue-option:hover{background:var(--pp-surface-2);}
.pp-cx-queue .queue-option input{flex:none;margin:2px 0 0;accent-color:var(--pp-brand);}
.pp-cx-queue .queue-option.is-disabled{cursor:not-allowed;opacity:.55;}
.pp-cx-queue .queue-course{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.pp-cx-queue .queue-course-title{font-size:11.5px;font-weight:600;line-height:1.4;color:var(--pp-text);overflow-wrap:anywhere;}
.pp-cx-queue .queue-course-meta{font-size:9.5px;line-height:1.45;color:var(--pp-text-3);overflow-wrap:anywhere;}
.pp-cx-queue .queue-pct{flex:none;margin-top:1px;padding:1px 6px;border-radius:6px;background:var(--pp-surface);color:var(--pp-text-3);font-size:9px;font-weight:600;line-height:15px;font-variant-numeric:tabular-nums;}
.pp-cx-queue .queue-pct.is-done{background:var(--pp-success-bg);color:#0b7a46;}
.pp-cx-queue .queue-plan-option{width:100%;display:flex;flex-direction:column;gap:1px;padding:7px 8px;border:1px solid var(--pp-line);border-radius:8px;background:#fff;font:inherit;text-align:left;cursor:pointer;transition:border-color .15s,background .15s;}
.pp-cx-queue .queue-plan-option:hover:not(:disabled){border-color:var(--pp-brand);background:var(--pp-brand-weak);}
.pp-cx-queue .queue-plan-option:disabled{opacity:.5;cursor:not-allowed;}
.pp-cx-queue .queue-plan-option b{font-size:10.5px;font-weight:600;color:var(--pp-text);}
.pp-cx-queue .queue-empty{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 2px;font-size:10px;color:var(--pp-text-3);}
.pp-cx-queue .queue-plan{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;}
.pp-cx-queue .queue-plan>li{display:flex;align-items:flex-start;gap:7px;padding:8px 10px;border-top:1px solid var(--pp-line-soft);}
.pp-cx-queue .queue-plan>li:first-child{border-top:0;}
.pp-cx-queue .queue-plan-main{min-width:0;display:flex;flex-direction:column;gap:1px;}
.pp-cx-queue .queue-plan-main b{font-size:11px;font-weight:600;color:var(--pp-text);overflow-wrap:anywhere;}
.pp-cx-queue .queue-dot{flex:none;width:6px;height:6px;margin-top:5px;border-radius:50%;background:#c3ccd9;}
.pp-cx-queue .queue-dot.ok{background:#0f9d58;}
.pp-cx-queue .queue-dot.run{background:var(--pp-brand);}
.pp-cx-queue .queue-dot.bad{background:#e5484d;}
.pp-cx-queue .queue-dot.warn{background:#f59e0b;}
.pp-cx-queue .queue-footer{flex:none;display:flex;align-items:center;gap:8px;padding-top:8px;border-top:1px solid var(--pp-line-soft);}
.pp-cx-queue .queue-sel{flex:1;min-width:0;font-size:10px;color:var(--pp-text-3);font-variant-numeric:tabular-nums;}
.pp-cx-queue .queue-confirm{display:flex;flex-direction:column;gap:7px;padding:10px;border:1px solid var(--pp-line);border-radius:12px;background:var(--pp-surface-2);}
.pp-cx-queue .queue-confirm strong{font-size:11px;color:var(--pp-text);}
.pp-cx-queue .queue-confirm ul{font-size:10px;color:var(--pp-text-3);padding-left:15px;}
.pp-cx-queue .queue-alert{display:flex;flex-direction:column;gap:3px;padding:0;list-style:none;font-size:10px;color:#b42318;}
`;

  const PpCxQueuePanel = vue.defineComponent({
    name: "PpCxQueuePanel",
    props: { controller: { type: Object, default: null }, platform: { type: String, default: "cx" } },
    setup(props) {
      const queueTitle = props.platform === "zhs" ? "智慧树课程队列" : "超星课程队列";
      const platformName = props.platform === "zhs" ? "智慧树" : "超星";
      const coursesPage = props.platform === "zhs" ? PP_ZHS_COURSES_URL : PP_CX_COURSES_URL;
      const jumpButton = (label, primary) => vue.h("a", {
        class: ["queue-btn", primary ? "is-primary" : ""],
        href: coursesPage,
        target: "_blank",
        rel: "noopener noreferrer"
      }, [ppIcon("external", 12), label]);
      if (!props.controller) {
        if (props.platform !== "cx" && props.platform !== "zhs") {
          return () => vue.h("section", { class: "pp-cx-queue", "aria-label": "课程队列" }, [
            vue.h("style", null, ppCxQueueStyles),
            vue.h("div", { class: "queue-head" }, [
              vue.h("div", { class: "queue-title" }, [
                vue.h("h2", null, "课程队列"),
                vue.h("p", { class: "queue-sub" }, "当前平台暂不支持")
              ])
            ]),
            vue.h("div", { class: "queue-body is-blank" }, [
              vue.h("div", { class: "pp-empty" }, [
                vue.h("span", { class: "pp-empty-ico" }, ppIcon("queue", 18)),
                vue.h("span", { class: "queue-unsupported" }, "队列暂不支持此平台")
              ])
            ])
          ]);
        }
        return () => vue.h("section", { class: "pp-cx-queue", "aria-label": "课程队列" }, [
          vue.h("style", null, ppCxQueueStyles),
          vue.h("div", { class: "queue-head" }, [
            vue.h("div", { class: "queue-title" }, [
              vue.h("h2", null, "课程队列"),
              vue.h("p", { class: "queue-sub" }, "在当前页面读取不到课程")
            ])
          ]),
          vue.h("div", { class: "queue-body is-blank" }, [
            vue.h("div", { class: "pp-empty" }, [
              vue.h("span", { class: "pp-empty-ico" }, ppIcon("queue", 18)),
              vue.h("b", null, "队列不在当前页面"),
              vue.h("span", null, "队列需要读取课程列表或课程学习页。先打开下面的入口，再从左侧「队列」进入。"),
              vue.h("div", { class: "queue-tools" }, [jumpButton(platformName + "课程列表", true)])
            ])
          ])
        ]);
      }
      const store = useConfigStore();
      const supportsTraining = typeof props.controller.discoverTrainingPlans === "function";
      const source = vue.ref("courses");
      const plan = vue.shallowRef(null);
      const plans = vue.shallowRef([]);
      const courses = vue.shallowRef([]);
      const selected = vue.ref([]);
      const keyword = vue.ref("");
      const errors = vue.shallowRef([]);
      const busy = vue.ref(false);
      const loaded = vue.ref(false);
      const confirm = vue.shallowRef(null);
      const expanded = vue.ref(true);
      let loadVersion = 0;
      const queue = () => (props.platform === "zhs" ? ppZhsQueueState : ppCxQueueState).value || props.controller.snapshot();
      const needsCourseList = () => props.platform === "cx" && !["list", "training"].includes(props.controller.pageRole());
      const filtered = (items) => {
        const text = keyword.value.trim().toLocaleLowerCase();
        return text ? items.filter((item) => `${item.title || ""} ${item.description || ""}`.toLocaleLowerCase().includes(text)) : items;
      };
      const coursePct = (item) => {
        const matched = /(\d{1,3}(?:\.\d+)?)\s*%/.exec(String(item.description || ""));
        if (!matched) return null;
        const value = Number(matched[1]);
        return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
      };
      const courseMeta = (item) => String(item.description || "")
        .replace(/\s*[·,，|]?\s*\d{1,3}(?:\.\d+)?\s*%\s*$/, "")
        .trim();
      const subLine = vue.computed(() => {
        if (!loaded.value) return busy.value ? `${platformName} · 正在读取课程…` : `${platformName} · 未读取课程列表`;
        if (source.value === "training" && !plan.value) return `${platformName} · ${plans.value.length} 个研修计划`;
        if (!courses.value.length) return `${platformName} · 未读取到课程`;
        const done = courses.value.filter((item) => coursePct(item) >= 100).length;
        return done ? `${platformName} · 共 ${courses.value.length} 门 · 已完成 ${done} 门` : `${platformName} · 共 ${courses.value.length} 门`;
      });
      const selectable = () => courses.value.filter((item) => item.available !== false);
      const allSelected = vue.computed(() => {
        const list = selectable();
        return list.length > 0 && list.every((item) => selected.value.includes(item.key));
      });
      const toggleAll = () => {
        selected.value = allSelected.value ? [] : selectable().map((item) => item.key);
      };
      const toggleOne = (key, checked) => {
        selected.value = checked ? [...selected.value, key] : selected.value.filter((item) => item !== key);
      };
      const refresh = async () => {
        if (needsCourseList()) return;
        const revision = ++loadVersion;
        const training = source.value === "training";
        const currentPlan = plan.value;
        const loadingPlans = training && !currentPlan;
        busy.value = true;
        loaded.value = false;
        errors.value = [];
        if (loadingPlans) plans.value = [];
        courses.value = [];
        selected.value = [];
        try {
          const controller = props.controller;
          const result = loadingPlans ? await controller.discoverTrainingPlans()
            : currentPlan ? await controller.discoverTrainingCourses(currentPlan) : await controller.discover();
          if (revision !== loadVersion) return;
          errors.value = result.errors || [];
          if (loadingPlans) plans.value = result.plans || [];
          else {
            courses.value = result.items || [];
            if (currentPlan) selected.value = courses.value.filter((item) => item.available !== false && item.finished !== true).map((item) => item.key);
          }
        } catch (error) {
          if (revision === loadVersion) errors.value = [error.message || String(error)];
        } finally {
          if (revision === loadVersion) {
            busy.value = false;
            loaded.value = true;
          }
        }
      };
      vue.onMounted(() => {
        if (props.platform !== "cx" || props.controller.pageRole() === "list") void refresh();
      });
      const go = (nextSource, nextPlan = null) => {
        source.value = nextSource;
        plan.value = nextPlan;
        keyword.value = "";
        confirm.value = null;
        void refresh();
      };
      const run = async (action) => {
        busy.value = true;
        errors.value = [];
        try {
          await action();
        } catch (error) {
          errors.value = [error.message || String(error)];
        } finally {
          busy.value = false;
        }
      };
      const startOrContinue = (continuing) => {
        const items = selected.value.map((key) => courses.value.find((item) => item.key === key)).filter(Boolean);
        if (!continuing && !items.length) return;
        const perform = (allowQueueAdvance) => run(() => {
          const options = { allowQueueAdvance };
          return continuing ? props.controller.resume(options) : props.controller.start(items, options);
        });
        const { review, answerOnly, needsAdvance } = ppQueuePrerequisites(store, props.platform || "cx");
        if (review || answerOnly) {
          errors.value = [`当前为${review ? "复习" : "仅答题"}模式，请切换学习模式后再使用队列`];
          return;
        }
        if (!needsAdvance) return perform(false);
        confirm.value = {
          label: `本队列允许切换并${continuing ? "继续" : "启动"}`,
          details: ["仅允许本次队列自动切换章节。原有章节设置继续用于手动打开的课程。"],
          run: () => {
            confirm.value = null;
            return perform(true);
          }
        };
      };
      const button = (label, handler, options = {}) => {
        const { class: extra, ...rest } = options;
        return vue.h("button", { type: "button", ...rest, class: ["queue-btn", extra], onClick: handler }, label);
      };
      const statusLabels = {
        idle: "待启动", running: "运行中", paused: "已暂停", queued: "待学习",
        resolving: "正在获取地址", active: "学习中", done: "已完成", failed: "失败", skipped: "已跳过"
      };
      const dotTone = (status) => status === "failed" ? "bad"
        : status === "done" ? "ok"
          : status === "paused" || status === "skipped" ? "warn"
            : (status === "running" || status === "active" || status === "resolving" || status === "queued") ? "run" : "";
      const statusLabel = (state) => {
        if (state.status === "done" && state.items?.some((item) => item.status === "failed")) return "队列已结束，有课程失败";
        if (state.status === "done" && state.items?.some((item) => item.status === "skipped")) return "队列已结束，有课程跳过";
        return statusLabels[state.status] || state.status || "待启动";
      };
      const renderHead = (state, returnToList) => vue.h("div", { class: "queue-head" }, [
        vue.h("div", { class: "queue-title" }, [
          vue.h("h2", null, "课程队列"),
          vue.h("p", { class: "queue-sub", title: returnToList ? undefined : subLine.value }, returnToList ? `${platformName} · 当前不在课程列表` : subLine.value)
        ]),
        vue.h("span", { class: ["pp-chip", state.status === "running" ? "ok" : state.status === "paused" ? "warn" : ""] }, statusLabel(state)),
        returnToList ? null : vue.h("button", {
          type: "button",
          class: "queue-ico-btn",
          title: "刷新课程列表",
          "aria-label": "刷新课程列表",
          disabled: busy.value || state.status === "running",
          onClick: refresh
        }, ppIcon("refresh", 13))
      ]);
      const renderControls = (state) => {
        const buttons = [];
        if (state.status === "running") buttons.push(button("暂停", () => props.controller.pause()));
        if (state.status === "paused") buttons.push(button("继续学习", () => startOrContinue(true), { class: "is-primary" }));
        if (state.status !== "running" && state.items?.length) {
          buttons.push(button("清空队列", () => { props.controller.clear(); confirm.value = null; }));
        }
        if (state.syncPending && props.controller.trainingContext?.()) {
          buttons.push(button("补同步进度", () => run(async () => {
            const result = await props.controller.retrySync();
            errors.value = result.errors || [];
          })));
        }
        return buttons.length ? vue.h("div", { class: "queue-tools" }, buttons) : null;
      };
      const renderPlan = (state) => {
        const items = state.items || [];
        if (!items.length) return null;
        const done = items.filter((item) => item.status === "done").length;
        return vue.h("div", { class: "queue-card" }, [
          vue.h("div", { class: "queue-sec-head", style: { cursor: "default" } }, [
            vue.h("span", { class: "queue-sec-title" }, [ppIcon("list", 13), "队列进度"]),
            vue.h("span", { class: "queue-sec-count" }, `${done} / ${items.length}`)
          ]),
          vue.h("ol", { class: "queue-plan", "aria-label": "已加入队列的课程" }, items.map((item) => vue.h("li", { key: item.key }, [
            vue.h("span", { class: ["queue-dot", dotTone(item.status)] }),
            vue.h("div", { class: "queue-plan-main" }, [
              vue.h("b", null, item.title),
              vue.h("span", { class: "queue-note" }, [statusLabels[item.status] || item.status, item.syncPending ? " · 待同步" : "", item.error ? ` · ${item.error}` : ""].join(""))
            ])
          ])))
        ]);
      };
      const renderSeg = () => {
        if (!supportsTraining) return null;
        const seg = (label, value) => vue.h("button", {
          type: "button",
          class: ["queue-seg-btn", source.value === value ? "is-active" : ""],
          "aria-pressed": source.value === value,
          disabled: busy.value,
          onClick: () => go(value)
        }, label);
        return vue.h("div", { class: "queue-seg", role: "group", "aria-label": "课程来源" }, [
          seg("我的课程", "courses"),
          seg("研修任务", "training")
        ]);
      };
      const renderPicker = (returnToList) => {
        const viewingPlans = source.value === "training" && !plan.value;
        const items = viewingPlans ? filtered(plans.value) : filtered(courses.value);
        const total = viewingPlans ? plans.value.length : courses.value.length;
        const count = returnToList ? null : !loaded.value ? "未读取" : `${total} 门`;
        const head = vue.h("button", {
          type: "button",
          class: "queue-sec-head",
          "aria-expanded": expanded.value,
          "aria-controls": "pp-queue-picker",
          onClick: () => { expanded.value = !expanded.value; }
        }, [
          vue.h("span", { class: "queue-sec-title" }, [ppIcon("queue", 13), "课程列表"]),
          count === null ? null : vue.h("span", { class: "queue-sec-count" }, count),
          vue.h("span", { class: ["queue-sec-chev", expanded.value ? "is-open" : ""] }, ppIcon("chevronDown", 14))
        ]);
        if (!expanded.value) return vue.h("div", { class: "queue-card" }, [head]);
        if (returnToList) return vue.h("div", { class: "queue-card" }, [head, vue.h("div", { id: "pp-queue-picker", class: "queue-sec-body" }, [
          vue.h("p", { class: "queue-note" }, "请返回学习通课程列表添加课程。"),
          vue.h("div", { class: "queue-tools" }, [jumpButton("返回课程列表", true)])
        ])]);
        const body = [];
        if (!loaded.value) {
          body.push(vue.h("p", { class: "queue-note", role: "status" }, busy.value ? "正在读取课程列表…" : "尚未读取课程列表"));
        }
        if (loaded.value) {
          const tools = [];
          if (!viewingPlans) {
            tools.push(vue.h("div", { class: "queue-field" }, [
              ppIcon("search", 12),
              vue.h("input", {
                type: "search",
                value: keyword.value,
                placeholder: "搜索课程",
                "aria-label": "搜索课程",
                onInput: (event) => { keyword.value = event.target.value; }
              })
            ]));
            if (total) {
              tools.push(vue.h("button", {
                type: "button",
                class: "queue-text-btn",
                disabled: busy.value,
                onClick: toggleAll
              }, allSelected.value ? "取消全选" : "全选"));
            }
          }
          tools.push(renderSeg());
          if (plan.value) tools.push(button("返回计划", () => go("training")));
          if (tools.length) body.push(vue.h("div", { class: "queue-tools" }, tools));
          if (plan.value) body.push(vue.h("p", { class: "queue-note" }, plan.value.title));
          if (items.length && viewingPlans) {
            body.push(vue.h("ul", { class: "queue-list" }, items.map((item) => vue.h("li", { key: `${item.origin}:${item.id}` }, [
              vue.h("button", {
                type: "button",
                class: "queue-plan-option",
                disabled: busy.value || item.available === false,
                onClick: () => go("training", item)
              }, [
                vue.h("b", null, item.title),
                item.description ? vue.h("span", { class: "queue-note" }, item.description) : null
              ])
            ]))));
          }
          if (items.length && !viewingPlans) {
            body.push(vue.h("ul", { class: "queue-list" }, items.map((item) => {
              const pct = coursePct(item);
              const meta = courseMeta(item);
              return vue.h("li", { key: item.key }, [
                vue.h("label", { class: ["queue-option", item.available === false ? "is-disabled" : ""] }, [
                  vue.h("input", {
                    type: "checkbox",
                    disabled: item.available === false || busy.value,
                    checked: selected.value.includes(item.key),
                    onChange: (event) => toggleOne(item.key, event.target.checked)
                  }),
                  vue.h("span", { class: "queue-course" }, [
                    vue.h("b", { class: "queue-course-title", title: item.title }, item.title),
                    meta ? vue.h("span", { class: "queue-course-meta", title: item.description }, meta) : null
                  ]),
                  pct == null ? null : vue.h("span", { class: ["queue-pct", pct >= 100 ? "is-done" : ""] }, `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`)
                ])
              ]);
            })));
          }
          if (!items.length) {
            body.push(vue.h("div", { class: "queue-empty" }, [
              vue.h("span", null, viewingPlans ? "没有读取到研修计划" : "没有读取到课程，可点右上角刷新重试")
            ]));
          }
        }
        return vue.h("div", { class: "queue-card" }, [head, vue.h("div", { id: "pp-queue-picker", class: "queue-sec-body" }, body)]);
      };
      const renderFooter = () => {
        if (!loaded.value) return null;
        if (source.value === "training" && !plan.value) return null;
        if (!courses.value.length) return null;
        return vue.h("div", { class: "queue-footer" }, [
          vue.h("span", { class: "queue-sel" }, `已选 ${selected.value.length} / ${courses.value.length} 门`),
          button("启动队列", () => startOrContinue(false), {
            class: "is-primary",
            disabled: busy.value || !selected.value.length
          })
        ]);
      };
      return () => {
        const state = queue();
        const returnToList = needsCourseList();
        const showCandidates = state.status !== "running" && state.status !== "paused";
        return vue.h("section", { class: "pp-cx-queue", "aria-label": queueTitle }, [
          vue.h("style", null, ppCxQueueStyles),
          renderHead(state, returnToList),
          vue.h("p", { class: "queue-test-note" }, [ppIcon("info", 11), vue.h("span", null, "队列为测试功能，可能存在较多问题，请留意学习进度。")]),
          vue.h("div", { class: "queue-body" }, [
            renderControls(state),
            renderPlan(state),
            showCandidates ? renderPicker(returnToList) : null,
            state.syncPending ? vue.h("p", { class: "queue-note" }, `待同步研修任务 ${state.syncPending} 项`) : null,
            errors.value.length ? vue.h("ul", { class: "queue-alert", role: "alert" }, errors.value.map((error) => vue.h("li", null, error))) : null,
            confirm.value ? vue.h("section", { class: "queue-confirm", role: "dialog", "aria-label": "确认队列设置" }, [
              vue.h("strong", null, "队列需要调整设置"),
              vue.h("ul", null, confirm.value.details.map((detail) => vue.h("li", null, detail))),
              vue.h("div", { class: "queue-tools" }, [
                button(confirm.value.label, confirm.value.run, { class: "is-primary" }),
                button("取消", () => { confirm.value = null; })
              ])
            ]) : null
          ]),
          returnToList ? null : renderFooter()
        ]);
      };
    }
  });

  const cxAnswerPageLogic = {
    work: useCxWorkLogic,
    preview: useCxExamPreviewLogic,
    exam: useCxExamLogic,
    notes: useCxExamNotesTipLogic,
  };

  const cxLogicRules = [
    { keyword: "/mycourse/studentstudy", logic: useCxChapterLogic },
    { keyword: "/knowledge/start", logic: useCxChapterLogic },
    { keyword: "/ztnodedetailcontroller/visitnodedetail", logic: useCxAutoReadLogic },
    { keyword: "/course/", logic: useCxAutoReadLogic },
    { keyword: "/plaza", logic: useCxPlazaTipLogic },
    {
      keyword: "mycourse/stu?courseid",
      logic: useCxPracticeIframeWatcher
    },
    { keyword: "/page/active/stuActiveList", logic: useCxPracticeIframeWatcher },
    { keyword: "answerQuestion2", logic: useStuActiveLogic }
  ];

  const zhsLogicRules = [
    { keyword: "studyvideoh5.zhihuishu.com", logic: useZhClassroomStudy },
    { keyword: "studyplush5.zhihuishu.com", logic: useZhClassroomStudy },
    { keyword: "studywisdomh5.zhihuishu.com", logic: useZhClassroomStudy },
    { keyword: "wisdom-mooc.zhihuishu.com", logic: useZhClassroomStudy },
    { keyword: "ai-smart-course-student-pro.zhihuishu.com", logic: useZhClassroomStudy },
    { keyword: "smartcoursestudent.zhihuishu.com", logic: useZhClassroomStudy },
    { keyword: "fusioncourseh5.zhihuishu.com", logic: useZhClassroomStudy },
    { keyword: "hike.zhihuishu.com", logic: useZhClassroomStudy },
    { keyword: "wenda.zhihuishu.com", logic: useZhClassroomStudy },
    { keyword: "polymas.com", logic: useZhClassroomStudy },
    { keyword: "hike-teaching-center.polymas.com", match: ppHikeStudyPage, logic: usePpHikeStudy },
    { keyword: "hike-teaching-center.polymas.com/stu/answer-homework", logic: useHikePaperAnswer },
    { keyword: "hike-teaching-center.polymas.com/stu/answer-training", logic: useHikePaperAnswer },
    { keyword: "hike-teaching-center.polymas.com/stu-exam/answer-exam", logic: useHikePaperAnswer },
    { keyword: "hike-teaching-center.polymas.com/stu-hike/stuHomeworkDo", logic: useHikePaperAnswer },
    { keyword: "examloop.zhihuishu.com/exam/", logic: useZhsPaperAnswerLogic },
    { keyword: "studentexamcomh5.zhihuishu.com/studentReviewTestOrExam", logic: useZhsPaperAnswerLogic },
    { keyword: "smartcourseexam.zhihuishu.com/ReviewExam", logic: useZhsPaperAnswerLogic },
    { keyword: "fusioncourseh5.zhihuishu.com/exam", logic: useZhsPaperAnswerLogic },
    { keyword: "studywisdomh5.zhihuishu.com/exam", logic: useZhsPaperAnswerLogic },
    { keyword: "studywisdomh5.zhihuishu.com/study/mastery", logic: useZhsMasteryTipLogic },
    { keyword: "wisdom-mooc.zhihuishu.com/exam", logic: useZhsPaperAnswerLogic },
    { keyword: "zhihuishu.com/atHomeworkExam/stu/homeworkQ/exerciseList", logic: useZhsPaperAnswerLogic },
    { keyword: "zhihuishu.com/atHomeworkExam/stu/examQ/examexercise", logic: useZhsPaperAnswerLogic }
  ];

  const yktLogicRules = [
    { keyword: "changjiang-exam.yuketang.cn", logic: useYktExamLogic },
    { keyword: "/v2/web/studentLog", logic: useYktCourseLogic },
    { keyword: "/v2/web/student-lesson-report", logic: useYktCourseLogic },
    { keyword: "/ai-workspace/lms-graph", logic: useYktCourseLogic },
    { keyword: "/m/v2/course/normalcourse/logs", logic: useYktCourseLogic },
    { keyword: "/pro/lms", logic: useYktCourseLogic },
    { keyword: "/v2/web/studentcards", logic: useYktCourseLogic },
    { keyword: "/v2/web/studentcard/", logic: useYktCourseLogic }
  ];

  const urlLogicGroups = {
    cx: cxLogicRules,
    zhs: zhsLogicRules,
    ykt: yktLogicRules
  };
  const urlLogicPairs = cxLogicRules.concat(zhsLogicRules, yktLogicRules);
      const ppMatchTargetOf = (rawUrl) => {
        const raw = String(rawUrl || "");
        const crossPageParams = [
          "fromUrl", "fromurl", "backUrl", "backurl", "returnUrl", "returnurl",
          "redirectUrl", "redirecturl", "redirect_uri", "referrer"
        ];
        const stripCrossPageParams = (query) => {
          if (!query) return null;
          const params = new URLSearchParams(query);
          let changed = false;
          crossPageParams.forEach((name) => {
            if (!params.has(name)) return;
            params.delete(name);
            changed = true;
          });
          const urlValued = [];
          params.forEach((value, name) => {
            let decoded = value;
            try {
              decoded = decodeURIComponent(value);
            } catch (e) {}
            if (decoded.indexOf("://") >= 0) urlValued.push(name);
          });
          urlValued.forEach((name) => {
            params.delete(name);
            changed = true;
          });
          return changed ? params.toString() : null;
        };
        try {
          const parsed = new URL(raw);
          const searchQuery = stripCrossPageParams(parsed.search.replace(/^\?/, ""));
          if (searchQuery !== null) parsed.search = searchQuery ? `?${searchQuery}` : "";
          const hashText = parsed.hash.replace(/^#/, "");
          const hashQueryAt = hashText.indexOf("?");
          if (hashQueryAt >= 0) {
            const hashQuery = stripCrossPageParams(hashText.slice(hashQueryAt + 1));
            if (hashQuery !== null) {
              parsed.hash = hashText.slice(0, hashQueryAt) + (hashQuery ? `?${hashQuery}` : "");
            }
          }
          return parsed.href;
        } catch (e) {
          return raw;
        }
      };

      const executeLogicByUrl = (url22) => {
        if (ppZhsSharedExamPageKind(url22)) {
          isShow.value = true;
          useZhsSharedExamRouter();
          return;
        }
        if (ppIsZhsMasteryReadOnlyPage(url22)) {
          isShow.value = true;
          logStore.addLog("掌握度历史或结果页，已跳过自动答题", "info");
          return;
        }

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
        const matchTarget = ppMatchTargetOf(url22);
        const platformKey = ppPlatformOf(matchTarget);
        const cxAnswerKind = (!platformKey || platformKey === "cx") ? ppCxAnswerPageKind(url22) : "";
        if (cxAnswerKind === "blocked") {
          _GM_setValue('pp_exam_sequential', false);
          isShow.value = true;
          logStore.addLog("已跳过当前学习通页面的自动查题", "info");
          return;
        }
        const cxAnswerLogic = cxAnswerPageLogic[cxAnswerKind];
        const routePool = urlLogicGroups[platformKey] || urlLogicPairs;
        let matchedRule = null;
        for (const rule of routePool) {
          if (!matchTarget.includes(rule.keyword) || (rule.match && !rule.match(url22))) continue;
          if (matchedRule === null || rule.keyword.length > matchedRule.keyword.length) matchedRule = rule;
        }
        const logic = cxAnswerLogic || matchedRule?.logic;
        if (logic) {
          isShow.value = true;
          const modeLabel = getCxModeLabel();
          if (modeLabel) logStore.addLog(modeLabel, "info");
          startAfkHeartbeat();
          const _ppRunLogic = () => {
            if (cxAnswerLogic && cxAnswerKind !== "notes" && ppCxHasCompletedAnswerState(document)) {
              if (cxAnswerKind !== "work") _GM_setValue('pp_exam_sequential', false);
              logStore.addLog("已跳过当前学习通页面的自动查题", "info");
              return;
            }
            logic();
          };
          ppWaitPageLoaded(10000).then((reason) => {
            if (reason === "timeout") {
              logStore.addLog("页面资源 10 秒内未加载完，先继续执行", "warning");
            }
            _ppRunLogic();
          });
          return;
        }

        if (!url22.includes('/exam-ans/')) {
          _GM_setValue('pp_exam_sequential', false);
        }
        isShow.value = false;
      };
      executeLogicByUrl(url2);
      const queueController = ppQueueForPage();
      const queuePlatform = ppPlatformOf(location.href);
      const showQueue = !!queueController && queueController.pageRole() !== "other";
      if (showQueue || queueController && queuePlatform === "cx" &&
          (ppCxLoginUrl(new URL(location.href)) || ppCxLoginIssue(document))) {
        if (showQueue) isShow.value = true;
        let queueTimer;
        let runningTick = false;
        const tickQueue = async () => {
          if (runningTick) return;
          runningTick = true;
          try {
            const stateRef = queuePlatform === "zhs" ? ppZhsQueueState : ppCxQueueState;
            stateRef.value = await queueController.tick();
          } catch (error) {
            logStore.addLog(`课程队列暂停：${error.message || String(error)}`, "warning");
            queueController.pause();
          } finally {
            runningTick = false;
          }
        };
        vue.onMounted(() => {
          void tickQueue();
          queueTimer = setInterval(tickQueue, 3500);
        });
        vue.onUnmounted(() => clearInterval(queueTimer));
      }
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
          label: "队列",
          full: "课程队列",
          id: "cx-queue",
          icon: "queue",
          component: PpCxQueuePanel,
          props: { controller: showQueue ? queueController : null, platform: queuePlatform }
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
      const extraTabs = new Set(["script-description", "token-usage", "feedback-panel"]);
      const moreExpanded = vue.ref(false);
      const activeTab = vue.ref("main-log");
      const ppfxPaneShift = vue.ref("6px");
      const ppfxRailRef = vue.ref(null);
      let ppfxInkRO = null;
      let ppfxMoreScrollTimer = null;
      const ppfxRevealMore = (open) => {
        if (ppfxMoreScrollTimer) clearTimeout(ppfxMoreScrollTimer);
        ppfxMoreScrollTimer = setTimeout(() => {
          ppfxMoreScrollTimer = null;
          const rail = ppfxRailRef.value;
          if (rail) rail.scrollTop = open ? rail.scrollHeight : 0;
        }, 320);
      };
      const switchTab = (tabId) => {
        const ppfxFrom = tabs.findIndex((tab) => tab.id === activeTab.value);
        const ppfxTo = tabs.findIndex((tab) => tab.id === tabId);
        if (ppfxFrom >= 0 && ppfxTo >= 0 && ppfxFrom !== ppfxTo) {
          ppfxPaneShift.value = ppfxTo > ppfxFrom ? "7px" : "-7px";
        }
        if (extraTabs.has(tabId)) {
          moreExpanded.value = true;
          ppfxRevealMore(true);
        }
        activeTab.value = tabId;
      };
      const toggleMore = () => {
        const closing = moreExpanded.value;
        if (closing && extraTabs.has(activeTab.value)) switchTab("main-log");
        moreExpanded.value = !closing;
        ppfxRevealMore(!closing);
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
      vue.watch([activeTab, moreExpanded], ppfxSyncInk, { flush: "post" });
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
      const renderRailTab = (tab) => {
        const active = activeTab.value === tab.id;
        const warn = tab.id === "config-panel" && !configStore.tokenVerified;
        return vue.h("button", {
          type: "button",
          key: tab.id,
          class: ["pp-rail-item", active ? "active" : "", warn ? "pp-warn" : ""],
          title: tab.full,
          "aria-current": active ? "page" : undefined,
          onClick: () => switchTab(tab.id)
        }, [
          typeof tab.iconNode === "function" ? tab.iconNode() : ppIcon(tab.icon, 17),
          vue.h("span", null, tab.label)
        ]);
      };
      return () => vue.h("div", { class: "pp-shell" }, [
        vue.h("nav", { class: "pp-rail", ref: ppfxRailRef, "aria-label": "脚本导航" }, [
          vue.h("div", { class: "pp-rail-ink", "aria-hidden": "true" }),
          ...tabs.filter((tab) => !extraTabs.has(tab.id)).map(renderRailTab),
          vue.h("div", {
            id: "pp-rail-more-items",
            class: ["pp-rail-more-items", moreExpanded.value ? "is-open" : ""],
            "aria-hidden": !moreExpanded.value
          }, tabs.filter((tab) => extraTabs.has(tab.id)).map(renderRailTab)),
          vue.h("button", {
            type: "button",
            class: "pp-rail-item pp-rail-more",
            "aria-label": moreExpanded.value ? "收起更多" : "展开更多",
            "aria-controls": "pp-rail-more-items",
            "aria-expanded": moreExpanded.value,
            onClick: toggleMore
          }, [vue.h("span", { class: "pp-rail-more-arrow" }, ppIcon("chevronDown", 17))]),
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
      const detectedPlatform = ppPlatformOf(url2);
      if (detectedPlatform) configStore.platformName = detectedPlatform;
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createBlock(_sfc_main$1);
      };
    }
  });
  const layoutCss = LAYOUT_CSS;
  const epCss = (() => {
    try {
      const css = _GM_getResourceText?.("ElementPlusStyle");
      return typeof css === "string" ? css : "";
    } catch (e) {
      return "";
    }
  })();
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
    ppAddStartupStyle(epCss);
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

    var apiStems = null;
    var pickApiStems = function (payload) {
      try {
        var rt = payload && (payload.rt || (payload.data && payload.data.rt));
        var base = rt && rt.examBase;
        var parts = base && base.workExamParts;
        if (!parts || !parts.length) return null;
        var out = [];
        for (var pi = 0; pi < parts.length; pi++) {
          var dtos = parts[pi] && parts[pi].questionDtos;
          if (!dtos || !dtos.length) continue;
          for (var di = 0; di < dtos.length; di++) {
            var dto = dtos[di] || {};
            var name = dto.name || dto.questionName || dto.question || "";
            out.push(String(name).trim());
          }
        }
        for (var k = 0; k < out.length; k++) { if (out[k]) return out; }
        return null;
      } catch (e) { return null; }
    };
    var onStemApiLoad = function (xhr) {
      try {
        if (xhr.status !== 200) return;
        var url = String(xhr.responseURL || "");
        if (url.indexOf("doHomework") < 0 && url.indexOf("doExam") < 0) return;
        var text = typeof xhr.response === "string" ? xhr.response : xhr.responseText;
        if (!text) return;
        var stems = pickApiStems(JSON.parse(text));
        if (stems) apiStems = stems;
      } catch (e) {}
    };
    try {
      var origXhrSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function () {
        try { this.addEventListener("load", function () { onStemApiLoad(this); }); } catch (e) {}
        return origXhrSend.apply(this, arguments);
      };
    } catch (e) {}
    setInterval(function () {
      try {
        if (!apiStems) return;
        var qs = document.querySelectorAll(".examPaper_subject");
        if (!qs.length || qs.length !== apiStems.length) return;
        for (var i = 0; i < qs.length; i++) {
          if (qs[i].getAttribute("data-pp-stem")) continue;
          if (!apiStems[i]) continue;
          qs[i].setAttribute("data-pp-stem", apiStems[i]);
        }
      } catch (e) {}
    }, 600);
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
  const url = _unsafeWindow.location.href;
  const pageHost = (() => {
    try {
      return String(_unsafeWindow.location.hostname || "").toLowerCase();
    } catch (e) {
      return "";
    }
  })();

  if (window.self === window.top) {
    window.addEventListener('message', (event) => {
      if (event.data?.source === 'chaoxing-helper-iframe' && event.data.action === 'closePanel') {
        const root = document.getElementById('chaoxing-helper-root');
        if (root) root.style.display = 'none';
      }
    });
  }

  if (pageHost === "zhihuishu.com" || pageHost.endsWith(".zhihuishu.com")) {
    ppfxGuardTrustTimers();
    installZhsPageBridge();
    installZhPaperProbe();
  }

  let preloadStarted = false;
  let preloadReady = false;
  const timer = setInterval(async () => {
    if (document.readyState !== "loading" && document.body) {
      if (!preloadReady) {
        if (preloadStarted) return;
        preloadStarted = true;
        await preloadBeforeStart();
        preloadReady = true;
        if (!document.body) return;
      }
      clearInterval(timer);

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
      if (_GM_xmlhttpRequest && !ppRemoteScriptsRequestedInPreload) setTimeout(ppRunRemoteScriptsPing, 0);

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
            const href = String(location.href || "");
            const loginLike =
              /login|passport|sso|cas|oauth|auth/i.test(href) ||
              /登录|登陆|扫码|验证码/.test(String(document.title || ""));
            if (loginLike || !(media.isConnected !== false)) {
              if (store.type === "视频" || store.type === "音频") {
                store.update({
                  taskName: "等待任务开始",
                  type: "",
                  percent: 0,
                  currentTime: 0,
                  totalTime: 0,
                  detail: "",
                  isPlaying: false
                });
              }
              return;
            }
            if (/zhihuishu\.com|polymas\.com/.test(location.hostname)) {
              const inPlayer = media.closest && media.closest(
                "#container, .video-player-wrapper, #vjs_container, .able-player-container, .video-js, .videoArea"
              );
              if (!inPlayer) return;
            }
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
            const readTaskTitle = () => {
              for (const selector of ["#mainid .prev_title", ".prev_title", ".chapter_title", ".posCatalog_active"]) {
                const el = document.querySelector(selector);
                const text = el ? String(el.textContent || "").replace(/\s+/g, " ").trim() : "";
                if (text) return text.slice(0, 40);
              }
              return String(document.title || "").split(/[—–\-_|]/)[0].trim().slice(0, 40);
            };
            const pageTitle = readTaskTitle();
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

      if (_GM_xmlhttpRequest) setTimeout(checkServerNotice, 500);

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
