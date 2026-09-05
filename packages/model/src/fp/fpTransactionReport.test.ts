import {fpCountsTowardBalance, fpCountsTowardCategoryReport, fpInDateRange} from './fpTransactionReport';

describe('fpTransactionReport', () => {
  it('excludes children from balance', () => {
    expect(fpCountsTowardBalance(false, 'parent')).toBe(false);
    expect(fpCountsTowardBalance(false, undefined)).toBe(true);
    expect(fpCountsTowardBalance(true, undefined)).toBe(false);
  });

  it('excludes split parents from category report', () => {
    const parents = new Set(['p1']);
    expect(fpCountsTowardCategoryReport(false, 'p1', undefined, parents)).toBe(false);
    expect(fpCountsTowardCategoryReport(false, 'c1', 'p1', parents)).toBe(true);
    expect(fpCountsTowardCategoryReport(false, 'x', undefined, parents)).toBe(true);
  });

  it('filters by date range inclusive', () => {
    expect(fpInDateRange('2025-02-10', '2025-02-01', '2025-02-28')).toBe(true);
    expect(fpInDateRange('2025-03-01', '2025-02-01', '2025-02-28')).toBe(false);
  });
});
