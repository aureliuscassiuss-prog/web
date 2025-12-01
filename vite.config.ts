import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    },
    // Enable history fallback for client-side routing
    // This ensures all routes serve index.html, allowing React Router to handle routing
    historyApiFallback: true
  }
})
