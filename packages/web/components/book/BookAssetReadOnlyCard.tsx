'use client';

import {useEffect, useState} from 'react';
import {Box, Button, HStack, Image, Stack, Text} from '@chakra-ui/react';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
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
    <Box borderWidth="1px" borderRadius="md" p={3} bg="bg.subtle">
      <HStack justify="space-between" align="start">
        <Stack gap={1} flex="1">
          <Text fontWeight="semibold">{asset.name}</Text>
          <Text fontSize="xs" color="fg.muted">
            {typeLabel}
          </Text>
          {asset.descriptionMd !== '' ? (
            <Box maxH="80px" overflow="hidden">
              <BookMarkdownBody markdown={asset.descriptionMd} />
            </Box>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              No description
            </Text>
          )}
        </Stack>
        {thumb !== '' ? <Image src={thumb} alt="" w="72px" h="72px" objectFit="cover" borderRadius="sm" /> : null}
      </HStack>
      <Button size="sm" mt={2} variant="outline" onClick={onEdit}>
        Edit
      </Button>
    </Box>
  );
}
