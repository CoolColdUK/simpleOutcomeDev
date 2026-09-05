import {FpAction} from './fpAction';
import {FpResource} from './fpResource';
import {PodRole} from '../space/podRole';

export type FpPermissionMatrix = Record<PodRole, Record<FpResource, readonly FpAction[]>>;
