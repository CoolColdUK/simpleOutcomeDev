'use client';

import {Box, Button, HStack, Image, Input, Text} from '@chakra-ui/react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {SortableContext, arrayMove, horizontalListSortingStrategy, useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useEffect, useMemo, useState, type ReactNode} from 'react';
import type {DbBkAssetImage} from '@/lib/api/db/book/loadDbBookWorkspace';
import createDbBkAssetImage from '@/lib/api/db/book/createDbBkAssetImage';
import deleteDbBkAssetImage from '@/lib/api/db/book/deleteDbBkAssetImage';
import reorderDbBkAssetImages from '@/lib/api/db/book/reorderDbBkAssetImages';
import uploadStorageBookAssetImage from '@/lib/api/storage/uploadStorageBookAssetImage';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';

export interface BookAssetImageGalleryProps {
  readonly podId: string;
  readonly assetId: string;
  readonly images: readonly DbBkAssetImage[];
  readonly canWrite: boolean;
  readonly onChanged: () => Promise<void>;
  readonly onError: (message: string) => void;
}

function SortableGalleryThumb({
  image,
  previewUrl,
  canWrite,
  onDelete,
}: {
  readonly image: DbBkAssetImage;
  readonly previewUrl: string;
  readonly canWrite: boolean;
  readonly onDelete: () => void;
}) {
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: image.id});
  const style = {transform: CSS.Transform.toString(transform), transition};
  return (
    <Box ref={setNodeRef} style={style} borderWidth="1px" borderRadius="md" p={2} minW="120px" {...attributes} {...listeners}>
      <Image src={previewUrl} alt={image.caption ?? ''} maxH="120px" objectFit="cover" />
      {canWrite ? (
        <Button size="xs" mt={2} colorPalette="red" variant="outline" onClick={onDelete}>
          Remove
        </Button>
      ) : null}
    </Box>
  );
}

export default function BookAssetImageGallery({
  podId,
  assetId,
  images,
  canWrite,
  onChanged,
  onError,
}: BookAssetImageGalleryProps) {
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 6}}));
  const [previewByPath, setPreviewByPath] = useState<Record<string, string>>({});
  const sorted = useMemo(() => [...images].sort((left, right) => left.sortOrder - right.sortOrder), [images]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      sorted.map(async (image) => {
        const resolved = await resolveStorageBookImageSignedUrls(`![](soimg:${encodeURIComponent(image.storagePath)})`);
        const match = resolved.match(/\]\(<([^>]+)>\)/);
        return {path: image.storagePath, url: match?.[1] ?? ''};
      }),
    ).then((entries) => {
      if (!cancelled) {
        setPreviewByPath(Object.fromEntries(entries.filter((entry) => entry.url !== '').map((entry) => [entry.path, entry.url])));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sorted]);

  const uploadBlob = async (blob: Blob): Promise<void> => {
    try {
      const path = await uploadStorageBookAssetImage(podId, assetId, blob);
      await createDbBkAssetImage(podId, assetId, path);
      await onChanged();
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : String(error));
    }
  };

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    if (!canWrite) {
      return;
    }
    const {active, over} = event;
    if (over === null || active.id === over.id) {
      return;
    }
    const ids = sorted.map((image) => image.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    await reorderDbBkAssetImages(podId, assetId, nextIds);
    await onChanged();
  };

  if (sorted.length === 0 && !canWrite) {
    return <Text fontSize="sm">No images</Text>;
  }

  return (
    <StackLike gap={2}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
        <SortableContext items={sorted.map((image) => image.id)} strategy={horizontalListSortingStrategy}>
          <HStack wrap="wrap" gap={2} align="start">
            {sorted.map((image) => (
              <SortableGalleryThumb
                key={image.id}
                image={image}
                previewUrl={previewByPath[image.storagePath] ?? ''}
                canWrite={canWrite}
                onDelete={() =>
                  void deleteDbBkAssetImage(podId, image.id, image.storagePath)
                    .then(() => onChanged())
                    .catch((error: unknown) => onError(error instanceof Error ? error.message : String(error)))
                }
              />
            ))}
          </HStack>
        </SortableContext>
      </DndContext>
      {canWrite ? (
        <HStack>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/jpeg,image/png,image/webp';
              input.onchange = () => {
                const file = input.files?.[0];
                if (file === undefined) {
                  return;
                }
                void uploadBlob(file);
              };
              input.click();
            }}
          >
            Upload image
          </Button>
          <Input
            size="sm"
            placeholder="Paste image here"
            onPaste={(e) => {
              const file = [...e.clipboardData.items].map((item) => item.getAsFile()).find((picked) => picked?.type.startsWith('image/') ?? false);
              if (file === undefined || file === null) {
                return;
              }
              e.preventDefault();
              void uploadBlob(file);
            }}
          />
        </HStack>
      ) : null}
    </StackLike>
  );
}

function StackLike({children, gap}: {readonly children: ReactNode; readonly gap: number}) {
  return (
    <Box display="flex" flexDirection="column" gap={gap}>
      {children}
    </Box>
  );
}
