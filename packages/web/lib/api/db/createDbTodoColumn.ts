import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {parseTodoColumnTitle} from '@so/model';

export default async function createDbTodoColumn(podId: string, title: string, sortOrder: number): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('todo_column')
    .insert({pod_id: podId, title: parseTodoColumnTitle(title), sort_order: sortOrder})
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create column returned no id');
  }
  return data.id;
}
