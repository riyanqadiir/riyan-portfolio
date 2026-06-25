/**
 * Local development server for the serverless API handlers.
 *
 * Vercel CLI refuses `npm run dev` when the dev script is `vercel dev`
 * (recursive invocation). This script runs the same handler files on
 * http://localhost:3001 without the Vercel CLI.
 */
import 'dotenv/config';
import http from 'http';
import { parse } from 'url';
import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => void | Promise<void>;

const PORT = Number(process.env.PORT) || 3001;

const CORS_HEADERS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers':
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
};

function wrapResponse(res: http.ServerResponse): VercelResponse {
  let statusCode = 200;
  const extended = res as VercelResponse;

  extended.status = (code: number) => {
    statusCode = code;
    res.statusCode = code;
    return extended;
  };

  extended.json = (body: unknown) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = statusCode;
    }
    res.end(JSON.stringify(body));
    return extended;
  };

  extended.send = (body: unknown) => {
    if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
      return extended.json(body);
    }
    if (!res.headersSent) {
      res.statusCode = statusCode;
    }
    res.end(body as string | Buffer);
    return extended;
  };

  return extended;
}

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = parse(req.url || '', true);

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (!pathname?.startsWith('/api')) {
    wrapResponse(res).status(404).json({ message: `Route not found: ${pathname}` });
    return;
  }

  try {
    const { default: handler } = await import('../../api/index');
    const vercelReq = req as VercelRequest;
    vercelReq.query = {};

    // Mirror production rewrite: /api/foo/bar → path=foo/bar
    if (pathname === '/api' || pathname === '/api/') {
      vercelReq.query.path = '';
    } else if (pathname.startsWith('/api/')) {
      vercelReq.query.path = pathname.slice(5);
    }

    const isMultipartUpload =
      pathname === '/api/projects/upload' ||
      pathname === '/api/resume/upload' ||
      pathname === '/api/profile-photo/upload';

    if (
      !isMultipartUpload &&
      req.method !== 'GET' &&
      req.method !== 'DELETE' &&
      req.method !== 'OPTIONS'
    ) {
      try {
        vercelReq.body = await readJsonBody(req);
      } catch {
        wrapResponse(res).status(400).json({ message: 'Invalid JSON body' });
        return;
      }
    }

    await handler(vercelReq, wrapResponse(res));
  } catch (error) {
    console.error(`[dev] Handler error for ${pathname}:`, error);
    if (!res.headersSent) {
      wrapResponse(res).status(500).json({ message: 'Internal server error' });
    }
  }
});

server.listen(PORT, () => {
  console.log(`[dev] API server running at http://localhost:${PORT}`);
  console.log(`[dev] Health check: http://localhost:${PORT}/api/health`);
});
