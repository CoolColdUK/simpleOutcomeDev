import {TpActionKind} from './tpActionKind';

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export type TpActionKindColors = Partial<Record<TpActionKind | string, string>>;

export function tpParseActionKindColors(raw: unknown): TpActionKindColors | undefined {
  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return undefined;
  }
  const out: TpActionKindColors = {};
  Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!HEX_PATTERN.test(trimmed)) {
      return;
    }
    out[key] = trimmed;
  });
  return Object.keys(out).length > 0 ? out : undefined;
}

export function tpActionKindBackgroundColor(
  colors: TpActionKindColors | undefined,
  kind: string,
): string | undefined {
  if (colors === undefined) {
    return undefined;
  }
  const value = colors[kind];
  if (value === undefined || !HEX_PATTERN.test(value.trim())) {
    return undefined;
  }
  return value.trim();
}
