import {parseTodoCardTags, parseTodoCardTitle} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbTodoCardInput {
  readonly title?: string;
  readonly description?: string;
  readonly dueAt?: string | undefined;
  readonly tags?: readonly string[];
  readonly assigneeUserId?: string | undefined;
}

export default async function updateDbTodoCard(cardId: string, input: UpdateDbTodoCardInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: {
    title?: string;
    description?: string;
    due_at?: string | null;
    tags?: string[];
    assignee_user_id?: string | null;
  } = {};
  if (input.title !== undefined) {
    patch.title = parseTodoCardTitle(input.title);
  }
  if (input.description !== undefined) {
    patch.description = input.description;
  }
  if (input.dueAt !== undefined) {
    patch.due_at = input.dueAt === '' ? null : input.dueAt;
  }
  if (input.tags !== undefined) {
    patch.tags = [...parseTodoCardTags(input.tags)];
  }
  if (input.assigneeUserId !== undefined) {
    patch.assignee_user_id = input.assigneeUserId === '' ? null : input.assigneeUserId;
  }
  const {error} = await supabase.from('todo_card').update(patch).eq('id', cardId);
  throwIfSupabaseError(error);
}
