import * as v from 'valibot';
import {siteHexColourSchema} from '../site/siteTextSchema';
import {designNodeSchema, type DesignNode} from './designNode';

export const designFlexSchema = v.strictObject({
  direction: v.optional(v.picklist(['row', 'column'])),
  gapPx: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(64))),
  align: v.optional(v.picklist(['start', 'center', 'end', 'stretch'])),
  valign: v.optional(v.picklist(['start', 'center', 'end', 'stretch'])),
  wrap: v.optional(v.picklist(['nowrap', 'wrap'])),
});

export type DesignFlex = v.InferOutput<typeof designFlexSchema>;

const px = (max: number) => v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(max));

export const designContainerSchema = v.strictObject({
  widthPx: v.optional(px(960)),
  heightPx: v.optional(px(960)),
  minWidthPx: v.optional(px(960)),
  minHeightPx: v.optional(px(960)),
  maxWidthPx: v.optional(px(960)),
  maxHeightPx: v.optional(px(960)),
  paddingPx: v.optional(px(64)),
  background: v.optional(siteHexColourSchema),
  radiusPx: v.optional(px(32)),
  borderWidthPx: v.optional(px(8)),
  borderColor: v.optional(siteHexColourSchema),
});

export type DesignContainer = v.InferOutput<typeof designContainerSchema>;

export const designMoleculeDocumentSchema = v.strictObject({
  pattern: v.picklist(['tree', 'combine']),
  layout: designFlexSchema,
  container: v.optional(designContainerSchema),
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
