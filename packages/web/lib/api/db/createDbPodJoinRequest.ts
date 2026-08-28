import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbPodJoinRequest(podId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('create_pod_join_request', {p_pod_id: podId});
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create_pod_join_request returned no id');
  }
  return data;
}
