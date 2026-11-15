import {safeParseSiteMessage} from '@so/model';
import {NextResponse} from 'next/server';
import {sendResendContactEmail} from '@/lib/api/resend/sendResendContactEmail';
import {verifyTurnstileContact} from '@/lib/api/turnstile/verifyTurnstileContact';

function json(status: number, body: {readonly ok: boolean; readonly message?: string; readonly field?: string}) {
  return NextResponse.json(body, {status});
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded !== null && forwarded.trim() !== '') {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return 'unknown';
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => undefined);
  if (!isRecord(body)) {
    return json(400, {ok: false, message: 'Enter a message'});
  }
  const honeypot = body.company_website;
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return json(200, {ok: true, message: 'Message sent.'});
  }
  const parsed = safeParseSiteMessage({...body, company_website: ''});
  if (!parsed.ok) {
    return json(400, {ok: false, field: parsed.field, message: parsed.message});
  }
  const turnstile = await verifyTurnstileContact(parsed.value.turnstileToken, clientIp(request));
  if (turnstile === undefined) {
    return json(503, {ok: false, message: 'This form is not available right now.'});
  }
  if (!turnstile) {
    return json(400, {ok: false, field: 'turnstileToken', message: 'Confirm you are a person'});
  }
  const sent = await sendResendContactEmail(parsed.value);
  if (!sent.ok) {
    const message = sent.reason === 'unconfigured' ? 'This form is not available right now.' : 'The message could not be sent. Try again.';
    return json(sent.reason === 'unconfigured' ? 503 : 502, {ok: false, message});
  }
  return json(200, {ok: true, message: 'Simple Outcome has your message.'});
}
