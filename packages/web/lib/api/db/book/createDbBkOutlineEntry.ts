import {BookChapterStatus, BookOutlineKind} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import mapDbBkOutlineRow, {type DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';

export interface CreateDbBkOutlineEntryInput {
  readonly id?: string;
  readonly kind: BookOutlineKind;
  readonly title?: string;
  readonly summaryMd?: string;
  readonly contentMd?: string;
  readonly status?: BookChapterStatus;
  readonly chapterImageStoragePath?: string | null;
  readonly sortOrder?: number;
}

export default async function createDbBkOutlineEntry(
  podId: string,
  input: CreateDbBkOutlineEntryInput,
): Promise<DbBkOutlineEntry> {
  const supabase = getSupabaseBrowserClient();
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const maxRes = await supabase.from('bk_outline_entry').select('sort_order').eq('pod_id', podId).order('sort_order', {ascending: false}).limit(1);
    throwIfSupabaseError(maxRes.error);
    sortOrder = maxRes.data?.[0] === undefined ? 0 : maxRes.data[0].sort_order + 1;
  }
  const status = input.kind === BookOutlineKind.CHAPTER ? (input.status ?? BookChapterStatus.OUTLINE) : null;
  const insertRow: {
    id?: string;
    pod_id: string;
    kind: BookOutlineKind;
    sort_order: number;
    title: string;
    summary_md: string;
    content_md: string;
    status: BookChapterStatus | null;
    chapter_image_storage_path?: string | null;
  } = {
    pod_id: podId,
    kind: input.kind,
    sort_order: sortOrder,
    title: input.title ?? '',
    summary_md: input.summaryMd ?? '',
    content_md: input.contentMd ?? '',
    status,
  };
  if (input.id !== undefined) {
    insertRow.id = input.id;
  }
  if (input.kind === BookOutlineKind.CHAPTER && input.chapterImageStoragePath !== undefined) {
    insertRow.chapter_image_storage_path = input.chapterImageStoragePath;
  }
  const {data, error} = await supabase
    .from('bk_outline_entry')
    .insert(insertRow)
    .select('*')
    .single();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Failed to create outline entry');
  }
  await supabase.rpc('bk_renumber_outline', {p_pod_id: podId});
  const refreshed = await supabase.from('bk_outline_entry').select('*').eq('id', data.id).single();
  throwIfSupabaseError(refreshed.error);
  if (refreshed.data === null) {
    throw new Error('Failed to load outline entry');
  }
  return mapDbBkOutlineRow(refreshed.data);
}
