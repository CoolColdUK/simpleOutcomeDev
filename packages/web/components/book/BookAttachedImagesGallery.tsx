'use client';

import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {Box, HStack, IconButton, Image, SimpleGrid, Stack, Text} from '@chakra-ui/react';
import {DeleteIcon, DownloadIcon} from '@so/component';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import BookConfirmDeleteDialog from '@/components/book/BookConfirmDeleteDialog';
import BookImageLightboxDialog from '@/components/book/BookImageLightboxDialog';
import downloadBookStorageImage from '@/lib/book/downloadBookStorageImage';
import {getStorageBookSignedUrls} from '@/lib/api/storage/storageBookSignedUrlCache';

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
  readonly viewMode: boolean;
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
  viewMode,
  confirmTitle,
  confirmDescription,
  onRemove,
  onError,
  uploadSlot,
}: BookAttachedImagesGalleryProps) {
  const pathsKey = useMemo(() => items.map((item) => item.storagePath).join('\0'), [items]);
  const [previewByPath, setPreviewByPath] = useState<Record<string, string>>({});
  const [deletePath, setDeletePath] = useState<string | undefined>(undefined);
  const [lightboxPath, setLightboxPath] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const paths = items.map((item) => item.storagePath);
    void getStorageBookSignedUrls(paths).then((map) => {
      if (!cancelled) {
        setPreviewByPath(map);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathsKey, items]);

  const lightboxUrl = lightboxPath === undefined ? '' : (previewByPath[lightboxPath] ?? '');

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
          {items.map((item) => {
            const preview = previewByPath[item.storagePath] ?? '';
            return (
              <Box key={item.key} borderWidth="1px" borderRadius="md" p={2} position="relative">
                <Image
                  src={preview}
                  alt={item.caption ?? ''}
                  w="full"
                  h="96px"
                  objectFit="cover"
                  borderRadius="sm"
                  cursor={preview === '' ? 'default' : 'zoom-in'}
                  onClick={() => {
                    if (preview !== '') {
                      setLightboxPath(item.storagePath);
                    }
                  }}
                />
                <Text fontSize="2xs" color="fg.muted" lineClamp={2} mt={1} title={item.storagePath}>
                  {item.storagePath.split('/').pop() ?? item.storagePath}
                </Text>
                <Box position="absolute" top={1} right={1}>
                  <HStack gap={0}>
                    {viewMode && preview !== '' ? (
                      <AppIconTooltip label="Download image">
                        <IconButton
                          aria-label="Download image"
                          size="xs"
                          variant="solid"
                          onClick={(event) => {
                            event.stopPropagation();
                            void downloadBookStorageImage(preview, item.storagePath).catch((err: unknown) =>
                              onError(err instanceof Error ? err.message : String(err)),
                            );
                          }}
                        >
                          <DownloadIcon size={14} />
                        </IconButton>
                      </AppIconTooltip>
                    ) : null}
                    {canWrite ? (
                      <AppIconTooltip label="Remove image">
                        <IconButton
                          aria-label="Remove image"
                          size="xs"
                          variant="solid"
                          colorPalette="red"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeletePath(item.storagePath);
                          }}
                        >
                          <DeleteIcon size={14} />
                        </IconButton>
                      </AppIconTooltip>
                    ) : null}
                  </HStack>
                </Box>
              </Box>
            );
          })}
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
      <BookImageLightboxDialog
        open={lightboxPath !== undefined && lightboxUrl !== ''}
        signedUrl={lightboxUrl}
        storagePath={lightboxPath ?? ''}
        showDownload={viewMode}
        onClose={() => setLightboxPath(undefined)}
        onError={onError}
      />
    </Stack>
  );
}
