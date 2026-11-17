import {parseSiteAssetName, siteAssetContentType} from '@so/model';
import {resolveOwnerIdByEmail} from '@/lib/admin/siteAccess';
import {
  createStorageSiteAsset,
  getDbSiteAsset,
  listDbSiteAssets,
  readStorageSiteAsset,
  renameDbSiteAsset,
} from '@/lib/admin/siteAssetAccess';

export const SITE_ASSET_MCP_TOOLS = [
  {
    name: 'sites_list_assets',
    description:
      'List one client’s files and images. Each path is /assets/{name}. Put that path in a section media background when you build a site from a template.',
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
      'Upload a client file (jpg, png, webp, gif, pdf, txt, or md, up to 5MB). name is the SEO file name, such as gel-nails.jpg. Send text for txt and md, or contentBase64 for images and pdf.',
    inputSchema: {
      type: 'object',
      properties: {
        ownerEmail: {type: 'string'},
        name: {type: 'string'},
        text: {type: 'string'},
        contentBase64: {type: 'string'},
      },
      required: ['ownerEmail', 'name'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_download_asset',
    description: 'Read a client asset. Text files return text. Images and pdf return contentBase64 so you can inspect them.',
    inputSchema: {
      type: 'object',
      properties: {ownerEmail: {type: 'string'}, name: {type: 'string'}},
      required: ['ownerEmail', 'name'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_rename_asset',
    description: 'Rename a client asset for SEO. The public path becomes /assets/{nextName}. Keep the same extension kind.',
    inputSchema: {
      type: 'object',
      properties: {ownerEmail: {type: 'string'}, name: {type: 'string'}, nextName: {type: 'string'}},
      required: ['ownerEmail', 'name', 'nextName'],
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
    return assets.map((asset) => ({name: asset.name, path: asset.path, contentType: asset.contentType, byteSize: asset.byteSize}));
  }
  if (name === 'sites_upload_asset') {
    const assetName = textArg(args, 'name');
    const ownerId = await clientIdForEmail(textArg(args, 'ownerEmail'));
    const asset = await createStorageSiteAsset({ownerId, name: assetName, bytes: bytesFromArgs(assetName, args)});
    return {name: asset.name, path: asset.path, contentType: asset.contentType, byteSize: asset.byteSize};
  }
  if (name === 'sites_download_asset') {
    const ownerId = await clientIdForEmail(textArg(args, 'ownerEmail'));
    const asset = await getDbSiteAsset(ownerId, textArg(args, 'name'));
    if (asset === undefined) {
      throw new Error('Asset not found');
    }
    const bytes = await readStorageSiteAsset(asset);
    if (asset.contentType.startsWith('text/')) {
      return {name: asset.name, path: asset.path, contentType: asset.contentType, text: new TextDecoder().decode(bytes)};
    }
    return {name: asset.name, path: asset.path, contentType: asset.contentType, contentBase64: Buffer.from(bytes).toString('base64')};
  }
  if (name === 'sites_rename_asset') {
    const ownerId = await clientIdForEmail(textArg(args, 'ownerEmail'));
    const asset = await renameDbSiteAsset(ownerId, textArg(args, 'name'), textArg(args, 'nextName'));
    return {name: asset.name, path: asset.path, contentType: asset.contentType};
  }
  return undefined;
}
