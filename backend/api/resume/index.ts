import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../../lib/db';
import { getSignedFileUrl } from '../../lib/s3';
import Resume from '../../models/Resume';

/**
 * GET /api/resume
 *
 * Public. Returns presigned preview + download URLs for the current resume.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    if (!isDbConnected()) {
      return res.status(200).json({ hasResume: false });
    }

    const resume = await Resume.findOne({ slug: 'main' }).lean();
    if (!resume) {
      return res.status(200).json({ hasResume: false });
    }

    const fileName = resume.fileName || 'Resume.pdf';
    const [previewUrl, downloadUrl] = await Promise.all([
      getSignedFileUrl(resume.s3Key, undefined, { fileName, inline: true }),
      getSignedFileUrl(resume.s3Key, undefined, { fileName, inline: false }),
    ]);

    return res.status(200).json({
      hasResume: true,
      fileName,
      previewUrl,
      downloadUrl,
      updatedAt: resume.updatedAt,
    });
  } catch (error) {
    console.error('[resume/index] GET error:', error);
    return res.status(500).json({ message: 'Failed to load resume' });
  }
}
