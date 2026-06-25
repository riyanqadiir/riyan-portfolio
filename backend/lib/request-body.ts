import type { VercelRequest } from '@vercel/node';

/** Parse JSON body when bodyParser is disabled (multipart catch-all routes). */
export async function ensureJsonBody(req: VercelRequest): Promise<void> {
  if (
    req.body !== undefined &&
    req.body !== null &&
    typeof req.body === 'object' &&
    !Buffer.isBuffer(req.body)
  ) {
    return;
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return;
  }

  const raw = await readRawBody(req);
  try {
    req.body = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function readRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export function getSlugSegments(req: VercelRequest): string[] {
  const slug = req.query.slug;
  if (!slug) return [];
  return Array.isArray(slug) ? slug : [slug];
}
