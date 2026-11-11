import {
  BOOK_MCP_ASSET_IMAGE_TOOL_NAMES,
  BOOK_MCP_TOOL_COUNT,
  BOOK_MCP_TOOL_NAMES,
} from './bookMcpToolCatalog';

describe('book MCP tool catalog', () => {
  it('lists every book tool name in order', () => {
    expect([...BOOK_MCP_TOOL_NAMES]).toEqual([
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
    ]);
  });

  it('documents asset image tools as a subset', () => {
    expect([...BOOK_MCP_ASSET_IMAGE_TOOL_NAMES]).toEqual([
      'upload_book_asset_image',
      'remove_book_asset_image',
      'reorder_book_asset_images',
    ]);
    for (const name of BOOK_MCP_ASSET_IMAGE_TOOL_NAMES) {
      expect(BOOK_MCP_TOOL_NAMES).toContain(name);
    }
  });

  it('keeps tool count aligned with the name list', () => {
    expect(BOOK_MCP_TOOL_COUNT).toBe(BOOK_MCP_TOOL_NAMES.length);
    expect(BOOK_MCP_TOOL_COUNT).toBe(16);
  });
});
