@echo off
REM Start Both Frontend and Backend Servers
REM This batch file starts both servers in separate windows

echo ========================================
echo   Starting CareerAI Development Servers
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Starting Backend Server (port 3001)...
start "Backend Server (Port 3001)" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 2 /nobreak >nul

echo [INFO] Starting Frontend Server (port 5173)...
start "Frontend Server (Port 5173)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo   Servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:3001/api
echo Frontend: http://localhost:5173
echo.
echo Two new command windows will open:
echo   - One for Backend (port 3001)
echo   - One for Frontend (port 5173)
echo.
echo To stop the servers, close their respective windows
echo or press Ctrl+C in each window.
echo.
pause

