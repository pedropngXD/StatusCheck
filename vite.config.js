import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vercel-dev-api-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
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

              // Special handling for AWS data.json (UTF-16 BE encoding)
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
});
