import {sampleFooter} from '../site/siteSampleCopy';
import type {DesignAtomField, DesignAtomPreset} from './designAtomPreset';
import type {DesignMolecule, DesignMoleculeDocument} from './designMolecule';
import type {DesignAtomNode, DesignStyle} from './designNode';
import type {DesignOrganism, DesignOrganismDocument} from './designOrganism';
import type {DesignTemplateItem} from './designTemplateItem';

const content = (key: string, label: string, kind: DesignAtomField['kind'] = 'text'): DesignAtomField => ({
  key,
  label,
  group: 'content',
  kind,
});

const setting = (key: string, label: string, kind: DesignAtomField['kind']): DesignAtomField => ({
  key,
  label,
  group: 'setting',
  kind,
});

function preset(id: string, name: string, base: string, fields: DesignAtomField[], style: DesignStyle, parentId: string): DesignAtomPreset {
  return {id, name, base, parentId, fields, style};
}

export const BOLD_NAIL_ATOMS: readonly DesignAtomPreset[] = [
  preset('heading', 'Heading', 'text', [content('text', 'Text'), content('role', 'Role', 'choice'), setting('color', 'Text colour', 'colour'), setting('fontSizePx', 'Font size', 'number'), setting('align', 'Text align', 'choice')], {
    color: 'siteForeground',
    fontSizePx: 32,
    align: 'start',
  }, 'text'),
  preset('body-copy', 'Body copy', 'text', [content('text', 'Text'), setting('color', 'Text colour', 'colour'), setting('fontSizePx', 'Font size', 'number'), setting('align', 'Text align', 'choice')], {
    color: 'siteForeground',
    fontSizePx: 16,
    align: 'start',
  }, 'text'),
  preset('nav-link', 'Nav link', 'link', [content('label', 'Label'), content('href', 'Link'), setting('color', 'Text colour', 'colour')], {color: 'siteForeground'}, 'link'),
  preset(
    'accent-button',
    'Accent button',
    'button',
    [
      content('label', 'Label'),
      content('href', 'Link'),
      setting('background', 'Background', 'colour'),
      setting('color', 'Text colour', 'colour'),
      setting('radiusPx', 'Corner radius', 'number'),
      setting('borderWidthPx', 'Border width', 'number'),
    ],
    {background: 'siteAccent', color: 'siteButtonForeground', radiusPx: 16, borderWidthPx: 0},
    'button',
  ),
  preset('service-name', 'Service name', 'text', [content('text', 'Text'), setting('color', 'Text colour', 'colour'), setting('fontSizePx', 'Font size', 'number')], {
    color: 'siteForeground',
    fontSizePx: 18,
  }, 'text'),
  preset('service-price', 'Service price', 'text', [content('text', 'Text'), setting('color', 'Text colour', 'colour'), setting('fontSizePx', 'Font size', 'number')], {
    color: 'siteAccent',
    fontSizePx: 20,
  }, 'text'),
];

function atom(id: string, base: string, presetId: string, style: DesignStyle = {}): DesignAtomNode {
  return {id, kind: 'atom', atom: base, presetId, style, slots: []};
}

function molecule(id: string, name: string, document: DesignMoleculeDocument): DesignMolecule {
  return {id, name, document};
}

export const serviceCardDocument: DesignMoleculeDocument = {
  pattern: 'tree',
  layout: {direction: 'column', gapPx: 8, align: 'stretch'},
  container: {widthPx: 220, paddingPx: 16, background: 'siteCard', radiusPx: 16, borderWidthPx: 1, borderColor: 'siteAccent'},
  children: [atom('name', 'text', 'service-name'), atom('detail', 'text', 'body-copy'), atom('price', 'text', 'service-price')],
};

const serviceSets = [
  ['gel', 'Gel manicure', '45 min', '£28'],
  ['biab', 'BIAB overlay', '60 min', '£35'],
  ['lashes', 'Lash lift & tint', '50 min', '£40'],
  ['brows', 'Brow shape & tint', '30 min', '£20'],
] as const;

const galleryShots = [
  ['shot1', 'Chrome'],
  ['shot2', 'Jelly'],
  ['shot3', '3D art'],
  ['shot4', 'Full set'],
] as const;

export const boldNavDocument: DesignMoleculeDocument = {
  pattern: 'tree',
  layout: {direction: 'row', gapPx: 16, align: 'center', valign: 'center', wrap: 'wrap'},
  container: {paddingPx: 16, background: 'siteBackground'},
  children: [
    atom('name', 'text', 'heading', {fontSizePx: 22}),
    atom('prices', 'link', 'nav-link'),
    atom('gallery', 'link', 'nav-link'),
    atom('book', 'button', 'accent-button'),
  ],
};

export const boldHeroDocument: DesignMoleculeDocument = {
  pattern: 'tree',
  layout: {direction: 'column', gapPx: 12, align: 'center', valign: 'center'},
  container: {paddingPx: 32, background: 'hero', radiusPx: 16},
  children: [
    atom('title', 'text', 'heading', {color: 'siteButtonForeground', align: 'center', fontSizePx: 40}),
    atom('body', 'text', 'body-copy', {color: 'siteButtonForeground', align: 'center', fontSizePx: 18}),
    atom('cta', 'button', 'accent-button'),
  ],
};

