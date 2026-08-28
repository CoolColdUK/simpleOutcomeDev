import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function denyDbPodJoinRequest(requestId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('deny_pod_join_request', {p_request_id: requestId});
  throwIfSupabaseError(error);
}
