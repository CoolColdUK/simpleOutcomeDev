import parsePostedDate from './parsePostedDate';

describe('parsePostedDate', () => {
  it('parses DD/MM/YYYY', () => {
    expect(parsePostedDate('02/03/2025', 'DD/MM/YYYY')).toBe('2025-03-02');
  });

  it('parses ISO dates', () => {
    expect(parsePostedDate('2025-03-02', 'YYYY-MM-DD')).toBe('2025-03-02');
  });

  it('returns undefined for empty input', () => {
    expect(parsePostedDate('  ', 'YYYY-MM-DD')).toBeUndefined();
  });
});
