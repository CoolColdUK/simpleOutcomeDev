import {
  encodeSoImageMarkdownUri,
  decodeSoImageMarkdownUri,
  countSoImageMarkdownUrisInBody,
  extractSoImageObjectPathsFromBody,
  replaceSoImageMarkdownSrc,
} from './soImageMarkdownUri';

describe('soImageMarkdownUri', () => {
  it('round-trips a path', () => {
    const uri = encodeSoImageMarkdownUri('pod/card/img.png');
    expect(decodeSoImageMarkdownUri(uri)).toBe('pod/card/img.png');
  });

  it('returns undefined for other urls', () => {
    expect(decodeSoImageMarkdownUri('https://example.com/a.png')).toBeUndefined();
  });

  it('replaces encoded and raw soimg destinations', () => {
    const path = 'pod/card/img.png';
    const href = 'https://cdn.example/img.png?token=a';
    const encoded = `before ![x](${encodeSoImageMarkdownUri(path)}) after`;
    expect(replaceSoImageMarkdownSrc(encoded, path, href)).toBe(`before ![x](<${href}>) after`);
    const raw = `![x](soimg:${path})`;
    expect(replaceSoImageMarkdownSrc(raw, path, href)).toBe(`![x](<${href}>)`);
  });

  it('counts and extracts from markdown', () => {
    const body = 'x ![a](soimg:pod%2Fc.png) y ![b](soimg:pod%2Fc.png)';
    expect(countSoImageMarkdownUrisInBody(body)).toBe(2);
    expect(extractSoImageObjectPathsFromBody(body)).toEqual(['pod/c.png']);
  });
});
