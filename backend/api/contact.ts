import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ContactSchema, formatZodErrors } from '../lib/validators';

/**
 * POST /api/contact
 *
 * Receives a contact form submission and relays it as an email via Brevo's
 * transactional email API.
 *
 * ⚠️  Security: The Brevo API key lives ONLY here on the server. It is never
 * sent to the browser. The old approach in Contact.tsx (using
 * REACT_APP_BREVO_API_KEY) exposed the key in the client bundle — this
 * endpoint fixes that.
 *
 * Request body:
 *   { name: string, email: string, message: string }
 *
 * Responses:
 *   200 { message: "Message sent successfully!" }
 *   400 { errors: { field, message }[] }         — validation failure
 *   405 { message: string }                      — wrong method
 *   500 { message: string }                      — Brevo API error
 *   503 { message: string }                      — Brevo not configured
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // ── Validate request body ─────────────────────────────────────────────────
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: formatZodErrors(parsed.error) });
  }

  const { name, email, message } = parsed.data;

  // ── Verify Brevo is configured ────────────────────────────────────────────
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.error('[contact] Brevo is not configured (BREVO_API_KEY or BREVO_SENDER_EMAIL missing)');
    return res.status(503).json({
      message: 'Email service is not configured on the server. Please contact me directly.',
    });
  }

  // ── Send email via Brevo ──────────────────────────────────────────────────
  // Same pattern as the original portfolio: sender and recipient are your inbox.
  const payload: Record<string, unknown> = {
    sender: { email: senderEmail },
    to: [{ email: senderEmail }],
    subject: `New Portfolio Contact Submission from ${name}`,
    htmlContent: `
      <h3>New message from your portfolio</h3>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email / Phone:</strong> ${escapeHtml(email)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
    `,
  };

  // Allow one-click reply when the visitor left a real email address
  if (email.includes('@')) {
    payload.replyTo = { email, name };
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!brevoRes.ok) {
      const errBody = await brevoRes.text();
      console.error('[contact] Brevo API error:', brevoRes.status, errBody);
      return res.status(500).json({ message: 'Failed to send message. Please try again later.' });
    }

    return res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('[contact] Unexpected error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again.' });
  }
}

/** Minimal HTML escaping to prevent XSS in email bodies */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
