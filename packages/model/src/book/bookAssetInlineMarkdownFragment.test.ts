import bookAssetInlineMarkdownFragment from './bookAssetInlineMarkdownFragment';

describe('bookAssetInlineMarkdownFragment', () => {
  it('wraps storage path in soimg markdown', () => {
    const fragment = bookAssetInlineMarkdownFragment('pod/book/assets/a/img-1.png');
    expect(fragment).toContain('soimg:');
    expect(fragment).toContain('pod%2Fbook%2Fassets%2Fa%2Fimg-1.png');
    expect(fragment.startsWith('![](')).toBe(true);
  });
});
