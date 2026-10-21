import {FpResource} from '../fp/fpResource';
import {FeatureKind} from '../space/featureKind';
import {ApiKeyAction} from './apiKeyAction';
import {ApiKeyPresetId} from './apiKeyPreset';
import {
  apiKeyMatrixCellsCheck,
  apiKeyMatrixColumnCheck,
  apiKeyMatrixForPreset,
  createApiKeyMatrix,
  permissionsFromApiKeyMatrix,
  toggleApiKeyMatrixDeleteAll,
  toggleApiKeyMatrixPodCell,
  toggleApiKeyMatrixPodColumn,
  toggleApiKeyMatrixPodRow,
  toggleApiKeyMatrixSpaceCell,
  toggleApiKeyMatrixSpaceColumn,
} from './apiKeyMatrix';

const space = '22222222-2222-4222-8222-222222222222';
const spaceB = '88888888-8888-4888-8888-888888888888';
const podA = '33333333-3333-4333-8333-333333333333';
const podB = '44444444-4444-4444-8444-444444444444';
const crud = [ApiKeyAction.CREATE, ApiKeyAction.READ, ApiKeyAction.UPDATE, ApiKeyAction.DELETE];
const read = [ApiKeyAction.READ];

const pods = [
  {podId: podB, spaceId: space, spaceName: 'Work', podName: 'Errands', feature: FeatureKind.SHOPPING_LIST},
  {podId: podA, spaceId: space, spaceName: 'Family', podName: 'Groceries', feature: FeatureKind.TODO_LIST},
];
const spaces = [
  {spaceId: spaceB, spaceName: 'Work'},
  {spaceId: space, spaceName: 'Family'},
];

