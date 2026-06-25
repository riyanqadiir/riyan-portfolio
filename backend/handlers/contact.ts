import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ContactSchema, formatZodErrors } from '../lib/validators';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function handleContact(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: formatZodErrors(parsed.error) });
  }

  const { name, email, message } = parsed.data;
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    return res.status(503).json({
      message: 'Email service is not configured on the server. Please contact me directly.',
    });
  }

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
      console.error('[contact] Brevo API error:', brevoRes.status, await brevoRes.text());
      return res.status(500).json({ message: 'Failed to send message. Please try again later.' });
    }

    return res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('[contact] Unexpected error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again.' });
  }
}
