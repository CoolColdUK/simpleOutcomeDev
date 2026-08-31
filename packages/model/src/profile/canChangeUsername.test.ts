import canChangeUsername from './canChangeUsername';

describe('canChangeUsername', () => {
  it('allows a first set when no previous change exists', () => {
    expect(canChangeUsername(undefined, '2026-08-31T00:00:00.000Z')).toBe(true);
  });

  it('blocks a change within 30 days', () => {
    expect(canChangeUsername('2026-08-01T00:00:00.000Z', '2026-08-30T23:59:59.000Z')).toBe(false);
  });

  it('allows a change after 30 days', () => {
    expect(canChangeUsername('2026-08-01T00:00:00.000Z', '2026-08-31T00:00:00.000Z')).toBe(true);
  });
});
