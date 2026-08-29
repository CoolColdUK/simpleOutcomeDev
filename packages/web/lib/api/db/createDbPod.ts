import type {FeatureKind, PodVisibility} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbPod(
  spaceId: string,
  feature: FeatureKind,
  name: string,
  visibility: PodVisibility,
  description: string,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('create_pod', {
    p_space_id: spaceId,
    p_feature: feature,
    p_name: name,
    p_visibility: visibility,
    p_description: description,
  });
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create_pod returned no id');
  }
  return data;
}
