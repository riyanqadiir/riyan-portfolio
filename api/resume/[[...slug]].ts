import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSlugSegments } from '../../backend/lib/request-body';
import { handleResumeGet, handleResumeUpload } from '../../backend/handlers/resume';

/** GET /api/resume — POST /api/resume/upload */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const segments = getSlugSegments(req);

  if (segments.length === 0) {
    return handleResumeGet(req, res);
  }

  if (segments.length === 1 && segments[0] === 'upload') {
    return handleResumeUpload(req, res);
  }

  return res.status(404).json({ message: 'Not found' });
}

export const config = {
  api: { bodyParser: false },
};
