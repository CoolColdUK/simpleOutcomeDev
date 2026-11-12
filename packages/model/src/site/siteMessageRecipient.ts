export const SITE_MESSAGE_DEMO_RECIPIENT = 'info@simpleoutcome.dev';

export const SITE_MESSAGE_FROM = 'Website enquiry via Simple Outcome <info@simpleoutcome.dev>';

export interface SiteMessageRecipientInput {
  readonly status: 'demo' | 'live';
  readonly deliveryEmail: string | undefined;
}

export function siteMessageRecipient(input: SiteMessageRecipientInput): string | undefined {
  if (input.status === 'demo') {
    return SITE_MESSAGE_DEMO_RECIPIENT;
  }
  const email = input.deliveryEmail?.trim() ?? '';
  if (email.length === 0 || !email.includes('@') || email.includes(' ')) {
    return undefined;
  }
  return email;
}

export function siteMessageFormOffered(messagesEnabled: boolean): boolean {
  return messagesEnabled;
}

export function siteMessageSubject(status: 'demo' | 'live', name: string, businessName: string): string {
  const visitor = name.replace(/[\r\n]+/g, ' ').trim();
  const business = businessName.replace(/[\r\n]+/g, ' ').trim();
  if (status === 'demo') {
    return `New lead from ${visitor} via ${business}`;
  }
  return `Message from ${visitor} via ${business}`;
}
