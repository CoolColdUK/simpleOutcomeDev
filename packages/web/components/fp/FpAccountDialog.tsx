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
  NativeSelect,
  Stack,
} from '@chakra-ui/react';
import {FpAccountKind, fpAccountKindLabel, parseFpName} from '@so/model';
import createDbFpAccount from '@/lib/api/db/createDbFpAccount';

export interface FpAccountDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export default function FpAccountDialog({open, podId, onClose, onSaved}: FpAccountDialogProps) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<FpAccountKind>(FpAccountKind.CURRENT);
  const [opening, setOpening] = useState('0');
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      await createDbFpAccount(podId, parseFpName(name), kind, Number(opening));
      setName('');
      setOpening('0');
      onSaved();
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
            <DialogTitle>Add account</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Kind</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={kind} onChange={(e) => setKind(e.target.value as FpAccountKind)}>
                    {Object.values(FpAccountKind).map((k) => (
                      <option key={k} value={k}>
                        {fpAccountKindLabel(k)}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>Opening fund</Field.Label>
                <Input type="number" value={opening} onChange={(e) => setOpening(e.target.value)} />
              </Field.Root>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button colorPalette="brand" loading={saving} disabled={name.trim() === ''} onClick={() => void save()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
