'use client';

import {useEffect, useState, type ReactNode} from 'react';
import {Box, IconButton, Image, SimpleGrid, Stack, Text} from '@chakra-ui/react';
import {DeleteIcon} from '@so/component';
import {encodeSoImageMarkdownUri} from '@so/model';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import BookConfirmDeleteDialog from '@/components/book/BookConfirmDeleteDialog';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';

export interface BookAttachedImageGalleryItem {
  readonly key: string;
  readonly storagePath: string;
  readonly caption?: string;
}

export interface BookAttachedImagesGalleryProps {
  readonly title: string;
  readonly hint?: string;
  readonly emptyLabel: string;
  readonly items: readonly BookAttachedImageGalleryItem[];
  readonly canWrite: boolean;
  readonly confirmTitle: string;
  readonly confirmDescription: string;
  readonly onRemove: (storagePath: string) => Promise<void>;
  readonly onError: (message: string) => void;
  readonly uploadSlot?: ReactNode;
}

export default function BookAttachedImagesGallery({
  title,
  hint,
  emptyLabel,
  items,
  canWrite,
  confirmTitle,
  confirmDescription,
  onRemove,
  onError,
  uploadSlot,
}: BookAttachedImagesGalleryProps) {
  const [previewByPath, setPreviewByPath] = useState<Record<string, string>>({});
  const [deletePath, setDeletePath] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      items.map(async (item) => {
        const resolved = await resolveStorageBookImageSignedUrls(`![](${encodeSoImageMarkdownUri(item.storagePath)})`);
        const match = resolved.match(/\]\(<([^>]+)>\)/);
        return {path: item.storagePath, url: match?.[1] ?? ''};
      }),
    ).then((entries) => {
      if (!cancelled) {
        setPreviewByPath(Object.fromEntries(entries.filter((entry) => entry.url !== '').map((entry) => [entry.path, entry.url])));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <Stack gap={2} w="full">
      <Text fontSize="sm" fontWeight="medium">
        {title} ({items.length})
      </Text>
      {hint !== undefined ? (
        <Text fontSize="xs" color="fg.muted">
          {hint}
        </Text>
      ) : null}
      {items.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {emptyLabel}
        </Text>
      ) : (
        <SimpleGrid columns={{base: 2, md: 3, lg: 4}} gap={2}>
          {items.map((item) => (
            <Box key={item.key} borderWidth="1px" borderRadius="md" p={2} position="relative">
              <Image
                src={previewByPath[item.storagePath] ?? ''}
                alt={item.caption ?? ''}
                w="full"
                h="96px"
                objectFit="cover"
                borderRadius="sm"
              />
              <Text fontSize="2xs" color="fg.muted" lineClamp={2} mt={1} title={item.storagePath}>
                {item.storagePath.split('/').pop() ?? item.storagePath}
              </Text>
              {canWrite ? (
                <Box position="absolute" top={1} right={1}>
                  <AppIconTooltip label="Remove image">
                    <IconButton
                      aria-label="Remove image"
                      size="xs"
                      variant="solid"
                      colorPalette="red"
                      onClick={() => setDeletePath(item.storagePath)}
                    >
                      <DeleteIcon size={14} />
                    </IconButton>
                  </AppIconTooltip>
                </Box>
              ) : null}
            </Box>
          ))}
        </SimpleGrid>
      )}
      {uploadSlot}
      <BookConfirmDeleteDialog
        open={deletePath !== undefined}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Remove"
        onCancel={() => setDeletePath(undefined)}
        onConfirm={() => {
          if (deletePath === undefined) {
            return;
          }
          const path = deletePath;
          setDeletePath(undefined);
          void onRemove(path)
            .catch((err: unknown) => onError(err instanceof Error ? err.message : String(err)));
        }}
      />
    </Stack>
  );
}
