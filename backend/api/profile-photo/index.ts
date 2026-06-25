import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../../lib/db';
import { getSignedFileUrl } from '../../lib/s3';
import ProfilePhoto from '../../models/ProfilePhoto';

/**
 * GET /api/profile-photo
 *
 * Public. Returns presigned image, preview, and download URLs for the profile photo.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    if (!isDbConnected()) {
      return res.status(200).json({ hasProfilePhoto: false });
    }

    const photo = await ProfilePhoto.findOne({ slug: 'main' }).lean();
    if (!photo) {
      return res.status(200).json({ hasProfilePhoto: false });
    }

    const fileName = photo.fileName || 'profile-photo.jpg';
    const [imageUrl, previewUrl, downloadUrl] = await Promise.all([
      getSignedFileUrl(photo.s3Key, undefined, { fileName, inline: true }),
      getSignedFileUrl(photo.s3Key, undefined, { fileName, inline: true }),
      getSignedFileUrl(photo.s3Key, undefined, { fileName, inline: false }),
    ]);

    return res.status(200).json({
      hasProfilePhoto: true,
      fileName,
      imageUrl,
      previewUrl,
      downloadUrl,
      updatedAt: photo.updatedAt,
    });
  } catch (error) {
    console.error('[profile-photo/index] GET error:', error);
    return res.status(500).json({ message: 'Failed to load profile photo' });
  }
}
