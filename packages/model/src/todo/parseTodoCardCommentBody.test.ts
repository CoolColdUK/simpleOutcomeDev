import parseTodoCardCommentBody from './parseTodoCardCommentBody';

describe('parseTodoCardCommentBody', () => {
  it('accepts text', () => {
    expect(parseTodoCardCommentBody(' looks good ')).toBe('looks good');
  });

  it('rejects empty', () => {
    expect(() => parseTodoCardCommentBody('')).toThrow();
  });
});
