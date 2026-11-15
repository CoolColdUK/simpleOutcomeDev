'use client';

import type {SiteSection} from '@so/model';
import type {ReactNode} from 'react';
import AdminSectionBlocks, {AdminColourField} from '@/components/admin/AdminSectionBlocks';
import AdminSectionMenuFields from '@/components/admin/AdminSectionMenuFields';
import {blankToUndefined, CtaFields, MediaFields, Rows, ServiceItems, sectionChoiceLabel} from '@/components/admin/AdminSectionSettingsShared';
import AdminSectionSettingsRest from '@/components/admin/AdminSectionSettingsRest';

export default function AdminSectionSettings({
  section,
  sections,
  onChange,
  onClose,
}: {
  section: SiteSection;
  sections: readonly SiteSection[];
  onChange: (next: SiteSection) => void;
  onClose: () => void;
}) {
  return (
    <div className="admin-props">
      <div className="admin-section-row">
        <h2>Settings</h2>
        <button type="button" className="secondary" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="admin-muted">{sectionChoiceLabel(section)}</p>
      <div className="admin-form">
        <label>
          Name
          <input
            value={section.name ?? ''}
            maxLength={120}
            placeholder="Internal name"
            onChange={(event) => onChange(sectionWithName(section, event.target.value))}
          />
          <span className="admin-hint">Shown in the editor only. Use this when several sections share a type.</span>
        </label>
        {renderFields(section, sections, onChange)}
      </div>
    </div>
  );
}

function sectionWithName(section: SiteSection, raw: string): SiteSection {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return {...section, name: undefined};
  }
  return {...section, name: trimmed};
}

