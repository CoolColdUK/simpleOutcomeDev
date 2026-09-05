import fpCan from './fpCan';
import {FpAction} from './fpAction';
import {FpResource} from './fpResource';
import fpDefaultPermission from './fpDefaultPermission';
import {PodRole} from '../space/podRole';

describe('fpCan', () => {
  it('denies when there is no role and the user is not space owner', () => {
    expect(fpCan(undefined, false, undefined, FpResource.TRANSACTION, FpAction.READ)).toBe(false);
  });

  it('treats space owner as pod owner', () => {
    expect(fpCan(undefined, true, undefined, FpResource.DELETE_ALL, FpAction.CREATE)).toBe(true);
  });

  it('uses defaults for pod_user', () => {
    expect(fpCan(PodRole.USER, false, fpDefaultPermission(), FpResource.PARSER, FpAction.CREATE)).toBe(false);
    expect(fpCan(PodRole.USER, false, fpDefaultPermission(), FpResource.TRANSACTION, FpAction.UPDATE)).toBe(true);
  });
});
