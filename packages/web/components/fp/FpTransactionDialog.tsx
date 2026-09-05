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
import createDbFpTransaction from '@/lib/api/db/createDbFpTransaction';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';

export interface FpTransactionDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly userId: string;
  readonly accounts: readonly DbFpAccount[];
  readonly categories: readonly DbFpCategory[];
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export default function FpTransactionDialog({
  open,
  podId,
  userId,
  accounts,
  categories,
  onClose,
  onSaved,
}: FpTransactionDialogProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      await createDbFpTransaction(podId, accountId, userId, date, Number(amount), {
        description,
        categoryId: categoryId === '' ? undefined : categoryId,
      });
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
            <DialogTitle>Add transaction</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Field.Root>
                <Field.Label>Account</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>Date</Field.Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Amount (+ income / − expense)</Field.Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Category</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Uncategorised</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette="brand"
              loading={saving}
              disabled={accountId === '' || date === '' || amount === ''}
              onClick={() => void save()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
