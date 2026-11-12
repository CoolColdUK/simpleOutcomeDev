import {findSiteDemo} from './siteDemos';
import {parseSiteDocument} from './parseSiteDocument';
import {safeParseSiteDocument} from './safeParseSiteDocument';
import {SITE_PRESETS} from './sitePresets';
import {siteBeautySalonJsonLd} from './siteBeautySalonJsonLd';
import {siteSeoDescription, siteSeoLocale, siteSeoTitle} from './siteSeoDescription';

describe('site seo', () => {
  it('parses a document with no seo block', () => {
    const document = parseSiteDocument(SITE_PRESETS['home-studio']);
    expect(document.seo).toBeUndefined();
    expect(siteSeoLocale(document)).toBe('en-GB');
  });

  it('describes the home studio from its name and services, not the footer', () => {
    const document = parseSiteDocument(SITE_PRESETS['home-studio']);
    const description = siteSeoDescription(document);
    expect(description).toBe('The Garden Room Beauty. Gel manicure, BIAB overlay, Lash lift & tint.');
    expect(description.toLowerCase().includes('sample')).toBe(false);
    expect(description).not.toBe(document.footer.text);
    expect(siteSeoTitle(document)).toBe('The Garden Room Beauty');
  });

  it('uses an empty description as missing and rejects a non-https image or profile url', () => {
    const home = structuredClone(SITE_PRESETS['home-studio']);
    const empty = parseSiteDocument({...home, seo: {description: '   ', title: '', ogImageUrl: '', googleBusinessProfileUrl: ''}});
    expect(empty.seo?.description).toBeUndefined();
    expect(siteSeoDescription(empty)).toBe('The Garden Room Beauty. Gel manicure, BIAB overlay, Lash lift & tint.');
    expect(safeParseSiteDocument({...home, seo: {ogImageUrl: 'http://cdn.example/photo.jpg'}})).toBeUndefined();
    expect(safeParseSiteDocument({...home, seo: {googleBusinessProfileUrl: 'http://maps.google.com/salon'}})).toBeUndefined();
  });

  it('keeps a street and a house number out of a home address', () => {
    const document = findSiteDemo('newbeauty')?.document;
    if (document === undefined) {
      throw new Error('expected a demo');
    }
    const parsed = parseSiteDocument(document);
    const jsonLd = siteBeautySalonJsonLd(parsed, 'https://newbeauty.example/');
    expect(jsonLd.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Hightown, Southampton',
      addressCountry: 'GB',
    });
    expect(JSON.stringify(jsonLd.address).includes('Bursledon')).toBe(false);
    expect(jsonLd.priceRange).toBe('£5–£33');
    expect(jsonLd.description.toLowerCase().includes('sample')).toBe(false);
    expect(jsonLd.openingHoursSpecification?.map((row) => row.dayOfWeek)).toEqual(['Monday', 'Wednesday', 'Thursday', 'Friday']);
  });

  it('includes the published street line for a shop address', () => {
    const document = findSiteDemo('soniasnails')?.document;
    if (document === undefined) {
      throw new Error('expected a demo');
    }
    const jsonLd = siteBeautySalonJsonLd(parseSiteDocument(document), 'https://soniasnails.example/');
    expect(jsonLd.address?.streetAddress).toBe('25 Ruby Road');
    expect(jsonLd.address?.addressLocality).toBe('Southampton');
    expect(jsonLd.priceRange).toBeUndefined();
    expect(jsonLd.telephone).toBe('tel:+447889504517');
    const lkb = findSiteDemo('lkbaesthetics')?.document;
    if (lkb === undefined) {
      throw new Error('expected a demo');
    }
    expect(siteBeautySalonJsonLd(parseSiteDocument(lkb), 'https://lkb.example/').priceRange).toBeUndefined();
  });

  it('adds a Google Business Profile to sameAs and leaves it out when empty', () => {
    const home = structuredClone(SITE_PRESETS['home-studio']);
    const without = siteBeautySalonJsonLd(parseSiteDocument(home), 'https://garden.example/');
    expect(without.sameAs).toEqual(['https://www.fresha.com/']);
    const withProfile = parseSiteDocument({
      ...home,
      seo: {googleBusinessProfileUrl: 'https://maps.google.com/?cid=1'},
    });
    expect(siteBeautySalonJsonLd(withProfile, 'https://garden.example/').sameAs).toEqual([
      'https://www.fresha.com/',
      'https://maps.google.com/?cid=1',
    ]);
  });
});
