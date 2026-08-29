import {
  encodeSoImageMarkdownUri,
  decodeSoImageMarkdownUri,
  countSoImageMarkdownUrisInBody,
  extractSoImageObjectPathsFromBody,
} from './soImageMarkdownUri';

describe('soImageMarkdownUri', () => {
  it('round-trips a path', () => {
    const uri = encodeSoImageMarkdownUri('pod/card/img.png');
    expect(decodeSoImageMarkdownUri(uri)).toBe('pod/card/img.png');
  });

  it('returns undefined for other urls', () => {
    expect(decodeSoImageMarkdownUri('https://example.com/a.png')).toBeUndefined();
  });

  it('counts and extracts from markdown', () => {
    const body = 'x ![a](soimg:pod%2Fc.png) y ![b](soimg:pod%2Fc.png)';
    expect(countSoImageMarkdownUrisInBody(body)).toBe(2);
    expect(extractSoImageObjectPathsFromBody(body)).toEqual(['pod/c.png']);
  });
});
