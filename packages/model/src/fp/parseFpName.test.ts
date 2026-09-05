import parseFpName from './parseFpName';

describe('parseFpName', () => {
  it('trims', () => {
    expect(parseFpName('  Current  ')).toBe('Current');
  });

  it('rejects blank', () => {
    expect(() => parseFpName('  ')).toThrow();
  });
});
