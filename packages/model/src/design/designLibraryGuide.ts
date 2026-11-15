import {DESIGN_CATEGORIES} from './designId';
import type {DesignAtom} from './designNode';

export interface DesignAtomField {
  readonly name: string;
  readonly kind: 'string' | 'boolean';
  readonly values?: readonly string[];
}

export interface DesignAtomGuide {
  readonly atom: DesignAtom;
  readonly label: string;
  readonly fields: readonly DesignAtomField[];
}

export const DESIGN_ATOM_GUIDE: readonly DesignAtomGuide[] = [
  {
    atom: 'button',
    label: 'Button',
    fields: [
      {name: 'label', kind: 'string'},
      {name: 'href', kind: 'string'},
      {name: 'background', kind: 'string'},
      {name: 'color', kind: 'string'},
    ],
  },
  {
    atom: 'iconButton',
    label: 'Icon button',
    fields: [
      {name: 'label', kind: 'string'},
      {name: 'href', kind: 'string'},
      {name: 'icon', kind: 'string', values: ['menu', 'close', 'phone', 'arrow']},
      {name: 'background', kind: 'string'},
      {name: 'color', kind: 'string'},
    ],
  },
  {
    atom: 'imageButton',
    label: 'Image button',
    fields: [
      {name: 'label', kind: 'string'},
      {name: 'href', kind: 'string'},
      {name: 'src', kind: 'string'},
      {name: 'alt', kind: 'string'},
    ],
  },
  {
    atom: 'link',
    label: 'Link',
    fields: [
      {name: 'label', kind: 'string'},
      {name: 'href', kind: 'string'},
      {name: 'color', kind: 'string'},
    ],
  },
  {
    atom: 'switch',
    label: 'Switch',
    fields: [
      {name: 'label', kind: 'string'},
      {name: 'checked', kind: 'boolean'},
    ],
  },
  {
    atom: 'text',
    label: 'Text',
    fields: [
      {name: 'text', kind: 'string'},
      {name: 'role', kind: 'string', values: ['heading', 'body']},
    ],
  },
];

export interface DesignLibraryGuide {
  readonly atoms: readonly DesignAtomGuide[];
  readonly moleculePatterns: readonly ['tree', 'accordion'];
  readonly organismCategories: typeof DESIGN_CATEGORIES;
  readonly node: string;
  readonly colourTokens: string;
}

export function designLibraryGuide(): DesignLibraryGuide {
  return {
    atoms: DESIGN_ATOM_GUIDE,
    moleculePatterns: ['tree', 'accordion'],
    organismCategories: DESIGN_CATEGORIES,
    node: 'Tree children are atoms {id, kind:"atom", atom, props}, molecules {id, kind:"molecule", moleculeId}, or stacks {id, kind:"stack", direction:"row"|"column", gapPx, children}. Accordion molecules use {pattern:"accordion", items:[{id, title, body}]}.',
    colourTokens:
      'tokens: {uppercaseHeadings, heroBackground, chakra:{theme:{tokens:{colors:{siteBackground,siteForeground,siteAccent,siteButtonForeground,siteCard}, fonts:{siteHeading,siteBody}, radii:{site}}}}}. Each colour, font, and radius is {value}. Colours are hex. Radius is 0px–32px. heroBackground is "none" or linear-gradient(135deg,#hex,#hex).',
  };
}
