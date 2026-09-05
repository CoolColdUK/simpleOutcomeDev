import fpIsDuplicate from './fpIsDuplicate';
import type {FpDuplicateFields} from './fpDuplicateKey';

const base: FpDuplicateFields = {
  accountId: 'a',
  postedDate: '2025-01-01',
  amount: -3,
  description: 'Coffee',
  recipient: '',
};

describe('fpIsDuplicate', () => {
  it('matches external id on the same account', () => {
    expect(fpIsDuplicate({...base, externalId: 'x'}, {...base, externalId: 'x', description: 'other'})).toBe(true);
  });

  it('keeps same-day repeats when comparing only incoming rows', () => {
    expect(fpIsDuplicate(base, base)).toBe(true);
  });

  it('uses time only when both have time', () => {
    expect(fpIsDuplicate({...base, postedTime: '10:00:00'}, {...base, postedTime: '11:00:00'})).toBe(false);
    expect(fpIsDuplicate({...base, postedTime: '10:00:00'}, base)).toBe(true);
  });

  it('does not match across accounts', () => {
    expect(fpIsDuplicate(base, {...base, accountId: 'b'})).toBe(false);
  });
});
