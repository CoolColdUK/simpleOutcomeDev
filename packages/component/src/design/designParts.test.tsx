import {renderToStaticMarkup} from 'react-dom/server';
import {parseDesignMoleculeDocument} from '@so/model';
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {ButtonAtom} from './atoms/button';
import {DESIGN_ATOMS} from './atoms';
import {DESIGN_ATOM_GUIDE} from './designLibraryGuide';
import {listMoleculeContentFields} from './listMoleculeContentFields';
import {DESIGN_MOLECULE_SEED} from './molecules';
import {DESIGN_ORGANISM_SEED} from './organisms';
import {ActionRow} from './molecules/actionRow';

describe('design parts', () => {
  it('renders the button component from an atom node', () => {
    const html = renderToStaticMarkup(
      <ButtonAtom node={{id: 'book', kind: 'atom', atom: 'button', style: {background: '#111111'}, slots: ['label']}} values={{label: 'Book'}} />,
    );
    expect(html).toContain('Book');
    expect(html).toContain('#111111');
  });

  it('renders a molecule through its component', () => {
    const html = renderToStaticMarkup(<ActionRow />);
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
});
