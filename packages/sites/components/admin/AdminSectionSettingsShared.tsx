'use client';

import {SITE_COMPONENT_CATALOG, type SiteSection} from '@so/model';
import type {ReactNode} from 'react';

export function blankToUndefined(value: string): string | undefined {
  return value.length === 0 ? undefined : value;
}


export function sectionLabel(type: SiteSection['type']): string {
  return SITE_COMPONENT_CATALOG.find((entry) => entry.type === type)?.label ?? type;
}


export function Rows<T>({
  items,
  min,
  max,
  create,
  onChange,
  render,
}: {
  items: readonly T[];
  min: number;
  max: number;
  create: () => T;
  onChange: (next: T[]) => void;
  render: (item: T, update: (next: T) => void) => ReactNode;
}) {
  return (
    <div className="admin-repeat-list">
      {items.map((item, index) => (
        <div key={index} className="admin-repeat">
          {render(item, (next) => onChange(items.map((current, currentIndex) => (currentIndex === index ? next : current))))}
          <button
            type="button"
            className="secondary"
            disabled={items.length <= min}
            onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="secondary" disabled={items.length >= max} onClick={() => onChange([...items, create()])}>
        Add
      </button>
    </div>
  );
}


export function MediaFields({
  media,
  onChange,
}: {
  media: {label: string; background: string} | undefined;
  onChange: (next: {label: string; background: string} | undefined) => void;
}) {
  return (
    <fieldset>
      <legend>Media</legend>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={media !== undefined}
          onChange={(event) =>
            onChange(
              event.target.checked
                ? {label: 'Photo', background: 'linear-gradient(135deg,#dfe3cf,#c7cfb0)'}
                : undefined,
            )
          }
        />
        Show media
      </label>
      {media === undefined ? null : (
        <>
          <label>
            Label
            <input value={media.label} maxLength={120} onChange={(event) => onChange({...media, label: event.target.value})} />
          </label>
          <label>
            Background
            <input value={media.background} onChange={(event) => onChange({...media, background: event.target.value})} />
          </label>
        </>
      )}
    </fieldset>
  );
}


export function CtaFields({
  heading,
  cta,
  sectionIds,
  onChange,
}: {
  heading: string;
  cta: {label: string; target: string} | undefined;
  sectionIds: readonly string[];
  onChange: (next: {label: string; target: string} | undefined) => void;
}) {
  return (
    <fieldset>
      <legend>{heading}</legend>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={cta !== undefined}
          onChange={(event) => onChange(event.target.checked ? {label: 'Book', target: 'booking'} : undefined)}
        />
        Show button
      </label>
      {cta === undefined ? null : (
        <>
          <label>
            Label
            <input value={cta.label} maxLength={120} onChange={(event) => onChange({...cta, label: event.target.value})} />
          </label>
          <label>
            Goes to
            <select value={cta.target} onChange={(event) => onChange({...cta, target: event.target.value})}>
              <option value="booking">Booking link</option>
              {sectionIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </fieldset>
  );
}


export function ServiceItems({
  items,
  onChange,
}: {
  items: readonly {name: string; detail: string; price: string}[];
  onChange: (next: {name: string; detail: string; price: string}[]) => void;
}) {
  return (
    <Rows
      items={items}
      min={1}
      max={24}
      create={() => ({name: 'Treatment', detail: '30 min', price: '£30'})}
      onChange={onChange}
      render={(item, update) => (
        <>
          <label>
            Name
            <input value={item.name} maxLength={120} onChange={(event) => update({...item, name: event.target.value})} />
          </label>
          <label>
            Detail
            <input value={item.detail} maxLength={80} onChange={(event) => update({...item, detail: event.target.value})} />
          </label>
          <label>
            Price
            <input value={item.price} maxLength={40} onChange={(event) => update({...item, price: event.target.value})} />
          </label>
        </>
      )}
    />
  );
}

