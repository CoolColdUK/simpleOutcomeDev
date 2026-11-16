import type {DesignAtomNode, DesignStyle} from '@so/model';
import type {CSSProperties} from 'react';

export interface DesignAtomProps {
  readonly node: DesignAtomNode;
  readonly values?: Readonly<Record<string, string | boolean>>;
}

export function designSlotText(node: DesignAtomNode, values: DesignAtomProps['values'], key: string, fallback: string): string {
  if (!node.slots.includes(key)) {
    return fallback;
  }
  const value = values?.[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export function designAtomCss(style: DesignStyle): CSSProperties {
  const borderWidth = numberStyle(style['borderWidthPx']);
  return {
    background: textStyle(style['background']),
    color: textStyle(style['color']),
    borderRadius: numberStyle(style['radiusPx']),
    borderStyle: borderWidth === undefined ? undefined : 'solid',
    borderWidth,
    borderColor: textStyle(style['borderColor']),
  };
}

export function textStyle(value: string | number | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function numberStyle(value: string | number | boolean | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined;
}
