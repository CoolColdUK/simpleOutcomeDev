import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function archiveDbTodoCardsCompletedByColumn(columnId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('todo_card')
    .update({column_id: null})
    .eq('column_id', columnId)
    .not('completed_at', 'is', null);
  throwIfSupabaseError(error);
}
