import {parseTodoCardTitle} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbTodoCard(
  podId: string,
  columnId: string,
  title: string,
  createdBy: string,
  sortOrder: number,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('todo_card')
    .insert({
      pod_id: podId,
      column_id: columnId,
      title: parseTodoCardTitle(title),
      created_by: createdBy,
      sort_order: sortOrder,
    })
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create card returned no id');
  }
  return data.id;
}
