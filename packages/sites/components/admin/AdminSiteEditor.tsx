'use client';

import {
  SITE_COMPONENT_CATALOG,
  type SiteDocument,
  type SiteSection,
  type SiteSectionType,
} from '@so/model';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useMemo, useState} from 'react';
import SitePageView from '@/components/SitePageView';
import {createDefaultSection, newSectionId} from '@/lib/admin/defaultSection';

export interface AdminSiteEditorProps {
  readonly slug: string;
  readonly status: string;
  readonly messagesEnabled: boolean;
  readonly document: SiteDocument;
  readonly customDomain: string | undefined;
}

function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) {
    return next;
  }
  next.splice(to, 0, item);
  return next;
}

export default function AdminSiteEditor(props: AdminSiteEditorProps) {
  const router = useRouter();
  const [document, setDocument] = useState(props.document);
  const [selectedId, setSelectedId] = useState(props.document.sections[0]?.id ?? '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | undefined>(undefined);

  const selected = useMemo(
    () => document.sections.find((section) => section.id === selectedId),
    [document.sections, selectedId],
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

      <div className="admin-card">
        <div className="admin-form" style={{maxWidth: '100%'}}>
          <label>
            Business name
            <input
              value={document.businessName}
              onChange={(e) => setDocument({...document, businessName: e.target.value})}
            />
          </label>
          <label>
            Booking label
            <input
              value={document.booking.label}
              onChange={(e) => setDocument({...document, booking: {...document.booking, label: e.target.value}})}
            />
          </label>
          <label>
            Booking URL
            <input
              value={document.booking.href}
              onChange={(e) => setDocument({...document, booking: {...document.booking, href: e.target.value}})}
            />
          </label>
          <label>
            Footer
            <textarea
              value={document.footer.text}
              onChange={(e) => setDocument({...document, footer: {text: e.target.value}})}
            />
          </label>
        </div>
      </div>

      <div className="admin-editor">
        <div className="admin-palette">
          <h2>Add section</h2>
          {SITE_COMPONENT_CATALOG.map((entry) => (
            <button
              key={entry.type}
              type="button"
              className="secondary"
              style={{display: 'block', width: '100%', marginBottom: '0.4rem'}}
              onClick={() => {
                const id = newSectionId(entry.type as SiteSectionType);
                const section = createDefaultSection(entry.type as SiteSectionType, id);
                setDocument({
                  ...document,
                  sections: [...document.sections, section],
                  nav: {
                    links: [
                      ...document.nav.links,
                      ...(entry.type === 'hero' || entry.type === 'bookingCta' || entry.type === 'splitCta'
                        ? []
                        : [{label: entry.label, sectionId: id}]),
                    ].slice(0, 8),
                  },
                });
                setSelectedId(id);
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="admin-section-list">
          <h2>Sections</h2>
          {document.sections.map((section, index) => (
            <div
              key={section.id}
              className={`admin-section-item${section.id === selectedId ? ' selected' : ''}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex === undefined || dragIndex === index) {
                  return;
                }
                setDocument({...document, sections: moveItem(document.sections, dragIndex, index)});
                setDragIndex(undefined);
              }}
              onClick={() => setSelectedId(section.id)}
            >
              <strong>{section.type}</strong>
              <div className="admin-muted">{section.id}</div>
              <div className="admin-actions" style={{marginTop: '0.4rem'}}>
                <button
                  type="button"
                  className="secondary"
                  disabled={index === 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    setDocument({...document, sections: moveItem(document.sections, index, index - 1)});
                  }}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={index === document.sections.length - 1}
                  onClick={(event) => {
                    event.stopPropagation();
                    setDocument({...document, sections: moveItem(document.sections, index, index + 1)});
                  }}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={document.sections.length <= 1}
                  onClick={(event) => {
                    event.stopPropagation();
                    const sections = document.sections.filter((item) => item.id !== section.id);
                    setDocument({
                      ...document,
                      sections,
                      nav: {links: document.nav.links.filter((link) => link.sectionId !== section.id)},
                    });
                    if (selectedId === section.id) {
                      setSelectedId(sections[0]?.id ?? '');
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-props">
          <h2>Selected</h2>
          {selected === undefined ? (
            <p className="admin-muted">Select a section</p>
          ) : (
            <label>
              Section JSON
              <textarea
                style={{minHeight: '18rem', fontFamily: 'monospace', fontSize: '0.8rem'}}
                value={JSON.stringify(selected, null, 2)}
                onChange={(event) => {
                  try {
                    const next = JSON.parse(event.target.value) as SiteSection;
                    setDocument({
                      ...document,
                      sections: document.sections.map((section) => (section.id === selected.id ? next : section)),
                    });
                    setSelectedId(next.id);
                    setError('');
                  } catch {
                    setError('Section JSON is invalid');
                  }
                }}
              />
            </label>
          )}
          <label style={{display: 'grid', gap: '0.35rem', marginTop: '0.75rem'}}>
            Nav links JSON
            <textarea
              style={{minHeight: '8rem', fontFamily: 'monospace', fontSize: '0.8rem'}}
              value={JSON.stringify(document.nav.links, null, 2)}
              onChange={(event) => {
                try {
                  const links = JSON.parse(event.target.value) as SiteDocument['nav']['links'];
                  setDocument({...document, nav: {links}});
                  setError('');
                } catch {
                  setError('Nav JSON is invalid');
                }
              }}
            />
          </label>
        </div>
      </div>

      <div className="admin-preview">
        <SitePageView site={previewSite} />
      </div>
    </div>
  );
}
