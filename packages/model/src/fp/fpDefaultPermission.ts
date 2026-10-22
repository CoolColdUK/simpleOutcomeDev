import {FpAction} from './fpAction';
import {FpResource} from './fpResource';
import type {FpPermissionMatrix} from './fpPermissionMatrix';
import {PodRole} from '../space/podRole';

const allCrud: readonly FpAction[] = [FpAction.READ, FpAction.CREATE, FpAction.UPDATE, FpAction.DELETE];

const readOnly: readonly FpAction[] = [FpAction.READ];

export default function fpDefaultPermission(): FpPermissionMatrix {
  return {
    [PodRole.VIEWER]: {
      [FpResource.ACCOUNT]: readOnly,
      [FpResource.CATEGORY]: readOnly,
      [FpResource.TRANSACTION]: readOnly,
      [FpResource.PARSER]: readOnly,
      [FpResource.IMPORT]: readOnly,
      [FpResource.BILL_SPLIT]: [],
      [FpResource.SETTINGS]: readOnly,
      [FpResource.DELETE_ALL]: [],
    },
    [PodRole.USER]: {
      [FpResource.ACCOUNT]: [FpAction.READ, FpAction.CREATE, FpAction.UPDATE],
      [FpResource.CATEGORY]: [FpAction.READ, FpAction.CREATE, FpAction.UPDATE],
      [FpResource.TRANSACTION]: [FpAction.READ, FpAction.CREATE, FpAction.UPDATE],
      [FpResource.PARSER]: [FpAction.READ],
      [FpResource.IMPORT]: [FpAction.READ],
      [FpResource.BILL_SPLIT]: [FpAction.CREATE, FpAction.UPDATE],
      [FpResource.SETTINGS]: [FpAction.READ],
      [FpResource.DELETE_ALL]: [],
    },
    [PodRole.ADMIN]: {
      [FpResource.ACCOUNT]: allCrud,
      [FpResource.CATEGORY]: allCrud,
      [FpResource.TRANSACTION]: allCrud,
      [FpResource.PARSER]: allCrud,
      [FpResource.IMPORT]: [FpAction.READ, FpAction.CREATE, FpAction.DELETE],
      [FpResource.BILL_SPLIT]: [FpAction.CREATE, FpAction.UPDATE],
      [FpResource.SETTINGS]: [FpAction.READ],
      [FpResource.DELETE_ALL]: [],
    },
    [PodRole.OWNER]: {
      [FpResource.ACCOUNT]: allCrud,
      [FpResource.CATEGORY]: allCrud,
      [FpResource.TRANSACTION]: allCrud,
      [FpResource.PARSER]: allCrud,
      [FpResource.IMPORT]: [FpAction.READ, FpAction.CREATE, FpAction.DELETE],
      [FpResource.BILL_SPLIT]: [FpAction.CREATE, FpAction.UPDATE, FpAction.DELETE],
      [FpResource.SETTINGS]: [FpAction.READ, FpAction.UPDATE],
      [FpResource.DELETE_ALL]: [FpAction.CREATE],
    },
  };
}
