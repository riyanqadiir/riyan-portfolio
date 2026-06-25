import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LoginSchema, formatZodErrors } from '../lib/validators';
import { signAdminToken } from '../lib/auth';

export function handleAuthLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: formatZodErrors(parsed.error) });
  }

  const { username, password } = parsed.data;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  const token = signAdminToken(username, expiresIn);

  return res.status(200).json({ token, message: 'Login successful' });
}
