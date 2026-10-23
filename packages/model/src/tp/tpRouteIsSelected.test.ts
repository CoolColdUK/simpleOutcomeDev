import tpRouteIsSelected from './tpRouteIsSelected';

describe('tpRouteIsSelected', () => {
  it('prefers selectedRouteId over stale is_selected flag', () => {
    expect(tpRouteIsSelected('route-a', 'route-b', true)).toBe(false);
    expect(tpRouteIsSelected('route-b', 'route-b', false)).toBe(true);
  });

  it('falls back to stored is_selected when selectedRouteId is unset', () => {
    expect(tpRouteIsSelected('route-a', undefined, true)).toBe(true);
    expect(tpRouteIsSelected('route-a', undefined, false)).toBe(false);
  });
});
