import * as v from 'valibot';
import {siteSeoSchema} from './siteSeoSchema';
import {siteSectionSchema} from './siteSectionSchema';
import {siteBodySchema, siteHttpUrlSchema, siteSectionIdSchema, siteShortTextSchema} from './siteTextSchema';
import {siteThemeSchema} from './siteThemeSchema';

export const siteDocumentSchema = v.strictObject({
  schemaVersion: v.literal(1),
  businessName: siteShortTextSchema,
  theme: siteThemeSchema,
  booking: v.strictObject({
    label: siteShortTextSchema,
    href: siteHttpUrlSchema,
    provider: v.picklist(['fresha', 'url']),
  }),
  nav: v.strictObject({
    links: v.pipe(
      v.array(v.strictObject({label: siteShortTextSchema, sectionId: siteSectionIdSchema})),
      v.minLength(1),
      v.maxLength(8),
    ),
  }),
  sections: v.pipe(v.array(siteSectionSchema), v.minLength(1), v.maxLength(40)),
  footer: v.strictObject({
    text: siteBodySchema,
  }),
  seo: v.optional(siteSeoSchema),
});

export interface SiteDocument extends v.InferOutput<typeof siteDocumentSchema> {}
