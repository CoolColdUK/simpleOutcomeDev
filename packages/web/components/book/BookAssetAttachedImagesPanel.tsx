'use client';

import {useMemo, useState, type DragEvent} from 'react';
import {Box, Button, Stack, Text} from '@chakra-ui/react';
import type {DbBkAssetImage} from '@/lib/api/db/book/loadDbBookWorkspace';
import BookAttachedImagesGallery from '@/components/book/BookAttachedImagesGallery';
import createDbBkAssetImage from '@/lib/api/db/book/createDbBkAssetImage';
import deleteDbBkAssetImage from '@/lib/api/db/book/deleteDbBkAssetImage';
import uploadStorageBookAssetImage from '@/lib/api/storage/uploadStorageBookAssetImage';

export interface BookAssetAttachedImagesPanelProps {
  readonly podId: string;
  readonly assetId: string;
  readonly images: readonly DbBkAssetImage[];
  readonly canWrite: boolean;
  readonly onChanged: () => Promise<void>;
  readonly onError: (message: string) => void;
  readonly onPendingGalleryPath?: (storagePath: string) => void;
  readonly skipDbInsert?: boolean;
  readonly viewMode?: boolean;
}

function acceptImageFiles(files: FileList | Iterable<File>): File[] {
  return [...files].filter((file) => file.type === 'image/jpeg' || file.type === 'image/png');
}

export default function BookAssetAttachedImagesPanel({
  podId,
  assetId,
  images,
  canWrite,
  onChanged,
  onError,
  onPendingGalleryPath,
  skipDbInsert = false,
  viewMode = false,
}: BookAssetAttachedImagesPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const sorted = useMemo(() => [...images].sort((left, right) => left.sortOrder - right.sortOrder), [images]);
  const galleryItems = useMemo(
    () =>
      sorted.map((image) => ({
        key: image.id,
        storagePath: image.storagePath,
        caption: image.caption,
      })),
    [sorted],
  );

  const uploadFiles = async (files: FileList | Iterable<File>): Promise<void> => {
    const accepted = acceptImageFiles(files);
    if (accepted.length === 0) {
      onError('Only JPEG or PNG images are supported.');
      return;
    }
    try {
      for (const file of accepted) {
        const path = await uploadStorageBookAssetImage(podId, assetId, file);
        if (skipDbInsert) {
          onPendingGalleryPath?.(path);
        } else {
          await createDbBkAssetImage(podId, assetId, path);
        }
      }
      await onChanged();
    } catch (unknown: unknown) {
      onError(unknown instanceof Error ? unknown.message : String(unknown));
    }
  };

  const dropProps =
    canWrite === true
      ? {
          onDragOver: (event: DragEvent) => {
            event.preventDefault();
            setDragActive(true);
          },
          onDragLeave: () => setDragActive(false),
          onDrop: (event: DragEvent) => {
            event.preventDefault();
            setDragActive(false);
            const files = event.dataTransfer.files;
            if (files.length > 0) {
              void uploadFiles(files);
            }
          },
        }
      : {};

  const uploadSlot =
    canWrite === true ? (
      <Box
        borderWidth="2px"
        borderStyle="dashed"
        borderRadius="md"
        p={4}
        borderColor={dragActive ? 'colorPalette.solid' : 'border.subtle'}
        {...dropProps}
      >
        <Stack gap={2} align="center">
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            Drag and drop JPEG or PNG images here
          </Text>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/jpeg,image/png';
              input.multiple = true;
              input.onchange = () => {
                if (input.files !== null) {
                  void uploadFiles(input.files);
                }
              };
              input.click();
            }}
          >
            Choose files
          </Button>
        </Stack>
      </Box>
    ) : undefined;

  return (
    <BookAttachedImagesGallery
      title="Attached images"
      hint="Gallery images from uploads and MCP. Shown in the asset card and offline export."
      emptyLabel="No gallery images yet."
      items={galleryItems}
      canWrite={canWrite}
      viewMode={viewMode}
      confirmTitle="Remove image?"
      confirmDescription="This removes the gallery image from the asset and deletes it from storage."
      onError={onError}
      uploadSlot={uploadSlot}
      onRemove={async (storagePath) => {
        const image = sorted.find((row) => row.storagePath === storagePath);
        if (image === undefined) {
          throw new Error('Image not found');
        }
        await deleteDbBkAssetImage(podId, image.id, storagePath);
        await onChanged();
      }}
    />
  );
}
