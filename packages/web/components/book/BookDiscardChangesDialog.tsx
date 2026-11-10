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
} from '@chakra-ui/react';

export interface BookDiscardChangesDialogProps {
  readonly open: boolean;
  readonly onKeepEditing: () => void;
  readonly onDiscard: () => void;
}

export default function BookDiscardChangesDialog({open, onKeepEditing, onDiscard}: BookDiscardChangesDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={(details) => !details.open && onKeepEditing()} size="sm">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
          </DialogHeader>
          <DialogBody>Your edits will be lost.</DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onKeepEditing}>
              Keep editing
            </Button>
            <Button colorPalette="red" onClick={onDiscard}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
