import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';

export interface CreateDbBkAssetInput {
  readonly id?: string;
  readonly assetTypeId: string;
  readonly name: string;
  readonly descriptionMd?: string;
}

export default async function createDbBkAsset(podId: string, input: CreateDbBkAssetInput): Promise<DbBkAsset> {
  const supabase = getSupabaseBrowserClient();
  const row: {
    id?: string;
    pod_id: string;
    asset_type_id: string;
    name: string;
    description_md: string;
  } = {
    pod_id: podId,
    asset_type_id: input.assetTypeId,
    name: input.name,
    description_md: input.descriptionMd ?? '',
  };
  if (input.id !== undefined) {
    row.id = input.id;
  }
  const {data, error} = await supabase.from('bk_asset').insert(row).select('*').single();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Failed to create asset');
  }
  return {
    id: data.id,
    podId: data.pod_id,
    assetTypeId: data.asset_type_id,
    name: data.name,
    descriptionMd: data.description_md,
    sortOrder: data.sort_order,
    images: [],
  };
}
