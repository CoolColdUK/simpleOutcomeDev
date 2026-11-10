import type {BookChapterStatus} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import mapDbBkOutlineRow, {type DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';

export interface UpdateDbBkOutlineEntryInput {
  readonly title?: string;
  readonly summaryMd?: string;
  readonly contentMd?: string;
  readonly status?: BookChapterStatus;
  readonly chapterImageStoragePath?: string | null;
}

export default async function updateDbBkOutlineEntry(
  entryId: string,
  input: UpdateDbBkOutlineEntryInput,
): Promise<DbBkOutlineEntry> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('bk_outline_entry')
    .update({
      ...(input.title === undefined ? {} : {title: input.title}),
      ...(input.summaryMd === undefined ? {} : {summary_md: input.summaryMd}),
      ...(input.contentMd === undefined ? {} : {content_md: input.contentMd}),
      ...(input.status === undefined ? {} : {status: input.status}),
      ...(input.chapterImageStoragePath === undefined
        ? {}
        : {chapter_image_storage_path: input.chapterImageStoragePath}),
    })
    .eq('id', entryId);
  throwIfSupabaseError(error);
  const {data, error: readErr} = await supabase.from('bk_outline_entry').select('*').eq('id', entryId).single();
  throwIfSupabaseError(readErr);
  if (data === null) {
    throw new Error('Outline entry not found');
  }
  return mapDbBkOutlineRow(data);
}
