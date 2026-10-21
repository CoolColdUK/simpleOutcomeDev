import fpCan from '../fp/fpCan';
import {FpAction} from '../fp/fpAction';
import {PodRole} from '../space/podRole';
import {SpaceRole} from '../space/spaceRole';
import {ApiKeyAction} from './apiKeyAction';
import {ApiKeyResource} from './apiKeyResource';
import type {ApiKeyCall, ApiKeyOwnerAccess, ApiKeyPodAccess} from './apiKeyRecord';

function toFpAction(action: ApiKeyAction): FpAction | undefined {
  if (action === ApiKeyAction.READ) {
    return FpAction.READ;
  }
  if (action === ApiKeyAction.CREATE) {
    return FpAction.CREATE;
  }
  if (action === ApiKeyAction.UPDATE) {
    return FpAction.UPDATE;
  }
  if (action === ApiKeyAction.DELETE) {
    return FpAction.DELETE;
  }
  return undefined;
}

function isSpaceOwner(role: SpaceRole | undefined): boolean {
  return role === SpaceRole.OWNER;
}

function isSpaceAdmin(role: SpaceRole | undefined): boolean {
  return role === SpaceRole.OWNER || role === SpaceRole.ADMIN;
}

function todoRoleAllows(call: ApiKeyCall, access: ApiKeyOwnerAccess, pod: ApiKeyPodAccess): boolean {
  const canRead = isSpaceOwner(access.spaceRole) || pod.role !== undefined;
  if (!canRead) {
    return false;
  }
  if (call.todoTarget === 'column' && call.action !== ApiKeyAction.READ) {
    return isSpaceOwner(access.spaceRole) || pod.role === PodRole.OWNER || pod.role === PodRole.ADMIN;
  }
  return true;
}

function groupRoleAllows(call: ApiKeyCall, access: ApiKeyOwnerAccess): boolean {
  if (access.spaceRole === undefined) {
    return false;
  }
  if (call.action === ApiKeyAction.READ && call.groupTarget === 'invite') {
    return isSpaceAdmin(access.spaceRole);
  }
  if (call.action === ApiKeyAction.READ) {
    return true;
  }
  if (call.action === ApiKeyAction.UPDATE) {
    return isSpaceOwner(access.spaceRole);
  }
  if (call.action === ApiKeyAction.CREATE || call.action === ApiKeyAction.DELETE) {
    return isSpaceAdmin(access.spaceRole);
  }
  return false;
}

export default function roleAllowsApiCall(call: ApiKeyCall, access: ApiKeyOwnerAccess, pod: ApiKeyPodAccess | undefined): boolean {
  if (call.resource === ApiKeyResource.SPACE) {
    if (access.spaceRole === undefined) {
      return false;
    }
    if (call.action === ApiKeyAction.READ) {
      return true;
    }
    if (call.action === ApiKeyAction.UPDATE) {
      return isSpaceAdmin(access.spaceRole);
    }
    return false;
  }
  if (call.resource === ApiKeyResource.GROUP) {
    return groupRoleAllows(call, access);
  }
  if (call.resource === ApiKeyResource.PROFILE) {
    return call.action === ApiKeyAction.READ && access.spaceRole !== undefined;
  }
  if (call.resource === ApiKeyResource.CONTACT) {
    return false;
  }
  if (pod === undefined) {
    return false;
  }
  if (call.resource === ApiKeyResource.TODO) {
    return todoRoleAllows(call, access, pod);
  }
  if (call.resource === ApiKeyResource.SHOPPING) {
    return isSpaceOwner(access.spaceRole) || pod.role !== undefined;
  }
  if (call.resource === ApiKeyResource.FP) {
    if (call.fpResource === undefined) {
      return false;
    }
    const action = toFpAction(call.action);
    if (action === undefined) {
      return false;
    }
    return fpCan(pod.role, isSpaceOwner(access.spaceRole), pod.fpPermission, call.fpResource, action);
  }
  return false;
}
