import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { getCveFeed } from './api/_cveFeed.js';
import { getAllStatuses } from './api/_allStatuses.js';
import { translateBatch } from './api/_translate.js';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'vercel-dev-api-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/translate')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              let raw = '';
              for await (const chunk of req) {
                raw += chunk;
              }
              const body = JSON.parse(raw || '{}');
              if (!body || typeof body !== 'object' || !Array.isArray(body.texts)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid request body: expected { texts: string[] }' }));
                return;
              }
              const target = typeof body.target === 'string' && body.target ? body.target : 'pt-BR';
              const result = await translateBatch(body.texts, target);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Translation failed' }));
            }
            return;
          }
          if (req.url && req.url.startsWith('/api/cve')) {
            try {
              const payload = await getCveFeed();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify(payload));
            } catch (err) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to load CVE feed', message: err.message }));
            }
            return;
          }
          if (req.url && (req.url.startsWith('/api/statuses?') || req.url === '/api/statuses')) {
            try {
              const urlObj = new URL(req.url, 'http://localhost');
              const force = urlObj.searchParams.get('force') === '1';
              const payload = await getAllStatuses({ force });
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify(payload));
            } catch (err) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to load aggregated statuses', message: err.message }));
            }
            return;
          }
          if (req.url && req.url.startsWith('/api/status')) {
            const urlObj = new URL(req.url, 'http://localhost');
            const targetUrl = urlObj.searchParams.get('url');

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing target url parameter' }));
              return;
            }

            try {
              const upstreamRes = await fetch(targetUrl, {
                headers: {
                  'User-Agent': 'StatusCheck-Bot/1.0 (Dashboard Health Monitor)',
                  'Accept': '*/*',
                },
              });

              if (targetUrl.includes('status.aws.amazon.com/data.json')) {
                const arrayBuffer = await upstreamRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const decodedText = buffer.swap16().toString('utf16le').replace(/^\uFEFF/, '').trim();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(decodedText);
                return;
              }

              if (!upstreamRes.ok && (upstreamRes.status === 401 || upstreamRes.status === 429)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ status: 'operational', httpStatus: upstreamRes.status, operational: true }));
                return;
              }

              const contentType = upstreamRes.headers.get('content-type') || 'text/plain';
              const text = await upstreamRes.text();

              res.statusCode = upstreamRes.status;
              res.setHeader('Content-Type', contentType);
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(text);
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }
          next();
        });
      },
    },
  ],
  build: {
    assetsInlineLimit: 14336,
  },
});
