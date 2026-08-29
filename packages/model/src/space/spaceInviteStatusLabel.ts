import {SpaceInviteStatus} from './spaceInviteStatus';

export default function spaceInviteStatusLabel(status: SpaceInviteStatus): string {
  if (status === SpaceInviteStatus.ACTIVE) {
    return 'active';
  }
  if (status === SpaceInviteStatus.EXPIRED) {
    return 'expired';
  }
  if (status === SpaceInviteStatus.EXHAUSTED) {
    return 'exhausted';
  }
  return 'disabled';
}
