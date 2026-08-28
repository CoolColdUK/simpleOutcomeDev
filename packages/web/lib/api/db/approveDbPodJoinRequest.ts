import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function approveDbPodJoinRequest(requestId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('approve_pod_join_request', {p_request_id: requestId});
  throwIfSupabaseError(error);
}
