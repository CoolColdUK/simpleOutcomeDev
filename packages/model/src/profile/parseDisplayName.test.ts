import parseDisplayName from './parseDisplayName';

describe('parseDisplayName', () => {
  it('trims whitespace', () => {
    expect(parseDisplayName('  Ada  ')).toBe('Ada');
  });

  it('allows an empty value', () => {
    expect(parseDisplayName('   ')).toBe('');
  });

  it('rejects values over 80 characters', () => {
    expect(() => parseDisplayName('a'.repeat(81))).toThrow();
  });
});
