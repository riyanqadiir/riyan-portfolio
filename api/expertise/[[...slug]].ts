import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureJsonBody, getSlugSegments } from '../../backend/lib/request-body';
import { handleExpertiseRoot, handleExpertiseById } from '../../backend/handlers/expertise';

/** GET|POST /api/expertise — PUT|DELETE /api/expertise/:id */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const segments = getSlugSegments(req);

  if (segments.length === 0) {
    try {
      await ensureJsonBody(req);
    } catch {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }
    return handleExpertiseRoot(req, res);
  }

  if (segments.length === 1) {
    try {
      await ensureJsonBody(req);
    } catch {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }
    return handleExpertiseById(req, res, segments[0]);
  }

  return res.status(404).json({ message: 'Not found' });
}
