'use client';

import {useState} from 'react';
import {Button, Field, HStack, Input, NativeSelect, Stack, Text} from '@chakra-ui/react';
import {
  FpAmountOperator,
  formatFpAutoAssignRule,
  fpAmountOperatorLabel,
  type FpCategoryFilter,
} from '@so/model';

export interface FpCategoryDialogAutoAssignProps {
  readonly filters: readonly FpCategoryFilter[];
  readonly onChange: (next: readonly FpCategoryFilter[]) => void;
}

export default function FpCategoryDialogAutoAssign({filters, onChange}: FpCategoryDialogAutoAssignProps) {
  const [building, setBuilding] = useState(false);
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [amountOperator, setAmountOperator] = useState<FpAmountOperator>(FpAmountOperator.EQ);

  const resetBuilder = (): void => {
    setDescription('');
    setRecipient('');
    setAmount('');
    setAmountOperator(FpAmountOperator.EQ);
    setBuilding(false);
  };

  const addRule = (): void => {
    const amountRaw = amount.trim();
    const amountValue = amountRaw === '' ? undefined : Number(amountRaw);
    if (amountRaw !== '' && (amountValue === undefined || Number.isNaN(amountValue))) {
      return;
    }
    const formatted = formatFpAutoAssignRule({
      description,
      recipient,
      amount: amountValue,
      amountOperator: amountValue === undefined ? undefined : amountOperator,
    });
    if (formatted === undefined) {
      return;
    }
    onChange([...filters, formatted]);
    resetBuilder();
  };

  return (
    <Stack gap={2}>
      <Field.Root>
        <Field.Label>Auto-assign rules</Field.Label>
        {filters.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No rules yet. Add one to auto-categorise matching transactions.
          </Text>
        ) : (
          <Stack gap={1}>
            {filters.map((rule, index) => (
              <HStack key={`${rule}-${index}`} justify="space-between" gap={2}>
                <Text fontSize="sm" fontFamily="mono" wordBreak="break-all">
                  {rule}
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onChange(filters.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </HStack>
            ))}
          </Stack>
        )}
        <Field.HelperText>
          Each rule is one string. Fields in a rule are AND; multiple rules are OR. Description and
          recipient are partial matches.
        </Field.HelperText>
      </Field.Root>
      {building ? (
        <Stack gap={2} p={3} borderWidth="1px" borderColor="border.subtle" borderRadius="md">
          <Field.Root>
            <Field.Label>Description contains (optional)</Field.Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="netflix" />
          </Field.Root>
          <Field.Root>
            <Field.Label>Recipient contains (optional)</Field.Label>
            <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="HSBC" />
          </Field.Root>
          <HStack align="flex-end" gap={2}>
            <Field.Root flex="1">
              <Field.Label>Amount operator</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={amountOperator}
                  onChange={(e) => setAmountOperator(e.target.value as FpAmountOperator)}
                >
                  {Object.values(FpAmountOperator).map((op) => (
                    <option key={op} value={op}>
                      {fpAmountOperatorLabel(op)}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root flex="1">
              <Field.Label>Amount (optional)</Field.Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="-15.99" />
            </Field.Root>
          </HStack>
          <HStack justify="flex-end" gap={2}>
            <Button size="sm" variant="outline" onClick={resetBuilder}>
              Cancel
            </Button>
            <Button
              size="sm"
              colorPalette="brand"
              disabled={description.trim() === '' && recipient.trim() === '' && amount.trim() === ''}
              onClick={addRule}
            >
              Add rule
            </Button>
          </HStack>
        </Stack>
      ) : (
        <Button size="sm" variant="outline" alignSelf="flex-start" onClick={() => setBuilding(true)}>
          Build rule
        </Button>
      )}
    </Stack>
  );
}
