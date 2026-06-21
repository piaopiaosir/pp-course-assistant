/**
 * 第二台服务器 - 启动脚本
 * 1. 从主服务器下载最新代码和环境变量（IP白名单保护）
 * 2. 保存到本地
 * 3. 启动服务
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ==================== 配置 ====================
const MAIN_SERVER = process.env.MAIN_SERVER || '122.152.249.109';
const MAIN_PORT = process.env.MAIN_PORT || 3000;
const LOCAL_PORT = process.env.PORT || 3000;
const SYNC_TRIGGER_PORT = 3001;  // 同步触发服务端口
const SYNC_INTERVAL = process.env.SYNC_INTERVAL || 3600000; // 默认1小时同步一次
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-secret-key-2024';

console.log('========================================');
console.log('🔄 第二台服务器启动中...');
console.log(`📍 主服务器: ${MAIN_SERVER}:${MAIN_PORT}`);
console.log(`🔒 安全: IP白名单保护`);
console.log('========================================');

// ==================== 同步代码和环境变量 ====================
async function syncCode() {
  console.log('\n📥 开始同步代码和环境变量...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: MAIN_SERVER,
      port: MAIN_PORT,
      path: `/internal/code?key=${encodeURIComponent(INTERNAL_API_KEY)}`,
      method: 'GET',
      headers: {
        'X-Internal-Key': INTERNAL_API_KEY
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.code !== 200) {
            console.error('❌ 同步失败:', result.msg);
            reject(new Error(result.msg));
            return;
          }
          
          const files = result.data.files;
          const envFileContent = result.data.envFile || '';
          console.log(`📦 收到 ${Object.keys(files).length} 个文件`);
          console.log(`📄 收到 .env 文件`);
          
          // 创建 src 目录
          const srcDir = path.join(__dirname, 'src');
          if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
          }
          
          // 保存代码文件
          for (const [filename, content] of Object.entries(files)) {
            let filePath;
            if (filename === 'index.js' || filename === 'package.json') {
              filePath = path.join(__dirname, filename);
            } else if (filename.includes('/')) {
              const subDir = path.join(srcDir, path.dirname(filename));
              if (!fs.existsSync(subDir)) {
                fs.mkdirSync(subDir, { recursive: true });
              }
              filePath = path.join(srcDir, filename);
            } else {
              filePath = path.join(srcDir, filename);
            }
            
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log(`  ✅ ${filename}`);
          }
          
          // 写入 .env 文件前，如果设置了 DB_SERVER 环境变量，则自动修改 DB_HOST
          let modifiedEnv = envFileContent;
          const DB_SERVER = process.env.DB_SERVER;
          if (DB_SERVER) {
            modifiedEnv = modifiedEnv.replace(
              /^DB_HOST=.*$/m,
              `DB_HOST=${DB_SERVER}`
            );
            console.log(`  🔧 已自动设置 DB_HOST=${DB_SERVER}`);
          } else {
            console.log(`  ℹ️ 未设置 DB_SERVER，保留原始 DB_HOST`);
          }
          // 第二台服务器跳过题库密钥刷新
          if (!modifiedEnv.includes('SKIP_KEY_REFRESH=')) {
            modifiedEnv += '\nSKIP_KEY_REFRESH=true\n';
          } else {
            modifiedEnv = modifiedEnv.replace(/^SKIP_KEY_REFRESH=.*$/m, 'SKIP_KEY_REFRESH=true');
          }
          console.log(`  🔧 已设置 SKIP_KEY_REFRESH=true`);

          // 设置服务器ID为server2
          if (!modifiedEnv.includes('SERVER_ID=')) {
            modifiedEnv += '\nSERVER_ID=server2\n';
          } else {
            modifiedEnv = modifiedEnv.replace(/^SERVER_ID=.*$/m, 'SERVER_ID=server2');
          }
          console.log(`  🔧 已设置 SERVER_ID=server2`);
          fs.writeFileSync(path.join(__dirname, '.env'), modifiedEnv, 'utf-8');
          console.log('  ✅ .env');
          
          // 打印 .env 文件内容（调试用）
          console.log('━━━━ .env 文件内容预览 ━━━━');
          const envLines = envFileContent.split('\n');
          envLines.forEach((line, i) => {
            if (line.includes('KEY') || line.includes('TOKEN') || line.includes('SECRET')) {
              const [key, value] = line.split('=');
              console.log(`  ${key}=${value ? '***已配置***' : '未配置'}`);
            }
          });
          console.log('━━━━━━━━━━━━━━━━━━━━━━━');
          
          console.log('✅ 同步完成！');
          resolve(true);
        } catch (e) {
          console.error('❌ 解析响应失败:', e.message);
          reject(e);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ 请求失败:', e.message);
      reject(e);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    req.end();
  });
}

// ==================== 安装依赖 ====================
async function installDependencies() {
  console.log('\n📦 安装依赖...');
  
  // 必要的依赖列表
  const requiredPackages = [
    'hono',
    'mysql2',
    'dotenv'
  ];
  
  return new Promise((resolve, reject) => {
    const npm = spawn('npm', ['install', ...requiredPackages], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 依赖安装完成');
        resolve(true);
      } else {
        console.error('❌ 依赖安装失败');
        reject(new Error('npm install failed'));
      }
    });
    
    npm.on('error', (e) => {
      console.error('❌ npm执行失败:', e.message);
      reject(e);
    });
  });
}

// ==================== 启动服务 ====================
let serverProcess = null;

async function killPortProcess(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`fuser -k ${port}/tcp 2>/dev/null || true`, () => {
      resolve();
    });
  });
}

async function startServer() {
  console.log('\n🚀 启动服务...');
  
  // 停止旧进程
  if (serverProcess) {
    console.log('⏹️ 停止旧服务...');
    serverProcess.kill('SIGTERM');
    await new Promise(r => setTimeout(r, 1000));
    serverProcess.kill('SIGKILL');
    await new Promise(r => setTimeout(r, 500));
  }
  
  // 强制释放端口
  console.log('🔧 检查端口占用...');
  await killPortProcess(LOCAL_PORT);
  await new Promise(r => setTimeout(r, 500));
  
  // 启动新进程
  serverProcess = spawn('node', ['index.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: LOCAL_PORT
    }
  });
  
  serverProcess.on('error', (e) => {
    console.error('❌ 服务启动失败:', e.message);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`⚠️ 服务异常退出，代码: ${code}`);
    }
  });
  
  console.log(`✅ 服务已启动，端口: ${LOCAL_PORT}`);
}

// ==================== PM2 重启服务 ====================
async function pm2Restart() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    console.log('\n🔄 执行 pm2 restart all...');
    exec('pm2 restart all', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ pm2 restart 失败:', error.message);
        startServer().then(resolve);
      } else {
        console.log('✅ pm2 restart 成功');
        console.log(stdout);
        resolve(true);
      }
    });
  });
}

// ==================== 主流程 ====================
async function main() {
  try {
    // 检查是否是同步触发的重启（通过标志文件判断）
    const skipSyncFlag = path.join(__dirname, '.skip_sync');
    if (fs.existsSync(skipSyncFlag)) {
      console.log('🔄 检测到同步触发的重启，跳过首次同步');
      fs.unlinkSync(skipSyncFlag);
    } else {
      // 首次同步
      await syncCode();
    }
    
    // 安装依赖
    await installDependencies();
    
    // 同步完成后重新读取 .env 中的 SYNC_INTERVAL
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^SYNC_INTERVAL=(\d+)/m);
      if (match) {
        process.env.SYNC_INTERVAL = match[1];
      }
    }
    const FINAL_SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || '3600000', 10);
    
    // 启动服务
    await startServer();
    
    // 启动同步触发服务（监听服务器1的通知）
    const triggerServer = http.createServer(async (req, res) => {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      if (req.method === 'POST' && urlObj.pathname === '/sync') {
        // 验证内部API密钥
        const authKey = req.headers['x-internal-key'] || urlObj.searchParams.get('key');
        if (authKey !== INTERNAL_API_KEY) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ code: 403, msg: '鉴权失败' }));
          console.warn('⚠️ 同步请求鉴权失败');
          return;
        }
        console.log('\n🔔 收到同步通知，开始同步...');
        try {
          await syncCode();
          await installDependencies();
          fs.writeFileSync(path.join(__dirname, '.skip_sync'), '1');
          await pm2Restart();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ code: 200, msg: '同步成功，pm2已重启' }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ code: 500, msg: e.message }));
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    
    triggerServer.listen(SYNC_TRIGGER_PORT, () => {
      console.log(`🔔 同步触发服务已启动，端口: ${SYNC_TRIGGER_PORT}`);
      console.log(`   POST http://本服务器IP:${SYNC_TRIGGER_PORT}/sync 触发同步`);
    });
    
    // 定时同步
    if (FINAL_SYNC_INTERVAL > 0) {
      console.log(`\n⏰ 定时同步已启用，间隔: ${FINAL_SYNC_INTERVAL / 60000} 分钟`);
      setInterval(async () => {
        try {
          console.log('\n🔄 定时同步检查...');
          await syncCode();
          await installDependencies();
          await pm2Restart();
        } catch (e) {
          console.error('定时同步失败:', e.message);
        }
      }, FINAL_SYNC_INTERVAL);
    } else {
      console.log(`\n⏰ 定时同步已禁用 (SYNC_INTERVAL=${FINAL_SYNC_INTERVAL})`);
    }
    
  } catch (e) {
    console.error('❌ 启动失败:', e.message);
    console.log('\n💡 请检查:');
    console.log('  1. 主服务器是否运行');
    console.log('  2. 本服务器IP是否在白名单中');
    console.log('  3. 网络是否连通');
    console.log('  4. MySQL 数据库是否可连接');
    process.exit(1);
  }
}

main();
