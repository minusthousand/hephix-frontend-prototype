import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chat': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/sessions': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/mcp': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
