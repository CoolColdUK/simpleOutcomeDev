import {safeParseSiteMessage, siteMessageFormOffered, siteMessageRecipient} from '@so/model';
import {NextResponse} from 'next/server';
import {allowSiteMessage} from '@/lib/siteMessage/allowSiteMessage';
import {readLiveDeliveryEmail, recordSiteEnquiry} from '@/lib/siteMessage/siteEnquiryStore';
import {sendSiteMessage} from '@/lib/siteMessage/sendSiteMessage';
import {verifyTurnstile} from '@/lib/siteMessage/verifyTurnstile';
import {loadSiteForHost, type LoadedSite} from '@/lib/site/loadSiteForHost';

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

function requestHost(request: Request): string {
  return request.headers.get('x-site-host') ?? request.headers.get('host') ?? '';
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

async function deliveryEmailFor(site: LoadedSite): Promise<string | undefined | 'unconfigured'> {
  if (site.status !== 'live') {
    return undefined;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() ?? '';
  if (url.length === 0 || secret.length === 0 || site.id === undefined) {
    return 'unconfigured';
  }
  return readLiveDeliveryEmail(site.id);
}

export async function POST(request: Request) {
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
  const turnstile = await verifyTurnstile(parsed.value.turnstileToken, clientIp(request));
  if (turnstile === undefined) {
    return json(503, {ok: false, message: 'This form is not available right now.'});
  }
  if (!turnstile) {
    return json(400, {ok: false, field: 'turnstileToken', message: 'Confirm you are a person'});
  }
  const site = await loadSiteForHost(requestHost(request));
  if (site === undefined) {
    return json(404, {ok: false, message: 'This site was not found.'});
  }
  if (!siteMessageFormOffered(site.messagesEnabled)) {
    return json(403, {ok: false, message: 'This form is turned off.'});
  }
  const limit = await allowSiteMessage(site.id ?? site.slug, clientIp(request)).catch(() => 'unavailable' as const);
  if (limit === 'unavailable') {
    return json(503, {ok: false, message: 'This form is not available right now.'});
  }
  if (limit === 'limit') {
    return json(429, {ok: false, message: 'Too many messages. Try again later.'});
  }
  const deliveryEmail = await deliveryEmailFor(site);
  if (deliveryEmail === 'unconfigured') {
    return json(503, {ok: false, message: 'This form is not available right now.'});
  }
  const messageStatus = site.status === 'demo' ? 'demo' : 'live';
  const recipient = siteMessageRecipient({status: messageStatus, deliveryEmail});
  if (recipient === undefined) {
    return json(422, {ok: false, message: 'This salon is not accepting messages.'});
  }
  const sent = await sendSiteMessage({
    status: messageStatus,
    recipient,
    name: parsed.value.name,
    email: parsed.value.email,
    message: parsed.value.message,
    businessName: site.document.businessName,
    slug: site.slug,
  });
  if (!sent.ok) {
    const message = sent.reason === 'unconfigured' ? 'This form is not available right now.' : 'The message could not be sent. Try again.';
    return json(sent.reason === 'unconfigured' ? 503 : 502, {ok: false, message});
  }
  if (site.id !== undefined) {
    await recordSiteEnquiry(site.id, sent.id, site.status === 'live').catch(() => undefined);
  }
  const message = site.status === 'demo' ? 'Simple Outcome has your message.' : 'Message sent.';
  return json(200, {ok: true, message});
}
