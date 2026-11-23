import { getAllStatuses } from './_allStatuses.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const force = req.query.force === '1';

  try {
    const payload = await getAllStatuses({ force });
    res.setHeader(
      'Cache-Control',
      force ? 'no-store' : 'public, s-maxage=45, stale-while-revalidate=120'
    );
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(502).json({
      error: 'Failed to load aggregated statuses',
      message: err.message,
    });
  }
}
