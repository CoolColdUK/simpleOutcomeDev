import {parseTodoColumnTitle} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbTodoColumn(columnId: string, title: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('todo_column')
    .update({title: parseTodoColumnTitle(title)})
    .eq('id', columnId);
  throwIfSupabaseError(error);
}
