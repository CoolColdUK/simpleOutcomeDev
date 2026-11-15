import {DESIGN_ATOMS, designAtomOptions, type DesignAtom} from './designAtomOptions';
import {DESIGN_CATEGORIES} from './designId';

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

const ATOM_LABELS: Record<DesignAtom, string> = {
  button: 'Button',
  iconButton: 'Icon button',
  imageButton: 'Image button',
  link: 'Link',
  switch: 'Switch',
  text: 'Text',
};

export const DESIGN_ATOM_GUIDE: readonly DesignAtomGuide[] = DESIGN_ATOMS.map((atom) => ({
  atom,
  label: ATOM_LABELS[atom],
  fields: designAtomOptions(atom).map((option) => ({
    name: option.key,
    kind: option.key === 'checked' ? 'boolean' : 'string',
    ...(option.key === 'icon' ? {values: ['menu', 'close', 'phone', 'arrow']} : {}),
    ...(option.key === 'role' ? {values: ['heading', 'body']} : {}),
  })),
}));

export interface DesignLibraryGuide {
  readonly atoms: readonly DesignAtomGuide[];
  readonly moleculePatterns: readonly ['tree', 'combine'];
  readonly organismCategories: typeof DESIGN_CATEGORIES;
  readonly node: string;
  readonly colourTokens: string;
}

export function designLibraryGuide(): DesignLibraryGuide {
  return {
    atoms: DESIGN_ATOM_GUIDE,
    moleculePatterns: ['tree', 'combine'],
    organismCategories: DESIGN_CATEGORIES,
    node: 'A molecule is {pattern:"tree"|"combine", layout:{direction,gapPx,align,valign,wrap}, children}. Children are atoms {id, kind:"atom", atom, style, slots} or molecules {id, kind:"molecule", moleculeId}. style holds colours, radius, and border. slots name the content filled later on a template item. Do not put label, href, or text values on the molecule.',
    colourTokens:
      'tokens: {uppercaseHeadings, heroBackground, chakra:{theme:{tokens:{colors:{siteBackground,siteForeground,siteAccent,siteButtonForeground,siteCard}, fonts:{siteHeading,siteBody}, radii:{site}}}}}. Each colour, font, and radius is {value}. Colours are hex. Radius is 0px–32px. heroBackground is "none" or linear-gradient(135deg,#hex,#hex).',
  };
}
