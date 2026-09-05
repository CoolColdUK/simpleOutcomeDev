import parseCsv from './parseCsv';

describe('parseCsv', () => {
  it('splits quoted commas', () => {
    expect(parseCsv('a,"b,c",d')).toEqual([['a', 'b,c', 'd']]);
  });

  it('skips empty trailing lines', () => {
    expect(parseCsv('a,b\n\n')).toEqual([['a', 'b']]);
  });

  it('uses a custom delimiter', () => {
    expect(parseCsv('a;b', ';')).toEqual([['a', 'b']]);
  });
});
