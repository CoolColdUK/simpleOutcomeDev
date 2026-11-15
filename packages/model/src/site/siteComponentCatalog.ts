import type {SiteSection} from './siteSectionSchema';

export type SiteSectionType = SiteSection['type'];

export const SITE_COMPONENT_CATEGORIES = ['header', 'page', 'footer'] as const;

export type SiteComponentCategory = (typeof SITE_COMPONENT_CATEGORIES)[number];

export interface SiteComponentField {
  readonly name: string;
  readonly kind: 'string' | 'boolean' | 'number' | 'object' | 'array' | 'enum';
  readonly required: boolean;
  readonly values?: readonly string[];
  readonly description?: string;
}

export interface SiteComponentEntry {
  readonly type: SiteSectionType;
  readonly category: SiteComponentCategory;
  readonly label: string;
  readonly description: string;
  readonly fields: readonly SiteComponentField[];
}

export const SITE_SECTION_TYPES = [
  'headerSimple',
  'headerMenu',
  'hero',
  'highlights',
  'services',
  'about',
  'gallery',
  'reviews',
  'bookingCta',
  'hoursLocation',
  'contact',
  'contactForm',
  'faq',
  'team',
  'splitCta',
  'footerSimple',
  'footerMenu',
] as const satisfies readonly SiteSectionType[];

export const SITE_COMPONENT_CATALOG: readonly SiteComponentEntry[] = [
  {
    type: 'headerSimple',
    category: 'header',
    label: 'Simple header',
    description: 'Business name and booking button.',
    fields: [],
  },
  {
    type: 'headerMenu',
    category: 'header',
    label: 'Header with menu',
    description: 'Business name, booking button, and links to sections.',
    fields: [{name: 'links', kind: 'array', required: true, description: '0–8 links with label and section id'}],
  },
  {
    type: 'hero',
    category: 'page',
    label: 'Hero',
    description: 'Opening band with title, optional body, CTAs, and media.',
    fields: [
      {name: 'layout', kind: 'enum', required: true, values: ['split', 'center', 'statement', 'band', 'quote']},
      {name: 'tone', kind: 'enum', required: true, values: ['theme', 'light']},
      {name: 'eyebrow', kind: 'string', required: false},
      {name: 'title', kind: 'string', required: true},
      {name: 'body', kind: 'string', required: false},
      {name: 'primaryCta', kind: 'object', required: false, description: 'label and target (booking or section id)'},
      {name: 'secondaryCta', kind: 'object', required: false},
      {name: 'media', kind: 'object', required: false},
      {name: 'quote', kind: 'string', required: false, description: 'Required when layout is quote'},
      {name: 'attribution', kind: 'string', required: false, description: 'Required when layout is quote'},
    ],
  },
  {
    type: 'highlights',
    category: 'page',
    label: 'Highlights',
    description: 'Short title and body cards.',
    fields: [{name: 'items', kind: 'array', required: true, description: '1–12 items with title and body'}],
  },
  {
    type: 'services',
    category: 'page',
    label: 'Services',
    description: 'Treatment list as rows, cards, or grouped menus.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'presentation', kind: 'enum', required: true, values: ['rows', 'cards', 'grouped']},
      {name: 'items', kind: 'array', required: false, description: 'Required for rows and cards'},
      {name: 'groups', kind: 'array', required: false, description: 'Required for grouped'},
    ],
  },
  {
    type: 'about',
    category: 'page',
    label: 'About',
    description: 'Studio story with optional media.',
    fields: [
      {name: 'eyebrow', kind: 'string', required: true},
      {name: 'title', kind: 'string', required: true},
      {name: 'body', kind: 'string', required: true},
      {name: 'media', kind: 'object', required: false},
    ],
  },
  {
    type: 'gallery',
    category: 'page',
    label: 'Gallery',
    description: 'Work photos or placeholders.',
    fields: [
      {name: 'title', kind: 'string', required: false},
      {name: 'items', kind: 'array', required: true, description: '1–24 media items'},
    ],
  },
  {
    type: 'reviews',
    category: 'page',
    label: 'Reviews',
    description: 'Quotes with stars.',
    fields: [
      {name: 'title', kind: 'string', required: false},
      {name: 'items', kind: 'array', required: true, description: '1–12 items with quote, attribution, stars 1–5'},
    ],
  },
  {
    type: 'bookingCta',
    category: 'page',
    label: 'Booking CTA',
    description: 'Call to book using the site booking link.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'body', kind: 'string', required: false},
    ],
  },
  {
    type: 'hoursLocation',
    category: 'page',
    label: 'Hours and location',
    description: 'Address, opening hours, and optional map link.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'address', kind: 'object', required: true, description: 'street-and-area or full'},
      {name: 'hours', kind: 'array', required: true},
      {name: 'note', kind: 'string', required: false},
      {name: 'mapsUrl', kind: 'string', required: false},
      {name: 'showMapPlaceholder', kind: 'boolean', required: true},
    ],
  },
  {
    type: 'contact',
    category: 'page',
    label: 'Contact',
    description: 'Phone, WhatsApp, or Instagram channels.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'intro', kind: 'string', required: false},
      {name: 'channels', kind: 'array', required: true},
    ],
  },
  {
    type: 'contactForm',
    category: 'page',
    label: 'Contact form',
    description: 'Enquiry form when messages_enabled is true.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'intro', kind: 'string', required: false},
      {name: 'submitLabel', kind: 'string', required: true},
    ],
  },
  {
    type: 'faq',
    category: 'page',
    label: 'FAQ',
    description: 'Questions and answers.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'items', kind: 'array', required: true},
    ],
  },
  {
    type: 'team',
    category: 'page',
    label: 'Team',
    description: 'People with roles and media.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'members', kind: 'array', required: true},
    ],
  },
  {
    type: 'splitCta',
    category: 'page',
    label: 'Split CTA',
    description: 'Exactly two linked cards.',
    fields: [{name: 'items', kind: 'array', required: true, description: 'Exactly two items'}],
  },
  {
    type: 'footerSimple',
    category: 'footer',
    label: 'Simple footer',
    description: 'A line of footer text.',
    fields: [{name: 'text', kind: 'string', required: true}],
  },
  {
    type: 'footerMenu',
    category: 'footer',
    label: 'Footer with menu',
    description: 'Footer text plus links to sections.',
    fields: [
      {name: 'text', kind: 'string', required: true},
      {name: 'links', kind: 'array', required: true, description: '0–8 links with label and section id'},
    ],
  },
];

export interface SiteComponentsList {
  readonly schemaVersion: 1;
  readonly categories: readonly SiteComponentCategory[];
  readonly components: readonly SiteComponentEntry[];
}

export function siteComponentsList(): SiteComponentsList {
  return {
    schemaVersion: 1,
    categories: SITE_COMPONENT_CATEGORIES,
    components: SITE_COMPONENT_CATALOG,
  };
}

export function nextSiteRevisionNumber(latestVersion: number | undefined): number {
  if (latestVersion === undefined || latestVersion < 1) {
    return 1;
  }
  return latestVersion + 1;
}

export function isSiteAdminHost(host: string, rootDomain: string): boolean {
  const normalised = host.trim().toLowerCase().replace(/\.$/, '');
  const withoutPort = normalised.replace(/:\d+$/, '');
  const root = rootDomain.trim().toLowerCase();
  return withoutPort === `admin.${root}` || withoutPort === `admindev.${root}` || withoutPort === 'admin.localhost';
}
