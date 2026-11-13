import {SITE_PRESETS} from './sitePresets';
import {parseSiteDocument} from './parseSiteDocument';
import {
  isSiteAdminHost,
  nextSiteRevisionNumber,
  SITE_COMPONENT_CATALOG,
  SITE_SECTION_TYPES,
  siteComponentsList,
} from './siteComponentCatalog';
import type {SiteSection} from './siteSectionSchema';

describe('siteComponentCatalog', () => {
  it('lists every section type from the schema', () => {
    const types = SITE_COMPONENT_CATALOG.map((entry) => entry.type);
    expect(types).toEqual([...SITE_SECTION_TYPES]);
  });

  it('matches every section type used in presets', () => {
    const catalogTypes = new Set(SITE_COMPONENT_CATALOG.map((entry) => entry.type));
    Object.values(SITE_PRESETS).forEach((preset) => {
      const document = parseSiteDocument(preset);
      document.sections.forEach((section: SiteSection) => {
        expect(catalogTypes.has(section.type)).toBe(true);
      });
    });
  });

  it('rejects an invalid document', () => {
    expect(() => parseSiteDocument({schemaVersion: 1})).toThrow();
  });

  it('returns the next revision number', () => {
    expect(nextSiteRevisionNumber(undefined)).toBe(1);
    expect(nextSiteRevisionNumber(0)).toBe(1);
    expect(nextSiteRevisionNumber(3)).toBe(4);
  });

  it('detects the admin host', () => {
    expect(isSiteAdminHost('admin.simpleoutcome.dev', 'simpleoutcome.dev')).toBe(true);
    expect(isSiteAdminHost('admin.localhost:3001', 'simpleoutcome.dev')).toBe(true);
    expect(isSiteAdminHost('newbeauty.simpleoutcome.dev', 'simpleoutcome.dev')).toBe(false);
  });

  it('lists components for MCP', () => {
    const list = siteComponentsList();
    expect(list.schemaVersion).toBe(1);
    expect(list.presets.length).toBeGreaterThan(0);
    expect(list.components.length).toBe(SITE_SECTION_TYPES.length);
  });
});
