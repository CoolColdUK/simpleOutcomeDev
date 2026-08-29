export const SPACE_INVITE_STATUSES = ['active', 'expired', 'exhausted', 'disabled'] as const;

export type SpaceInviteStatus = (typeof SPACE_INVITE_STATUSES)[number];

export const SPACE_INVITE_STATUS_FILTERS = ['all', ...SPACE_INVITE_STATUSES] as const;

export type SpaceInviteStatusFilter = (typeof SPACE_INVITE_STATUS_FILTERS)[number];
