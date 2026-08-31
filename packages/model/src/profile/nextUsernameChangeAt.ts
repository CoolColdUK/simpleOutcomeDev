import {USERNAME_CHANGE_COOLDOWN_MS} from './usernameSchema';

export default function nextUsernameChangeAt(changedAt: string | undefined): string | undefined {
  if (changedAt === undefined) {
    return undefined;
  }
  return new Date(Date.parse(changedAt) + USERNAME_CHANGE_COOLDOWN_MS).toISOString();
}
