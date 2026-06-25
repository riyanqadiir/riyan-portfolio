import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../lib/db';
import { verifyAuth } from '../lib/auth';
import { TimelineSchema, formatZodErrors } from '../lib/validators';
import Timeline from '../models/Timeline';
import {
  pushToTop,
  moveItem,
  setItemOrder,
  compactAfterDelete,
  normalizeOrders,
} from '../lib/timeline-order';

export const SEED_TIMELINE = [
  {
    title: 'Web Developer',
    subtitle: 'The Global IT Solutions',
    description:
      'Developed the official company website, improved responsiveness and design structure, built reusable frontend components, and collaborated with the UI/UX and backend teams for API integration.',
    date: 'Apr 2024 – Apr 2025',
    type: 'work' as const,
    order: 0,
  },
  {
    title: 'Trainee Software Engineer',
    subtitle: 'SeeBiz Pvt. Ltd',
    description:
      'Assisted in MERN stack development, wrote modular and scalable code, participated in agile meetings, and contributed to code reviews and team collaboration.',
    date: 'Jun 2023 – Aug 2024',
    type: 'work' as const,
    order: 1,
  },
  {
    title: 'BS Software Engineering',
    subtitle: 'Lahore Garrison University',
    description:
      '7th semester — focusing on full-stack development, databases, and software engineering fundamentals.',
    date: '2022 – Present',
    type: 'education' as const,
    order: 2,
  },
  {
    title: 'Intermediate (ICS)',
    subtitle: 'Aspire Group of Colleges',
    description: '',
    date: '2022',
    type: 'education' as const,
    order: 3,
  },
];

export async function handleTimelineRoot(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      await connectDB();
      if (!isDbConnected()) return res.status(200).json(SEED_TIMELINE);

      let items = await Timeline.find().sort({ order: 1, createdAt: 1 }).lean();
      if (items.length === 0) {
        items = await Timeline.insertMany(SEED_TIMELINE);
      }
      return res.status(200).json(items);
    } catch (error) {
      console.error('[timeline] GET error:', error);
      return res.status(200).json(SEED_TIMELINE);
    }
  }

  if (req.method === 'POST') {
    const admin = verifyAuth(req, res);
    if (!admin) return;

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
      const itemOrder = order !== undefined ? order : await pushToTop(Timeline);

      const item = await Timeline.create({
        title,
        subtitle,
        description: description || '',
        date,
        type,
        order: itemOrder,
      });
      return res.status(201).json(item);
    } catch (error) {
      console.error('[timeline] POST error:', error);
      return res.status(500).json({ message: 'Failed to create timeline item' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export async function handleTimelineNormalize(req: VercelRequest, res: VercelResponse) {
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
    console.error('[timeline] normalize error:', error);
    return res.status(500).json({ message: 'Failed to normalize orders' });
  }
}

export async function handleTimelineById(req: VercelRequest, res: VercelResponse, id: string) {
  const admin = verifyAuth(req, res);
  if (!admin) return;

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
      console.error('[timeline] PATCH error:', error);
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
      console.error('[timeline] PUT error:', error);
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
      console.error('[timeline] DELETE error:', error);
      return res.status(500).json({ message: 'Failed to delete timeline item' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
