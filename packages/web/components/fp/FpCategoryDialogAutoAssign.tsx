'use client';

import {useState} from 'react';
import {Button, Field, HStack, Input, NativeSelect, Stack, Text} from '@chakra-ui/react';
import {
  FpAmountOperator,
  formatFpAutoAssignRule,
  fpAmountOperatorLabel,
  type FpCategoryFilter,
} from '@so/model';
import AppInfoTooltip from '@/components/app/AppInfoTooltip';

export type FpAutoAssignAmountMode = 'none' | 'compare' | 'range';

export interface FpCategoryDialogAutoAssignProps {
  readonly filters: readonly FpCategoryFilter[];
  readonly onChange: (next: readonly FpCategoryFilter[]) => void;
}

const AMOUNT_SIGN_TOOLTIP =
  'Use negative amounts for expenses (money out). Income and refunds are positive.';

const AMOUNT_RANGE_TOOLTIP =
  'Range uses inclusive bounds: amount must be greater than or equal to the minimum and less than or equal to the maximum (both endpoints count). You can set only a minimum or only a maximum.';

function parseOptionalAmount(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return undefined;
  }
  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    return undefined;
  }
  return value;
}

export default function FpCategoryDialogAutoAssign({filters, onChange}: FpCategoryDialogAutoAssignProps) {
  const [building, setBuilding] = useState(false);
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amountMode, setAmountMode] = useState<FpAutoAssignAmountMode>('none');
  const [amount, setAmount] = useState('');
  const [amountOperator, setAmountOperator] = useState<FpAmountOperator>(FpAmountOperator.EQ);
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  const resetBuilder = (): void => {
    setDescription('');
    setRecipient('');
    setAmountMode('none');
    setAmount('');
    setAmountOperator(FpAmountOperator.EQ);
    setAmountMin('');
    setAmountMax('');
    setBuilding(false);
  };

  const hasValidAmount = (): boolean => {
    if (amountMode === 'compare') {
      return parseOptionalAmount(amount) !== undefined;
    }
    if (amountMode === 'range') {
      return parseOptionalAmount(amountMin) !== undefined || parseOptionalAmount(amountMax) !== undefined;
    }
    return false;
  };

  const addRule = (): void => {
    const amountValue = amountMode === 'compare' ? parseOptionalAmount(amount) : undefined;
    const minValue = amountMode === 'range' ? parseOptionalAmount(amountMin) : undefined;
    const maxValue = amountMode === 'range' ? parseOptionalAmount(amountMax) : undefined;
    if (amountMode === 'compare' && amountValue === undefined) {
      return;
    }
    if (amountMode === 'range' && minValue === undefined && maxValue === undefined) {
      return;
    }
    const formatted = formatFpAutoAssignRule({
      description,
      recipient,
      amount: amountValue,
      amountOperator: amountValue === undefined ? undefined : amountOperator,
      amountMin: minValue,
      amountMinOperator: minValue === undefined ? undefined : FpAmountOperator.GTE,
      amountMax: maxValue,
      amountMaxOperator: maxValue === undefined ? undefined : FpAmountOperator.LTE,
    });
    if (formatted === undefined) {
      return;
    }
    onChange([...filters, formatted]);
    resetBuilder();
  };

  const canAdd =
    description.trim() !== '' || recipient.trim() !== '' || (amountMode !== 'none' && hasValidAmount());

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
          recipient are partial matches. Amount can be a single comparison or an inclusive min–max range.
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
          <Field.Root>
            <HStack gap={1}>
              <Field.Label>Amount (optional)</Field.Label>
              <AppInfoTooltip label={AMOUNT_SIGN_TOOLTIP} />
            </HStack>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={amountMode}
                onChange={(e) => setAmountMode(e.target.value as FpAutoAssignAmountMode)}
              >
                <option value="none">No amount condition</option>
                <option value="compare">Single comparison</option>
                <option value="range">Range (min and max)</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Field.Root>
          {amountMode === 'compare' ? (
            <HStack align="flex-end" gap={2}>
              <Field.Root flex="1">
                <Field.Label>Operator</Field.Label>
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
                <Field.Label>Value</Field.Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="-15.99" />
              </Field.Root>
            </HStack>
          ) : null}
          {amountMode === 'range' ? (
            <Stack gap={2}>
              <HStack gap={1}>
                <Text fontSize="sm" fontWeight="medium">Range bounds</Text>
                <AppInfoTooltip label={AMOUNT_RANGE_TOOLTIP} />
              </HStack>
              <HStack align="flex-end" gap={2}>
                <Field.Root flex="1">
                  <Field.Label>Minimum (inclusive ≥)</Field.Label>
                  <Input
                    type="number"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    placeholder="-200"
                  />
                </Field.Root>
                <Field.Root flex="1">
                  <Field.Label>Maximum (inclusive ≤)</Field.Label>
                  <Input
                    type="number"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    placeholder="-5"
                  />
                </Field.Root>
              </HStack>
            </Stack>
          ) : null}
          <HStack justify="flex-end" gap={2}>
            <Button size="sm" variant="outline" onClick={resetBuilder}>
              Cancel
            </Button>
            <Button size="sm" colorPalette="brand" disabled={!canAdd} onClick={addRule}>
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
