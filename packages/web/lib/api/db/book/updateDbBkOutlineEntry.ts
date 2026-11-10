import type {BookChapterStatus} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import mapDbBkOutlineRow, {type DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';

export interface UpdateDbBkOutlineEntryInput {
  readonly title?: string;
  readonly summaryMd?: string;
  readonly contentMd?: string;
  readonly status?: BookChapterStatus;
}

export default async function updateDbBkOutlineEntry(
  entryId: string,
  input: UpdateDbBkOutlineEntryInput,
): Promise<DbBkOutlineEntry> {
  const supabase = getSupabaseBrowserClient();
  const patch: Record<string, string> = {};
  if (input.title !== undefined) {
    patch.title = input.title;
  }
  if (input.summaryMd !== undefined) {
    patch.summary_md = input.summaryMd;
  }
  if (input.contentMd !== undefined) {
    patch.content_md = input.contentMd;
  }
  if (input.status !== undefined) {
    patch.status = input.status;
  }
  const {error} = await supabase.from('bk_outline_entry').update(patch).eq('id', entryId);
  throwIfSupabaseError(error);
  const {data, error: readErr} = await supabase.from('bk_outline_entry').select('*').eq('id', entryId).single();
  throwIfSupabaseError(readErr);
  if (data === null) {
    throw new Error('Outline entry not found');
  }
  return mapDbBkOutlineRow(data);
}
