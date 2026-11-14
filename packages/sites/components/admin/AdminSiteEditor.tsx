'use client';

import {SITE_COMPONENT_CATALOG, type SiteDocument, type SiteSection, type SiteSectionType} from '@so/model';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useMemo, useState} from 'react';
import AdminAddSectionDialog from '@/components/admin/AdminAddSectionDialog';
import AdminSectionList from '@/components/admin/AdminSectionList';
import AdminSectionSettings from '@/components/admin/AdminSectionSettings';
import AdminSiteConfig from '@/components/admin/AdminSiteConfig';
import SitePageView from '@/components/SitePageView';
import {createDefaultSection, newSectionId} from '@/lib/admin/defaultSection';

export interface AdminSiteEditorProps {
  readonly slug: string;
  readonly status: string;
  readonly messagesEnabled: boolean;
  readonly document: SiteDocument;
  readonly customDomain: string | undefined;
}

const NAV_SKIP: readonly SiteSectionType[] = ['hero', 'bookingCta', 'splitCta'];

export default function AdminSiteEditor(props: AdminSiteEditorProps) {
  const router = useRouter();
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

  const previewSite = {
    id: undefined,
    slug: props.slug,
    customDomain: props.customDomain,
    status: props.status === 'demo' ? ('demo' as const) : ('draft' as const),
    preset: 'home-studio' as const,
    document,
    demoHost: true,
    messagesEnabled: props.messagesEnabled,
  };

  const save = async (): Promise<boolean> => {
    setBusy(true);
    setError('');
    setMessage('');
    const response = await fetch(`/api/admin/sites/${props.slug}/draft`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({document}),
    });
    const payload = (await response.json().catch(() => ({}))) as {error?: string};
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'Could not save');
      return false;
    }
    setMessage('Draft saved. The slug subdomain shows this copy.');
    return true;
  };

  const addSection = (type: SiteSectionType): void => {
    const id = newSectionId(type);
    const section = createDefaultSection(type, id);
    const entry = SITE_COMPONENT_CATALOG.find((item) => item.type === type);
    const links = NAV_SKIP.includes(type) || document.nav.links.length >= 8
      ? document.nav.links
      : [...document.nav.links, {label: entry?.label ?? type, sectionId: id}];
    setDocument({...document, sections: [...document.sections, section], nav: {links}});
  };

  const deleteSection = (id: string): void => {
    const sections = document.sections.filter((item) => item.id !== id);
    const remaining = document.nav.links.filter((link) => link.sectionId !== id);
    const fallbackId = sections[0]?.id;
    const links =
      remaining.length > 0 || fallbackId === undefined
        ? remaining
        : [{label: 'Section', sectionId: fallbackId}];
    setDocument({
      ...document,
      sections,
      nav: {links},
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
        <h1>Edit {document.businessName}</h1>
        <p className="admin-muted">
          Slug: {props.slug} · Status: {props.status}
          {props.customDomain ? ` · Production: ${props.customDomain}` : ''}
        </p>
        <div className="admin-actions">
          <button type="button" disabled={busy} onClick={() => void save()}>
            Save draft
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={async () => {
              const ok = await save();
              if (!ok) {
                return;
              }
              setBusy(true);
              const response = await fetch(`/api/admin/sites/${props.slug}/publish`, {method: 'POST'});
              const payload = (await response.json().catch(() => ({}))) as {error?: string; versionNumber?: number};
              setBusy(false);
              if (!response.ok) {
                setError(payload.error ?? 'Publish failed');
                return;
              }
              setMessage(`Published version ${payload.versionNumber}. Production URL shows this snapshot.`);
            }}
          >
            Publish
          </button>
          <Link className="admin-button secondary" href={`/sites/${props.slug}/versions`}>
            Versions
          </Link>
          <button
            type="button"
            className="danger"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm('Archive this site? The production URL will 404.')) {
                return;
              }
              setBusy(true);
              const response = await fetch(`/api/admin/sites/${props.slug}/archive`, {method: 'POST'});
              const payload = (await response.json().catch(() => ({}))) as {error?: string};
              setBusy(false);
              if (!response.ok) {
                setError(payload.error ?? 'Archive failed');
                return;
              }
              router.push('/');
              router.refresh();
            }}
          >
            Archive
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
      <AdminAddSectionDialog
        open={addOpen}
        siteDocument={document}
        onClose={() => setAddOpen(false)}
        onAdd={addSection}
      />

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
        <SitePageView site={previewSite} />
      </div>
    </div>
  );
}
