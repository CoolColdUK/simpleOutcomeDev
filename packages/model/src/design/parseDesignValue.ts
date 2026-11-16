import * as v from 'valibot';
import {designAtomPresetSchema, type DesignAtomPreset} from './designAtomPreset';
import {designColourTokensSchema, type DesignColourTokens} from './designColourScheme';
import {designCategorySchema, designIdSchema, type DesignCategory} from './designId';
import {designMoleculeDocumentSchema, type DesignMoleculeDocument} from './designMolecule';
import {normaliseMoleculeDocument, normaliseOrganismDocument} from './normaliseDesignDocument';
import {designOrganismDocumentSchema, type DesignOrganismDocument} from './designOrganism';
import {designTemplateItemsSchema, type DesignTemplateItem} from './designTemplateItem';

function parse<T>(schema: v.GenericSchema<T>, value: unknown, label: string): T {
  const result = v.safeParse(schema, value);
  if (result.success) {
    return result.output;
  }
  const issue = result.issues[0];
  const path = issue?.path?.map((item) => item.key).join('.') ?? '';
  const where = path.length > 0 ? `${label}.${path}` : label;
  throw new Error(`${where}: ${issue?.message ?? 'Invalid value'}`);
}

export function parseDesignId(value: unknown): string {
  return parse(designIdSchema, value, 'id');
}

export function parseDesignCategory(value: unknown): DesignCategory {
  return parse(designCategorySchema, value, 'category');
}

export function parseDesignColourTokens(value: unknown): DesignColourTokens {
  return parse(designColourTokensSchema, value, 'tokens');
}

export function parseDesignMoleculeDocument(value: unknown): DesignMoleculeDocument {
  return parse(designMoleculeDocumentSchema, normaliseMoleculeDocument(value), 'document');
}

export function parseDesignOrganismDocument(value: unknown): DesignOrganismDocument {
  return parse(designOrganismDocumentSchema, normaliseOrganismDocument(value), 'document');
}

export function parseDesignAtomPreset(value: unknown): DesignAtomPreset {
  return parse(designAtomPresetSchema, value, 'atom');
}

export function parseDesignTemplateItems(value: unknown): DesignTemplateItem[] {
  return parse(designTemplateItemsSchema, value ?? [], 'items');
}
