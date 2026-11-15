'use client';

import {
  blankAccordionDocument,
  blankMoleculeDocument,
  type DesignColourScheme,
  type DesignColourTokens,
  type DesignMolecule,
  type DesignMoleculeDocument,
  type DesignOrganism,
} from '@so/model';
import AdminDesignNodeEditor from '@/components/admin/AdminDesignNodeEditor';

export function DesignIdName({
  id,
  name,
  lockId,
  onId,
  onName,
}: {
  id: string;
  name: string;
  lockId: boolean;
  onId: (id: string) => void;
  onName: (name: string) => void;
}) {
  return (
    <>
      <label>
        Id
        <input value={id} disabled={lockId} onChange={(event) => onId(event.target.value)} />
      </label>
      <label>
        Name
        <input value={name} maxLength={80} onChange={(event) => onName(event.target.value)} />
      </label>
    </>
  );
}

export function DesignColourFields({scheme, onChange}: {scheme: DesignColourScheme; onChange: (scheme: DesignColourScheme) => void}) {
  const colors = scheme.tokens.chakra.theme.tokens.colors;
  const fonts = scheme.tokens.chakra.theme.tokens.fonts;
  const setColour = (key: keyof typeof colors, value: string): void => {
    onChange({
      ...scheme,
      tokens: {
        ...scheme.tokens,
        chakra: {theme: {tokens: {...scheme.tokens.chakra.theme.tokens, colors: {...colors, [key]: {value}}}}},
      },
    });
  };
  return (
    <>
      <DesignTextInput label="Background" value={colors.siteBackground.value} onChange={(value) => setColour('siteBackground', value)} />
      <DesignTextInput label="Foreground" value={colors.siteForeground.value} onChange={(value) => setColour('siteForeground', value)} />
      <DesignTextInput label="Accent" value={colors.siteAccent.value} onChange={(value) => setColour('siteAccent', value)} />
      <DesignTextInput label="Button text" value={colors.siteButtonForeground.value} onChange={(value) => setColour('siteButtonForeground', value)} />
      <DesignTextInput label="Card" value={colors.siteCard.value} onChange={(value) => setColour('siteCard', value)} />
      <DesignTextInput
        label="Heading font"
        value={fonts.siteHeading.value}
        onChange={(value) =>
          onChange({
            ...scheme,
            tokens: {...scheme.tokens, chakra: {theme: {tokens: {...scheme.tokens.chakra.theme.tokens, fonts: {...fonts, siteHeading: {value}}}}}},
          })
        }
      />
      <DesignTextInput
        label="Body font"
        value={fonts.siteBody.value}
        onChange={(value) =>
          onChange({
            ...scheme,
            tokens: {...scheme.tokens, chakra: {theme: {tokens: {...scheme.tokens.chakra.theme.tokens, fonts: {...fonts, siteBody: {value}}}}}},
          })
        }
      />
      <label>
        Radius (px)
        <input
          type="number"
          min={0}
          max={32}
          value={Number.parseInt(scheme.tokens.chakra.theme.tokens.radii.site.value, 10)}
          onChange={(event) => {
            const radius = Number(event.target.value);
            onChange({
              ...scheme,
              tokens: {
                ...scheme.tokens,
                chakra: {theme: {tokens: {...scheme.tokens.chakra.theme.tokens, radii: {site: {value: `${radius}px`}}}}},
              },
            });
          }}
        />
      </label>
      <DesignTextInput
        label="Hero background"
        value={scheme.tokens.heroBackground}
        onChange={(heroBackground) =>
          onChange({...scheme, tokens: {...scheme.tokens, heroBackground: heroBackground as DesignColourTokens['heroBackground']}})
        }
      />
      <label>
        <input
          type="checkbox"
          checked={scheme.tokens.uppercaseHeadings}
          onChange={(event) => onChange({...scheme, tokens: {...scheme.tokens, uppercaseHeadings: event.target.checked}})}
        />{' '}
        Uppercase headings
      </label>
    </>
  );
}

export function DesignMoleculeFields({
  molecule,
  molecules,
  onChange,
}: {
  molecule: DesignMolecule;
  molecules: readonly DesignMolecule[];
  onChange: (molecule: DesignMolecule) => void;
}) {
  const document = molecule.document;
  return (
    <>
      <label>
        Pattern
        <select
          value={document.pattern}
          onChange={(event) => {
            const pattern = event.target.value === 'accordion' ? 'accordion' : 'tree';
            const next: DesignMoleculeDocument = pattern === 'accordion' ? blankAccordionDocument() : blankMoleculeDocument();
            onChange({...molecule, document: next});
          }}
        >
          <option value="tree">Tree of atoms</option>
          <option value="accordion">Accordion</option>
        </select>
      </label>
      {document.pattern === 'accordion' ? (
        <AccordionItems items={document.items} onChange={(items) => onChange({...molecule, document: {pattern: 'accordion', items}})} />
      ) : (
        <AdminDesignNodeEditor
          nodes={document.children}
          molecules={molecules}
          excludeMoleculeId={molecule.id}
          onChange={(children) => onChange({...molecule, document: {pattern: 'tree', children}})}
        />
      )}
    </>
  );
}

function AccordionItems({
  items,
  onChange,
}: {
  items: Extract<DesignMoleculeDocument, {pattern: 'accordion'}>['items'];
  onChange: (items: Extract<DesignMoleculeDocument, {pattern: 'accordion'}>['items']) => void;
}) {
  return (
    <div>
      {items.map((item, index) => (
        <div key={item.id} className="design-node">
          <DesignTextInput
            label="Question"
            value={item.title}
            onChange={(title) => onChange(items.map((entry, itemIndex) => (itemIndex === index ? {...entry, title} : entry)))}
          />
          <DesignTextInput
            label="Answer"
            value={item.body}
            onChange={(body) => onChange(items.map((entry, itemIndex) => (itemIndex === index ? {...entry, body} : entry)))}
          />
          <button type="button" className="secondary" disabled={items.length < 2} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
            Remove question
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        onClick={() => onChange([...items, {id: `item${items.length + 1}`, title: 'Question', body: 'Answer'}])}
      >
        Add question
      </button>
    </div>
  );
}

export function DesignOrganismFields({
  organism,
  molecules,
  onChange,
}: {
  organism: DesignOrganism;
  molecules: readonly DesignMolecule[];
  onChange: (organism: DesignOrganism) => void;
}) {
  return (
    <>
      <label>
        Place
        <select
          value={organism.category}
          onChange={(event) => onChange({...organism, category: event.target.value === 'header' || event.target.value === 'footer' ? event.target.value : 'page'})}
        >
          <option value="header">Header</option>
          <option value="page">Page</option>
          <option value="footer">Footer</option>
        </select>
      </label>
      <AdminDesignNodeEditor nodes={organism.document.children} molecules={molecules} onChange={(children) => onChange({...organism, document: {children}})} />
    </>
  );
}

function DesignTextInput({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
