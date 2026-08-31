import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbTodoCard, type DbTodoCard} from '@/lib/api/db/mapDbTodoCard';

export default async function listDbTodoCards(podId: string): Promise<readonly DbTodoCard[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('todo_card')
    .select(
      'id, pod_id, column_id, title, description, due_at, tags, assignee_user_id, sort_order, completed_at, icon_path, created_by, created_at, updated_at',
    )
    .eq('pod_id', podId)
    .order('sort_order', {ascending: true})
    .order('created_at', {ascending: true});
  throwIfSupabaseError(error);
  return (data ?? []).map(mapDbTodoCard);
}
