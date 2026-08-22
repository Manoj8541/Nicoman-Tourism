import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // If 5174 is busy, Vite will try 5175, 5176, etc.
    // Update VITE_BOOKING_DEMO_URL in the main site's .env to match.
  },
});
