import {ApiKeyAction} from './apiKeyAction';
import {ApiKeyPresetId} from './apiKeyPreset';
import permissionsForPreset from './apiKeyPreset';
import buildApiKeyAiSetupPrompt from './buildApiKeyAiSetupPrompt';
import {agentTodoCardCreateSchema} from './agentTodoSchema';
import parseApiKeySecret from './parseApiKeySecret';
import safeParseApiKeyPermissions from './parseApiKeyPermissions';
import safeParseSchema from './safeParseSchema';

const podA = '33333333-3333-4333-8333-333333333333';
const podId = '66666666-6666-4666-8666-666666666666';

describe('safeParseApiKeyPermissions', () => {
  it('accepts explicit space-level actions when the allowlist is empty', () => {
    const result = safeParseApiKeyPermissions({todo: ['read']}, []);
    expect(result).toEqual({ok: true, value: {todo: [ApiKeyAction.READ]}});
  });

  it('rejects per-pod grants without an allowlist', () => {
    const result = safeParseApiKeyPermissions({pods: {[podA]: {todo: ['read']}}}, []);
    expect(result.ok).toBe(false);
  });

  it('requires a grant for every allowlisted pod', () => {
    const result = safeParseApiKeyPermissions({pods: {}}, [podA]);
    expect(result.ok).toBe(false);
  });

  it('rejects feature presets beside per-pod grants', () => {
    const result = safeParseApiKeyPermissions({todo: ['read', 'create', 'update', 'delete'], pods: {[podA]: {todo: ['read']}}}, [podA]);
    expect(result.ok).toBe(false);
  });

  it('rejects unknown actions instead of treating them as write-all', () => {
    const result = safeParseApiKeyPermissions({todo: ['write']}, []);
    expect(result.ok).toBe(false);
  });
});

describe('permissionsForPreset', () => {
  it('keeps feature actions at space scope when no pods are selected', () => {
    expect(permissionsForPreset(ApiKeyPresetId.TODO_READ_WRITE, [])).toEqual({
      todo: [ApiKeyAction.READ, ApiKeyAction.CREATE, ApiKeyAction.UPDATE, ApiKeyAction.DELETE],
    });
  });

  it('copies feature actions onto each allowlisted pod', () => {
    expect(permissionsForPreset(ApiKeyPresetId.TODO_READ, [podA])).toEqual({
      pods: {[podA]: {todo: [ApiKeyAction.READ]}},
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
