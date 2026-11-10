'use client';

import {useEffect, useState} from 'react';
import {Badge, Box, Button, HStack, Image, Stack, Text} from '@chakra-ui/react';
import {bookAssetDescriptionSnippet} from '@so/model';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';

export default function BookAssetReadOnlyCard({
  asset,
  typeLabel,
  onEdit,
}: {
  readonly asset: DbBkAsset;
  readonly typeLabel: string;
  readonly onEdit: () => void;
}) {
  const [thumb, setThumb] = useState('');
  const path = asset.images[0]?.storagePath;
  const snippet = bookAssetDescriptionSnippet(asset.descriptionMd);
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
          {asset.images.length > 1 ? (
            <Text fontSize="xs" color="fg.muted">
              {asset.images.length} images
            </Text>
          ) : null}
        </Stack>
        {thumb !== '' ? <Image src={thumb} alt="" w="72px" h="72px" flexShrink={0} objectFit="cover" borderRadius="sm" /> : null}
      </HStack>
      <Button size="sm" mt={2} variant="outline" alignSelf="start" onClick={onEdit}>
        Edit
      </Button>
    </Box>
  );
}
