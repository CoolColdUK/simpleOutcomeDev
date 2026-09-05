import {FpAction} from './fpAction';
import {FpResource} from './fpResource';
import type {FpPermissionMatrix} from './fpPermissionMatrix';
import fpDefaultPermission from './fpDefaultPermission';
import {PodRole} from '../space/podRole';

export default function fpCan(
  podRole: PodRole | undefined,
  isSpaceOwner: boolean,
  permission: FpPermissionMatrix | undefined,
  resource: FpResource,
  action: FpAction,
): boolean {
  const role = isSpaceOwner ? PodRole.OWNER : podRole;
  if (role === undefined) {
    return false;
  }
  const matrix = permission ?? fpDefaultPermission();
  const actions = matrix[role][resource];
  return actions.includes(action);
}
