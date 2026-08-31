import listUniqueTodoCardTags from './listUniqueTodoCardTags';

describe('listUniqueTodoCardTags', () => {
  it('returns unique tags sorted', () => {
    expect(
      listUniqueTodoCardTags([
        {tags: ['b', 'a']},
        {tags: ['a', 'c']},
        {tags: []},
      ]),
    ).toEqual(['a', 'b', 'c']);
  });

  it('returns empty when no tags', () => {
    expect(listUniqueTodoCardTags([{tags: []}, {tags: []}])).toEqual([]);
  });
});
