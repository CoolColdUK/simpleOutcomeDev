import {designAtomContentKeys, type DesignAtomNode, type DesignAtomPreset} from '@so/model';

export function resolveDesignAtom(node: DesignAtomNode, atoms: readonly DesignAtomPreset[]): DesignAtomNode {
  if (node.presetId === undefined) {
    return node;
  }
  const preset = atoms.find((atom) => atom.id === node.presetId);
  if (preset === undefined) {
    return node;
  }
  const slots = node.slots.length > 0 ? node.slots : designAtomContentKeys(preset);
  return {...node, atom: preset.base, slots, style: {...preset.style, ...node.style}};
}
