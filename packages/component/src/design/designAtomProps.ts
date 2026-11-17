import type {ButtonProps} from '@chakra-ui/react';
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
  return {
    ...styleEntries(style, (value) => value, (value) => designColourCss(value) ?? value),
    ...(typeof style['borderWidth'] === 'number' ? {borderStyle: 'solid' as const} : {}),
    ...(typeof style['gap'] === 'number' ? {display: 'inline-flex' as const} : {}),
    boxSizing: 'border-box',
  };
}

export function designButtonProps(style: DesignStyle): ButtonProps {
  return {
    background: 'siteAccent',
    color: 'siteButtonForeground',
    borderRadius: 'site',
    ...styleEntries(style, (value) => `${value}px`, (value) => value),
    ...(typeof style['borderWidth'] === 'number' ? {borderStyle: 'solid' as const} : {}),
  } as ButtonProps;
}

function styleEntries(style: DesignStyle, length: (value: number) => string | number, colour: (value: string) => string): CSSProperties {
  return Object.fromEntries(
    Object.entries(style).flatMap(([key, value]) => {
      if (typeof value === 'number') {
        return [[key, length(value)]];
      }
      if (typeof value === 'string') {
        return [[key, colour(value)]];
      }
      return [];
    }),
  );
}
