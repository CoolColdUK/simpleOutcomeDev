import * as v from 'valibot';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const USERNAME_CHANGE_COOLDOWN_DAYS = 30;
export const USERNAME_CHANGE_COOLDOWN_MS =
  USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export const usernameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(USERNAME_MIN_LENGTH, 'Username must be at least 3 characters'),
  v.maxLength(USERNAME_MAX_LENGTH, 'Username must be at most 24 characters'),
  v.regex(/^[A-Za-z0-9_]+$/, 'Username may only contain letters, numbers, and underscore'),
);

export type Username = v.InferOutput<typeof usernameSchema>;
