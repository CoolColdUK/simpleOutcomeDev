import {parseTodoCardCommentBody} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbTodoCardComment(
  podId: string,
  cardId: string,
  body: string,
  createdBy: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('todo_card_comment').insert({
    pod_id: podId,
    card_id: cardId,
    body: parseTodoCardCommentBody(body),
    created_by: createdBy,
  });
  throwIfSupabaseError(error);
}
