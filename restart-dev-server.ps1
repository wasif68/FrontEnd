# Step 1: Define the port number to check
$port = 5173

# Find the process using the specified port
Write-Output "Checking for any process using port $port..."
$processId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess

if ($processId) {
    $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
    Write-Output "Port $port is currently in use by process '$processName' (PID: $processId)."

    # Step 2: Kill the process
    Write-Output "Attempting to stop the process..."
    Stop-Process -Id $processId -Force
    Write-Output "Process with PID $processId has been terminated."
    
    # Add a small delay to allow the OS to release the port completely
    Start-Sleep -Seconds 2
} else {
    Write-Output "Port $port is free. No process to stop."
}

# Step 3: Restart the frontend dev server in the background
Write-Output "Starting the frontend dev server with 'npm run dev'..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "C:\Users\Hp\Desktop\frontend"

# Step 4: Wait and verify that the server has started
Write-Output "Waiting 10 seconds for the server to initialize..."
Start-Sleep -Seconds 10

Write-Output "Verifying if the frontend server is now running on http://localhost:$port..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Output "✅ Success! The frontend dev server is running and accessible."
    } else {
        Write-Warning "The server responded with status code: $($response.StatusCode)."
    }
} catch {
    Write-Error "❌ Error: Could not connect to the frontend server. Check the new terminal window for compilation errors."
}

# Step 5: Confirm backend connectivity
$backendPort = 3001
Write-Output "Verifying connection to the backend server on http://localhost:$backendPort..."
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:$backendPort/api/careers" -UseBasicParsing
    if ($backendResponse.StatusCode -eq 200) {
        Write-Output "✅ Success! The backend is running. API requests from the frontend should now work."
    } else {
        Write-Warning "The backend responded with status code: $($backendResponse.StatusCode)."
    }
} catch {
    Write-Warning "⚠️ Warning: Could not connect to the backend server. If it's not running, 'Failed to fetch' errors will still occur in the app."
}
