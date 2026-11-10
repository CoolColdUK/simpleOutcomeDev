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
} from '@chakra-ui/react';

export interface BookAddAssetTypeDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreate: (label: string) => Promise<void>;
}

export default function BookAddAssetTypeDialog({open, onClose, onCreate}: BookAddAssetTypeDialogProps) {
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New asset type</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Field.Root required>
                <Field.Label>Label</Field.Label>
                <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Vehicles" />
              </Field.Root>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={() => {
                const trimmed = label.trim();
                if (trimmed === '') {
                  return;
                }
                setSaving(true);
                void onCreate(trimmed)
                  .then(() => {
                    setLabel('');
                    onClose();
                  })
                  .finally(() => setSaving(false));
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
