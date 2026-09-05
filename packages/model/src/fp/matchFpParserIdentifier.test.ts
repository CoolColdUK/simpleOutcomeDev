import matchFpParserIdentifier from './matchFpParserIdentifier';

describe('matchFpParserIdentifier', () => {
  it('matches trimmed first lines', () => {
    expect(matchFpParserIdentifier(' Date,Amount ', 'Date,Amount')).toBe(true);
  });

  it('does not match an empty identifier', () => {
    expect(matchFpParserIdentifier('Date,Amount', undefined)).toBe(false);
  });
});
