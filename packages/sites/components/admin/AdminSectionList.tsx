'use client';

import type {SiteSection} from '@so/model';
import {useRef, useState, type DragEvent} from 'react';
import {AdminDeleteIcon, AdminDragHandleIcon, AdminSettingsIcon} from '@/components/admin/AdminEditorIcons';
import {sectionChoiceLabel, sectionLabel} from '@/components/admin/AdminSectionSettingsShared';

function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) {
    return [...items];
  }
  next.splice(to, 0, item);
  return next;
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
  const ghostRef = useRef<HTMLElement | undefined>(undefined);

  const clearGhost = (): void => {
    ghostRef.current?.remove();
    ghostRef.current = undefined;
  };

  const startDrag = (event: DragEvent<HTMLButtonElement>, index: number): void => {
    const item = event.currentTarget.closest('.admin-section-item');
    event.dataTransfer.setData('text/plain', String(index));
    event.dataTransfer.effectAllowed = 'move';
    if (item instanceof HTMLElement) {
      const ghost = item.cloneNode(true);
      if (ghost instanceof HTMLElement) {
        ghost.style.position = 'fixed';
        ghost.style.top = '-1000px';
        ghost.style.left = '0';
        ghost.style.width = `${item.offsetWidth}px`;
        ghost.style.pointerEvents = 'none';
        document.body.appendChild(ghost);
        const rect = item.getBoundingClientRect();
        event.dataTransfer.setDragImage(ghost, event.clientX - rect.left, event.clientY - rect.top);
        ghostRef.current = ghost;
      }
    }
    setDragIndex(index);
  };

  return (
    <div className="admin-section-list">
      <h2>Sections</h2>
      {sections.length === 0 ? <p className="admin-muted">This page is blank. Add a section to start.</p> : null}
      {sections.map((section, index) => (
        <div
          key={section.id}
          className={`admin-section-item${section.id === settingsId ? ' settings-open' : ''}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            clearGhost();
            if (dragIndex === undefined || dragIndex === index) {
              setDragIndex(undefined);
              return;
            }
            onReorder(moveItem(sections, dragIndex, index));
            setDragIndex(undefined);
          }}
          onDragEnd={() => {
            clearGhost();
            setDragIndex(undefined);
          }}
        >
          <div className="admin-section-row">
            <button
              type="button"
              className="admin-icon-button admin-drag-handle"
              aria-label="Drag to reorder"
              draggable
              onDragStart={(event) => startDrag(event, index)}
              onDragEnd={() => {
                clearGhost();
                setDragIndex(undefined);
              }}
            >
              <AdminDragHandleIcon />
            </button>
            <div className="admin-section-copy">
              <strong>{section.name ?? sectionLabel(section.type)}</strong>
              <div className="admin-muted">
                {section.name === undefined ? section.id : `${sectionLabel(section.type)} · ${section.id}`}
              </div>
            </div>
            <button
              type="button"
              className="admin-icon-button"
              aria-label={`Settings for ${sectionChoiceLabel(section)}`}
              onClick={() => onOpenSettings(section.id)}
            >
              <AdminSettingsIcon />
            </button>
            <button
              type="button"
              className="admin-icon-button danger"
              aria-label={`Delete ${sectionChoiceLabel(section)}`}
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
