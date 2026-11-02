import type {SupabaseClient} from '@supabase/supabase-js';
import {TpActivityLockedError, TpTripLockedError, tpThrowIfActivityLocked, tpThrowIfTripLocked} from '@so/model';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

async function fetchTripLocked(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<boolean> {
  const {data, error} = await supabase.from('tp_trip').select('locked').eq('id', tripId).maybeSingle();
  throwIfSupabaseError(error);
  return data?.locked ?? false;
}

export async function assertTpTripUnlocked(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<void> {
  const locked = await fetchTripLocked(supabase, tripId);
  tpThrowIfTripLocked(locked);
}

export async function assertTpTripUnlockedByPodId(
  supabase: SupabaseClient<Database>,
  podId: string,
): Promise<string> {
  const {data, error} = await supabase.from('tp_trip').select('id, locked').eq('pod_id', podId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Trip not found');
  }
  tpThrowIfTripLocked(data.locked);
  return data.id;
}

async function loadActionLockRow(
  supabase: SupabaseClient<Database>,
  actionId: string,
): Promise<{tripId: string; kind: string; locked: boolean}> {
  const {data, error} = await supabase
    .from('tp_action')
    .select('trip_id, kind, locked')
    .eq('id', actionId)
    .maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Action not found');
  }
  return {tripId: data.trip_id, kind: data.kind, locked: data.locked};
}

export async function assertTpActionContentUnlocked(
  supabase: SupabaseClient<Database>,
  actionId: string,
): Promise<void> {
  const row = await loadActionLockRow(supabase, actionId);
  await assertTpTripUnlocked(supabase, row.tripId);
  tpThrowIfActivityLocked(row.kind, row.locked);
}

export async function assertTpTripUnlockedForDay(
  supabase: SupabaseClient<Database>,
  dayId: string,
): Promise<void> {
  const {data, error} = await supabase.from('tp_day').select('trip_id').eq('id', dayId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Day not found');
  }
  await assertTpTripUnlocked(supabase, data.trip_id);
}

export async function assertTpTripUnlockedForDestination(
  supabase: SupabaseClient<Database>,
  destinationId: string,
): Promise<void> {
  const {data, error} = await supabase.from('tp_destination').select('trip_id').eq('id', destinationId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Destination not found');
  }
  await assertTpTripUnlocked(supabase, data.trip_id);
}

export async function assertTpTripUnlockedForLocation(
  supabase: SupabaseClient<Database>,
  locationId: string,
): Promise<void> {
  const {data, error} = await supabase.from('tp_location').select('trip_id').eq('id', locationId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Location not found');
  }
  await assertTpTripUnlocked(supabase, data.trip_id);
}

export async function assertTpTripUnlockedForTransportLib(
  supabase: SupabaseClient<Database>,
  transportLibId: string,
): Promise<void> {
  const {data, error} = await supabase
    .from('tp_transport_lib')
    .select('trip_id')
    .eq('id', transportLibId)
    .maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Transport library row not found');
  }
  await assertTpTripUnlocked(supabase, data.trip_id);
}

export async function assertTpTripUnlockedForRoute(
  supabase: SupabaseClient<Database>,
  routeId: string,
): Promise<void> {
  const {data, error} = await supabase.from('tp_route').select('action_id').eq('id', routeId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Route not found');
  }
  await assertTpActionContentUnlocked(supabase, data.action_id);
}

export async function assertTpTripUnlockedForTransport(
  supabase: SupabaseClient<Database>,
  transportId: string,
): Promise<void> {
  const {data, error} = await supabase.from('tp_transport').select('route_id').eq('id', transportId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Transport step not found');
  }
  await assertTpTripUnlockedForRoute(supabase, data.route_id);
}

export async function assertTpTripUnlockedForActionLocationLink(
  supabase: SupabaseClient<Database>,
  linkId: string,
): Promise<void> {
  const {data, error} = await supabase.from('tp_action_location').select('action_id').eq('id', linkId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Action location link not found');
  }
  await assertTpActionContentUnlocked(supabase, data.action_id);
}

export async function assertTpTripUnlockedForAttachment(
  supabase: SupabaseClient<Database>,
  attachmentId: string,
): Promise<void> {
  const {data, error} = await supabase
    .from('tp_attachment')
    .select('trip_id')
    .eq('id', attachmentId)
    .maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Attachment not found');
  }
  await assertTpTripUnlocked(supabase, data.trip_id);
}

export async function assertTpTripUnlockedForActionTransportLink(
  supabase: SupabaseClient<Database>,
  linkId: string,
): Promise<void> {
  const {data, error} = await supabase.from('tp_action_transport').select('action_id').eq('id', linkId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Action transport link not found');
  }
  await assertTpActionContentUnlocked(supabase, data.action_id);
}

type TpLockDbError = {readonly message: string; readonly code: string};

function tpLockDbError(error: unknown): TpLockDbError | undefined {
  if (error instanceof TpTripLockedError || error instanceof TpActivityLockedError) {
    return {message: error.message, code: error.name};
  }
  return undefined;
}

export async function tryAssertTpTripUnlockedByPodId(
  supabase: SupabaseClient<Database>,
  podId: string,
): Promise<{lockError: TpLockDbError} | {tripId: string}> {
  try {
    const tripId = await assertTpTripUnlockedByPodId(supabase, podId);
    return {tripId};
  } catch (e: unknown) {
    const lock = tpLockDbError(e);
    if (lock !== undefined) {
      return {lockError: lock};
    }
    throw e;
  }
}

export async function tryAssertTpActionContentUnlocked(
  supabase: SupabaseClient<Database>,
  actionId: string,
): Promise<TpLockDbError | undefined> {
  try {
    await assertTpActionContentUnlocked(supabase, actionId);
    return undefined;
  } catch (e: unknown) {
    return tpLockDbError(e) ?? (() => {
      throw e;
    })();
  }
}
