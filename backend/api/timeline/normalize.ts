import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../../lib/db';
import { verifyAuth } from '../../lib/auth';
import Timeline from '../../models/Timeline';
import { normalizeOrders } from '../../lib/timeline-order';

/**
 * POST /api/timeline/normalize
 * Re-indexes all timeline orders to 0..n-1 (admin only, one-time fix for legacy data).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const admin = verifyAuth(req, res);
  if (!admin) return;

  try {
    await connectDB();
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected.' });
    }

    await normalizeOrders(Timeline);
    const items = await Timeline.find().sort({ order: 1 }).lean();
    return res.status(200).json({ message: 'Orders normalized', items });
  } catch (error) {
    console.error('[timeline/normalize] error:', error);
    return res.status(500).json({ message: 'Failed to normalize orders' });
  }
}
