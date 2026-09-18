import parseFpCategoryFilters from './parseFpCategoryFilters';

describe('parseFpCategoryFilters', () => {
  it('wraps a legacy description string as a one-item array', () => {
    expect(parseFpCategoryFilters([{descriptionContains: 'NETFLIX'}])).toEqual([
      {descriptionContains: ['NETFLIX']},
    ]);
  });

  it('keeps multiple description patterns', () => {
    expect(parseFpCategoryFilters([{descriptionContains: ['toll', 'uber']}])).toEqual([
      {descriptionContains: ['toll', 'uber']},
    ]);
  });
});
