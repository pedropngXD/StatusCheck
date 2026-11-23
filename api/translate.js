import { translateBatch } from './_translate.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body || '{}');
    }
    if (!body || typeof body !== 'object' || !Array.isArray(body.texts)) {
      return res.status(400).json({ error: 'Invalid request body: expected { texts: string[] }' });
    }

    const target = typeof body.target === 'string' && body.target ? body.target : 'pt-BR';
    const result = await translateBatch(body.texts, target);
    return res.status(200).json(result);
  } catch {
    return res.status(500).json({ error: 'Translation failed' });
  }
}
