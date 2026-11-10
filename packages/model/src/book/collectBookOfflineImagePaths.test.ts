import collectBookOfflineImagePaths from './collectBookOfflineImagePaths';

describe('collectBookOfflineImagePaths', () => {
  it('collects cover, inline soimg paths, and asset gallery paths uniquely', () => {
    const paths = collectBookOfflineImagePaths({
      coverStoragePath: 'pod/book/cover.jpg',
      markdownBodies: ['![](soimg:pod%2Fch%2Fa.png)', 'text', '![](soimg:pod%2Fch%2Fa.png) ![](soimg:pod%2Fch%2Fb.png)'],
      assetGalleryStoragePaths: ['pod/book/assets/x/1.png', 'pod/ch/a.png'],
    });
    expect(paths.sort()).toEqual(
      ['pod/book/assets/x/1.png', 'pod/book/cover.jpg', 'pod/ch/a.png', 'pod/ch/b.png'].sort(),
    );
  });
});
