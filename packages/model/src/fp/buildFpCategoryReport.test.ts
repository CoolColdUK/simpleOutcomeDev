import buildFpCategoryReport from './buildFpCategoryReport';
import {FpCategoryDirection} from './fpCategoryDirection';

describe('buildFpCategoryReport', () => {
  it('uses children not the split parent', () => {
    const {rows, totals} = buildFpCategoryReport(
      [
        {id: 'p', archived: false, postedDate: '2025-01-01', amount: -120, categoryId: 'ins'},
        {id: 'c1', parentId: 'p', archived: false, postedDate: '2025-01-01', amount: -10, categoryId: 'ins'},
        {id: 'c2', parentId: 'p', archived: false, postedDate: '2025-02-01', amount: -10, categoryId: 'ins'},
      ],
      [{id: 'ins', name: 'Insurance', direction: FpCategoryDirection.EXPENSE}],
      '2025-01-01',
      '2025-01-31',
    );
    expect(rows).toEqual([{categoryId: 'ins', name: 'Insurance', direction: FpCategoryDirection.EXPENSE, amount: -10}]);
    expect(totals.expense).toBe(-10);
  });

  it('omits transfer from income and expense', () => {
    const {totals} = buildFpCategoryReport(
      [{id: 't', archived: false, postedDate: '2025-01-01', amount: -50, categoryId: 'tr'}],
      [{id: 'tr', name: 'Move', direction: FpCategoryDirection.TRANSFER}],
      undefined,
      undefined,
    );
    expect(totals.expense).toBe(0);
    expect(totals.income).toBe(0);
  });
});
