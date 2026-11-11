/** Keep in sync with packages/web/lib/api/mcp/mcpCatalogBook.ts (BOOK_MCP_TOOLS). */
export const BOOK_MCP_ASSET_IMAGE_TOOL_NAMES = [
  'upload_book_asset_image',
  'remove_book_asset_image',
  'reorder_book_asset_images',
] as const;

export const BOOK_MCP_TOOL_COUNT = 16;

describe('book MCP asset image tools', () => {
  it('documents the three asset image tool names', () => {
    expect(BOOK_MCP_ASSET_IMAGE_TOOL_NAMES).toEqual([
      'upload_book_asset_image',
      'remove_book_asset_image',
      'reorder_book_asset_images',
    ]);
  });

  it('documents total book MCP tool count after image tools', () => {
    expect(BOOK_MCP_TOOL_COUNT).toBe(16);
  });
});
