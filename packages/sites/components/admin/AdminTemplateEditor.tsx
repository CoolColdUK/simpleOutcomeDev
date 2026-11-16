'use client';

import {colourSchemeToSiteTheme, type DesignAtomPreset, type DesignColourScheme, type DesignMolecule, type DesignTemplateItem, type SiteDocument, type SiteSection, type SiteSectionType} from '@so/model';
import Link from 'next/link';
import {useCallback, useMemo, useState} from 'react';
import AdminAddSectionDialog from '@/components/admin/AdminAddSectionDialog';
import AdminSectionList from '@/components/admin/AdminSectionList';
import AdminSectionSettings from '@/components/admin/AdminSectionSettings';
import AdminSiteConfig from '@/components/admin/AdminSiteConfig';
import SitePageView from '@/components/SitePageView';
import AdminTemplateMoleculeItems from '@/components/admin/AdminTemplateMoleculeItems';
import useDesignLibraryLive from '@/components/admin/useDesignLibraryLive';
import {createDefaultSection, newSectionId} from '@/lib/admin/defaultSection';
import {omitMenuLink} from '@/lib/site/mapSiteSection';

export interface AdminTemplateEditorProps {
  readonly id: string;
  readonly name: string;
  readonly document: SiteDocument;
  readonly colourSchemeId: string | undefined;
  readonly colourSchemes: readonly DesignColourScheme[];
  readonly molecules: readonly DesignMolecule[];
  readonly atoms: readonly DesignAtomPreset[];
  readonly items: readonly DesignTemplateItem[];
}

export default function AdminTemplateEditor(props: AdminTemplateEditorProps) {
  const [name, setName] = useState(props.name);
  const [document, setDocument] = useState(props.document);
  const [schemes, setSchemes] = useState(props.colourSchemes);
  const [colourSchemeId, setColourSchemeId] = useState(props.colourSchemeId ?? '');
  const [molecules, setMolecules] = useState(props.molecules);
  const [atoms, setAtoms] = useState(props.atoms);
  const [items, setItems] = useState(props.items);
  const refreshSchemes = useCallback(() => {
    void fetch('/api/admin/design').then(async (response) => {
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {colourSchemes?: DesignColourScheme[]; molecules?: DesignMolecule[]; atoms?: DesignAtomPreset[]};
      const next = payload.colourSchemes ?? [];
      setSchemes(next);
      setMolecules(payload.molecules ?? []);
      setAtoms(payload.atoms ?? []);
      const scheme = next.find((item) => item.id === colourSchemeId);
      if (scheme !== undefined) {
        setDocument((current) => ({...current, theme: colourSchemeToSiteTheme(scheme.tokens)}));
      }
    });
  }, [colourSchemeId]);
  useDesignLibraryLive(refreshSchemes);
  const [settingsId, setSettingsId] = useState<string | undefined>(undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const settingsSection = useMemo(
    () => document.sections.find((section) => section.id === settingsId),
    [document.sections, settingsId],
  );

  const addSection = (type: SiteSectionType): void => {
    const section = createDefaultSection(type, newSectionId(type));
    setDocument({...document, sections: [...document.sections, section]});
  };

  const deleteSection = (id: string): void => {
    setDocument({
      ...document,
      sections: document.sections.filter((item) => item.id !== id).map((section) => omitMenuLink(section, id)),
    });
    if (settingsId === id) {
      setSettingsId(undefined);
    }
  };

  const replaceSection = (next: SiteSection): void => {
    setDocument({
      ...document,
      sections: document.sections.map((section) => (section.id === next.id ? next : section)),
    });
  };

  return (
    <div>
      <div className="admin-card">
        <h1>Edit template</h1>
        <p className="admin-muted">
          <Link href="/templates">Templates</Link> · {props.id}
        </p>
        <div className="admin-form">
          <label>
            Name
            <input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Colour scheme
            <select
              value={colourSchemeId}
              onChange={(event) => {
                const nextId = event.target.value;
                setColourSchemeId(nextId);
                const scheme = schemes.find((item) => item.id === nextId);
                if (scheme !== undefined) {
                  setDocument({...document, theme: colourSchemeToSiteTheme(scheme.tokens)});
                }
              }}
            >
              <option value="">None</option>
              {schemes.map((scheme) => (
                <option key={scheme.id} value={scheme.id}>
                  {scheme.name}
                </option>
              ))}
            </select>
          </label>
          <p className="admin-muted">
            A colour scheme is a Chakra token set. Choosing one copies those colours into this template. Later edits to the scheme update this preview live.
          </p>
        </div>
        <div className="admin-actions">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              setMessage('');
              const response = await fetch(`/api/admin/templates/${props.id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, document, colourSchemeId, items}),
              });
              const payload = (await response.json().catch(() => ({}))) as {error?: string};
              setBusy(false);
              if (!response.ok) {
                setError(payload.error ?? 'Could not save');
                return;
              }
              setMessage('Template saved.');
            }}
          >
            Save template
          </button>
        </div>
        {error ? <p className="admin-error">{error}</p> : null}
        {message ? <p className="admin-ok">{message}</p> : null}
      </div>
      <AdminTemplateMoleculeItems items={items} molecules={molecules} atoms={atoms} onChange={setItems} />
      <AdminSiteConfig siteDocument={document} onChange={setDocument} />
      <div className="admin-section-toolbar">
        <button type="button" onClick={() => setAddOpen(true)}>
          Add section
        </button>
      </div>
      <AdminAddSectionDialog open={addOpen} siteDocument={document} onClose={() => setAddOpen(false)} onAdd={addSection} />
      <div className={settingsSection === undefined ? 'admin-editor' : 'admin-editor with-settings'}>
        <AdminSectionList
          sections={document.sections}
          settingsId={settingsId}
          onReorder={(sections) => setDocument({...document, sections})}
          onOpenSettings={setSettingsId}
          onDelete={deleteSection}
        />
        {settingsSection === undefined ? null : (
          <AdminSectionSettings
            section={settingsSection}
            sections={document.sections}
            onChange={replaceSection}
            onClose={() => setSettingsId(undefined)}
          />
        )}
      </div>
      <div className="admin-preview">
        <SitePageView
          site={{
            id: undefined,
            slug: props.id,
            customDomain: undefined,
            status: 'draft',
            preset: props.id,
            document,
            demoHost: true,
            messagesEnabled: false,
          }}
        />
      </div>
    </div>
  );
}
