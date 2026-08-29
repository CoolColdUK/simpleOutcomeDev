'use client';

import {useState} from 'react';
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
  Field,
  Input,
} from '@chakra-ui/react';
import createDbTodoColumn from '@/lib/api/db/createDbTodoColumn';

export interface TodoListAddColumnDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly nextSortOrder: number;
  readonly onClose: () => void;
  readonly onAdded: () => void;
}

export default function TodoListAddColumnDialog({
  open,
  podId,
  nextSortOrder,
  onClose,
  onAdded,
}: TodoListAddColumnDialogProps) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const add = async (): Promise<void> => {
    setSaving(true);
    try {
      await createDbTodoColumn(podId, title, nextSortOrder);
      setTitle('');
      onAdded();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add column</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Field.Root>
              <Field.Label>Title</Field.Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field.Root>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button colorPalette="brand" loading={saving} disabled={title.trim() === ''} onClick={() => void add()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