function renderFields(section: SiteSection, sections: readonly SiteSection[], onChange: (next: SiteSection) => void): ReactNode {
  if (section.type === 'headerSimple') {
    return (
      <>
        <p className="admin-muted">Shows the business name and booking button. Add buttons to build the rest of the header.</p>
        <AdminColourField
          label="Background"
          value={section.props.background ?? ''}
          onChange={(background) =>
            onChange({...section, props: {...section.props, background: background === '' ? undefined : background}})
          }
        />
        <AdminSectionBlocks
          items={section.props.items ?? []}
          onChange={(items) => onChange({...section, props: {...section.props, items}})}
        />
      </>
    );
  }
  if (section.type === 'headerMenu') {
    return (
      <>
        <p className="admin-muted">Shows the business name and booking button. Add buttons to build the rest of the header.</p>
        <AdminColourField
          label="Background"
          value={section.props.background ?? ''}
          onChange={(background) =>
            onChange({...section, props: {...section.props, background: background === '' ? undefined : background}})
          }
        />
        <AdminSectionMenuFields
          links={section.props.links}
            sections={sections}
          onChange={(links) => onChange({...section, props: {...section.props, links}})}
        />
        <AdminSectionBlocks
          items={section.props.items ?? []}
          onChange={(items) => onChange({...section, props: {...section.props, items}})}
        />
      </>
    );
  }
  if (section.type === 'blank') {
    return (
      <>
        <label>
          Height (px)
          <input
            type="number"
            min={24}
            max={800}
            step={1}
            value={section.props.heightPx}
            onChange={(event) => onChange({...section, props: {...section.props, heightPx: Number(event.target.value)}})}
          />
        </label>
        <AdminColourField
          label="Background"
          value={section.props.background}
          onChange={(background) => {
            if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(background)) {
              return;
            }
            onChange({...section, props: {...section.props, background}});
          }}
        />
        <AdminSectionBlocks
          items={section.props.items}
          onChange={(items) => onChange({...section, props: {...section.props, items}})}
        />
      </>
    );
  }
  if (section.type === 'footerSimple') {
    return (
      <label>
        Footer text
        <textarea
          value={section.props.text}
          maxLength={2000}
          onChange={(event) => onChange({...section, props: {text: event.target.value}})}
        />
      </label>
    );
  }
  if (section.type === 'footerMenu') {
    return (
      <>
        <label>
          Footer text
          <textarea
            value={section.props.text}
            maxLength={2000}
            onChange={(event) => onChange({...section, props: {...section.props, text: event.target.value}})}
          />
        </label>
        <AdminSectionMenuFields
          links={section.props.links}
            sections={sections}
          onChange={(links) => onChange({...section, props: {...section.props, links}})}
        />
      </>
    );
  }
  if (section.type === 'hero') {
    return (
      <>
        <label>
          Layout
          <select
            value={section.props.layout}
            onChange={(event) =>
              onChange({
                ...section,
                props: {...section.props, layout: event.target.value as typeof section.props.layout},
              })
            }
          >
            {['split', 'center', 'statement', 'band', 'quote'].map((layout) => (
              <option key={layout} value={layout}>
                {layout}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tone
          <select
            value={section.props.tone}
            onChange={(event) =>
              onChange({...section, props: {...section.props, tone: event.target.value === 'light' ? 'light' : 'theme'}})
            }
          >
            <option value="theme">Theme</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label>
          Eyebrow
          <input
            value={section.props.eyebrow ?? ''}
            maxLength={120}
            onChange={(event) => onChange({...section, props: {...section.props, eyebrow: blankToUndefined(event.target.value)}})}
          />
        </label>
        <label>
          Title
          <input
            value={section.props.title}
            maxLength={120}
            onChange={(event) => onChange({...section, props: {...section.props, title: event.target.value}})}
          />
        </label>
        <label>
          Body
          <textarea
            value={section.props.body ?? ''}
            maxLength={2000}
            onChange={(event) => onChange({...section, props: {...section.props, body: blankToUndefined(event.target.value)}})}
          />
        </label>
        <label>
          Quote
          <textarea
            value={section.props.quote ?? ''}
            maxLength={2000}
            onChange={(event) => onChange({...section, props: {...section.props, quote: blankToUndefined(event.target.value)}})}
          />
        </label>
        <label>
          Attribution
          <input
            value={section.props.attribution ?? ''}
            maxLength={120}
            onChange={(event) =>
              onChange({...section, props: {...section.props, attribution: blankToUndefined(event.target.value)}})
            }
          />
        </label>
        <CtaFields
          heading="Primary button"
          cta={section.props.primaryCta}
            sections={sections}
          onChange={(primaryCta) => onChange({...section, props: {...section.props, primaryCta}})}
        />
        <CtaFields
          heading="Secondary button"
          cta={section.props.secondaryCta}
            sections={sections}
          onChange={(secondaryCta) => onChange({...section, props: {...section.props, secondaryCta}})}
        />
        <MediaFields
          media={section.props.media}
          onChange={(media) => onChange({...section, props: {...section.props, media}})}
        />
      </>
    );
  }
  if (section.type === 'highlights') {
    return (
      <Rows
        items={section.props.items}
        min={1}
        max={12}
        create={() => ({title: 'Highlight', body: 'A short point.'})}
        onChange={(items) => onChange({...section, props: {items}})}
        render={(item, update) => (
          <>
            <label>
              Title
              <input value={item.title} maxLength={120} onChange={(event) => update({...item, title: event.target.value})} />
            </label>
            <label>
              Body
              <textarea value={item.body} maxLength={2000} onChange={(event) => update({...item, body: event.target.value})} />
            </label>
          </>
        )}
      />
    );
  }
  if (section.type === 'services') {
    return (
      <>
        <label>
          Title
          <input
            value={section.props.title}
            maxLength={120}
            onChange={(event) => onChange({...section, props: {...section.props, title: event.target.value}})}
          />
        </label>
        <label>
          Presentation
          <select
            value={section.props.presentation}
            onChange={(event) => {
              const presentation = event.target.value;
              if (presentation === 'grouped') {
                const groups =
                  section.props.presentation === 'grouped'
                    ? section.props.groups
                    : [{label: 'Group', items: section.props.items}];
                onChange({...section, props: {title: section.props.title, presentation: 'grouped', groups}});
                return;
              }
              const items =
                section.props.presentation === 'grouped'
                  ? (section.props.groups[0]?.items ?? [{name: 'Treatment', detail: '30 min', price: '£30'}])
                  : section.props.items;
              const nextPresentation = presentation === 'cards' ? 'cards' : 'rows';
              onChange({...section, props: {title: section.props.title, presentation: nextPresentation, items}});
            }}
          >
            <option value="rows">Rows</option>
            <option value="cards">Cards</option>
            <option value="grouped">Grouped</option>
          </select>
        </label>
        {section.props.presentation === 'grouped' ? (
          <Rows
            items={section.props.groups}
            min={1}
            max={8}
            create={() => ({label: 'Group', items: [{name: 'Treatment', detail: '30 min', price: '£30'}]})}
            onChange={(groups) =>
              onChange({
                id: section.id,
                type: 'services',
                props: {title: section.props.title, presentation: 'grouped', groups},
              })
            }
            render={(group, update) => (
              <>
                <label>
                  Group
                  <input value={group.label} maxLength={120} onChange={(event) => update({...group, label: event.target.value})} />
                </label>
                <ServiceItems items={group.items} onChange={(items) => update({...group, items})} />
              </>
            )}
          />
        ) : (
          <ServiceItems
            items={section.props.items}
            onChange={(items) => {
              if (section.props.presentation === 'grouped') {
                return;
              }
              onChange({
                id: section.id,
                type: 'services',
                props: {title: section.props.title, presentation: section.props.presentation, items},
              });
            }}
          />
        )}
      </>
    );
  }
  if (section.type === 'about') {
    return (
      <>
        <label>
          Eyebrow
          <input
            value={section.props.eyebrow}
            maxLength={120}
            onChange={(event) => onChange({...section, props: {...section.props, eyebrow: event.target.value}})}
          />
        </label>
        <label>
          Title
          <input
            value={section.props.title}
            maxLength={120}
            onChange={(event) => onChange({...section, props: {...section.props, title: event.target.value}})}
          />
        </label>
        <label>
          Body
          <textarea
            value={section.props.body}
            maxLength={2000}
            onChange={(event) => onChange({...section, props: {...section.props, body: event.target.value}})}
          />
        </label>
        <MediaFields media={section.props.media} onChange={(media) => onChange({...section, props: {...section.props, media}})} />
      </>
    );
  }
  if (section.type === 'bookingCta') {
    return (
      <>
        <label>
          Title
          <input
            value={section.props.title}
            maxLength={120}
            onChange={(event) => onChange({...section, props: {...section.props, title: event.target.value}})}
          />
        </label>
        <label>
          Body
          <textarea
            value={section.props.body ?? ''}
            maxLength={2000}
            onChange={(event) => onChange({...section, props: {...section.props, body: blankToUndefined(event.target.value)}})}
          />
        </label>
      </>
    );
  }
  return <AdminSectionSettingsRest section={section} onChange={onChange} />;
}
