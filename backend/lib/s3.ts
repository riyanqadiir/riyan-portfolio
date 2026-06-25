import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Lazily-instantiated S3 client.
 * Created once per function instance and reused across warm invocations.
 */
let _s3Client: S3Client | null = null;

const region = () => process.env.AWS_REGION || 'us-east-1';
const bucketName = () => process.env.AWS_S3_BUCKET || 'farely-profile-photos';

/** Signed URL lifetime — 7 days (portfolio images are re-fetched on each page load). */
const SIGNED_URL_EXPIRES_IN = 7 * 24 * 60 * 60;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: region(),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return _s3Client;
}

/**
 * Extracts the S3 object key from a stored value or legacy full S3 URL.
 * e.g. "projects/123-photo.png" or
 *      "https://farely-profile-photos.s3.us-east-1.amazonaws.com/projects/123-photo.png"
 */
export function extractS3Key(image: string): string {
  if (!image) return image;
  if (image.startsWith('projects/')) return image;

  const s3PathMatch = image.match(/amazonaws\.com\/(projects\/.+)$/);
  if (s3PathMatch) return s3PathMatch[1];

  return image;
}

/** True when the image value is an S3 object key (not a local path or external URL). */
export function isS3Key(image: string): boolean {
  return extractS3Key(image).startsWith('projects/');
}

/**
 * Normalizes image before saving to MongoDB.
 * Stores S3 keys instead of full URLs (matches Farely's pattern).
 */
export function normalizeImageForStorage(image: string): string {
  if (!image) return image;
  if (image.startsWith('/')) return image;
  if (image.startsWith('http') && !image.includes('.amazonaws.com/')) return image;
  return extractS3Key(image);
}

/**
 * Returns a browser-loadable URL for an image field.
 * - Local paths (/TaskMaster.png) → returned as-is
 * - External URLs → returned as-is
 * - S3 keys (projects/...) → presigned URL (private bucket, same as Farely)
 */
export async function resolveImageUrl(image: string): Promise<string> {
  if (!image) return image;
  if (image.startsWith('/')) return image;
  if (image.startsWith('http') && !isS3Key(image)) return image;

  const key = extractS3Key(image);
  if (!key.startsWith('projects/')) return image;

  return getSignedImageUrl(key);
}

/**
 * Generates a presigned GET URL for a private S3 object.
 * Farely uses the same approach in backend/services/s3.service.js → getFileUrl().
 */
export async function getSignedImageUrl(
  key: string,
  expiresIn: number = SIGNED_URL_EXPIRES_IN
): Promise<string> {
  return getSignedFileUrl(key, expiresIn);
}

/** Presigned URL for any S3 object (PDF resume, etc.). */
export async function getSignedFileUrl(
  key: string,
  expiresIn: number = SIGNED_URL_EXPIRES_IN,
  options?: { fileName?: string; inline?: boolean }
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName(),
    Key: key,
    ...(options?.fileName && {
      ResponseContentDisposition: options.inline
        ? `inline; filename="${options.fileName}"`
        : `attachment; filename="${options.fileName}"`,
    }),
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({ Bucket: bucketName(), Key: key })
  );
}

/**
 * Uploads a file buffer to S3. Returns the object key (not a public URL).
 * The bucket is private — use resolveImageUrl() when serving to the browser.
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const bucket = bucketName();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueKey = `projects/${Date.now()}-${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: uniqueKey,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  try {
    await getS3Client().send(command);
    return uniqueKey;
  } catch (error) {
    console.error('[S3] Upload failed:', error);
    throw new Error(
      `S3 upload failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

const RESUME_S3_KEY = 'resumes/portfolio-resume.pdf';
const PROFILE_PHOTO_S3_BASE = 'profiles/portfolio-photo';

function profilePhotoExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export function getProfilePhotoS3Key(mimeType: string): string {
  return `${PROFILE_PHOTO_S3_BASE}.${profilePhotoExtension(mimeType)}`;
}

/** Upload or replace the portfolio profile photo in S3. */
export async function uploadProfilePhotoToS3(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const bucket = bucketName();
  const key = getProfilePhotoS3Key(mimeType);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  try {
    await getS3Client().send(command);
    return key;
  } catch (error) {
    console.error('[S3] Profile photo upload failed:', error);
    throw new Error(
      `S3 profile photo upload failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/** Upload or replace the portfolio resume PDF in S3. */
export async function uploadResumeToS3(
  fileBuffer: Buffer,
  mimeType: string = 'application/pdf'
): Promise<string> {
  const bucket = bucketName();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: RESUME_S3_KEY,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  try {
    await getS3Client().send(command);
    return RESUME_S3_KEY;
  } catch (error) {
    console.error('[S3] Resume upload failed:', error);
    throw new Error(
      `S3 resume upload failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export { RESUME_S3_KEY, PROFILE_PHOTO_S3_BASE };
