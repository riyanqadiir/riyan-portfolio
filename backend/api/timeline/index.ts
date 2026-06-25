import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../../lib/db';
import { verifyAuth } from '../../lib/auth';
import { TimelineSchema, formatZodErrors } from '../../lib/validators';
import Timeline from '../../models/Timeline';
import { pushToTop } from '../../lib/timeline-order';

/** order 0 = top (newest). Higher order = further down the page. */
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

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
      console.error('[timeline/index] GET error:', error);
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

      // Stack behaviour: new entries go to the top unless an explicit order is set
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
      console.error('[timeline/index] POST error:', error);
      return res.status(500).json({ message: 'Failed to create timeline item' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
