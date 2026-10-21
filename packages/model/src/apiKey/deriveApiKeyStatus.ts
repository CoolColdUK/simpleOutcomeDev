import {ApiKeyStatus, type ApiKeyStoredStatus} from './apiKeyStatus';

export default function deriveApiKeyStatus(
  status: ApiKeyStoredStatus,
  expiresAt: string | undefined,
  nowIso: string,
): ApiKeyStatus {
  if (status === 'revoked') {
    return ApiKeyStatus.REVOKED;
  }
  if (expiresAt !== undefined && Date.parse(expiresAt) <= Date.parse(nowIso)) {
    return ApiKeyStatus.EXPIRED;
  }
  return ApiKeyStatus.ACTIVE;
}
