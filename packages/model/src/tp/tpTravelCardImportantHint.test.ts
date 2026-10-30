import tpTravelCardImportantHint from './tpTravelCardImportantHint';

const libs = [
  {id: 'lib-route', important: true, importantReason: 'Overnight ferry'},
  {id: 'lib-step', important: true, importantReason: 'Reserved seats'},
  {id: 'lib-legacy', important: true, importantReason: '  '},
  {id: 'lib-plain', important: false, importantReason: 'ignore'},
];

describe('tpTravelCardImportantHint', () => {
  it('stays hidden for non-travel cards', () => {
    expect(
      tpTravelCardImportantHint({
        kind: 'activity',
        selectedRouteId: 'route-1',
        routes: [{id: 'route-1', transportLibId: 'lib-route'}],
        steps: [],
        actionTransportLibIds: [],
        transportLib: libs,
      }),
    ).toEqual({show: false});
  });

  it('shows the selected route library reason', () => {
    expect(
      tpTravelCardImportantHint({
        kind: 'travel',
        selectedRouteId: 'route-1',
        routes: [
          {id: 'route-1', transportLibId: 'lib-route'},
          {id: 'route-2', isSelected: false, transportLibId: 'lib-step'},
        ],
        steps: [],
        actionTransportLibIds: [],
        transportLib: libs,
      }),
    ).toEqual({show: true, reason: 'Overnight ferry'});
  });

  it('includes important steps on the selected route and legacy links', () => {
    expect(
      tpTravelCardImportantHint({
        kind: 'travel',
        routes: [{id: 'route-1', isSelected: true}],
        steps: [
          {routeId: 'route-2', sortOrder: 0, transportLibId: 'lib-route'},
          {routeId: 'route-1', sortOrder: 1, transportLibId: 'lib-step'},
          {routeId: 'route-1', sortOrder: 0, transportLibId: 'lib-plain'},
        ],
        actionTransportLibIds: ['lib-legacy', 'lib-step'],
        transportLib: libs,
      }).reason,
    ).toBe('Reserved seats');
  });

  it('shows the icon without a reason when every important reason is blank', () => {
    expect(
      tpTravelCardImportantHint({
        kind: 'travel',
        selectedRouteId: 'route-1',
        routes: [{id: 'route-1'}],
        steps: [],
        actionTransportLibIds: ['lib-legacy'],
        transportLib: libs,
      }),
    ).toEqual({show: true});
  });

  it('joins distinct reasons from the route, then steps, then legacy links', () => {
    expect(
      tpTravelCardImportantHint({
        kind: 'travel',
        selectedRouteId: 'route-1',
        routes: [{id: 'route-1', transportLibId: 'lib-route'}],
        steps: [{routeId: 'route-1', sortOrder: 0, transportLibId: 'lib-step'}],
        actionTransportLibIds: ['lib-other'],
        transportLib: [...libs, {id: 'lib-other', important: true, importantReason: 'Paper ticket'}],
      }).reason,
    ).toBe('Overnight ferry\nReserved seats\nPaper ticket');
  });
});
