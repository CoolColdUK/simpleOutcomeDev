import {designAtomContentKeys, mergedDesignAtom, type DesignAtomField, type DesignAtomPreset, type DesignMolecule} from '@so/model';
import {designAtomOptions} from './designAtomCatalog';
import type {DesignOptionDefinition, DesignOptionKind} from './designOption';

export interface DesignContentField {
  readonly nodeId: string;
  readonly slot: string;
  readonly label: string;
  readonly kind: 'text' | 'boolean' | 'choice';
  readonly values?: readonly string[];
}

export function listMoleculeContentFields(
  molecule: DesignMolecule,
  molecules: readonly DesignMolecule[],
  atoms: readonly DesignAtomPreset[] = [],
  seen: ReadonlySet<string> = new Set(),
): DesignContentField[] {
  if (seen.has(molecule.id)) {
    return [];
  }
  const next = new Set(seen);
  next.add(molecule.id);
  return molecule.document.children.flatMap((node) => {
    if (node.kind === 'atom') {
      const preset = atoms.find((atom) => atom.id === node.presetId);
      const slots = node.slots.length > 0 ? node.slots : preset === undefined ? [] : designAtomContentKeys(preset, atoms);
      const fields = preset === undefined ? [] : mergedDesignAtom(preset, atoms).fields;
      return slots.map((slot) => {
        const option = designAtomOptions(node.atom).find((item) => item.key === slot);
        const field = fields.find((item) => item.key === slot);
        const values = choiceValues(field, option);
        return {
          nodeId: node.id,
          slot,
          label: field?.label ?? option?.label ?? slot,
          kind: contentKind(field?.kind ?? option?.kind),
          ...(values === undefined ? {} : {values: [...values]}),
        };
      });
    }
    const child = molecules.find((item) => item.id === node.moleculeId);
    if (child === undefined) {
      return [];
    }
    return listMoleculeContentFields(child, molecules, atoms, next).map((field) => ({
      ...field,
      nodeId: `${node.id}.${field.nodeId}`,
    }));
  });
}

function choiceValues(field: DesignAtomField | undefined, option: DesignOptionDefinition | undefined): readonly string[] | undefined {
  if ((field?.kind ?? option?.kind) !== 'choice') {
    return undefined;
  }
  if (field?.values !== undefined) {
    return field.values;
  }
  if (option?.kind === 'choice') {
    return option.values;
  }
  return undefined;
}

function contentKind(kind: DesignOptionKind | undefined): DesignContentField['kind'] {
  if (kind === 'boolean') {
    return 'boolean';
  }
  if (kind === 'choice') {
    return 'choice';
  }
  return 'text';
}
