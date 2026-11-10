import createDbBkAssetImage from '@/lib/api/db/book/createDbBkAssetImage';

export default async function syncDbBkAssetImagesFromPaths(
  podId: string,
  assetId: string,
  storagePaths: readonly string[],
): Promise<void> {
  for (const path of storagePaths) {
    await createDbBkAssetImage(podId, assetId, path);
  }
}
