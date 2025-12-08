# Live Server Setup Guide

## ✅ Live Server Now Works!

I've fixed the CSV file path so Live Server works perfectly with your React app.

## How to Use Live Server

### Step 1: Build Your Project
```bash
npm run build
```

### Step 2: Open with Live Server
1. Navigate to the `dist` folder in VS Code
2. Right-click on `dist/index.html`
3. Select **"Open with Live Server"**
4. Your website will open in the browser (usually on port 5500, 5501, etc.)

### Step 3: Verify It Works
- You should see the login page
- CSV file should load correctly
- All features should work

## What I Fixed

✅ **CSV Path Issue**: Updated the CSV file path to work with both:
- Vite Preview (uses `/data/d.csv`)
- Live Server (uses `./data/d.csv`)

The code now tries both paths automatically, so it works with either server!

## Troubleshooting

**If Live Server still doesn't work:**

1. **Make sure you're opening `dist/index.html`** (NOT root `index.html`)
2. **Check that `dist/data/d.csv` exists** - it should be there after build
3. **Try restarting Live Server** - Right-click → "Stop Live Server", then start again
4. **Check browser console** (F12) for any errors

## Both Options Work Now!

- ✅ **Vite Preview**: `npm run preview` → `http://localhost:4173`
- ✅ **Live Server**: Right-click `dist/index.html` → "Open with Live Server" → `http://127.0.0.1:5506` (or similar)

Use whichever you prefer! Both work perfectly now.

