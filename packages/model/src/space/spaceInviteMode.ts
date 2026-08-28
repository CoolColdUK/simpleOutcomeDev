export const SPACE_INVITE_MODES = ['single_use', 'permanent'] as const;

export type SpaceInviteMode = (typeof SPACE_INVITE_MODES)[number];
