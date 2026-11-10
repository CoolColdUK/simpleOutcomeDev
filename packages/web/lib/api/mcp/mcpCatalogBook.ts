import type {AgentResult} from '@/lib/api/agent/agentResult';
import type {McpTool} from '@/lib/api/mcp/mcpCatalog';

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
  createAgentBookOutlineEntry,
  deleteAgentBookOutlineEntry,
  exportAgentBookEpub,
  getAgentBookOfflineBundle,
  getAgentBookWorkspace,
  reorderAgentBookOutline,
  updateAgentBookMetadata,
  updateAgentBookOutlineEntry,
} from '@/lib/api/agent/bookAgent';

const podId = {type: 'string', description: 'Pod id'};

export const BOOK_MCP_TOOLS: readonly McpTool[] = [
  tool('get_book_workspace', 'Load book workspace (metadata, outline, assets).', {podId}, ['podId'], (request, args) =>
    getAgentBookWorkspace(request, args),
  ),
  tool(
    'update_book_metadata',
    'Update subtitle, summary markdown, or cover storage path.',
    {podId, subtitle: {type: 'string'}, summaryMd: {type: 'string'}, coverStoragePath: {type: 'string'}},
    ['podId'],
    (request, args) => updateAgentBookMetadata(request, args),
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
    (request, args) => createAgentBookOutlineEntry(request, args),
  ),
  tool(
    'update_book_outline_entry',
    'Update chapter/note fields.',
    {podId, entryId: {type: 'string'}, title: {type: 'string'}, summaryMd: {type: 'string'}, contentMd: {type: 'string'}, status: {type: 'string'}},
    ['podId', 'entryId'],
    (request, args) => updateAgentBookOutlineEntry(request, args),
  ),
  tool('delete_book_outline_entry', 'Delete chapter or note.', {podId, entryId: {type: 'string'}}, ['podId', 'entryId'], (request, args) =>
    deleteAgentBookOutlineEntry(request, args),
  ),
  tool(
    'reorder_book_outline',
    'Reorder outline entries; chapter and note numbers renumber automatically.',
    {podId, orderedIds: {type: 'array', items: {type: 'string'}}},
    ['podId', 'orderedIds'],
    (request, args) => reorderAgentBookOutline(request, args),
  ),
  tool('export_book_epub', 'Export EPUB 3 (placeholder cover if missing).', {podId, includeNotes: {type: 'boolean'}}, ['podId'], (request, args) =>
    exportAgentBookEpub(request, args),
  ),
  tool('get_book_offline_bundle', 'Offline read bundle with signed image URLs.', {podId}, ['podId'], (request, args) =>
    getAgentBookOfflineBundle(request, args),
  ),
];
