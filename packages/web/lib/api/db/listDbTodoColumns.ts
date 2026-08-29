import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbTodoColumn {
  readonly id: string;
  readonly podId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export default async function listDbTodoColumns(podId: string): Promise<readonly DbTodoColumn[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('todo_column')
    .select('id, pod_id, title, sort_order, created_at, updated_at')
    .eq('pod_id', podId)
    .order('sort_order', {ascending: true})
    .order('created_at', {ascending: true});
  throwIfSupabaseError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    podId: row.pod_id,
    title: row.title,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
