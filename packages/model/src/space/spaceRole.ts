export const SPACE_ROLES = ['space_owner', 'space_admin', 'space_user'] as const;

export type SpaceRole = (typeof SPACE_ROLES)[number];
