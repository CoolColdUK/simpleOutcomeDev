import type {Database} from '@/lib/supabase/database';

type TpLocationRow = Database['public']['Tables']['tp_location']['Row'];
type TpTransportLibRow = Database['public']['Tables']['tp_transport_lib']['Row'];
type TpActionTransportRow = Database['public']['Tables']['tp_action_transport']['Row'];
type TpActionRow = Database['public']['Tables']['tp_action']['Row'];
type TpRouteRow = Database['public']['Tables']['tp_route']['Row'];
type TpTransportRow = Database['public']['Tables']['tp_transport']['Row'];

function num(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function mapAgentTpLocationRow(row: TpLocationRow) {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    address: row.address ?? undefined,
    mapsUrl: row.maps_url ?? undefined,
    notes: row.notes ?? undefined,
    openTime: row.open_time ?? undefined,
    closeTime: row.close_time ?? undefined,
    website: row.website ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    country: row.country ?? undefined,
    locationType: row.location_type,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentTpTransportLibRow(row: TpTransportLibRow) {
  return {
    id: row.id,
    tripId: row.trip_id,
    label: row.label,
    mode: row.mode ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    costAmount: num(row.cost_amount),
    costCurrency: row.cost_currency ?? undefined,
    fromLocationId: row.from_location_id ?? undefined,
    toLocationId: row.to_location_id ?? undefined,
    notes: row.notes ?? undefined,
    important: row.important === true,
    importantReason: row.important_reason ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentTpActionRow(row: TpActionRow) {
  return {
    id: row.id,
    tripId: row.trip_id,
    anchorDayId: row.anchor_day_id ?? undefined,
    kind: row.kind,
    title: row.title,
    sortOrder: row.sort_order,
    placeText: row.place_text ?? undefined,
    mapsUrl: row.maps_url ?? undefined,
    fromPlace: row.from_place ?? undefined,
    toPlace: row.to_place ?? undefined,
    fromMapsUrl: row.from_maps_url ?? undefined,
    toMapsUrl: row.to_maps_url ?? undefined,
    destinationId: row.destination_id ?? undefined,
    fromDestinationId: row.from_destination_id ?? undefined,
    toDestinationId: row.to_destination_id ?? undefined,
    checkInAt: row.check_in_at ?? undefined,
    checkOutAt: row.check_out_at ?? undefined,
    checkInTimezone: row.check_in_timezone ?? undefined,
    checkOutTimezone: row.check_out_timezone ?? undefined,
    costAmount: num(row.cost_amount),
    costCurrency: row.cost_currency ?? undefined,
    bookingRef: row.booking_ref ?? undefined,
    url: row.url ?? undefined,
    notes: row.notes ?? undefined,
    selectedRouteId: row.selected_route_id ?? undefined,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    fromLocationId: row.from_location_id ?? undefined,
    toLocationId: row.to_location_id ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    done: row.done,
  };
}

export function mapAgentTpRouteRow(row: TpRouteRow) {
  return {
    id: row.id,
    actionId: row.action_id,
    name: row.name,
    isSelected: row.is_selected,
    notes: row.notes ?? undefined,
    sortOrder: row.sort_order,
    costAmount: num(row.cost_amount),
    costCurrency: row.cost_currency ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    transportLibId: row.transport_lib_id ?? undefined,
  };
}

export function mapAgentTpTransportRow(row: TpTransportRow) {
  return {
    id: row.id,
    routeId: row.route_id,
    mode: row.mode,
    fromPlace: row.from_place ?? undefined,
    toPlace: row.to_place ?? undefined,
    departAt: row.depart_at ?? undefined,
    arriveAt: row.arrive_at ?? undefined,
    departTimezone: row.depart_timezone ?? undefined,
    arriveTimezone: row.arrive_timezone ?? undefined,
    costAmount: num(row.cost_amount),
    costCurrency: row.cost_currency ?? undefined,
    bookingRef: row.booking_ref ?? undefined,
    url: row.url ?? undefined,
    notes: row.notes ?? undefined,
    sortOrder: row.sort_order,
    transportLibId: row.transport_lib_id ?? undefined,
    fromLocationId: row.from_location_id ?? undefined,
    toLocationId: row.to_location_id ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    done: row.done,
  };
}

export function mapAgentTpActionTransportRow(row: TpActionTransportRow) {
  return {
    id: row.id,
    actionId: row.action_id,
    transportLibId: row.transport_lib_id,
    sortOrder: row.sort_order,
    durationMinutes: row.duration_minutes ?? undefined,
    costAmount: num(row.cost_amount),
    costCurrency: row.cost_currency ?? undefined,
    fromLocationId: row.from_location_id ?? undefined,
    toLocationId: row.to_location_id ?? undefined,
    done: row.done,
    createdAt: row.created_at,
  };
}
