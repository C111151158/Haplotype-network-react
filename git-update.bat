@echo off
echo ===== Git Auto Update Start =====
cd /d %~dp0

git add .
set /p msg=請輸入 commit 訊息（預設為 "update"）： 
if "%msg%"=="" set msg=update

git commit -m "%msg%"
git pull origin main --rebase
git push origin main

echo ===== Git Auto Update Complete =====
pause
