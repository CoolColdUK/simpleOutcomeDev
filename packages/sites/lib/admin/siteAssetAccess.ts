import {parseSiteAssetName, siteAssetContentType, siteAssetPath} from '@so/model';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

const BUCKET = 'site-private';
const MAX_BYTES = 5_000_000;

export interface SiteAssetRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly path: string;
}

interface SiteAssetRow {
  id: string;
  owner_id: string;
  name: string;
  content_type: string;
  byte_size: number;
}

function toRecord(row: SiteAssetRow): SiteAssetRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    contentType: row.content_type,
    byteSize: row.byte_size,
    path: siteAssetPath(row.name),
  };
}

export function copySiteAssetBytes(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function storagePath(asset: Pick<SiteAssetRecord, 'ownerId' | 'id'>): string {
  return `${asset.ownerId}/${asset.id}`;
}

export async function listDbSiteAssets(ownerId: string): Promise<readonly SiteAssetRecord[]> {
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_asset')
    .select('id, owner_id, name, content_type, byte_size')
    .eq('owner_id', ownerId)
    .order('name', {ascending: true});
  if (error) {
    throw new Error(error.message);
  }
  return ((data ?? []) as SiteAssetRow[]).map(toRecord);
}

export async function getDbSiteAsset(ownerId: string, name: string): Promise<SiteAssetRecord | undefined> {
  const parsed = parseSiteAssetName(name);
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_asset')
    .select('id, owner_id, name, content_type, byte_size')
    .eq('owner_id', ownerId)
    .eq('name', parsed)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (data === null) {
    return undefined;
  }
  return toRecord(data as SiteAssetRow);
}

export async function readStorageSiteAsset(asset: SiteAssetRecord): Promise<Uint8Array> {
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase.storage.from(BUCKET).download(storagePath(asset));
  if (error || data === null) {
    throw new Error(error?.message ?? 'Asset file is missing');
  }
  return new Uint8Array(await data.arrayBuffer());
}

export async function createStorageSiteAsset(input: {
  readonly ownerId: string;
  readonly name: string;
  readonly bytes: Uint8Array;
}): Promise<SiteAssetRecord> {
  const name = parseSiteAssetName(input.name);
  const contentType = siteAssetContentType(name);
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_BYTES) {
    throw new Error('File must be between 1 byte and 5MB');
  }
  const supabase = createSitesServiceClient();
  const {data: owner, error: ownerError} = await supabase.from('site_user').select('id').eq('id', input.ownerId).maybeSingle();
  if (ownerError || owner === null) {
    throw new Error('Choose a client account for this file');
  }
  const id = crypto.randomUUID();
  const path = `${input.ownerId}/${id}`;
  const {error: uploadError} = await supabase.storage.from(BUCKET).upload(path, input.bytes, {contentType, upsert: false});
  if (uploadError) {
    throw new Error(uploadError.message);
  }
  const {data, error} = await supabase
    .from('site_asset')
    .insert({
      id,
      owner_id: input.ownerId,
      name,
      content_type: contentType,
      byte_size: input.bytes.byteLength,
    })
    .select('id, owner_id, name, content_type, byte_size')
    .single();
  if (error || data === null) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(error?.message ?? 'Could not save the asset');
  }
  return toRecord(data as SiteAssetRow);
}

export async function renameDbSiteAsset(ownerId: string, name: string, nextName: string): Promise<SiteAssetRecord> {
  const current = await getDbSiteAsset(ownerId, name);
  if (current === undefined) {
    throw new Error('Asset not found');
  }
  const renamed = parseSiteAssetName(nextName);
  if (siteAssetContentType(renamed) !== current.contentType) {
    throw new Error('Keep the same kind of file when renaming, such as .jpg to .jpg');
  }
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_asset')
    .update({name: renamed})
    .eq('id', current.id)
    .select('id, owner_id, name, content_type, byte_size')
    .single();
  if (error || data === null) {
    throw new Error(error?.message ?? 'Could not rename the asset');
  }
  return toRecord(data as SiteAssetRow);
}

export async function ownerIdForAssetHost(input: {readonly slug?: string; readonly customDomain?: string}): Promise<string | undefined> {
  if (input.slug === undefined && input.customDomain === undefined) {
    return undefined;
  }
  const supabase = createSitesServiceClient();
  const query = supabase.from('site').select('owner_id');
  const filtered = input.slug !== undefined ? query.eq('slug', input.slug) : query.eq('custom_domain', input.customDomain ?? '');
  const {data, error} = await filtered.maybeSingle();
  if (error || data === null) {
    return undefined;
  }
  const ownerId = (data as {owner_id: string | null}).owner_id;
  return ownerId === null ? undefined : ownerId;
}
