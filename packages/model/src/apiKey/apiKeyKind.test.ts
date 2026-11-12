import {apiKeyKindLabel, ApiKeyKind} from './apiKeyKind';

describe('apiKeyKindLabel', () => {
  it('names a matrix key Scoped', () => {
    expect(apiKeyKindLabel(ApiKeyKind.SCOPED)).toBe('Scoped');
  });

  it('names a blanket key Full access', () => {
    expect(apiKeyKindLabel(ApiKeyKind.FULL)).toBe('Full access');
  });
});
