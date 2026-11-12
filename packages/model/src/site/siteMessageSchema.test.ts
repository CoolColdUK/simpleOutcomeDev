import {safeParseSiteMessage} from './siteMessageSchema';

const valid = {
  name: 'Ada',
  email: 'ada@example.com',
  message: 'Hello',
  company_website: '',
  turnstileToken: 'token',
};

describe('safeParseSiteMessage', () => {
  it('rejects an empty message and a message over 2000 characters', () => {
    expect(safeParseSiteMessage({...valid, message: ''}).ok).toBe(false);
    expect(safeParseSiteMessage({...valid, message: '  '}).ok).toBe(false);
    expect(safeParseSiteMessage({...valid, message: 'a'.repeat(2001)}).ok).toBe(false);
    expect(safeParseSiteMessage({...valid, message: 'a'.repeat(2000)}).ok).toBe(true);
  });

  it('asks for an email when the address is missing', () => {
    const result = safeParseSiteMessage({...valid, email: 'not-an-email'});
    expect(result).toEqual({ok: false, field: 'email', message: 'Enter an email'});
  });
});
