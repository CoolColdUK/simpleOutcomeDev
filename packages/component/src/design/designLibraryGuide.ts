import {DESIGN_CATEGORIES} from '@so/model';
import {DESIGN_ATOM_RECORDS, type DesignAtom} from './designAtomRecords';
import type {DesignOptionKind} from './designOption';

export interface DesignAtomField {
  readonly name: string;
  readonly label: string;
  readonly group: 'content' | 'setting';
  readonly kind: DesignOptionKind;
  readonly min?: number;
  readonly max?: number;
  readonly values?: readonly string[];
}

export interface DesignAtomGuide {
  readonly atom: DesignAtom;
  readonly label: string;
  readonly fields: readonly DesignAtomField[];
}

export const DESIGN_ATOM_GUIDE: readonly DesignAtomGuide[] = DESIGN_ATOM_RECORDS.map((definition) => ({
  atom: definition.atom,
  label: definition.label,
  fields: definition.options.map((option) => ({
    name: option.key,
    label: option.label,
    group: option.group,
    kind: option.kind,
    ...('min' in option && option.min !== undefined ? {min: option.min} : {}),
    ...('max' in option && option.max !== undefined ? {max: option.max} : {}),
    ...('values' in option && option.values !== undefined ? {values: [...option.values]} : {}),
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
    node: 'JSON stores the atom name, settings, and content slot names. DesignNodes looks up that name and renders the Component exported beside the atom definition. content options are filled on a template item. setting options are passed into the component and are not limited to layout. Molecules and organisms are the same: the file exports the component and the stored document.',
    colourTokens:
      'tokens: {uppercaseHeadings, heroBackground, chakra:{theme:{tokens:{colors:{siteBackground,siteForeground,siteAccent,siteButtonForeground,siteCard}, fonts:{siteHeading,siteBody}, radii:{site}}}}}. Each colour, font, and radius is {value}. Colours are hex. Radius is 0px–32px. heroBackground is "none" or linear-gradient(135deg,#hex,#hex). Atom and molecule colours may be a hex or a theme name: siteBackground, siteForeground, siteAccent, siteButtonForeground, siteCard, hero.',
  };
}
