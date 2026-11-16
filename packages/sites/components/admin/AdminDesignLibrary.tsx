'use client';

import {DESIGN_ATOM_GUIDE} from '@so/component';
import {
  blankDesignAtomPreset,
  blankMoleculeDocument,
  blankOrganismDocument,
  colourSchemeToSiteTheme,
  type DesignAtomPreset,
  type DesignColourScheme,
  type DesignColourTokens,
  type DesignMolecule,
  type DesignOrganism,
} from '@so/model';
import {useCallback, useEffect, useState} from 'react';
import {DesignAtomPresetFields} from '@/components/admin/AdminDesignAtomFields';
import {DesignColourFields, DesignIdName, DesignMoleculeFields, DesignOrganismFields} from '@/components/admin/AdminDesignFields';
import {AdminIconButton} from '@/components/admin/AdminEditorIcons';
import useDesignLibraryLive from '@/components/admin/useDesignLibraryLive';
import DesignPreview, {designPreviewStyle} from '@/components/design/DesignPreview';

const ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

type Layer = 'atoms' | 'colour-schemes' | 'molecules' | 'organisms';

interface Library {
  atoms: readonly DesignAtomPreset[];
  colourSchemes: readonly DesignColourScheme[];
  molecules: readonly DesignMolecule[];
  organisms: readonly DesignOrganism[];
}

const FALLBACK_TOKENS: DesignColourTokens = {
  uppercaseHeadings: false,
  heroBackground: 'none',
  chakra: {
    theme: {
      tokens: {
        colors: {
          siteBackground: {value: '#ffffff'},
          siteForeground: {value: '#1d1d1f'},
          siteAccent: {value: '#111111'},
          siteButtonForeground: {value: '#ffffff'},
          siteCard: {value: '#f7f7f7'},
        },
        fonts: {
          siteHeading: {value: 'Arial, sans-serif'},
          siteBody: {value: 'Arial, sans-serif'},
        },
        radii: {site: {value: '16px'}},
      },
    },
  },
};

type Draft =
  | {layer: 'atoms'; creating: boolean; atom: DesignAtomPreset}
  | {layer: 'colour-schemes'; creating: boolean; scheme: DesignColourScheme}
  | {layer: 'molecules'; creating: boolean; molecule: DesignMolecule}
  | {layer: 'organisms'; creating: boolean; organism: DesignOrganism};

