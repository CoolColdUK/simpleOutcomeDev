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
      if (node.kind === 'stack') {
        return walk(node.children, molecules, seen, depth + 1);
      }
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

export function designMoleculeUsedBy(id: string, library: DesignLibraryRefs): string | undefined {
  const mention = (nodes: readonly DesignNode[]): boolean =>
    nodes.some((node) => {
      if (node.kind === 'molecule') {
        return node.moleculeId === id;
      }
      if (node.kind === 'stack') {
        return mention(node.children);
      }
      return false;
    });
  const molecule = library.molecules.find((item) => item.id !== id && mention(moleculeNodes(item.document)));
  if (molecule !== undefined) {
    return molecule.name;
  }
  const organism = library.organisms.find((item) => mention(item.document.children));
  return organism?.name;
}
