import {blankSiteDocument} from './blankSiteDocument';
import {parseSiteDocument} from './parseSiteDocument';

describe('blankSiteDocument', () => {
  it('is an empty page with no header or footer', () => {
    const document = parseSiteDocument(blankSiteDocument('New studio'));
    expect(document.schemaVersion).toBe(2);
    expect(document.sections).toEqual([]);
    expect(document.businessName).toBe('New studio');
  });
});