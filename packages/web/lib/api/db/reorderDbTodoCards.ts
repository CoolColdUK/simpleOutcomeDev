import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface ReorderDbTodoCardItem {
  readonly id: string;
  readonly columnId: string | undefined;
  readonly sortOrder: number;
}

export default async function reorderDbTodoCards(items: readonly ReorderDbTodoCardItem[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await Promise.all(
    items.map(async (item) => {
      const {error} = await supabase
        .from('todo_card')
        .update({column_id: item.columnId === undefined ? null : item.columnId, sort_order: item.sortOrder})
        .eq('id', item.id);
      throwIfSupabaseError(error);
    }),
  );
}
