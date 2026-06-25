import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../../lib/db';
import { verifyAuth } from '../../lib/auth';
import { ExpertiseSchema, formatZodErrors } from '../../lib/validators';
import Expertise from '../../models/Expertise';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = verifyAuth(req, res);
  if (!admin) return;

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Expertise ID is required' });
  }

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
      console.error('[expertise/[id]] PUT error:', error);
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
      console.error('[expertise/[id]] DELETE error:', error);
      return res.status(500).json({ message: 'Failed to delete expertise item' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
