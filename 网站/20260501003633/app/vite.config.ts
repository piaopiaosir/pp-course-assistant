import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        timeout: 0,
      },
      '/api/status-page': {
        target: 'https://uptime.piao.one',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
