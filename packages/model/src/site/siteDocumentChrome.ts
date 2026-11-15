import type {SiteDocument} from './siteDocumentSchema';
import type {SiteSection} from './siteSectionSchema';

export interface SiteDocumentChromeSource {
  readonly businessName: SiteDocument['businessName'];
  readonly theme: SiteDocument['theme'];
  readonly booking: SiteDocument['booking'];
  readonly nav: {readonly links: readonly {readonly label: string; readonly sectionId: string}[]};
  readonly sections: readonly SiteSection[];
  readonly footer: {readonly text: string};
  readonly seo?: SiteDocument['seo'];
}

export function siteDocumentWithChrome(source: SiteDocumentChromeSource): SiteDocument {
  return {
    schemaVersion: 2,
    businessName: source.businessName,
    theme: source.theme,
    booking: source.booking,
    ...(source.seo === undefined ? {} : {seo: source.seo}),
    sections: [
      {id: 'site-header', type: 'headerMenu', props: {links: [...source.nav.links]}},
      ...source.sections,
      {id: 'site-footer', type: 'footerSimple', props: {text: source.footer.text}},
    ],
  };
}
