export async function verifyTurnstile(token: string, ip: string): Promise<boolean | undefined> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() ?? '';
  if (secret.length === 0) {
    return undefined;
  }
  const body = new URLSearchParams({secret, response: token});
  if (ip !== 'unknown') {
    body.set('remoteip', ip);
  }
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body,
  });
  if (!response.ok) {
    return false;
  }
  const payload = (await response.json()) as {readonly success?: unknown};
  return payload.success === true;
}
