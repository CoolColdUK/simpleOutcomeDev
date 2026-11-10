import bookAssetDescriptionSnippet from './bookAssetDescriptionSnippet';

describe('bookAssetDescriptionSnippet', () => {
  it('strips markdown and truncates', () => {
    const snippet = bookAssetDescriptionSnippet('# Hero\n\n**Bold** line with ![x](soimg:a) rest ' + 'x'.repeat(200));
    expect(snippet).not.toContain('**');
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet.length).toBeLessThanOrEqual(141);
  });
});
