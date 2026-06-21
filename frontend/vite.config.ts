// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    watch: {
      // Ignore changes in parent folders like backend or uploads to avoid reload loops.
      // Use absolute paths so chokidar ignores work reliably on Windows.
      ignored: [
        '**/node_modules/**',
        path.resolve(__dirname, '../backend') + '/**',
        path.resolve(__dirname, '../uploads') + '/**',
        // Ignore the config file itself (some editors/formatters may touch it)
        path.resolve(__dirname, 'vite.config.ts'),
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5003',
        ws: true,
      },
    },
  },
})