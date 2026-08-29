import spaceInviteStatusLabel from './spaceInviteStatusLabel';
import {SpaceInviteStatus} from './spaceInviteStatus';

describe('spaceInviteStatusLabel', () => {
  it('labels active', () => {
    expect(spaceInviteStatusLabel(SpaceInviteStatus.ACTIVE)).toBe('active');
  });

  it('labels expired', () => {
    expect(spaceInviteStatusLabel(SpaceInviteStatus.EXPIRED)).toBe('expired');
  });

  it('labels exhausted', () => {
    expect(spaceInviteStatusLabel(SpaceInviteStatus.EXHAUSTED)).toBe('exhausted');
  });

  it('labels disabled', () => {
    expect(spaceInviteStatusLabel(SpaceInviteStatus.DISABLED)).toBe('disabled');
  });
});
