# 🚀 How to Go Live with Your Vite + React Project

## The Problem

VS Code's "Go Live" extension doesn't work with Vite projects because it only serves static files and can't process JSX or Vite's module system.

## ✅ Solutions

### Option 1: Vite Preview (Recommended - Easiest)

**Steps:**

1. Build your project:

   ```bash
   npm run build
   ```

2. Preview the built version:

   ```bash
   npm run preview
   ```

   This will start a local server (usually at `http://localhost:4173`)

3. **For network access** (to test on phone/other devices):
   ```bash
   npm run serve
   ```
   This makes your app accessible on your local network.

---

### Option 2: Use Live Server with Built Files

**Steps:**

1. Build your project:

   ```bash
   npm run build
   ```

2. In VS Code:

   - Navigate to the `dist` folder
   - Right-click on `dist/index.html`
   - Select **"Open with Live Server"**

   ⚠️ **Important:** Always use `dist/index.html`, NOT the root `index.html`!

---

### Option 3: Development Mode (For Active Development)

For testing while you code:

```bash
npm run dev
```

This starts Vite's dev server with hot reload at `http://localhost:5173`

---

## 📦 Deployment Options

### Free Hosting Services (Recommended)

#### 1. **Vercel** (Easiest)

- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub
- Import your repository
- Vercel auto-detects Vite and deploys automatically
- **Free forever** for personal projects

#### 2. **Netlify**

- Go to [netlify.com](https://netlify.com)
- Drag and drop your `dist` folder after building
- Or connect your GitHub repo
- **Free tier available**

#### 3. **GitHub Pages**

- Build your project: `npm run build`
- Install gh-pages: `npm install --save-dev gh-pages`
- Add to `package.json` scripts:
  ```json
  "deploy": "npm run build && gh-pages -d dist"
  ```
- Run: `npm run deploy`

---

## 🔧 Quick Commands Reference

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Preview built version locally
npm run preview

# Preview with network access
npm run serve
```

---

## 💡 Pro Tips

1. **Always build before deploying**: Run `npm run build` to create the `dist` folder
2. **Test locally first**: Use `npm run preview` to test the production build
3. **Check your base path**: Your `vite.config.js` has `base: './'` which is good for most deployments
4. **Clear cache**: If you see old versions, clear your browser cache or do a hard refresh (Ctrl+Shift+R)

---

## 🐛 Troubleshooting

**Issue:** "Go Live" shows a blank page

- **Solution:** You're using the root `index.html`. Use `dist/index.html` after building.

**Issue:** Assets not loading

- **Solution:** Make sure `base: './'` is set in `vite.config.js` (you already have this!)

**Issue:** Routes not working after deployment

- **Solution:** Configure your hosting service to redirect all routes to `index.html` (SPA mode)

---

## 📝 Next Steps

1. Test locally with `npm run preview`
2. Choose a hosting service (Vercel recommended)
3. Deploy and share your app! 🎉
