import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../lib/db';
import { verifyAuth } from '../lib/auth';
import { ExpertiseSchema, formatZodErrors } from '../lib/validators';
import Expertise from '../models/Expertise';

export const SEED_EXPERTISE = [
  {
    title: 'Frontend Development',
    description:
      'I specialize in building responsive, user-friendly interfaces using React.js and modern web technologies. I focus on creating clean layouts, reusable components, and smooth user experiences.',
    icon: 'react',
    chipsLabel: 'Tech stack:',
    chips: ['React.js', 'Next.js', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Sass', 'Bootstrap'],
    order: 0,
  },
  {
    title: 'Backend & API Development',
    description:
      'I build scalable backend services using Node.js and Express.js. I have hands-on experience working with both SQL and NoSQL databases and creating secure RESTful APIs for real-world applications.',
    icon: 'node-js',
    chipsLabel: 'Tech stack:',
    chips: ['Node.js', 'Express.js', 'MongoDB', 'MySQL', 'REST APIs', 'Postman'],
    order: 1,
  },
  {
    title: 'Tools, Workflow & Collaboration',
    description:
      'I use modern development tools and workflows to ensure clean code, version control, and smooth collaboration. I enjoy working in agile environments and continuously improving productivity.',
    icon: 'git-alt',
    chipsLabel: 'Tools I use:',
    chips: ['Git', 'GitHub', 'JIRA', 'VS Code', 'Python (Basic)', 'Mobile App Fundamentals'],
    order: 2,
  },
];

export async function handleExpertiseRoot(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      await connectDB();
      if (!isDbConnected()) return res.status(200).json(SEED_EXPERTISE);

      let items = await Expertise.find().sort({ order: 1 }).lean();
      if (items.length === 0) {
        items = await Expertise.insertMany(SEED_EXPERTISE);
      }
      return res.status(200).json(items);
    } catch (error) {
      console.error('[expertise] GET error:', error);
      return res.status(200).json(SEED_EXPERTISE);
    }
  }

  if (req.method === 'POST') {
    const admin = verifyAuth(req, res);
    if (!admin) return;

    const parsed = ExpertiseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: formatZodErrors(parsed.error) });
    }

    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(503).json({ message: 'Database not connected.' });
      }

      const { title, description, icon, chipsLabel, chips, order } = parsed.data;
      let itemOrder = order;
      if (itemOrder === undefined) {
        const last = await Expertise.findOne().sort({ order: -1 }).lean();
        itemOrder = last ? (last as { order: number }).order + 1 : 0;
      }

      const item = await Expertise.create({
        title,
        description,
        icon,
        chipsLabel,
        chips,
        order: itemOrder,
      });
      return res.status(201).json(item);
    } catch (error) {
      console.error('[expertise] POST error:', error);
      return res.status(500).json({ message: 'Failed to create expertise item' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export async function handleExpertiseById(req: VercelRequest, res: VercelResponse, id: string) {
  const admin = verifyAuth(req, res);
  if (!admin) return;

  if (req.method === 'PUT') {
    const parsed = ExpertiseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: formatZodErrors(parsed.error) });
    }

    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(503).json({ message: 'Database not connected.' });
      }

      const { title, description, icon, chipsLabel, chips, order } = parsed.data;
      const updated = await Expertise.findByIdAndUpdate(
        id,
        { title, description, icon, chipsLabel, chips, ...(order !== undefined && { order }) },
        { new: true, runValidators: true }
      );

      if (!updated) return res.status(404).json({ message: 'Expertise item not found' });
      return res.status(200).json(updated);
    } catch (error) {
      console.error('[expertise] PUT error:', error);
      return res.status(500).json({ message: 'Failed to update expertise item' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(503).json({ message: 'Database not connected.' });
      }

      const deleted = await Expertise.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Expertise item not found' });
      return res.status(200).json({ message: 'Expertise item deleted', id });
    } catch (error) {
      console.error('[expertise] DELETE error:', error);
      return res.status(500).json({ message: 'Failed to delete expertise item' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
