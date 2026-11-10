import type {DbBookWorkspace} from '@/lib/api/db/book/loadDbBookWorkspace';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';
import {collectBookOfflineImagePaths} from '@so/model';

export interface DbBookOfflineBundle {
  readonly podId: string;
  readonly version: number;
  readonly syncedAt: string;
  readonly book: {
    readonly subtitle: string;
    readonly summaryMd: string;
    readonly coverStoragePath?: string;
  };
  readonly outline: DbBookWorkspace['outline'];
  readonly assetTypes: DbBookWorkspace['assetTypes'];
  readonly assets: DbBookWorkspace['assets'];
  readonly signedUrlMap: Record<string, string>;
}

export default async function buildDbBookOfflineBundle(podId: string, workspace: DbBookWorkspace): Promise<DbBookOfflineBundle> {
  const paths = collectBookOfflineImagePaths({
    coverStoragePath: workspace.book.coverStoragePath,
    markdownBodies: [
      workspace.book.summaryMd,
      ...workspace.outline.flatMap((entry) => [entry.summaryMd, entry.contentMd]),
      ...workspace.assets.map((asset) => asset.descriptionMd),
    ],
    assetGalleryStoragePaths: workspace.assets.flatMap((asset) => asset.images.map((img) => img.storagePath)),
  });
  const signedUrlMap: Record<string, string> = {};
  await Promise.all(
    paths.map(async (path) => {
      const resolved = await resolveStorageBookImageSignedUrls(`![](soimg:${encodeURIComponent(path)})`);
      const match = resolved.match(/\]\(<([^>]+)>\)/);
      if (match?.[1] !== undefined) {
        signedUrlMap[path] = match[1];
      }
    }),
  );
  return {
    podId,
    version: workspace.book.offlineBundleVersion,
    syncedAt: new Date().toISOString(),
    book: {
      subtitle: workspace.book.subtitle,
      summaryMd: workspace.book.summaryMd,
      coverStoragePath: workspace.book.coverStoragePath,
    },
    outline: workspace.outline,
    assetTypes: workspace.assetTypes,
    assets: workspace.assets,
    signedUrlMap,
  };
}
