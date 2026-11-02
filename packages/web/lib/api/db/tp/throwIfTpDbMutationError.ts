import {TP_ACTIVITY_LOCKED_CODE, TP_TRIP_LOCKED_CODE, TpActivityLockedError, TpTripLockedError} from '@so/model';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export type TpDbMutationError = {readonly message: string; readonly code?: string} | null | undefined;

export default function throwIfTpDbMutationError(error: TpDbMutationError): void {
  if (error === null || error === undefined) {
    return;
  }
  if (error.code === TP_TRIP_LOCKED_CODE) {
    throw new TpTripLockedError(error.message);
  }
  if (error.code === TP_ACTIVITY_LOCKED_CODE) {
    throw new TpActivityLockedError(error.message);
  }
  throwIfSupabaseError(error);
}
