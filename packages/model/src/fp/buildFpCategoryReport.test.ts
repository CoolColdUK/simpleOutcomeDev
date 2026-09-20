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

  it('rolls grouped leaves under a collapsed parent', () => {
    const {rows, totals} = buildFpCategoryReport(
      [
        {id: 't1', archived: false, postedDate: '2025-01-01', amount: -40, categoryId: 'elec'},
        {id: 't2', archived: false, postedDate: '2025-01-02', amount: -20, categoryId: 'water'},
        {id: 't3', archived: false, postedDate: '2025-01-03', amount: -15, categoryId: 'food'},
      ],
      [
        {id: 'bill', name: 'Bill', direction: FpCategoryDirection.EXPENSE, isGroup: true},
        {id: 'elec', name: 'Electricity', direction: FpCategoryDirection.EXPENSE, parentId: 'bill'},
        {id: 'water', name: 'Water', direction: FpCategoryDirection.EXPENSE, parentId: 'bill'},
        {id: 'food', name: 'Food', direction: FpCategoryDirection.EXPENSE},
      ],
      undefined,
      undefined,
    );
    expect(rows).toEqual([
      {
        categoryId: 'bill',
        name: 'Bill',
        direction: undefined,
        amount: -60,
        isGroup: true,
        children: [
          {categoryId: 'elec', name: 'Electricity', direction: FpCategoryDirection.EXPENSE, amount: -40},
          {categoryId: 'water', name: 'Water', direction: FpCategoryDirection.EXPENSE, amount: -20},
        ],
      },
      {categoryId: 'food', name: 'Food', direction: FpCategoryDirection.EXPENSE, amount: -15},
    ]);
    expect(totals.expense).toBe(-75);
  });

  it('allows mixed directions under one group without using parent direction for totals', () => {
    const {rows, totals} = buildFpCategoryReport(
      [
        {id: 't1', archived: false, postedDate: '2025-01-01', amount: -30, categoryId: 'out'},
        {id: 't2', archived: false, postedDate: '2025-01-02', amount: 50, categoryId: 'in'},
      ],
      [
        {id: 'misc', name: 'Misc', direction: FpCategoryDirection.EXPENSE, isGroup: true},
        {id: 'out', name: 'Out', direction: FpCategoryDirection.EXPENSE, parentId: 'misc'},
        {id: 'in', name: 'In', direction: FpCategoryDirection.INCOME, parentId: 'misc'},
      ],
      undefined,
      undefined,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.amount).toBe(20);
    expect(rows[0]?.isGroup).toBe(true);
    expect(totals.expense).toBe(-30);
    expect(totals.income).toBe(50);
  });

  it('keeps uncategorised at the top level', () => {
    const {rows, totals} = buildFpCategoryReport(
      [{id: 't1', archived: false, postedDate: '2025-01-01', amount: -5}],
      [],
      undefined,
      undefined,
    );
    expect(rows).toEqual([{categoryId: undefined, name: 'Uncategorised', direction: undefined, amount: -5}]);
    expect(totals.expense).toBe(-5);
  });
});
