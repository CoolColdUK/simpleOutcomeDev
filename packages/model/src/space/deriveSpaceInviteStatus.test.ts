import deriveSpaceInviteStatus from './deriveSpaceInviteStatus';

const nowIso = '2026-08-29T10:00:00.000Z';

describe('deriveSpaceInviteStatus', () => {
  it('returns disabled when disabled', () => {
    expect(
      deriveSpaceInviteStatus({
        disabledAt: nowIso,
        expiresAt: '2026-09-29T10:00:00.000Z',
        useCount: 0,
        maxUses: 10,
        nowIso,
      }),
    ).toBe('disabled');
  });

  it('returns expired when past expiry', () => {
    expect(
      deriveSpaceInviteStatus({
        disabledAt: undefined,
        expiresAt: '2026-08-01T10:00:00.000Z',
        useCount: 0,
        maxUses: 10,
        nowIso,
      }),
    ).toBe('expired');
  });

  it('returns exhausted when uses are spent', () => {
    expect(
      deriveSpaceInviteStatus({
        disabledAt: undefined,
        expiresAt: '2026-09-29T10:00:00.000Z',
        useCount: 3,
        maxUses: 3,
        nowIso,
      }),
    ).toBe('exhausted');
  });

  it('returns active otherwise', () => {
    expect(
      deriveSpaceInviteStatus({
        disabledAt: undefined,
        expiresAt: '2026-09-29T10:00:00.000Z',
        useCount: 1,
        maxUses: 3,
        nowIso,
      }),
    ).toBe('active');
  });
});
