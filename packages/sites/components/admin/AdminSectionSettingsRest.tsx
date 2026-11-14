'use client';

import type {SiteSection} from '@so/model';
import type {ReactNode} from 'react';
import {blankToUndefined, MediaFields, Rows} from '@/components/admin/AdminSectionSettingsShared';

export default function AdminSectionSettingsRest({
  section,
  onChange,
}: {
  section: SiteSection;
  onChange: (next: SiteSection) => void;
}): ReactNode {
  if (section.type === 'gallery') {
    return (
      <>
        <label>
          Title
          <input
            value={section.props.title ?? ''}
            maxLength={120}
            onChange={(event) => onChange({...section, props: {...section.props, title: blankToUndefined(event.target.value)}})}
          />
        </label>
        <Rows
          items={section.props.items}
          min={1}
          max={24}
          create={() => ({label: 'Work photo', background: 'linear-gradient(135deg,#dfe3cf,#c7cfb0)'})}
          onChange={(items) => onChange({...section, props: {...section.props, items}})}
          render={(item, update) => (
            <>
              <label>
                Label
                <input value={item.label} maxLength={120} onChange={(event) => update({...item, label: event.target.value})} />
              </label>
              <label>
                Background
                <input value={item.background} onChange={(event) => update({...item, background: event.target.value})} />
              </label>
            </>
          )}
        />
      </>
    );
  }
  if (section.type === 'reviews') {
    return (
      <>
        <label>
          Title
          <input
            value={section.props.title ?? ''}
            maxLength={120}
            onChange={(event) => onChange({...section, props: {...section.props, title: blankToUndefined(event.target.value)}})}
          />
        </label>
        <Rows
          items={section.props.items}
          min={1}
          max={12}
          create={() => ({quote: 'A sample review.', attribution: 'Client', stars: 5 as const})}
          onChange={(items) => onChange({...section, props: {...section.props, items}})}
          render={(item, update) => (
            <>
              <label>
                Quote
                <textarea value={item.quote} maxLength={2000} onChange={(event) => update({...item, quote: event.target.value})} />
              </label>
              <label>
                Attribution
                <input
                  value={item.attribution}
                  maxLength={120}
                  onChange={(event) => update({...item, attribution: event.target.value})}
                />
              </label>
              <label>
                Stars
                <select
                  value={item.stars}
                  onChange={(event) => update({...item, stars: Number(event.target.value) as 1 | 2 | 3 | 4 | 5})}
                >
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <option key={stars} value={stars}>
                      {stars}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        />
      </>
    );
  }
  if (section.type === 'hoursLocation') {
    const address = section.props.address;
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
          Address type
          <select
            value={address.kind}
            onChange={(event) => {
              const nextAddress =
                event.target.value === 'full'
                  ? {kind: 'full' as const, lines: address.kind === 'full' ? address.lines : [address.street, address.area]}
                  : {
                      kind: 'street-and-area' as const,
                      street: address.kind === 'street-and-area' ? address.street : (address.lines[0] ?? 'High Street'),
                      area: address.kind === 'street-and-area' ? address.area : (address.lines[1] ?? 'Town'),
                    };
              onChange({...section, props: {...section.props, address: nextAddress}});
            }}
          >
            <option value="street-and-area">Street and area</option>
            <option value="full">Full address</option>
          </select>
        </label>
        {address.kind === 'street-and-area' ? (
          <>
            <label>
              Street
              <input
                value={address.street}
                maxLength={120}
                onChange={(event) => onChange({...section, props: {...section.props, address: {...address, street: event.target.value}}})}
              />
            </label>
            <label>
              Area
              <input
                value={address.area}
                maxLength={120}
                onChange={(event) => onChange({...section, props: {...section.props, address: {...address, area: event.target.value}}})}
              />
            </label>
          </>
        ) : (
          <Rows
            items={address.lines}
            min={1}
            max={6}
            create={() => 'Address line'}
            onChange={(lines) => onChange({...section, props: {...section.props, address: {kind: 'full', lines}}})}
            render={(line, update) => (
              <label>
                Line
                <input value={line} maxLength={120} onChange={(event) => update(event.target.value)} />
              </label>
            )}
          />
        )}
        <Rows
          items={section.props.hours}
          min={1}
          max={14}
          create={() => ({days: 'Monday–Friday', hours: '9:00–17:00'})}
          onChange={(hours) => onChange({...section, props: {...section.props, hours}})}
          render={(row, update) => (
            <>
              <label>
                Days
                <input value={row.days} maxLength={120} onChange={(event) => update({...row, days: event.target.value})} />
              </label>
              <label>
                Hours
                <input value={row.hours} maxLength={120} onChange={(event) => update({...row, hours: event.target.value})} />
              </label>
            </>
          )}
        />
        <label>
          Note
          <textarea
            value={section.props.note ?? ''}
            maxLength={2000}
            onChange={(event) => onChange({...section, props: {...section.props, note: blankToUndefined(event.target.value)}})}
          />
        </label>
        <label>
          Maps URL
          <input
            value={section.props.mapsUrl ?? ''}
            maxLength={400}
            placeholder="https://"
            onChange={(event) => onChange({...section, props: {...section.props, mapsUrl: blankToUndefined(event.target.value)}})}
          />
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={section.props.showMapPlaceholder}
            onChange={(event) => onChange({...section, props: {...section.props, showMapPlaceholder: event.target.checked}})}
          />
          Show map placeholder
        </label>
      </>
    );
  }
  if (section.type === 'contact') {
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
          Intro
          <textarea
            value={section.props.intro ?? ''}
            maxLength={2000}
            onChange={(event) => onChange({...section, props: {...section.props, intro: blankToUndefined(event.target.value)}})}
          />
        </label>
        <Rows
          items={section.props.channels}
          min={0}
          max={8}
          create={() => ({kind: 'phone' as const, label: 'Phone', href: 'tel:'})}
          onChange={(channels) => onChange({...section, props: {...section.props, channels}})}
          render={(channel, update) => (
            <>
              <label>
                Kind
                <select
                  value={channel.kind}
                  onChange={(event) =>
                    update({
                      ...channel,
                      kind: event.target.value === 'whatsapp' || event.target.value === 'instagram' ? event.target.value : 'phone',
                    })
                  }
                >
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                </select>
              </label>
              <label>
                Label
                <input value={channel.label} maxLength={120} onChange={(event) => update({...channel, label: event.target.value})} />
              </label>
              <label>
                Link
                <input value={channel.href} maxLength={300} onChange={(event) => update({...channel, href: event.target.value})} />
              </label>
            </>
          )}
        />
      </>
    );
  }
  if (section.type === 'contactForm') {
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
          Intro
          <textarea
            value={section.props.intro ?? ''}
            maxLength={2000}
            onChange={(event) => onChange({...section, props: {...section.props, intro: blankToUndefined(event.target.value)}})}
          />
        </label>
        <label>
          Submit label
          <input
            value={section.props.submitLabel}
            maxLength={120}
            onChange={(event) => onChange({...section, props: {...section.props, submitLabel: event.target.value}})}
          />
        </label>
      </>
    );
  }
  if (section.type === 'faq') {
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
        <Rows
          items={section.props.items}
          min={1}
          max={12}
          create={() => ({question: 'A question?', answer: 'An answer.'})}
          onChange={(items) => onChange({...section, props: {...section.props, items}})}
          render={(item, update) => (
            <>
              <label>
                Question
                <input value={item.question} maxLength={120} onChange={(event) => update({...item, question: event.target.value})} />
              </label>
              <label>
                Answer
                <textarea value={item.answer} maxLength={2000} onChange={(event) => update({...item, answer: event.target.value})} />
              </label>
            </>
          )}
        />
      </>
    );
  }
  if (section.type === 'team') {
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
        <Rows
          items={section.props.members}
          min={1}
          max={12}
          create={() => ({
            name: 'Name',
            role: 'Role',
            media: {label: 'Portrait', background: 'linear-gradient(135deg,#fffdf8,#c7cfb0)'},
          })}
          onChange={(members) => onChange({...section, props: {...section.props, members}})}
          render={(member, update) => (
            <>
              <label>
                Name
                <input value={member.name} maxLength={120} onChange={(event) => update({...member, name: event.target.value})} />
              </label>
              <label>
                Role
                <input value={member.role} maxLength={120} onChange={(event) => update({...member, role: event.target.value})} />
              </label>
              <label>
                Photo label
                <input
                  value={member.media.label}
                  maxLength={120}
                  onChange={(event) => update({...member, media: {...member.media, label: event.target.value}})}
                />
              </label>
              <label>
                Photo background
                <input
                  value={member.media.background}
                  onChange={(event) => update({...member, media: {...member.media, background: event.target.value}})}
                />
              </label>
            </>
          )}
        />
      </>
    );
  }
  if (section.type !== 'splitCta') {
    return null;
  }
  return (
    <Rows
      items={section.props.items}
      min={2}
      max={2}
      create={() => section.props.items[0]}
      onChange={(items) => {
        const [left, right] = items;
        if (left === undefined || right === undefined) {
          return;
        }
        onChange({...section, props: {items: [left, right]}});
      }}
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
          <label>
            Button label
            <input value={item.ctaLabel} maxLength={120} onChange={(event) => update({...item, ctaLabel: event.target.value})} />
          </label>
          <label>
            URL
            <input value={item.href} maxLength={400} onChange={(event) => update({...item, href: event.target.value})} />
          </label>
          <label>
            Media label
            <input
              value={item.media.label}
              maxLength={120}
              onChange={(event) => update({...item, media: {...item.media, label: event.target.value}})}
            />
          </label>
          <label>
            Media background
            <input
              value={item.media.background}
              onChange={(event) => update({...item, media: {...item.media, background: event.target.value}})}
            />
          </label>
        </>
      )}
    />
  );
}
