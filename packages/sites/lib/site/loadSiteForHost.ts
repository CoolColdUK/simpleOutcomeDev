import {
  findSiteDemo,
  isSiteAdminHost,
  parseSiteDocument,
  resolveSiteHost,
  SITE_PRESETS,
  SITE_PRESET_IDS,
  type SiteDocument,
  type SitePresetId,
} from '@so/model';
import {createClient} from '@supabase/supabase-js';
import {cache} from 'react';
import {readSitesPublicEnv, type SitesSupabaseEnv} from '@/lib/env';
import createSitesServiceClient, {sitesServiceEnvReady} from '@/lib/supabase/createSitesServiceClient';

export type LoadedSiteStatus = 'demo' | 'draft' | 'live' | 'archived';

export interface LoadedSite {
  readonly id: string | undefined;
  readonly slug: string;
  readonly customDomain: string | undefined;
  readonly status: LoadedSiteStatus;
  readonly preset: SitePresetId;
  readonly document: SiteDocument;
  readonly demoHost: boolean;
  readonly messagesEnabled: boolean;
}

interface SiteRow {
  id: string;
  slug: string;
  custom_domain: string | null;
  status: string;
  preset: string;
  document: unknown;
  messages_enabled: boolean;
}

function isPresetId(value: string): value is SitePresetId {
  return SITE_PRESET_IDS.some((id) => id === value);
}

function isLoadedStatus(value: string): value is LoadedSiteStatus {
  return value === 'demo' || value === 'draft' || value === 'live' || value === 'archived';
}

function fromDemo(slug: string): LoadedSite | undefined {
  const demo = findSiteDemo(slug);
  if (demo) {
    return {
      slug: demo.slug,
      customDomain: undefined,
      status: 'demo',
      preset: demo.preset,
      document: parseSiteDocument(demo.document),
      demoHost: true,
      id: undefined,
      messagesEnabled: true,
    };
  }
  if (!slug.startsWith('preview-')) {
    return undefined;
  }
  const presetId = slug.slice('preview-'.length);
  if (!isPresetId(presetId)) {
    return undefined;
  }
  return {
    slug,
    customDomain: undefined,
    status: 'demo',
    preset: presetId,
    document: parseSiteDocument(SITE_PRESETS[presetId]),
    demoHost: true,
    id: undefined,
    messagesEnabled: true,
  };
}

function toLoaded(row: SiteRow, document: SiteDocument, demoHost: boolean): LoadedSite | undefined {
  if (!isLoadedStatus(row.status) || !isPresetId(row.preset)) {
    return undefined;
  }
  return {
    slug: row.slug,
    customDomain: row.custom_domain === null ? undefined : row.custom_domain,
    status: row.status,
    preset: row.preset,
    document,
    demoHost,
    id: row.id,
    messagesEnabled: row.messages_enabled,
  };
}

async function fromDemoRow(env: SitesSupabaseEnv, slug: string): Promise<LoadedSite | undefined> {
  const supabase = createClient(env.url, env.anonKey, {auth: {persistSession: false, autoRefreshToken: false}});
  const {data, error} = await supabase
    .from('site')
    .select('id, slug, custom_domain, status, preset, document, messages_enabled')
    .eq('slug', slug)
    .eq('status', 'demo')
    .maybeSingle();
  if (error || !data) {
    return undefined;
  }
  const row = data as SiteRow;
  try {
    return toLoaded(row, parseSiteDocument(row.document), true);
  } catch {
    return undefined;
  }
}

async function fromSlugDraft(slug: string, demoHost: boolean): Promise<LoadedSite | undefined> {
  if (!sitesServiceEnvReady()) {
    return undefined;
  }
  const supabase = createSitesServiceClient();
  const {data: site, error: siteError} = await supabase
    .from('site')
    .select('id, slug, custom_domain, status, preset, document, messages_enabled')
    .eq('slug', slug)
    .maybeSingle();
  if (siteError || !site) {
    return undefined;
  }
  const row = site as SiteRow;
  if (row.status === 'demo') {
    try {
      return toLoaded(row, parseSiteDocument(row.document), true);
    } catch {
      return undefined;
    }
  }
  const {data: draft, error: draftError} = await supabase.from('site_draft').select('document').eq('site_id', row.id).maybeSingle();
  if (draftError || draft === null) {
    return undefined;
  }
  try {
    return toLoaded(row, parseSiteDocument((draft as {document: unknown}).document), demoHost);
  } catch {
    return undefined;
  }
}

async function fromCustomDomain(host: string): Promise<LoadedSite | undefined> {
  if (!sitesServiceEnvReady()) {
    return undefined;
  }
  const supabase = createSitesServiceClient();
  const {data: site, error: siteError} = await supabase
    .from('site')
    .select('id, slug, custom_domain, status, preset, document, messages_enabled')
    .eq('custom_domain', host)
    .eq('status', 'live')
    .maybeSingle();
  if (siteError || !site) {
    return undefined;
  }
  const row = site as SiteRow;
  const {data: revision, error: revisionError} = await supabase
    .from('site_revision')
    .select('document')
    .eq('site_id', row.id)
    .order('version_number', {ascending: false})
    .limit(1)
    .maybeSingle();
  if (revisionError || revision === null) {
    return undefined;
  }
  try {
    return toLoaded(row, parseSiteDocument((revision as {document: unknown}).document), false);
  } catch {
    return undefined;
  }
}

export async function loadSiteForHost(host: string): Promise<LoadedSite | undefined> {
  const env = readSitesPublicEnv();
  if (isSiteAdminHost(host, env.rootDomain)) {
    return undefined;
  }
  const resolved = resolveSiteHost({host, rootDomain: env.rootDomain});
  if (resolved.kind === 'unknown') {
    return undefined;
  }
  if (env.supabase === undefined) {
    if (resolved.kind === 'custom-domain') {
      return undefined;
    }
    return fromDemo(resolved.slug);
  }
  if (resolved.kind === 'custom-domain') {
    return fromCustomDomain(resolved.host);
  }
  const demoHost = resolved.kind === 'demo-subdomain';
  const fromDraft = await fromSlugDraft(resolved.slug, demoHost);
  if (fromDraft !== undefined) {
    return fromDraft;
  }
  return fromDemoRow(env.supabase, resolved.slug);
}

export const loadSiteForHostCached = cache(loadSiteForHost);
