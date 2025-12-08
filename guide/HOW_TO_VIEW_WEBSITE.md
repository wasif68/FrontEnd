# How to View Your Website

## ❌ DON'T DO THIS

- **Don't** double-click `index.html` in the root folder
- **Don't** open it directly in browser (file:// protocol)
- This won't work because React apps need a server

## ✅ DO THIS INSTEAD

### Method 1: Use Built Version (Recommended for "Go Live")

1. **Build the project first:**

   ```bash
   npm run build
   ```

2. **Then use one of these:**

   **Option A: Use Live Server (Now Fixed!)**

   - Right-click on `dist/index.html`
   - Select "Open with Live Server"
   - Website will open at `http://127.0.0.1:5500` or similar (port 5506 in your case)
   - ✅ CSV file path is now fixed to work with Live Server

   **Option B: Use Vite Preview**

   ```bash
   npm run preview
   ```

   - Website will open at `http://localhost:4173`

### Method 2: Development Mode (For Testing While Coding)

```bash
npm run dev
```

- Website will open at `http://localhost:5173`
- Automatically reloads when you make changes

## Why This Is Needed

1. **React apps need a server** - They can't run from `file://` protocol
2. **CSV file needs HTTP** - The CSV file at `/data/d.csv` must be fetched via HTTP
3. **Module imports** - JavaScript modules require a server to work properly

## Quick Checklist

- ✅ Use `dist/index.html` (NOT root `index.html`)
- ✅ Use a server (Live Server, Vite Preview, or Dev Server)
- ✅ CSV file is at `dist/data/d.csv` (automatically copied during build)

## Troubleshooting

**If you see blank page:**

- Make sure you're using `dist/index.html`, not root `index.html`
- Make sure you're using a server (not opening file directly)
- Check browser console for errors (F12)

**If CSV doesn't load:**

- Make sure `dist/data/d.csv` exists
- Make sure you're using HTTP (not file://)
- Check Network tab in browser DevTools (F12)
