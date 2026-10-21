import type {ApiKeyAction} from './apiKeyAction';
import {ApiKeyResource} from './apiKeyResource';
import type {ApiKeyFpGrant, ApiKeyPermissions, ApiKeyPodGrant} from './apiKeyPermissions';
import apiKeyPodResource from './apiKeyPodResource';
import type {ApiKeyCall, ApiKeyRecord} from './apiKeyRecord';

function fpActions(grant: ApiKeyFpGrant | undefined, call: ApiKeyCall): readonly ApiKeyAction[] | undefined {
  if (grant === undefined || call.fpResource === undefined) {
    return undefined;
  }
  return grant[call.fpResource];
}

function featureActions(grant: ApiKeyPermissions | ApiKeyPodGrant | undefined, call: ApiKeyCall): readonly ApiKeyAction[] | undefined {
  if (grant === undefined) {
    return undefined;
  }
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
  if (!apiKeyPodResource(call.resource)) {
    if (call.resource === ApiKeyResource.SPACE) {
      return {actions: key.permissions.space, missingPodGrant: false};
    }
    if (call.resource === ApiKeyResource.GROUP) {
      return {actions: key.permissions.group, missingPodGrant: false};
    }
    if (call.resource === ApiKeyResource.PROFILE) {
      return {actions: key.permissions.profile, missingPodGrant: false};
    }
    return {actions: key.permissions.contact, missingPodGrant: false};
  }
  if (key.podIds.length === 0) {
    return {actions: featureActions(key.permissions, call), missingPodGrant: false};
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
