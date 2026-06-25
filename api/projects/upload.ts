import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import { verifyAuth } from '../../backend/lib/auth';
import { uploadToS3, getSignedImageUrl } from '../../backend/lib/s3';

/**
 * POST /api/projects/upload
 *
 * Protected (JWT). Accepts a single `image` file via multipart/form-data,
 * uploads it to AWS S3, and returns the public URL.
 *
 * Limits: 5 MB max file size, images only.
 *
 * Response 200: { imageKey: string, imageUrl: string }
 * Response 400: { message: string }   — no file provided
 * Response 401: { message: string }   — bad/missing token
 * Response 500: { message: string }   — S3 failure
 */

// ── Multer configuration (memory storage for serverless) ─────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
    } else {
      cb(null, true);
    }
  },
});

/**
 * Wraps a multer middleware call in a Promise so we can `await` it inside
 * a standard async handler — multer's `.single()` expects an Express-style
 * callback, but Vercel functions work the same way under the hood.
 */
function runMulter(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single('image')(req as any, res as any, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Require valid JWT
  const admin = verifyAuth(req, res);
  if (!admin) return;

  // Parse multipart body via multer
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
    const imageKey = await uploadToS3(file.buffer, file.originalname, file.mimetype);
    const imageUrl = await getSignedImageUrl(imageKey);
    return res.status(200).json({ imageKey, imageUrl });
  } catch (error) {
    console.error('[projects/upload] S3 upload error:', error);
    return res.status(500).json({ message: 'File upload to S3 failed' });
  }
}

// Disable the default body parser so multer can read the raw stream
export const config = {
  api: {
    bodyParser: false,
  },
};
