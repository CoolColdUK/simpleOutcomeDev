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
  Stack,
  Textarea,
} from '@chakra-ui/react';
import updateDbPod from '@/lib/api/db/updateDbPod';
import type {DbPod} from '@/lib/api/db/listDbPods';

export interface PodEditDialogProps {
  readonly open: boolean;
  readonly pod: DbPod;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export default function PodEditDialog({open, pod, onClose, onSaved}: PodEditDialogProps) {
  const [name, setName] = useState(pod.name ?? '');
  const [description, setDescription] = useState(pod.description ?? '');

  const save = async (): Promise<void> => {
    await updateDbPod(pod.id, name, pod.visibility, description);
    onSaved();
    onClose();
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit pod</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Field.Root>
                <Field.Label>Title</Field.Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </Field.Root>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button colorPalette="brand" onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
