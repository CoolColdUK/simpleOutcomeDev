import type {ComponentType} from 'react';
import type {DesignAtomProps} from './designAtomProps';

export const DESIGN_OPTION_GROUPS = ['content', 'setting'] as const;

export const DESIGN_OPTION_KINDS = ['text', 'boolean', 'number', 'colour', 'choice'] as const;

export type DesignOptionGroup = (typeof DESIGN_OPTION_GROUPS)[number];

export type DesignOptionKind = (typeof DESIGN_OPTION_KINDS)[number];

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
