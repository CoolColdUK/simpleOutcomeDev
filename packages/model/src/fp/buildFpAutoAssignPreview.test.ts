import buildFpAutoAssignPreview from './buildFpAutoAssignPreview';

describe('buildFpAutoAssignPreview', () => {
  it('returns only uncategorised transactions that match exactly one category', () => {
    const rows = buildFpAutoAssignPreview(
      [
        {
          id: 't1',
          postedDate: '2026-01-01',
          description: 'NETFLIX',
          recipient: '',
          amount: -15.99,
          archived: false,
        },
        {
          id: 't2',
          postedDate: '2026-01-02',
          description: 'SALARY',
          recipient: '',
          amount: 2000,
          archived: false,
          categoryId: 'existing',
        },
        {
          id: 't3',
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
        transactionId: 't1',
        postedDate: '2026-01-01',
        description: 'NETFLIX',
        recipient: '',
        amount: -15.99,
        categoryId: 'c1',
      },
    ]);
  });

  it('skips archived transactions', () => {
    const rows = buildFpAutoAssignPreview(
      [
        {
          id: 't1',
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
