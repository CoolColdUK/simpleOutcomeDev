import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function reorderDbTodoColumns(orderedIds: readonly string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await Promise.all(
    orderedIds.map(async (id, index) => {
      const {error} = await supabase.from('todo_column').update({sort_order: index}).eq('id', id);
      throwIfSupabaseError(error);
    }),
  );
}
