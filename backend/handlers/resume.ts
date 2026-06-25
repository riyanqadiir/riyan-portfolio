import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import { connectDB, isDbConnected } from '../lib/db';
import { verifyAuth } from '../lib/auth';
import { uploadResumeToS3, getSignedFileUrl } from '../lib/s3';
import Resume from '../models/Resume';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resume upload'));
    }
  },
});

function runMulter(req: VercelRequest, res: VercelResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single('resume')(req as any, res as any, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function handleResumeGet(req: VercelRequest, res: VercelResponse) {
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
    console.error('[resume] GET error:', error);
    return res.status(500).json({ message: 'Failed to load resume' });
  }
}

export async function handleResumeUpload(req: VercelRequest, res: VercelResponse) {
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
    return res.status(400).json({ message: 'No PDF file provided' });
  }

  try {
    await connectDB();
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected.' });
    }

    const s3Key = await uploadResumeToS3(file.buffer, file.mimetype);
    const fileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') || 'Resume.pdf';

    const resume = await Resume.findOneAndUpdate(
      { slug: 'main' },
      { s3Key, fileName, contentType: file.mimetype },
      { upsert: true, new: true }
    );

    const [previewUrl, downloadUrl] = await Promise.all([
      getSignedFileUrl(s3Key, undefined, { fileName, inline: true }),
      getSignedFileUrl(s3Key, undefined, { fileName, inline: false }),
    ]);

    return res.status(200).json({
      message: 'Resume uploaded successfully',
      fileName: resume.fileName,
      previewUrl,
      downloadUrl,
      updatedAt: resume.updatedAt,
    });
  } catch (error) {
    console.error('[resume] upload error:', error);
    return res.status(500).json({ message: 'Resume upload failed' });
  }
}
