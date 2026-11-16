import * as v from 'valibot';
import {cleanStudioTheme} from '../site/siteThemes';
import {blankDesignAtom, blankMoleculeDocument} from './blankDesignNode';
import {chakraConfigFromColourScheme, colourSchemeToSiteTheme, siteThemeToColourTokens} from './designColourScheme';
import {DESIGN_COLOUR_SCHEME_SEED} from './designLibrarySeed';
import {designMoleculeDocumentSchema} from './designMolecule';
import {designNodeSchema} from './designNode';
import {parseDesignColourTokens, parseDesignId, parseDesignMoleculeDocument} from './parseDesignValue';
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

  it('rejects a molecule that includes itself', () => {
    const loop = {
      id: 'loop',
      name: 'Loop',
      document: v.parse(designMoleculeDocumentSchema, {
        pattern: 'tree',
        layout: {},
        children: [{id: 'self', kind: 'molecule', moleculeId: 'loop'}],
      }),
    };
    expect(designLibraryError({molecules: [loop], organisms: []})).toBe('Molecule loop includes itself');
  });

  it('rejects an id or colour token that does not match the scheme', () => {
    expect(() => parseDesignId('Clean Studio')).toThrow(/id/);
    expect(() => parseDesignColourTokens({uppercaseHeadings: false})).toThrow(/tokens/);
  });

  it('turns an old accordion into a combine without copying its text', () => {
    const document = parseDesignMoleculeDocument({
      pattern: 'accordion',
      items: [{id: 'downtime', title: 'Is there any downtime?', body: 'It depends.'}],
    });
    expect(document.pattern).toBe('combine');
    expect(JSON.stringify(document)).not.toContain('downtime');
    expect(document.children.some((node) => node.kind === 'atom' && node.slots.includes('label'))).toBe(true);
  });

  it('keeps an optional container on the molecule', () => {
    const document = parseDesignMoleculeDocument({
      pattern: 'tree',
      layout: {direction: 'row', align: 'center'},
      container: {minHeightPx: 48, minWidthPx: 120, paddingPx: 12},
      children: [{id: 'agree', kind: 'atom', atom: 'checkbox', style: {}, slots: ['label', 'checked']}],
    });
    expect(document.container?.minHeightPx).toBe(48);
    expect(document.children[0]).toMatchObject({atom: 'checkbox'});
  });

  it('parses a blank atom', () => {
    expect(v.parse(designNodeSchema, blankDesignAtom('link', 'home')).kind).toBe('atom');
    expect(blankMoleculeDocument().pattern).toBe('tree');
  });
});
