import parseContactRequest from './parseContactRequest';

describe('parseContactRequest', () => {
  it('accepts a valid contact payload', () => {
    expect(
      parseContactRequest({
        name: ' Ada ',
        email: ' ada@example.com ',
        message: ' Hello ',
      }),
    ).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello',
    });
  });

  it('rejects an invalid email', () => {
    expect(() =>
      parseContactRequest({
        name: 'Ada',
        email: 'not-an-email',
        message: 'Hello',
      }),
    ).toThrow();
  });

  it('rejects empty fields', () => {
    expect(() =>
      parseContactRequest({
        name: '  ',
        email: 'ada@example.com',
        message: 'Hello',
      }),
    ).toThrow();
  });
});
