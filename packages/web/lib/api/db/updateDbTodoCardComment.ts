import {parseTodoCardCommentBody} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbTodoCardComment(commentId: string, body: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('todo_card_comment')
    .update({body: parseTodoCardCommentBody(body)})
    .eq('id', commentId);
  throwIfSupabaseError(error);
}
