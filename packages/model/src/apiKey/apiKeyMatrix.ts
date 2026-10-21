import {FpResource} from '../fp/fpResource';
import {FeatureKind} from '../space/featureKind';
import {ApiKeyAction} from './apiKeyAction';
import type {ApiKeyFpGrant, ApiKeyPermissions, ApiKeyPodGrant, ApiKeySpaceGrant} from './apiKeyPermissions';
import {ApiKeyPresetId} from './apiKeyPreset';

const ACTIONS: readonly ApiKeyAction[] = [ApiKeyAction.CREATE, ApiKeyAction.READ, ApiKeyAction.UPDATE, ApiKeyAction.DELETE];

const FP_RESOURCES: readonly FpResource[] = [
  FpResource.ACCOUNT,
  FpResource.CATEGORY,
  FpResource.TRANSACTION,
  FpResource.PARSER,
  FpResource.IMPORT,
  FpResource.BILL_SPLIT,
  FpResource.SETTINGS,
];

export interface ApiKeyMatrixCells {
  readonly create: boolean;
  readonly read: boolean;
  readonly update: boolean;
  readonly delete: boolean;
}

export type ApiKeyMatrixCheck = 'on' | 'off' | 'mixed';

export interface ApiKeyMatrixPodInput {
  readonly podId: string;
  readonly spaceId: string;
  readonly spaceName: string;
  readonly podName: string;
  readonly feature: FeatureKind;
}

export interface ApiKeyMatrixSpaceInput {
  readonly spaceId: string;
  readonly spaceName: string;
}

export interface ApiKeyMatrixPodRow {
  readonly podId: string;
  readonly spaceId: string;
  readonly spaceName: string;
  readonly podName: string;
  readonly feature: FeatureKind;
  readonly cells: ApiKeyMatrixCells;
}

export interface ApiKeyMatrixSpaceSection {
  readonly spaceId: string;
  readonly spaceName: string;
  readonly space: ApiKeyMatrixCells;
  readonly group: ApiKeyMatrixCells;
}

export interface ApiKeyPermissionMatrix {
  readonly pods: readonly ApiKeyMatrixPodRow[];
  readonly spaces: readonly ApiKeyMatrixSpaceSection[];
}

export type ApiKeySpaceResource = 'space' | 'group';

const OFF: ApiKeyMatrixCells = {create: false, read: false, update: false, delete: false};
const ON: ApiKeyMatrixCells = {create: true, read: true, update: true, delete: true};
const READ: ApiKeyMatrixCells = {create: false, read: true, update: false, delete: false};

function cellValue(cells: ApiKeyMatrixCells, action: ApiKeyAction): boolean {
  if (action === ApiKeyAction.CREATE) {
    return cells.create;
  }
  if (action === ApiKeyAction.READ) {
    return cells.read;
  }
  if (action === ApiKeyAction.UPDATE) {
    return cells.update;
  }
  return cells.delete;
}

function withAction(cells: ApiKeyMatrixCells, action: ApiKeyAction, value: boolean): ApiKeyMatrixCells {
  if (action === ApiKeyAction.CREATE) {
    return {...cells, create: value};
  }
  if (action === ApiKeyAction.READ) {
    return {...cells, read: value};
  }
  if (action === ApiKeyAction.UPDATE) {
    return {...cells, update: value};
  }
  return {...cells, delete: value};
}

function filled(on: boolean): ApiKeyMatrixCells {
  return on ? ON : OFF;
}

function compareName(left: string, right: string): number {
  return left.localeCompare(right);
}

function podCells(preset: ApiKeyPresetId, feature: FeatureKind): ApiKeyMatrixCells {
  if (preset === ApiKeyPresetId.ALL_ON) {
    return ON;
  }
  if (preset === ApiKeyPresetId.TODO_READ_WRITE && feature === FeatureKind.TODO_LIST) {
    return ON;
  }
  if (preset === ApiKeyPresetId.TODO_READ && feature === FeatureKind.TODO_LIST) {
    return READ;
  }
  if (preset === ApiKeyPresetId.FP_READ && feature === FeatureKind.FINANCIAL_PLANNING) {
    return READ;
  }
  return OFF;
}

