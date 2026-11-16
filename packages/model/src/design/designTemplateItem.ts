import * as v from 'valibot';
import {designIdSchema, designNodeIdSchema} from './designId';

const slotValueSchema = v.union([v.string(), v.boolean()]);

export const designTemplateItemSchema = v.strictObject({
  id: designNodeIdSchema,
  moleculeId: designIdSchema,
  values: v.record(v.string(), v.record(v.string(), slotValueSchema)),
});

export interface DesignTemplateItem extends v.InferOutput<typeof designTemplateItemSchema> {}

export const designTemplateItemsSchema = v.pipe(v.array(designTemplateItemSchema), v.maxLength(40));
