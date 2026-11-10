import {bookMarkdownForDisplay, bookMarkdownForEpub} from './bookPageBreak';

describe('bookPageBreak', () => {
  it('replaces markers for display and epub', () => {
    const md = 'Intro\n<!-- pagebreak -->\nRest\n\\pagebreak\nEnd';
    expect(bookMarkdownForDisplay(md)).toContain('---');
    expect(bookMarkdownForEpub(md)).toContain('page-break-before');
  });
});