function spaceCells(preset: ApiKeyPresetId, resource: ApiKeySpaceResource): ApiKeyMatrixCells {
  if (preset === ApiKeyPresetId.ALL_ON) {
    return ON;
  }
  if (preset === ApiKeyPresetId.SPACE_READ && resource === 'space') {
    return READ;
  }
  if (preset === ApiKeyPresetId.GROUP_READ && resource === 'group') {
    return READ;
  }
  return OFF;
}

function actionsFromCells(cells: ApiKeyMatrixCells): readonly ApiKeyAction[] {
  return ACTIONS.filter((action) => cellValue(cells, action));
}

function fpGrant(actions: readonly ApiKeyAction[]): ApiKeyFpGrant {
  return {
    account: actions,
    category: actions,
    transaction: actions,
    parser: actions,
    import: actions,
    bill_split: actions,
    settings: actions,
  };
}

function podGrant(row: ApiKeyMatrixPodRow): ApiKeyPodGrant | undefined {
  const actions = actionsFromCells(row.cells);
  if (actions.length === 0) {
    return undefined;
  }
  if (row.feature === FeatureKind.TODO_LIST) {
    return {todo: actions};
  }
  if (row.feature === FeatureKind.SHOPPING_LIST) {
    return {shopping: actions};
  }
  return {fp: fpGrant(actions)};
}

function spaceGrant(section: ApiKeyMatrixSpaceSection): ApiKeySpaceGrant | undefined {
  const space = actionsFromCells(section.space);
  const group = actionsFromCells(section.group);
  if (space.length === 0 && group.length === 0) {
    return undefined;
  }
  return {
    ...(space.length === 0 ? {} : {space}),
    ...(group.length === 0 ? {} : {group}),
  };
}

export function apiKeyMatrixCellsCheck(cells: ApiKeyMatrixCells): ApiKeyMatrixCheck {
  const values = ACTIONS.map((action) => cellValue(cells, action));
  if (values.every((value) => value)) {
    return 'on';
  }
  if (values.some((value) => value)) {
    return 'mixed';
  }
  return 'off';
}

export function apiKeyMatrixColumnCheck(rows: readonly ApiKeyMatrixCells[], action: ApiKeyAction): ApiKeyMatrixCheck {
  if (rows.length === 0) {
    return 'off';
  }
  const values = rows.map((row) => cellValue(row, action));
  if (values.every((value) => value)) {
    return 'on';
  }
  if (values.some((value) => value)) {
    return 'mixed';
  }
  return 'off';
}

export function createApiKeyMatrix(pods: readonly ApiKeyMatrixPodInput[], spaces: readonly ApiKeyMatrixSpaceInput[]): ApiKeyPermissionMatrix {
  return apiKeyMatrixForPreset(ApiKeyPresetId.ALL_OFF, pods, spaces);
}

export function apiKeyMatrixForPreset(
  preset: ApiKeyPresetId,
  pods: readonly ApiKeyMatrixPodInput[],
  spaces: readonly ApiKeyMatrixSpaceInput[],
): ApiKeyPermissionMatrix {
  const podRows = [...pods]
    .sort((left, right) => compareName(left.spaceName, right.spaceName) || compareName(left.podName, right.podName))
    .map((pod) => ({...pod, cells: podCells(preset, pod.feature)}));
  const spaceRows = [...spaces]
    .sort((left, right) => compareName(left.spaceName, right.spaceName))
    .map((space) => ({
      spaceId: space.spaceId,
      spaceName: space.spaceName,
      space: spaceCells(preset, 'space'),
      group: spaceCells(preset, 'group'),
    }));
  return {pods: podRows, spaces: spaceRows};
}

