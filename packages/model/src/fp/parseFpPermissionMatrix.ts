import {FpAction} from './fpAction';
import {FpResource} from './fpResource';
import type {FpPermissionMatrix} from './fpPermissionMatrix';
import fpDefaultPermission from './fpDefaultPermission';
import {PodRole} from '../space/podRole';

const actions = new Set<string>(Object.values(FpAction));
const resources = Object.values(FpResource);
const roles = Object.values(PodRole);

function parseActions(input: unknown): readonly FpAction[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter((a): a is FpAction => typeof a === 'string' && actions.has(a));
}

export default function parseFpPermissionMatrix(input: unknown): FpPermissionMatrix {
  const fallback = fpDefaultPermission();
  if (input === undefined || typeof input !== 'object' || input === null) {
    return fallback;
  }
  const raw = input as Record<string, unknown>;
  const next = {...fallback};
  roles.forEach((role) => {
    const roleRaw = raw[role];
    if (roleRaw === undefined || typeof roleRaw !== 'object' || roleRaw === null) {
      return;
    }
    const roleMap = roleRaw as Record<string, unknown>;
    const resourceMap = {...fallback[role]};
    resources.forEach((resource) => {
      if (roleMap[resource] !== undefined) {
        resourceMap[resource] = parseActions(roleMap[resource]);
      }
    });
    next[role] = resourceMap;
  });
  return next;
}
