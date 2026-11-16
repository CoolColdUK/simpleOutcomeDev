'use client';

import {useState} from 'react';
import {AdminIconButton} from '@/components/admin/AdminEditorIcons';

export default function AdminDesignOptionMenu({
  label,
  options,
  onPick,
  icon,
}: {
  label: string;
  options: readonly {key: string; label: string}[];
  onPick: (key: string) => void;
  icon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (options.length === 0) {
    return null;
  }
  return (
    <div className={icon === true ? 'design-option design-option-end' : 'design-option'}>
      {icon === true ? (
        <AdminIconButton label={label} icon="settings" expanded={open} onClick={() => setOpen(!open)} />
      ) : (
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
          {label}
        </button>
      )}
      {open ? (
        <div className="design-option-menu">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                onPick(option.key);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
