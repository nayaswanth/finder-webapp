
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Set to root for Render deployment
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    },
    copyPublicDir: true,
  }
});
