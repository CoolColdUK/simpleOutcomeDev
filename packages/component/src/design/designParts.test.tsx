import {renderToStaticMarkup} from 'react-dom/server';
import type {ReactNode} from 'react';
import {BOLD_NAIL_ATOMS, BOLD_NAIL_MOLECULES, BOLD_NAIL_TEMPLATE_ITEMS, DESIGN_COLOUR_SCHEME_SEED, DesignFieldKind, parseDesignMoleculeDocument} from '@so/model';
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {ButtonAtom} from './atoms/button';
import {DESIGN_ATOMS} from './atoms';
import {assertDesignAtomPreset} from './designAtomCatalog';
import {DesignNodes} from './DesignNodes';
import {DESIGN_ATOM_GUIDE} from './designLibraryGuide';
import {listMoleculeContentFields} from './listMoleculeContentFields';
import {DESIGN_MOLECULE_SEED} from './molecules';
import {DESIGN_ORGANISM_SEED} from './organisms';
import DesignThemeProvider from './DesignThemeProvider';
import {ActionRow} from './molecules/actionRow';
import {BoldHero} from './molecules/boldHero';

const previewTokens = DESIGN_COLOUR_SCHEME_SEED[0]?.tokens;

function themed(node: ReactNode): string {
  if (previewTokens === undefined) {
    throw new Error('Missing colour scheme');
  }
  return renderToStaticMarkup(<DesignThemeProvider tokens={previewTokens}>{node}</DesignThemeProvider>);
}

describe('design parts', () => {
  it('renders the button component from an atom node', () => {
    const html = themed(
      <ButtonAtom node={{id: 'book', kind: 'atom', atom: 'button', style: {background: '#111111'}, slots: ['label', 'href']}} values={{label: 'Book', href: '/book'}} />,
    );
    expect(html).toContain('Book');
    expect(html).toContain('href="/book"');
  });

  it('paints a button with the theme colour and spacing', () => {
    const html = themed(
      <ButtonAtom node={{id: 'book', kind: 'atom', atom: 'button', style: {background: 'siteAccent', padding: 12}, slots: ['label']}} values={{label: 'Book'}} />,
    );
    expect(html).toContain('Book');
    expect(html).toContain('design-atom-button');
  });

  it('renders a molecule through its component', () => {
    const html = themed(<ActionRow />);
    expect(html).toContain('Button');
    expect(html).toContain('Icon button');
  });

  it('loads every atom file and the seeded compositions', () => {
    const files = readdirSync(join(__dirname, 'atoms')).filter((file) => file.endsWith('.tsx') && file !== 'index.ts');
    expect(DESIGN_ATOMS).toHaveLength(files.length);
    expect(DESIGN_ATOM_GUIDE.map((entry) => entry.atom)).toEqual([...DESIGN_ATOMS]);
    DESIGN_MOLECULE_SEED.forEach((molecule) => {
      expect(parseDesignMoleculeDocument(molecule.document).pattern).toBe(molecule.document.pattern);
    });
    expect(DESIGN_ORGANISM_SEED.length).toBeGreaterThan(0);
  });

  it('lists content slots from the atom options', () => {
    const grouped = DESIGN_MOLECULE_SEED.find((molecule) => molecule.id === 'grouped');
    expect(grouped).toBeDefined();
    if (grouped === undefined) {
      return;
    }
    const fields = listMoleculeContentFields(grouped, DESIGN_MOLECULE_SEED);
    expect(fields.some((field) => field.slot === 'text' && field.nodeId === 'intro')).toBe(true);
    expect(fields.some((field) => field.slot === 'label' && field.nodeId.startsWith('actions.'))).toBe(true);
  });

  it('accepts a dropdown prop the base atom does not list', () => {
    expect(() =>
      assertDesignAtomPreset({
        id: 'pill',
        name: 'Pill',
        base: 'button',
        fields: [{key: 'size', label: 'Size', group: 'setting', kind: DesignFieldKind.CHOICE, values: ['sm', 'lg']}],
        style: {size: 'sm'},
      }),
    ).not.toThrow();
    expect(() =>
      assertDesignAtomPreset({
        id: 'pill',
        name: 'Pill',
        base: 'button',
        fields: [{key: 'tone', label: 'Tone', group: 'setting', kind: DesignFieldKind.COLOUR}],
        style: {tone: 'nope'},
      }),
    ).toThrow(/tone/);
  });

  it('uses the atom field choices for a content dropdown', () => {
    const atoms = [
      {
        id: 'role-text',
        name: 'Role text',
        base: 'text',
        fields: [{key: 'role', label: 'Role', group: 'content' as const, kind: DesignFieldKind.CHOICE, values: ['kicker', 'title']}],
        style: {},
      },
    ];
    const molecule = {
      id: 'block',
      name: 'Block',
      document: {
        pattern: 'tree' as const,
        layout: {},
        children: [{id: 'title', kind: 'atom' as const, atom: 'text', presetId: 'role-text', style: {}, slots: []}],
      },
    };
    const fields = listMoleculeContentFields(molecule, [molecule], atoms);
    expect(fields.find((field) => field.slot === 'role')?.values).toEqual(['kicker', 'title']);
  });

  it('renders the bold nail hero from theme colours and preset atoms', () => {
    BOLD_NAIL_ATOMS.forEach((preset) => {
      expect(() => assertDesignAtomPreset(preset)).not.toThrow();
    });
    const html = themed(<BoldHero />);
    expect(html).toContain('var(--site-hero-background)');
    expect(html).toContain('design-atom-button');
    const services = BOLD_NAIL_MOLECULES.find((molecule) => molecule.id === 'bold-services');
    const item = BOLD_NAIL_TEMPLATE_ITEMS.find((entry) => entry.id === 'services');
    expect(services).toBeDefined();
    expect(item).toBeDefined();
    if (services === undefined || item === undefined) {
      return;
    }
    const fields = listMoleculeContentFields(services, BOLD_NAIL_MOLECULES, BOLD_NAIL_ATOMS);
    expect(fields.some((field) => field.nodeId === 'cards.gel.name' && field.slot === 'text')).toBe(true);
    const filled = themed(<DesignNodes nodes={services.document.children} molecules={BOLD_NAIL_MOLECULES} atoms={BOLD_NAIL_ATOMS} values={item.values} />);
    expect(filled).toContain('Sets');
    expect(filled).toContain('Gel manicure');
    expect(filled).toContain('£28');
  });
});
