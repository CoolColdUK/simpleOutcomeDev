export interface ParsedAppBreadcrumbPath {
  readonly spaceId: string | undefined;
  readonly podId: string | undefined;
  readonly leaf: 'settings' | 'invitations' | 'join' | undefined;
}

export default function parseAppBreadcrumbPath(pathname: string): ParsedAppBreadcrumbPath {
  const parts = pathname.split('/').filter((part) => part !== '');
  if (parts[0] !== 'app') {
    return {spaceId: undefined, podId: undefined, leaf: undefined};
  }
  if (parts[1] === 'join') {
    return {spaceId: undefined, podId: undefined, leaf: 'join'};
  }
  if (parts[1] !== 'spaces' || parts[2] === undefined) {
    return {spaceId: undefined, podId: undefined, leaf: undefined};
  }
  const spaceId = parts[2];
  if (parts[3] === 'settings') {
    return {spaceId, podId: undefined, leaf: 'settings'};
  }
  if (parts[3] === 'invitations') {
    return {spaceId, podId: undefined, leaf: 'invitations'};
  }
  if (parts[3] === 'pods' && parts[4] !== undefined && parts[4] !== 'find') {
    return {spaceId, podId: parts[4], leaf: undefined};
  }
  return {spaceId, podId: undefined, leaf: undefined};
}
