import * as v from 'valibot';
import {designIdSchema} from './designId';
import {designAtomNameSchema, designStyleSchema, type DesignStyle} from './designNode';

export const designAtomFieldSchema = v.strictObject({
  key: v.pipe(v.string(), v.regex(/^[a-zA-Z][A-Za-z0-9]{0,40}$/)),
  label: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40)),
  group: v.picklist(['content', 'setting']),
  kind: v.picklist(['text', 'boolean', 'number', 'colour', 'choice']),
});

export interface DesignAtomField extends v.InferOutput<typeof designAtomFieldSchema> {}

export const designAtomPresetSchema = v.pipe(
  v.strictObject({
    id: designIdSchema,
    name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
    base: designAtomNameSchema,
    fields: v.pipe(v.array(designAtomFieldSchema), v.minLength(1), v.maxLength(24)),
    style: designStyleSchema,
  }),
  v.check((preset) => new Set(preset.fields.map((field) => field.key)).size === preset.fields.length, 'Field is listed twice'),
);

export interface DesignAtomPreset extends v.InferOutput<typeof designAtomPresetSchema> {}

export function blankDesignAtomPreset(): DesignAtomPreset {
  return {
    id: 'new-atom',
    name: 'New atom',
    base: 'text',
    fields: [{key: 'text', label: 'Text', group: 'content', kind: 'text'}],
    style: {},
  };
}

export function designAtomContentKeys(preset: DesignAtomPreset): string[] {
  return preset.fields.filter((field) => field.group === 'content').map((field) => field.key);
}

export type {DesignStyle};
