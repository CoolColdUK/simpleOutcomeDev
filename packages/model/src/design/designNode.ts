import * as v from 'valibot';
import {siteHexColourSchema} from '../site/siteTextSchema';
import {DESIGN_ATOMS, isDesignContentKey, isDesignStyleKey, type DesignAtom, type DesignContentKey, type DesignStyleKey} from './designAtomOptions';
import {designIdSchema, designNodeIdSchema} from './designId';

export {DESIGN_ATOMS};
export type {DesignAtom};

const px = (max: number) => v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(max));

export const designStyleSchema = v.strictObject({
  background: v.optional(siteHexColourSchema),
  color: v.optional(siteHexColourSchema),
  radiusPx: v.optional(px(32)),
  borderWidthPx: v.optional(px(8)),
  borderColor: v.optional(siteHexColourSchema),
});

export type DesignStyle = v.InferOutput<typeof designStyleSchema>;

export const designAtomNodeSchema = v.pipe(
  v.strictObject({
    id: designNodeIdSchema,
    kind: v.literal('atom'),
    atom: v.picklist(DESIGN_ATOMS),
    style: designStyleSchema,
    slots: v.pipe(v.array(v.string()), v.maxLength(8)),
  }),
  v.check((node) => node.slots.every((slot) => isDesignContentKey(node.atom, slot)), 'Content option is not available on this atom'),
  v.check((node) => new Set(node.slots).size === node.slots.length, 'Content option is listed twice'),
  v.check((node) => Object.keys(node.style).every((key) => isDesignStyleKey(node.atom, key)), 'Style option is not available on this atom'),
);

export interface DesignAtomNode extends v.InferOutput<typeof designAtomNodeSchema> {}

export const designMoleculeUseSchema = v.strictObject({
  id: designNodeIdSchema,
  kind: v.literal('molecule'),
  moleculeId: designIdSchema,
});

export interface DesignMoleculeUseNode extends v.InferOutput<typeof designMoleculeUseSchema> {}

export type DesignNode = DesignAtomNode | DesignMoleculeUseNode;

export const designNodeSchema: v.GenericSchema<DesignNode> = v.variant('kind', [designAtomNodeSchema, designMoleculeUseSchema]);

export type {DesignContentKey, DesignStyleKey};
