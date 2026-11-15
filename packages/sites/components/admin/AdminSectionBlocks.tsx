'use client';

import type {SiteBlock, SiteBlockIcon} from '@so/model';
import {useEffect, useState} from 'react';
import {isSiteBlockIcon} from '@/components/SiteBlockView';

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function AdminColourField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  const picker = HEX.test(draft) && draft.length === 7 ? draft : '#ffffff';
  const commit = (next: string): void => {
    setDraft(next);
    if (next.trim() === '' || HEX.test(next.trim())) {
      onChange(next.trim());
    }
  };
  return (
    <label>
      {label}
      <span className="admin-colour">
        <input type="color" value={picker} aria-label={label} onChange={(event) => commit(event.target.value)} />
        <input value={draft} maxLength={7} onChange={(event) => commit(event.target.value)} />
      </span>
    </label>
  );
}

export function createSectionBlock(type: SiteBlock['type']): SiteBlock {
  const suffix = Math.random().toString(36).slice(2, 8);
  if (type === 'iconButton') {
    return {
      id: `icon-button-${suffix}`,
      type: 'iconButton',
      props: {label: 'Menu', href: 'https://example.com', icon: 'menu', background: '#111111', color: '#ffffff'},
    };
  }
  return {
    id: `button-${suffix}`,
    type: 'button',
    props: {label: 'Button', href: 'https://example.com', background: '#111111', color: '#ffffff'},
  };
}

export default function AdminSectionBlocks({
  items,
  onChange,
}: {
  items: readonly SiteBlock[];
  onChange: (items: SiteBlock[]) => void;
}) {
  return (
    <div>
      <h3>Components</h3>
      {items.map((block, index) => (
        <div key={block.id} className="admin-repeat">
          <p className="admin-muted">{block.type === 'iconButton' ? 'Icon button' : 'Button'}</p>
          <label>
            Label
            <input
              value={block.props.label}
              maxLength={120}
              onChange={(event) => updateBlock(items, index, patchBlock(block, {label: event.target.value}), onChange)}
            />
          </label>
          <label>
            URL
            <input
              value={block.props.href}
              maxLength={400}
              onChange={(event) => updateBlock(items, index, patchBlock(block, {href: event.target.value}), onChange)}
            />
          </label>
          {block.type === 'iconButton' ? (
            <label>
              Icon
              <select
                value={block.props.icon}
                onChange={(event) => {
                  const icon = event.target.value;
                  if (!isSiteBlockIcon(icon)) {
                    return;
                  }
                  updateBlock(items, index, {...block, props: {...block.props, icon}}, onChange);
                }}
              >
                {(['menu', 'close', 'phone', 'arrow'] satisfies readonly SiteBlockIcon[]).map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <AdminColourField
            label="Background"
            value={block.props.background}
            onChange={(background) => {
              if (!HEX.test(background)) {
                return;
              }
              updateBlock(items, index, patchBlock(block, {background}), onChange);
            }}
          />
          <AdminColourField
            label="Text"
            value={block.props.color}
            onChange={(color) => {
              if (!HEX.test(color)) {
                return;
              }
              updateBlock(items, index, patchBlock(block, {color}), onChange);
            }}
          />
          <button type="button" className="secondary" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={items.length >= 8}
        onClick={() => onChange([...items, createSectionBlock('button')])}
      >
        Add button
      </button>
      <button
        type="button"
        className="secondary"
        disabled={items.length >= 8}
        onClick={() => onChange([...items, createSectionBlock('iconButton')])}
      >
        Add icon button
      </button>
    </div>
  );
}

function patchBlock(block: SiteBlock, patch: {label?: string; href?: string; background?: string; color?: string}): SiteBlock {
  if (block.type === 'iconButton') {
    return {id: block.id, type: 'iconButton', props: {...block.props, ...patch}};
  }
  return {id: block.id, type: 'button', props: {...block.props, ...patch}};
}

function updateBlock(items: readonly SiteBlock[], index: number, next: SiteBlock, onChange: (items: SiteBlock[]) => void): void {
  onChange(items.map((item, itemIndex) => (itemIndex === index ? next : item)));
}
