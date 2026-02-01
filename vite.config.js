import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    allowedHosts: ['atlas-for-urban-intelligence-production.up.railway.app', 'urbanintelligence.app', 'www.urbanintelligence.app']
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
