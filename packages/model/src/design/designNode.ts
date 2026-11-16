import * as v from 'valibot';
import {designIdSchema, designNodeIdSchema} from './designId';

export const designAtomNameSchema = v.pipe(v.string(), v.regex(/^[a-z][A-Za-z0-9]{0,40}$/));

export const designStyleSchema = v.record(v.string(), v.union([v.string(), v.number(), v.boolean()]));

export type DesignStyle = v.InferOutput<typeof designStyleSchema>;

export const designAtomNodeSchema = v.pipe(
  v.strictObject({
    id: designNodeIdSchema,
    kind: v.literal('atom'),
    atom: designAtomNameSchema,
    style: designStyleSchema,
    slots: v.pipe(v.array(v.string()), v.maxLength(8)),
  }),
  v.check((node) => new Set(node.slots).size === node.slots.length, 'Content option is listed twice'),
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
