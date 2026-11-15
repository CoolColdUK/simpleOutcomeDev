import * as v from 'valibot';

export const designIdSchema = v.pipe(v.string(), v.trim(), v.regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/));

export const designNodeIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  v.maxLength(40),
);

export const DESIGN_CATEGORIES = ['header', 'page', 'footer'] as const;

export type DesignCategory = (typeof DESIGN_CATEGORIES)[number];

export const designCategorySchema = v.picklist(DESIGN_CATEGORIES);
