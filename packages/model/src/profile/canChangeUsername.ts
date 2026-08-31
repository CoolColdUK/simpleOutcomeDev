import {USERNAME_CHANGE_COOLDOWN_MS} from './usernameSchema';

export default function canChangeUsername(changedAt: string | undefined, nowIso: string): boolean {
  if (changedAt === undefined) {
    return true;
  }
  return Date.parse(nowIso) - Date.parse(changedAt) >= USERNAME_CHANGE_COOLDOWN_MS;
}
