import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function moveDbTodoCard(
  cardId: string,
  columnId: string | undefined,
  sortOrder: number,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('todo_card')
    .update({column_id: columnId === undefined ? null : columnId, sort_order: sortOrder})
    .eq('id', cardId);
  throwIfSupabaseError(error);
}
