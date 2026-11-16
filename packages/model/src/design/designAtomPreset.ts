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
    parentId: v.optional(designIdSchema),
    fields: v.pipe(v.array(designAtomFieldSchema), v.maxLength(24)),
    style: designStyleSchema,
  }),
  v.check((preset) => preset.parentId !== preset.id, 'An atom cannot extend itself'),
  v.check((preset) => new Set(preset.fields.map((field) => field.key)).size === preset.fields.length, 'Field is listed twice'),
);

export interface DesignAtomPreset extends v.InferOutput<typeof designAtomPresetSchema> {}

export function blankDesignAtomPreset(): DesignAtomPreset {
  return {
    id: 'new-atom',
    name: 'New atom',
    base: 'text',
    fields: [],
    style: {},
  };
}

export function mergedDesignAtom(preset: DesignAtomPreset, atoms: readonly DesignAtomPreset[]): DesignAtomPreset {
  const chain: DesignAtomPreset[] = [];
  const seen = new Set<string>();
  let current: DesignAtomPreset | undefined = preset;
  while (current !== undefined && !seen.has(current.id) && chain.length < 8) {
    seen.add(current.id);
    chain.unshift(current);
    const parentId = current.parentId;
    current = parentId === undefined ? undefined : atoms.find((atom) => atom.id === parentId);
  }
  const fields: DesignAtomField[] = [];
  const style: DesignStyle = {};
  chain.forEach((item) => {
    Object.assign(style, item.style);
    item.fields.forEach((field) => {
      const index = fields.findIndex((existing) => existing.key === field.key);
      if (index === -1) {
        fields.push(field);
      } else {
        fields[index] = field;
      }
    });
  });
  return {...preset, fields, style};
}

export function designAtomContentKeys(preset: DesignAtomPreset, atoms: readonly DesignAtomPreset[] = []): string[] {
  return mergedDesignAtom(preset, atoms).fields.filter((field) => field.group === 'content').map((field) => field.key);
}

export type {DesignStyle};
