'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {
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
  Image,
  Input,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react';
import {AddIcon, CrossIcon, DeleteIcon, SaveIcon} from '@so/component';
import {BookChapterStatus, BookOutlineKind, bookOutlineListLabel} from '@so/model';
import type {DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';
import BookConfirmDeleteDialog from '@/components/book/BookConfirmDeleteDialog';
import BookDiscardChangesDialog from '@/components/book/BookDiscardChangesDialog';
import BookMarkdownEditorWithPreview from '@/components/book/BookMarkdownEditorWithPreview';
import BookOutlineEmbeddedImagesPanel from '@/components/book/BookOutlineEmbeddedImagesPanel';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import uploadStorageBookChapterImage from '@/lib/api/storage/uploadStorageBookChapterImage';
import uploadStorageBookInlineImageMarkdownFragment from '@/lib/api/storage/uploadStorageBookInlineImageMarkdownFragment';
import {getStorageBookSignedUrl} from '@/lib/api/storage/storageBookSignedUrlCache';

export interface BookOutlineEntryDialogProps {
  readonly open: boolean;
  readonly isCreate: boolean;
  readonly entry: DbBkOutlineEntry | undefined;
  readonly podId: string;
  readonly canWrite: boolean;
  readonly saving: boolean;
  readonly onClose: () => void;
  readonly onSave: (draft: {
    title: string;
    summaryMd: string;
    contentMd: string;
    status: BookChapterStatus | undefined;
    chapterImageStoragePath: string | null | undefined;
  }) => Promise<void>;
  readonly onDelete?: () => Promise<void>;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
}

export default function BookOutlineEntryDialog({
  open,
  isCreate,
  entry,
  podId,
  canWrite,
  saving,
  onClose,
  onSave,
  onDelete,
  onReload,
  onError,
}: BookOutlineEntryDialogProps) {
  const [title, setTitle] = useState('');
  const [summaryMd, setSummaryMd] = useState('');
  const [contentMd, setContentMd] = useState('');
  const [status, setStatus] = useState<BookChapterStatus | undefined>(undefined);
  const [chapterImagePath, setChapterImagePath] = useState<string | undefined>(undefined);
  const [chapterImagePreview, setChapterImagePreview] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [dirtyBaseline, setDirtyBaseline] = useState('');

  useEffect(() => {
    if (entry === undefined) {
      return;
    }
    queueMicrotask(() => {
      const snapshot = JSON.stringify({
        title: entry.title,
        summaryMd: entry.summaryMd,
        contentMd: entry.contentMd,
        status: entry.status,
        chapterImagePath: entry.chapterImageStoragePath,
      });
      setDirtyBaseline(snapshot);
      setTitle(entry.title);
      setSummaryMd(entry.summaryMd);
      setContentMd(entry.contentMd);
      setStatus(entry.status);
      setChapterImagePath(entry.chapterImageStoragePath);
      setDiscardOpen(false);
      setDeleteOpen(false);
    });
  }, [entry]);

  useEffect(() => {
    if (chapterImagePath === undefined) {
      return;
    }
    let cancelled = false;
    void getStorageBookSignedUrl(chapterImagePath).then((url) => {
      if (!cancelled && url !== undefined) {
        setChapterImagePreview(url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chapterImagePath]);

  const dirty = useMemo(() => {
    const current = JSON.stringify({
      title,
      summaryMd,
      contentMd,
      status,
      chapterImagePath,
    });
    return current !== dirtyBaseline;
  }, [chapterImagePath, contentMd, dirtyBaseline, status, summaryMd, title]);

  const finishClose = (): void => {
    setDiscardOpen(false);
    onClose();
  };

  const requestClose = (): void => {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    finishClose();
  };

  const imagesEntry = useMemo((): DbBkOutlineEntry | undefined => {
    if (entry === undefined) {
      return undefined;
    }
    return {
      ...entry,
      summaryMd,
      contentMd,
      chapterImageStoragePath: chapterImagePath,
    };
  }, [chapterImagePath, contentMd, entry, summaryMd]);

  if (entry === undefined || imagesEntry === undefined) {
    return null;
  }

  const listLabel = bookOutlineListLabel(entry.kind, title, entry.chapterNumber, entry.noteNumber);
  const dialogTitle = isCreate
    ? entry.kind === BookOutlineKind.CHAPTER
      ? 'New chapter'
      : 'New note'
    : listLabel;

  return (
    <>
      <DialogRoot open={open} onOpenChange={(details) => !details.open && requestClose()} size="xl">
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent maxW="6xl">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogCloseTrigger onClick={requestClose} />
            </DialogHeader>
            <DialogBody>
              <Stack gap={3}>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} disabled={!canWrite} />
                {entry.kind === BookOutlineKind.CHAPTER ? (
                  <NativeSelect.Root size="sm" disabled={!canWrite}>
                    <NativeSelect.Field
                      value={status ?? BookChapterStatus.OUTLINE}
                      onChange={(event) => setStatus(event.target.value as BookChapterStatus)}
                    >
                      {Object.values(BookChapterStatus).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                ) : null}
                {entry.kind === BookOutlineKind.CHAPTER ? (
                  <Stack gap={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      Chapter image
                    </Text>
                    {chapterImagePath !== undefined && chapterImagePreview !== '' ? (
                      <Image src={chapterImagePreview} alt="" maxH="160px" objectFit="cover" borderRadius="md" />
                    ) : null}
                    {canWrite ? (
                      <HStack>
                        <AppIconTooltip label="Upload chapter image">
                          <IconButton
                            aria-label="Upload chapter image"
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
                                void uploadStorageBookChapterImage(podId, entry.id, file).then((path) => setChapterImagePath(path));
                              };
                              input.click();
                            }}
                          >
                            <AddIcon size={18} />
                          </IconButton>
                        </AppIconTooltip>
                        {chapterImagePath !== undefined ? (
                          <AppIconTooltip label="Remove chapter image">
                            <IconButton
                              aria-label="Remove chapter image"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setChapterImagePath(undefined);
                                setChapterImagePreview('');
                              }}
                            >
                              <CrossIcon size={18} />
                            </IconButton>
                          </AppIconTooltip>
                        ) : null}
                      </HStack>
                    ) : null}
                  </Stack>
                ) : null}
                <BookMarkdownEditorWithPreview
                  label="Summary"
                  value={summaryMd}
                  onChange={setSummaryMd}
                  disabled={!canWrite}
                  rows={3}
                />
                <BookMarkdownEditorWithPreview
                  label="Content"
                  hint="Page break: put <!-- pagebreak --> or \\pagebreak on its own line."
                  value={contentMd}
                  onChange={setContentMd}
                  disabled={!canWrite}
                  rows={16}
                  textareaRef={contentRef}
                  onPasteImage={
                    canWrite
                      ? async (blob) => {
                          const fragment = await uploadStorageBookInlineImageMarkdownFragment(podId, entry.id, blob);
                          return fragment;
                        }
                      : undefined
                  }
                />
                {!isCreate ? (
                  <BookOutlineEmbeddedImagesPanel
                    entry={imagesEntry}
                    canWrite={canWrite}
                    onReload={onReload}
                    onError={onError}
                    onMarkdownPatched={(patch) => {
                      setSummaryMd(patch.summaryMd);
                      setContentMd(patch.contentMd);
                      if (patch.chapterImageStoragePath !== undefined) {
                        setChapterImagePath(patch.chapterImageStoragePath);
                        setChapterImagePreview('');
                      }
                    }}
                  />
                ) : null}
              </Stack>
            </DialogBody>
            <DialogFooter>
              <HStack justify="space-between" w="full">
                <HStack>
                  {canWrite && onDelete !== undefined && !isCreate ? (
                    <AppIconTooltip label="Delete">
                      <IconButton
                        aria-label="Delete"
                        colorPalette="red"
                        variant="outline"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <DeleteIcon size={18} />
                      </IconButton>
                    </AppIconTooltip>
                  ) : null}
                </HStack>
                <HStack>
                  <AppIconTooltip label="Cancel">
                    <IconButton aria-label="Cancel" variant="outline" onClick={requestClose}>
                      <CrossIcon size={18} />
                    </IconButton>
                  </AppIconTooltip>
                  {canWrite ? (
                    <AppIconTooltip label="Save">
                      <IconButton
                        aria-label="Save"
                        loading={saving}
                        onClick={() =>
                          void onSave({
                            title,
                            summaryMd,
                            contentMd,
                            status: entry.kind === BookOutlineKind.CHAPTER ? status : undefined,
                            chapterImageStoragePath: chapterImagePath ?? null,
                          })
                        }
                      >
                        <SaveIcon size={18} />
                      </IconButton>
                    </AppIconTooltip>
                  ) : null}
                </HStack>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
      <BookDiscardChangesDialog
        open={discardOpen}
        onKeepEditing={() => setDiscardOpen(false)}
        onDiscard={finishClose}
      />
      <BookConfirmDeleteDialog
        open={deleteOpen}
        title="Delete outline entry?"
        description="This chapter or note will be removed permanently."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          if (onDelete !== undefined) {
            void onDelete();
          }
        }}
      />
    </>
  );
}
