import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbTodoCardComment {
  readonly id: string;
  readonly podId: string;
  readonly cardId: string;
  readonly body: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export default async function listDbTodoCardComments(cardId: string): Promise<readonly DbTodoCardComment[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('todo_card_comment')
    .select('id, pod_id, card_id, body, created_by, created_at, updated_at')
    .eq('card_id', cardId)
    .order('created_at', {ascending: true});
  throwIfSupabaseError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    podId: row.pod_id,
    cardId: row.card_id,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
