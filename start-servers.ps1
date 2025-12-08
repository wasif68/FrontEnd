# Start Both Frontend and Backend Servers
# This script starts both the frontend (Vite) and backend (Express) servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting CareerAI Development Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Check if ports are already in use
if (Test-Port -Port 3001) {
    Write-Host "⚠ Port 3001 (backend) is already in use!" -ForegroundColor Yellow
    Write-Host "  The backend server might already be running." -ForegroundColor Yellow
    Write-Host ""
}

if (Test-Port -Port 5173) {
    Write-Host "⚠ Port 5173 (frontend) is already in use!" -ForegroundColor Yellow
    Write-Host "  The frontend server might already be running." -ForegroundColor Yellow
    Write-Host ""
}

# Start Backend Server
Write-Host "Starting Backend Server (port 3001)..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendPath) {
    # Check if node_modules exists
    $nodeModulesPath = Join-Path $backendPath "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Host "  Installing backend dependencies..." -ForegroundColor Yellow
        Set-Location $backendPath
        npm install
        Set-Location $PSScriptRoot
    }
    
    # Start backend in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server (Port 3001)' -ForegroundColor Cyan; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; npm start"
    Write-Host "✓ Backend server starting in new window..." -ForegroundColor Green
} else {
    Write-Host "✗ Backend folder not found!" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "Starting Frontend Server (port 5173)..." -ForegroundColor Yellow
if (Test-Path $PSScriptRoot) {
    # Check if node_modules exists
    $nodeModulesPath = Join-Path $PSScriptRoot "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Host "  Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Start frontend in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Frontend Server (Port 5173)' -ForegroundColor Cyan; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; npm run dev"
    Write-Host "✓ Frontend server starting in new window..." -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servers are starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3001/api" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Two new PowerShell windows will open:" -ForegroundColor Yellow
Write-Host "  - One for Backend (port 3001)" -ForegroundColor White
Write-Host "  - One for Frontend (port 5173)" -ForegroundColor White
Write-Host ""
Write-Host "To stop the servers, close their respective windows" -ForegroundColor Yellow
Write-Host "or press Ctrl+C in each window." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

