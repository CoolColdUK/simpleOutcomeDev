/**
 * Canonical book MCP tool names for /api/mcp/book tools/list.
 * Keep packages/web/lib/api/mcp/mcpCatalogBook.ts (BOOK_MCP_TOOLS) in sync.
 */
export const BOOK_MCP_TOOL_NAMES = [
  'get_book_workspace',
  'update_book_metadata',
  'create_book_outline_entry',
  'update_book_outline_entry',
  'delete_book_outline_entry',
  'reorder_book_outline',
  'export_book_epub',
  'get_book_offline_bundle',
  'create_book_asset_type',
  'delete_book_asset_type',
  'create_book_asset',
  'update_book_asset',
  'delete_book_asset',
  'upload_book_asset_image',
  'remove_book_asset_image',
  'reorder_book_asset_images',
] as const;

export const BOOK_MCP_ASSET_IMAGE_TOOL_NAMES = [
  'upload_book_asset_image',
  'remove_book_asset_image',
  'reorder_book_asset_images',
] as const;

export const BOOK_MCP_TOOL_COUNT = BOOK_MCP_TOOL_NAMES.length;

export type BookMcpToolName = (typeof BOOK_MCP_TOOL_NAMES)[number];
