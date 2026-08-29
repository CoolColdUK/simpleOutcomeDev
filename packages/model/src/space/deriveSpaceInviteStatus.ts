import {SpaceInviteStatus} from './spaceInviteStatus';

export interface DeriveSpaceInviteStatusInput {
  readonly disabledAt: string | undefined;
  readonly expiresAt: string | undefined;
  readonly useCount: number;
  readonly maxUses: number;
  readonly nowIso: string;
}

export default function deriveSpaceInviteStatus(input: DeriveSpaceInviteStatusInput): SpaceInviteStatus {
  if (input.disabledAt !== undefined) {
    return SpaceInviteStatus.DISABLED;
  }
  if (input.expiresAt !== undefined && input.expiresAt <= input.nowIso) {
    return SpaceInviteStatus.EXPIRED;
  }
  if (input.useCount >= input.maxUses) {
    return SpaceInviteStatus.EXHAUSTED;
  }
  return SpaceInviteStatus.ACTIVE;
}
