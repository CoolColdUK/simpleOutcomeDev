import filterAccessiblePods from './filterAccessiblePods';

describe('filterAccessiblePods', () => {
  const base = {id: 'p1', createdBy: 'u1', status: 'active' as const};

  it('hides archived unless showArchived', () => {
    expect(
      filterAccessiblePods({
        pods: [{...base, status: 'archived'}],
        memberPodIds: [],
        spaceRole: 'space_owner',
        userId: 'u1',
        showArchived: false,
      }),
    ).toEqual([]);
  });

  it('shows archived for space owner when switched on', () => {
    const archived = {...base, status: 'archived' as const};
    expect(
      filterAccessiblePods({
        pods: [archived],
        memberPodIds: [],
        spaceRole: 'space_owner',
        userId: 'owner',
        showArchived: true,
      }),
    ).toEqual([archived]);
  });

  it('hides active pods from space users without membership', () => {
    expect(
      filterAccessiblePods({
        pods: [base],
        memberPodIds: [],
        spaceRole: 'space_user',
        userId: 'u2',
        showArchived: false,
      }),
    ).toEqual([]);
  });
});
