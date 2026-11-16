import type {DesignAtomNode, DesignNode} from '@so/model';
import {DESIGN_ATOM_DEFINITIONS, type DesignAtom} from './atoms';
import type {DesignOptionDefinition} from './designOption';

const HEX_COLOUR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function designAtomPart(atom: string) {
  return DESIGN_ATOM_DEFINITIONS.find((definition) => definition.atom === atom);
}

export function designAtomOptions(atom: string): readonly DesignOptionDefinition[] {
  return designAtomPart(atom)?.options ?? [];
}

export function isDesignAtom(atom: string): atom is DesignAtom {
  return designAtomPart(atom) !== undefined;
}

export function assertDesignNodes(nodes: readonly DesignNode[]): void {
  nodes.forEach((node) => {
    if (node.kind !== 'atom') {
      return;
    }
    assertDesignAtom(node);
  });
}

function assertDesignAtom(node: DesignAtomNode): void {
  const part = designAtomPart(node.atom);
  if (part === undefined) {
    throw new Error(`Unknown atom ${node.atom}`);
  }
  node.slots.forEach((slot) => {
    if (!part.options.some((option) => option.group === 'content' && option.key === slot)) {
      throw new Error(`Content option ${slot} is not available on ${node.atom}`);
    }
  });
  Object.entries(node.style).forEach(([key, value]) => {
    if (!settingOk(part.options, key, value)) {
      throw new Error(`Setting ${key} is not available on ${node.atom}`);
    }
  });
}

function settingOk(options: readonly DesignOptionDefinition[], key: string, value: unknown): boolean {
  const option = options.find((item) => item.group === 'setting' && item.key === key);
  if (option === undefined) {
    return false;
  }
  if (option.kind === 'colour') {
    return typeof value === 'string' && HEX_COLOUR.test(value);
  }
  if (option.kind === 'number') {
    return typeof value === 'number' && Number.isInteger(value) && value >= (option.min ?? 0) && value <= (option.max ?? 960);
  }
  if (option.kind === 'boolean') {
    return typeof value === 'boolean';
  }
  if (option.kind === 'choice') {
    return typeof value === 'string' && (option.values ?? []).some((choice) => choice === value);
  }
  return typeof value === 'string' && value.length <= 200;
}
