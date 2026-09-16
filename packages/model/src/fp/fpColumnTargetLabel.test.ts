import fpColumnTargetLabel from './fpColumnTargetLabel';
import {FpColumnTarget} from './fpColumnTarget';

describe('fpColumnTargetLabel', () => {
  it('labels external id', () => {
    expect(fpColumnTargetLabel(FpColumnTarget.EXTERNAL_ID)).toBe('External ID');
  });
});