export const boldServiceRowDocument: DesignMoleculeDocument = {
  pattern: 'tree',
  layout: {direction: 'row', gapPx: 12, align: 'stretch', wrap: 'wrap'},
  children: serviceSets.map(([id]) => ({id, kind: 'molecule' as const, moleculeId: 'service-card'})),
};

export const boldServicesDocument: DesignMoleculeDocument = {
  pattern: 'tree',
  layout: {direction: 'column', gapPx: 16, align: 'stretch'},
  container: {paddingPx: 24},
  children: [atom('title', 'text', 'heading', {align: 'center', fontSizePx: 28}), {id: 'cards', kind: 'molecule', moleculeId: 'bold-service-row'}],
};

export const galleryTileDocument: DesignMoleculeDocument = {
  pattern: 'tree',
  layout: {direction: 'column', align: 'center', valign: 'center'},
  container: {widthPx: 220, minHeightPx: 140, paddingPx: 12, background: 'siteCard', radiusPx: 16},
  children: [atom('label', 'text', 'body-copy', {align: 'center'})],
};

export const boldGalleryDocument: DesignMoleculeDocument = {
  pattern: 'tree',
  layout: {direction: 'row', gapPx: 12, wrap: 'wrap'},
  container: {paddingPx: 24},
  children: galleryShots.map(([id]) => ({id, kind: 'molecule' as const, moleculeId: 'gallery-tile'})),
};

export const footerNoteDocument: DesignMoleculeDocument = {
  pattern: 'tree',
  layout: {direction: 'column', align: 'center'},
  container: {paddingPx: 24, background: 'siteBackground'},
  children: [atom('line', 'text', 'body-copy', {align: 'center', fontSizePx: 14})],
};

export const BOLD_NAIL_MOLECULES: readonly DesignMolecule[] = [
  molecule('bold-nav', 'Bold nav', boldNavDocument),
  molecule('bold-hero', 'Bold hero', boldHeroDocument),
  molecule('service-card', 'Service card', serviceCardDocument),
  molecule('bold-service-row', 'Bold service row', boldServiceRowDocument),
  molecule('bold-services', 'Bold services', boldServicesDocument),
  molecule('gallery-tile', 'Gallery tile', galleryTileDocument),
  molecule('bold-gallery', 'Bold gallery', boldGalleryDocument),
  molecule('footer-note', 'Footer note', footerNoteDocument),
];

function organism(id: string, name: string, category: DesignOrganism['category'], moleculeId: string): DesignOrganism {
  const document: DesignOrganismDocument = {children: [{id: 'section', kind: 'molecule', moleculeId}]};
  return {id, name, category, document};
}

export const BOLD_NAIL_ORGANISMS: readonly DesignOrganism[] = [
  organism('bold-nail-header', 'Bold nail header', 'header', 'bold-nav'),
  organism('bold-nail-hero', 'Bold nail hero', 'page', 'bold-hero'),
  organism('bold-nail-services', 'Bold nail services', 'page', 'bold-services'),
  organism('bold-nail-gallery', 'Bold nail gallery', 'page', 'bold-gallery'),
  organism('bold-nail-footer', 'Bold nail footer', 'footer', 'footer-note'),
];

function cardValue(id: string, name: string, detail: string, price: string): DesignTemplateItem['values'] {
  return {
    [`cards.${id}.name`]: {text: name},
    [`cards.${id}.detail`]: {text: detail},
    [`cards.${id}.price`]: {text: price},
  };
}

export const BOLD_NAIL_TEMPLATE_ITEMS: readonly DesignTemplateItem[] = [
  {
    id: 'nav',
    moleculeId: 'bold-nav',
    values: {
      name: {text: 'CANDY CLAW', role: 'heading'},
      prices: {label: 'Prices', href: '#prices'},
      gallery: {label: 'Gallery', href: '#gallery'},
      book: {label: 'Book your set', href: 'https://www.fresha.com/'},
    },
  },
  {
    id: 'hero',
    moleculeId: 'bold-hero',
    values: {
      title: {text: 'Bright nails. Big energy.', role: 'heading'},
      body: {text: 'Chrome, jelly, 3D art and full sets. Walk-ins welcome.'},
      cta: {label: 'Book your set', href: 'https://www.fresha.com/'},
    },
  },
  {
    id: 'services',
    moleculeId: 'bold-services',
    values: {
      title: {text: 'Sets', role: 'heading'},
      ...serviceSets.reduce<DesignTemplateItem['values']>((values, [id, name, detail, price]) => ({...values, ...cardValue(id, name, detail, price)}), {}),
    },
  },
  {
    id: 'gallery',
    moleculeId: 'bold-gallery',
    values: galleryShots.reduce<DesignTemplateItem['values']>((values, [id, label]) => ({...values, [`${id}.label`]: {text: label}}), {}),
  },
  {
    id: 'footer',
    moleculeId: 'footer-note',
    values: {line: {text: sampleFooter('CANDY CLAW')}},
  },
];
