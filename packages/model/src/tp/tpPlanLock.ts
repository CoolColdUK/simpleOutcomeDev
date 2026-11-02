export const TP_TRIP_LOCKED_CODE = 'trip_locked';
export const TP_ACTIVITY_LOCKED_CODE = 'activity_locked';

export class TpTripLockedError extends Error {
  constructor(message = 'Trip plan is locked. Unlock it in Trip settings.') {
    super(message);
    this.name = TP_TRIP_LOCKED_CODE;
  }
}

export class TpActivityLockedError extends Error {
  constructor(message = 'Activity is locked. Unlock it on the activity card.') {
    super(message);
    this.name = TP_ACTIVITY_LOCKED_CODE;
  }
}

export function tpThrowIfTripLocked(locked: boolean): void {
  if (locked) {
    throw new TpTripLockedError();
  }
}

export function tpThrowIfActivityLocked(kind: string, locked: boolean): void {
  if (kind === 'activity' && locked) {
    throw new TpActivityLockedError();
  }
}
