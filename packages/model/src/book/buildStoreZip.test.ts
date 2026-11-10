import buildStoreZip from './buildStoreZip';

describe('buildStoreZip', () => {
  it('builds a zip with mimetype first', () => {
    const zip = buildStoreZip([
      {path: 'mimetype', data: new TextEncoder().encode('application/epub+zip')},
      {path: 'hello.txt', data: new TextEncoder().encode('hi')},
    ]);
    expect(zip.length).toBeGreaterThan(50);
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
  });
});
