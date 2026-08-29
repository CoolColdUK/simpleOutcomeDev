import parseTodoColumnTitle from './parseTodoColumnTitle';

describe('parseTodoColumnTitle', () => {
  it('trims title', () => {
    expect(parseTodoColumnTitle('  To do  ')).toBe('To do');
  });

  it('rejects blank', () => {
    expect(() => parseTodoColumnTitle('  ')).toThrow();
  });
});
