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

const routes: Array<{
  pattern: RegExp;
  load: () => Promise<{ default: Handler }>;
}> = [
  { pattern: /^\/api\/health$/, load: () => import('../../api/health') },
  { pattern: /^\/api\/auth\/login$/, load: () => import('../../api/auth/login') },
  { pattern: /^\/api\/projects\/upload$/, load: () => import('../../api/projects/upload') },
  { pattern: /^\/api\/projects$/, load: () => import('../../api/projects/index') },
  { pattern: /^\/api\/projects\/([^/]+)$/, load: () => import('../../api/projects/[id]') },
  { pattern: /^\/api\/expertise$/, load: () => import('../../api/expertise/index') },
  { pattern: /^\/api\/expertise\/([^/]+)$/, load: () => import('../../api/expertise/[id]') },
  { pattern: /^\/api\/resume\/upload$/, load: () => import('../../api/resume/upload') },
  { pattern: /^\/api\/resume$/, load: () => import('../../api/resume/index') },
  { pattern: /^\/api\/profile-photo\/upload$/, load: () => import('../../api/profile-photo/upload') },
  { pattern: /^\/api\/profile-photo$/, load: () => import('../../api/profile-photo/index') },
  { pattern: /^\/api\/timeline\/normalize$/, load: () => import('../../api/timeline/normalize') },
  { pattern: /^\/api\/timeline$/, load: () => import('../../api/timeline/index') },
  { pattern: /^\/api\/timeline\/([^/]+)$/, load: () => import('../../api/timeline/[id]') },
  { pattern: /^\/api\/contact$/, load: () => import('../../api/contact') },
];

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

  for (const route of routes) {
    const match = pathname?.match(route.pattern);
    if (!match) continue;

    try {
      const { default: handler } = await route.load();
      const vercelReq = req as VercelRequest;
      vercelReq.query = {};

      if (match[1]) {
        vercelReq.query.id = match[1];
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
    return;
  }

  wrapResponse(res).status(404).json({ message: `Route not found: ${pathname}` });
});

server.listen(PORT, () => {
  console.log(`[dev] API server running at http://localhost:${PORT}`);
  console.log(`[dev] Health check: http://localhost:${PORT}/api/health`);
});
