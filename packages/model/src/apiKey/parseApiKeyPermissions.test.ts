import {ApiKeyAction} from './apiKeyAction';
import {ApiKeyPresetId} from './apiKeyPreset';
import {FeatureKind} from '../space/featureKind';
import {permissionsForPreset} from './apiKeyMatrix';
import buildApiKeyAiSetupPrompt from './buildApiKeyAiSetupPrompt';
import {agentTodoCardCreateSchema} from './agentTodoSchema';
import parseApiKeySecret from './parseApiKeySecret';
import safeParseApiKeyPermissions from './parseApiKeyPermissions';
import safeParseSchema from './safeParseSchema';

const podA = '33333333-3333-4333-8333-333333333333';
const podId = '66666666-6666-4666-8666-666666666666';
const space = '22222222-2222-4222-8222-222222222222';

describe('safeParseApiKeyPermissions', () => {
  it('accepts an empty grant object', () => {
    expect(safeParseApiKeyPermissions({})).toEqual({ok: true, value: {}});
  });

  it('accepts trip planning pod grants', () => {
    const result = safeParseApiKeyPermissions({
      pods: {[podA]: {trip: ['read', 'create']}},
    });
    expect(result).toEqual({
      ok: true,
      value: {pods: {[podA]: {trip: [ApiKeyAction.READ, ApiKeyAction.CREATE]}}},
    });
  });

  it('accepts per-pod and per-space grants', () => {
    const result = safeParseApiKeyPermissions({
      pods: {[podA]: {todo: ['read']}},
      spaces: {[space]: {space: ['read']}},
    });
    expect(result).toEqual({
      ok: true,
      value: {
        pods: {[podA]: {todo: [ApiKeyAction.READ]}},
        spaces: {[space]: {space: [ApiKeyAction.READ]}},
      },
    });
  });

  it('rejects space-level feature actions from the first slice', () => {
    const result = safeParseApiKeyPermissions({todo: ['read']});
    expect(result.ok).toBe(false);
  });

  it('rejects unknown actions', () => {
    const result = safeParseApiKeyPermissions({pods: {[podA]: {todo: ['write']}}});
    expect(result.ok).toBe(false);
  });

  it('rejects fp delete_all delete', () => {
    const result = safeParseApiKeyPermissions({pods: {[podA]: {fp: {delete_all: ['delete']}}}});
    expect(result.ok).toBe(false);
  });

  it('accepts fp delete_all create and profile read', () => {
    const result = safeParseApiKeyPermissions({
      profile: ['read'],
      pods: {[podA]: {fp: {delete_all: ['create']}}},
    });
    expect(result.ok).toBe(true);
  });
});

describe('permissionsForPreset', () => {
  const pods = [
    {podId: podA, spaceId: space, spaceName: 'Family', podName: 'Tasks', feature: FeatureKind.TODO_LIST},
    {podId, spaceId: space, spaceName: 'Family', podName: 'Budget', feature: FeatureKind.FINANCIAL_PLANNING},
  ];
  const spaces = [{spaceId: space, spaceName: 'Family'}];

  it('starts from all off', () => {
    expect(permissionsForPreset(ApiKeyPresetId.ALL_OFF, pods, spaces)).toEqual({});
  });

  it('limits all read to read on every visible row', () => {
    expect(permissionsForPreset(ApiKeyPresetId.ALL_READ, pods, spaces)).toEqual({
      profile: [ApiKeyAction.READ],
      pods: {
        [podA]: {todo: [ApiKeyAction.READ]},
        [podId]: {fp: {
          account: [ApiKeyAction.READ],
          category: [ApiKeyAction.READ],
          transaction: [ApiKeyAction.READ],
          parser: [ApiKeyAction.READ],
          import: [ApiKeyAction.READ],
          bill_split: [ApiKeyAction.READ],
          settings: [ApiKeyAction.READ],
        }},
      },
      spaces: {[space]: {space: [ApiKeyAction.READ], group: [ApiKeyAction.READ]}},
    });
  });
});

describe('parseApiKeySecret', () => {
  it('reads the lookup prefix from a generated secret', () => {
    const secret = `so_${'a'.repeat(24)}_${'b'.repeat(48)}`;
    expect(parseApiKeySecret(secret)).toEqual({secret, prefix: `so_${'a'.repeat(24)}`});
  });

  it('rejects a short token', () => {
    expect(parseApiKeySecret('so_short')).toBeUndefined();
  });
});

describe('agent todo validation', () => {
  it('returns the same validation error for the same input', () => {
    const input = {podId, title: '   '};
    expect(safeParseSchema(agentTodoCardCreateSchema, input)).toEqual(safeParseSchema(agentTodoCardCreateSchema, input));
    expect(safeParseSchema(agentTodoCardCreateSchema, input).ok).toBe(false);
  });
});

describe('buildApiKeyAiSetupPrompt', () => {
  it('points at hosted MCP and an env placeholder', () => {
    const prompt = buildApiKeyAiSetupPrompt('https://simpleoutcome.dev/');
    expect(prompt).toContain('https://simpleoutcome.dev/api/mcp');
    expect(prompt).toContain('${SIMPLEOUTCOME_API_KEY}');
    expect(prompt).not.toContain('so_');
  });
});
