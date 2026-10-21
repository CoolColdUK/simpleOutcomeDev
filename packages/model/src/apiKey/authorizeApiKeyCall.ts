import {ApiKeyStatus} from './apiKeyStatus';
import apiKeyPodResource from './apiKeyPodResource';
import deriveApiKeyStatus from './deriveApiKeyStatus';
import explicitApiKeyActions from './explicitApiKeyActions';
import featureKindForApiResource from './featureKindForApiResource';
import ownerCanAccessPod from './ownerCanAccessPod';
import type {ApiKeyCall, ApiKeyOwnerAccess, ApiKeyPodAccess, ApiKeyRecord} from './apiKeyRecord';
import {ApiKeyResource} from './apiKeyResource';
import roleAllowsApiCall from './roleAllowsApiCall';

export type ApiKeyAuthzCode = 'revoked' | 'expired' | 'unauthorized' | 'forbidden' | 'not_found' | 'validation';

export interface ApiKeyAuthzSuccess {
  readonly ok: true;
  readonly principalUserId: string;
}

export interface ApiKeyAuthzFailure {
  readonly ok: false;
  readonly code: ApiKeyAuthzCode;
  readonly message: string;
}

export type ApiKeyAuthzResult = ApiKeyAuthzSuccess | ApiKeyAuthzFailure;

export interface AuthorizeApiKeyCallInput {
  readonly key: ApiKeyRecord;
  readonly access: ApiKeyOwnerAccess;
  readonly call: ApiKeyCall;
  readonly nowIso: string;
}

function deny(code: ApiKeyAuthzCode, message: string): ApiKeyAuthzFailure {
  return {ok: false, code, message};
}

function podFromAccess(access: ApiKeyOwnerAccess, podId: string | undefined): ApiKeyPodAccess | undefined {
  if (podId === undefined) {
    return undefined;
  }
  return access.pods.find((pod) => pod.id === podId);
}

export default function authorizeApiKeyCall(input: AuthorizeApiKeyCallInput): ApiKeyAuthzResult {
  const status = deriveApiKeyStatus(input.key.status, input.key.expiresAt, input.nowIso);
  if (status === ApiKeyStatus.REVOKED) {
    return deny('revoked', 'API key is revoked');
  }
  if (status === ApiKeyStatus.EXPIRED) {
    return deny('expired', 'API key is expired');
  }
  if (input.call.spaceId !== input.key.spaceId) {
    return deny('forbidden', 'API key is for a different space');
  }
  if (input.access.spaceRole === undefined) {
    return deny('forbidden', 'API key owner is not a member of this space');
  }

  const pod = podFromAccess(input.access, input.call.podId);
  if (apiKeyPodResource(input.call.resource)) {
    if (input.call.podId === undefined) {
      return deny('validation', 'Pod is required');
    }
    if (pod === undefined) {
      return deny('not_found', 'Pod not found');
    }
    if (!ownerCanAccessPod(pod, input.access.spaceRole, input.key.ownerUserId)) {
      return deny('forbidden', 'API key owner cannot access this pod');
    }
    if (input.key.podIds.length > 0 && !input.key.podIds.includes(pod.id)) {
      return deny('forbidden', 'API key cannot access this pod');
    }
    const expected = featureKindForApiResource(input.call.resource);
    if (expected !== undefined && pod.feature !== expected) {
      return deny('forbidden', 'Pod feature does not match this action');
    }
    if (input.call.resource === ApiKeyResource.FP && input.call.fpResource === undefined) {
      return deny('validation', 'Financial planning resource is required');
    }
  }

  const granted = explicitApiKeyActions(input.key, input.call);
  if (granted.missingPodGrant) {
    return deny('forbidden', 'API key has no grant for this pod');
  }
  if (granted.actions === undefined || !granted.actions.includes(input.call.action)) {
    return deny('forbidden', 'API key does not grant this action');
  }
  if (!roleAllowsApiCall(input.call, input.access, pod)) {
    return deny('forbidden', 'Role does not allow this action');
  }
  return {ok: true, principalUserId: input.key.ownerUserId};
}

export function apiKeyAuthzHttpStatus(code: ApiKeyAuthzCode): number {
  if (code === 'revoked' || code === 'expired' || code === 'unauthorized') {
    return 401;
  }
  if (code === 'not_found') {
    return 404;
  }
  if (code === 'validation') {
    return 400;
  }
  return 403;
}
