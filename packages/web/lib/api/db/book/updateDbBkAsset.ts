import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
export interface UpdateDbBkAssetInput {
  readonly name?: string;
  readonly descriptionMd?: string;
}

export default async function updateDbBkAsset(assetId: string, input: UpdateDbBkAssetInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('bk_asset')
    .update({
      ...(input.name === undefined ? {} : {name: input.name}),
      ...(input.descriptionMd === undefined ? {} : {description_md: input.descriptionMd}),
    })
    .eq('id', assetId);
  throwIfSupabaseError(error);
}
