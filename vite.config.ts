import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/truckersmp': {
        target: 'https://truckersmp.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        rewrite: (p) => p.replace(/^\/truckersmp/, ''),
      },
      '/steam-api': {
        target: 'https://api.steampowered.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/steam-api/, ''),
      },
      '/tmp-api': {
        target: 'https://api.truckersmp.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'User-Agent': 'EThub-Dashboard/1.0'
        },
        rewrite: (p) => p.replace(/^\/tmp-api/, ''),
      },
      '/trucky-api': {
        target: 'https://e.truckyapp.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://truckyapp.com',
        },
        rewrite: (p) => p.replace(/^\/trucky-api/, ''),
      },
      '/trucky-global-api': {
        target: 'https://api.truckyapp.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://truckyapp.com',
        },
        rewrite: (p) => p.replace(/^\/trucky-global-api/, ''),
      },
    },
  },
});
