# Kill process using a specific port
param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Finding process using port $Port..." -ForegroundColor Yellow

$process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess

if ($process) {
    $processInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
    if ($processInfo) {
        Write-Host "Found process: $($processInfo.ProcessName) (PID: $process)" -ForegroundColor Cyan
        Write-Host "Killing process..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force
        Write-Host "✓ Process killed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Process not found or already terminated." -ForegroundColor Yellow
    }
} else {
    Write-Host "No process found using port $Port." -ForegroundColor Green
}
