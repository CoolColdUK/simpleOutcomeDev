import sortTodoCardsByColumnOrder from './sortTodoCardsByColumnOrder';

describe('sortTodoCardsByColumnOrder', () => {
  it('orders by column then sortOrder, with archived last', () => {
    expect(
      sortTodoCardsByColumnOrder(
        [
          {id: 'c', columnId: 'doing', sortOrder: 0},
          {id: 'b', columnId: 'todo', sortOrder: 1},
          {id: 'a', columnId: 'todo', sortOrder: 0},
          {id: 'z', columnId: undefined, sortOrder: 0},
        ],
        ['todo', 'doing'],
      ).map((c) => c.id),
    ).toEqual(['a', 'b', 'c', 'z']);
  });
});
