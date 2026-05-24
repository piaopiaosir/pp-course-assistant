#!/bin/bash
sed -i 's/\r$//' "$0"
set -e

echo "====== Step 1: Unzip app.zip ======"
cd /root/piaopiao/guanwnag
unzip -o app.zip
echo "Unzip done"

echo "====== Step 2: Build frontend ======"
cd /root/piaopiao/guanwnag/app
rm -rf node_modules package-lock.json
npm install
find node_modules/.bin -type f -exec chmod +x {} \;
npm run build
echo "Build done"

echo "====== Step 3: Copy to site dir ======"
rm -rf /opt/1panel/www/sites/wk.piao.one/index/*
cp -r dist/* /opt/1panel/www/sites/wk.piao.one/index/
echo "Copy done"

echo "====== Restart backend ======"
pm2 restart pay-proxy 2>/dev/null || echo "pay-proxy not running, skip"

echo "All done! Visit http://wk.piao.one"
