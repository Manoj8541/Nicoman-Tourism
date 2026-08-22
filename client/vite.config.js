import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ─── Dev vs Production API routing ─────────────────────────────────────────
// LOCAL DEV:   `npm run dev` (client/) + `node server/server.js` (server/).
//              Vite proxies /api/* → Express at localhost:5000.
// PRODUCTION:  Vercel routes /api/* to the serverless functions in /api/ folder.
//              The proxy below is vite-dev-only and is NOT used by Vercel.

export default defineConfig({
  plugins: [react()],

  worker: {
    format: 'es',
  },

  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok-free.dev',
      '.ngrok.io',
      'twentypenny-brawnily-marcia.ngrok-free.dev',
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
          // Note: @xenova/transformers is NOT listed here — it's dynamically
          // imported on-demand and will be code-split automatically by Rollup.
        },
      },
    },
  },
});