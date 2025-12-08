/**
 * This file tells Vite how to build and run our React app.
 * The base './' makes all links work in Live Server and XAMPP.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true, // Fail if port is already in use instead of trying next available
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
/**
 * Build notes:
 * - Run `npm run build` to create the `dist/` folder.
 * - Copy/move `dist/` into `C:\xampp\htdocs\frontend\`.
 * - Open in browser: http://localhost/frontend/dist/
 */
