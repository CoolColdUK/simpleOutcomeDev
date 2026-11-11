import * as v from 'valibot';

export const siteSectionIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  v.maxLength(40),
);

export const siteShortTextSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120));

export const siteBodySchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000));

export const sitePriceSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40));

export const siteDetailSchema = v.pipe(v.string(), v.trim(), v.maxLength(80));

export const siteHexColourSchema = v.pipe(v.string(), v.trim(), v.regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/));

export const siteFontStackSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(80),
  v.regex(/^[A-Za-z0-9 ,.'-]+$/),
);

const HEX = '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})';
const GRADIENT = new RegExp(`^linear-gradient\\(135deg,${HEX},${HEX}(?: \\d{1,3}%,${HEX})?\\)$`);

export const siteHeroBackgroundSchema = v.pipe(
  v.string(),
  v.trim(),
  v.check((value) => value === 'none' || GRADIENT.test(value)),
);

export const sitePlaceholderBackgroundSchema = v.pipe(
  v.string(),
  v.trim(),
  v.check((value) => GRADIENT.test(value) || new RegExp(`^${HEX}$`).test(value)),
);

export const siteHttpUrlSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(400),
  v.check((value) => value.startsWith('https://') || value.startsWith('http://')),
);
