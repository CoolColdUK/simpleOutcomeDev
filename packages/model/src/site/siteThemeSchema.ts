import * as v from 'valibot';
import {siteFontStackSchema, siteHeroBackgroundSchema, siteHexColourSchema} from './siteTextSchema';

export const siteThemeSchema = v.strictObject({
  background: siteHexColourSchema,
  foreground: siteHexColourSchema,
  accent: siteHexColourSchema,
  buttonForeground: siteHexColourSchema,
  cardBackground: siteHexColourSchema,
  headingFont: siteFontStackSchema,
  bodyFont: siteFontStackSchema,
  uppercaseHeadings: v.boolean(),
  heroBackground: siteHeroBackgroundSchema,
  radiusPx: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(32)),
});

export interface SiteTheme extends v.InferOutput<typeof siteThemeSchema> {}
