import filterAccessiblePods from './filterAccessiblePods';
import {SpaceRole} from './spaceRole';
import {PodStatus} from './podStatus';

describe('filterAccessiblePods', () => {
  const base = {id: 'p1', createdBy: 'u1', status: PodStatus.ACTIVE};

  it('hides archived unless showArchived', () => {
    expect(
      filterAccessiblePods({
        pods: [{...base, status: PodStatus.ARCHIVED}],
        memberPodIds: [],
        spaceRole: SpaceRole.OWNER,
        userId: 'u1',
        showArchived: false,
      }),
    ).toEqual([]);
  });

  it('shows archived for space owner when switched on', () => {
    const archived = {...base, status: PodStatus.ARCHIVED};
    expect(
      filterAccessiblePods({
        pods: [archived],
        memberPodIds: [],
        spaceRole: SpaceRole.OWNER,
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
        spaceRole: SpaceRole.USER,
        userId: 'u2',
        showArchived: false,
      }),
    ).toEqual([]);
  });
});
