import type {DesignAtomPreset} from './designAtomPreset';
import type {DesignMolecule} from './designMolecule';
import {moleculeNodes} from './designMolecule';
import type {DesignNode} from './designNode';
import type {DesignOrganism} from './designOrganism';

export interface DesignLibraryRefs {
  molecules: readonly DesignMolecule[];
  organisms: readonly DesignOrganism[];
}

function first(messages: readonly (string | undefined)[]): string | undefined {
  return messages.find((message) => message !== undefined);
}

function walk(nodes: readonly DesignNode[], molecules: ReadonlyMap<string, DesignMolecule>, seen: ReadonlySet<string>, depth: number): string | undefined {
  if (depth > 4) {
    return 'A composition is nested too deeply';
  }
  return first(
    nodes.map((node) => {
      if (node.kind !== 'molecule') {
        return undefined;
      }
      if (seen.has(node.moleculeId)) {
        return `Molecule ${node.moleculeId} includes itself`;
      }
      const molecule = molecules.get(node.moleculeId);
      if (molecule === undefined) {
        return `Unknown molecule ${node.moleculeId}`;
      }
      const next = new Set(seen);
      next.add(node.moleculeId);
      return walk(moleculeNodes(molecule.document), molecules, next, depth + 1);
    }),
  );
}

export function designLibraryError(library: DesignLibraryRefs): string | undefined {
  const molecules = new Map(library.molecules.map((molecule) => [molecule.id, molecule]));
  if (molecules.size !== library.molecules.length) {
    return 'Two molecules share an id';
  }
  const organismIds = new Set(library.organisms.map((organism) => organism.id));
  if (organismIds.size !== library.organisms.length) {
    return 'Two sections share an id';
  }
  const moleculeError = first(
    library.molecules.map((molecule) => walk(moleculeNodes(molecule.document), molecules, new Set([molecule.id]), 1)),
  );
  if (moleculeError !== undefined) {
    return moleculeError;
  }
  return first(library.organisms.map((organism) => walk(organism.document.children, molecules, new Set(), 1)));
}

export function designPresetError(nodes: readonly DesignNode[], atoms: readonly Pick<DesignAtomPreset, 'id' | 'base'>[]): string | undefined {
  return first(
    nodes.map((node) => {
      if (node.kind !== 'atom' || node.presetId === undefined) {
        return undefined;
      }
      const preset = atoms.find((atom) => atom.id === node.presetId);
      if (preset === undefined) {
        return `Unknown atom preset ${node.presetId}`;
      }
      if (preset.base !== node.atom) {
        return `Atom preset ${node.presetId} is a ${preset.base}`;
      }
      return undefined;
    }),
  );
}

export function designAtomParentError(preset: Pick<DesignAtomPreset, 'id' | 'base' | 'parentId'>, atoms: readonly Pick<DesignAtomPreset, 'id' | 'base' | 'parentId'>[]): string | undefined {
  if (preset.parentId === undefined) {
    return undefined;
  }
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  byId.set(preset.id, preset);
  const seen = new Set<string>([preset.id]);
  let parentId: string | undefined = preset.parentId;
  while (parentId !== undefined) {
    if (seen.has(parentId)) {
      return 'An atom cannot extend itself';
    }
    const parent = byId.get(parentId);
    if (parent === undefined) {
      return `Unknown atom ${parentId}`;
    }
    if (parent.base !== preset.base) {
      return `Atom ${parentId} is a ${parent.base}`;
    }
    seen.add(parentId);
    parentId = parent.parentId;
  }
  return undefined;
}

export function designAtomUsedBy(id: string, library: DesignLibraryRefs & {atoms?: readonly Pick<DesignAtomPreset, 'id' | 'name' | 'parentId'>[]}): string | undefined {
  const child = library.atoms?.find((atom) => atom.parentId === id);
  if (child !== undefined) {
    return child.name;
  }
  const used = (nodes: readonly DesignNode[]): boolean => nodes.some((node) => node.kind === 'atom' && node.presetId === id);
  const molecule = library.molecules.find((item) => used(moleculeNodes(item.document)));
  if (molecule !== undefined) {
    return molecule.name;
  }
  const organism = library.organisms.find((item) => used(item.document.children));
  return organism?.name;
}

export function designMoleculeUsedBy(id: string, library: DesignLibraryRefs): string | undefined {
  const mention = (nodes: readonly DesignNode[]): boolean =>
    nodes.some((node) => {
      return node.kind === 'molecule' && node.moleculeId === id;
    });
  const molecule = library.molecules.find((item) => item.id !== id && mention(moleculeNodes(item.document)));
  if (molecule !== undefined) {
    return molecule.name;
  }
  const organism = library.organisms.find((item) => mention(item.document.children));
  return organism?.name;
}
