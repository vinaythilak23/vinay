Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "       Starting ResQNow Full-Stack App        " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = 'C:\Program Files\nodejs;' + `$env:PATH; cd '$PSScriptRoot\backend'; node src/server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = 'C:\Program Files\nodejs;' + `$env:PATH; cd '$PSScriptRoot\frontend'; npx.cmd vite --open"

Write-Host "Both backend (http://localhost:5000) and frontend (http://localhost:5173) are running!" -ForegroundColor Green
