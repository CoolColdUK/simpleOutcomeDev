'use client';

import {SITE_COMPONENT_CATALOG, type SiteDocument, type SiteSectionType} from '@so/model';
import type {CSSProperties} from 'react';
import {useEffect, useMemo, useState} from 'react';
import SiteSections from '@/components/SiteSections';
import {createDefaultSection} from '@/lib/admin/defaultSection';

export default function AdminAddSectionDialog({
  open,
  siteDocument,
  onClose,
  onAdd,
}: {
  open: boolean;
  siteDocument: SiteDocument;
  onClose: () => void;
  onAdd: (type: SiteSectionType) => void;
}) {
  const [type, setType] = useState<SiteSectionType>(SITE_COMPONENT_CATALOG[0].type);
  const previewSection = useMemo(() => createDefaultSection(type, 'preview'), [type]);
  const entry = SITE_COMPONENT_CATALOG.find((item) => item.type === type) ?? SITE_COMPONENT_CATALOG[0];

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const theme = siteDocument.theme;
  const style = {
    '--site-bg': theme.background,
    '--site-fg': theme.foreground,
    '--site-accent': theme.accent,
    '--site-btn-fg': theme.buttonForeground,
    '--site-card': theme.cardBackground,
    '--site-heading': theme.headingFont,
    '--site-body': theme.bodyFont,
    '--site-radius': `${theme.radiusPx}px`,
    '--site-hero': theme.heroBackground === 'none' ? 'transparent' : theme.heroBackground,
  } as CSSProperties;
  const previewDocument: SiteDocument = {
    ...siteDocument,
    sections: [previewSection],
  };

  return (
    <div className="admin-dialog-backdrop" onClick={onClose}>
      <div
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-section-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-dialog-head">
          <h2 id="add-section-title">Add section</h2>
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="admin-dialog-body">
          <div className="admin-dialog-list" role="listbox" aria-label="Section types">
            {SITE_COMPONENT_CATALOG.map((item) => (
              <button
                key={item.type}
                type="button"
                role="option"
                aria-selected={item.type === type}
                className={item.type === type ? 'admin-type-option selected' : 'admin-type-option'}
                onClick={() => setType(item.type)}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
          <div className="admin-section-preview">
            <p className="admin-muted">{entry.label} preview</p>
            <div className="site" data-uppercase={theme.uppercaseHeadings ? 'true' : 'false'} style={style}>
              <SiteSections document={previewDocument} status="draft" />
            </div>
          </div>
        </div>
        <div className="admin-dialog-foot">
          <button
            type="button"
            onClick={() => {
              onAdd(type);
              onClose();
            }}
          >
            Add {entry.label}
          </button>
        </div>
      </div>
    </div>
  );
}
