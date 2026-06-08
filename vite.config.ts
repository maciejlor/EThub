import fs from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'local-db-sync-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/db-sync')) {
            const dbFilePath = path.resolve(__dirname, './db.json');

            if (req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              if (fs.existsSync(dbFilePath)) {
                try {
                  const data = fs.readFileSync(dbFilePath, 'utf-8');
                  res.end(data);
                } catch {
                  res.end(JSON.stringify({}));
                }
              } else {
                res.end(JSON.stringify({}));
              }
              return;
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  fs.writeFileSync(dbFilePath, body, 'utf-8');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to write DB' }));
                }
              });
              return;
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 10240,
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
      '/discord-api': {
        target: 'https://discord.com/api',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/discord-api/, ''),
      },
    },
  },
});
