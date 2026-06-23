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

module.exports = { generateLoginHTML };
