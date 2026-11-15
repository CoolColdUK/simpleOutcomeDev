'use client';

import type {SiteDocument, SiteSection, SiteSectionType} from '@so/model';
import Link from 'next/link';
import {useMemo, useState} from 'react';
import AdminAddSectionDialog from '@/components/admin/AdminAddSectionDialog';
import AdminSectionList from '@/components/admin/AdminSectionList';
import AdminSectionSettings from '@/components/admin/AdminSectionSettings';
import AdminSiteConfig from '@/components/admin/AdminSiteConfig';
import SitePageView from '@/components/SitePageView';
import {createDefaultSection, newSectionId} from '@/lib/admin/defaultSection';
import {omitMenuLink} from '@/lib/site/mapSiteSection';

export interface AdminTemplateEditorProps {
  readonly id: string;
  readonly name: string;
  readonly document: SiteDocument;
}

export default function AdminTemplateEditor(props: AdminTemplateEditorProps) {
  const [name, setName] = useState(props.name);
  const [document, setDocument] = useState(props.document);
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
                body: JSON.stringify({name, document}),
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
            sectionIds={document.sections.map((section) => section.id)}
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
