'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Box,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Grid,
  HStack,
  IconButton,
  Input,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {AddIcon, CrossIcon, DeleteIcon, SaveIcon} from '@so/component';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import BookConfirmDeleteDialog from '@/components/book/BookConfirmDeleteDialog';
import BookDiscardChangesDialog from '@/components/book/BookDiscardChangesDialog';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import insertAtCaret from '@/components/todo/insertAtCaret';
import createDbBkAssetImage from '@/lib/api/db/book/createDbBkAssetImage';
import uploadStorageBookAssetInlineImageMarkdownFragment from '@/lib/api/storage/uploadStorageBookAssetInlineImageMarkdownFragment';

export interface BookAssetEditDialogProps {
  readonly open: boolean;
  readonly isCreate: boolean;
  readonly asset: DbBkAsset | undefined;
  readonly podId: string;
  readonly typeLabel: string;
  readonly canWrite: boolean;
  readonly saving: boolean;
  readonly onClose: () => void;
  readonly onSave: (name: string, descriptionMd: string, pendingImagePaths: readonly string[]) => Promise<void>;
  readonly onDelete?: () => Promise<void>;
}

export default function BookAssetEditDialog({
  open,
  isCreate,
  asset,
  podId,
  typeLabel,
  canWrite,
  saving,
  onClose,
  onSave,
  onDelete,
}: BookAssetEditDialogProps) {
  const [name, setName] = useState('');
  const [descriptionMd, setDescriptionMd] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [pendingImagePaths, setPendingImagePaths] = useState<string[]>([]);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const [dirtyBaseline, setDirtyBaseline] = useState('');

  useEffect(() => {
    if (asset === undefined) {
      return;
    }
    queueMicrotask(() => {
      setDirtyBaseline(
        JSON.stringify({name: asset.name, descriptionMd: asset.descriptionMd, pending: [] as string[]}),
      );
      setName(asset.name);
      setDescriptionMd(asset.descriptionMd);
      setPendingImagePaths([]);
      setDiscardOpen(false);
      setDeleteOpen(false);
    });
  }, [asset]);

  const dirty = useMemo(() => {
    const current = JSON.stringify({name, descriptionMd, pending: pendingImagePaths});
    return current !== dirtyBaseline;
  }, [descriptionMd, dirtyBaseline, name, pendingImagePaths]);

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

  const appendImageBlob = async (blob: Blob): Promise<void> => {
    if (asset === undefined) {
      return;
    }
    const {fragment, storagePath} = await uploadStorageBookAssetInlineImageMarkdownFragment(podId, asset.id, blob);
    if (!isCreate) {
      await createDbBkAssetImage(podId, asset.id, storagePath);
    } else {
      setPendingImagePaths((paths) => [...paths, storagePath]);
    }
    const ta = descriptionRef.current;
    if (ta !== null) {
      const {next} = insertAtCaret(descriptionMd, ta, `${fragment}\n`);
      setDescriptionMd(next);
      return;
    }
    setDescriptionMd((prev) => `${prev}${prev === '' ? '' : '\n'}${fragment}\n`);
  };

  if (asset === undefined) {
    return null;
  }

  return (
    <>
      <DialogRoot open={open} onOpenChange={(details) => !details.open && requestClose()} size="xl">
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent maxW="6xl">
            <DialogHeader>
              <DialogTitle>{isCreate ? `New asset · ${typeLabel}` : `Edit asset · ${typeLabel}`}</DialogTitle>
              <DialogCloseTrigger onClick={requestClose} />
            </DialogHeader>
            <DialogBody>
              <Stack gap={3}>
                <Input value={name} onChange={(event) => setName(event.target.value)} disabled={!canWrite} />
                <HStack justify="space-between" wrap="wrap">
                  <Switch.Root checked={showPreview} onCheckedChange={(details) => setShowPreview(details.checked === true)}>
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>Show preview</Switch.Label>
                  </Switch.Root>
                  {canWrite ? (
                    <AppIconTooltip label="Add images">
                      <IconButton
                        aria-label="Add images"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/jpeg,image/png,image/webp';
                          input.multiple = true;
                          input.onchange = () => {
                            const files = input.files === null ? [] : [...input.files];
                            void Promise.all(files.map((file) => appendImageBlob(file)));
                          };
                          input.click();
                        }}
                      >
                        <AddIcon size={18} />
                      </IconButton>
                    </AppIconTooltip>
                  ) : null}
                </HStack>
                <Text fontSize="sm" fontWeight="medium">
                  Description
                </Text>
                <Grid
                  templateColumns={{base: '1fr', md: showPreview ? '1fr 1fr' : '1fr'}}
                  gap={3}
                  w="full"
                  alignItems="start"
                >
                  {showPreview ? (
                    <Box w="full" borderWidth="1px" borderRadius="md" p={3} minH="120px" order={{base: 1, md: 0}}>
                      <BookMarkdownBody markdown={descriptionMd} />
                    </Box>
                  ) : null}
                  <Textarea
                    ref={descriptionRef}
                    value={descriptionMd}
                    onChange={(event) => setDescriptionMd(event.target.value)}
                    rows={12}
                    w="full"
                    disabled={!canWrite}
                    order={{base: 0, md: showPreview ? 1 : 0}}
                    onPaste={(event) => {
                      const file = [...event.clipboardData.items]
                        .map((item) => item.getAsFile())
                        .find((picked) => picked?.type.startsWith('image/') ?? false);
                      if (file === undefined || file === null || !canWrite) {
                        return;
                      }
                      event.preventDefault();
                      void appendImageBlob(file);
                    }}
                  />
                </Grid>
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
                        onClick={() => void onSave(name, descriptionMd, pendingImagePaths)}
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
        title="Delete asset?"
        description="This asset and its images will be removed permanently."
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
