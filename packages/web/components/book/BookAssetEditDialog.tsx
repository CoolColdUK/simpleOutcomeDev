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
  Input,
  Stack,
} from '@chakra-ui/react';
import {CrossIcon, DeleteIcon, SaveIcon} from '@so/component';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';
import BookConfirmDeleteDialog from '@/components/book/BookConfirmDeleteDialog';
import BookDiscardChangesDialog from '@/components/book/BookDiscardChangesDialog';
import BookMarkdownEditorWithPreview from '@/components/book/BookMarkdownEditorWithPreview';
import BookAssetAttachedImagesPanel from '@/components/book/BookAssetAttachedImagesPanel';
import AppIconTooltip from '@/components/app/AppIconTooltip';
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
  readonly onReload: () => Promise<void>;
  readonly onSave: (name: string, descriptionMd: string, pendingImagePaths: readonly string[]) => Promise<void>;
  readonly onDelete?: () => Promise<void>;
  readonly onError: (message: string) => void;
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
  onReload,
  onSave,
  onDelete,
  onError,
}: BookAssetEditDialogProps) {
  const [name, setName] = useState('');
  const [descriptionMd, setDescriptionMd] = useState('');
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

  const pasteDescriptionImage = async (blob: Blob): Promise<string | undefined> => {
    if (asset === undefined || !canWrite) {
      return undefined;
    }
    const {fragment} = await uploadStorageBookAssetInlineImageMarkdownFragment(podId, asset.id, blob);
    return `${fragment}\n`;
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
              <Stack gap={4}>
                <Input value={name} onChange={(event) => setName(event.target.value)} disabled={!canWrite} />
                <BookMarkdownEditorWithPreview
                  label="Description"
                  hint="Paste images into the description for inline markdown. Use attached images below for the gallery."
                  value={descriptionMd}
                  onChange={setDescriptionMd}
                  disabled={!canWrite}
                  rows={12}
                  textareaRef={descriptionRef}
                  onPasteImage={canWrite ? pasteDescriptionImage : undefined}
                />
                <BookAssetAttachedImagesPanel
                  podId={podId}
                  assetId={asset.id}
                  images={asset.images}
                  canWrite={canWrite}
                  onChanged={onReload}
                  onError={onError}
                  skipDbInsert={isCreate}
                  onPendingGalleryPath={(path) => setPendingImagePaths((paths) => [...paths, path])}
                />
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
