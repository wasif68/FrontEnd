/**
 * This file tells Vite how to build and run our React app.
 * The base './' makes all links work in Live Server and XAMPP.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
})
/**
 * Build notes:
 * - Run `npm run build` to create the `dist/` folder.
 * - Copy/move `dist/` into `C:\xampp\htdocs\frontend\`.
 * - Open in browser: http://localhost/frontend/dist/
 */