export function permissionsForPreset(
  preset: ApiKeyPresetId,
  pods: readonly ApiKeyMatrixPodInput[],
  spaces: readonly ApiKeyMatrixSpaceInput[],
): ApiKeyPermissions {
  return permissionsFromApiKeyMatrix(apiKeyMatrixForPreset(preset, pods, spaces));
}

export function permissionsFromApiKeyMatrix(matrix: ApiKeyPermissionMatrix): ApiKeyPermissions {
  const pods = Object.fromEntries(
    matrix.pods.flatMap((row) => {
      const grant = podGrant(row);
      return grant === undefined ? [] : [[row.podId, grant] as const];
    }),
  );
  const spaces = Object.fromEntries(
    matrix.spaces.flatMap((section) => {
      const grant = spaceGrant(section);
      return grant === undefined ? [] : [[section.spaceId, grant] as const];
    }),
  );
  return {
    ...(Object.keys(pods).length === 0 ? {} : {pods}),
    ...(Object.keys(spaces).length === 0 ? {} : {spaces}),
  };
}

export function toggleApiKeyMatrixPodCell(matrix: ApiKeyPermissionMatrix, podId: string, action: ApiKeyAction): ApiKeyPermissionMatrix {
  return {
    ...matrix,
    pods: matrix.pods.map((row) =>
      row.podId === podId ? {...row, cells: withAction(row.cells, action, !cellValue(row.cells, action))} : row,
    ),
  };
}

export function toggleApiKeyMatrixPodRow(matrix: ApiKeyPermissionMatrix, podId: string): ApiKeyPermissionMatrix {
  return {
    ...matrix,
    pods: matrix.pods.map((row) => (row.podId === podId ? {...row, cells: filled(apiKeyMatrixCellsCheck(row.cells) !== 'on')} : row)),
  };
}

export function toggleApiKeyMatrixPodColumn(matrix: ApiKeyPermissionMatrix, action: ApiKeyAction): ApiKeyPermissionMatrix {
  const next = apiKeyMatrixColumnCheck(
    matrix.pods.map((row) => row.cells),
    action,
  ) !== 'on';
  return {
    ...matrix,
    pods: matrix.pods.map((row) => ({...row, cells: withAction(row.cells, action, next)})),
  };
}

export function toggleApiKeyMatrixSpaceCell(
  matrix: ApiKeyPermissionMatrix,
  spaceId: string,
  resource: ApiKeySpaceResource,
  action: ApiKeyAction,
): ApiKeyPermissionMatrix {
  return {
    ...matrix,
    spaces: matrix.spaces.map((section) => {
      if (section.spaceId !== spaceId) {
        return section;
      }
      const cells = resource === 'space' ? section.space : section.group;
      const next = withAction(cells, action, !cellValue(cells, action));
      return resource === 'space' ? {...section, space: next} : {...section, group: next};
    }),
  };
}

export function toggleApiKeyMatrixSpaceRow(matrix: ApiKeyPermissionMatrix, spaceId: string, resource: ApiKeySpaceResource): ApiKeyPermissionMatrix {
  return {
    ...matrix,
    spaces: matrix.spaces.map((section) => {
      if (section.spaceId !== spaceId) {
        return section;
      }
      const cells = resource === 'space' ? section.space : section.group;
      const next = filled(apiKeyMatrixCellsCheck(cells) !== 'on');
      return resource === 'space' ? {...section, space: next} : {...section, group: next};
    }),
  };
}

export function toggleApiKeyMatrixSpaceColumn(matrix: ApiKeyPermissionMatrix, spaceId: string, action: ApiKeyAction): ApiKeyPermissionMatrix {
  return {
    ...matrix,
    spaces: matrix.spaces.map((section) => {
      if (section.spaceId !== spaceId) {
        return section;
      }
      const next =
        apiKeyMatrixColumnCheck([section.space, section.group], action) !== 'on';
      return {
        ...section,
        space: withAction(section.space, action, next),
        group: withAction(section.group, action, next),
      };
    }),
  };
}
