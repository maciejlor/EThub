import fs from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const proxyConfig = {
  '/truckersmp': {
    target: 'https://truckersmp.com',
    changeOrigin: true,
    secure: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    rewrite: (p: string) => p.replace(/^\/truckersmp/, ''),
  },
  '/steam-api': {
    target: 'https://api.steampowered.com',
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => p.replace(/^\/steam-api/, ''),
  },
  '/api/truckersmp': {
    target: 'https://api.truckersmp.com',
    changeOrigin: true,
    secure: true,
    headers: {
      'User-Agent': 'EThub/1.0 (https://github.com/maciejlor/EThub)',
      'Accept': 'application/json',
    },
    bypass: (req: any) => {
      if (req.url && req.url.includes('type=attending')) {
        req.url = req.url.replace('events?type=attending', 'events/attending').replace('events/?type=attending', 'events/attending');
      }
    },
    rewrite: (p: string) => p.replace(/^\/api\/truckersmp/, '/v2'),
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
    rewrite: (p: string) => p.replace(/^\/trucky-api/, ''),
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
    rewrite: (p: string) => p.replace(/^\/trucky-global-api/, ''),
  },
  '/discord-api': {
    target: 'https://discord.com/api',
    changeOrigin: true,
    secure: false,
    rewrite: (p: string) => p.replace(/^\/discord-api/, ''),
  },
};

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

          if (req.url && req.url.startsWith('/api/send-discord-log')) {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk.toString());
              req.on('end', async () => {
                try {
                  // Uses environment variables in local dev
                  const token = process.env.DISCORD_BOT_TOKEN;
                  const channel = process.env.DISCORD_LOG_CHANNEL_ID;
                  
                  if (!token || !channel) {
                    res.statusCode = 500;
                    return res.end(JSON.stringify({ error: 'Missing local env variables' }));
                  }

                  const response = await fetch(`https://discord.com/api/v10/channels/${channel}/messages`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bot ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body
                  });
                  const data = await response.json();
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to send' }));
                }
              });
              return;
            }
          }
          if (req.url && req.url.startsWith('/api/send-discord-dm')) {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk.toString());
              req.on('end', async () => {
                try {
                  const token = process.env.DISCORD_BOT_TOKEN;
                  if (!token) {
                    res.statusCode = 500;
                    return res.end(JSON.stringify({ error: 'Missing token' }));
                  }

                  const { discordId, content, components } = JSON.parse(body);

                  // 1. Create DM channel
                  const channelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bot ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ recipient_id: discordId }),
                  });
                  const channelData = await channelRes.json() as any;
                  if (!channelRes.ok) {
                    res.statusCode = channelRes.status;
                    return res.end(JSON.stringify(channelData));
                  }
                  
                  // 2. Send message
                  const msgRes = await fetch(`https://discord.com/api/v10/channels/${channelData.id}/messages`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bot ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content, components })
                  });
                  const msgData = await msgRes.json();
                  res.statusCode = msgRes.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(msgData));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to send DM' }));
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
    proxy: proxyConfig,
  },
  preview: {
    proxy: proxyConfig,
  },
});
