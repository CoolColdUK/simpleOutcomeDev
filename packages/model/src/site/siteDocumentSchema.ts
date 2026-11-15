import * as v from 'valibot';
import {siteSeoSchema} from './siteSeoSchema';
import {siteSectionSchema} from './siteSectionSchema';
import {siteHttpUrlSchema, siteShortTextSchema} from './siteTextSchema';
import {siteThemeSchema} from './siteThemeSchema';

export const siteDocumentSchema = v.strictObject({
  schemaVersion: v.literal(2),
  businessName: siteShortTextSchema,
  theme: siteThemeSchema,
  booking: v.strictObject({
    label: siteShortTextSchema,
    href: siteHttpUrlSchema,
    provider: v.picklist(['fresha', 'url']),
  }),
  sections: v.pipe(v.array(siteSectionSchema), v.maxLength(40)),
  seo: v.optional(siteSeoSchema),
});

export interface SiteDocument extends v.InferOutput<typeof siteDocumentSchema> {}
