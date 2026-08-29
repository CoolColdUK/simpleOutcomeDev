import applyTodoCardDrag from './applyTodoCardDrag';
import {TODO_ARCHIVE_COLUMN_ID} from './constants';

describe('applyTodoCardDrag', () => {
  const columnIds = ['todo', 'doing'];
  const cards = [
    {id: 'a', columnId: 'todo'},
    {id: 'b', columnId: 'todo'},
    {id: 'c', columnId: 'doing'},
  ];

  it('reorders within a column when dropping on another card', () => {
    expect(
      applyTodoCardDrag({
        cards,
        activeId: 'b',
        overId: 'a',
        columnIds,
      }),
    ).toEqual([
      {id: 'c', columnId: 'doing'},
      {id: 'b', columnId: 'todo'},
      {id: 'a', columnId: 'todo'},
    ]);
  });

  it('moves a card before a card in another column', () => {
    expect(
      applyTodoCardDrag({
        cards,
        activeId: 'a',
        overId: 'c',
        columnIds,
      }),
    ).toEqual([
      {id: 'b', columnId: 'todo'},
      {id: 'a', columnId: 'doing'},
      {id: 'c', columnId: 'doing'},
    ]);
  });

  it('appends when dropping on a column', () => {
    expect(
      applyTodoCardDrag({
        cards,
        activeId: 'c',
        overId: 'todo',
        columnIds,
      }),
    ).toEqual([
      {id: 'a', columnId: 'todo'},
      {id: 'b', columnId: 'todo'},
      {id: 'c', columnId: 'todo'},
    ]);
  });

  it('archives when dropping on the archive column', () => {
    expect(
      applyTodoCardDrag({
        cards,
        activeId: 'a',
        overId: TODO_ARCHIVE_COLUMN_ID,
        columnIds,
      }),
    ).toEqual([
      {id: 'b', columnId: 'todo'},
      {id: 'c', columnId: 'doing'},
      {id: 'a', columnId: undefined},
    ]);
  });

  it('returns undefined when dropping on itself', () => {
    expect(applyTodoCardDrag({cards, activeId: 'a', overId: 'a', columnIds})).toBeUndefined();
  });
});
