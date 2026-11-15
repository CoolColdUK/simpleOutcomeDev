'use client';

import type {SiteSection} from '@so/model';

type MenuSection = Extract<SiteSection, {type: 'headerMenu' | 'footerMenu'}>;

export default function AdminSectionMenuFields({
  links,
  sectionIds,
  onChange,
}: {
  links: MenuSection['props']['links'];
  sectionIds: readonly string[];
  onChange: (links: MenuSection['props']['links']) => void;
}) {
  const choices = sectionIds.length === 0 ? [] : sectionIds;
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
              {choices.map((id) => (
                <option key={id} value={id}>
                  {id}
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
          const sectionId = choices[0];
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
