import {FeatureKind, PodStatus, PodVisibility} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface FoundPod {
  readonly id: string;
  readonly feature: FeatureKind;
  readonly name: string | undefined;
  readonly visibility: PodVisibility;
  readonly status: PodStatus;
}

function isJoinable(row: FoundPod): boolean {
  return row.status === PodStatus.ACTIVE && (row.visibility === PodVisibility.OPEN || row.visibility === PodVisibility.REQUEST);
}

export default async function searchDbPods(spaceId: string, query: string, showArchived: boolean): Promise<readonly FoundPod[]> {
  const supabase = getSupabaseBrowserClient();
  const trimmed = query.trim();
  const columns = 'id, feature, name, visibility, status';
  const request = showArchived
    ? supabase.from('pod').select(columns).eq('space_id', spaceId)
    : supabase
        .from('pod')
        .select(columns)
        .eq('space_id', spaceId)
        .eq('status', PodStatus.ACTIVE)
        .in('visibility', [PodVisibility.OPEN, PodVisibility.REQUEST]);
  const filtered = trimmed === '' ? request : request.or(`name.ilike.%${trimmed}%,feature.ilike.%${trimmed}%`);
  const {data, error} = await filtered;
  throwIfSupabaseError(error);
  const rows = (data ?? []).map((row) => ({
    id: row.id,
    feature: row.feature as FeatureKind,
    name: row.name ?? undefined,
    visibility: row.visibility as PodVisibility,
    status: row.status as PodStatus,
  }));
  if (!showArchived) {
    return rows;
  }
  return rows.filter((row) => row.status === PodStatus.ARCHIVED || isJoinable(row));
}
