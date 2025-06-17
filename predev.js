import { execSync } from 'child_process';
import fs from 'fs';

function installIfNeeded() {
  // 安裝前端 root 專案依賴
  if (!fs.existsSync('./node_modules')) {
    console.log('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // 安裝後端依賴
  const backendPath = './src/HaplotypeNetwork/gene-compare-backend';
  if (!fs.existsSync(`${backendPath}/node_modules`)) {
    console.log('Installing backend dependencies...');
    execSync(`cd ${backendPath} && npm install`, { stdio: 'inherit' });
  }
}

installIfNeeded();
