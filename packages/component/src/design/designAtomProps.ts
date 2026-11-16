import type {DesignAtomNode, DesignStyle} from '@so/model';
import type {CSSProperties} from 'react';
import {designColourCss} from './designLayoutStyle';

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
  const gap = numberStyle(style['gapPx']);
  return {
    background: designColourCss(style['background']),
    color: designColourCss(style['color']),
    borderRadius: numberStyle(style['radiusPx']),
    borderStyle: borderWidth === undefined ? undefined : 'solid',
    borderWidth,
    borderColor: designColourCss(style['borderColor']),
    padding: numberStyle(style['paddingPx']),
    margin: numberStyle(style['marginPx']),
    gap,
    display: gap === undefined ? undefined : 'inline-flex',
    fontSize: numberStyle(style['fontSizePx']),
    textAlign: alignStyle(style['align']),
    boxSizing: 'border-box',
  };
}

function numberStyle(value: string | number | boolean | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function alignStyle(value: string | number | boolean | undefined): CSSProperties['textAlign'] {
  if (value === 'center' || value === 'end' || value === 'start') {
    return value;
  }
  return undefined;
}
