export const POD_VISIBILITIES = ['open', 'request', 'private'] as const;

export type PodVisibility = (typeof POD_VISIBILITIES)[number];
