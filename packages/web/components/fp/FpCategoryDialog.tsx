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
import {FpBudgetPeriod, FpCategoryDirection, fpCategoryDirectionLabel, parseFpName} from '@so/model';
import createDbFpCategory from '@/lib/api/db/createDbFpCategory';
import updateDbFpCategory from '@/lib/api/db/updateDbFpCategory';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';

export interface FpCategoryDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly category?: DbFpCategory;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

function filterText(category: DbFpCategory | undefined): string {
  const first = category?.filters[0];
  if (first === undefined) {
    return '';
  }
  return first.descriptionContains ?? '';
}

export default function FpCategoryDialog(props: FpCategoryDialogProps) {
  if (!props.open) {
    return null;
  }
  return <FpCategoryDialogBody key={props.category?.id ?? 'new'} {...props} />;
}

function FpCategoryDialogBody({open, podId, category, onClose, onSaved}: FpCategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [direction, setDirection] = useState<FpCategoryDirection>(
    category?.direction ?? FpCategoryDirection.EXPENSE,
  );
  const [filter, setFilter] = useState(filterText(category));
  const [budget, setBudget] = useState(category?.budgetAmount === undefined ? '' : String(category.budgetAmount));
  const [period, setPeriod] = useState<FpBudgetPeriod | ''>(category?.budgetPeriod ?? '');
  const [favourite, setFavourite] = useState(category?.favourite ?? false);
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const parsedName = parseFpName(name);
      const budgetAmount = budget.trim() === '' ? undefined : Number(budget);
      const budgetPeriod = period === '' ? undefined : period;
      const filters = filter.trim() === '' ? [] : [{descriptionContains: filter.trim()}];
      if (category === undefined) {
        await createDbFpCategory(podId, parsedName, direction, {
          filters,
          budgetAmount,
          budgetPeriod,
          favourite,
        });
      } else {
        await updateDbFpCategory(category.id, {
          name: parsedName,
          direction,
          filters,
          favourite,
          sortOrder: Number(sortOrder) || 0,
          ...(budgetAmount === undefined || budgetPeriod === undefined
            ? {clearBudget: true}
            : {budgetAmount, budgetPeriod}),
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
            <DialogTitle>{category === undefined ? 'Add category' : 'Edit category'}</DialogTitle>
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
              <Switch.Root checked={favourite} onCheckedChange={(e) => setFavourite(e.checked)}>
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Label>Favourite</Switch.Label>
              </Switch.Root>
              {category !== undefined ? (
                <Field.Root>
                  <Field.Label>Sort order</Field.Label>
                  <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                </Field.Root>
              ) : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button colorPalette="brand" loading={saving} disabled={name.trim() === ''} onClick={() => void save()}>
              {category === undefined ? 'Add' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
