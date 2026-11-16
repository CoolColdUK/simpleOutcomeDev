import {designAtomContentKeys, mergedDesignAtom, type DesignAtomNode, type DesignAtomPreset} from '@so/model';

export function resolveDesignAtom(node: DesignAtomNode, atoms: readonly DesignAtomPreset[]): DesignAtomNode {
  if (node.presetId === undefined) {
    return node;
  }
  const preset = atoms.find((atom) => atom.id === node.presetId);
  if (preset === undefined) {
    return node;
  }
  const merged = mergedDesignAtom(preset, atoms);
  const slots = node.slots.length > 0 ? node.slots : designAtomContentKeys(preset, atoms);
  return {...node, atom: merged.base, slots, style: {...merged.style, ...node.style}};
}
