# 🚀 Quick Start - Run Both Servers in ONE Terminal

## ✅ Easiest Way (Single Command)

Just run this **one command** in your terminal:

```bash
npm run dev:all
```

This will start **both** servers in the same terminal:
- ✅ Frontend on **port 5173** (fixed, won't change)
- ✅ Backend on **port 3001**

---

## Why Different Ports?

**You CANNOT use the same port for both** because:

1. **Frontend (port 5173)**: 
   - Serves your React app (HTML, CSS, JavaScript)
   - Handles routing, UI, user interactions
   - This is what users see in the browser

2. **Backend (port 3001)**:
   - Serves API endpoints (data, database)
   - Handles authentication, saving data
   - Frontend makes requests to this port

They are **different services** doing **different jobs** - like having two different doors to your house!

---

## Alternative Commands

### Run Frontend Only:
```bash
npm run dev
```

### Run Backend Only:
```bash
npm run dev:backend
```

### Run Both (Same Terminal):
```bash
npm run dev:all
```

---

## What You'll See

When you run `npm run dev:all`, you'll see output from both servers:

```
[0] VITE v7.x.x  ready in 500 ms
[0] ➜  Local:   http://localhost:5173/
[1] Connected to the SQLite database.
[1] Server is running on http://localhost:3001
```

- `[0]` = Frontend server
- `[1]` = Backend server

---

## Ports Are Now Fixed! ✅

- **Frontend**: Always **5173** (no more changing!)
- **Backend**: Always **3001**

If port 5173 is busy, Vite will show an error instead of switching ports automatically.

---

## To Stop Both Servers

Press `Ctrl+C` once - it will stop both servers.

---

## Troubleshooting

### Port Already in Use?
If you see "port already in use":
1. Close other terminals running the servers
2. Or kill the process:
   ```powershell
   # Find process using port 5173
   netstat -ano | findstr :5173
   # Kill it (replace PID with actual number)
   taskkill /PID <PID> /F
   ```

### Backend Not Starting?
Make sure you've installed backend dependencies:
```bash
cd backend
npm install
```

---

## Summary

✅ **One command**: `npm run dev:all`  
✅ **Fixed ports**: 5173 (frontend) and 3001 (backend)  
✅ **Same terminal**: Both servers run together  
✅ **Easy to stop**: Just press `Ctrl+C`

That's it! 🎉

