import type {FeatureKind, PodStatus, PodVisibility} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbPod {
  readonly id: string;
  readonly spaceId: string;
  readonly feature: FeatureKind;
  readonly name: string | undefined;
  readonly visibility: PodVisibility;
  readonly status: PodStatus;
  readonly createdBy: string;
}

export default async function listDbPods(spaceId: string): Promise<readonly DbPod[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.from('pod').select('id, space_id, feature, name, visibility, status, created_by').eq('space_id', spaceId);
  throwIfSupabaseError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    spaceId: row.space_id,
    feature: row.feature as FeatureKind,
    name: row.name ?? undefined,
    visibility: row.visibility as PodVisibility,
    status: row.status as PodStatus,
    createdBy: row.created_by,
  }));
}
