import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Decoded JWT payload attached to a verified request.
 */
export interface AdminPayload {
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Extracts and verifies the Bearer JWT from an incoming request's
 * `Authorization` header.
 *
 * @returns The decoded `AdminPayload` if the token is valid.
 * @throws  Sends a 401 JSON response and returns `null` if verification fails.
 *
 * Usage inside a serverless function:
 * ```ts
 * const admin = verifyAuth(req, res);
 * if (!admin) return; // response already sent
 * ```
 */
export function verifyAuth(
  req: VercelRequest,
  res: VercelResponse
): AdminPayload | null {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return null;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AdminPayload;
    return decoded;
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
    return null;
  }
}

/**
 * Generates a signed JWT token for the admin user.
 *
 * @param username  The admin username to encode in the payload
 * @param expiresIn Token TTL string (default: "1d")
 * @returns Signed JWT string
 */
export function signAdminToken(
  username: string,
  expiresIn: string = '1d'
): string {
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';
  return jwt.sign({ username }, jwtSecret, { expiresIn } as jwt.SignOptions);
}
