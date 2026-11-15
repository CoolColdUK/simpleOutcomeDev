import * as v from 'valibot';
import {cleanStudioTheme} from '../site/siteThemes';
import {blankDesignAtom, blankMoleculeDocument} from './blankDesignNode';
import {chakraConfigFromColourScheme, colourSchemeToSiteTheme, siteThemeToColourTokens} from './designColourScheme';
import {DESIGN_COLOUR_SCHEME_SEED, DESIGN_MOLECULE_SEED, DESIGN_ORGANISM_SEED} from './designLibrarySeed';
import {designMoleculeDocumentSchema} from './designMolecule';
import {designNodeSchema} from './designNode';
import {designOrganismDocumentSchema} from './designOrganism';
import {parseDesignColourTokens, parseDesignId} from './parseDesignValue';
import {DESIGN_ATOM_GUIDE, designLibraryGuide} from './designLibraryGuide';
import {DESIGN_ATOMS} from './designNode';
import {designLibraryError} from './designReferences';

describe('design library', () => {
  it('turns a site theme into Chakra tokens and back', () => {
    const tokens = siteThemeToColourTokens(cleanStudioTheme);
    expect(colourSchemeToSiteTheme(tokens)).toEqual(cleanStudioTheme);
    expect(chakraConfigFromColourScheme(tokens).theme.tokens.colors.siteAccent.value).toBe(cleanStudioTheme.accent);
  });

  it('seeds a colour scheme for every existing template', () => {
    expect(DESIGN_COLOUR_SCHEME_SEED.map((scheme) => scheme.id)).toEqual([
      'clean-studio',
      'soft-luxury',
      'portfolio-first',
      'home-studio',
      'bold-nail-bar',
      'clinic-professional',
      'hair-beauty-menu',
      'review-led',
      'courses-treatments',
      'neighbourhood-salon',
    ]);
    DESIGN_COLOUR_SCHEME_SEED.forEach((scheme) => {
      expect(colourSchemeToSiteTheme(scheme.tokens).background.startsWith('#')).toBe(true);
    });
  });

  it('accepts the seeded molecules and sections', () => {
    DESIGN_MOLECULE_SEED.forEach((molecule) => {
      expect(v.parse(designMoleculeDocumentSchema, molecule.document).pattern).toBe(molecule.document.pattern);
    });
    DESIGN_ORGANISM_SEED.forEach((organism) => {
      expect(v.parse(designOrganismDocumentSchema, organism.document).children.length).toBeGreaterThan(0);
    });
    expect(designLibraryError({molecules: DESIGN_MOLECULE_SEED, organisms: DESIGN_ORGANISM_SEED})).toBeUndefined();
  });

  it('rejects a molecule that includes itself', () => {
    const loop = {
      id: 'loop',
      name: 'Loop',
      document: v.parse(designMoleculeDocumentSchema, {
        pattern: 'tree',
        children: [{id: 'self', kind: 'molecule', moleculeId: 'loop'}],
      }),
    };
    expect(designLibraryError({molecules: [loop], organisms: []})).toBe('Molecule loop includes itself');
  });

  it('rejects an id or colour token that does not match the scheme', () => {
    expect(() => parseDesignId('Clean Studio')).toThrow(/id/);
    expect(() => parseDesignColourTokens({uppercaseHeadings: false})).toThrow(/tokens/);
  });

  it('describes every atom for the design tools', () => {
    expect(DESIGN_ATOM_GUIDE.map((entry) => entry.atom)).toEqual([...DESIGN_ATOMS]);
    expect(designLibraryGuide().moleculePatterns).toEqual(['tree', 'accordion']);
  });

  it('parses a blank atom', () => {
    expect(v.parse(designNodeSchema, blankDesignAtom('link', 'home')).kind).toBe('atom');
    expect(blankMoleculeDocument().pattern).toBe('tree');
  });
});
