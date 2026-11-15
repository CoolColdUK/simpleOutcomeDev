'use client';

import type {SiteSection} from '@so/model';
import {sectionChoiceLabel} from '@/components/admin/AdminSectionSettingsShared';

type MenuSection = Extract<SiteSection, {type: 'headerMenu' | 'footerMenu'}>;

export default function AdminSectionMenuFields({
  links,
  sections,
  onChange,
}: {
  links: MenuSection['props']['links'];
  sections: readonly SiteSection[];
  onChange: (links: MenuSection['props']['links']) => void;
}) {
  const choices = sections;
  return (
    <>
      {links.map((link, index) => (
        <div key={`${link.sectionId}-${index}`} className="admin-repeat">
          <label>
            Label
            <input
              value={link.label}
              maxLength={120}
              onChange={(event) =>
                onChange(links.map((item, itemIndex) => (itemIndex === index ? {...item, label: event.target.value} : item)))
              }
            />
          </label>
          <label>
            Section
            <select
              value={link.sectionId}
              onChange={(event) =>
                onChange(links.map((item, itemIndex) => (itemIndex === index ? {...item, sectionId: event.target.value} : item)))
              }
            >
              {choices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {sectionChoiceLabel(choice)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="secondary" onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))}>
            Remove link
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={links.length >= 8 || choices.length === 0}
        onClick={() => {
          const sectionId = choices[0]?.id;
          if (sectionId === undefined) {
            return;
          }
          onChange([...links, {label: 'Section', sectionId}]);
        }}
      >
        Add link
      </button>
    </>
  );
}
