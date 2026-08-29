import spaceInviteStatusLabel from './spaceInviteStatusLabel';

describe('spaceInviteStatusLabel', () => {
  it('labels active', () => {
    expect(spaceInviteStatusLabel('active')).toBe('active');
  });

  it('labels expired', () => {
    expect(spaceInviteStatusLabel('expired')).toBe('expired');
  });

  it('labels exhausted', () => {
    expect(spaceInviteStatusLabel('exhausted')).toBe('exhausted');
  });

  it('labels disabled', () => {
    expect(spaceInviteStatusLabel('disabled')).toBe('disabled');
  });
});
