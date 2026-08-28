import type {FeatureKind, PodStatus, PodVisibility} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {DbPod} from '@/lib/api/db/listDbPods';

export default async function getDbPod(podId: string): Promise<DbPod | undefined> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('pod')
    .select('id, space_id, feature, name, visibility, status, created_by')
    .eq('id', podId)
    .maybeSingle();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    return undefined;
  }
  return {
    id: data.id,
    spaceId: data.space_id,
    feature: data.feature as FeatureKind,
    name: data.name ?? undefined,
    visibility: data.visibility as PodVisibility,
    status: data.status as PodStatus,
    createdBy: data.created_by,
  };
}
