import {SITE_PRESET_IDS} from './sitePresetId';
import type {SiteSection} from './siteSectionSchema';

export type SiteSectionType = SiteSection['type'];

export interface SiteComponentField {
  readonly name: string;
  readonly kind: 'string' | 'boolean' | 'number' | 'object' | 'array' | 'enum';
  readonly required: boolean;
  readonly values?: readonly string[];
  readonly description?: string;
}

export interface SiteComponentEntry {
  readonly type: SiteSectionType;
  readonly label: string;
  readonly description: string;
  readonly fields: readonly SiteComponentField[];
}

export const SITE_SECTION_TYPES = [
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
] as const satisfies readonly SiteSectionType[];

export const SITE_COMPONENT_CATALOG: readonly SiteComponentEntry[] = [
  {
    type: 'hero',
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
    label: 'Highlights',
    description: 'Short title and body cards.',
    fields: [{name: 'items', kind: 'array', required: true, description: '1–12 items with title and body'}],
  },
  {
    type: 'services',
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
    label: 'Gallery',
    description: 'Work photos or placeholders.',
    fields: [
      {name: 'title', kind: 'string', required: false},
      {name: 'items', kind: 'array', required: true, description: '1–24 media items'},
    ],
  },
  {
    type: 'reviews',
    label: 'Reviews',
    description: 'Quotes with stars.',
    fields: [
      {name: 'title', kind: 'string', required: false},
      {name: 'items', kind: 'array', required: true, description: '1–12 items with quote, attribution, stars 1–5'},
    ],
  },
  {
    type: 'bookingCta',
    label: 'Booking CTA',
    description: 'Call to book using the site booking link.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'body', kind: 'string', required: false},
    ],
  },
  {
    type: 'hoursLocation',
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
    label: 'FAQ',
    description: 'Questions and answers.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'items', kind: 'array', required: true},
    ],
  },
  {
    type: 'team',
    label: 'Team',
    description: 'People with roles and media.',
    fields: [
      {name: 'title', kind: 'string', required: true},
      {name: 'members', kind: 'array', required: true},
    ],
  },
  {
    type: 'splitCta',
    label: 'Split CTA',
    description: 'Exactly two linked cards.',
    fields: [{name: 'items', kind: 'array', required: true, description: 'Exactly two items'}],
  },
];

export interface SiteComponentsList {
  readonly schemaVersion: 1;
  readonly presets: readonly string[];
  readonly components: readonly SiteComponentEntry[];
}

export function siteComponentsList(): SiteComponentsList {
  return {
    schemaVersion: 1,
    presets: SITE_PRESET_IDS,
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
  return withoutPort === `admin.${root}` || withoutPort === 'admin.localhost';
}
