'use client';

import {
  Button,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Text,
} from '@chakra-ui/react';

export interface BookConfirmDeleteDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export default function BookConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}: BookConfirmDeleteDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={(details) => !details.open && onCancel()} size="sm">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text>{description}</Text>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button colorPalette="red" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
