'use client';

import {useEffect, useMemo, useState} from 'react';
import {
  Button,
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
  Image,
  Input,
  NativeSelect,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {BookChapterStatus, BookOutlineKind, bookOutlineListLabel} from '@so/model';
import type {DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import uploadStorageBookChapterImage from '@/lib/api/storage/uploadStorageBookChapterImage';
import uploadStorageBookInlineImageMarkdownFragment from '@/lib/api/storage/uploadStorageBookInlineImageMarkdownFragment';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';
import insertAtCaret from '@/components/todo/insertAtCaret';

export interface BookOutlineEntryDialogProps {
  readonly open: boolean;
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
  readonly onDelete: () => Promise<void>;
}

export default function BookOutlineEntryDialog({
  open,
  entry,
  podId,
  canWrite,
  saving,
  onClose,
  onSave,
  onDelete,
}: BookOutlineEntryDialogProps) {
  const [title, setTitle] = useState('');
  const [summaryMd, setSummaryMd] = useState('');
  const [contentMd, setContentMd] = useState('');
  const [status, setStatus] = useState<BookChapterStatus | undefined>(undefined);
  const [chapterImagePath, setChapterImagePath] = useState<string | undefined>(undefined);
  const [chapterImagePreview, setChapterImagePreview] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (entry === undefined) {
      return;
    }
    queueMicrotask(() => {
      setTitle(entry.title);
      setSummaryMd(entry.summaryMd);
      setContentMd(entry.contentMd);
      setStatus(entry.status);
      setChapterImagePath(entry.chapterImageStoragePath);
      setConfirmDelete(false);
    });
  }, [entry]);

  useEffect(() => {
    if (chapterImagePath === undefined) {
      return;
    }
    let cancelled = false;
    void resolveStorageBookImageSignedUrls(`![](soimg:${encodeURIComponent(chapterImagePath)})`).then((resolved) => {
      const match = resolved.match(/\]\(<([^>]+)>\)/);
      if (!cancelled && match?.[1] !== undefined) {
        setChapterImagePreview(match[1]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chapterImagePath]);

  const dirty = useMemo(() => {
    if (entry === undefined) {
      return false;
    }
    return (
      title !== entry.title ||
      summaryMd !== entry.summaryMd ||
      contentMd !== entry.contentMd ||
      status !== entry.status ||
      chapterImagePath !== entry.chapterImageStoragePath
    );
  }, [chapterImagePath, contentMd, entry, status, summaryMd, title]);

  const requestClose = (): void => {
    if (dirty && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    onClose();
  };

  if (entry === undefined) {
    return null;
  }

  return (
    <DialogRoot open={open} onOpenChange={(details) => !details.open && requestClose()} size="xl">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="6xl">
          <DialogHeader>
            <DialogTitle>{bookOutlineListLabel(entry.kind, title, entry.chapterNumber, entry.noteNumber)}</DialogTitle>
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
                      <Button
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
                        Upload chapter image
                      </Button>
                      {chapterImagePath !== undefined ? (
                        <Button size="sm" variant="outline" onClick={() => setChapterImagePath(undefined)}>
                          Remove image
                        </Button>
                      ) : null}
                    </HStack>
                  ) : null}
                </Stack>
              ) : null}
              <Text fontSize="sm" fontWeight="medium">
                Summary
              </Text>
              <Textarea value={summaryMd} onChange={(event) => setSummaryMd(event.target.value)} rows={3} disabled={!canWrite} />
              <Switch.Root checked={showPreview} onCheckedChange={(details) => setShowPreview(details.checked === true)}>
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>Show preview</Switch.Label>
              </Switch.Root>
              {showPreview ? (
                <Stack w="full" borderWidth="1px" borderRadius="md" p={3} minH="120px">
                  <BookMarkdownBody markdown={contentMd} />
                </Stack>
              ) : null}
              <Text fontSize="sm" fontWeight="medium">
                Content
              </Text>
              <Text fontSize="xs" color="fg.muted">
                Page break: put <code>{'<!-- pagebreak -->'}</code> or <code>\pagebreak</code> on its own line.
              </Text>
              <Textarea
                value={contentMd}
                onChange={(event) => setContentMd(event.target.value)}
                rows={16}
                w="full"
                disabled={!canWrite}
                onPaste={(event) => {
                  const file = [...event.clipboardData.items].map((item) => item.getAsFile()).find((picked) => picked?.type.startsWith('image/') ?? false);
                  if (file === undefined || file === null || !canWrite) {
                    return;
                  }
                  event.preventDefault();
                  void uploadStorageBookInlineImageMarkdownFragment(podId, entry.id, file).then((fragment) => {
                    const ta = event.target as HTMLTextAreaElement;
                    const {next} = insertAtCaret(contentMd, ta, fragment);
                    setContentMd(next);
                  });
                }}
              />
            </Stack>
          </DialogBody>
          <DialogFooter>
            <HStack justify="space-between" w="full">
              <HStack>
                {canWrite ? (
                  <Button
                    colorPalette="red"
                    variant="outline"
                    onClick={() => {
                      if (!confirmDelete) {
                        setConfirmDelete(true);
                        return;
                      }
                      void onDelete();
                    }}
                  >
                    {confirmDelete ? 'Confirm delete' : 'Delete'}
                  </Button>
                ) : null}
              </HStack>
              <HStack>
                <Button variant="outline" onClick={requestClose}>
                  Cancel
                </Button>
                {canWrite ? (
                  <Button
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
                    Save
                  </Button>
                ) : null}
              </HStack>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
