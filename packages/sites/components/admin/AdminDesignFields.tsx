'use client';

import {
  DESIGN_FLEX_OPTIONS,
  blankCombineDocument,
  blankMoleculeDocument,
  type DesignColourScheme,
  type DesignColourTokens,
  type DesignFlex,
  type DesignFlexKey,
  type DesignMolecule,
  type DesignOrganism,
} from '@so/model';
import AdminDesignNodeEditor from '@/components/admin/AdminDesignNodeEditor';
import AdminDesignOptionMenu from '@/components/admin/AdminDesignOptionMenu';
import {AdminIconButton} from '@/components/admin/AdminEditorIcons';

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
  const layout = document.layout;
  const unusedLayout = DESIGN_FLEX_OPTIONS.filter((option) => layout[option.key] === undefined);
  return (
    <>
      <div className="design-field-row">
        <label>
          Pattern
          <select
            value={document.pattern}
            onChange={(event) => {
              const pattern = event.target.value === 'combine' ? 'combine' : 'tree';
              const next = pattern === 'combine' ? blankCombineDocument() : blankMoleculeDocument();
              onChange({...molecule, document: {...next, children: document.children, layout}});
            }}
          >
            <option value="tree">Tree of atoms</option>
            <option value="combine">Combine</option>
          </select>
        </label>
        <AdminDesignOptionMenu
          label="Add layout option"
          icon
          options={unusedLayout.map((option) => ({key: option.key, label: option.label}))}
          onPick={(key) => {
            const flex = flexKey(key);
            if (flex !== undefined) {
              onChange({...molecule, document: {...document, layout: {...layout, [flex]: flexDefault(flex, document.pattern)}}});
            }
          }}
        />
      </div>
      <p className="admin-muted">
        {document.pattern === 'tree'
          ? 'Lay atoms and molecules out as a flex row or column. Add only the layout options you want.'
          : 'Combine atoms and other molecules into one larger molecule. Words and links are filled in on the template.'}
      </p>
      <FlexFields layout={layout} onChange={(next) => onChange({...molecule, document: {...document, layout: next}})} />
      <AdminDesignNodeEditor
        nodes={document.children}
        molecules={molecules}
        excludeMoleculeId={molecule.id}
        onChange={(children) => onChange({...molecule, document: {...document, children}})}
      />
    </>
  );
}

function FlexFields({layout, onChange}: {layout: DesignFlex; onChange: (layout: DesignFlex) => void}) {
  return (
    <>
      {layout.direction !== undefined ? (
        <div className="design-field-row">
          <label>
            Direction
            <select value={layout.direction} onChange={(event) => onChange({...layout, direction: event.target.value === 'column' ? 'column' : 'row'})}>
              <option value="row">row</option>
              <option value="column">column</option>
            </select>
          </label>
          <AdminIconButton label="Remove direction" icon="bin" onClick={() => onChange(flexWithout(layout, 'direction'))} />
        </div>
      ) : null}
      {layout.gapPx !== undefined ? (
        <div className="design-field-row">
          <label>
            Gap
            <input type="number" min={0} max={64} value={layout.gapPx} onChange={(event) => onChange({...layout, gapPx: Number(event.target.value)})} />
          </label>
          <AdminIconButton label="Remove gap" icon="bin" onClick={() => onChange(flexWithout(layout, 'gapPx'))} />
        </div>
      ) : null}
      {layout.align !== undefined ? (
        <AlignField label="Alignment" value={layout.align} onChange={(align) => onChange({...layout, align})} onRemove={() => onChange(flexWithout(layout, 'align'))} />
      ) : null}
      {layout.valign !== undefined ? (
        <AlignField
          label="Vertical alignment"
          value={layout.valign}
          onChange={(valign) => onChange({...layout, valign})}
          onRemove={() => onChange(flexWithout(layout, 'valign'))}
        />
      ) : null}
      {layout.wrap !== undefined ? (
        <div className="design-field-row">
          <label>
            Wrap
            <select value={layout.wrap} onChange={(event) => onChange({...layout, wrap: event.target.value === 'wrap' ? 'wrap' : 'nowrap'})}>
              <option value="nowrap">nowrap</option>
              <option value="wrap">wrap</option>
            </select>
          </label>
          <AdminIconButton label="Remove wrap" icon="bin" onClick={() => onChange(flexWithout(layout, 'wrap'))} />
        </div>
      ) : null}
    </>
  );
}

function AlignField({
  label,
  value,
  onChange,
  onRemove,
}: {
  label: string;
  value: 'start' | 'center' | 'end' | 'stretch';
  onChange: (value: 'start' | 'center' | 'end' | 'stretch') => void;
  onRemove: () => void;
}) {
  return (
    <div className="design-field-row">
      <label>
        {label}
        <select value={value} onChange={(event) => onChange(alignValue(event.target.value))}>
          <option value="start">start</option>
          <option value="center">center</option>
          <option value="end">end</option>
          <option value="stretch">stretch</option>
        </select>
      </label>
      <AdminIconButton label={`Remove ${label}`} icon="bin" onClick={onRemove} />
    </div>
  );
}

function alignValue(value: string): 'start' | 'center' | 'end' | 'stretch' {
  if (value === 'center' || value === 'end' || value === 'stretch') {
    return value;
  }
  return 'start';
}

function flexKey(value: string): DesignFlexKey | undefined {
  return DESIGN_FLEX_OPTIONS.find((option) => option.key === value)?.key;
}

function flexDefault(key: DesignFlexKey, pattern: 'tree' | 'combine'): DesignFlex[DesignFlexKey] {
  if (key === 'direction') {
    return pattern === 'combine' ? 'column' : 'row';
  }
  if (key === 'gapPx') {
    return 12;
  }
  if (key === 'wrap') {
    return 'wrap';
  }
  return 'center';
}

function flexWithout(layout: DesignFlex, key: DesignFlexKey): DesignFlex {
  const next = {...layout};
  delete next[key];
  return next;
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
