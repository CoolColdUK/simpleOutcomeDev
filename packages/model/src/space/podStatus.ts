export const POD_STATUSES = ['active', 'archived'] as const;

export type PodStatus = (typeof POD_STATUSES)[number];
