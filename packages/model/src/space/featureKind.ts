export const FEATURE_KINDS = ['todo_list', 'shopping_list'] as const;

export type FeatureKind = (typeof FEATURE_KINDS)[number];
