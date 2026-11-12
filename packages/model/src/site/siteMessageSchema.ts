import * as v from 'valibot';

export const SITE_MESSAGE_NAME_MAX = 80;
export const SITE_MESSAGE_BODY_MAX = 2000;
export const SITE_MESSAGE_TOKEN_MAX = 2048;

export const siteMessageRequestSchema = v.strictObject({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Enter a name'), v.maxLength(SITE_MESSAGE_NAME_MAX, 'Enter a name')),
  email: v.pipe(v.string(), v.trim(), v.email('Enter an email')),
  message: v.pipe(v.string(), v.trim(), v.minLength(1, 'Enter a message'), v.maxLength(SITE_MESSAGE_BODY_MAX, 'Enter a message')),
  company_website: v.literal(''),
  turnstileToken: v.pipe(v.string(), v.trim(), v.minLength(1, 'Confirm you are a person'), v.maxLength(SITE_MESSAGE_TOKEN_MAX, 'Confirm you are a person')),
});

export type SiteMessageRequest = v.InferOutput<typeof siteMessageRequestSchema>;

export interface SiteMessageParseSuccess {
  readonly ok: true;
  readonly value: SiteMessageRequest;
}

export interface SiteMessageParseFailure {
  readonly ok: false;
  readonly field: string;
  readonly message: string;
}

export function safeParseSiteMessage(input: unknown): SiteMessageParseSuccess | SiteMessageParseFailure {
  const result = v.safeParse(siteMessageRequestSchema, input);
  if (result.success) {
    return {ok: true, value: result.output};
  }
  const issue = result.issues[0];
  const key = issue?.path?.[0]?.key;
  return {
    ok: false,
    field: typeof key === 'string' ? key : 'message',
    message: issue?.message ?? 'Enter a message',
  };
}
