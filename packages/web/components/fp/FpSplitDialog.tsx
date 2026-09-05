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
  Text,
} from '@chakra-ui/react';
import createDbFpBillSplit from '@/lib/api/db/createDbFpBillSplit';

export interface FpSplitDialogProps {
  readonly open: boolean;
  readonly parentId?: string;
  readonly parentDate?: string;
  readonly userId: string;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export default function FpSplitDialog({open, parentId, parentDate, userId, onClose, onSaved}: FpSplitDialogProps) {
  const [portions, setPortions] = useState('12');
  const [start, setStart] = useState(parentDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (): Promise<void> => {
    if (parentId === undefined) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createDbFpBillSplit(parentId, userId, Number(portions), start);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
            <DialogTitle>Split into monthly portions</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Field.Root>
                <Field.Label>Portions</Field.Label>
                <Input type="number" value={portions} onChange={(e) => setPortions(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Start date</Field.Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </Field.Root>
              {error !== '' ? <Text color="fg.muted">{error}</Text> : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button colorPalette="brand" loading={saving} onClick={() => void save()}>
              Split
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
