import filterTodoCardsByTags from './filterTodoCardsByTags';

describe('filterTodoCardsByTags', () => {
  const cards = [
    {id: '1', tags: ['urgent', 'web']},
    {id: '2', tags: ['web']},
    {id: '3', tags: []},
  ];

  it('returns all cards when no tags are selected', () => {
    expect(filterTodoCardsByTags(cards, [])).toEqual(cards);
  });

  it('keeps cards that have any selected tag', () => {
    expect(filterTodoCardsByTags(cards, ['urgent']).map((c) => c.id)).toEqual(['1']);
    expect(filterTodoCardsByTags(cards, ['web']).map((c) => c.id)).toEqual(['1', '2']);
  });
});
