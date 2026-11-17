import {DesignFieldKind} from '@so/model';
import type {ComponentType} from 'react';
import type {DesignAtomProps} from './designAtomProps';

export const DESIGN_OPTION_GROUPS = ['content', 'setting'] as const;

export const DESIGN_OPTION_KINDS = [
  DesignFieldKind.TEXT,
  DesignFieldKind.BOOLEAN,
  DesignFieldKind.NUMBER,
  DesignFieldKind.COLOUR,
  DesignFieldKind.CHOICE,
] as const;

export type DesignOptionGroup = (typeof DESIGN_OPTION_GROUPS)[number];

export type DesignOptionKind = `${DesignFieldKind}`;

export interface DesignOptionDefinition {
  readonly key: string;
  readonly label: string;
  readonly group: DesignOptionGroup;
  readonly kind: DesignOptionKind;
  readonly min?: number;
  readonly max?: number;
  readonly values?: readonly string[];
  readonly initial?: string | number | boolean;
}

export interface DesignAtomPart {
  readonly atom: string;
  readonly label: string;
  readonly options: readonly DesignOptionDefinition[];
  readonly Component: ComponentType<DesignAtomProps>;
}
