import parseTodoCardTitle from './parseTodoCardTitle';

describe('parseTodoCardTitle', () => {
  it('accepts a title', () => {
    expect(parseTodoCardTitle('Ship')).toBe('Ship');
  });

  it('rejects empty', () => {
    expect(() => parseTodoCardTitle('')).toThrow();
  });
});
