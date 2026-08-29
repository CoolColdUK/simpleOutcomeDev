import parseTodoCardTags from './parseTodoCardTags';

describe('parseTodoCardTags', () => {
  it('accepts tags', () => {
    expect(parseTodoCardTags(['bug', 'ui'])).toEqual(['bug', 'ui']);
  });

  it('rejects blank tag', () => {
    expect(() => parseTodoCardTags([''])).toThrow();
  });
});