describe('api key permission matrix', () => {
  it('opens with every cell off', () => {
    const matrix = createApiKeyMatrix(pods, spaces);
    expect(matrix.pods.map((row) => `${row.spaceName} / ${row.podName}`)).toEqual(['Family / Groceries', 'Work / Errands']);
    expect(matrix.spaces.map((section) => section.spaceName)).toEqual(['Family', 'Work']);
    expect(matrix.pods.every((row) => apiKeyMatrixCellsCheck(row.cells) === 'off' && !row.deleteAll)).toBe(true);
    expect(matrix.profile).toEqual({read: false, update: false});
    expect(matrix.spaces.every((section) => apiKeyMatrixCellsCheck(section.space) === 'off' && apiKeyMatrixCellsCheck(section.group) === 'off')).toBe(
      true,
    );
    expect(permissionsFromApiKeyMatrix(matrix)).toEqual({});
  });

  it('fills every visible pod and space section for all on', () => {
    const matrix = apiKeyMatrixForPreset(ApiKeyPresetId.ALL_ON, pods, spaces);
    const permissions = permissionsFromApiKeyMatrix(matrix);
    expect(permissions.pods?.[podA]).toEqual({todo: crud});
    expect(permissions.pods?.[podB]).toEqual({shopping: crud});
    expect(permissions.spaces?.[space]).toEqual({space: crud, group: crud});
    expect(permissions.spaces?.[spaceB]).toEqual({space: crud, group: crud});
    expect(permissions.profile).toEqual(crud.filter((action) => action === ApiKeyAction.READ || action === ApiKeyAction.UPDATE));
  });

  it('checks read on every row for all read and leaves delete-all off', () => {
    const podFp = '77777777-7777-4777-8777-777777777777';
    const fpPod = [{podId: podFp, spaceId: space, spaceName: 'Family', podName: 'Budget', feature: FeatureKind.FINANCIAL_PLANNING}];
    const matrix = apiKeyMatrixForPreset(ApiKeyPresetId.ALL_READ, [...pods, ...fpPod], spaces);
    const permissions = permissionsFromApiKeyMatrix(matrix);
    expect(permissions.pods?.[podA]?.todo).toEqual(read);
    expect(permissions.pods?.[podB]?.shopping).toEqual(read);
    expect(permissions.spaces?.[space]).toEqual({space: read, group: read});
    expect(permissions.profile).toEqual(read);
    expect(permissions.pods?.[podFp]?.fp?.delete_all).toBeUndefined();
    expect(matrix.pods.find((row) => row.feature === FeatureKind.FINANCIAL_PLANNING)?.deleteAll).toBe(false);
  });

  it('clears the grid for all off', () => {
    const on = apiKeyMatrixForPreset(ApiKeyPresetId.ALL_ON, pods, spaces);
    const off = apiKeyMatrixForPreset(ApiKeyPresetId.ALL_OFF, pods, spaces);
    expect(permissionsFromApiKeyMatrix(on).pods).toBeDefined();
    expect(permissionsFromApiKeyMatrix(off)).toEqual({});
  });

  it('writes nested fp delete and omits delete_all', () => {
    const fpPod = [{podId: podA, spaceId: space, spaceName: 'Family', podName: 'Budget', feature: FeatureKind.FINANCIAL_PLANNING}];
    const matrix = toggleApiKeyMatrixPodCell(createApiKeyMatrix(fpPod, []), podA, ApiKeyAction.DELETE);
    const grant = permissionsFromApiKeyMatrix(matrix).pods?.[podA]?.fp;
    expect(grant?.transaction).toEqual([ApiKeyAction.DELETE]);
    expect(grant?.account).toEqual([ApiKeyAction.DELETE]);
    expect(grant?.[FpResource.DELETE_ALL]).toBeUndefined();
  });

  it('writes delete_all only from the extra checkbox', () => {
    const fpPod = [{podId: podA, spaceId: space, spaceName: 'Family', podName: 'Budget', feature: FeatureKind.FINANCIAL_PLANNING}];
    const matrix = toggleApiKeyMatrixDeleteAll(createApiKeyMatrix(fpPod, []), podA);
    expect(permissionsFromApiKeyMatrix(matrix).pods?.[podA]?.fp).toEqual({delete_all: [ApiKeyAction.CREATE]});
    expect(matrix.pods[0]?.cells.delete).toBe(false);
  });

  it('turns a mixed pod row fully on, then fully off', () => {
    const mixed = toggleApiKeyMatrixPodCell(createApiKeyMatrix(pods, spaces), podA, ApiKeyAction.READ);
    const on = toggleApiKeyMatrixPodRow(mixed, podA);
    const off = toggleApiKeyMatrixPodRow(on, podA);
    expect(apiKeyMatrixCellsCheck(mixed.pods[0]?.cells ?? {create: false, read: false, update: false, delete: false})).toBe('mixed');
    expect(permissionsFromApiKeyMatrix(on).pods?.[podA]?.todo).toEqual(crud);
    expect(permissionsFromApiKeyMatrix(off).pods?.[podA]).toBeUndefined();
  });

  it('sets one action on every pod row and leaves space sections unchanged', () => {
    const seeded = toggleApiKeyMatrixSpaceCell(createApiKeyMatrix(pods, spaces), space, 'space', ApiKeyAction.READ);
    const toggled = toggleApiKeyMatrixPodColumn(seeded, ApiKeyAction.READ);
    expect(permissionsFromApiKeyMatrix(toggled).pods?.[podA]).toEqual({todo: read});
    expect(permissionsFromApiKeyMatrix(toggled).pods?.[podB]).toEqual({shopping: read});
    expect(permissionsFromApiKeyMatrix(toggled).spaces?.[space]?.space).toEqual(read);
    expect(apiKeyMatrixColumnCheck(toggled.pods.map((row) => row.cells), ApiKeyAction.READ)).toBe('on');
    expect(permissionsFromApiKeyMatrix(toggleApiKeyMatrixPodColumn(toggled, ApiKeyAction.READ)).pods).toBeUndefined();
  });

  it('limits a space column toggle to that space section', () => {
    const toggled = toggleApiKeyMatrixSpaceColumn(createApiKeyMatrix(pods, spaces), space, ApiKeyAction.READ);
    const permissions = permissionsFromApiKeyMatrix(toggled);
    expect(permissions.spaces?.[space]).toEqual({space: read, group: read});
    expect(permissions.spaces?.[spaceB]).toBeUndefined();
    expect(permissions.pods).toBeUndefined();
  });
});
