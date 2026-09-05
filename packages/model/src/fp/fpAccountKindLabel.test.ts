import fpAccountKindLabel from './fpAccountKindLabel';
import {FpAccountKind} from './fpAccountKind';

describe('fpAccountKindLabel', () => {
  it('labels current', () => {
    expect(fpAccountKindLabel(FpAccountKind.CURRENT)).toBe('Current');
  });
});
