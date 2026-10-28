@echo off
echo ==============================================
echo        Starting ResQNow Full-Stack App
echo ==============================================

set "PATH=C:\Program Files\nodejs;%PATH%"

echo Starting Backend API at http://localhost:5000...
start "ResQNow Backend" cmd /k "cd backend && node src/server.js"

echo Starting Frontend UI at http://localhost:5173...
start "ResQNow Frontend" cmd /k "cd frontend && npx vite --open"

echo.
echo Both services have been launched in separate windows!
echo Open http://localhost:5173 in your browser.
