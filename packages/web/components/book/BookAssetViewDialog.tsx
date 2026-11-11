'use client';

import {Badge, HStack, IconButton, Stack, Text} from '@chakra-ui/react';
import {EditIcon} from '@so/component';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import BookAssetAttachedImagesPanel from '@/components/book/BookAssetAttachedImagesPanel';
import BookEntityViewDialog from '@/components/book/BookEntityViewDialog';
import AppIconTooltip from '@/components/app/AppIconTooltip';

export interface BookAssetViewDialogProps {
  readonly open: boolean;
  readonly asset: DbBkAsset | undefined;
  readonly typeLabel: string;
  readonly podId: string;
  readonly canWrite: boolean;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
}

export default function BookAssetViewDialog({
  open,
  asset,
  typeLabel,
  podId,
  canWrite,
  onClose,
  onEdit,
  onReload,
  onError,
}: BookAssetViewDialogProps) {
  if (asset === undefined) {
    return null;
  }

  return (
    <BookEntityViewDialog
      open={open}
      onClose={onClose}
      title={
        <HStack gap={2} wrap="wrap">
          <Text>{asset.name}</Text>
          <Badge size="sm" variant="subtle">
            {typeLabel}
          </Badge>
        </HStack>
      }
      headerActions={
        canWrite ? (
          <AppIconTooltip label="Edit asset">
            <IconButton aria-label="Edit asset" onClick={onEdit}>
              <EditIcon size={18} />
            </IconButton>
          </AppIconTooltip>
        ) : undefined
      }
    >
      <Stack gap={2}>
        <Text fontSize="sm" fontWeight="medium">
          Description
        </Text>
        {asset.descriptionMd.trim() === '' ? (
          <Text color="fg.muted" fontSize="sm">
            No description
          </Text>
        ) : (
          <BookMarkdownBody markdown={asset.descriptionMd} enableImageLightbox showImageDownload />
        )}
      </Stack>
      <BookAssetAttachedImagesPanel
        podId={podId}
        assetId={asset.id}
        images={asset.images}
        canWrite={false}
        viewMode
        onChanged={onReload}
        onError={onError}
      />
    </BookEntityViewDialog>
  );
}
