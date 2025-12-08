# Set strict mode
Set-StrictMode -Version Latest

# Stop on first error
$ErrorActionPreference = "Stop"

# Get the directory of the current script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- Step 1: Kill processes on required ports ---
Write-Host "Clearing ports 3100 (backend) and 5173 (frontend)..." -ForegroundColor Yellow
$KillPortScript = Join-Path -Path $ScriptDir -ChildPath "kill-port-fixed.ps1"
# Suppress verbose output from the kill-port script unless there's an error
. $KillPortScript -Port 3100, 5173

Write-Host "Ports cleared successfully." -ForegroundColor Green

# --- Step 2: Start the backend server ---
$BackendDir = Join-Path -Path $ScriptDir -ChildPath "backend"
if (-not (Test-Path $BackendDir)) {
    Write-Host "Error: Backend directory not found at $BackendDir" -ForegroundColor Red
    exit 1
}

Write-Host "Starting backend server on port 3100..." -ForegroundColor Cyan
Push-Location -Path $BackendDir
# Start the backend as a background job
Start-Job -Name "BackendServer" -ScriptBlock {
    param($path)
    cd $path
    npm start
} -ArgumentList $BackendDir
Pop-Location

# Wait a moment for the backend to initialize
Write-Host "Waiting for backend to initialize..."
Start-Sleep -Seconds 5

# --- Step 3: Start the frontend server ---
Write-Host "Starting frontend dev server on port 5173..." -ForegroundColor Cyan
# Start the frontend as a background job
Start-Job -Name "FrontendServer" -ScriptBlock {
    param($path)
    cd $path
    npm run dev
} -ArgumentList $ScriptDir


Write-Host ""
Write-Host "✅ Development environment started successfully!" -ForegroundColor Green
Write-Host "Backend server (port 3100) and Frontend server (port 5173) are running in background jobs."
Write-Host "You can view job status with 'Get-Job' and stop them with 'Stop-Job -Name BackendServer, FrontendServer'"
