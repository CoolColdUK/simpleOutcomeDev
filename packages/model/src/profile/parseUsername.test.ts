import parseUsername from './parseUsername';

describe('parseUsername', () => {
  it('accepts a valid handle', () => {
    expect(parseUsername('Cool_User1')).toBe('Cool_User1');
  });

  it('trims whitespace', () => {
    expect(parseUsername('  ada  ')).toBe('ada');
  });

  it('rejects too short values', () => {
    expect(() => parseUsername('ab')).toThrow();
  });

  it('rejects invalid characters', () => {
    expect(() => parseUsername('bad name')).toThrow();
  });
});
