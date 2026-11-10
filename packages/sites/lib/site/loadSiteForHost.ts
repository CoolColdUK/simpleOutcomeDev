import {findSiteDemo, parseSiteDocument, resolveSiteHost, SITE_PRESETS, SITE_PRESET_IDS, type SiteDocument, type SitePresetId} from '@so/model';
import {createClient} from '@supabase/supabase-js';
import {cache} from 'react';
import {readSitesPublicEnv, type SitesSupabaseEnv} from '@/lib/env';

export interface LoadedSite {
  readonly slug: string;
  readonly customDomain: string | undefined;
  readonly status: 'demo' | 'live';
  readonly preset: SitePresetId;
  readonly document: SiteDocument;
  readonly demoHost: boolean;
}

interface SiteRow {
  slug: string;
  custom_domain: string | null;
  status: string;
  preset: string;
  document: unknown;
}

function isPresetId(value: string): value is SitePresetId {
  return SITE_PRESET_IDS.some((id) => id === value);
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
  };
}

async function fromSupabase(env: SitesSupabaseEnv, column: 'slug' | 'custom_domain', value: string, demoHost: boolean): Promise<LoadedSite | undefined> {
  const supabase = createClient(env.url, env.anonKey, {auth: {persistSession: false, autoRefreshToken: false}});
  const {data, error} = await supabase.from('site').select('slug, custom_domain, status, preset, document').eq(column, value).maybeSingle();
  if (error) {
    throw new Error('Could not load site');
  }
  if (!data) {
    return undefined;
  }
  const row = data as SiteRow;
  if ((row.status !== 'demo' && row.status !== 'live') || !isPresetId(row.preset)) {
    throw new Error('Site row is invalid');
  }
  const document = parseSiteDocument(row.document);
  return {
    slug: row.slug,
    customDomain: row.custom_domain === null ? undefined : row.custom_domain,
    status: row.status,
    preset: row.preset,
    document,
    demoHost,
  };
}

export async function loadSiteForHost(host: string): Promise<LoadedSite | undefined> {
  const env = readSitesPublicEnv();
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
    return fromSupabase(env.supabase, 'custom_domain', resolved.host, false);
  }
  return fromSupabase(env.supabase, 'slug', resolved.slug, resolved.kind === 'demo-subdomain');
}

export const loadSiteForHostCached = cache(loadSiteForHost);
