import {BookImageMime} from './bookImageMime';
import buildBookAssetImageObjectPath from './buildBookAssetImageObjectPath';
import {
  assertBookAssetImageObjectPath,
  BOOK_MAX_ASSET_IMAGE_BYTES,
  normalizeAgentBookAssetImageMime,
  parseBookAssetImageBase64Payload,
} from './agentBookAssetImage';

describe('agentBookAssetImage', () => {
  it('parses raw base64', () => {
    const parsed = parseBookAssetImageBase64Payload('YQ==');
    expect(parsed.base64).toBe('YQ==');
    expect(parsed.mimeFromDataUrl).toBeUndefined();
  });

  it('parses data URL', () => {
    const parsed = parseBookAssetImageBase64Payload('data:image/png;base64,YQ==');
    expect(parsed.base64).toBe('YQ==');
    expect(parsed.mimeFromDataUrl).toBe(BookImageMime.PNG);
  });

  it('normalizes jpeg and png mime types only', () => {
    expect(normalizeAgentBookAssetImageMime('image/jpeg')).toBe(BookImageMime.JPEG);
    expect(normalizeAgentBookAssetImageMime('image/png')).toBe(BookImageMime.PNG);
    expect(normalizeAgentBookAssetImageMime('image/webp')).toBeUndefined();
  });

  it('builds asset image object path under pod/assets/id', () => {
    const path = buildBookAssetImageObjectPath('pod-1', 'asset-2', BookImageMime.PNG, '123');
    expect(path).toBe('pod-1/book/assets/asset-2/img-123.png');
  });

  it('validates asset image storage paths', () => {
    const podId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const assetId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const path = buildBookAssetImageObjectPath(podId, assetId, BookImageMime.JPEG, '9');
    expect(assertBookAssetImageObjectPath(podId, assetId, path)).toBe(true);
    expect(assertBookAssetImageObjectPath(podId, assetId, `${podId}/book/outline/x/img-1.jpg`)).toBe(false);
  });

  it('enforces 10MB max constant', () => {
    expect(BOOK_MAX_ASSET_IMAGE_BYTES).toBe(10_485_760);
  });
});
