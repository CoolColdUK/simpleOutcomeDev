import * as v from 'valibot';
import {designCategorySchema, type DesignCategory} from './designId';
import {designNodeSchema, type DesignNode} from './designNode';

export const designOrganismDocumentSchema = v.strictObject({
  children: v.pipe(v.array(designNodeSchema), v.minLength(1), v.maxLength(16)),
});

export interface DesignOrganismDocument extends v.InferOutput<typeof designOrganismDocumentSchema> {}

export interface DesignOrganism {
  id: string;
  name: string;
  category: DesignCategory;
  document: DesignOrganismDocument;
}

export function organismNodes(document: DesignOrganismDocument): readonly DesignNode[] {
  return document.children;
}

export {designCategorySchema};
