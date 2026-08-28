export const POD_ROLES = ['pod_owner', 'pod_admin', 'pod_user'] as const;

export type PodRole = (typeof POD_ROLES)[number];
