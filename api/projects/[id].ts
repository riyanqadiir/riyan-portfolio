import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../../backend/lib/db';
import { verifyAuth } from '../../backend/lib/auth';
import { ProjectSchema, formatZodErrors } from '../../backend/lib/validators';
import Project from '../../backend/models/Project';
import { normalizeImageForStorage } from '../../backend/lib/s3';

/**
 * /api/projects/[id]
 *
 * PUT    — Protected (JWT). Updates a project by MongoDB _id.
 *          Body: { title, description, image, link, order? }
 *
 * DELETE — Protected (JWT). Deletes a project by MongoDB _id.
 *
 * Both operations require a valid Bearer token and an active DB connection.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication for all methods on this route
  const admin = verifyAuth(req, res);
  if (!admin) return;

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Project ID is required' });
  }

  // ── PUT /api/projects/:id ─────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const parsed = ProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: formatZodErrors(parsed.error) });
    }

    try {
      await connectDB();

      if (!isDbConnected()) {
        return res
          .status(503)
          .json({ message: 'Database not connected. Cannot perform write operations.' });
      }

      const { title, description, image, link, order } = parsed.data;
      const storedImage = normalizeImageForStorage(image);

      const updated = await Project.findByIdAndUpdate(
        id,
        {
          title,
          description,
          image: storedImage,
          link,
          ...(order !== undefined && { order }),
        },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ message: 'Project not found' });
      }

      return res.status(200).json(updated);
    } catch (error) {
      console.error('[projects/[id]] PUT error:', error);
      return res.status(500).json({ message: 'Failed to update project' });
    }
  }

  // ── DELETE /api/projects/:id ──────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      await connectDB();

      if (!isDbConnected()) {
        return res
          .status(503)
          .json({ message: 'Database not connected. Cannot perform write operations.' });
      }

      const deleted = await Project.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ message: 'Project not found' });
      }

      return res.status(200).json({ message: 'Project deleted successfully', id });
    } catch (error) {
      console.error('[projects/[id]] DELETE error:', error);
      return res.status(500).json({ message: 'Failed to delete project' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
