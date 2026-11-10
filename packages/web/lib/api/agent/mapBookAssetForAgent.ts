import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';

export interface AgentBookAssetPayload {
  readonly id: string;
  readonly podId: string;
  readonly assetTypeId: string;
  readonly name: string;
  readonly descriptionMd: string;
  readonly sortOrder: number;
  readonly images: readonly {
    readonly id: string;
    readonly storagePath: string;
    readonly sortOrder: number;
    readonly caption: string | undefined;
  }[];
  /** @deprecated Use `images[0]?.storagePath` — retained one release for MCP clients. */
  readonly imageStoragePath: string | undefined;
}

export default function mapBookAssetForAgent(asset: DbBkAsset): AgentBookAssetPayload {
  const first = asset.images[0];
  return {
    id: asset.id,
    podId: asset.podId,
    assetTypeId: asset.assetTypeId,
    name: asset.name,
    descriptionMd: asset.descriptionMd,
    sortOrder: asset.sortOrder,
    images: asset.images.map((image) => ({
      id: image.id,
      storagePath: image.storagePath,
      sortOrder: image.sortOrder,
      caption: image.caption,
    })),
    imageStoragePath: first?.storagePath,
  };
}
