import {parseDesignId, parseDesignTemplateItems, parseSiteDocument, siteComponentsList} from '@so/model';
import {callDesignMcpTool, DESIGN_MCP_TOOLS} from '@/lib/admin/designMcp';
import {callSiteAssetMcpTool, SITE_ASSET_MCP_TOOLS} from '@/lib/admin/siteAssetMcp';
import {
  createSiteForOwner,
  loadDraftDocument,
  loadOwnedSiteBySlug,
  resolveOwnerIdByEmail,
  saveDraftDocument,
} from '@/lib/admin/siteAccess';
import {
  createSiteTemplate,
  deleteSiteTemplate,
  getSiteTemplate,
  listSiteTemplates,
  SITE_TEMPLATE_ID_RE,
  templateNameOk,
  updateSiteTemplate,
} from '@/lib/admin/siteTemplateAccess';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

export interface McpTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

const SITE_MCP_TOOLS: readonly McpTool[] = [
  {
    name: 'sites_list_components',
    description: 'List site section types, grouped by category (header, page, footer), and their fields.',
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
    description:
      'Create a draft site for an owner email from templateId. Copies that template unless document is sent. Use a public asset path from sites_list_assets as a media background. Leave private files off the site. Does not publish.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {type: 'string'},
        ownerEmail: {type: 'string'},
        templateId: {type: 'string', description: 'Id of a site template. The new site starts from that template unless document is set.'},
        document: {type: 'object'},
      },
      required: ['slug', 'ownerEmail', 'templateId'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_update_draft',
    description:
      'Replace the working draft for a site. Start from sites_get_template or sites_get_draft, then change copy. Set media backgrounds only to public /assets/{name} paths. Does not publish.',
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
  {
    name: 'sites_list_templates',
    description: 'List admin site templates. A template is a starting SiteDocument, including any header or footer sections.',
    inputSchema: {type: 'object', properties: {}, additionalProperties: false},
  },
  {
    name: 'sites_get_template',
    description: 'Read one site template, including its document.',
    inputSchema: {
      type: 'object',
      properties: {id: {type: 'string'}},
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_create_template',
    description: 'Create a site template. Omit document for a blank page with no header or footer. colourSchemeId links a Chakra colour scheme. items are molecule placements with the content for each slot.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {type: 'string'},
        name: {type: 'string'},
        document: {type: 'object'},
        colourSchemeId: {type: 'string'},
        items: {type: 'array'},
      },
      required: ['id', 'name'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_update_template',
    description: 'Update a site template name, document, colourSchemeId, and/or molecule items. An empty colourSchemeId clears the link. Each item is {id, moleculeId, values}. values map a node path to slot content.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {type: 'string'},
        name: {type: 'string'},
        document: {type: 'object'},
        colourSchemeId: {type: 'string'},
        items: {type: 'array'},
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_delete_template',
    description: 'Delete a site template. Existing sites that were created from it are left unchanged.',
    inputSchema: {
      type: 'object',
      properties: {id: {type: 'string'}},
      required: ['id'],
      additionalProperties: false,
    },
  },
];

export const SITES_MCP_TOOLS: readonly McpTool[] = [...SITE_MCP_TOOLS, ...SITE_ASSET_MCP_TOOLS, ...DESIGN_MCP_TOOLS];

function colourSchemeId(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error('Invalid colour scheme id');
  }
  const id = value.trim().toLowerCase();
  if (id.length === 0) {
    return '';
  }
  return parseDesignId(id);
}

function templateId(value: unknown): string {
  const id = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!SITE_TEMPLATE_ID_RE.test(id)) {
    throw new Error('Invalid template id');
  }
  return id;
}

export async function callSitesMcpTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const asset = await callSiteAssetMcpTool(name, args);
  if (asset !== undefined) {
    return asset;
  }
  const design = await callDesignMcpTool(name, args);
  if (design !== undefined) {
    return design;
  }
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
    const template = await getSiteTemplate(templateId(args.templateId));
    if (template === undefined) {
      throw new Error('Template not found');
    }
    if (ownerEmail.length === 0) {
      throw new Error('ownerEmail is required');
    }
    const ownerId = await resolveOwnerIdByEmail(ownerEmail);
    if (ownerId === undefined) {
      throw new Error('Owner email not found');
    }
    const document = args.document === undefined ? template.document : parseSiteDocument(args.document);
    const site = await createSiteForOwner({slug, ownerId, preset: template.id, document});
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
  if (name === 'sites_list_templates') {
    return {templates: await listSiteTemplates()};
  }
  if (name === 'sites_get_template') {
    const template = await getSiteTemplate(templateId(args.id));
    if (template === undefined) {
      throw new Error('Template not found');
    }
    return {template};
  }
  if (name === 'sites_create_template') {
    const id = templateId(args.id);
    const templateName = typeof args.name === 'string' ? args.name.trim() : '';
    if (!templateNameOk(templateName)) {
      throw new Error('Name is required');
    }
    const document = args.document === undefined ? undefined : parseSiteDocument(args.document);
    const items = args.items === undefined ? undefined : parseDesignTemplateItems(args.items);
    const template = await createSiteTemplate({id, name: templateName, document, colourSchemeId: colourSchemeId(args.colourSchemeId), items});
    return {template};
  }
  if (name === 'sites_update_template') {
    const id = templateId(args.id);
    const templateName = typeof args.name === 'string' ? args.name.trim() : undefined;
    if (templateName !== undefined && !templateNameOk(templateName)) {
      throw new Error('Name is required');
    }
    const document = args.document === undefined ? undefined : parseSiteDocument(args.document);
    const schemeId = colourSchemeId(args.colourSchemeId);
    const items = args.items === undefined ? undefined : parseDesignTemplateItems(args.items);
    if (templateName === undefined && document === undefined && schemeId === undefined && items === undefined) {
      throw new Error('Nothing to update');
    }
    const template = await updateSiteTemplate(id, {name: templateName, document, colourSchemeId: schemeId, items});
    return {template};
  }
  if (name === 'sites_delete_template') {
    await deleteSiteTemplate(templateId(args.id));
    return {ok: true};
  }
  throw new Error(`Unknown tool: ${name}`);
}
