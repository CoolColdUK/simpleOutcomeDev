import {DESIGN_THEME_COLOURS, type DesignAtomField, type DesignAtomNode, type DesignAtomPreset, type DesignNode} from '@so/model';
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
    return typeof value === 'string' && (HEX_COLOUR.test(value) || DESIGN_THEME_COLOURS.some((colour) => colour === value));
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

export function assertDesignAtomPreset(preset: DesignAtomPreset): void {
  const part = designAtomPart(preset.base);
  if (part === undefined) {
    throw new Error(`Unknown atom ${preset.base}`);
  }
  Object.entries(preset.style).forEach(([key, value]) => {
    const field = preset.fields.find((item) => item.key === key && item.group === 'setting');
    if (field === undefined || !fieldValueOk(field, value, part.options)) {
      throw new Error(`Setting ${key} is not available on ${preset.base}`);
    }
  });
}

function fieldValueOk(field: DesignAtomField, value: unknown, options: readonly DesignOptionDefinition[]): boolean {
  const option = options.find((item) => item.key === field.key && item.kind === field.kind);
  if (field.kind === 'colour') {
    return typeof value === 'string' && (HEX_COLOUR.test(value) || DESIGN_THEME_COLOURS.some((colour) => colour === value));
  }
  if (field.kind === 'number') {
    return typeof value === 'number' && Number.isInteger(value) && value >= (option?.min ?? 0) && value <= (option?.max ?? 960);
  }
  if (field.kind === 'boolean') {
    return typeof value === 'boolean';
  }
  if (field.kind === 'choice') {
    const values = field.values ?? option?.values;
    return typeof value === 'string' && (values === undefined ? value.length > 0 && value.length <= 40 : values.some((choice) => choice === value));
  }
  return typeof value === 'string' && value.length <= 200;
}
