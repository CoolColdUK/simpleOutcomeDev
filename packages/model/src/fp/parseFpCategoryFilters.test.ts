import parseFpCategoryFilters from './parseFpCategoryFilters';

describe('parseFpCategoryFilters', () => {
  it('normalises rule strings', () => {
    expect(parseFpCategoryFilters(['recipient=H,amount<50'])).toEqual(['RECIPIENT=H,AMOUNT<50']);
  });

  it('drops invalid rule strings', () => {
    expect(parseFpCategoryFilters(['NOT_A_RULE', 'DESCRIPTION=ok'])).toEqual(['DESCRIPTION=ok']);
  });

  it('converts legacy description string objects', () => {
    expect(parseFpCategoryFilters([{descriptionContains: 'NETFLIX'}])).toEqual(['DESCRIPTION=NETFLIX']);
  });

  it('expands legacy description arrays into OR rules', () => {
    expect(parseFpCategoryFilters([{descriptionContains: ['toll', 'uber']}])).toEqual([
      'DESCRIPTION=toll',
      'DESCRIPTION=uber',
    ]);
  });

  it('keeps legacy amount as equality', () => {
    expect(parseFpCategoryFilters([{descriptionContains: ['netflix'], amount: -10}])).toEqual([
      'DESCRIPTION=netflix,AMOUNT=-10',
    ]);
  });
});
