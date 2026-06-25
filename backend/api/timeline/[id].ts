import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../../lib/db';
import { verifyAuth } from '../../lib/auth';
import { TimelineSchema, formatZodErrors } from '../../lib/validators';
import Timeline from '../../models/Timeline';
import {
  moveItem,
  setItemOrder,
  compactAfterDelete,
} from '../../lib/timeline-order';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = verifyAuth(req, res);
  if (!admin) return;

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Timeline ID is required' });
  }

  // PATCH — move up / down (swap with neighbour)
  if (req.method === 'PATCH') {
    const direction = (req.body as { direction?: string })?.direction;
    if (direction !== 'up' && direction !== 'down') {
      return res.status(400).json({ message: 'direction must be "up" or "down"' });
    }

    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(503).json({ message: 'Database not connected.' });
      }

      const result = await moveItem(Timeline, id, direction);
      if (!result.ok) {
        return res.status(400).json({ message: result.message });
      }
      const updated = await Timeline.findById(id).lean();
      return res.status(200).json(updated);
    } catch (error) {
      console.error('[timeline/[id]] PATCH error:', error);
      return res.status(500).json({ message: 'Failed to move timeline item' });
    }
  }

  if (req.method === 'PUT') {
    const parsed = TimelineSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: formatZodErrors(parsed.error) });
    }

    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(503).json({ message: 'Database not connected.' });
      }

      const { title, subtitle, description, date, type, order } = parsed.data;

      if (order !== undefined) {
        await setItemOrder(Timeline, id, order);
      }

      const updated = await Timeline.findByIdAndUpdate(
        id,
        {
          title,
          subtitle,
          description: description || '',
          date,
          type,
        },
        { new: true, runValidators: true }
      );

      if (!updated) return res.status(404).json({ message: 'Timeline item not found' });
      return res.status(200).json(updated);
    } catch (error) {
      console.error('[timeline/[id]] PUT error:', error);
      return res.status(500).json({ message: 'Failed to update timeline item' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(503).json({ message: 'Database not connected.' });
      }

      const deleted = await Timeline.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Timeline item not found' });

      await compactAfterDelete(Timeline, deleted.order);
      return res.status(200).json({ message: 'Timeline item deleted', id });
    } catch (error) {
      console.error('[timeline/[id]] DELETE error:', error);
      return res.status(500).json({ message: 'Failed to delete timeline item' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
