import {parseSiteAssetDescription, parseSiteAssetName, parseSiteAssetVisibility, siteAssetContentType, siteAssetPath} from './siteAssetName';

describe('site asset names', () => {
  it('keeps a lowercase seo file name', () => {
    expect(parseSiteAssetName('Gel Nails.jpg')).toBe('gel-nails.jpg');
    expect(siteAssetPath('gel-nails.jpg')).toBe('/assets/gel-nails.jpg');
    expect(siteAssetContentType('notes.md')).toBe('text/markdown');
  });

  it('rejects names without a known extension', () => {
    expect(() => parseSiteAssetName('logo')).toThrow(/extension/);
    expect(() => parseSiteAssetName('logo.exe')).toThrow(/jpg/);
  });

  it('keeps a short description and a private or public mark', () => {
    expect(parseSiteAssetDescription('  Signed  treatment contract  ')).toBe('Signed treatment contract');
    expect(parseSiteAssetVisibility('Public')).toBe('public');
    expect(() => parseSiteAssetDescription('   ')).toThrow(/500/);
    expect(() => parseSiteAssetVisibility('shared')).toThrow(/private or public/);
  });
});
