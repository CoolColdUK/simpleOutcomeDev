/** Line-only page break markers supported in book markdown. */
export const BOOK_PAGE_BREAK_LINE_PATTERN = /^\s*(?:<!--\s*pagebreak\s*-->|\\pagebreak)\s*$/gim;

export function isBookPageBreakLine(line: string): boolean {
  return /^\s*(?:<!--\s*pagebreak\s*-->|\\pagebreak)\s*$/i.test(line);
}

export function bookMarkdownForDisplay(markdown: string): string {
  return markdown.replace(BOOK_PAGE_BREAK_LINE_PATTERN, '\n\n---\n\n');
}

export function bookMarkdownForEpub(markdown: string): string {
  return markdown.replace(
    BOOK_PAGE_BREAK_LINE_PATTERN,
    '\n\n<div epub:type="pagebreak" style="page-break-before: always;"></div>\n\n',
  );
}
