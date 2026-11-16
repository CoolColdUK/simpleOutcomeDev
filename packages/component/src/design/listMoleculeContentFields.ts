import type {DesignMolecule} from '@so/model';
import {designAtomOptions} from './designAtomCatalog';
import type {DesignOptionKind} from './designOption';

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
  seen: ReadonlySet<string> = new Set(),
): DesignContentField[] {
  if (seen.has(molecule.id)) {
    return [];
  }
  const next = new Set(seen);
  next.add(molecule.id);
  return molecule.document.children.flatMap((node) => {
    if (node.kind === 'atom') {
      return node.slots.map((slot) => {
        const option = designAtomOptions(node.atom).find((item) => item.key === slot);
        return {
          nodeId: node.id,
          slot,
          label: option?.label ?? slot,
          kind: contentKind(option?.kind),
          ...(option?.values === undefined ? {} : {values: [...option.values]}),
        };
      });
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

function contentKind(kind: DesignOptionKind | undefined): DesignContentField['kind'] {
  if (kind === 'boolean') {
    return 'boolean';
  }
  if (kind === 'choice') {
    return 'choice';
  }
  return 'text';
}
