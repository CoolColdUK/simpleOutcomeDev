const LEGACY_SETTINGS = new Set(['background', 'color', 'borderColor', 'paddingPx', 'marginPx', 'gapPx', 'radiusPx', 'borderWidthPx', 'fontSizePx', 'align', 'padding', 'margin', 'gap', 'borderRadius', 'borderWidth', 'fontSize', 'textAlign']);

const BOX_PROP_KEY: Record<string, string> = {
  paddingPx: 'padding',
  marginPx: 'margin',
  gapPx: 'gap',
  radiusPx: 'borderRadius',
  borderWidthPx: 'borderWidth',
  fontSizePx: 'fontSize',
  align: 'textAlign',
};

function boxPropKey(key: string): string {
  return BOX_PROP_KEY[key] ?? key;
}

function normaliseStyleRecord(style: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(style).map(([key, value]) => [boxPropKey(key), value]));
}
const LEGACY_CONTENT = new Set(['label', 'href', 'icon', 'src', 'alt', 'text', 'role', 'checked']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function field(record: Record<string, unknown>, key: string): unknown {
  return record[key];
}

function isAtomName(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][A-Za-z0-9]{0,40}$/.test(value);
}

function normaliseAtom(node: Record<string, unknown>): Record<string, unknown> {
  if (!isAtomName(field(node, 'atom'))) {
    return node;
  }
  const propsValue = field(node, 'props');
  const styleValue = field(node, 'style');
  const slotsValue = field(node, 'slots');
  const props = isRecord(propsValue) ? propsValue : {};
  const style = isRecord(styleValue) ? {...styleValue} : {};
  const slots = Array.isArray(slotsValue) ? slotsValue.filter((slot): slot is string => typeof slot === 'string') : [];
  Object.entries(props).forEach(([key, value]) => {
    if (LEGACY_SETTINGS.has(key)) {
      style[boxPropKey(key)] = value;
      return;
    }
    if (LEGACY_CONTENT.has(key) && !slots.includes(key)) {
      slots.push(key);
    }
  });
  const presetId = field(node, 'presetId');
  return {
    id: field(node, 'id'),
    kind: 'atom',
    atom: field(node, 'atom'),
    ...(typeof presetId === 'string' ? {presetId} : {}),
    style: normaliseStyleRecord(style),
    slots,
  };
}

export function normaliseDesignNodes(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((node) => {
    if (!isRecord(node)) {
      return [];
    }
    if (field(node, 'kind') === 'stack') {
      return normaliseDesignNodes(field(node, 'children'));
    }
    if (field(node, 'kind') === 'atom') {
      return [normaliseAtom(node)];
    }
    return [node];
  });
}

function layoutFromLegacyStack(value: Record<string, unknown>): Record<string, unknown> {
  const layout = field(value, 'layout');
  if (isRecord(layout)) {
    return layout;
  }
  const children = field(value, 'children');
  const list = Array.isArray(children) ? children : [];
  const only = list.length === 1 && isRecord(list[0]) ? list[0] : undefined;
  if (only === undefined || field(only, 'kind') !== 'stack') {
    return {};
  }
  const direction = field(only, 'direction');
  const gapPx = field(only, 'gapPx');
  return {
    ...(direction === 'row' || direction === 'column' ? {direction} : {}),
    ...(typeof gapPx === 'number' ? {gapPx} : {}),
  };
}

export function normaliseMoleculeDocument(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  if (field(value, 'pattern') === 'accordion') {
    return {
      pattern: 'combine',
      layout: {direction: 'column', gapPx: 8},
      children: [
        {id: 'trigger', kind: 'atom', atom: 'button', style: {}, slots: ['label']},
        {id: 'panel', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
      ],
    };
  }
  const container = field(value, 'container');
  return {
    pattern: field(value, 'pattern') === 'combine' ? 'combine' : 'tree',
    layout: layoutFromLegacyStack(value),
    ...(isRecord(container) ? {container} : {}),
    children: normaliseDesignNodes(field(value, 'children')),
  };
}

export function normaliseDesignAtomPreset(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  const fields = field(value, 'fields');
  const style = field(value, 'style');
  return {
    ...value,
    ...(Array.isArray(fields) ? {fields: fields.map((item) => (isRecord(item) && typeof item.key === 'string' ? {...item, key: boxPropKey(item.key)} : item))} : {}),
    ...(isRecord(style) ? {style: normaliseStyleRecord(style)} : {}),
  };
}

export function normaliseOrganismDocument(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  return {children: normaliseDesignNodes(field(value, 'children'))};
}
