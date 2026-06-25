import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/health
 *
 * Simple liveness probe. Useful for uptime monitors and deployment verification.
 * Returns the runtime environment and current UTC timestamp.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  return res.status(200).json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel' : 'local',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
