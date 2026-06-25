import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureJsonBody, getSlugSegments } from '../../backend/lib/request-body';
import {
  handleProjectsRoot,
  handleProjectById,
  handleProjectUpload,
} from '../../backend/handlers/projects';

/**
 * Single function for all /api/projects/* routes (Hobby plan limit).
 * GET|POST /api/projects
 * PUT|DELETE /api/projects/:id
 * POST /api/projects/upload
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const segments = getSlugSegments(req);

  if (segments.length === 0) {
    try {
      await ensureJsonBody(req);
    } catch {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }
    return handleProjectsRoot(req, res);
  }

  if (segments.length === 1 && segments[0] === 'upload') {
    return handleProjectUpload(req, res);
  }

  if (segments.length === 1) {
    try {
      await ensureJsonBody(req);
    } catch {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }
    return handleProjectById(req, res, segments[0]);
  }

  return res.status(404).json({ message: 'Not found' });
}

export const config = {
  api: { bodyParser: false },
};
