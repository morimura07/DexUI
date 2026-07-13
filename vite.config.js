import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    // Bind to 0.0.0.0 so other machines (and tunnels) can reach the dev server,
    // not just localhost. Required for anyone but you to view it.
    host: true,
    // Allow the Host header used by Cloudflare quick tunnels; without this Vite
    // rejects tunnelled requests with "Blocked request. This host is not allowed."
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
