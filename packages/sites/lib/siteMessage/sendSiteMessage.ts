import {SITE_MESSAGE_FROM, siteMessageSubject} from '@so/model';

export interface SiteMessageEmail {
  readonly status: 'demo' | 'live';
  readonly recipient: string;
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly businessName: string;
  readonly slug: string;
}

export type SiteMessageSendResult =
  | {readonly ok: true; readonly id: string}
  | {readonly ok: false; readonly reason: 'unconfigured' | 'refused'};

export async function sendSiteMessage(input: SiteMessageEmail): Promise<SiteMessageSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  if (apiKey.length === 0) {
    return {ok: false, reason: 'unconfigured'};
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      from: SITE_MESSAGE_FROM,
      to: [input.recipient],
      reply_to: input.email,
      subject: siteMessageSubject(input.status, input.name, input.businessName),
      text: `${input.message}\n\nFrom: ${input.email}\nSite: ${input.slug}`,
    }),
  });
  if (!response.ok) {
    return {ok: false, reason: 'refused'};
  }
  const payload = (await response.json()) as {readonly id?: unknown};
  if (typeof payload.id !== 'string' || payload.id.length === 0) {
    return {ok: false, reason: 'refused'};
  }
  return {ok: true, id: payload.id};
}
