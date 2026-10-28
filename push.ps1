$env:PATH = "$env:LOCALAPPDATA\Programs\Git\cmd;$env:LOCALAPPDATA\Programs\bin;$env:PATH"

Write-Host "[1/2] Checking GitHub login..." -ForegroundColor Cyan
& gh auth status *>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Opening browser to log into GitHub..." -ForegroundColor Yellow
    & gh auth login --web -h github.com
}

Write-Host "[2/2] Pushing project to GitHub..." -ForegroundColor Cyan
& git push -u origin main
Write-Host "Done!" -ForegroundColor Green
