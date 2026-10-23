import type {Database} from '@/lib/supabase/database';

type TpLocationRow = Database['public']['Tables']['tp_location']['Row'];
type TpTransportLibRow = Database['public']['Tables']['tp_transport_lib']['Row'];
type TpActionTransportRow = Database['public']['Tables']['tp_action_transport']['Row'];

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
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
