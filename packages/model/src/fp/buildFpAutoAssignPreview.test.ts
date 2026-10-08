import buildFpAutoAssignPreview from './buildFpAutoAssignPreview';

describe('buildFpAutoAssignPreview', () => {
  it('returns only uncategorised transactions that match exactly one category', () => {
    const rows = buildFpAutoAssignPreview(
      [
        {
          id: 't1',
          accountId: 'acc1',
          postedDate: '2026-01-01',
          description: 'NETFLIX',
          recipient: 'Netflix Inc',
          amount: -15.99,
          archived: false,
        },
        {
          id: 't2',
          accountId: 'acc1',
          postedDate: '2026-01-02',
          description: 'SALARY',
          recipient: '',
          amount: 2000,
          archived: false,
          categoryId: 'existing',
        },
        {
          id: 't3',
          accountId: 'acc2',
          postedDate: '2026-01-03',
          description: 'UNKNOWN',
          recipient: '',
          amount: -1,
          archived: false,
        },
      ],
      [{id: 'c1', filters: ['DESCRIPTION=netflix']}],
    );
    expect(rows).toEqual([
      {
        kind: 'unique',
        transactionId: 't1',
        accountId: 'acc1',
        postedDate: '2026-01-01',
        description: 'NETFLIX',
        recipient: 'Netflix Inc',
        amount: -15.99,
        categoryId: 'c1',
      },
    ]);
  });

  it('returns ambiguous rows when multiple categories match', () => {
    const rows = buildFpAutoAssignPreview(
      [
        {
          id: 't1',
          accountId: 'acc1',
          postedDate: '2026-01-01',
          description: 'NETFLIX SUB',
          recipient: '',
          amount: -15.99,
          archived: false,
        },
      ],
      [
        {id: 'c1', filters: ['DESCRIPTION=net']},
        {id: 'c2', filters: ['DESCRIPTION=flix']},
      ],
    );
    expect(rows).toEqual([
      {
        kind: 'ambiguous',
        transactionId: 't1',
        accountId: 'acc1',
        postedDate: '2026-01-01',
        description: 'NETFLIX SUB',
        recipient: '',
        amount: -15.99,
        categoryIds: ['c1', 'c2'],
      },
    ]);
  });

  it('skips archived transactions', () => {
    const rows = buildFpAutoAssignPreview(
      [
        {
          id: 't1',
          accountId: 'acc1',
          postedDate: '2026-01-01',
          description: 'NETFLIX',
          recipient: '',
          amount: -15.99,
          archived: true,
        },
      ],
      [{id: 'c1', filters: ['DESCRIPTION=netflix']}],
    );
    expect(rows).toEqual([]);
  });
});
