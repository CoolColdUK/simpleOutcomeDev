import type {SpaceInviteStatus} from './spaceInviteStatus';

export default function spaceInviteStatusLabel(status: SpaceInviteStatus): string {
  if (status === 'active') {
    return 'active';
  }
  if (status === 'expired') {
    return 'expired';
  }
  if (status === 'exhausted') {
    return 'exhausted';
  }
  return 'disabled';
}
