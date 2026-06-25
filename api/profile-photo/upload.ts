import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import { connectDB, isDbConnected } from '../../backend/lib/db';
import { verifyAuth } from '../../backend/lib/auth';
import { uploadProfilePhotoToS3, getSignedFileUrl, deleteFromS3 } from '../../backend/lib/s3';
import ProfilePhoto from '../../backend/models/ProfilePhoto';

/**
 * POST /api/profile-photo/upload
 *
 * Protected (JWT). Upload or replace the portfolio profile photo (images only, max 5 MB).
 *
 * Response 200: { message, fileName, imageUrl, previewUrl, downloadUrl, updatedAt }
 */

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, or WebP images are allowed'));
    }
  },
});

function runMulter(req: VercelRequest, res: VercelResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single('photo')(req as any, res as any, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const admin = verifyAuth(req, res);
  if (!admin) return;

  try {
    await runMulter(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'File upload error';
    return res.status(400).json({ message });
  }

  interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }

  const file = (req as VercelRequest & { file?: UploadedFile }).file;
  if (!file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  try {
    await connectDB();
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected.' });
    }

    const existing = await ProfilePhoto.findOne({ slug: 'main' }).lean();
    const s3Key = await uploadProfilePhotoToS3(file.buffer, file.mimetype);
    const fileName =
      file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') || 'profile-photo.jpg';

    if (existing?.s3Key && existing.s3Key !== s3Key) {
      try {
        await deleteFromS3(existing.s3Key);
      } catch {
        // Non-fatal if old object cleanup fails
      }
    }

    const photo = await ProfilePhoto.findOneAndUpdate(
      { slug: 'main' },
      { s3Key, fileName, contentType: file.mimetype },
      { upsert: true, new: true }
    );

    const [imageUrl, previewUrl, downloadUrl] = await Promise.all([
      getSignedFileUrl(s3Key, undefined, { fileName, inline: true }),
      getSignedFileUrl(s3Key, undefined, { fileName, inline: true }),
      getSignedFileUrl(s3Key, undefined, { fileName, inline: false }),
    ]);

    return res.status(200).json({
      message: 'Profile photo uploaded successfully',
      fileName: photo.fileName,
      imageUrl,
      previewUrl,
      downloadUrl,
      updatedAt: photo.updatedAt,
    });
  } catch (error) {
    console.error('[profile-photo/upload] error:', error);
    return res.status(500).json({ message: 'Profile photo upload failed' });
  }
}

export const config = {
  api: { bodyParser: false },
};
