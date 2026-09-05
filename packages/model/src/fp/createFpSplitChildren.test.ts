import createFpSplitChildren from './createFpSplitChildren';
import {FpSplitRecurrence} from './fpSplitRecurrence';

describe('createFpSplitChildren', () => {
  it('splits twelve monthly portions with remainder on the last child', () => {
    const children = createFpSplitChildren(-100, '2025-01-31', 12, FpSplitRecurrence.MONTHLY);
    expect(children).toHaveLength(12);
    const sum = children.reduce((acc, c) => acc + c.amount, 0);
    expect(Math.round(sum * 100)).toBe(-10000);
    expect(children[0]?.postedDate).toBe('2025-01-31');
    expect(children[1]?.postedDate).toBe('2025-02-28');
  });

  it('rejects fewer than two portions', () => {
    expect(createFpSplitChildren(-10, '2025-01-01', 1, FpSplitRecurrence.MONTHLY)).toEqual([]);
  });
});
