import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Every request that starts with /api is forwarded to the Express server (server/ folder).
// Both portals (5173 citizen, 5174 staff) therefore talk to the same backend and database.
const api = { '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true } };

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: mode === 'staff' ? 5174 : 5173,
    strictPort: true,
    proxy: api,
  },
  preview: { proxy: api },
}));
