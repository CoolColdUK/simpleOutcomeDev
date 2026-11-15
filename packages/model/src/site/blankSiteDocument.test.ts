import {blankSiteDocument} from './blankSiteDocument';
import {parseSiteDocument} from './parseSiteDocument';

describe('blankSiteDocument', () => {
  it('is an empty page with no header or footer', () => {
    const document = parseSiteDocument(blankSiteDocument('New studio'));
    expect(document.schemaVersion).toBe(2);
    expect(document.sections).toEqual([]);
    expect(document.businessName).toBe('New studio');
  });

  it('accepts a blank section and a header with a background and buttons', () => {
    const document = parseSiteDocument({
      ...blankSiteDocument('New studio'),
      sections: [
        {
          id: 'top',
          type: 'headerSimple',
          props: {
            background: '#ffffff',
            items: [
              {
                id: 'book',
                type: 'button',
                props: {label: 'Book', href: 'https://example.com', background: '#111111', color: '#ffffff'},
              },
            ],
          },
        },
        {
          id: 'band',
          name: 'Hero band',
          type: 'blank',
          props: {
            heightPx: 120,
            background: '#f3f3f3',
            items: [
              {
                id: 'menu',
                type: 'iconButton',
                props: {label: 'Menu', href: 'https://example.com', icon: 'menu', background: '#111111', color: '#ffffff'},
              },
            ],
          },
        },
      ],
    });
    expect(document.sections.map((section) => section.type)).toEqual(['headerSimple', 'blank']);
    expect(document.sections[1]?.name).toBe('Hero band');
  });
});