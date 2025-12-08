# How to Start the Development Servers

## Quick Start (Easiest Method)

### Option 1: Double-click the batch file (Windows)
Simply double-click `start-servers.bat` in the project root folder.

### Option 2: Run PowerShell script
Right-click `start-servers.ps1` and select "Run with PowerShell", or run:
```powershell
.\start-servers.ps1
```

Both methods will:
- ✅ Start the backend server on port 3001
- ✅ Start the frontend server on port 5173
- ✅ Open each server in a separate window
- ✅ Install dependencies if needed

---

## Manual Start (If scripts don't work)

### Terminal 1 - Backend:
```powershell
cd backend
npm install  # Only needed first time
npm start
```

### Terminal 2 - Frontend:
```powershell
npm install  # Only needed first time
npm run dev
```

---

## Verify Servers Are Running

1. **Backend**: Open http://localhost:3001/api
   - Should see: `Hello from the CareerAI backend!`

2. **Frontend**: Open http://localhost:5173
   - Should see your CareerAI application

---

## Troubleshooting

### Port Already in Use
If you see "port already in use" errors:
- **Port 3001 (Backend)**: Kill the process or change port in `backend/server.js`
- **Port 5173 (Frontend)**: Kill the process or Vite will auto-use next available port

### Dependencies Not Installed
Run `npm install` in both:
- Root folder (for frontend)
- `backend` folder (for backend)

### Backend Won't Start
1. Check if `backend/node_modules` exists
2. Run `npm install` in the `backend` folder
3. Check `backend/server.js` for syntax errors

---

## Stopping the Servers

- **Windows**: Close the command windows or press `Ctrl+C` in each
- **PowerShell**: Press `Ctrl+C` in each window

---

## What Each Server Does

- **Backend (port 3001)**: 
  - Handles API requests
  - Manages database (SQLite)
  - User authentication
  - Job/Course actions

- **Frontend (port 5173)**:
  - React application
  - User interface
  - Makes API calls to backend

Both must be running for the app to work properly!

