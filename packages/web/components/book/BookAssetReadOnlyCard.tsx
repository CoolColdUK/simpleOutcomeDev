'use client';

import {useEffect, useState} from 'react';
import {Badge, Box, HStack, IconButton, Image, Stack, Text} from '@chakra-ui/react';
import {DeleteIcon, EditIcon} from '@so/component';
import {bookAssetDescriptionSnippet, extractSoImageObjectPathsFromBody} from '@so/model';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';

export default function BookAssetReadOnlyCard({
  asset,
  typeLabel,
  canWrite,
  onEdit,
  onDelete,
}: {
  readonly asset: DbBkAsset;
  readonly typeLabel: string;
  readonly canWrite: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}) {
  const [thumb, setThumb] = useState('');
  const galleryPath = asset.images[0]?.storagePath;
  const inlinePath = extractSoImageObjectPathsFromBody(asset.descriptionMd)[0];
  const path = galleryPath ?? inlinePath;
  const snippet = bookAssetDescriptionSnippet(asset.descriptionMd);
  const imageCount = Math.max(asset.images.length, extractSoImageObjectPathsFromBody(asset.descriptionMd).length);

  useEffect(() => {
    if (path === undefined) {
      return;
    }
    let cancelled = false;
    void resolveStorageBookImageSignedUrls(`![](soimg:${encodeURIComponent(path)})`).then((resolved) => {
      const match = resolved.match(/\]\(<([^>]+)>\)/);
      if (!cancelled && match?.[1] !== undefined) {
        setThumb(match[1]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <Box borderWidth="1px" borderRadius="md" p={3} bg="bg.subtle" h="full" display="flex" flexDirection="column">
      <HStack justify="space-between" align="start" gap={2} flex="1">
        <Stack gap={1} flex="1" minW={0}>
          <HStack wrap="wrap" gap={1}>
            <Text fontWeight="semibold" truncate>
              {asset.name}
            </Text>
            <Badge size="sm" variant="subtle">
              {typeLabel}
            </Badge>
          </HStack>
          {snippet !== '' ? (
            <Text fontSize="sm" color="fg.muted" lineClamp={3}>
              {snippet}
            </Text>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              No description
            </Text>
          )}
          {imageCount > 1 ? (
            <Text fontSize="xs" color="fg.muted">
              {imageCount} images
            </Text>
          ) : null}
        </Stack>
        {path !== undefined && thumb !== '' ? (
          <Image src={thumb} alt="" w="72px" h="72px" flexShrink={0} objectFit="cover" borderRadius="sm" />
        ) : null}
      </HStack>
      <HStack mt={2} gap={1}>
        <AppIconTooltip label="Edit">
          <IconButton aria-label="Edit asset" size="sm" variant="outline" onClick={onEdit}>
            <EditIcon size={16} />
          </IconButton>
        </AppIconTooltip>
        {canWrite ? (
          <AppIconTooltip label="Delete">
            <IconButton aria-label="Delete asset" size="sm" variant="outline" colorPalette="red" onClick={onDelete}>
              <DeleteIcon size={16} />
            </IconButton>
          </AppIconTooltip>
        ) : null}
      </HStack>
    </Box>
  );
}
