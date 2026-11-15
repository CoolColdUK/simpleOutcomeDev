import {isDesignContentKey, isDesignStyleKey, type DesignAtom} from './designAtomOptions';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAtomName(value: unknown): value is DesignAtom {
  return value === 'button' || value === 'iconButton' || value === 'imageButton' || value === 'link' || value === 'switch' || value === 'text';
}

function normaliseAtom(node: Record<string, unknown>): Record<string, unknown> {
  if (!isAtomName(node.atom)) {
    return node;
  }
  const props = isRecord(node.props) ? node.props : {};
  const style = isRecord(node.style) ? {...node.style} : {};
  const slots = Array.isArray(node.slots) ? node.slots.filter((slot): slot is string => typeof slot === 'string') : [];
  Object.entries(props).forEach(([key, value]) => {
    if (isDesignStyleKey(node.atom as DesignAtom, key)) {
      style[key] = value;
      return;
    }
    if (isDesignContentKey(node.atom as DesignAtom, key) && !slots.includes(key)) {
      slots.push(key);
    }
  });
  return {id: node.id, kind: 'atom', atom: node.atom, style, slots};
}

export function normaliseDesignNodes(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((node) => {
    if (!isRecord(node)) {
      return [];
    }
    if (node.kind === 'stack') {
      return normaliseDesignNodes(node.children);
    }
    if (node.kind === 'atom') {
      return [normaliseAtom(node)];
    }
    return [node];
  });
}

function layoutFromLegacyStack(value: Record<string, unknown>): Record<string, unknown> {
  if (isRecord(value.layout)) {
    return value.layout;
  }
  const children = Array.isArray(value.children) ? value.children : [];
  const only = children.length === 1 && isRecord(children[0]) ? children[0] : undefined;
  if (only?.kind !== 'stack') {
    return {};
  }
  return {
    ...(only.direction === 'row' || only.direction === 'column' ? {direction: only.direction} : {}),
    ...(typeof only.gapPx === 'number' ? {gapPx: only.gapPx} : {}),
  };
}

export function normaliseMoleculeDocument(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  if (value.pattern === 'accordion') {
    return {
      pattern: 'combine',
      layout: {direction: 'column', gapPx: 8},
      children: [
        {id: 'trigger', kind: 'atom', atom: 'button', style: {}, slots: ['label']},
        {id: 'panel', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
      ],
    };
  }
  return {
    pattern: value.pattern === 'combine' ? 'combine' : 'tree',
    layout: layoutFromLegacyStack(value),
    children: normaliseDesignNodes(value.children),
  };
}

export function normaliseOrganismDocument(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  return {children: normaliseDesignNodes(value.children)};
}
