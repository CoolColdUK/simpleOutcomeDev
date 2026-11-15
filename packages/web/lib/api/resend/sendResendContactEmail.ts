import {SITE_MESSAGE_FROM, siteMessageRecipient, siteMessageSubject} from '@so/model';

export interface ResendContactEmail {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

export type ResendContactEmailResult =
  | {readonly ok: true; readonly id: string}
  | {readonly ok: false; readonly reason: 'unconfigured' | 'refused'};

const BUSINESS_NAME = 'Simple Outcome';
const SITE_SLUG = 'simpleoutcome';

export async function sendResendContactEmail(input: ResendContactEmail): Promise<ResendContactEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  const recipient = siteMessageRecipient({status: 'demo', deliveryEmail: undefined});
  if (apiKey.length === 0 || recipient === undefined) {
    return {ok: false, reason: 'unconfigured'};
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      from: SITE_MESSAGE_FROM,
      to: [recipient],
      reply_to: input.email,
      subject: siteMessageSubject('demo', input.name, BUSINESS_NAME),
      text: `${input.message}\n\nFrom: ${input.email}\nSite: ${SITE_SLUG}`,
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
