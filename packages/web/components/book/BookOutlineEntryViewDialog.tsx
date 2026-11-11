'use client';

import {useState} from 'react';
import {Badge, HStack, IconButton, Stack, Text} from '@chakra-ui/react';
import {DeleteIcon, EditIcon} from '@so/component';
import {BookOutlineKind, bookOutlineListLabel} from '@so/model';
import type {DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import BookOutlineEmbeddedImagesPanel from '@/components/book/BookOutlineEmbeddedImagesPanel';
import BookConfirmDeleteDialog from '@/components/book/BookConfirmDeleteDialog';
import BookEntityViewDialog from '@/components/book/BookEntityViewDialog';
import AppIconTooltip from '@/components/app/AppIconTooltip';

export interface BookOutlineEntryViewDialogProps {
  readonly open: boolean;
  readonly entry: DbBkOutlineEntry | undefined;
  readonly canWrite: boolean;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => Promise<void>;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
}

export default function BookOutlineEntryViewDialog({
  open,
  entry,
  canWrite,
  onClose,
  onEdit,
  onDelete,
  onReload,
  onError,
}: BookOutlineEntryViewDialogProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (entry === undefined) {
    return null;
  }

  const listLabel = bookOutlineListLabel(entry.kind, entry.title, entry.chapterNumber, entry.noteNumber);

  return (
    <>
      <BookEntityViewDialog
        open={open}
        onClose={onClose}
        title={
          <HStack gap={2} wrap="wrap">
            <Text>{listLabel}</Text>
            {entry.kind === BookOutlineKind.CHAPTER && entry.status !== undefined ? (
              <Badge size="sm" variant="subtle">
                {entry.status}
              </Badge>
            ) : null}
          </HStack>
        }
        headerActions={
          canWrite ? (
            <>
              <AppIconTooltip label="Edit entry">
                <IconButton aria-label="Edit entry" onClick={onEdit}>
                  <EditIcon size={18} />
                </IconButton>
              </AppIconTooltip>
              <AppIconTooltip label="Delete entry">
                <IconButton aria-label="Delete entry" colorPalette="red" variant="outline" onClick={() => setDeleteOpen(true)}>
                  <DeleteIcon size={18} />
                </IconButton>
              </AppIconTooltip>
            </>
          ) : undefined
        }
      >
        <Stack gap={2}>
          <Text fontSize="sm" fontWeight="medium">
            Summary
          </Text>
          {entry.summaryMd.trim() === '' ? (
            <Text color="fg.muted" fontSize="sm">
              No summary
            </Text>
          ) : (
            <BookMarkdownBody markdown={entry.summaryMd} enableImageLightbox showImageDownload />
          )}
        </Stack>
        <Stack gap={2}>
          <Text fontSize="sm" fontWeight="medium">
            Content
          </Text>
          {entry.contentMd.trim() === '' ? (
            <Text color="fg.muted" fontSize="sm">
              No content
            </Text>
          ) : (
            <BookMarkdownBody markdown={entry.contentMd} enableImageLightbox showImageDownload />
          )}
        </Stack>
        <BookOutlineEmbeddedImagesPanel entry={entry} canWrite={false} viewMode onReload={onReload} onError={onError} />
      </BookEntityViewDialog>
      <BookConfirmDeleteDialog
        open={deleteOpen}
        title="Delete outline entry?"
        description="This chapter or note will be removed permanently."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          void onDelete().catch((err: unknown) => onError(err instanceof Error ? err.message : String(err)));
          onClose();
        }}
      />
    </>
  );
}
