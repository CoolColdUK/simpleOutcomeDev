'use client';

import {useEffect, useState} from 'react';
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
  Input,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';
import BookAssetImageGallery from '@/components/book/BookAssetImageGallery';

export interface BookAssetEditDialogProps {
  readonly open: boolean;
  readonly asset: DbBkAsset | undefined;
  readonly podId: string;
  readonly typeLabel: string;
  readonly canWrite: boolean;
  readonly onClose: () => void;
  readonly onSave: (name: string, descriptionMd: string) => Promise<void>;
  readonly onDelete: () => Promise<void>;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
}

export default function BookAssetEditDialog({
  open,
  asset,
  podId,
  typeLabel,
  canWrite,
  onClose,
  onSave,
  onDelete,
  onReload,
  onError,
}: BookAssetEditDialogProps) {
  const [name, setName] = useState('');
  const [descriptionMd, setDescriptionMd] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (asset === undefined) {
      return;
    }
    queueMicrotask(() => {
      setName(asset.name);
      setDescriptionMd(asset.descriptionMd);
      setConfirmDelete(false);
    });
  }, [asset]);

  if (asset === undefined) {
    return null;
  }

  const dirty = name !== asset.name || descriptionMd !== asset.descriptionMd;

  const requestClose = (): void => {
    if (dirty && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    onClose();
  };

  return (
    <DialogRoot open={open} onOpenChange={(details) => !details.open && requestClose()}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit asset · {typeLabel}
            </DialogTitle>
            <DialogCloseTrigger onClick={requestClose} />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Input value={name} onChange={(event) => setName(event.target.value)} disabled={!canWrite} />
              <Textarea value={descriptionMd} onChange={(event) => setDescriptionMd(event.target.value)} rows={6} disabled={!canWrite} />
              <BookAssetImageGallery
                podId={podId}
                assetId={asset.id}
                images={asset.images}
                canWrite={canWrite}
                onChanged={onReload}
                onError={onError}
              />
            </Stack>
          </DialogBody>
          <DialogFooter>
            <HStack justify="space-between" w="full">
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
              ) : (
                <span />
              )}
              <HStack>
                <Button variant="outline" onClick={requestClose}>
                  Cancel
                </Button>
                {canWrite ? (
                  <Button onClick={() => void onSave(name, descriptionMd)}>Save</Button>
                ) : null}
              </HStack>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
