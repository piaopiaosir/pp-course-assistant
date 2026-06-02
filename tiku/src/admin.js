const { db, getEnv } = require('./config');

// HTML属性转义函数（防XSS）
function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// JS模板字符串转义（防止数据库中的反引号、${}、</script>等破坏外层模板语法）
function escapeJsTemplate(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/<\//g, '<\\/');  // 防止 </script> 提前关闭 script 标签
}

// ==================== HTML模板 ====================

function generateLoginHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理面板</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #18181b;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-font-smoothing: antialiased;
    }
    .login-container {
      background: #1e1e22;
      border-radius: 8px;
      padding: 40px;
      width: 100%;
      max-width: 360px;
      border: 1px solid #27272a;
    }
    .logo {
      width: 40px;
      height: 40px;
      margin: 0 auto 24px;
      background: #fafafa;
      border-radius: 8px;
    }
    h1 { 
      color: #fafafa; 
      text-align: center; 
      margin-bottom: 8px; 
      font-size: 20px;
      font-weight: 600;
    }
    .subtitle {
      text-align: center;
      color: #a1a1aa;
      margin-bottom: 32px;
      font-size: 14px;
    }
    .input-group { margin-bottom: 16px; }
    label { 
      display: block; 
      margin-bottom: 6px; 
      color: #a1a1aa; 
      font-weight: 500;
      font-size: 13px;
    }
    input[type="password"] {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #3f3f46;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.15s;
      background: #18181b;
      color: #e4e4e7;
    }
    input[type="password"]:focus { 
      outline: none; 
      border-color: #71717a;
    }
    input[type="password"]::placeholder {
      color: #52525b;
    }
    button {
      width: 100%;
      padding: 8px;
      background: #fafafa;
      color: #18181b;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      margin-top: 8px;
    }
    button:hover { 
      background: #ffffff;
    }
    button:active {
      transform: scale(0.98);
    }
    .hint { 
      margin-top: 16px; 
      text-align: center; 
      color: #52525b; 
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo"></div>
    <h1>管理面板</h1>
    <p class="subtitle">输入密码以继续</p>
    <form onsubmit="handleLogin(event)">
      <div class="input-group">
        <label for="password">密码</label>
        <input type="password" id="password" placeholder="输入密码" required autofocus>
      </div>
      <button type="submit">登录</button>
    </form>
    <p class="hint">登录后30天内免重新登录</p>
  </div>
  <script>
    function handleLogin(e) {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/admin';
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'password';
      input.value = password;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    }
  </script>
</body>
</html>`;
}

function generateAdminHTML(userStats, tokenStats, cacheStats, recentCache, topUsers, globalStats, hourlyRates, userTrends, queryTrends) {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN');
  };

  const SOURCE_DISPLAY = {
    'tiku': '题库海',
    'hivenet': 'Hive-Net',
    'ucuc': 'OK题库',
    'yanxi': '言溪题库',
    // AI模型不再统一映射为"AI解析"，显示具体模型名称
    // 'ai': 'AI解析',  // 已移除
    // 'ai-t1': 'AI解析',  // 已移除
    // 'ai-kimi-thinking': 'AI解析',  // 已移除
    // 'kimi-k2.6': 'AI解析',  // 已移除
  };
  const getBadgeText = (source) => SOURCE_DISPLAY[source] || source;

  const getBadgeClass = (source) => {
    // 题库来源
    if (['tiku','hivenet','ucuc','yanxi'].includes(source)) return source;
    
    // AI模型来源 - 转换为小写 CSS 类名格式（HTML中不转义）
    const aiModelsMap = {
      'ai': 'ai',
      'hunyuan-standard': 'hunyuan-standard',
      'hunyuan-t1': 'hunyuan-t1',
      'deepseek-v3.2': 'deepseek-v3.2',
      'deepseek-v3.2-think': 'deepseek-v3.2-think',
      'deepseek-r1-0528': 'deepseek-r1-0528',
      'deepseek-r1': 'deepseek-r1',
      'qwen3.6-plus': 'qwen3.6-plus',
      'qwen3.7-max': 'qwen3.7-max',
      'qwen3.5-plus': 'qwen3.5-plus',
      'qwen3-235b-a22b': 'qwen3-235b-a22b',
      'minimax-m2.5': 'minimax-m2.5',
      'minimax-m2.7': 'minimax-m2.7',
      'gpt-5.4-mini': 'gpt-5.4-mini',
      'gpt-5.4-nano': 'gpt-5.4-nano',
      'gemini-3.1': 'gemini-3.1',
      'gemini-3.5': 'gemini-3.5',
      'glm-5': 'glm-5',
      'glm-5.1': 'glm-5.1',
      'glm-4.7': 'glm-4.7',
      'kimi-k2.6': 'kimi-k2.6'
    };
    
    const lowerSource = source.toLowerCase();
    if (aiModelsMap[lowerSource]) return aiModelsMap[lowerSource];
    
    // 其他AI模型使用通用ai样式
    return 'ai';
  };
  
  const typeMap = {
    '0': '单选题',
    '1': '多选题',
    '2': '填空题',
    '3': '判断题',
    '4': '简答题'
  };
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>题库系统 - 管理面板</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(180deg, #f0f0f5 0%, #f5f5f7 30%, #fafafe 100%);
      min-height: 100vh;
      color: #1d1d1f;
      -webkit-font-smoothing: antialiased;
      position: relative;
    }
    body::before {
      content: '';
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: 
        radial-gradient(ellipse at 15% 10%, rgba(0, 113, 227, 0.04) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 90%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.02) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }
    
    /* 顶部导航 */
    .topbar {
      position: sticky;
      top: 0;
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      padding: 0 24px;
      z-index: 100;
    }
    .topbar-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .topbar-logo {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #0071e3 0%, #7c3aed 100%);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
      box-shadow: 0 2px 8px rgba(0, 113, 227, 0.25);
    }
    .topbar-title {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #1d1d1f;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* 主内容区 */
    .main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      position: relative;
      z-index: 1;
    }
    
    /* 标签导航 */
    .nav-tabs {
      display: flex;
      gap: 2px;
      background: rgba(0, 0, 0, 0.06);
      padding: 4px;
      border-radius: 10px;
      width: fit-content;
      margin-bottom: 24px;
    }
    .nav-tab {
      padding: 6px 14px;
      border: none;
      border-radius: 7px;
      background: transparent;
      color: #6e6e73;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-tab.active {
      background: #ffffff;
      color: #1d1d1f;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .nav-tab:hover:not(.active) {
      color: #1d1d1f;
    }
    
    /* 统计卡片网格 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(0, 113, 227, 0.3), transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .stat-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    .stat-card:hover::after {
      opacity: 1;
    }
    .stat-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .stat-card-title {
      font-size: 12px;
      font-weight: 500;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-card-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .stat-subtitle {
      font-size: 12px;
      color: #71717a;
    }
    
    /* 详细统计网格 */
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .detail-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .detail-title {
      font-size: 13px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    .detail-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .detail-label {
      font-size: 13px;
      color: #6e6e73;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #1d1d1f;
      font-variant-numeric: tabular-nums;
    }
    .detail-value.active {
      color: #60a5fa;
    }
    .detail-unit {
      font-size: 11px;
      font-weight: 400;
      color: #71717a;
      margin-left: 4px;
    }
    
    /* 统计数字渐变 */
    .stat-number {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1;
      margin-bottom: 6px;
      background: linear-gradient(135deg, #0071e3 0%, #00c7ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    /* 数据表格 */
    .table-section {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 24px;
    }
    .table-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .table-title {
      font-size: 14px;
      font-weight: 600;
      color: #1d1d1f;
    }
    .table-count {
      font-size: 12px;
      color: #71717a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead {
      background: rgba(0, 0, 0, 0.02);
    }
    th {
      padding: 12px 20px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #6e6e73;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    td {
      padding: 12px 20px;
      font-size: 13px;
      color: #1d1d1f;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
    tr:last-child td { border-bottom: none; }
    tbody tr {
      transition: background 0.15s;
    }
    tbody tr:hover {
      background: rgba(0, 0, 0, 0.02);
    }
    
    /* Badge 样式 */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-tiku { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .badge-hivenet { background: rgba(6, 182, 212, 0.15); color: #0891b2; }
    .badge-ucuc { background: rgba(245, 158, 11, 0.15); color: #d97706; }
    .badge-yanxi { background: rgba(139, 92, 246, 0.15); color: #7c3aed; }
    
    /* AI模型 */
    .badge-ai { background: rgba(236, 72, 153, 0.15); color: #ec4899; }
    .badge-hunyuan-standard { background: rgba(102, 126, 234, 0.15); color: #667eea; }
    .badge-hunyuan-t1 { background: rgba(118, 75, 162, 0.15); color: #764ba2; }
    .badge-deepseek-v3\\.2 { background: rgba(236, 72, 153, 0.15); color: #ec4899; }
    .badge-deepseek-v3\\.2-think { background: rgba(244, 114, 182, 0.15); color: #f472b6; }
    .badge-deepseek-r1-0528 { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
    .badge-deepseek-r1 { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
    .badge-qwen3\\.6-plus { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .badge-qwen3\\.7-max { background: rgba(125, 211, 252, 0.15); color: #7dd3fc; }
    .badge-qwen3\\.5-plus { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
    .badge-qwen3-235b-a22b { background: rgba(2, 132, 199, 0.15); color: #0284c7; }
    .badge-minimax-m2\\.5 { background: rgba(249, 115, 22, 0.15); color: #f97316; }
    .badge-minimax-m2\\.7 { background: rgba(251, 146, 60, 0.15); color: #fb923c; }
    .badge-gpt-5\\.4-mini { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .badge-gpt-5\\.4-nano { background: rgba(5, 150, 105, 0.15); color: #059669; }
    .badge-gemini-3\\.1 { background: rgba(8, 145, 178, 0.15); color: #0891b2; }
    .badge-gemini-3\\.5 { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }
    .badge-glm-5 { background: rgba(124, 58, 237, 0.15); color: #7c3aed; }
    .badge-glm-5\\.1 { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
    .badge-glm-4\\.7 { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
    .badge-kimi-k2\\.6 { background: rgba(124, 58, 237, 0.15); color: #7c3aed; }
    
    .token-mask {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 12px;
      color: #71717a;
    }
    .answer-text {
      color: #4ade80;
      font-weight: 600;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    /* 按钮 */
    .btn {
      padding: 6px 14px;
      border-radius: 980px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.7);
      color: #1d1d1f;
    }
    .btn:hover {
      background: #ffffff;
      border-color: rgba(0, 0, 0, 0.2);
    }
    .btn-primary {
      background: #0071e3;
      color: #ffffff;
      border-color: #0071e3;
    }
    .btn-primary:hover {
      background: #0077ed;
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }
    .btn-edit:hover {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-color: rgba(59, 130, 246, 0.3);
    }
    
    /* 表格操作按钮 */
    .edit-btn, .delete-btn {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: #ffffff;
      margin-right: 4px;
    }
    .edit-btn {
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.2);
    }
    .edit-btn:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.4);
    }
    .delete-btn {
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.2);
    }
    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.4);
    }
    
    /* 刷新按钮 */
    .fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #27272a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fafafa;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .fab:hover {
      background: #3f3f46;
    }
    
    /* 标签页内容 */
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    
    /* 数据库控制面板 */
    .db-panel {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .db-toolbar {
      padding: 12px 20px;
      background: rgba(0, 0, 0, 0.02);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .db-toolbar select {
      min-width: 140px;
      padding: 6px 28px 6px 12px;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      color: #1d1d1f;
      font-size: 13px;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236e6e73' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
    }
    .db-toolbar input {
      min-width: 200px;
      padding: 6px 12px;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      color: #1d1d1f;
      font-size: 13px;
    }
    .db-toolbar select:focus,
    .db-toolbar input:focus {
      outline: none;
      border-color: #0071e3;
      box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
    }
    
    /* 分页 */
    .pagination {
      display: flex;
      gap: 6px;
      padding: 16px 20px;
      justify-content: center;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
    .pagination button {
      padding: 6px 12px;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      color: #1d1d1f;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pagination button:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.2);
    }
    .pagination button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .pagination .page-info {
      padding: 6px 12px;
      color: #6e6e73;
      font-size: 13px;
    }
    
    /* 模态框 */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay.active { display: flex; }
    .modal {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      width: 90%;
      max-width: 480px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    }
    .modal h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1d1d1f;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #6e6e73;
      margin-bottom: 6px;
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px 14px;
      background: #f5f5f7;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      color: #1d1d1f;
      font-size: 14px;
      transition: all 0.2s;
    }
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #0071e3;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
    }
    .modal-actions {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }
    .modal-actions button {
      flex: 1;
      padding: 8px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    /* 图表容器 */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .chart-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: box-shadow 0.3s;
    }
    .chart-card:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    }
    .chart-card h3 {
      font-size: 14px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 20px;
      letter-spacing: -0.01em;
    }
    .chart-card canvas {
      width: 100% !important;
      max-height: 320px;
    }
    .chart-full {
      grid-column: 1 / -1;
    }
    
    /* 图表范围切换按钮 */
    .chart-range-btns {
      display: flex;
      gap: 4px;
    }
    .range-btn {
      padding: 3px 10px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid #3f3f46;
      border-radius: 6px;
      background: transparent;
      color: #a1a1aa;
      cursor: pointer;
      transition: all 0.15s;
    }
    .range-btn:hover {
      border-color: #52525b;
      color: #e4e4e7;
    }
    .range-btn.active {
      background: #0071e3;
      border-color: #0071e3;
      color: #fff;
    }
    
    /* 滚动条 */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #27272a;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #3f3f46;
    }
  </style>
</head>
<body>
  <!-- 顶部导航栏 -->
  <div class="topbar">
    <div class="topbar-content">
      <div class="topbar-left">
        <div class="topbar-logo">飘</div>
        <span class="topbar-title">题库系统</span>
      </div>
      <div class="topbar-right">
        <button class="btn" onclick="refreshData()">刷新数据</button>
      </div>
    </div>
  </div>
  
  <!-- 主内容区 -->
  <div class="main">
    <!-- 标签导航 -->
    <div class="nav-tabs">
      <button class="nav-tab active" onclick="showTab(0)">概览</button>
      <button class="nav-tab" onclick="showTab(1)">数据库</button>
      <button class="nav-tab" onclick="showTab(2)">可视化</button>
    </div>
    
    <!-- 第一页：统计概览 -->
    <div id="tab0" class="tab-content active">
    <!-- 核心指标卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">总查询次数</span>
          <span class="stat-badge" style="background: rgba(74, 222, 128, 0.15); color: #4ade80;">累计</span>
        </div>
        <div class="stat-number">${globalStats.total_queries || 0}</div>
        <div class="stat-subtitle">所有请求总数</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">查询速率</span>
          <span class="stat-badge" style="background: rgba(96, 165, 250, 0.15); color: #60a5fa;">1小时</span>
        </div>
        <div class="stat-number">${hourlyRates.total || 0}</div>
        <div class="stat-subtitle">次/小时</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">服务器 1 查询速率</span>
          <span class="stat-badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">S1</span>
        </div>
        <div class="stat-number">${hourlyRates.server1 || 0}</div>
        <div class="stat-subtitle">次/小时</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">服务器 2 查询速率</span>
          <span class="stat-badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">S2</span>
        </div>
        <div class="stat-number">${hourlyRates.server2 || 0}</div>
        <div class="stat-subtitle">次/小时</div>
      </div>
    </div>
    
    <!-- 详细统计 -->
    <div class="detail-grid">
      <div class="detail-card">
        <h3 class="detail-title">速率统计</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">题库海</span>
            <span class="detail-value" style="color: #f59e0b;">${hourlyRates.tiku || 0} <span class="detail-unit">次/小时</span></span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Hive-Net</span>
            <span class="detail-value" style="color: #06b6d4;">${hourlyRates.hivenet || 0} <span class="detail-unit">次/小时</span></span>
          </div>
          <div class="detail-item">
            <span class="detail-label">言溪题库</span>
            <span class="detail-value" style="color: #a855f7;">${hourlyRates.yanxi || 0} <span class="detail-unit">次/小时</span></span>
          </div>
          <div class="detail-item">
            <span class="detail-label">OK题库</span>
            <span class="detail-value" style="color: #fbbf24;">${hourlyRates.ucuc || 0} <span class="detail-unit">次/小时</span></span>
          </div>
          <div class="detail-item">
            <span class="detail-label">AI 调用</span>
            <span class="detail-value" style="color: #f472b6;">${hourlyRates.ai || 0} <span class="detail-unit">次/小时</span></span>
          </div>
          <div class="detail-item">
            <span class="detail-label">缓存命中</span>
            <span class="detail-value" style="color: #4ade80;">${hourlyRates.cache || 0} <span class="detail-unit">次/小时</span></span>
          </div>
        </div>
      </div>
      
      <div class="detail-card">
        <h3 class="detail-title">平台调用总数</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">题库海</span>
            <span class="detail-value">${globalStats.tiku_calls_count || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Hive-Net</span>
            <span class="detail-value">${globalStats.hivenet_calls_count || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">言溪题库</span>
            <span class="detail-value">${globalStats.yanxi_calls_count || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">OK题库</span>
            <span class="detail-value">${globalStats.ucuc_calls_count || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">缓存命中</span>
            <span class="detail-value" style="color: #4ade80;">${globalStats.cache_hits_count || 0}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-card">
        <h3 class="detail-title">缓存来源统计</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">题库海</span>
            <span class="detail-value" style="color: #f59e0b;">${cacheStats.tiku_cached || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Hive-Net</span>
            <span class="detail-value" style="color: #06b6d4;">${cacheStats.hivenet_cached || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">言溪题库</span>
            <span class="detail-value" style="color: #a855f7;">${cacheStats.yanxi_cached || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">OK题库</span>
            <span class="detail-value" style="color: #fbbf24;">${cacheStats.ucuc_cached || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">AI 生成</span>
            <span class="detail-value" style="color: #f472b6;">${cacheStats.ai_cached || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">缓存总数</span>
            <span class="detail-value">${cacheStats.total_cached || 0}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="detail-grid">
      <div class="detail-card">
        <h3 class="detail-title">题库剩余次数</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">题库海密钥 1</span>
            <span class="detail-value ${globalStats.current_tiku_key === 1 ? 'active' : ''}">${globalStats.tiku_remaining_1 || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">题库海密钥 2</span>
            <span class="detail-value ${globalStats.current_tiku_key === 2 ? 'active' : ''}">${globalStats.tiku_remaining_2 || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Hive-Net 剩余</span>
            <span class="detail-value">${globalStats.hivenet_remaining || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">言溪剩余</span>
            <span class="detail-value">${globalStats.yanxi_remaining || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">OK题库剩余</span>
            <span class="detail-value">${globalStats.ucuc_remaining || 0}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-card">
        <h3 class="detail-title">Tavily 搜索密钥 (每月1号重置)</h3>
        <div class="detail-list" style="max-height: 300px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.2) transparent;">
          <div class="detail-item">
            <span class="detail-label">当前使用密钥</span>
            <span class="detail-value active">密钥 ${globalStats.tavily_current_key || 1}</span>
          </div>
          ${Array.from({length: 30}, (_, i) => {
            const keyNum = i + 1;
            const usage = globalStats[`tavily_key_${keyNum}_usage`] || 0;
            const isCurrent = Number(globalStats.tavily_current_key) === keyNum;
            const highlight = usage > 0 ? ' style="color: #f87171;"' : '';
            return `<div class="detail-item">
            <span class="detail-label">密钥 ${keyNum} 使用次数${isCurrent ? ' (当前)' : ''}</span>
            <span class="detail-value"${highlight}>${usage} <span class="detail-unit">次</span></span>
          </div>`;
          }).join('\n')}
          <div class="detail-item">
            <span class="detail-label">上次重置日期</span>
            <span class="detail-value">${escapeJsTemplate(globalStats.tavily_last_reset_date || '未重置')}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-card">
        <h3 class="detail-title">验证统计</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">已验证总数</span>
            <span class="detail-value">${(cacheStats.verified_correct || 0) + (cacheStats.verified_wrong || 0)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">正确题目</span>
            <span class="detail-value" style="color: #4ade80;">${cacheStats.verified_correct || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">错误题目</span>
            <span class="detail-value" style="color: #f87171;" id="wrongCount">${cacheStats.verified_wrong || 0}</span>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="btn" style="flex:1;" onclick="startRecheck()" id="recheckBtn">重查错误题目</button>
          <button class="btn" style="flex:1;" onclick="startDedup()" id="dedupBtn">查重清理</button>
        </div>
        <div id="recheckStatus" style="margin-top:8px;font-size:12px;color:#6e6e73;"></div>
        <!-- 重查实时日志窗口 -->
        <div id="recheckLogPanel" style="display:none;margin-top:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:10px;font-weight:600;color:#71717a;">实时日志</span>
            <button onclick="clearRecheckLog()" style="font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(0,0,0,0.06);border:none;cursor:pointer;">清空</button>
          </div>
          <div id="recheckLogBox" style="background:#1e1e22;border-radius:4px;padding:6px;height:80px;overflow-y:auto;font-family:'SF Mono','Consolas',monospace;font-size:10px;line-height:1.3;"></div>
        </div>
      </div>
    </div>
    
    <!-- 最近记录表格 -->
        
    <!-- 模型调用统计 -->
    <div class="detail-grid">
      <div class="detail-card">
        <h3 class="detail-title">DeepSeek 系列</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">DeepSeek-V3.2</span>
            <span class="detail-value" style="color: #ec4899;">${globalStats.deepseek_v3_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">DeepSeek-R1</span>
            <span class="detail-value" style="color: #8b5cf6;">${globalStats.deepseek_r1_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">DeepSeek-V4-Flash</span>
            <span class="detail-value" style="color: #3b82f6;">${globalStats.deepseek_v4_flash_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">DeepSeek-V4-Pro</span>
            <span class="detail-value" style="color: #2563eb;">${globalStats.deepseek_v4_pro_calls || 0}</span>
          </div>
        </div>
      </div>
          
      <div class="detail-card">
        <h3 class="detail-title">Kimi & Qwen</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">Kimi-K2.6</span>
            <span class="detail-value" style="color: #7c3aed;">${globalStats.kimi_k26_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Kimi-K2.5</span>
            <span class="detail-value" style="color: #9333ea;">${globalStats.kimi_k25_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Qwen3.5</span>
            <span class="detail-value" style="color: #0ea5e9;">${globalStats.qwen3_5_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Qwen3.6</span>
            <span class="detail-value" style="color: #38bdf8;">${globalStats.qwen3_6_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Qwen3.7</span>
            <span class="detail-value" style="color: #7dd3fc;">${globalStats.qwen3_7_calls || 0}</span>
          </div>
        </div>
      </div>
          
      <div class="detail-card">
        <h3 class="detail-title">MiniMax & 混元</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">MiniMax-M2.5</span>
            <span class="detail-value" style="color: #f97316;">${globalStats.minimax_m25_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">MiniMax-M2.7</span>
            <span class="detail-value" style="color: #fb923c;">${globalStats.minimax_m27_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">混元 Standard</span>
            <span class="detail-value" style="color: #667eea;">${globalStats.hunyuan_standard_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">混元 T1</span>
            <span class="detail-value" style="color: #764ba2;">${globalStats.hunyuan_t1_calls || 0}</span>
          </div>
        </div>
      </div>
          
      <div class="detail-card">
        <h3 class="detail-title">GPT & Gemini & GLM</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">GPT-5.4-mini</span>
            <span class="detail-value" style="color: #10b981;">${globalStats.gpt_54_mini_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">GPT-5.4-nano</span>
            <span class="detail-value" style="color: #059669;">${globalStats.gpt_54_nano_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Gemini 3.1</span>
            <span class="detail-value" style="color: #0891b2;">${globalStats.gemini_31_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Gemini 3.5</span>
            <span class="detail-value" style="color: #06b6d4;">${globalStats.gemini_35_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">GLM-5</span>
            <span class="detail-value" style="color: #7c3aed;">${globalStats.glm_5_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">GLM-5.1</span>
            <span class="detail-value" style="color: #8b5cf6;">${globalStats.glm_51_calls || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">GLM-4.7</span>
            <span class="detail-value" style="color: #6366f1;">${globalStats.glm_47_calls || 0}</span>
          </div>
        </div>
      </div>
    </div>
        
    <!-- 用户统计 -->
    <div class="detail-grid">
      <div class="detail-card">
        <h3 class="detail-title">用户数据</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">总用户数</span>
            <span class="detail-value">${userStats.total_users || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">付费用户</span>
            <span class="detail-value" style="color: #4ade80;">${userStats.paid_users || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">免费用户</span>
            <span class="detail-value">${userStats.free_users || 0}</span>
          </div>
        </div>
      </div>
          
      <div class="detail-card">
        <h3 class="detail-title">活跃度</h3>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">3天活跃用户</span>
            <span class="detail-value">${tokenStats.active_tokens || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">剩余总次数</span>
            <span class="detail-value">${tokenStats.total_remaining || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">活跃用户剩余</span>
            <span class="detail-value">${tokenStats.active_remaining || 0}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="table-section">
      <div class="table-header">
        <div>
          <div class="table-title">最近缓存的题目</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>题目内容</th>
            <th>题型</th>
            <th>答案</th>
            <th>来源</th>
            <th>正确性</th>
            <th>缓存时间</th>
          </tr>
        </thead>
        <tbody>
          ${recentCache.map(item => `
            <tr>
              <td class="question-text" title="${escapeAttr(item.question)}">${escapeJsTemplate(item.question)}</td>
              <td>${escapeJsTemplate(typeMap[item.type] || '未知')}</td>
              <td class="answer-text" title="${escapeAttr(item.answer)}">${escapeJsTemplate(item.answer)}</td>
              <td><span class="badge badge-${getBadgeClass(item.source)}">${escapeJsTemplate(getBadgeText(item.source))}</span></td>
              <td>
                ${item.is_correct === 1 ? '<span style="color: #4caf50; font-weight: 600;">Correct</span>' : 
                  item.is_correct === 0 ? '<span style="color: #f44336; font-weight: 600;">Wrong</span>' : 
                  '<span style="color: #999;">未验证</span>'}
              </td>
              <td>${formatDate(item.created_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="table-section">
      <div class="table-header">
        <div>
          <div class="table-title">最近活跃的用户</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>用户ID</th>
            <th>剩余次数</th>
            <th>创建时间</th>
            <th>最后使用</th>
          </tr>
        </thead>
        <tbody>
          ${topUsers.map(user => `
            <tr>
              <td class="token-mask">${escapeJsTemplate(user.token.substring(0, 4))}****${escapeJsTemplate(user.token.substring(12))}</td>
              <td>${escapeJsTemplate(user.user_id || '-')}</td>
              <td><span class="stat-value ${user.remaining_count > 100 ? 'success' : 'warning'}">${escapeJsTemplate(user.remaining_count)}</span></td>
              <td>${formatDate(user.created_at)}</td>
              <td>${formatDate(user.last_used)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- 第二页：数据库管理 -->
  <div id="tab1" class="tab-content">
    <div class="db-panel">
      <div class="db-toolbar">
        <select id="tableSelect" onchange="onTableChange()">
          <option value="tokens">Tokens</option>
          <option value="user_ids">用户 IDs</option>
          <option value="ip_whitelist">IP 白名单</option>
          <option value="ip_blacklist">IP 黑名单</option>
          <option value="ip_access_logs">IP访问日志</option>
          <option value="suspicious_ips">可疑 IP</option>
          <option value="admin_access_logs">管理面板访问记录</option>
          <option value="referrals">推荐记录</option>
          <option value="answer_cache">答案缓存</option>
          <option value="daily_limits">每日限额</option>
          <option value="pp_api_logs">PP题库请求</option>
        </select>
        <select id="searchColumn" onchange="updateSearchPlaceholder()">
          <option value="">所有列</option>
        </select>
        <input type="text" id="searchInput" placeholder="搜索..." onkeyup="if(event.key==='Enter')loadTableData()">
        <button class="btn" onclick="loadTableData()">搜索</button>
        <button class="btn" onclick="clearSearch()">清除</button>
        <button class="btn btn-primary" onclick="openAddModal()">添加</button>
      </div>
      <div id="pageInfo" style="padding: 12px 20px; color: #6e6e73; font-size: 13px; border-bottom: 1px solid rgba(0,0,0,0.06);"></div>
      <div style="overflow-x: auto;">
        <table id="dataTable">
          <thead id="tableHead"></thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>
      <div class="pagination" id="pagination"></div>
    </div>
  </div>
  
  <!-- 第三页：数据可视化 -->
  <div id="tab2" class="tab-content">
    <div class="charts-grid">
      <div class="chart-card">
        <h3>AI Model Calls</h3>
        <canvas id="chartAIModels"></canvas>
      </div>
      <div class="chart-card">
        <h3>Platform Call Volume</h3>
        <canvas id="chartPlatformCalls"></canvas>
      </div>
      <div class="chart-card chart-full">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h3 style="margin:0;">用户量趋势</h3>
          <div class="chart-range-btns" data-chart="userTrend">
            <button class="range-btn active" data-days="30">30日</button>
            <button class="range-btn" data-days="7">7日</button>
            <button class="range-btn" data-days="3">3日</button>
          </div>
        </div>
        <canvas id="chartUserTrend" style="max-height:300px;"></canvas>
      </div>
      <div class="chart-card chart-full">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h3 style="margin:0;">调用数量</h3>
          <div class="chart-range-btns" data-chart="queryRate">
            <button class="range-btn active" data-hours="24">24h</button>
            <button class="range-btn" data-hours="12">12h</button>
            <button class="range-btn" data-hours="6">6h</button>
            <button class="range-btn" data-hours="3">3h</button>
          </div>
        </div>
        <canvas id="chartQueryRate" style="max-height:280px;"></canvas>
      </div>
    </div>
  </div>
  </div>
  
  <!-- 编辑模态框 -->
  <div class="modal-overlay" id="editModal">
    <div class="modal">
      <h3>编辑记录</h3>
      <form id="editForm"></form>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="saveEdit()">保存</button>
        <button class="btn" onclick="closeEditModal()">取消</button>
      </div>
    </div>
  </div>
  
  <!-- 添加模态框 -->
  <div class="modal-overlay" id="addModal">
    <div class="modal">
      <h3>添加记录</h3>
      <form id="addForm"></form>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="saveAdd()">添加</button>
        <button class="btn" onclick="closeAddModal()">取消</button>
      </div>
    </div>
  </div>
  
  <script>
    let currentPage = 1;
    const pageSize = 20;
    let currentTable = 'tokens';
    let currentSearch = '';
    let currentSearchColumn = '';
    
    // 各表格的列定义
    const tableColumns = {
      'tokens': ['token', 'user_id', 'remaining_count', 'is_blacklisted', 'is_free_token', 'last_ip', 'created_at', 'last_used'],
      'user_ids': ['user_id', 'user_type', 'fid', 'created_ip', 'created_at', 'welfare_claimed'],
      'referrals': ['id', 'referrer_id', 'referee_id', 'referrer_reward', 'referee_reward', 'created_at'],
      'ip_whitelist': ['id', 'ip', 'note', 'created_at'],
      'ip_blacklist': ['id', 'ip', 'violation_count', 'ban_until', 'is_permanent', 'created_at', 'updated_at'],
      'ip_access_logs': ['id', 'ip', 'endpoint', 'ip_location', 'access_count', 'is_suspicious', 'created_at', 'updated_at'],
      'admin_access_logs': ['id', 'ip', 'ip_location', 'session_id', 'action', 'user_agent', 'created_at'],
      'suspicious_ips': ['id', 'ip', 'user_count', 'user_ids', 'reason', 'created_at', 'updated_at'],
      'answer_cache': ['id', 'question_hash', 'question', 'options', 'type', 'answer', 'source', 'is_correct', 'created_at']
    };
    
    function showTab(index) {
      document.querySelectorAll('.tab-content').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      document.querySelectorAll('.nav-tab').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      if (index === 1) {
        onTableChange();
        loadTableData();
      }
      if (index === 2) {
        initCharts();
      }
    }
    
    let chartsInitialized = false;
    
    function initCharts() {
      if (chartsInitialized) return;
      chartsInitialized = true;
      
      const colors = {
        tiku: '#f59e0b', hivenet: '#06b6d4', yanxi: '#a855f7', ucuc: '#fbbf24',
        ai: '#ec4899', cache: '#4ade80',
        deepseek_v3: '#ec4899', deepseek_r1: '#8b5cf6', deepseek_v4_flash: '#3b82f6',
        deepseek_v4_pro: '#2563eb', kimi_k26: '#7c3aed', kimi_k25: '#9333ea',
        qwen3_5: '#0ea5e9', qwen3_6: '#38bdf8', qwen3_7: '#7dd3fc', minimax_m25: '#f97316',
        minimax_m27: '#fb923c', hunyuan_standard: '#667eea', hunyuan_t1: '#764ba2',
        gpt_54_mini: '#10b981', gpt_54_nano: '#059669', gemini_31: '#0891b2', gemini_35: '#06b6d4',
        glm_5: '#7c3aed', glm_51: '#8b5cf6', glm_47: '#6366f1'
      };
      
      Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';
      Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(29, 29, 31, 0.92)';
      Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 13 };
      Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
      Chart.defaults.plugins.tooltip.padding = 12;
      Chart.defaults.plugins.tooltip.cornerRadius = 8;
      
      const hourlyRates = ${JSON.stringify(hourlyRates)};
      const globalStats = ${JSON.stringify(globalStats)};
      const userTrends = ${JSON.stringify(userTrends || { days: [], total: [], paid: [], free: [] })};
      const queryTrends = ${JSON.stringify(queryTrends || { hours: [], total: [], server1: [], server2: [], tiku: [], hivenet: [], yanxi: [], ucuc: [], ai: [], cache: [] })};
      
      // Chart 1: AI Model Calls
      const aiModels = [
        { label: 'DeepSeek-V3.2', value: globalStats.deepseek_v3_calls||0, color: colors.deepseek_v3 },
        { label: 'DeepSeek-R1', value: globalStats.deepseek_r1_calls||0, color: colors.deepseek_r1 },
        { label: 'DeepSeek-V4 Flash', value: globalStats.deepseek_v4_flash_calls||0, color: colors.deepseek_v4_flash },
        { label: 'DeepSeek-V4 Pro', value: globalStats.deepseek_v4_pro_calls||0, color: colors.deepseek_v4_pro },
        { label: 'Kimi-K2.6', value: globalStats.kimi_k26_calls||0, color: colors.kimi_k26 },
        { label: 'Kimi-K2.5', value: globalStats.kimi_k25_calls||0, color: colors.kimi_k25 },
        { label: 'Qwen3.5', value: globalStats.qwen3_5_calls||0, color: colors.qwen3_5 },
        { label: 'Qwen3.6', value: globalStats.qwen3_6_calls||0, color: colors.qwen3_6 },
        { label: 'Qwen3.7', value: globalStats.qwen3_7_calls||0, color: colors.qwen3_7 },
        { label: 'MiniMax-M2.5', value: globalStats.minimax_m25_calls||0, color: colors.minimax_m25 },
        { label: 'MiniMax-M2.7', value: globalStats.minimax_m27_calls||0, color: colors.minimax_m27 },
        { label: 'Hunyuan Standard', value: globalStats.hunyuan_standard_calls||0, color: colors.hunyuan_standard },
        { label: 'Hunyuan T1', value: globalStats.hunyuan_t1_calls||0, color: colors.hunyuan_t1 },
        { label: 'GPT-5.4-mini', value: globalStats.gpt_54_mini_calls||0, color: colors.gpt_54_mini },
        { label: 'GPT-5.4-nano', value: globalStats.gpt_54_nano_calls||0, color: colors.gpt_54_nano },
        { label: 'Gemini 3.1', value: globalStats.gemini_31_calls||0, color: colors.gemini_31 },
        { label: 'Gemini 3.5', value: globalStats.gemini_35_calls||0, color: colors.gemini_35 },
        { label: 'GLM-5', value: globalStats.glm_5_calls||0, color: colors.glm_5 },
        { label: 'GLM-5.1', value: globalStats.glm_51_calls||0, color: colors.glm_51 },
        { label: 'GLM-4.7', value: globalStats.glm_47_calls||0, color: colors.glm_47 }
      ].filter(m => m.value > 0);
      
      new Chart(document.getElementById('chartAIModels'), {
        type: 'bar',
        data: {
          labels: aiModels.map(m => m.label),
          datasets: [{
            label: 'Calls',
            data: aiModels.map(m => m.value),
            backgroundColor: aiModels.map(m => m.color + 'CC'),
            borderColor: 'transparent',
            borderRadius: 4,
            borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { 
              grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false }, 
              ticks: { font: { size: 11 }, padding: 8 } 
            },
            y: { 
              grid: { display: false }, 
              ticks: { font: { size: 11, weight: '600' }, padding: 4 } 
            }
          }
        }
      });
      
      // Chart 2: Platform Call Volume
      const platformLabels = ['Tiku', 'Hive-Net', 'Yanxi', 'UCUC', 'Cache'];
      const platformData = [globalStats.tiku_calls_count||0, globalStats.hivenet_calls_count||0, globalStats.yanxi_calls_count||0, globalStats.ucuc_calls_count||0, globalStats.cache_hits_count||0];
      const platformGradients = platformData.map((v, i) => {
        const baseColors = [colors.tiku, colors.hivenet, colors.yanxi, colors.ucuc, colors.cache];
        return baseColors[i] + 'CC';
      });
      
      new Chart(document.getElementById('chartPlatformCalls'), {
        type: 'bar',
        data: {
          labels: platformLabels,
          datasets: [{
            label: 'Calls',
            data: platformData,
            backgroundColor: platformGradients,
            borderColor: 'transparent',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { 
              grid: { display: false }, 
              ticks: { font: { size: 11, weight: '600' }, padding: 8 } 
            },
            y: { 
              grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false }, 
              ticks: { font: { size: 11 }, padding: 8 }, 
              beginAtZero: true 
            }
          }
        }
      });
      
      // Chart 3: User Growth Trend (with range switch)
      const userTrendDatasets = [
        { key: 'total', label: 'Total Users', borderColor: '#0071e3', bgFrom: 'rgba(0,113,227,0.16)', bgTo: 'rgba(0,113,227,0.0)' },
        { key: 'paid', label: 'Paid Users', borderColor: '#34d399', bgFrom: 'rgba(52,211,153,0.14)', bgTo: 'rgba(52,211,153,0.0)' },
        { key: 'free', label: 'Free Users', borderColor: '#a1a1aa', bgFrom: 'rgba(161,161,170,0.10)', bgTo: 'rgba(161,161,170,0.0)' }
      ];

      const userTrendCtx = document.getElementById('chartUserTrend').getContext('2d');
      const userTrendChart = new Chart(userTrendCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'top', align: 'end',
              labels: { usePointStyle: true, pointStyleWidth: 8, padding: 20, font: { size: 12, weight: '500' }, color: '#52525b' }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#71717a', maxTicksLimit: 12 } },
            y: { grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false }, ticks: { font: { size: 11 }, color: '#71717a', padding: 8, stepSize: 5000 } }
          }
        }
      });

      function updateUserTrendChart(days) {
        const sliceStart = userTrends.days.length - days;
        const labels = userTrends.days.slice(sliceStart);
        userTrendChart.data.labels = labels;
        userTrendChart.data.datasets = userTrendDatasets.map(ds => {
          const gradient = userTrendCtx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, ds.bgFrom);
          gradient.addColorStop(1, ds.bgTo);
          return {
            label: ds.label,
            data: userTrends[ds.key].slice(sliceStart),
            borderColor: ds.borderColor,
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: days <= 7 ? 3 : 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: ds.borderColor,
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
            tension: 0.3,
            fill: true
          };
        });
        userTrendChart.update();
      }
      updateUserTrendChart(30);
      
      // Chart 4: Query Rate (with range switch)
      const queryTrendCtx = document.getElementById('chartQueryRate').getContext('2d');
      const queryTrendChart = new Chart(queryTrendCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'top', align: 'end',
              labels: { usePointStyle: true, pointStyleWidth: 8, padding: 16, font: { size: 11, weight: '500' }, color: '#52525b' }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#71717a', maxTicksLimit: 12 } },
            y: { grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false }, ticks: { font: { size: 11 }, color: '#71717a', padding: 8 }, beginAtZero: true }
          }
        }
      });

      const queryDatasets = [
        { key: 'total', label: 'Total', borderColor: '#0071e3', borderWidth: 2.5, borderDash: [] },
        { key: 'server1', label: 'Server 1', borderColor: '#3b82f6', borderWidth: 2, borderDash: [] },
        { key: 'server2', label: 'Server 2', borderColor: '#8b5cf6', borderWidth: 2, borderDash: [] },
        { key: 'cache', label: 'Cache', borderColor: '#4ade80', borderWidth: 2, borderDash: [6,4] },
        { key: 'tiku', label: 'Tiku', borderColor: '#f59e0b', borderWidth: 2, borderDash: [6,4] },
        { key: 'hivenet', label: 'Hive-Net', borderColor: '#06b6d4', borderWidth: 2, borderDash: [6,4] },
        { key: 'yanxi', label: 'Yanxi', borderColor: '#a855f7', borderWidth: 2, borderDash: [6,4] },
        { key: 'ucuc', label: 'UCUC', borderColor: '#fbbf24', borderWidth: 2, borderDash: [6,4] },
        { key: 'ai', label: 'AI', borderColor: '#ec4899', borderWidth: 2, borderDash: [6,4] }
      ];

      function updateQueryRateChart(hours) {
        const sliceStart = queryTrends.hours.length - hours;
        queryTrendChart.data.labels = queryTrends.hours.slice(sliceStart);
        queryTrendChart.data.datasets = queryDatasets.map(ds => ({
          label: ds.label,
          data: queryTrends[ds.key].slice(sliceStart),
          borderColor: ds.borderColor,
          backgroundColor: 'transparent',
          borderWidth: ds.borderWidth,
          borderDash: ds.borderDash,
          pointRadius: hours <= 6 ? 3 : 0,
          pointHoverRadius: 4,
          tension: 0.3,
          fill: false
        }));
        queryTrendChart.update();
      }
      updateQueryRateChart(24);

      // Range button click handlers
      document.querySelectorAll('.chart-range-btns').forEach(group => {
        group.querySelectorAll('.range-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            group.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const chartName = group.dataset.chart;
            if (chartName === 'userTrend') {
              updateUserTrendChart(parseInt(this.dataset.days));
            } else if (chartName === 'queryRate') {
              updateQueryRateChart(parseInt(this.dataset.hours));
            }
          });
        });
      });
    }
    
    function onTableChange() {
      currentTable = document.getElementById('tableSelect').value;
      updateSearchColumnSelect();
      loadTableData();
    }
    
    function updateSearchColumnSelect() {
      const select = document.getElementById('searchColumn');
      const columns = tableColumns[currentTable] || [];
      
      select.innerHTML = '<option value="">所有列</option>' + 
        columns.map(col => '<option value="' + col + '">' + col + '</option>').join('');
      
      currentSearchColumn = '';
      updateSearchPlaceholder();
    }
    
    function updateSearchPlaceholder() {
      currentSearchColumn = document.getElementById('searchColumn').value;
      const input = document.getElementById('searchInput');
      
      if (currentSearchColumn) {
        input.placeholder = '搜索 ' + currentSearchColumn + '...';
      } else {
        input.placeholder = '搜索所有列...';
      }
    }
    
    function loadTableData() {
      currentTable = document.getElementById('tableSelect').value;
      currentSearch = document.getElementById('searchInput').value;
      currentSearchColumn = document.getElementById('searchColumn').value;
      currentPage = 1;
      fetchData();
    }
    
    function clearSearch() {
      document.getElementById('searchInput').value = '';
      document.getElementById('searchColumn').value = '';
      currentSearch = '';
      currentSearchColumn = '';
      updateSearchPlaceholder();
      loadTableData();
    }
    
    function goToPage(page) {
      currentPage = page;
      fetchData();
    }

    // ==================== 查重任务 ====================
    function startDedup() {
      var btn = document.getElementById('dedupBtn');
      var status = document.getElementById('recheckStatus');
      btn.disabled = true;
      btn.textContent = '启动中...';
      status.innerHTML = '<span style="color:#f59e0b">正在启动查重任务...</span>';
      document.getElementById('recheckLogPanel').style.display='block';
      clearRecheckLog();

      fetch('/admin/dedup', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({})})
        .then(function(r){return r.json()})
        .then(function(data){
          if(data.error){
            status.innerHTML='<span style="color:#f87171">'+data.error+'</span>';
            btn.disabled=false;
            btn.textContent='查重清理';
            return;
          }
          if(data.totalGroups === 0){
            status.innerHTML='<span style="color:#4ade80">没有重复题目</span>';
            btn.disabled=false;
            btn.textContent='查重清理';
            return;
          }
          status.innerHTML='<span style="color:#4ade80">查重已启动，共'+data.totalGroups+'组重复，需删除'+data.totalToRemove+'条</span>';
          btn.textContent='查重中(0/'+data.totalGroups+')';
          connectDedupSSE();
        })
        .catch(function(e){
          status.innerHTML='<span style="color:#f87171">启动失败:'+e.message+'</span>';
          btn.disabled=false;
          btn.textContent='查重清理';
        });
    }

    function connectDedupSSE() {
      var btn = document.getElementById('dedupBtn');
      var status = document.getElementById('recheckStatus');

      fetch('/admin/dedup/stream', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'text/event-stream', 'Cache-Control': 'no-cache' }
      })
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        function readStream() {
          reader.read().then(function(result) {
            if (result.done) return;
            buffer += decoder.decode(result.value, { stream: true });
            var lines = buffer.split('\\x0a');
            buffer = lines.pop();  // 保留未完成的行
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (line === '' || line.startsWith(':')) continue;
              if (line.startsWith('data:')) {
                var dataStr = line.substring(5).trim();
                try {
                  var data = JSON.parse(dataStr);
                  if (data.type === 'log') {
                    addRecheckLog(data.level, data.message, data.timestamp);
                  }
                  if (data.done || data.type === 'done') {
                    reader.cancel();
                    btn.disabled = false;
                    btn.textContent = '查重清理';
                    fetch('/admin/dedup/status').then(function(r){return r.json()}).then(function(d){
                      status.innerHTML='<span style="color:#4ade80">查重完成! 处理'+d.totalGroups+'组，删除'+d.removed+'条重复</span>';
                    });
                    return;
                  }
                  if (data.type === 'progress') {
                    if (data.running) {
                      status.innerHTML='查重进度: '+data.processed+'/'+data.totalGroups+'组 | 已删除:'+data.removed+'条';
                      btn.textContent='查重中('+data.processed+'/'+data.totalGroups+')';
                    } else if (!data.running && data.totalGroups > 0) {
                      reader.cancel();
                      btn.disabled = false;
                      btn.textContent = '查重清理';
                      status.innerHTML='<span style="color:#4ade80">查重完成! 处理'+data.totalGroups+'组，删除'+data.removed+'条重复</span>';
                    }
                  }
                } catch (e) { console.error('解析SSE数据失败:', e); }
              }
            }
            readStream();
          }).catch(function(err){ console.error('SSE连接失败:', err); });
        }
        readStream();
      })
      .catch(function(err) {
        btn.disabled = false;
        btn.textContent = '查重清理';
        fetch('/admin/dedup/status').then(function(r){return r.json()}).then(function(d){
          if (d.running) { connectDedupSSE(); }
          else { status.innerHTML='<span style="color:#4ade80">查重完成! 处理'+d.totalGroups+'组，删除'+d.removed+'条重复</span>'; }
        }).catch(function(){ status.innerHTML='<span style="color:#f87171">连接中断</span>'; });
      });
    }

    function startRecheck() {
      var btn = document.getElementById('recheckBtn');
      var status = document.getElementById('recheckStatus');
      btn.disabled = true;
      btn.textContent = '启动中...';
      status.innerHTML = '<span style="color:#f59e0b">正在启动重查任务...</span>';
      // 显示日志面板
      document.getElementById('recheckLogPanel').style.display='block';
      clearRecheckLog();
      
      // 先POST启动任务，成功后再建立SSE连接接收实时推送
      fetch('/admin/recheck', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({})})
        .then(function(r){return r.json()})
        .then(function(data){
          if(data.error){
            status.innerHTML='<span style="color:#f87171">'+data.error+'</span>';
            btn.disabled=false;
            btn.textContent='启动重查';
            return;
          }
          status.innerHTML='<span style="color:#4ade80">重查已启动，共'+data.total+'道错误题目</span>';
          btn.textContent='重查中(0/'+data.total+')';
          // 任务已启动，现在建立SSE连接接收实时推送
          connectRecheckSSE();
        })
        .catch(function(e){
          status.innerHTML='<span style="color:#f87171">启动失败:'+e.message+'</span>';
          btn.disabled=false;
          btn.textContent='启动重查';
        });
    }
    
    // 日志显示函数
    function addRecheckLog(level, message, timestamp) {
      var logBox = document.getElementById('recheckLogBox');
      if (!logBox) return;
      
      var colorMap = {
        'info': '#a1a1aa',
        'success': '#4ade80',
        'warn': '#f59e0b',
        'error': '#f87171'
      };
      var color = colorMap[level] || '#a1a1aa';
      
      var logLine = '<div style="color:'+color+'"><span style="color:#52525b">'+timestamp+'</span> '+message+'</div>';
      logBox.innerHTML += logLine;
      
      // 自动滚动到底部
      logBox.scrollTop = logBox.scrollHeight;
      
      // 限制日志行数（最多保留100行）
      var lines = logBox.children;
      if (lines.length > 100) {
        logBox.removeChild(lines[0]);
      }
    }
    
    function clearRecheckLog() {
      var logBox = document.getElementById('recheckLogBox');
      if (logBox) logBox.innerHTML = '';
    }
    
    function connectRecheckSSE() {
      var btn = document.getElementById('recheckBtn');
      var status = document.getElementById('recheckStatus');
      
      // 使用 fetch 替代 EventSource，确保携带 cookie
      console.log('[SSE] 正在建立连接 (fetch)...');
      addRecheckLog('info', '正在建立 SSE 连接...', new Date().toLocaleTimeString());
      
      fetch('/admin/recheck/stream', {
        method: 'GET',
        credentials: 'include',  // 明确携带 cookie
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        console.log('[SSE] 连接已建立');
        addRecheckLog('success', 'SSE 连接已建立', new Date().toLocaleTimeString());
        
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';
        
        // 读取流数据
        function readStream() {
          reader.read().then(function(result) {
            if (result.done) {
              console.log('[SSE] 流已关闭');
              return;
            }
            
            buffer += decoder.decode(result.value, { stream: true });
            
            // 解析 SSE 消息（按换行分割，保留未完成的行到下次）
            var lines = buffer.split('\\x0a');
            buffer = lines.pop();  // 最后一个元素可能是不完整的行，保留到下次
            
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (line === '' || line.startsWith(':')) continue;  // 空行或心跳
              
              if (line.startsWith('data:')) {
                var dataStr = line.substring(5).trim();
                console.log('[SSE] 收到消息:', dataStr);
                try {
                  var data = JSON.parse(dataStr);
                  
                  // 处理日志消息
                  if (data.type === 'log') {
                    addRecheckLog(data.level, data.message, data.timestamp);
                  }
                  
                  // 如果收到 done 标志，关闭连接
                  if (data.done || data.type === 'done') {
                    reader.cancel();
                    btn.disabled = false;
                    btn.textContent = '启动重查';
                    fetch('/admin/recheck/status')
                      .then(function(r){return r.json()})
                      .then(function(finalData){
                        status.innerHTML='<span style="color:#4ade80">完成! 题库成功:'+finalData.tikuSuccess+' AI成功:'+finalData.aiSuccess+' 更新:'+finalData.updated+' 失败:'+finalData.failed+'</span>';
                        document.getElementById('wrongCount').textContent=finalData.remainingWrong||0;
                      });
                    return;
                  }
                  
                  // 更新进度显示
                  if (data.type === 'progress') {
                    console.log('[SSE] 进度:', data);
                    if (data.running) {
                      status.innerHTML='进度: '+data.processed+'/'+data.total+' | 题库成功:'+data.tikuSuccess+' AI成功:'+data.aiSuccess+' 失败:'+data.failed;
                      btn.textContent='重查中('+data.processed+'/'+data.total+')';
                    } else if (!data.running && data.total > 0) {
                      reader.cancel();
                      btn.disabled = false;
                      btn.textContent = '启动重查';
                      status.innerHTML='<span style="color:#4ade80">完成! 题库成功:'+data.tikuSuccess+' AI成功:'+data.aiSuccess+' 更新:'+data.updated+' 失败:'+data.failed+'</span>';
                      document.getElementById('wrongCount').textContent=data.remainingWrong||0;
                    }
                  }
                } catch (e) {
                  console.log('[SSE] 解析失败:', e);
                }
              }
            }
            readStream();
          }).catch(function(err) {
            console.log('[SSE] 读取错误:', err);
          });
        }
        readStream();
      })
      .catch(function(err) {
        console.log('[SSE] 连接错误:', err);
        addRecheckLog('error', 'SSE 错误: ' + err.message, new Date().toLocaleTimeString());
        btn.disabled = false;
        btn.textContent = '启动重查';
        fetch('/admin/recheck/status')
          .then(function(r){return r.json()})
          .then(function(data){
            if (data.running) {
              connectRecheckSSE();
            } else {
              status.innerHTML='<span style="color:#4ade80">完成! 题库成功:'+data.tikuSuccess+' AI成功:'+data.aiSuccess+' 更新:'+data.updated+' 失败:'+data.failed+'</span>';
              document.getElementById('wrongCount').textContent=data.remainingWrong||0;
            }
          })
          .catch(function(){
            status.innerHTML='<span style="color:#f87171">连接中断</span>';
          });
      });
    }
    
    function fetchData() {
      fetch('/admin/data?table=' + currentTable + '&search=' + encodeURIComponent(currentSearch) + '&searchColumn=' + encodeURIComponent(currentSearchColumn) + '&page=' + currentPage + '&pageSize=' + pageSize)
        .then(r => r.json())
        .then(data => {
          if (data.error) {
            alert(data.error);
            return;
          }
          renderTable(data);
        })
        .catch(e => alert('加载失败: ' + e.message));
    }
    
    function escapeHtml(text) {
      if (text === null || text === undefined) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    function renderTable(data) {
      const thead = document.getElementById('tableHead');
      const tbody = document.getElementById('tableBody');
      const pageInfo = document.getElementById('pageInfo');
      const pagination = document.getElementById('pagination');
      
      thead.innerHTML = '<tr>' + data.columns.map(col => '<th>' + escapeHtml(col) + '</th>').join('') + '<th>操作</th></tr>';
      
      if (data.rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100" style="text-align:center;color:#999;">暂无数据</td></tr>';
      } else {
        tbody.innerHTML = data.rows.map(row => {
          const cells = data.columns.map(col => {
            let val = row[col];
            if (val === null || val === undefined) val = '-';
            if (typeof val === 'number' && (col.includes('_at') || col === 'last_used' || col === 'ban_until')) {
              var d=new Date(val*1000); val=d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate()+' '+d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
            }
            return '<td>' + escapeHtml(val) + '</td>';
          }).join('');
          const rowId = row.id || row.token || row.user_id || '';
          const safeRowId = escapeHtml(rowId).replace(/'/g, '\\x27').replace(/"/g, '&quot;');
          return '<tr>' + cells + '<td><button class="edit-btn" onclick="openEditModal(\\x27' + currentTable + '\\x27,\\x27' + safeRowId + '\\x27, this)">编辑</button><button class="delete-btn" onclick="deleteRecord(\\x27' + currentTable + '\\x27,\\x27' + safeRowId + '\\x27)">删除</button></td></tr>';
        }).join('');
      }
      
      pageInfo.textContent = '共 ' + data.total + ' 条记录，当前第 ' + currentPage + ' 页';
      
      const totalPages = Math.ceil(data.total / pageSize);
      let paginationHtml = '<button onclick="goToPage(1)" ' + (currentPage === 1 ? 'disabled' : '') + '>首页</button>';
      paginationHtml += '<button onclick="goToPage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '>上一页</button>';
      paginationHtml += '<span>第 ' + currentPage + ' / ' + (totalPages || 1) + ' 页</span>';
      paginationHtml += '<button onclick="goToPage(' + (currentPage + 1) + ')" ' + (currentPage >= totalPages ? 'disabled' : '') + '>下一页</button>';
      paginationHtml += '<button onclick="goToPage(' + totalPages + ')" ' + (currentPage >= totalPages ? 'disabled' : '') + '>末页</button>';
      pagination.innerHTML = paginationHtml;
    }
    
    function deleteRecord(table, id) {
      if (!confirm('确定要删除这条记录吗？')) return;
      fetch('/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id })
      })
      .then(r => r.json())
      .then(data => {
        if (data.error) alert(data.error);
        else { alert('删除成功'); fetchData(); }
      })
      .catch(e => alert('删除失败: ' + e.message));
    }
    
    let editingTable = '';
    let editingId = '';
    
    function openEditModal(table, id, btn) {
      editingTable = table;
      editingId = id;
      
      // 获取当前行的数据
      const row = btn.closest('tr');
      const cells = row.querySelectorAll('td');
      const headerCells = document.querySelectorAll('#tableHead th');
      const columns = [];
      headerCells.forEach((th, i) => { if (i < headerCells.length - 1) columns.push(th.textContent); });
      
      // 对于 answer_cache 表，从数据库获取完整数据
      if (table === 'answer_cache') {
        fetch('/admin/data?table=answer_cache&search=' + id + '&searchColumn=id&page=1&pageSize=1')
          .then(r => r.json())
          .then(data => {
            if (data.rows && data.rows.length > 0) {
              const fullRow = data.rows[0];
              buildEditForm(columns, cells, fullRow);
            } else {
              buildEditForm(columns, cells, {});
            }
          })
          .catch(e => {
            console.error('获取完整数据失败:', e);
            buildEditForm(columns, cells, {});
          });
      } else {
        buildEditForm(columns, cells, {});
      }
    }
    
    function buildEditForm(columns, cells, fullRowData) {
      const form = document.getElementById('editForm');
      form.innerHTML = columns.map((col, i) => {
        // 优先使用完整数据，否则使用单元格数据
        let val = fullRowData[col] !== undefined ? fullRowData[col] : cells[i].textContent;
        if (val === null || val === undefined || val === '-') val = '';
        // JSON 字段格式化
        if (col === 'options' && val && typeof val === 'string' && val.startsWith('[')) {
          try {
            val = JSON.stringify(JSON.parse(val), null, 2);
          } catch (e) { console.error('JSON字段格式化失败:', e); }
        }
        
        // 计算字段不允许编辑
        if (col === 'user_type') {
          return '<div class="form-group"><label>' + col + '</label><input type="text" value="' + val + '" disabled style="background:#f5f5f5;"><small style="color:#999;">(0=付费,1=免费,不可编辑)</small></div>';
        }
        
        // 特殊字段处理
        if (col === 'is_blacklisted' || col === 'is_free_token') {
          return '<div class="form-group"><label>' + col + '</label><select name="' + col + '"><option value="0"' + (val === '0' ? ' selected' : '') + '>否 (0)</option><option value="1"' + (val === '1' ? ' selected' : '') + '>是 (1)</option></select></div>';
        }
        // answer_cache 表的 is_correct 字段
        if (col === 'is_correct') {
          return '<div class="form-group"><label>' + col + '</label><select name="' + col + '"><option value="">未验证</option><option value="1"' + (val === '1' ? ' selected' : '') + '>正确 (1)</option><option value="0"' + (val === '0' ? ' selected' : '') + '>错误 (0)</option></select></div>';
        }
        // answer_cache 表的 type 字段
        if (col === 'type') {
          return '<div class="form-group"><label>' + col + '</label><select name="' + col + '"><option value="0">单选题</option><option value="1">多选题</option><option value="2">填空题</option><option value="3">判断题</option><option value="4">简答题</option></select></div>'.replace('value="' + val + '"', 'value="' + val + '" selected');
        }
        // answer_cache 表的 answer 和 options 字段使用 textarea
        if (col === 'answer' || col === 'options') {
          // HTML 转义，防止引号截断
          const escapedVal = String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          return '<div class="form-group"><label>' + col + '</label><textarea name="' + col + '" rows="4" style="width:100%;padding:10px 14px;background:#f5f5f7;border:1px solid rgba(0,0,0,0.1);border-radius:10px;color:#1d1d1f;font-size:14px;resize:vertical;font-family:monospace;">' + escapedVal + '</textarea></div>';
        }
        if (col.includes('_at')) {
          return '<div class="form-group"><label>' + col + ' (时间戳)</label><input type="number" name="' + col + '" value="" placeholder="留空保持原值"></div>';
        }
        if (col === 'remaining_count') {
          return '<div class="form-group"><label>' + col + '</label><input type="number" name="' + col + '" value="' + val + '"></div>';
        }
        if (col === 'id' || col === 'token' || col === 'user_id') {
          return '<div class="form-group"><label>' + col + '</label><input type="text" name="' + col + '" value="' + val + '" readonly style="background:#f5f5f5;"></div>';
        }
        return '<div class="form-group"><label>' + col + '</label><input type="text" name="' + col + '" value="' + val + '"></div>';
      }).join('');
      
      document.getElementById('editModal').classList.add('active');
    }
    
    function closeEditModal() {
      document.getElementById('editModal').classList.remove('active');
    }
    
    function saveEdit() {
      const form = document.getElementById('editForm');
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => { data[key] = value; });
      
      const password = null; // session-based auth
      
      fetch('/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: editingTable, id: editingId, data })
      })
      .then(r => r.json())
      .then(result => {
        if (result.error) alert(result.error);
        else { alert('修改成功'); closeEditModal(); fetchData(); }
      })
      .catch(e => alert('修改失败: ' + e.message));
    }
    
    // 各表格可添加的字段定义
    const addableFields = {
      'tokens': ['token', 'user_id', 'remaining_count', 'is_blacklisted', 'is_free_token', 'last_ip'],
      'user_ids': ['user_id', 'user_type', 'fid', 'created_ip', 'welfare_claimed'],
      'ip_whitelist': ['ip', 'note'],
      'ip_blacklist': ['ip', 'violation_count', 'ban_until', 'is_permanent'],
      'referrals': ['referrer_id', 'referee_id', 'referrer_reward', 'referee_reward']
    };
    
    function openAddModal() {
      const table = document.getElementById('tableSelect').value;
      const fields = addableFields[table];
      
      if (!fields) {
        alert('该表不支持手动添加数据');
        return;
      }
      
      const form = document.getElementById('addForm');
      form.innerHTML = fields.map(col => {
        // 特殊字段处理
        if (col === 'is_blacklisted' || col === 'is_free_token' || col === 'is_permanent') {
          return '<div class="form-group"><label>' + col + '</label><select name="' + col + '"><option value="0">否 (0)</option><option value="1">是 (1)</option></select></div>';
        }
        if (col === 'remaining_count' || col === 'violation_count' || col === 'referrer_reward' || col === 'referee_reward') {
          return '<div class="form-group"><label>' + col + '</label><input type="number" name="' + col + '" value="" placeholder="请输入数字"></div>';
        }
        if (col === 'user_type') {
          return '<div class="form-group"><label>' + col + '</label><select name="' + col + '"><option value="0">付费用户 (0)</option><option value="1">免费用户 (1)</option></select></div>';
        }
        if (col === 'ban_until') {
          return '<div class="form-group"><label>' + col + ' (时间戳)</label><input type="number" name="' + col + '" value="" placeholder="留空则永久"></div>';
        }
        return '<div class="form-group"><label>' + col + '</label><input type="text" name="' + col + '" value="" placeholder="请输入' + col + '"></div>';
      }).join('');
      
      document.getElementById('addModal').classList.add('active');
    }
    
    function closeAddModal() {
      document.getElementById('addModal').classList.remove('active');
    }
    
    function saveAdd() {
      const form = document.getElementById('addForm');
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => { 
        if (value !== '') data[key] = value;
      });
      
      const table = document.getElementById('tableSelect').value;
      
      fetch('/admin/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, data })
      })
      .then(r => r.json())
      .then(result => {
        if (result.error) alert(result.error);
        else { alert('添加成功'); closeAddModal(); fetchData(); }
      })
      .catch(e => alert('添加失败: ' + e.message));
    }

    // 页面加载时自动检查是否有正在运行的任务，恢复日志面板
    (function() {
      // 检查重查任务
      fetch('/admin/recheck/status', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.running) {
            var btn = document.getElementById('recheckBtn');
            var status = document.getElementById('recheckStatus');
            btn.disabled = true;
            btn.textContent = '重查中(' + d.processed + '/' + d.total + ')';
            status.innerHTML = '进度: ' + d.processed + '/' + d.total + ' | 题库成功:' + d.tikuSuccess + ' AI成功:' + d.aiSuccess + ' 失败:' + d.failed;
            document.getElementById('recheckLogPanel').style.display = 'block';
            connectRecheckSSE();
          }
        }).catch(function(err){ console.error('获取重查状态失败:', err); });

      // 检查查重任务
      fetch('/admin/dedup/status', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.running) {
            var btn = document.getElementById('dedupBtn');
            var status = document.getElementById('recheckStatus');
            btn.disabled = true;
            btn.textContent = '查重中(' + d.processed + '/' + d.totalGroups + ')';
            status.innerHTML = '查重进度: ' + d.processed + '/' + d.totalGroups + '组 | 已删除:' + d.removed + '条';
            document.getElementById('recheckLogPanel').style.display = 'block';
            connectDedupSSE();
          }
        }).catch(function(err){ console.error('获取查重状态失败:', err); });
    })();

  </script>
</body>
</html>`;
}


// 导出管理面板函数
module.exports = {
  generateLoginHTML,
  generateAdminHTML
};
