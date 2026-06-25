import type { VercelRequest, VercelResponse } from '@vercel/node';

export function handleHealth(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  return res.status(200).json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel' : 'local',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
