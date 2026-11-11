import * as v from 'valibot';
import {sitePlaceholderBackgroundSchema, siteShortTextSchema} from './siteTextSchema';

export const siteMediaSchema = v.strictObject({
  label: siteShortTextSchema,
  background: sitePlaceholderBackgroundSchema,
});

export interface SiteMedia extends v.InferOutput<typeof siteMediaSchema> {}
