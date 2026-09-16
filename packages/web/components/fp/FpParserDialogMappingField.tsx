'use client';

import {Badge, Field, HStack, Input, NativeSelect, Stack, Text} from '@chakra-ui/react';
import {
  FpAmountSign,
  FpColumnTarget,
  fpAmountSignLabel,
  fpColumnTargetLabel,
} from '@so/model';
import AppInfoTooltip from '@/components/app/AppInfoTooltip';

const AMOUNT_SIGN_NOTE =
  '+ve is income (money in). -ve is expense (money out), including credit-card spend.';

export interface FpParserDialogMappingFieldProps {
  readonly target: FpColumnTarget;
  readonly columns: readonly string[];
  readonly selectedColumn: string | undefined;
  readonly dateFormat: string;
  readonly sign: FpAmountSign;
  readonly before: string | undefined;
  readonly after: string | undefined;
  readonly hasSampleRow: boolean;
  readonly onSelectColumn: (column: string | undefined) => void;
  readonly onDateFormat: (value: string) => void;
  readonly onSign: (value: FpAmountSign) => void;
}

function beforeLabel(
  selectedColumn: string | undefined,
  before: string | undefined,
  hasSampleRow: boolean,
): string {
  if (selectedColumn === undefined) {
    return 'Not linked';
  }
  if (!hasSampleRow) {
    return 'Drop a CSV to preview';
  }
  if (before === undefined || before.trim() === '') {
    return '(empty)';
  }
  return before;
}

function afterLabel(
  selectedColumn: string | undefined,
  after: string | undefined,
  hasSampleRow: boolean,
): string {
  if (selectedColumn === undefined) {
    return 'Not linked';
  }
  if (!hasSampleRow) {
    return 'Drop a CSV to preview';
  }
  if (after === undefined) {
    return 'No usable sample';
  }
  return after;
}

export default function FpParserDialogMappingField({
  target,
  columns,
  selectedColumn,
  dateFormat,
  sign,
  before,
  after,
  hasSampleRow,
  onSelectColumn,
  onDateFormat,
  onSign,
}: FpParserDialogMappingFieldProps) {
  return (
    <Stack
      gap={2}
      borderWidth="1px"
      borderRadius="md"
      p={3}
      bg="bg.subtle"
    >
      <HStack justify="space-between" align="center" gap={2}>
        <HStack gap={1}>
          <Text fontSize="sm" fontWeight="medium">
            {fpColumnTargetLabel(target)}
          </Text>
          {target === FpColumnTarget.AMOUNT ? <AppInfoTooltip label={AMOUNT_SIGN_NOTE} /> : null}
        </HStack>
        {target === FpColumnTarget.AMOUNT ? (
          <Badge size="sm" colorPalette="brand">
            {fpAmountSignLabel(sign)}
          </Badge>
        ) : null}
      </HStack>
      <Field.Root>
        <Field.Label>CSV column</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            value={selectedColumn ?? ''}
            onChange={(e) => onSelectColumn(e.target.value === '' ? undefined : e.target.value)}
          >
            <option value="">Not mapped</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
      {target === FpColumnTarget.DATE ? (
        <Field.Root>
          <Field.Label>Date format</Field.Label>
          <Input value={dateFormat} onChange={(e) => onDateFormat(e.target.value)} />
        </Field.Root>
      ) : null}
      {target === FpColumnTarget.AMOUNT ? (
        <Field.Root>
          <Field.Label>Amount sign</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={sign} onChange={(e) => onSign(e.target.value as FpAmountSign)}>
              {Object.values(FpAmountSign).map((option) => (
                <option key={option} value={option}>
                  {fpAmountSignLabel(option)}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
      ) : null}
      <Text fontSize="sm">
        <Text as="span" color="fg.muted">
          Before:{' '}
        </Text>
        {beforeLabel(selectedColumn, before, hasSampleRow)}
      </Text>
      <Text fontSize="sm">
        <Text as="span" color="fg.muted">
          After:{' '}
        </Text>
        {afterLabel(selectedColumn, after, hasSampleRow)}
      </Text>
    </Stack>
  );
}
