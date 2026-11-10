import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {findSiteDemo, SITE_DEMOS} from './siteDemos';
import {parseSiteDocument} from './parseSiteDocument';
import {safeParseSiteDocument} from './safeParseSiteDocument';
import {SITE_PRESETS} from './sitePresets';
import {SITE_PRESET_IDS} from './sitePresetId';

const DEMO_SECTION_TYPES = ['hero', 'about', 'services', 'gallery', 'reviews', 'bookingCta', 'hoursLocation', 'contact'];

describe('parseSiteDocument', () => {
  it('accepts every preset', () => {
    SITE_PRESET_IDS.forEach((id) => {
      expect(parseSiteDocument(SITE_PRESETS[id]).businessName.length).toBeGreaterThan(0);
    });
  });

  it('keeps the home studio preset to the short mock', () => {
    expect(SITE_PRESETS['home-studio'].sections.map((section) => section.type)).toEqual(['hero', 'highlights', 'services']);
  });

  it('accepts the three prospect demos in the full section order', () => {
    expect(SITE_DEMOS.map((demo) => demo.slug)).toEqual(['newbeauty', 'soniasnails', 'lkbaesthetics']);
    SITE_DEMOS.forEach((demo) => {
      expect(demo.preset).toBe('home-studio');
      expect(demo.status).toBe('demo');
      expect(parseSiteDocument(demo.document).sections.map((section) => section.type)).toEqual(DEMO_SECTION_TYPES);
    });
  });

  it('hides house numbers for the home studios and keeps Sonia’s shop address', () => {
    const newBeauty = findSiteDemo('newbeauty')?.document.sections.find((section) => section.type === 'hoursLocation');
    const lkb = findSiteDemo('lkbaesthetics')?.document.sections.find((section) => section.type === 'hoursLocation');
    const sonia = findSiteDemo('soniasnails')?.document.sections.find((section) => section.type === 'hoursLocation');
    expect(newBeauty?.type === 'hoursLocation' && newBeauty.props.address).toEqual({
      kind: 'street-and-area',
      street: 'Bursledon Road',
      area: 'Hightown, Southampton',
    });
    expect(lkb?.type === 'hoursLocation' && lkb.props.address).toEqual({
      kind: 'street-and-area',
      street: 'Little Lances Hill',
      area: 'Bitterne Village, Southampton',
    });
    expect(sonia?.type === 'hoursLocation' && sonia.props.address).toEqual({
      kind: 'full',
      lines: ['25 Ruby Road', 'Southampton', 'SO19 7NB'],
    });
  });

  it('rejects an unknown section type', () => {
    const document = structuredClone(SITE_PRESETS['clean-studio']) as {sections: {type: string}[]};
    const first = document.sections[0];
    if (!first) {
      throw new Error('missing section');
    }
    first.type = 'carousel';
    expect(safeParseSiteDocument(document)).toBeUndefined();
    expect(() => parseSiteDocument(document)).toThrow();
  });

  it('rejects a duplicate section id and a nav link that does not match', () => {
    const duplicate = structuredClone(SITE_PRESETS['soft-luxury']);
    const first = duplicate.sections[0];
    const second = duplicate.sections[1];
    if (!first || !second) {
      throw new Error('missing section');
    }
    second.id = first.id;
    expect(safeParseSiteDocument(duplicate)).toBeUndefined();
    const brokenNav = structuredClone(SITE_PRESETS['clean-studio']);
    const link = brokenNav.nav.links[0];
    if (!link) {
      throw new Error('missing nav link');
    }
    link.sectionId = 'missing';
    expect(() => parseSiteDocument(brokenNav)).toThrow(/does not match a section/);
  });

  it('rejects a quote hero without a quote and a contact link of the wrong kind', () => {
    const quote = structuredClone(SITE_PRESETS['review-led']);
    const hero = quote.sections[0];
    if (hero?.type !== 'hero') {
      throw new Error('expected a hero');
    }
    delete hero.props.quote;
    expect(() => parseSiteDocument(quote)).toThrow(/quote/i);
    const contact = structuredClone(findSiteDemo('soniasnails')?.document);
    const contactSection = contact?.sections.find((section) => section.type === 'contact');
    if (contactSection?.type !== 'contact') {
      throw new Error('expected contact');
    }
    const channel = contactSection.props.channels[0];
    if (!channel) {
      throw new Error('expected a phone');
    }
    channel.href = 'https://example.com';
    expect(safeParseSiteDocument(contact)).toBeUndefined();
  });

  it('rejects unknown keys and a house number on a home address', () => {
    const extra = {...SITE_PRESETS['clean-studio'], secret: 'no'};
    expect(safeParseSiteDocument(extra)).toBeUndefined();
    const numbered = structuredClone(findSiteDemo('newbeauty')?.document);
    const hours = numbered?.sections.find((section) => section.type === 'hoursLocation');
    if (hours?.type !== 'hoursLocation' || hours.props.address.kind !== 'street-and-area') {
      throw new Error('expected a street address');
    }
    hours.props.address.street = '15 Bursledon Road';
    expect(safeParseSiteDocument(numbered)).toBeUndefined();
  });

  it('names the three demo slugs in the site migration', () => {
    const migrationsDir = join(__dirname, '../../../../supabase/migrations');
    const siteMigration = readdirSync(migrationsDir).find((name) => name.endsWith('_site.sql'));
    expect(siteMigration).toBeDefined();
    const sql = readFileSync(join(migrationsDir, siteMigration ?? ''), 'utf8');
    expect(sql).toContain('newbeauty');
    expect(sql).toContain('soniasnails');
    expect(sql).toContain('lkbaesthetics');
    expect(sql).toContain('site_select_public');
  });
});
