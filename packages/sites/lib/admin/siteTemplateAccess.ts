import {blankSiteDocument, parseDesignTemplateItems, parseSiteDocument, type DesignTemplateItem, type SiteDocument} from '@so/model';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

export const SITE_TEMPLATE_ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export interface SiteTemplateSummary {
  readonly id: string;
  readonly name: string;
  readonly updatedAt: string;
}

export interface SiteTemplateRecord extends SiteTemplateSummary {
  readonly document: SiteDocument;
  readonly colourSchemeId: string | undefined;
  readonly items: readonly DesignTemplateItem[];
}

interface TemplateRow {
  id: string;
  name: string;
  document: unknown;
  updated_at: string;
  colour_scheme_id?: string | null;
  items?: unknown;
}

function colourSchemeIdOf(row: TemplateRow): string | undefined {
  if (row.colour_scheme_id === undefined || row.colour_scheme_id === null || row.colour_scheme_id.length === 0) {
    return undefined;
  }
  return row.colour_scheme_id;
}

function summary(row: {id: string; name: string; updated_at: string}): SiteTemplateSummary {
  return {id: row.id, name: row.name, updatedAt: row.updated_at};
}

export function templateNameOk(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 80;
}

export async function listSiteTemplates(): Promise<readonly SiteTemplateSummary[]> {
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase.from('site_template').select('id, name, updated_at').order('name');
  if (error) {
    throw new Error(error.message || 'Could not list templates');
  }
  return ((data ?? []) as {id: string; name: string; updated_at: string}[]).map(summary);
}

export async function getSiteTemplate(id: string): Promise<SiteTemplateRecord | undefined> {
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase.from('site_template').select('id, name, document, updated_at, colour_scheme_id, items').eq('id', id).maybeSingle();
  if (error || data === null) {
    return undefined;
  }
  const row = data as TemplateRow;
  return {...summary(row), document: parseSiteDocument(row.document), colourSchemeId: colourSchemeIdOf(row), items: parseDesignTemplateItems(row.items ?? [])};
}

export async function createSiteTemplate(input: {
  readonly id: string;
  readonly name: string;
  readonly document?: SiteDocument;
  readonly colourSchemeId?: string;
  readonly items?: readonly DesignTemplateItem[];
}): Promise<SiteTemplateRecord> {
  const document = input.document ?? blankSiteDocument(input.name.trim());
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_template')
    .insert({
      id: input.id,
      name: input.name.trim(),
      document,
      ...(input.colourSchemeId === undefined ? {} : {colour_scheme_id: input.colourSchemeId.length === 0 ? null : input.colourSchemeId}),
      ...(input.items === undefined ? {} : {items: input.items}),
    })
    .select('id, name, document, updated_at, colour_scheme_id, items')
    .single();
  if (error || data === null) {
    if (error?.code === '23505') {
      throw new Error('Template id already exists');
    }
    throw new Error(error?.message || 'Could not create template');
  }
  const row = data as TemplateRow;
  return {...summary(row), document: parseSiteDocument(row.document), colourSchemeId: colourSchemeIdOf(row), items: parseDesignTemplateItems(row.items ?? [])};
}

export async function updateSiteTemplate(
  id: string,
  input: {readonly name?: string; readonly document?: SiteDocument; readonly colourSchemeId?: string; readonly items?: readonly DesignTemplateItem[]},
): Promise<SiteTemplateRecord> {
  const patch = {
    ...(input.name === undefined ? {} : {name: input.name.trim()}),
    ...(input.document === undefined ? {} : {document: input.document}),
    ...(input.colourSchemeId === undefined
      ? {}
      : {colour_scheme_id: input.colourSchemeId.length === 0 ? null : input.colourSchemeId}),
    ...(input.items === undefined ? {} : {items: input.items}),
  };
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_template')
    .update(patch)
    .eq('id', id)
    .select('id, name, document, updated_at, colour_scheme_id, items')
    .maybeSingle();
  if (error || data === null) {
    throw new Error(error?.message || 'Template not found');
  }
  const row = data as TemplateRow;
  return {...summary(row), document: parseSiteDocument(row.document), colourSchemeId: colourSchemeIdOf(row), items: parseDesignTemplateItems(row.items ?? [])};
}

export async function deleteSiteTemplate(id: string): Promise<void> {
  const supabase = createSitesServiceClient();
  const {error} = await supabase.from('site_template').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Could not delete template');
  }
}
