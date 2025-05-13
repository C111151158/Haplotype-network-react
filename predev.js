// predev.js
import { execSync } from 'child_process';
import fs from 'fs';

function installIfNeeded() {
  // 檢查根目錄下的 node_modules 是否存在，並安裝依賴
  if (!fs.existsSync('./node_modules')) {
    console.log('Installing root dependencies...');
    execSync('npm install concurrently react-window --save-dev', { stdio: 'inherit' });
  }

  // 檢查 gene-compare-backend 目錄下的 node_modules 是否存在，並安裝依賴
  if (!fs.existsSync('./gene-compare-backend/node_modules')) {
    console.log('Installing backend dependencies...');
    execSync('cd gene-compare-backend && npm install express', { stdio: 'inherit' });
  }
}

installIfNeeded();
