import {FpCategoryDirection} from './fpCategoryDirection';
import buildFpCategoryDisplayRows from './buildFpCategoryDisplayRows';

describe('buildFpCategoryDisplayRows', () => {
  it('sorts top level by direction and nests children under parent', () => {
    const rows = buildFpCategoryDisplayRows([
      {id: 'food', name: 'Food', direction: FpCategoryDirection.EXPENSE, favourite: false, sortOrder: 0, isGroup: false},
      {
        id: 'salary',
        name: 'Salary',
        direction: FpCategoryDirection.INCOME,
        favourite: false,
        sortOrder: 0,
        isGroup: false,
      },
      {
        id: 'bills',
        name: 'Bills',
        direction: FpCategoryDirection.EXPENSE,
        favourite: false,
        sortOrder: 0,
        isGroup: true,
      },
      {
        id: 'elec',
        name: 'Electricity',
        direction: FpCategoryDirection.EXPENSE,
        favourite: false,
        sortOrder: 0,
        isGroup: false,
        parentId: 'bills',
      },
      {
        id: 'refund',
        name: 'Refund',
        direction: FpCategoryDirection.INCOME,
        favourite: false,
        sortOrder: 0,
        isGroup: false,
        parentId: 'bills',
      },
    ]);
    expect(rows.map((r) => r.category.id)).toEqual(['salary', 'bills', 'refund', 'elec', 'food']);
    expect(rows.find((r) => r.category.id === 'refund')?.isChild).toBe(true);
    expect(rows.find((r) => r.category.id === 'salary')?.isChild).toBe(false);
  });

  it('sorts children within a group by direction only among siblings', () => {
    const rows = buildFpCategoryDisplayRows([
      {
        id: 'misc',
        name: 'Misc',
        direction: FpCategoryDirection.EXPENSE,
        favourite: false,
        sortOrder: 0,
        isGroup: true,
      },
      {
        id: 'out',
        name: 'Out',
        direction: FpCategoryDirection.EXPENSE,
        favourite: false,
        sortOrder: 0,
        isGroup: false,
        parentId: 'misc',
      },
      {
        id: 'in',
        name: 'In',
        direction: FpCategoryDirection.INCOME,
        favourite: false,
        sortOrder: 0,
        isGroup: false,
        parentId: 'misc',
      },
    ]);
    expect(rows.map((r) => r.category.id)).toEqual(['misc', 'in', 'out']);
  });
});
