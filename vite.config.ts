import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/api/ws': {
        target: 'ws://localhost:8000',
        ws: true
      }
    }
  },
  build: {
    sourcemap: true, // Generate source maps for better debugging
    rollupOptions: {
      output: {
        manualChunks: {
          // Optional: Split vendor code for better caching
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
})
