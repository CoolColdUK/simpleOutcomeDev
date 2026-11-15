import * as v from 'valibot';
import {designAtomOptions} from './designAtomOptions';
import {designIdSchema, designNodeIdSchema} from './designId';
import type {DesignMolecule} from './designMolecule';

const slotValueSchema = v.union([v.string(), v.boolean()]);

export const designTemplateItemSchema = v.strictObject({
  id: designNodeIdSchema,
  moleculeId: designIdSchema,
  values: v.record(v.string(), v.record(v.string(), slotValueSchema)),
});

export interface DesignTemplateItem extends v.InferOutput<typeof designTemplateItemSchema> {}

export const designTemplateItemsSchema = v.pipe(v.array(designTemplateItemSchema), v.maxLength(40));

export interface DesignContentField {
  readonly nodeId: string;
  readonly slot: string;
  readonly label: string;
  readonly kind: 'text' | 'boolean' | 'icon' | 'role';
}

export function listMoleculeContentFields(
  molecule: DesignMolecule,
  molecules: readonly DesignMolecule[],
  seen: ReadonlySet<string> = new Set(),
): DesignContentField[] {
  if (seen.has(molecule.id)) {
    return [];
  }
  const next = new Set(seen);
  next.add(molecule.id);
  return molecule.document.children.flatMap((node) => {
    if (node.kind === 'atom') {
      return node.slots.map((slot) => ({
        nodeId: node.id,
        slot,
        label: designAtomOptions(node.atom).find((option) => option.key === slot)?.label ?? slot,
        kind: slotKind(slot),
      }));
    }
    const child = molecules.find((item) => item.id === node.moleculeId);
    if (child === undefined) {
      return [];
    }
    return listMoleculeContentFields(child, molecules, next).map((field) => ({
      ...field,
      nodeId: `${node.id}.${field.nodeId}`,
    }));
  });
}

function slotKind(slot: string): DesignContentField['kind'] {
  if (slot === 'checked') {
    return 'boolean';
  }
  if (slot === 'icon') {
    return 'icon';
  }
  if (slot === 'role') {
    return 'role';
  }
  return 'text';
}
