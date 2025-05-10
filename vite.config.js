import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/BIN/', // Set the base path for GitHub Pages
  build: {
    outDir: 'build' // Output to 'build' folder instead of 'dist'
  }
})
