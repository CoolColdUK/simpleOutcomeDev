import * as v from 'valibot';
import {siteHexColourSchema, siteHttpUrlSchema, siteSectionIdSchema, siteShortTextSchema} from './siteTextSchema';

export const SITE_BLOCK_ICONS = ['menu', 'close', 'phone', 'arrow'] as const;

export const siteBlockSchema = v.variant('type', [
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('button'),
    props: v.strictObject({
      label: siteShortTextSchema,
      href: siteHttpUrlSchema,
      background: siteHexColourSchema,
      color: siteHexColourSchema,
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('iconButton'),
    props: v.strictObject({
      label: siteShortTextSchema,
      href: siteHttpUrlSchema,
      icon: v.picklist(SITE_BLOCK_ICONS),
      background: siteHexColourSchema,
      color: siteHexColourSchema,
    }),
  }),
]);

export const siteBlocksSchema = v.pipe(v.array(siteBlockSchema), v.maxLength(8));

export type SiteBlock = v.InferOutput<typeof siteBlockSchema>;
export type SiteBlockIcon = (typeof SITE_BLOCK_ICONS)[number];
