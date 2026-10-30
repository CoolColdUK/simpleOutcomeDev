import collectTpTravelWarnings from './collectTpTravelWarnings';
import {payloadWithTpWarnings} from './tpAgentWarning';

const cleanStep = {
  id: 'step-1',
  sortOrder: 0,
  transportLibId: 'lib-1',
  mode: 'train',
  fromPlace: 'HK',
  toPlace: 'Tokyo',
};

describe('collectTpTravelWarnings', () => {
  it('returns nothing for a non-travel action', () => {
    expect(
      collectTpTravelWarnings({
        kind: 'stay',
        steps: [],
        legacyActionTransportCount: 2,
      }),
    ).toEqual([]);
  });

  it('warns when a travel action has no selected route', () => {
    expect(
      collectTpTravelWarnings({
        kind: 'travel',
        steps: [cleanStep],
        legacyActionTransportCount: 0,
      }),
    ).toEqual([
      {
        code: 'travel_no_selected_route',
        message: 'Travel action has no selected route; day card glance may be incomplete.',
        path: 'selectedRouteId',
      },
    ]);
  });

  it('warns when the selected route has no steps', () => {
    expect(
      collectTpTravelWarnings({
        kind: 'travel',
        selectedRouteId: 'route-1',
        steps: [],
        legacyActionTransportCount: 0,
      }),
    ).toEqual([
      {
        code: 'route_no_steps',
        message: 'Selected route has no journey steps.',
        path: 'route',
      },
    ]);
  });

  it('warns when a step has no library link and a generic mode', () => {
    const warnings = collectTpTravelWarnings({
      kind: 'travel',
      selectedRouteId: 'route-1',
      steps: [
        {id: 'step-2', sortOrder: 1, mode: 'other', fromPlace: 'A', toPlace: 'B'},
        {sortOrder: 0, mode: '  ', fromPlace: 'A', toPlace: 'B'},
      ],
      legacyActionTransportCount: 0,
    });
    expect(warnings.map((warning) => warning.path)).toEqual([
      'steps/0.transportLibId',
      'steps/step-2.transportLibId',
    ]);
  });

  it('does not warn when a step names a specific mode without a library link', () => {
    expect(
      collectTpTravelWarnings({
        kind: 'travel',
        selectedRouteId: 'route-1',
        fromPlace: 'HK',
        toPlace: 'Tokyo',
        steps: [{id: 'step-1', sortOrder: 0, mode: 'Shinkansen', fromPlace: 'HK', toPlace: 'Tokyo'}],
        legacyActionTransportCount: 0,
      }),
    ).toEqual([]);
  });

  it('warns when action endpoints disagree with the first and last steps', () => {
    expect(
      collectTpTravelWarnings({
        kind: 'travel',
        selectedRouteId: 'route-1',
        fromPlace: 'HK',
        toPlace: 'Osaka',
        steps: [
          {...cleanStep, sortOrder: 0, toPlace: 'Tokyo'},
          {id: 'step-2', sortOrder: 1, transportLibId: 'lib-2', mode: 'train', fromPlace: 'Tokyo', toPlace: 'Kyoto'},
        ],
        legacyActionTransportCount: 0,
      }),
    ).toEqual([
      {
        code: 'endpoint_mismatch',
        message: 'Action endpoints do not match first/last step places.',
        path: 'toPlace',
      },
    ]);
  });

  it('skips endpoint checks when either side is blank', () => {
    expect(
      collectTpTravelWarnings({
        kind: 'travel',
        selectedRouteId: 'route-1',
        fromPlace: 'HK',
        steps: [{...cleanStep, fromPlace: undefined, toPlace: 'Tokyo'}],
        legacyActionTransportCount: 0,
      }),
    ).toEqual([]);
  });

  it('warns when legacy action-transport links exist', () => {
    expect(
      collectTpTravelWarnings({
        kind: 'travel',
        selectedRouteId: 'route-1',
        fromPlace: 'HK',
        toPlace: 'Tokyo',
        steps: [cleanStep],
        legacyActionTransportCount: 1,
      }),
    ).toEqual([
      {
        code: 'legacy_action_transport_present',
        message: 'Legacy action-level transport links exist; use route steps instead.',
        path: 'actionTransports',
      },
    ]);
  });

  it('returns a clean list when the selected route, step, and endpoints agree', () => {
    expect(
      collectTpTravelWarnings({
        kind: 'travel',
        selectedRouteId: 'route-1',
        fromPlace: ' HK ',
        toPlace: 'Tokyo',
        steps: [cleanStep],
        legacyActionTransportCount: 0,
      }),
    ).toEqual([]);
  });
});

describe('payloadWithTpWarnings', () => {
  it('omits the warnings key when the list is empty', () => {
    expect(payloadWithTpWarnings({action: {id: 'a'}}, [])).toEqual({action: {id: 'a'}});
  });

  it('includes warnings when the list is non-empty', () => {
    const warning = {code: 'route_no_steps', message: 'Selected route has no journey steps.'};
    expect(payloadWithTpWarnings({ok: true}, [warning])).toEqual({ok: true, warnings: [warning]});
  });
});
