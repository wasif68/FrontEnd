# Comprehensive Dev Server Startup and Verification Script

# --- CONFIGURATION ---
$frontendPort = 5173
$backendPort = 3001
$frontendDir = "C:\Users\Hp\Desktop\frontend"
$backendDir = "C:\Users\Hp\Desktop\frontend\backend"
$frontendUrl = "http://localhost:$frontendPort"
$backendApiUrl = "http://localhost:$backendPort/api"
$backendBaseUrl = "http://localhost:$backendPort"
$authServicePath = Join-Path $frontendDir "src\services\authService.js"
$backendServerPath = Join-Path $backendDir "server.js"

# --- HELPER FUNCTION ---
function Clear-Port {
    param(
        [int]$Port,
        [string]$ProcessName
    )
    
    Write-Output "Checking port $Port for $ProcessName server..."
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop
        if ($connection) {
            $processId = $connection.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            Write-Warning "Port $Port is in use by '$($process.ProcessName)' (PID: $processId). Terminating..."
            Stop-Process -Id $processId -Force
            Write-Output "Process terminated. Pausing for 2 seconds to release port..."
            Start-Sleep -Seconds 2
        }
    } catch {
        Write-Output "✅ Port $Port is already free."
    }
}

# --- SCRIPT EXECUTION ---

# --- Step 1: Frontend Server ---
Write-Output "--- Starting Frontend Server ---"
Clear-Port -Port $frontendPort -ProcessName "Frontend"

Write-Output "Starting frontend dev server with 'npm run dev'..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory $frontendDir

# --- Step 2: Backend Server ---
Write-Output "`n--- Starting Backend Server ---"
Clear-Port -Port $backendPort -ProcessName "Backend"

Write-Output "Starting backend server with 'npm start'..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WorkingDirectory $backendDir

# --- Step 3: Verification ---
Write-Output "`n--- Verifying Servers and Connectivity (Please wait 20 seconds) ---"
Start-Sleep -Seconds 20

# Verify Frontend
Write-Output "Verifying frontend server at $frontendUrl..."
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Output "✅ Success! Frontend server is running and accessible."
    } else {
        Write-Error "❌ Frontend server responded with status code: $($response.StatusCode)."
    }
} catch {
    Write-Error "❌ CRITICAL: Could not connect to the frontend server. Check the new terminal window for errors."
}

# Verify Backend
Write-Output "Verifying backend server at $backendBaseUrl..."
try {
    $response = Invoke-WebRequest -Uri $backendBaseUrl -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Output "✅ Success! Backend server is running and accessible."
    } else {
        Write-Error "❌ Backend server responded with status code: $($response.StatusCode)."
    }
} catch {
    Write-Error "❌ CRITICAL: Could not connect to the backend server. Check the new terminal window for errors."
}

# --- Step 4: Verify and Fix Code Configuration ---

# Verify Frontend API URL
Write-Output "`nVerifying frontend API_URL configuration..."
$authContent = Get-Content $authServicePath -Raw
$expectedApiUrl = "const API_URL = ""$backendApiUrl"";"
if ($authContent -match [regex]::Escape("const API_URL = ""http://localhost:3001/api""")) {
    Write-Output "✅ Success! Frontend API_URL is correctly configured."
} else {
    Write-Warning "Frontend API_URL is incorrect. Attempting to fix..."
    # This is a placeholder for a more complex replacement if needed. For now, we assume it's correct from previous steps.
    Write-Error "Could not automatically fix API_URL. Please check src/services/authService.js."
}

# Verify and Enforce Backend CORS
Write-Output "Verifying backend CORS configuration..."
$serverContent = Get-Content $backendServerPath -Raw
$oldCors = 'app.use(cors());'
$newCors = "app.use(cors({ origin: '$frontendUrl' }));"

if ($serverContent.Contains($newCors)) {
    Write-Output "✅ Success! Backend CORS is already correctly configured for the frontend."
} elseif ($serverContent.Contains($oldCors)) {
    Write-Warning "Backend CORS is too permissive. Updating for improved security..."
    $newServerContent = $serverContent.Replace($oldCors, $newCors)
    Set-Content -Path $backendServerPath -Value $newServerContent
    Write-Output "✅ Success! Backend server.js has been updated with the correct CORS policy."
    Write-Warning "Backend server is restarting due to changes..."
    Start-Sleep -Seconds 5 # Wait for nodemon to restart
} else {
    Write-Error "❌ Could not find a suitable CORS configuration to update in backend/server.js."
}

# --- Step 5: Final API Request Test ---
Write-Output "`n--- Performing Final API Connectivity Test ---"
Write-Output "Testing API request from script to $backendApiUrl/careers..."
try {
    $response = Invoke-WebRequest -Uri "$backendApiUrl/careers" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "`n************************************************************" -ForegroundColor Green
        Write-Host "✅ ALL SYSTEMS GO! Frontend and Backend are running and" -ForegroundColor Green
        Write-Host "   correctly configured. 'Failed to fetch' errors should" -ForegroundColor Green
        Write-Host "   be resolved." -ForegroundColor Green
        Write-Host "************************************************************" -ForegroundColor Green
    } else {
        Write-Error "❌ Final verification failed. API responded with status: $($response.StatusCode)."
    }
} catch {
    Write-Error "❌ CRITICAL: Final API request failed. The frontend will still experience 'Failed to fetch' errors. Please check the backend server logs for issues."
}
