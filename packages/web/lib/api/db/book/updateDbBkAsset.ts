import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
export interface UpdateDbBkAssetInput {
  readonly name?: string;
  readonly descriptionMd?: string;
}

export default async function updateDbBkAsset(assetId: string, input: UpdateDbBkAssetInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: Record<string, string> = {};
  if (input.name !== undefined) {
    patch.name = input.name;
  }
  if (input.descriptionMd !== undefined) {
    patch.description_md = input.descriptionMd;
  }
  const {error} = await supabase.from('bk_asset').update(patch).eq('id', assetId);
  throwIfSupabaseError(error);
  void supabase;
}
