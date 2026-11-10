import type {McpTool} from '@/lib/api/mcp/mcpCatalog';

function argsRecord(args: unknown): Record<string, unknown> {
  return typeof args === 'object' && args !== null && !Array.isArray(args) ? (args as Record<string, unknown>) : {};
}

function tool(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: readonly string[],
  run: McpTool['run'],
): McpTool {
  return {name, description, inputSchema: {type: 'object', properties, required}, run};
}
import {
  createAgentBookAsset,
  createAgentBookAssetType,
  createAgentBookOutlineEntry,
  deleteAgentBookAsset,
  deleteAgentBookAssetType,
  deleteAgentBookOutlineEntry,
  exportAgentBookEpub,
  getAgentBookOfflineBundle,
  getAgentBookWorkspace,
  reorderAgentBookOutline,
  updateAgentBookAsset,
  updateAgentBookMetadata,
  updateAgentBookOutlineEntry,
} from '@/lib/api/agent/bookAgent';

const podId = {type: 'string', description: 'Pod id'};

export const BOOK_MCP_TOOLS: readonly McpTool[] = [
  tool('get_book_workspace', 'Load book workspace (metadata, outline, assets).', {podId}, ['podId'], (request, args) =>
    getAgentBookWorkspace(request, argsRecord(args)),
  ),
  tool(
    'update_book_metadata',
    'Update subtitle, summary markdown, or cover storage path.',
    {podId, subtitle: {type: 'string'}, summaryMd: {type: 'string'}, coverStoragePath: {type: 'string'}},
    ['podId'],
    (request, args) => updateAgentBookMetadata(request, argsRecord(args)),
  ),
  tool(
    'create_book_outline_entry',
    'Create a chapter or note. Read summaries before generating content.',
    {
      podId,
      kind: {type: 'string', description: 'chapter | note'},
      title: {type: 'string'},
      summaryMd: {type: 'string'},
      contentMd: {type: 'string'},
      status: {type: 'string'},
    },
    ['podId', 'kind'],
    (request, args) => createAgentBookOutlineEntry(request, argsRecord(args)),
  ),
  tool(
    'update_book_outline_entry',
    'Update chapter/note fields.',
    {
      podId,
      entryId: {type: 'string'},
      title: {type: 'string'},
      summaryMd: {type: 'string'},
      contentMd: {type: 'string'},
      status: {type: 'string'},
      chapterImageStoragePath: {type: 'string'},
    },
    ['podId', 'entryId'],
    (request, args) => updateAgentBookOutlineEntry(request, argsRecord(args)),
  ),
  tool('delete_book_outline_entry', 'Delete chapter or note.', {podId, entryId: {type: 'string'}}, ['podId', 'entryId'], (request, args) =>
    deleteAgentBookOutlineEntry(request, argsRecord(args)),
  ),
  tool(
    'reorder_book_outline',
    'Reorder outline entries; chapter and note numbers renumber automatically.',
    {podId, orderedIds: {type: 'array', items: {type: 'string'}}},
    ['podId', 'orderedIds'],
    (request, args) => reorderAgentBookOutline(request, argsRecord(args)),
  ),
  tool(
    'export_book_epub',
    'Export EPUB 3 (placeholder cover if missing). exportScope: all | chapters | notes.',
    {podId, exportScope: {type: 'string'}, includeNotes: {type: 'boolean'}},
    ['podId'],
    (request, args) =>
    exportAgentBookEpub(request, argsRecord(args)),
  ),
  tool('get_book_offline_bundle', 'Offline read bundle with signed image URLs.', {podId}, ['podId'], (request, args) =>
    getAgentBookOfflineBundle(request, argsRecord(args)),
  ),
  tool(
    'create_book_asset_type',
    'Create a custom asset type (characters, items, locations, and other are seeded).',
    {podId, label: {type: 'string'}, slug: {type: 'string'}},
    ['podId', 'label'],
    (request, args) => createAgentBookAssetType(request, argsRecord(args)),
  ),
  tool(
    'delete_book_asset_type',
    'Delete a custom asset type when it has no assets.',
    {podId, assetTypeId: {type: 'string'}},
    ['podId', 'assetTypeId'],
    (request, args) => deleteAgentBookAssetType(request, argsRecord(args)),
  ),
  tool(
    'create_book_asset',
    'Create an asset in an asset type. Response includes images[] and deprecated imageStoragePath (first image).',
    {podId, assetTypeId: {type: 'string'}, name: {type: 'string'}, descriptionMd: {type: 'string'}},
    ['podId', 'assetTypeId'],
    (request, args) => createAgentBookAsset(request, argsRecord(args)),
  ),
  tool(
    'update_book_asset',
    'Update asset name or description markdown. Response includes images[] and deprecated imageStoragePath.',
    {podId, assetId: {type: 'string'}, name: {type: 'string'}, descriptionMd: {type: 'string'}},
    ['podId', 'assetId'],
    (request, args) => updateAgentBookAsset(request, argsRecord(args)),
  ),
  tool('delete_book_asset', 'Delete an asset.', {podId, assetId: {type: 'string'}}, ['podId', 'assetId'], (request, args) =>
    deleteAgentBookAsset(request, argsRecord(args)),
  ),
];
