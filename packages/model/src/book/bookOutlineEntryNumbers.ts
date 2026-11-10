import {BookOutlineKind} from './bookOutlineKind';

export interface BookOutlineNumberInput {
  readonly id: string;
  readonly kind: BookOutlineKind | 'chapter' | 'note';
  readonly sortOrder: number;
}

export interface BookOutlineNumbered extends BookOutlineNumberInput {
  readonly chapterNumber: number | undefined;
  readonly noteNumber: number | undefined;
}

export default function renumberBookOutline<T extends BookOutlineNumberInput>(
  entries: readonly T[],
): Array<T & {chapterNumber: number | undefined; noteNumber: number | undefined}> {
  const sorted = [...entries].sort((a, b) => a.sortOrder - b.sortOrder);
  let chapter = 0;
  let note = 0;
  return sorted.map((entry) => {
    const isChapter = entry.kind === BookOutlineKind.CHAPTER || (entry.kind as string) === 'chapter';
    if (isChapter) {
      chapter += 1;
      return {...entry, chapterNumber: chapter, noteNumber: undefined};
    }
    note += 1;
    return {...entry, chapterNumber: undefined, noteNumber: note};
  });
}

export function bookOutlineListLabel(
  kind: BookOutlineKind | 'chapter' | 'note',
  title: string,
  chapterNumber: number | undefined,
  noteNumber: number | undefined,
): string {
  const trimmed = title.trim() === '' ? 'Untitled' : title.trim();
  if (kind === BookOutlineKind.CHAPTER || (kind as string) === 'chapter') {
    return `${chapterNumber ?? '?'} · ${trimmed}`;
  }
  return `Note ${noteNumber ?? '?'} · ${trimmed}`;
}
