import removeSoImageMarkdownForObjectPath from './removeSoImageMarkdownForObjectPath';

describe('removeSoImageMarkdownForObjectPath', () => {
  it('removes matching soimg markdown', () => {
    const path = 'pod/book/outline/e1/img-1.png';
    const body = `Hello\n\n![](soimg:${encodeURIComponent(path)})\n\nWorld`;
    expect(removeSoImageMarkdownForObjectPath(body, path)).toBe('Hello\n\nWorld');
  });
});
