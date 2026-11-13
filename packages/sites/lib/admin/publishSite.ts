import {nextSiteRevisionNumber, parseSiteDocument, type SiteDocument} from '@so/model';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';
import {loadDraftDocument} from '@/lib/admin/siteAccess';

export async function publishSite(siteId: string, publishedBy: string): Promise<{versionNumber: number}> {
  const draft = await loadDraftDocument(siteId);
  if (draft === undefined) {
    throw new Error('Draft not found');
  }
  const document = parseSiteDocument(draft);
  const supabase = createSitesServiceClient();
  const {data: latest} = await supabase
    .from('site_revision')
    .select('version_number')
    .eq('site_id', siteId)
    .order('version_number', {ascending: false})
    .limit(1)
    .maybeSingle();
  const versionNumber = nextSiteRevisionNumber(
    latest === null ? undefined : (latest as {version_number: number}).version_number,
  );
  const {error: revError} = await supabase.from('site_revision').insert({
    site_id: siteId,
    version_number: versionNumber,
    document,
    published_by: publishedBy,
  });
  if (revError) {
    throw new Error('Could not publish');
  }
  const {error: siteError} = await supabase.from('site').update({status: 'live'}).eq('id', siteId);
  if (siteError) {
    throw new Error('Could not mark site live');
  }
  return {versionNumber};
}

export async function revertSite(siteId: string, versionNumber: number, publishedBy: string): Promise<{versionNumber: number}> {
  const supabase = createSitesServiceClient();
  const {data: source, error} = await supabase
    .from('site_revision')
    .select('document')
    .eq('site_id', siteId)
    .eq('version_number', versionNumber)
    .maybeSingle();
  if (error || source === null) {
    throw new Error('Revision not found');
  }
  const document = parseSiteDocument((source as {document: unknown}).document);
  const {data: latest} = await supabase
    .from('site_revision')
    .select('version_number')
    .eq('site_id', siteId)
    .order('version_number', {ascending: false})
    .limit(1)
    .maybeSingle();
  const next = nextSiteRevisionNumber(
    latest === null ? undefined : (latest as {version_number: number}).version_number,
  );
  const {error: revError} = await supabase.from('site_revision').insert({
    site_id: siteId,
    version_number: next,
    document,
    published_by: publishedBy,
  });
  if (revError) {
    throw new Error('Could not revert');
  }
  const {error: siteError} = await supabase.from('site').update({status: 'live'}).eq('id', siteId);
  if (siteError) {
    throw new Error('Could not mark site live');
  }
  return {versionNumber: next};
}

export async function archiveSite(siteId: string): Promise<void> {
  const supabase = createSitesServiceClient();
  const {error} = await supabase.from('site').update({status: 'archived'}).eq('id', siteId);
  if (error) {
    throw new Error('Could not archive site');
  }
}

export async function listRevisions(siteId: string): Promise<
  readonly {version_number: number; published_at: string; published_by: string; document: SiteDocument}[]
> {
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_revision')
    .select('version_number, published_at, published_by, document')
    .eq('site_id', siteId)
    .order('version_number', {ascending: false});
  if (error) {
    throw new Error('Could not list revisions');
  }
  return ((data ?? []) as {version_number: number; published_at: string; published_by: string; document: unknown}[]).map(
    (row) => ({
      version_number: row.version_number,
      published_at: row.published_at,
      published_by: row.published_by,
      document: parseSiteDocument(row.document),
    }),
  );
}
