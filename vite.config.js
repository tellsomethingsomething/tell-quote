import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use /tell-quote/ for GitHub Pages, / for Vercel
  base: process.env.GITHUB_ACTIONS ? '/tell-quote/' : '/',
})
