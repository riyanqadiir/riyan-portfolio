import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LoginSchema, formatZodErrors } from '../../lib/validators';
import { signAdminToken } from '../../lib/auth';

/**
 * POST /api/auth/login
 *
 * Authenticates the single admin user against env-configured credentials.
 * Returns a signed JWT on success.
 *
 * Request body:
 *   { username: string, password: string }
 *
 * Responses:
 *   200 { token: string, message: string }
 *   400 { errors: { field, message }[] }       — validation failure
 *   401 { message: string }                    — wrong credentials
 *   405 { message: string }                    — wrong HTTP method
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // ── Validate request body with Zod ───────────────────────────────────────
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: formatZodErrors(parsed.error) });
  }

  const { username, password } = parsed.data;

  // ── Compare against env-configured admin credentials ─────────────────────
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // ── Issue JWT ─────────────────────────────────────────────────────────────
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  const token = signAdminToken(username, expiresIn);

  return res.status(200).json({
    token,
    message: 'Login successful',
  });
}
