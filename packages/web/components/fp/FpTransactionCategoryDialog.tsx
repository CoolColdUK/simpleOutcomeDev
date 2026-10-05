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
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react';
import formatFpMoney from '@/lib/fp/formatFpMoney';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import type {DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';

export interface FpTransactionCategoryDialogProps {
  readonly open: boolean;
  readonly transaction: DbFpTransaction | undefined;
  readonly categories: readonly DbFpCategory[];
  readonly currency: string;
  readonly onClose: () => void;
  readonly onSave: (transactionId: string, categoryId: string | undefined) => Promise<void>;
}

export default function FpTransactionCategoryDialog({
  open,
  transaction,
  categories,
  currency,
  onClose,
  onSave,
}: FpTransactionCategoryDialogProps) {
  if (!open || transaction === undefined) {
    return null;
  }
  return (
    <FpTransactionCategoryDialogBody
      key={transaction.id}
      transaction={transaction}
      categories={categories}
      currency={currency}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function FpTransactionCategoryDialogBody({
  transaction,
  categories,
  currency,
  onClose,
  onSave,
}: Omit<FpTransactionCategoryDialogProps, 'open' | 'transaction'> & {readonly transaction: DbFpTransaction}) {
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? '');
  const [saving, setSaving] = useState(false);

  const leaves = categories.filter((c) => !c.isGroup);

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      await onSave(transaction.id, categoryId === '' ? undefined : categoryId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogRoot open onOpenChange={(event) => (!event.open ? onClose() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign category</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Text fontSize="sm" color="fg.muted">
                {transaction.postedDate} · {formatFpMoney(transaction.amount, currency)}
              </Text>
              <Text fontSize="sm">{transaction.description}</Text>
              <Field.Root>
                <Field.Label>Category</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Uncategorised</option>
                    {leaves.map((c) => (
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
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button colorPalette="brand" onClick={() => void save()} loading={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
