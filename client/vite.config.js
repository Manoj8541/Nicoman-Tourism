import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    allowedHosts: [
      '.ngrok-free.app',           // Allow all ngrok free domains
      '.ngrok-free.dev',           // Allow all ngrok free dev domains
      '.ngrok.io',                 // Allow all ngrok domains
      'twentypenny-brawnily-marcia.ngrok-free.dev',  // Your specific domain
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          animations: ['framer-motion'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});