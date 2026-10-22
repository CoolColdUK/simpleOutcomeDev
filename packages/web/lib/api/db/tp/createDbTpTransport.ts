import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbTpTransport(routeId: string, sortOrder: number): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('tp_transport')
    .insert({route_id: routeId, mode: 'other', sort_order: sortOrder})
    .select('id')
    .single();
  throwIfSupabaseError(error);
  return data.id;
}
