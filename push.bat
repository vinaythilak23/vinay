@echo off
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%LOCALAPPDATA%\Programs\bin;%PATH%"

echo [1/2] Checking GitHub login...
call gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo Opening browser to login to GitHub...
    call gh auth login --web -h github.com
)

echo [2/2] Pushing project to GitHub...
git push -u origin main
echo Done!
pause
