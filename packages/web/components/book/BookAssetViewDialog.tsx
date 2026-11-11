'use client';

import {
  Badge,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import BookAssetAttachedImagesPanel from '@/components/book/BookAssetAttachedImagesPanel';

export interface BookAssetViewDialogProps {
  readonly open: boolean;
  readonly asset: DbBkAsset | undefined;
  readonly typeLabel: string;
  readonly podId: string;
  readonly onClose: () => void;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
}

export default function BookAssetViewDialog({open, asset, typeLabel, podId, onClose, onReload, onError}: BookAssetViewDialogProps) {
  if (asset === undefined) {
    return null;
  }

  return (
    <DialogRoot open={open} onOpenChange={(details) => !details.open && onClose()} size="xl">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="6xl">
          <DialogHeader>
            <DialogTitle>
              <HStack gap={2} wrap="wrap">
                <Text>{asset.name}</Text>
                <Badge size="sm" variant="subtle">
                  {typeLabel}
                </Badge>
              </HStack>
            </DialogTitle>
            <DialogCloseTrigger onClick={onClose} />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  Description
                </Text>
                {asset.descriptionMd.trim() === '' ? (
                  <Text color="fg.muted" fontSize="sm">
                    No description
                  </Text>
                ) : (
                  <BookMarkdownBody markdown={asset.descriptionMd} />
                )}
              </Stack>
              <BookAssetAttachedImagesPanel
                podId={podId}
                assetId={asset.id}
                images={asset.images}
                canWrite={false}
                onChanged={onReload}
                onError={onError}
              />
            </Stack>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
