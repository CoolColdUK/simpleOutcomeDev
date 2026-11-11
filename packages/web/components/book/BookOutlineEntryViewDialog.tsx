'use client';

import {
  Badge,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  HStack,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react';
import {EditIcon} from '@so/component';
import {BookOutlineKind, bookOutlineListLabel} from '@so/model';
import type {DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import BookOutlineEmbeddedImagesPanel from '@/components/book/BookOutlineEmbeddedImagesPanel';
import AppIconTooltip from '@/components/app/AppIconTooltip';

export interface BookOutlineEntryViewDialogProps {
  readonly open: boolean;
  readonly entry: DbBkOutlineEntry | undefined;
  readonly canWrite: boolean;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
}

export default function BookOutlineEntryViewDialog({
  open,
  entry,
  canWrite,
  onClose,
  onEdit,
  onReload,
  onError,
}: BookOutlineEntryViewDialogProps) {
  if (entry === undefined) {
    return null;
  }

  const listLabel = bookOutlineListLabel(entry.kind, entry.title, entry.chapterNumber, entry.noteNumber);

  return (
    <DialogRoot open={open} onOpenChange={(details) => !details.open && onClose()} size="xl">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="6xl">
          <DialogHeader>
            <DialogTitle>
              <HStack gap={2} wrap="wrap">
                <Text>{listLabel}</Text>
                {entry.kind === BookOutlineKind.CHAPTER && entry.status !== undefined ? (
                  <Badge size="sm" variant="subtle">
                    {entry.status}
                  </Badge>
                ) : null}
              </HStack>
            </DialogTitle>
            <DialogCloseTrigger onClick={onClose} />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  Summary
                </Text>
                {entry.summaryMd.trim() === '' ? (
                  <Text color="fg.muted" fontSize="sm">
                    No summary
                  </Text>
                ) : (
                  <BookMarkdownBody markdown={entry.summaryMd} />
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
                  <BookMarkdownBody markdown={entry.contentMd} />
                )}
              </Stack>
              <BookOutlineEmbeddedImagesPanel entry={entry} canWrite={canWrite} onReload={onReload} onError={onError} />
            </Stack>
          </DialogBody>
          {canWrite ? (
            <DialogFooter>
              <AppIconTooltip label="Edit">
                <IconButton aria-label="Edit entry" onClick={onEdit}>
                  <EditIcon size={18} />
                </IconButton>
              </AppIconTooltip>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
