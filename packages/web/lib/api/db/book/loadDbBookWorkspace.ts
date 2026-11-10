import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import mapDbBkOutlineRow, {type DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';
import type {Database} from '@/lib/supabase/database';

export interface DbBkBook {
  readonly podId: string;
  readonly subtitle: string;
  readonly summaryMd: string;
  readonly coverStoragePath: string | undefined;
  readonly offlineBundleVersion: number;
}

export interface DbBkAssetType {
  readonly id: string;
  readonly podId: string;
  readonly slug: string;
  readonly label: string;
  readonly sortOrder: number;
  readonly isSystem: boolean;
}

export interface DbBkAssetImage {
  readonly id: string;
  readonly assetId: string;
  readonly podId: string;
  readonly storagePath: string;
  readonly sortOrder: number;
  readonly caption: string | undefined;
}

export interface DbBkAsset {
  readonly id: string;
  readonly podId: string;
  readonly assetTypeId: string;
  readonly name: string;
  readonly descriptionMd: string;
  readonly sortOrder: number;
  readonly images: readonly DbBkAssetImage[];
}

export interface DbBookWorkspace {
  readonly book: DbBkBook;
  readonly outline: readonly DbBkOutlineEntry[];
  readonly assetTypes: readonly DbBkAssetType[];
  readonly assets: readonly DbBkAsset[];
}

export async function loadDbBookWorkspaceWithClient(
  supabase: SupabaseClient<Database>,
  podId: string,
): Promise<DbBookWorkspace | undefined> {
  const bookRes = await supabase.from('bk_book').select('*').eq('pod_id', podId).maybeSingle();
  throwIfSupabaseError(bookRes.error);
  if (bookRes.data === null) {
    return undefined;
  }
  const [outlineRes, typesRes, assetsRes, imagesRes] = await Promise.all([
    supabase.from('bk_outline_entry').select('*').eq('pod_id', podId).order('sort_order'),
    supabase.from('bk_asset_type').select('*').eq('pod_id', podId).order('sort_order'),
    supabase.from('bk_asset').select('*').eq('pod_id', podId).order('sort_order'),
    supabase.from('bk_asset_image').select('*').eq('pod_id', podId).order('sort_order'),
  ]);
  throwIfSupabaseError(outlineRes.error);
  throwIfSupabaseError(typesRes.error);
  throwIfSupabaseError(assetsRes.error);
  throwIfSupabaseError(imagesRes.error);
  const images = imagesRes.data ?? [];
  const assets = (assetsRes.data ?? []).map((row) => ({
    id: row.id,
    podId: row.pod_id,
    assetTypeId: row.asset_type_id,
    name: row.name,
    descriptionMd: row.description_md,
    sortOrder: row.sort_order,
    images: images
      .filter((img) => img.asset_id === row.id)
      .map((img) => ({
        id: img.id,
        assetId: img.asset_id,
        podId: img.pod_id,
        storagePath: img.storage_path,
        sortOrder: img.sort_order,
        caption: img.caption ?? undefined,
      })),
  }));
  return {
    book: {
      podId: bookRes.data.pod_id,
      subtitle: bookRes.data.subtitle,
      summaryMd: bookRes.data.summary_md,
      coverStoragePath: bookRes.data.cover_storage_path ?? undefined,
      offlineBundleVersion: bookRes.data.offline_bundle_version,
    },
    outline: (outlineRes.data ?? []).map((row) => mapDbBkOutlineRow(row)),
    assetTypes: (typesRes.data ?? []).map((row) => ({
      id: row.id,
      podId: row.pod_id,
      slug: row.slug,
      label: row.label,
      sortOrder: row.sort_order,
      isSystem: row.is_system,
    })),
    assets,
  };
}

export default async function loadDbBookWorkspace(podId: string): Promise<DbBookWorkspace | undefined> {
  return loadDbBookWorkspaceWithClient(getSupabaseBrowserClient(), podId);
}
