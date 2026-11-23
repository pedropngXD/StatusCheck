import { getCveFeed } from './_cveFeed.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const payload = await getCveFeed();
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(502).json({
      error: 'Failed to load CVE feed',
      message: err.message,
    });
  }
}
