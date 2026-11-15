import type {SiteDocument} from './siteDocumentSchema';
import {cleanStudioTheme} from './siteThemes';

export function blankSiteDocument(businessName: string): SiteDocument {
  return {
    schemaVersion: 2,
    businessName,
    theme: cleanStudioTheme,
    booking: {label: 'Book', href: 'https://example.com', provider: 'url'},
    sections: [],
  };
}
