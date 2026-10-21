import type {ApiKeyAction} from './apiKeyAction';
import {ApiKeyResource} from './apiKeyResource';
import type {ApiKeyFpGrant, ApiKeyPodGrant} from './apiKeyPermissions';
import apiKeyPodResource from './apiKeyPodResource';
import type {ApiKeyCall, ApiKeyRecord} from './apiKeyRecord';

function fpActions(grant: ApiKeyFpGrant | undefined, call: ApiKeyCall): readonly ApiKeyAction[] | undefined {
  if (grant === undefined || call.fpResource === undefined) {
    return undefined;
  }
  return grant[call.fpResource];
}

function featureActions(grant: ApiKeyPodGrant, call: ApiKeyCall): readonly ApiKeyAction[] | undefined {
  if (call.resource === ApiKeyResource.TODO) {
    return grant.todo;
  }
  if (call.resource === ApiKeyResource.SHOPPING) {
    return grant.shopping;
  }
  if (call.resource === ApiKeyResource.FP) {
    return fpActions(grant.fp, call);
  }
  return undefined;
}

export interface ExplicitApiKeyActions {
  readonly actions: readonly ApiKeyAction[] | undefined;
  readonly missingPodGrant: boolean;
}

export default function explicitApiKeyActions(key: ApiKeyRecord, call: ApiKeyCall): ExplicitApiKeyActions {
  if (call.resource === ApiKeyResource.SPACE || call.resource === ApiKeyResource.GROUP) {
    const grant = key.permissions.spaces?.[call.spaceId];
    if (call.resource === ApiKeyResource.SPACE) {
      return {actions: grant?.space, missingPodGrant: false};
    }
    return {actions: grant?.group, missingPodGrant: false};
  }
  if (!apiKeyPodResource(call.resource)) {
    return {actions: undefined, missingPodGrant: false};
  }
  const podId = call.podId;
  if (podId === undefined) {
    return {actions: undefined, missingPodGrant: true};
  }
  const grant = key.permissions.pods?.[podId];
  if (grant === undefined) {
    return {actions: undefined, missingPodGrant: true};
  }
  return {actions: featureActions(grant, call), missingPodGrant: false};
}
