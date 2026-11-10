import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbBkBookInput {
  readonly subtitle?: string;
  readonly summaryMd?: string;
  readonly coverStoragePath?: string | null;
}

export default async function updateDbBkBook(podId: string, input: UpdateDbBkBookInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('bk_book')
    .update({
      ...(input.subtitle === undefined ? {} : {subtitle: input.subtitle}),
      ...(input.summaryMd === undefined ? {} : {summary_md: input.summaryMd}),
      ...(input.coverStoragePath === undefined ? {} : {cover_storage_path: input.coverStoragePath}),
    })
    .eq('pod_id', podId);
  throwIfSupabaseError(error);
}
