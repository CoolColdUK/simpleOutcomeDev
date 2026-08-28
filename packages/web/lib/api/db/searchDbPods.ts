import type {FeatureKind, PodVisibility} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function searchDbPods(spaceId: string, query: string): Promise<readonly {id: string; feature: FeatureKind; name: string | undefined; visibility: PodVisibility}[]> {
  const supabase = getSupabaseBrowserClient();
  const trimmed = query.trim();
  const request = supabase
    .from('pod')
    .select('id, feature, name, visibility, status')
    .eq('space_id', spaceId)
    .eq('status', 'active')
    .in('visibility', ['open', 'request']);
  const filtered =
    trimmed === ''
      ? request
      : request.or(`name.ilike.%${trimmed}%,feature.ilike.%${trimmed}%`);
  const {data, error} = await filtered;
  throwIfSupabaseError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    feature: row.feature as FeatureKind,
    name: row.name ?? undefined,
    visibility: row.visibility as PodVisibility,
  }));
}
