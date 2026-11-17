import * as v from 'valibot';
import {cleanStudioTheme} from '../site/siteThemes';
import {BOLD_NAIL_ATOMS, BOLD_NAIL_MOLECULES, BOLD_NAIL_ORGANISMS, BOLD_NAIL_TEMPLATE_ITEMS} from './boldNailBarLibrary';
import {blankDesignAtom, blankMoleculeDocument} from './blankDesignNode';
import {blankDesignAtomPreset, mergedDesignAtom} from './designAtomPreset';
import {chakraConfigFromColourScheme, colourSchemeToSiteTheme, siteThemeToColourTokens} from './designColourScheme';
import {DESIGN_COLOUR_SCHEME_SEED} from './designLibrarySeed';
import {designMoleculeDocumentSchema} from './designMolecule';
import {designNodeSchema} from './designNode';
import {parseDesignAtomPreset, parseDesignColourTokens, parseDesignId, parseDesignMoleculeDocument, parseDesignTemplateItems} from './parseDesignValue';
import {designAtomParentError, designLibraryError, designPresetError} from './designReferences';

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

  it('accepts a theme colour on a molecule box', () => {
    const document = parseDesignMoleculeDocument({
      pattern: 'tree',
      layout: {direction: 'column', gapPx: 8},
      container: {paddingPx: 16, marginPx: 0, background: 'hero', borderColor: 'siteAccent', borderWidthPx: 1},
      children: [{id: 'title', kind: 'atom', atom: 'text', presetId: 'heading', style: {color: 'siteButtonForeground'}, slots: []}],
    });
    expect(document.container?.background).toBe('hero');
    expect(document.children[0]).toMatchObject({presetId: 'heading'});
  });

  it('breaks bold nail bar into its own sections and molecules', () => {
    expect(BOLD_NAIL_ORGANISMS.map((section) => section.id)).toEqual([
      'bold-nail-header',
      'bold-nail-hero',
      'bold-nail-services',
      'bold-nail-gallery',
      'bold-nail-footer',
    ]);
    expect(designLibraryError({molecules: [...BOLD_NAIL_MOLECULES], organisms: [...BOLD_NAIL_ORGANISMS]})).toBeUndefined();
    BOLD_NAIL_MOLECULES.forEach((molecule) => {
      expect(designPresetError(molecule.document.children, [...BOLD_NAIL_ATOMS])).toBeUndefined();
    });
    expect(parseDesignTemplateItems([...BOLD_NAIL_TEMPLATE_ITEMS])).toHaveLength(5);
    expect(parseDesignAtomPreset(blankDesignAtomPreset()).fields).toEqual([]);
    const heading = BOLD_NAIL_ATOMS.find((atom) => atom.id === 'heading');
    expect(heading).toBeDefined();
    if (heading !== undefined) {
      expect(parseDesignAtomPreset(heading).fields.some((field) => field.kind === 'choice' && field.values === undefined)).toBe(true);
    }
    expect(
      parseDesignAtomPreset({
        id: 'pill',
        name: 'Pill',
        base: 'button',
        fields: [{key: 'size', label: 'Size', group: 'setting', kind: 'choice', values: ['sm', 'lg']}],
        style: {size: 'sm'},
      }).fields[0]?.values,
    ).toEqual(['sm', 'lg']);
    expect(() =>
      parseDesignAtomPreset({
        id: 'pill',
        name: 'Pill',
        base: 'button',
        fields: [{key: 'label', label: 'Label', group: 'content', kind: 'text', values: ['A']}],
        style: {},
      }),
    ).toThrow(/dropdown/);
    const button = {id: 'button', name: 'Button', base: 'button', fields: [], style: {}};
    const accent = BOLD_NAIL_ATOMS.find((atom) => atom.id === 'accent-button');
    expect(accent?.parentId).toBe('button');
    if (accent !== undefined) {
      const pink = {id: 'pink-button', name: 'Pink button', base: 'button', parentId: 'accent-button', fields: [], style: {}};
      expect(mergedDesignAtom(pink, [button, accent, pink]).style['background']).toBe('siteAccent');
      expect(designAtomParentError(pink, [button, accent])).toBeUndefined();
      expect(designAtomParentError({id: 'pink-text', base: 'text', parentId: 'accent-button'}, [accent])).toBe('Atom accent-button is a button');
    }
    expect(designPresetError([{id: 'title', kind: 'atom', atom: 'text', presetId: 'missing', style: {}, slots: []}], [])).toBe('Unknown atom preset missing');
  });
});
