import {SITE_MESSAGE_FROM} from '@so/model';

export default async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  if (apiKey.length === 0) {
    throw new Error('RESEND_API_KEY is not set');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: SITE_MESSAGE_FROM,
      to: [to],
      subject: 'Reset your Simple Outcome site password',
      text: `Set your password by opening this link (valid for one hour):\n\n${resetUrl}\n\nIf you did not ask for this, ignore this email.`,
    }),
  });
  if (!response.ok) {
    throw new Error('Could not send reset email');
  }
}
