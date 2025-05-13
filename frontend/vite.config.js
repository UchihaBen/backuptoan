import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Không cần import tailwindcss ở đây, tailwindcss được cấu hình qua postcss

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://math-ai.gem-corp.tech:5000',
        changeOrigin: true,
      },
      '/rag': {
        target: 'http://math-ai.gem-corp.tech:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rag/, '')
      }
    }
  }
})
