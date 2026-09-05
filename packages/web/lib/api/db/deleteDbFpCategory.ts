import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbFpCategory(categoryId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('fp_category').delete().eq('id', categoryId);
  throwIfSupabaseError(error);
}
