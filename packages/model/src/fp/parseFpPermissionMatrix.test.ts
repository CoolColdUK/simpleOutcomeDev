import parseFpPermissionMatrix from './parseFpPermissionMatrix';
import {PodRole} from '../space/podRole';
import {FpResource} from './fpResource';
import {FpAction} from './fpAction';

describe('parseFpPermissionMatrix', () => {
  it('falls back for invalid input', () => {
    const matrix = parseFpPermissionMatrix(undefined);
    expect(matrix[PodRole.USER][FpResource.TRANSACTION]).toContain(FpAction.READ);
  });

  it('merges a custom owner delete_all', () => {
    const matrix = parseFpPermissionMatrix({
      pod_owner: {delete_all: ['create']},
    });
    expect(matrix[PodRole.OWNER][FpResource.DELETE_ALL]).toEqual([FpAction.CREATE]);
  });
});
