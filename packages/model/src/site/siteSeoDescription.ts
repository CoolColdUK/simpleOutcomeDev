import type {SiteDocument} from './siteDocumentSchema';
import type {SiteSection} from './siteSectionSchema';

const DESCRIPTION_MAX = 160;
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function isUkPostcode(line: string): boolean {
  return UK_POSTCODE.test(line.trim());
}

function serviceItems(section: Extract<SiteSection, {type: 'services'}>): readonly {readonly name: string; readonly price: string}[] {
  if (section.props.presentation === 'grouped') {
    return section.props.groups.flatMap((group) => group.items);
  }
  return section.props.items;
}

function serviceNames(document: SiteDocument): readonly string[] {
  const section = document.sections.find((item) => item.type === 'services');
  if (section?.type !== 'services') {
    return [];
  }
  return serviceItems(section)
    .filter((item) => item.price !== 'Not published')
    .slice(0, 3)
    .map((item) => item.name);
}

function areaOf(document: SiteDocument): string | undefined {
  const section = document.sections.find((item) => item.type === 'hoursLocation');
  if (section?.type !== 'hoursLocation') {
    return undefined;
  }
  if (section.props.address.kind === 'street-and-area') {
    return section.props.address.area;
  }
  const lines = section.props.address.lines.filter((line) => !isUkPostcode(line));
  return lines[lines.length - 1];
}

function firstSentence(body: string): string {
  const match = /^[\s\S]*?[.!?](?:\s|$)/.exec(body.trim());
  return (match?.[0] ?? body).trim();
}

function limitDescription(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= DESCRIPTION_MAX) {
    return trimmed;
  }
  const cut = trimmed.slice(0, DESCRIPTION_MAX);
  const space = cut.lastIndexOf(' ');
  const shortened = space > 80 ? cut.slice(0, space) : cut;
  return shortened.trim();
}

export function siteSeoTitle(document: SiteDocument): string {
  return document.seo?.title ?? document.businessName;
}

export function siteSeoLocale(document: SiteDocument): 'en-GB' {
  return document.seo?.locale ?? 'en-GB';
}

export function siteSeoDescription(document: SiteDocument): string {
  const custom = document.seo?.description;
  if (custom !== undefined && custom.length > 0) {
    return custom;
  }
  const names = serviceNames(document);
  if (names.length > 0) {
    const area = areaOf(document);
    const place = area === undefined ? document.businessName : `${document.businessName} in ${area}`;
    return limitDescription(`${place}. ${names.join(', ')}.`);
  }
  const about = document.sections.find((section) => section.type === 'about');
  if (about?.type === 'about') {
    return limitDescription(firstSentence(about.props.body));
  }
  return document.businessName;
}
