import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbTpRoute(actionId: string, name: string, sortOrder: number): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('tp_route')
    .insert({action_id: actionId, name, is_selected: false, sort_order: sortOrder})
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create route returned no id');
  }
  return data.id;
}
