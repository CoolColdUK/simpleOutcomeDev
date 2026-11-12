import type {SiteDocument} from './siteDocumentSchema';
import {siteSeoDescription} from './siteSeoDescription';
import type {SiteSection} from './siteSectionSchema';

const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const SHORT_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

interface PostalAddress {
  readonly '@type': 'PostalAddress';
  readonly streetAddress?: string;
  readonly addressLocality?: string;
  readonly postalCode?: string;
  readonly addressCountry: 'GB';
}

interface OpeningHoursSpecification {
  readonly '@type': 'OpeningHoursSpecification';
  readonly dayOfWeek: string | readonly string[];
  readonly opens: string;
  readonly closes: string;
}

function dayIndex(token: string): number | undefined {
  const key = token.trim().toLowerCase();
  const full = FULL_DAYS.findIndex((day) => day.toLowerCase() === key);
  if (full !== -1) {
    return full;
  }
  const short = SHORT_DAYS.findIndex((day) => day === key);
  return short === -1 ? undefined : short;
}

function daysFromLabel(label: string): readonly string[] | undefined {
  const parts = label
    .split(/[–-]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const start = dayIndex(parts[0] ?? '');
  if (start === undefined) {
    return undefined;
  }
  if (parts.length === 1) {
    return [FULL_DAYS[start] ?? 'Monday'];
  }
  if (parts.length !== 2) {
    return undefined;
  }
  const end = dayIndex(parts[1] ?? '');
  if (end === undefined || end < start) {
    return undefined;
  }
  return FULL_DAYS.slice(start, end + 1);
}

function clock(value: string): string | undefined {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match?.[1] || !match[2]) {
    return undefined;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return undefined;
  }
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

function oneSpan(hours: string): {readonly opens: string; readonly closes: string} | undefined {
  const parts = hours.split(/[–-]/);
  if (parts.length !== 2) {
    return undefined;
  }
  const opens = clock(parts[0] ?? '');
  const closes = clock(parts[1] ?? '');
  if (opens === undefined || closes === undefined) {
    return undefined;
  }
  return {opens, closes};
}

function openingHours(document: SiteDocument): readonly OpeningHoursSpecification[] {
  const section = document.sections.find((item) => item.type === 'hoursLocation');
  if (section?.type !== 'hoursLocation') {
    return [];
  }
  return section.props.hours.flatMap((row) => {
    const days = daysFromLabel(row.days);
    const span = oneSpan(row.hours);
    if (days === undefined || span === undefined) {
      return [];
    }
    return [
      {
        '@type': 'OpeningHoursSpecification' as const,
        dayOfWeek: days.length === 1 ? (days[0] ?? 'Monday') : days,
        opens: span.opens,
        closes: span.closes,
      },
    ];
  });
}

function isUkPostcode(line: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(line.trim());
}

function postalAddress(document: SiteDocument): PostalAddress | undefined {
  const section = document.sections.find((item) => item.type === 'hoursLocation');
  if (section?.type !== 'hoursLocation') {
    return undefined;
  }
  if (section.props.address.kind === 'street-and-area') {
    return {
      '@type': 'PostalAddress',
      addressLocality: section.props.address.area,
      addressCountry: 'GB',
    };
  }
  const postcode = section.props.address.lines.find((line) => isUkPostcode(line));
  const rest = section.props.address.lines.filter((line) => !isUkPostcode(line));
  const locality = rest[rest.length - 1];
  const street = rest.slice(0, -1).join(', ');
  return {
    '@type': 'PostalAddress',
    ...(street.length > 0 ? {streetAddress: street} : {}),
    ...(locality === undefined ? {} : {addressLocality: locality}),
    ...(postcode === undefined ? {} : {postalCode: postcode}),
    addressCountry: 'GB',
  };
}

function plainPounds(price: string): number | undefined {
  const match = /^£(\d+)(?:\.(\d{1,2}))?$/.exec(price.trim());
  if (!match?.[1]) {
    return undefined;
  }
  const pounds = Number(match[1]);
  const pence = match[2] === undefined ? 0 : Number(match[2].padEnd(2, '0'));
  return pounds + pence / 100;
}

function formatPounds(amount: number): string {
  const pounds = Math.trunc(amount);
  const pence = Math.round((amount - pounds) * 100);
  if (pence === 0) {
    return `£${pounds}`;
  }
  return `£${pounds}.${String(pence).padStart(2, '0')}`;
}

function servicePrices(section: Extract<SiteSection, {type: 'services'}>): readonly string[] {
  if (section.props.presentation === 'grouped') {
    return section.props.groups.flatMap((group) => group.items.map((item) => item.price));
  }
  return section.props.items.map((item) => item.price);
}

function priceRange(document: SiteDocument): string | undefined {
  const sections = document.sections.filter((section) => section.type === 'services');
  const prices = sections.flatMap((section) => (section.type === 'services' ? servicePrices(section) : []));
  if (prices.length === 0) {
    return undefined;
  }
  const amounts = prices.map((price) => plainPounds(price));
  if (amounts.some((amount) => amount === undefined)) {
    return undefined;
  }
  const numbers = amounts.filter((amount): amount is number => amount !== undefined);
  const lowest = Math.min(...numbers);
  const highest = Math.max(...numbers);
  return `${formatPounds(lowest)}–${formatPounds(highest)}`;
}

function sameAs(document: SiteDocument): readonly string[] {
  const booking = document.booking.href.startsWith('https://') ? [document.booking.href] : [];
  const instagram = document.sections.flatMap((section) => {
    if (section.type !== 'contact') {
      return [];
    }
    return section.props.channels
      .filter((channel) => channel.kind === 'instagram' && channel.href.startsWith('https://'))
      .map((channel) => channel.href);
  });
  const profile = document.seo?.googleBusinessProfileUrl;
  return [...booking, ...instagram, ...(profile === undefined ? [] : [profile])];
}

function telephone(document: SiteDocument): string | undefined {
  const contact = document.sections.find((section) => section.type === 'contact');
  if (contact?.type !== 'contact') {
    return undefined;
  }
  return contact.props.channels.find((channel) => channel.kind === 'phone')?.href;
}

export interface SiteBeautySalonJsonLd {
  readonly '@context': 'https://schema.org';
  readonly '@type': 'BeautySalon';
  readonly name: string;
  readonly url: string;
  readonly description: string;
  readonly image?: string;
  readonly telephone?: string;
  readonly address?: PostalAddress;
  readonly openingHoursSpecification?: readonly OpeningHoursSpecification[];
  readonly priceRange?: string;
  readonly sameAs?: readonly string[];
  readonly geo?: {readonly '@type': 'GeoCoordinates'; readonly latitude: number; readonly longitude: number};
}

export function siteBeautySalonJsonLd(document: SiteDocument, url: string): SiteBeautySalonJsonLd {
  const hours = openingHours(document);
  const links = sameAs(document);
  const address = postalAddress(document);
  const phone = telephone(document);
  const image = document.seo?.ogImageUrl;
  const range = priceRange(document);
  const geo = document.seo?.geo;
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: document.businessName,
    url,
    description: siteSeoDescription(document),
    ...(image === undefined ? {} : {image}),
    ...(phone === undefined ? {} : {telephone: phone}),
    ...(address === undefined ? {} : {address}),
    ...(hours.length === 0 ? {} : {openingHoursSpecification: hours}),
    ...(range === undefined ? {} : {priceRange: range}),
    ...(links.length === 0 ? {} : {sameAs: links}),
    ...(geo === undefined
      ? {}
      : {geo: {'@type': 'GeoCoordinates' as const, latitude: geo.latitude, longitude: geo.longitude}}),
  };
}
