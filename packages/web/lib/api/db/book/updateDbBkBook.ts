import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbBkBookInput {
  readonly subtitle?: string;
  readonly summaryMd?: string;
  readonly coverStoragePath?: string | null;
}

export default async function updateDbBkBook(podId: string, input: UpdateDbBkBookInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: Record<string, string | null> = {};
  if (input.subtitle !== undefined) {
    patch.subtitle = input.subtitle;
  }
  if (input.summaryMd !== undefined) {
    patch.summary_md = input.summaryMd;
  }
  if (input.coverStoragePath !== undefined) {
    patch.cover_storage_path = input.coverStoragePath;
  }
  const {error} = await supabase.from('bk_book').update(patch).eq('pod_id', podId);
  throwIfSupabaseError(error);
}
