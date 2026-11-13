import {parseSiteDocument, type SiteDocument, type SitePresetId} from '@so/model';
import type {SiteSessionContext} from '@/lib/admin/siteSession';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

export interface OwnedSiteRow {
  readonly id: string;
  readonly slug: string;
  readonly custom_domain: string | null;
  readonly status: string;
  readonly preset: string;
  readonly owner_id: string | null;
  readonly messages_enabled: boolean;
}

export function canManageSite(session: SiteSessionContext, site: OwnedSiteRow): boolean {
  if (site.owner_id === session.user.id) {
    return true;
  }
  return session.impersonator === undefined && session.user.is_admin;
}

export async function loadOwnedSiteBySlug(slug: string): Promise<OwnedSiteRow | undefined> {
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site')
    .select('id, slug, custom_domain, status, preset, owner_id, messages_enabled')
    .eq('slug', slug)
    .maybeSingle();
  if (error || data === null) {
    return undefined;
  }
  return data as OwnedSiteRow;
}

export async function loadDraftDocument(siteId: string): Promise<SiteDocument | undefined> {
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase.from('site_draft').select('document').eq('site_id', siteId).maybeSingle();
  if (error || data === null) {
    return undefined;
  }
  return parseSiteDocument((data as {document: unknown}).document);
}

export async function listSitesForUser(userId: string, isAdmin: boolean) {
  const supabase = createSitesServiceClient();
  let query = supabase
    .from('site')
    .select('id, slug, custom_domain, status, preset, owner_id, messages_enabled')
    .neq('status', 'demo')
    .order('slug');
  if (!isAdmin) {
    query = query.eq('owner_id', userId);
  }
  const {data, error} = await query;
  if (error) {
    throw new Error('Could not list sites');
  }
  return (data ?? []) as OwnedSiteRow[];
}

export interface CreateSiteInput {
  readonly slug: string;
  readonly ownerEmail: string;
  readonly preset: SitePresetId;
  readonly document: SiteDocument;
  readonly customDomain?: string;
}

export async function createSiteForOwner(input: CreateSiteInput): Promise<OwnedSiteRow> {
  const supabase = createSitesServiceClient();
  const {data: owner, error: ownerError} = await supabase
    .from('site_user')
    .select('id')
    .eq('email', input.ownerEmail.trim().toLowerCase())
    .maybeSingle();
  if (ownerError || owner === null) {
    throw new Error('Owner email not found');
  }
  const ownerId = (owner as {id: string}).id;
  const {data: site, error: siteError} = await supabase
    .from('site')
    .insert({
      slug: input.slug,
      status: 'draft',
      preset: input.preset,
      document: input.document,
      owner_id: ownerId,
      custom_domain: input.customDomain ?? null,
      messages_enabled: false,
    })
    .select('id, slug, custom_domain, status, preset, owner_id, messages_enabled')
    .single();
  if (siteError || site === null) {
    if (siteError?.code === '23505') {
      throw new Error('Slug or custom domain already in use');
    }
    throw new Error('Could not create site');
  }
  const row = site as OwnedSiteRow;
  const {error: draftError} = await supabase.from('site_draft').insert({site_id: row.id, document: input.document});
  if (draftError) {
    await supabase.from('site').delete().eq('id', row.id);
    throw new Error('Could not create draft');
  }
  return row;
}

export async function saveDraftDocument(siteId: string, document: SiteDocument): Promise<void> {
  const supabase = createSitesServiceClient();
  const {error} = await supabase.from('site_draft').upsert({site_id: siteId, document});
  if (error) {
    throw new Error('Could not save draft');
  }
}
