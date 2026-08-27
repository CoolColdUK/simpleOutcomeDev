import safeParseContactRequest from './safeParseContactRequest';

describe('safeParseContactRequest', () => {
  it('returns the parsed payload when valid', () => {
    expect(
      safeParseContactRequest({
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Hello',
      }),
    ).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello',
    });
  });

  it('returns undefined when invalid', () => {
    expect(
      safeParseContactRequest({
        name: 'Ada',
        email: 'bad',
        message: 'Hello',
      }),
    ).toBeUndefined();
  });
});
