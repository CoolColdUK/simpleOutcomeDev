import * as v from 'valibot';
import {designNodeSchema, type DesignNode} from './designNode';

export const designFlexSchema = v.strictObject({
  direction: v.optional(v.picklist(['row', 'column'])),
  gapPx: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(64))),
  align: v.optional(v.picklist(['start', 'center', 'end', 'stretch'])),
  valign: v.optional(v.picklist(['start', 'center', 'end', 'stretch'])),
  wrap: v.optional(v.picklist(['nowrap', 'wrap'])),
});

export type DesignFlex = v.InferOutput<typeof designFlexSchema>;

export const designMoleculeDocumentSchema = v.strictObject({
  pattern: v.picklist(['tree', 'combine']),
  layout: designFlexSchema,
  children: v.pipe(v.array(designNodeSchema), v.minLength(1), v.maxLength(12)),
});

export type DesignMoleculeDocument = v.InferOutput<typeof designMoleculeDocumentSchema>;

export interface DesignMolecule {
  id: string;
  name: string;
  document: DesignMoleculeDocument;
}

export function moleculeNodes(document: DesignMoleculeDocument): readonly DesignNode[] {
  return document.children;
}
