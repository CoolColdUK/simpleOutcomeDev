import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface DbTpTrip {
  readonly id: string;
  readonly podId: string;
  readonly title: string;
  readonly timezone: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: string;
  readonly budgetAmount?: number;
  readonly budgetCurrency?: string;
  readonly notes?: string;
}

export interface DbTpDay {
  readonly id: string;
  readonly tripId: string;
  readonly dayIndex: number;
  readonly calendarDate: string;
  readonly dayTitle?: string;
  readonly dayNotes?: string;
  readonly primaryDestinationId?: string;
}

export interface DbTpDestination {
  readonly id: string;
  readonly tripId: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly importantInfo?: string;
  readonly activeStartDate?: string;
  readonly activeEndDate?: string;
  readonly mapsUrl?: string;
  readonly timezoneHint?: string;
}

export interface DbTpAction {
  readonly id: string;
  readonly tripId: string;
  readonly anchorDayId?: string;
  readonly kind: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly placeText?: string;
  readonly mapsUrl?: string;
  readonly fromPlace?: string;
  readonly toPlace?: string;
  readonly fromMapsUrl?: string;
  readonly toMapsUrl?: string;
  readonly destinationId?: string;
  readonly fromDestinationId?: string;
  readonly toDestinationId?: string;
  readonly checkInAt?: string;
  readonly checkOutAt?: string;
  readonly checkInTimezone?: string;
  readonly checkOutTimezone?: string;
  readonly costAmount?: number;
  readonly costCurrency?: string;
  readonly notes?: string;
  readonly selectedRouteId?: string;
}

export interface DbTpRoute {
  readonly id: string;
  readonly actionId: string;
  readonly name: string;
  readonly isSelected: boolean;
  readonly sortOrder: number;
}

export interface DbTpTransport {
  readonly id: string;
  readonly routeId: string;
  readonly mode: string;
  readonly fromPlace?: string;
  readonly toPlace?: string;
  readonly departAt?: string;
  readonly arriveAt?: string;
  readonly departTimezone?: string;
  readonly arriveTimezone?: string;
  readonly costAmount?: number;
  readonly costCurrency?: string;
  readonly bookingRef?: string;
  readonly notes?: string;
  readonly sortOrder: number;
}

export interface DbTpAttachment {
  readonly id: string;
  readonly transportId?: string;
  readonly destinationId?: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly storagePath: string;
}

export interface DbTpSettings {
  readonly defaultCurrency: string;
}

export interface DbTpWorkspace {
  readonly trip?: DbTpTrip;
  readonly settings?: DbTpSettings;
  readonly days: readonly DbTpDay[];
  readonly destinations: readonly DbTpDestination[];
  readonly dayDestinationLinks: readonly {dayId: string; destinationId: string}[];
  readonly actions: readonly DbTpAction[];
  readonly routes: readonly DbTpRoute[];
  readonly transports: readonly DbTpTransport[];
  readonly attachments: readonly DbTpAttachment[];
}

export interface LoadDbTpWorkspaceResult {
  readonly data: DbTpWorkspace | null;
  readonly error: Error | null;
}

const emptyWorkspace: DbTpWorkspace = {
  days: [],
  destinations: [],
  dayDestinationLinks: [],
  actions: [],
  routes: [],
  transports: [],
  attachments: [],
};

