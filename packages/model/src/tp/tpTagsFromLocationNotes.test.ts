import tpLocationNotesWithoutTagLines from './tpLocationNotesWithoutTagLines';
import tpTagsFromLocationNotes from './tpTagsFromLocationNotes';

describe('tpTagsFromLocationNotes', () => {
  it('parses comma-separated tags and dedupes case-insensitively', () => {
    expect(tpTagsFromLocationNotes(['Tags: Food, Walk', 'tags: walk, Museum'])).toEqual(['Food', 'Walk', 'Museum']);
  });

  it('keeps first spelling and internal spaces', () => {
    expect(tpTagsFromLocationNotes(['Tags: Food, food', 'tags : street food'])).toEqual(['Food', 'street food']);
  });

  it('ignores non-tag lines and empty payloads', () => {
    expect(tpTagsFromLocationNotes(['See tags: food', 'Tagged: food', 'Tags:', undefined, ''])).toEqual([]);
  });

  it('does not split on semicolons', () => {
    expect(tpTagsFromLocationNotes(['Tags: a;b'])).toEqual(['a;b']);
  });

  it('respects location order', () => {
    expect(tpTagsFromLocationNotes(['Tags: B', 'Tags: A'])).toEqual(['B', 'A']);
  });
});

describe('tpLocationNotesWithoutTagLines', () => {
  it('removes tag lines only', () => {
    expect(tpLocationNotesWithoutTagLines('Hours: 9–5\nTags: food\nLobby on 2F')).toBe('Hours: 9–5\nLobby on 2F');
  });

  it('returns undefined when only tag lines remain', () => {
    expect(tpLocationNotesWithoutTagLines('Tags: food')).toBeUndefined();
    expect(tpLocationNotesWithoutTagLines(undefined)).toBeUndefined();
  });
});
