'use client';

import {SITE_COMPONENT_CATALOG, type SiteSection} from '@so/model';
import {useState, type DragEvent} from 'react';
import {AdminDeleteIcon, AdminDragHandleIcon, AdminSettingsIcon} from '@/components/admin/AdminEditorIcons';

function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) {
    return [...items];
  }
  next.splice(to, 0, item);
  return next;
}

function sectionLabel(type: SiteSection['type']): string {
  return SITE_COMPONENT_CATALOG.find((entry) => entry.type === type)?.label ?? type;
}

export default function AdminSectionList({
  sections,
  settingsId,
  onReorder,
  onOpenSettings,
  onDelete,
}: {
  sections: readonly SiteSection[];
  settingsId: string | undefined;
  onReorder: (sections: SiteSection[]) => void;
  onOpenSettings: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | undefined>(undefined);

  const startDrag = (event: DragEvent, index: number): void => {
    event.dataTransfer.setData('text/plain', String(index));
    event.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  };

  return (
    <div className="admin-section-list">
      <h2>Sections</h2>
      {sections.map((section, index) => (
        <div
          key={section.id}
          className={`admin-section-item${section.id === settingsId ? ' settings-open' : ''}`}
          draggable
          onDragStart={(event) => startDrag(event, index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (dragIndex === undefined || dragIndex === index) {
              setDragIndex(undefined);
              return;
            }
            onReorder(moveItem(sections, dragIndex, index));
            setDragIndex(undefined);
          }}
          onDragEnd={() => setDragIndex(undefined)}
        >
          <div className="admin-section-row">
            <button
              type="button"
              className="admin-icon-button admin-drag-handle"
              aria-label="Drag to reorder"
              draggable
              onDragStart={(event) => {
                event.stopPropagation();
                startDrag(event, index);
              }}
            >
              <AdminDragHandleIcon />
            </button>
            <div className="admin-section-copy">
              <strong>{sectionLabel(section.type)}</strong>
              <div className="admin-muted">{section.id}</div>
            </div>
            <button
              type="button"
              className="admin-icon-button"
              aria-label={`Settings for ${sectionLabel(section.type)}`}
              onClick={() => onOpenSettings(section.id)}
            >
              <AdminSettingsIcon />
            </button>
            <button
              type="button"
              className="admin-icon-button danger"
              aria-label={`Delete ${sectionLabel(section.type)}`}
              disabled={sections.length <= 1}
              onClick={() => onDelete(section.id)}
            >
              <AdminDeleteIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
