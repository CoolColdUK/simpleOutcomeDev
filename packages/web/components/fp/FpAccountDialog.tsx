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
  Switch,
} from '@chakra-ui/react';
import {FpAccountKind, fpAccountKindLabel, parseFpName} from '@so/model';
import createDbFpAccount from '@/lib/api/db/createDbFpAccount';
import updateDbFpAccount from '@/lib/api/db/updateDbFpAccount';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';

export interface FpAccountDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly account?: DbFpAccount;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export default function FpAccountDialog(props: FpAccountDialogProps) {
  if (!props.open) {
    return null;
  }
  return <FpAccountDialogBody key={props.account?.id ?? 'new'} {...props} />;
}

function FpAccountDialogBody({open, podId, account, onClose, onSaved}: FpAccountDialogProps) {
  const [name, setName] = useState(account?.name ?? '');
  const [kind, setKind] = useState<FpAccountKind>(account?.kind ?? FpAccountKind.CURRENT);
  const [opening, setOpening] = useState(String(account?.openingFund ?? 0));
  const [notes, setNotes] = useState(account?.notes ?? '');
  const [archived, setArchived] = useState(account?.archived ?? false);
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const parsedName = parseFpName(name);
      if (account === undefined) {
        await createDbFpAccount(podId, parsedName, kind, Number(opening));
      } else {
        await updateDbFpAccount(account.id, {
          name: parsedName,
          kind,
          openingFund: Number(opening),
          notes,
          archived,
        });
      }
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
            <DialogTitle>{account === undefined ? 'Add account' : 'Edit account'}</DialogTitle>
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
              <Field.Root>
                <Field.Label>Notes</Field.Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field.Root>
              {account !== undefined ? (
                <Switch.Root checked={archived} onCheckedChange={(e) => setArchived(e.checked)}>
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Label>Archived</Switch.Label>
                </Switch.Root>
              ) : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button colorPalette="brand" loading={saving} disabled={name.trim() === ''} onClick={() => void save()}>
              {account === undefined ? 'Add' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
