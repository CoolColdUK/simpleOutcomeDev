import {parseSiteAssetName, siteAssetContentType} from '@so/model';
import {resolveOwnerIdByEmail} from '@/lib/admin/siteAccess';
import {
  createStorageSiteAsset,
  getDbSiteAsset,
  listDbSiteAssets,
  readStorageSiteAsset,
  renameDbSiteAsset,
  updateDbSiteAsset,
  type SiteAssetRecord,
} from '@/lib/admin/siteAssetAccess';

export const SITE_ASSET_MCP_TOOLS = [
  {
    name: 'sites_list_assets',
    description:
      'List one client’s files. Read description and visibility first. Download a file only when the description is not enough. A public asset includes path /assets/{name} and can be used on the website. A private asset is a contract or gathered notes and must stay off the website.',
    inputSchema: {
      type: 'object',
      properties: {ownerEmail: {type: 'string'}},
      required: ['ownerEmail'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_upload_asset',
    description:
      'Upload a client file (jpg, png, webp, gif, pdf, txt, or md, up to 5MB). description says what it is, such as a shop-front photo, a signed contract, or notes gathered about the business. visibility is private or public. Public files can be used on the website. Send text for txt and md, or contentBase64 for images and pdf.',
    inputSchema: {
      type: 'object',
      properties: {
        ownerEmail: {type: 'string'},
        name: {type: 'string'},
        description: {type: 'string'},
        visibility: {type: 'string', enum: ['private', 'public']},
        text: {type: 'string'},
        contentBase64: {type: 'string'},
      },
      required: ['ownerEmail', 'name', 'description', 'visibility'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_download_asset',
    description: 'Read a client file when its description is not enough. Text files return text. Images and pdf return contentBase64.',
    inputSchema: {
      type: 'object',
      properties: {ownerEmail: {type: 'string'}, name: {type: 'string'}},
      required: ['ownerEmail', 'name'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_rename_asset',
    description: 'Rename a client file for SEO. A public file is then served at /assets/{nextName}. Keep the same extension kind.',
    inputSchema: {
      type: 'object',
      properties: {ownerEmail: {type: 'string'}, name: {type: 'string'}, nextName: {type: 'string'}},
      required: ['ownerEmail', 'name', 'nextName'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_update_asset',
    description: 'Change a file description, mark it private or public, or both. Private files stay off the website. Public files can be placed in the site.',
    inputSchema: {
      type: 'object',
      properties: {
        ownerEmail: {type: 'string'},
        name: {type: 'string'},
        description: {type: 'string'},
        visibility: {type: 'string', enum: ['private', 'public']},
      },
      required: ['ownerEmail', 'name'],
      additionalProperties: false,
    },
  },
] as const;

async function clientIdForEmail(email: string): Promise<string> {
  const id = await resolveOwnerIdByEmail(email);
  if (id === undefined) {
    throw new Error('No client account uses that email');
  }
  return id;
}

function textArg(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function assetSummary(asset: SiteAssetRecord): {name: string; description: string; visibility: string; contentType: string; byteSize: number; path?: string} {
  return {
    name: asset.name,
    description: asset.description,
    visibility: asset.visibility,
    contentType: asset.contentType,
    byteSize: asset.byteSize,
    ...(asset.path === undefined ? {} : {path: asset.path}),
  };
}

function bytesFromArgs(name: string, args: Record<string, unknown>): Uint8Array {
  const contentType = siteAssetContentType(parseSiteAssetName(name));
  if (typeof args.text === 'string') {
    if (!contentType.startsWith('text/')) {
      throw new Error('Send contentBase64 for images and pdf files');
    }
    return new TextEncoder().encode(args.text);
  }
  if (typeof args.contentBase64 !== 'string' || args.contentBase64.trim().length === 0) {
    throw new Error('Send text or contentBase64');
  }
  return Uint8Array.from(Buffer.from(args.contentBase64, 'base64'));
}

export async function callSiteAssetMcpTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === 'sites_list_assets') {
    const ownerId = await clientIdForEmail(textArg(args, 'ownerEmail'));
    const assets = await listDbSiteAssets(ownerId);
    return assets.map(assetSummary);
  }
  if (name === 'sites_upload_asset') {
    const assetName = textArg(args, 'name');
    const ownerId = await clientIdForEmail(textArg(args, 'ownerEmail'));
    const asset = await createStorageSiteAsset({
      ownerId,
      name: assetName,
      description: textArg(args, 'description'),
      visibility: textArg(args, 'visibility'),
      bytes: bytesFromArgs(assetName, args),
    });
    return assetSummary(asset);
  }
  if (name === 'sites_download_asset') {
    const ownerId = await clientIdForEmail(textArg(args, 'ownerEmail'));
    const asset = await getDbSiteAsset(ownerId, textArg(args, 'name'));
    if (asset === undefined) {
      throw new Error('Asset not found');
    }
    const bytes = await readStorageSiteAsset(asset);
    if (asset.contentType.startsWith('text/')) {
      return {...assetSummary(asset), text: new TextDecoder().decode(bytes)};
    }
    return {...assetSummary(asset), contentBase64: Buffer.from(bytes).toString('base64')};
  }
  if (name === 'sites_rename_asset') {
    const ownerId = await clientIdForEmail(textArg(args, 'ownerEmail'));
    const asset = await renameDbSiteAsset(ownerId, textArg(args, 'name'), textArg(args, 'nextName'));
    return assetSummary(asset);
  }
  if (name === 'sites_update_asset') {
    const description = typeof args.description === 'string' ? args.description : undefined;
    const visibility = typeof args.visibility === 'string' ? args.visibility : undefined;
    if (description === undefined && visibility === undefined) {
      throw new Error('Send a description or a visibility');
    }
    const ownerId = await clientIdForEmail(textArg(args, 'ownerEmail'));
    const asset = await updateDbSiteAsset(ownerId, textArg(args, 'name'), {description, visibility});
    return assetSummary(asset);
  }
  return undefined;
}
