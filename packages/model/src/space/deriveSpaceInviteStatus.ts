import type {SpaceInviteStatus} from './spaceInviteStatus';

export interface DeriveSpaceInviteStatusInput {
  readonly disabledAt: string | undefined;
  readonly expiresAt: string | undefined;
  readonly useCount: number;
  readonly maxUses: number;
  readonly nowIso: string;
}

export default function deriveSpaceInviteStatus(input: DeriveSpaceInviteStatusInput): SpaceInviteStatus {
  if (input.disabledAt !== undefined) {
    return 'disabled';
  }
  if (input.expiresAt !== undefined && input.expiresAt <= input.nowIso) {
    return 'expired';
  }
  if (input.useCount >= input.maxUses) {
    return 'exhausted';
  }
  return 'active';
}
