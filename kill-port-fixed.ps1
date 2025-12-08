param(
    [Parameter(Mandatory=$true)]
    [int[]]$Port
)

foreach ($p in $Port) {
    Write-Host "Finding process using port $p..." -ForegroundColor Yellow

    $process = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess

    if ($process) {
        $processInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
        if ($processInfo) {
            Write-Host "Found process: $($processInfo.ProcessName) (PID: $process) on port $p" -ForegroundColor Cyan
            Write-Host "Killing process..." -ForegroundColor Yellow
            Stop-Process -Id $process -Force
            Write-Host "Process killed successfully!" -ForegroundColor Green
        } else {
            Write-Host "Process on port $p not found or already terminated." -ForegroundColor Yellow
        }
    } else {
        Write-Host "No process found using port $p." -ForegroundColor Green
    }
}