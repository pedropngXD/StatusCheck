/**
 * Vercel Serverless Function to proxy status endpoints safely,
 * bypassing browser CORS restrictions and caching upstream responses.
 */
export default async function handler(req, res) {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target "url" query parameter' });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'StatusCheck-Bot/1.0 (Dashboard Health Monitor)',
        'Accept': 'application/json, text/plain, */*',
      },
    });

    if (!upstreamRes.ok) {
      if (upstreamRes.status === 401 || upstreamRes.status === 429) {
        return res.status(200).json({
          status: 'operational',
          httpStatus: upstreamRes.status,
          operational: true,
        });
      }
      return res.status(upstreamRes.status).json({
        error: `Upstream returned status ${upstreamRes.status}`,
      });
    }

    // Set Vercel Edge caching headers: 30s cache, 60s stale-while-revalidate
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    // Special handling for AWS data.json (encoded in UTF-16 BE)
    if (targetUrl.includes('status.aws.amazon.com/data.json')) {
      const arrayBuffer = await upstreamRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const decodedText = buffer.swap16().toString('utf16le').replace(/^\uFEFF/, '').trim();
      const jsonData = JSON.parse(decodedText);
      return res.status(200).json(jsonData);
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstreamRes.json();
      return res.status(200).json(data);
    } else {
      const text = await upstreamRes.text();
      res.setHeader('Content-Type', contentType || 'text/plain');
      return res.status(200).send(text);
    }
  } catch (err) {
    return res.status(500).json({
      error: 'Proxy fetch failed',
      message: err.message,
    });
  }
}
