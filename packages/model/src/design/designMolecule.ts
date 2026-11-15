import * as v from 'valibot';
import {siteBodySchema, siteShortTextSchema} from '../site/siteTextSchema';
import {designNodeIdSchema} from './designId';
import {designNodeSchema, type DesignNode} from './designNode';

export const designAccordionItemSchema = v.strictObject({
  id: designNodeIdSchema,
  title: siteShortTextSchema,
  body: siteBodySchema,
});

export interface DesignAccordionItem extends v.InferOutput<typeof designAccordionItemSchema> {}

export const designMoleculeDocumentSchema = v.variant('pattern', [
  v.strictObject({
    pattern: v.literal('tree'),
    children: v.pipe(v.array(designNodeSchema), v.minLength(1), v.maxLength(12)),
  }),
  v.strictObject({
    pattern: v.literal('accordion'),
    items: v.pipe(v.array(designAccordionItemSchema), v.minLength(1), v.maxLength(12)),
  }),
]);

export type DesignMoleculeDocument = v.InferOutput<typeof designMoleculeDocumentSchema>;

export interface DesignMolecule {
  id: string;
  name: string;
  document: DesignMoleculeDocument;
}

export function moleculeNodes(document: DesignMoleculeDocument): readonly DesignNode[] {
  if (document.pattern === 'tree') {
    return document.children;
  }
  return [];
}
