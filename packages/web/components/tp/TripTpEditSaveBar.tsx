import {Button, HStack} from '@chakra-ui/react';
import type {ReactNode} from 'react';

export interface TripTpEditSaveBarProps {
  readonly editing: boolean;
  readonly canWrite: boolean;
  readonly saveLabel?: string;
  readonly busy?: boolean;
  readonly onEdit: () => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly trailing?: ReactNode;
}

export default function TripTpEditSaveBar({
  editing,
  canWrite,
  saveLabel = 'Save',
  busy = false,
  onEdit,
  onSave,
  onCancel,
  trailing,
}: TripTpEditSaveBarProps) {
  if (!canWrite) {
    return null;
  }
  if (editing) {
    return (
      <HStack wrap="wrap">
        <Button size="sm" colorPalette="brand" disabled={busy} onClick={onSave}>
          {busy ? 'Saving…' : saveLabel}
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        {trailing}
      </HStack>
    );
  }
  return (
    <HStack wrap="wrap">
      <Button size="sm" variant="outline" onClick={onEdit}>
        Edit
      </Button>
      {trailing}
    </HStack>
  );
}
