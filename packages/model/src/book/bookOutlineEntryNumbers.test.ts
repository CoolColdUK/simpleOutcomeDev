import {BookOutlineKind} from './bookOutlineKind';
import renumberBookOutline, {bookOutlineListLabel} from './bookOutlineEntryNumbers';

describe('renumberBookOutline', () => {
  it('renumbers chapters and notes independently by sort order', () => {
    const input = [
      {id: '1', kind: BookOutlineKind.CHAPTER, sortOrder: 0},
      {id: '2', kind: BookOutlineKind.NOTE, sortOrder: 1},
      {id: '3', kind: BookOutlineKind.CHAPTER, sortOrder: 2},
    ];
    const result = renumberBookOutline(input);
    expect(result.find((r) => r.id === '1')?.chapterNumber).toBe(1);
    expect(result.find((r) => r.id === '2')?.noteNumber).toBe(1);
    expect(result.find((r) => r.id === '3')?.chapterNumber).toBe(2);
  });
});

describe('bookOutlineListLabel', () => {
  it('formats chapter and note labels', () => {
    expect(bookOutlineListLabel(BookOutlineKind.CHAPTER, 'Intro', 1, undefined)).toBe('1 · Intro');
    expect(bookOutlineListLabel(BookOutlineKind.NOTE, 'Aside', undefined, 2)).toBe('Note 2 · Aside');
  });
});
