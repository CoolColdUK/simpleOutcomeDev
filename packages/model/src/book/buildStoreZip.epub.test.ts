import buildStoreZip from './buildStoreZip';
import buildBookPlaceholderCoverPng from './buildBookPlaceholderCoverPng';

describe('buildStoreZip epub-sized payload', () => {
  it('accepts strings, buffers, and PNG cover bytes', async () => {
    const cover = await buildBookPlaceholderCoverPng(32, 48);
    const zip = buildStoreZip([
      {path: 'mimetype', data: 'application/epub+zip'},
      {path: 'META-INF/container.xml', data: new TextEncoder().encode('<?xml version="1.0"?><container/>')},
      {path: 'OEBPS/cover.png', data: cover},
      {
        path: 'OEBPS/chapter-1.xhtml',
        data: '<html><body><h1>Ch 1</h1><img src="images/inline.png"/></body></html>',
      },
      {path: 'OEBPS/note-1.xhtml', data: new Uint8Array([60, 104, 116, 109, 108, 62])},
      {path: 'OEBPS/images/inline.png', data: new Uint8Array([137, 80, 78, 71])},
    ]);
    expect(zip.length).toBeGreaterThan(cover.length);
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
  });
});
