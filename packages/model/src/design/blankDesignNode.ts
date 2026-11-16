import type {DesignNode} from './designNode';
import type {DesignMoleculeDocument} from './designMolecule';
import type {DesignOrganismDocument} from './designOrganism';

export function blankDesignAtom(atom: string, id: string): DesignNode {
  return {id, kind: 'atom', atom, style: {}, slots: []};
}

export function blankDesignMoleculeUse(id: string, moleculeId: string): DesignNode {
  return {id, kind: 'molecule', moleculeId};
}

export function blankMoleculeDocument(): DesignMoleculeDocument {
  return {pattern: 'tree', layout: {}, children: [blankDesignAtom('button', 'button')]};
}

export function blankCombineDocument(): DesignMoleculeDocument {
  return {pattern: 'combine', layout: {}, children: [blankDesignAtom('button', 'button')]};
}

export function blankOrganismDocument(): DesignOrganismDocument {
  return {children: [blankDesignAtom('text', 'title')]};
}
