import {
  parseSiteDocument,
  SITE_PRESET_IDS,
  SITE_PRESETS,
  siteComponentsList,
  type SitePresetId,
} from '@so/model';
import {createSiteForOwner, loadDraftDocument, loadOwnedSiteBySlug, saveDraftDocument} from '@/lib/admin/siteAccess';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

export interface McpTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

export const SITES_MCP_TOOLS: readonly McpTool[] = [
  {
    name: 'sites_list_components',
    description: 'List site section types, their fields, and preset ids for building a SiteDocument.',
    inputSchema: {type: 'object', properties: {}, additionalProperties: false},
  },
  {
    name: 'sites_list_sites',
    description: 'List client sites with slug, owner email, status, and whether a published snapshot exists.',
    inputSchema: {type: 'object', properties: {}, additionalProperties: false},
  },
  {
    name: 'sites_get_draft',
    description: 'Return the working draft document for a site slug.',
    inputSchema: {
      type: 'object',
      properties: {slug: {type: 'string'}},
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_create_site',
    description: 'Create a draft site for an owner email. Does not publish.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {type: 'string'},
        ownerEmail: {type: 'string'},
        preset: {type: 'string'},
        document: {type: 'object'},
      },
      required: ['slug', 'ownerEmail', 'preset'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_update_draft',
    description: 'Replace the working draft document for a site. Does not publish.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {type: 'string'},
        document: {type: 'object'},
      },
      required: ['slug', 'document'],
      additionalProperties: false,
    },
  },
];

function isPresetId(value: string): value is SitePresetId {
  return SITE_PRESET_IDS.some((id) => id === value);
}

export async function callSitesMcpTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === 'sites_list_components') {
    return siteComponentsList();
  }
  if (name === 'sites_list_sites') {
    const supabase = createSitesServiceClient();
    const {data, error} = await supabase
      .from('site')
      .select('id, slug, status, owner_id')
      .neq('status', 'demo')
      .order('slug');
    if (error) {
      throw new Error('Could not list sites');
    }
    const rows = (data ?? []) as {id: string; slug: string; status: string; owner_id: string | null}[];
    const ownerIds = [...new Set(rows.map((row) => row.owner_id).filter((id): id is string => id !== null))];
    const emailById = new Map<string, string>();
    if (ownerIds.length > 0) {
      const {data: users} = await supabase.from('site_user').select('id, email').in('id', ownerIds);
      ((users ?? []) as {id: string; email: string}[]).forEach((user) => emailById.set(user.id, user.email));
    }
    const withPublished = await Promise.all(
      rows.map(async (row) => {
        const {data: rev} = await supabase
          .from('site_revision')
          .select('version_number')
          .eq('site_id', row.id)
          .limit(1)
          .maybeSingle();
        return {
          slug: row.slug,
          status: row.status,
          ownerEmail: row.owner_id === null ? null : (emailById.get(row.owner_id) ?? null),
          hasPublished: rev !== null,
        };
      }),
    );
    return {sites: withPublished};
  }
  if (name === 'sites_get_draft') {
    const slug = typeof args.slug === 'string' ? args.slug : '';
    const site = await loadOwnedSiteBySlug(slug);
    if (site === undefined) {
      throw new Error('Site not found');
    }
    const document = await loadDraftDocument(site.id);
    if (document === undefined) {
      throw new Error('Draft not found');
    }
    return {slug: site.slug, status: site.status, document};
  }
  if (name === 'sites_create_site') {
    const slug = typeof args.slug === 'string' ? args.slug.trim().toLowerCase() : '';
    const ownerEmail = typeof args.ownerEmail === 'string' ? args.ownerEmail.trim().toLowerCase() : '';
    const presetRaw = typeof args.preset === 'string' ? args.preset : '';
    if (!isPresetId(presetRaw)) {
      throw new Error('Invalid preset');
    }
    const document =
      args.document === undefined ? parseSiteDocument(SITE_PRESETS[presetRaw]) : parseSiteDocument(args.document);
    const site = await createSiteForOwner({slug, ownerEmail, preset: presetRaw, document});
    return {site: {slug: site.slug, status: site.status, ownerId: site.owner_id}};
  }
  if (name === 'sites_update_draft') {
    const slug = typeof args.slug === 'string' ? args.slug : '';
    const site = await loadOwnedSiteBySlug(slug);
    if (site === undefined) {
      throw new Error('Site not found');
    }
    const document = parseSiteDocument(args.document);
    await saveDraftDocument(site.id, document);
    return {ok: true, slug: site.slug};
  }
  throw new Error(`Unknown tool: ${name}`);
}