export default function AdminDesignLibrary() {
  const [library, setLibrary] = useState<Library>({atoms: [], colourSchemes: [], molecules: [], organisms: []});
  const [layer, setLayer] = useState<Layer>('colour-schemes');
  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    const response = await fetch('/api/admin/design');
    const payload = (await response.json().catch(() => ({}))) as Library & {error?: string};
    if (!response.ok) {
      setError(payload.error ?? 'Could not load the design library');
      return;
    }
    setLibrary({
      atoms: payload.atoms ?? [],
      colourSchemes: payload.colourSchemes ?? [],
      molecules: payload.molecules ?? [],
      organisms: payload.organisms ?? [],
    });
  }, []);

  useEffect(() => {
    let ignore = false;
    void fetch('/api/admin/design')
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as Library & {error?: string};
        if (ignore) {
          return;
        }
        if (!response.ok) {
          setError(payload.error ?? 'Could not load the design library');
          return;
        }
        setLibrary({
          atoms: payload.atoms ?? [],
          colourSchemes: payload.colourSchemes ?? [],
          molecules: payload.molecules ?? [],
          organisms: payload.organisms ?? [],
        });
      })
      .catch(() => {
        if (!ignore) {
          setError('Could not load the design library');
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const refresh = useCallback(() => {
    setNotice('Library updated.');
    void load();
  }, [load]);
  useDesignLibraryLive(refresh);

  const tokens = library.colourSchemes[0]?.tokens ?? FALLBACK_TOKENS;

  return (
    <>
      <div className="admin-card">
        <h1>Design</h1>
        <p className="admin-muted">
          Built-in atoms are the drawing components. Create an atom preset to choose its fields and starting colours, spacing, and border. Colour schemes, presets, molecules, and sections are saved in the database.
        </p>
        {error ? <p className="admin-error">{error}</p> : null}
        {notice ? <p className="admin-ok">{notice}</p> : null}
        <div className="design-tabs">
          <Tab current={layer} id="atoms" label="Atoms" onPick={setLayer} />
          <Tab current={layer} id="colour-schemes" label="Colour schemes" onPick={setLayer} />
          <Tab current={layer} id="molecules" label="Molecules" onPick={setLayer} />
          <Tab current={layer} id="organisms" label="Sections" onPick={setLayer} />
        </div>
        <LibraryTable
          layer={layer}
          library={library}
          busy={busy}
          onEdit={(next) => {
            setError('');
            setDraft(next);
          }}
          onDelete={(id) => void remove(layer, id, setBusy, setError, setLibrary)}
          onCreate={() => setDraft(blankDraft(layer, tokens))}
        />
      </div>
      {draft === undefined ? null : (
        <DraftEditor
          draft={draft}
          library={library}
          busy={busy}
          onChange={setDraft}
          onSave={() => void save(draft, setBusy, setError, setNotice, setDraft, setLibrary)}
        />
      )}
    </>
  );
}

function Tab({current, id, label, onPick}: {current: Layer; id: Layer; label: string; onPick: (layer: Layer) => void}) {
  return (
    <button type="button" className={current === id ? 'secondary selected' : 'secondary'} onClick={() => onPick(id)}>
      {label}
    </button>
  );
}

function LibraryTable({
  layer,
  library,
  busy,
  onEdit,
  onDelete,
  onCreate,
}: {
  layer: Layer;
  library: Library;
  busy: boolean;
  onEdit: (draft: Draft) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  const rows = rowsForLayer(layer, library);
  return (
    <>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Id</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <span className="design-node-title">
                  {row.name}
                  {row.editable ? <span className="design-tag">Editable</span> : null}
                </span>
                <div className="admin-muted">{row.detail}</div>
              </td>
              <td>{row.id}</td>
              <td>
                {row.editable ? (
                  <>
                    <AdminIconButton
                      label={`Edit ${row.name}`}
                      icon="settings"
                      onClick={() => {
                        if (layer === 'atoms') {
                          const atom = library.atoms.find((item) => item.id === row.id);
                          if (atom !== undefined) {
                            onEdit({layer, creating: false, atom});
                          }
                          return;
                        }
                        if (layer === 'colour-schemes') {
                          const scheme = library.colourSchemes.find((item) => item.id === row.id);
                          if (scheme !== undefined) {
                            onEdit({layer, creating: false, scheme});
                          }
                          return;
                        }
                        if (layer === 'molecules') {
                          const molecule = library.molecules.find((item) => item.id === row.id);
                          if (molecule !== undefined) {
                            onEdit({layer, creating: false, molecule});
                          }
                          return;
                        }
                        if (layer !== 'organisms') {
                          return;
                        }
                        const organism = library.organisms.find((item) => item.id === row.id);
                        if (organism !== undefined) {
                          onEdit({layer, creating: false, organism});
                        }
                      }}
                    />{' '}
                    <AdminIconButton
                      label={`Delete ${row.name}`}
                      icon="bin"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Delete ${row.name}?`)) {
                          onDelete(row.id);
                        }
                      }}
                    />
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="admin-actions">
        <button type="button" onClick={onCreate}>
          New
        </button>
      </div>
    </>
  );
}

function DraftEditor({
  draft,
  library,
  busy,
  onChange,
  onSave,
}: {
  draft: Draft;
  library: Library;
  busy: boolean;
  onChange: (draft: Draft) => void;
  onSave: () => void;
}) {
  const previewTokens = draft.layer === 'colour-schemes' ? draft.scheme.tokens : (library.colourSchemes[0]?.tokens ?? FALLBACK_TOKENS);
  return (
    <div className="admin-card">
      <h2>{draft.creating ? 'New' : 'Edit'}</h2>
      <div className="admin-form">
        <DesignIdName
          id={draftId(draft)}
          name={draftName(draft)}
          lockId={!draft.creating}
          onId={(id) => onChange(withIdentity(draft, id, draftName(draft)))}
          onName={(name) => onChange(withIdentity(draft, draftId(draft), name))}
        />
        {draft.layer === 'atoms' ? <DesignAtomPresetFields preset={draft.atom} onChange={(atom) => onChange({...draft, atom})} /> : null}
        {draft.layer === 'colour-schemes' ? <DesignColourFields scheme={draft.scheme} onChange={(scheme) => onChange({...draft, scheme})} /> : null}
        {draft.layer === 'molecules' ? (
          <DesignMoleculeFields molecule={draft.molecule} molecules={library.molecules} atoms={library.atoms} onChange={(molecule) => onChange({...draft, molecule})} />
        ) : null}
        {draft.layer === 'organisms' ? (
          <DesignOrganismFields organism={draft.organism} molecules={library.molecules} atoms={library.atoms} onChange={(organism) => onChange({...draft, organism})} />
        ) : null}
      </div>
      <div className="admin-actions">
        <button type="button" disabled={busy} onClick={onSave}>
          Save
        </button>
      </div>
      <div className="admin-preview">
        {draft.layer === 'colour-schemes' ? (
          <div className="design-preview" data-uppercase={draft.scheme.tokens.uppercaseHeadings ? 'true' : 'false'} style={designPreviewStyle(draft.scheme.tokens)}>
            <h2 className="design-atom-heading">Heading</h2>
            <p className="design-atom-text">Body copy uses the Chakra colour scheme.</p>
            <a className="design-atom-button">Button</a>
          </div>
        ) : null}
        {draft.layer === 'atoms' ? (
          <DesignPreview
            nodes={[{id: 'sample', kind: 'atom', atom: draft.atom.base, presetId: previewAtom(draft.atom).id, style: {}, slots: []}]}
            molecules={[]}
            atoms={[previewAtom(draft.atom)]}
            tokens={previewTokens}
          />
        ) : null}
        {draft.layer === 'molecules' ? (
          <DesignPreview
            nodes={draft.molecule.document.children}
            layout={draft.molecule.document.layout}
            container={draft.molecule.document.container}
            molecules={[draft.molecule, ...library.molecules.filter((item) => item.id !== draft.molecule.id)]}
            atoms={library.atoms}
            tokens={previewTokens}
          />
        ) : null}
        {draft.layer === 'organisms' ? (
          <DesignPreview nodes={draft.organism.document.children} molecules={library.molecules} atoms={library.atoms} tokens={previewTokens} />
        ) : null}
      </div>
    </div>
  );
}

function rowsForLayer(layer: Layer, library: Library): readonly {id: string; name: string; detail: string; editable: boolean}[] {
  if (layer === 'atoms') {
    return [
      ...DESIGN_ATOM_GUIDE.map((atom) => ({id: `built-in-${atom.atom}`, name: atom.label, detail: 'Built in', editable: false})),
      ...library.atoms.map((atom) => ({id: atom.id, name: atom.name, detail: atom.base, editable: true})),
    ];
  }
  if (layer === 'colour-schemes') {
    return library.colourSchemes.map((scheme) => ({
      id: scheme.id,
      name: scheme.name,
      detail: colourSchemeToSiteTheme(scheme.tokens).accent,
      editable: true,
    }));
  }
  if (layer === 'molecules') {
    return library.molecules.map((molecule) => ({id: molecule.id, name: molecule.name, detail: molecule.document.pattern, editable: true}));
  }
  return library.organisms.map((organism) => ({id: organism.id, name: organism.name, detail: organism.category, editable: true}));
}

function draftId(draft: Draft): string {
  if (draft.layer === 'atoms') {
    return draft.atom.id;
  }
  if (draft.layer === 'colour-schemes') {
    return draft.scheme.id;
  }
  if (draft.layer === 'molecules') {
    return draft.molecule.id;
  }
  return draft.organism.id;
}

function draftName(draft: Draft): string {
  if (draft.layer === 'atoms') {
    return draft.atom.name;
  }
  if (draft.layer === 'colour-schemes') {
    return draft.scheme.name;
  }
  if (draft.layer === 'molecules') {
    return draft.molecule.name;
  }
  return draft.organism.name;
}

function withIdentity(draft: Draft, id: string, name: string): Draft {
  if (draft.layer === 'atoms') {
    return {...draft, atom: {...draft.atom, id, name}};
  }
  if (draft.layer === 'colour-schemes') {
    return {...draft, scheme: {...draft.scheme, id, name}};
  }
  if (draft.layer === 'molecules') {
    return {...draft, molecule: {...draft.molecule, id, name}};
  }
  return {...draft, organism: {...draft.organism, id, name}};
}

function blankDraft(layer: Layer, tokens: DesignColourTokens): Draft {
  if (layer === 'atoms') {
    return {layer, creating: true, atom: blankDesignAtomPreset()};
  }
  if (layer === 'colour-schemes') {
    return {layer, creating: true, scheme: {id: '', name: '', tokens}};
  }
  if (layer === 'molecules') {
    return {layer, creating: true, molecule: {id: '', name: '', document: blankMoleculeDocument()}};
  }
  return {layer, creating: true, organism: {id: '', name: '', category: 'page', document: blankOrganismDocument()}};
}

async function remove(
  layer: Layer,
  id: string,
  setBusy: (busy: boolean) => void,
  setError: (error: string) => void,
  setLibrary: (update: (current: Library) => Library) => void,
): Promise<void> {
  setBusy(true);
  setError('');
  const response = await fetch(`/api/admin/design/${layer}/${id}`, {method: 'DELETE'});
  const payload = (await response.json().catch(() => ({}))) as {error?: string};
  setBusy(false);
  if (!response.ok) {
    setError(payload.error ?? 'Could not delete');
    return;
  }
  setLibrary((current) => ({
    atoms: layer === 'atoms' ? current.atoms.filter((item) => item.id !== id) : current.atoms,
    colourSchemes: layer === 'colour-schemes' ? current.colourSchemes.filter((item) => item.id !== id) : current.colourSchemes,
    molecules: layer === 'molecules' ? current.molecules.filter((item) => item.id !== id) : current.molecules,
    organisms: layer === 'organisms' ? current.organisms.filter((item) => item.id !== id) : current.organisms,
  }));
}

async function save(
  draft: Draft,
  setBusy: (busy: boolean) => void,
  setError: (error: string) => void,
  setNotice: (notice: string) => void,
  setDraft: (draft: Draft | undefined) => void,
  setLibrary: (update: (current: Library) => Library) => void,
): Promise<void> {
  const id = draftId(draft).trim().toLowerCase();
  const name = draftName(draft).trim();
  if (!ID_RE.test(id)) {
    setError('Id must be lowercase letters, numbers, and hyphens');
    return;
  }
  if (name.length === 0) {
    setError('Name is required');
    return;
  }
  setBusy(true);
  setError('');
  const response = await fetch(draft.creating ? `/api/admin/design/${draft.layer}` : `/api/admin/design/${draft.layer}/${id}`, {
    method: draft.creating ? 'POST' : 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(saveBody(draft, id, name)),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    atom?: DesignAtomPreset;
    scheme?: DesignColourScheme;
    molecule?: DesignMolecule;
    organism?: DesignOrganism;
  };
  setBusy(false);
  if (!response.ok) {
    setError(payload.error ?? 'Could not save');
    return;
  }
  setNotice('Saved.');
  setDraft(undefined);
  setLibrary((current) => mergeSaved(current, payload));
}

function saveBody(draft: Draft, id: string, name: string): Record<string, unknown> {
  if (draft.layer === 'atoms') {
    return {id, name, base: draft.atom.base, fields: draft.atom.fields, style: draft.atom.style};
  }
  if (draft.layer === 'colour-schemes') {
    return {id, name, tokens: draft.scheme.tokens};
  }
  if (draft.layer === 'molecules') {
    return {id, name, document: draft.molecule.document};
  }
  return {id, name, category: draft.organism.category, document: draft.organism.document};
}

function mergeSaved(current: Library, payload: {atom?: DesignAtomPreset; scheme?: DesignColourScheme; molecule?: DesignMolecule; organism?: DesignOrganism}): Library {
  if (payload.atom !== undefined) {
    return {...current, atoms: upsert(current.atoms, payload.atom)};
  }
  if (payload.scheme !== undefined) {
    return {...current, colourSchemes: upsert(current.colourSchemes, payload.scheme)};
  }
  if (payload.molecule !== undefined) {
    return {...current, molecules: upsert(current.molecules, payload.molecule)};
  }
  if (payload.organism !== undefined) {
    return {...current, organisms: upsert(current.organisms, payload.organism)};
  }
  return current;
}

function previewAtom(atom: DesignAtomPreset): DesignAtomPreset {
  return atom.id.trim().length > 0 ? atom : {...atom, id: 'preview'};
}

function upsert<T extends {id: string}>(items: readonly T[], next: T): T[] {
  if (items.some((item) => item.id === next.id)) {
    return items.map((item) => (item.id === next.id ? next : item));
  }
  return [...items, next];
}
