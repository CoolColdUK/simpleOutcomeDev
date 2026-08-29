import * as v from 'valibot';

export const DISPLAY_NAME_MAX_LENGTH = 80;

export const displayNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(DISPLAY_NAME_MAX_LENGTH, 'Display name must be at most 80 characters'),
);

export type DisplayName = v.InferOutput<typeof displayNameSchema>;
