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
import {FpBudgetPeriod, FpCategoryDirection, fpCategoryDirectionLabel, parseFpName} from '@so/model';
import createDbFpCategory from '@/lib/api/db/createDbFpCategory';

export interface FpCategoryDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export default function FpCategoryDialog({open, podId, onClose, onSaved}: FpCategoryDialogProps) {
  const [name, setName] = useState('');
  const [direction, setDirection] = useState<FpCategoryDirection>(FpCategoryDirection.EXPENSE);
  const [filter, setFilter] = useState('');
  const [budget, setBudget] = useState('');
  const [period, setPeriod] = useState<FpBudgetPeriod | ''>('');
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const budgetAmount = budget.trim() === '' ? undefined : Number(budget);
      await createDbFpCategory(podId, parseFpName(name), direction, {
        filters: filter.trim() === '' ? [] : [{descriptionContains: filter.trim()}],
        budgetAmount,
        budgetPeriod: period === '' ? undefined : period,
      });
      setName('');
      setFilter('');
      setBudget('');
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
            <DialogTitle>Add category</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Direction</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as FpCategoryDirection)}
                  >
                    {Object.values(FpCategoryDirection).map((d) => (
                      <option key={d} value={d}>
                        {fpCategoryDirectionLabel(d)}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>Auto-assign contains</Field.Label>
                <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="NETFLIX" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Budget amount (optional)</Field.Label>
                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Budget period</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={period} onChange={(e) => setPeriod(e.target.value as FpBudgetPeriod | '')}>
                    <option value="">None</option>
                    <option value={FpBudgetPeriod.MONTHLY}>Monthly</option>
                    <option value={FpBudgetPeriod.YEARLY}>Yearly</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
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