function num(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export async function loadDbTpWorkspace(
  supabase: SupabaseClient<Database>,
  podId: string,
): Promise<LoadDbTpWorkspaceResult> {
  const {data: tripRow, error: tripErr} = await supabase.from('tp_trip').select('*').eq('pod_id', podId).maybeSingle();
  if (tripErr !== null) {
    return {data: null, error: tripErr};
  }
  const settingRes = await supabase.from('tp_setting').select('default_currency').eq('pod_id', podId).maybeSingle();
  if (settingRes.error !== null) {
    return {data: null, error: settingRes.error};
  }
  const settings =
    settingRes.data === null
      ? undefined
      : {
          defaultCurrency: settingRes.data.default_currency,
        };

  if (tripRow === null) {
    return {data: {...emptyWorkspace, settings}, error: null};
  }

  const tripId = tripRow.id;

  const [daysRes, destRes, actionsRes, attachRes] = await Promise.all([
    supabase.from('tp_day').select('*').eq('trip_id', tripId).order('day_index'),
    supabase.from('tp_destination').select('*').eq('trip_id', tripId).order('sort_order'),
    supabase.from('tp_action').select('*').eq('trip_id', tripId).order('sort_order'),
    supabase.from('tp_attachment').select('*').eq('trip_id', tripId),
  ]);

  const firstError = daysRes.error ?? destRes.error ?? actionsRes.error ?? attachRes.error;
  if (firstError !== null) {
    return {data: null, error: firstError};
  }

  const dayIds = (daysRes.data ?? []).map((d) => d.id);
  const dayDestRes =
    dayIds.length === 0
      ? {data: [], error: null}
      : await supabase.from('tp_day_destination').select('*').in('day_id', dayIds);
  if (dayDestRes.error !== null) {
    return {data: null, error: dayDestRes.error};
  }

  const actionIds = (actionsRes.data ?? []).map((a) => a.id);
  const routesRes =
    actionIds.length === 0
      ? {data: [], error: null}
      : await supabase.from('tp_route').select('*').in('action_id', actionIds).order('sort_order');
  if (routesRes.error !== null) {
    return {data: null, error: routesRes.error};
  }

  const routeIds = (routesRes.data ?? []).map((r) => r.id);
  const transportRes =
    routeIds.length === 0
      ? {data: [], error: null}
      : await supabase.from('tp_transport').select('*').in('route_id', routeIds).order('sort_order');
  if (transportRes.error !== null) {
    return {data: null, error: transportRes.error};
  }

  const trip: DbTpTrip = {
    id: tripRow.id,
    podId: tripRow.pod_id,
    title: tripRow.title,
    timezone: tripRow.timezone,
    startDate: tripRow.start_date,
    endDate: tripRow.end_date,
    status: tripRow.status,
    budgetAmount: num(tripRow.budget_amount),
    budgetCurrency: tripRow.budget_currency ?? undefined,
    notes: tripRow.notes ?? undefined,
  };

  return {
    data: {
      trip,
      settings,
      days: (daysRes.data ?? []).map((d) => ({
        id: d.id,
        tripId: d.trip_id,
        dayIndex: d.day_index,
        calendarDate: d.calendar_date,
        dayTitle: d.day_title ?? undefined,
        dayNotes: d.day_notes ?? undefined,
        primaryDestinationId: d.primary_destination_id ?? undefined,
      })),
      destinations: (destRes.data ?? []).map((d) => ({
        id: d.id,
        tripId: d.trip_id,
        name: d.name,
        sortOrder: d.sort_order,
        importantInfo: d.important_info ?? undefined,
        activeStartDate: d.active_start_date ?? undefined,
        activeEndDate: d.active_end_date ?? undefined,
        mapsUrl: d.maps_url ?? undefined,
        timezoneHint: d.timezone_hint ?? undefined,
      })),
      dayDestinationLinks: (dayDestRes.data ?? []).map((l) => ({dayId: l.day_id, destinationId: l.destination_id})),
      actions: (actionsRes.data ?? []).map((a) => ({
        id: a.id,
        tripId: a.trip_id,
        anchorDayId: a.anchor_day_id ?? undefined,
        kind: a.kind,
        title: a.title,
        sortOrder: a.sort_order,
        placeText: a.place_text ?? undefined,
        mapsUrl: a.maps_url ?? undefined,
        fromPlace: a.from_place ?? undefined,
        toPlace: a.to_place ?? undefined,
        fromMapsUrl: a.from_maps_url ?? undefined,
        toMapsUrl: a.to_maps_url ?? undefined,
        destinationId: a.destination_id ?? undefined,
        fromDestinationId: a.from_destination_id ?? undefined,
        toDestinationId: a.to_destination_id ?? undefined,
        checkInAt: a.check_in_at ?? undefined,
        checkOutAt: a.check_out_at ?? undefined,
        checkInTimezone: a.check_in_timezone ?? undefined,
        checkOutTimezone: a.check_out_timezone ?? undefined,
        costAmount: num(a.cost_amount),
        costCurrency: a.cost_currency ?? undefined,
        notes: a.notes ?? undefined,
        selectedRouteId: a.selected_route_id ?? undefined,
      })),
      routes: (routesRes.data ?? []).map((r) => ({
        id: r.id,
        actionId: r.action_id,
        name: r.name,
        isSelected: r.is_selected,
        sortOrder: r.sort_order,
      })),
      transports: (transportRes.data ?? []).map((t) => ({
        id: t.id,
        routeId: t.route_id,
        mode: t.mode,
        fromPlace: t.from_place ?? undefined,
        toPlace: t.to_place ?? undefined,
        departAt: t.depart_at ?? undefined,
        arriveAt: t.arrive_at ?? undefined,
        departTimezone: t.depart_timezone ?? undefined,
        arriveTimezone: t.arrive_timezone ?? undefined,
        costAmount: num(t.cost_amount),
        costCurrency: t.cost_currency ?? undefined,
        bookingRef: t.booking_ref ?? undefined,
        notes: t.notes ?? undefined,
        sortOrder: t.sort_order,
      })),
      attachments: (attachRes.data ?? []).map((a) => ({
        id: a.id,
        transportId: a.transport_id ?? undefined,
        destinationId: a.destination_id ?? undefined,
        fileName: a.file_name,
        mimeType: a.mime_type,
        storagePath: a.storage_path,
      })),
    },
    error: null,
  };
}

export default async function loadDbTpWorkspaceForBrowser(podId: string): Promise<DbTpWorkspace> {
  const supabase = getSupabaseBrowserClient();
  const result = await loadDbTpWorkspace(supabase, podId);
  throwIfSupabaseError(result.error);
  return result.data ?? emptyWorkspace;
}
