import * as v from 'valibot';
import {siteDocumentSchema, type SiteDocument} from './siteDocumentSchema';
import type {SiteSection} from './siteSectionSchema';

function channelHrefOk(section: Extract<SiteSection, {type: 'contact'}>, index: number): boolean {
  const channel = section.props.channels[index];
  if (!channel) {
    return false;
  }
  if (channel.kind === 'phone') {
    return channel.href.startsWith('tel:+');
  }
  return channel.href.startsWith('https://') || channel.href.startsWith('http://');
}

function assertHero(section: Extract<SiteSection, {type: 'hero'}>, ids: ReadonlySet<string>): void {
  [section.props.primaryCta, section.props.secondaryCta]
    .filter((cta) => cta !== undefined)
    .forEach((cta) => {
      if (cta.target !== 'booking' && !ids.has(cta.target)) {
        throw new Error(`Hero button does not match a section: ${cta.target}`);
      }
    });
  if (section.props.layout === 'quote' && (section.props.quote === undefined || section.props.attribution === undefined)) {
    throw new Error('Quote hero needs a quote and attribution');
  }
}

function assertMenuLinks(
  links: readonly {readonly sectionId: string}[],
  idSet: ReadonlySet<string>,
  label: string,
): void {
  links.forEach((link) => {
    if (!idSet.has(link.sectionId)) {
      throw new Error(`${label} link does not match a section: ${link.sectionId}`);
    }
  });
}

export function assertSiteDocument(document: SiteDocument): void {
  const ids = document.sections.map((section) => section.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('Section ids must be unique');
  }
  const idSet = new Set(ids);
  document.sections.forEach((section) => {
    if (section.type === 'headerMenu') {
      assertMenuLinks(section.props.links, idSet, 'Header');
    }
    if (section.type === 'footerMenu') {
      assertMenuLinks(section.props.links, idSet, 'Footer');
    }
    if (section.type === 'hero') {
      assertHero(section, idSet);
    }
    if (section.type === 'contact') {
      if (section.props.intro === undefined && section.props.channels.length === 0) {
        throw new Error('Contact needs an intro or a channel');
      }
      section.props.channels.forEach((_, index) => {
        if (!channelHrefOk(section, index)) {
          throw new Error('Contact link does not match its kind');
        }
      });
    }
  });
}

export function parseSiteDocument(input: unknown): SiteDocument {
  const document = v.parse(siteDocumentSchema, input);
  assertSiteDocument(document);
  return document;
}
