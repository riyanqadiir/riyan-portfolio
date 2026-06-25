import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureJsonBody, getSlugSegments } from '../../backend/lib/request-body';
import {
  handleTimelineRoot,
  handleTimelineById,
  handleTimelineNormalize,
} from '../../backend/handlers/timeline';

/** GET|POST /api/timeline — POST /api/timeline/normalize — PATCH|PUT|DELETE /api/timeline/:id */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const segments = getSlugSegments(req);

  if (segments.length === 0) {
    try {
      await ensureJsonBody(req);
    } catch {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }
    return handleTimelineRoot(req, res);
  }

  if (segments.length === 1 && segments[0] === 'normalize') {
    return handleTimelineNormalize(req, res);
  }

  if (segments.length === 1) {
    try {
      await ensureJsonBody(req);
    } catch {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }
    return handleTimelineById(req, res, segments[0]);
  }

  return res.status(404).json({ message: 'Not found' });
}
