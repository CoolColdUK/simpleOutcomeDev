'use client';

import {Badge, Field, HStack, Input, NativeSelect, Stack, Text} from '@chakra-ui/react';
import {
  FpAmountSign,
  FpColumnTarget,
  fpAmountSignLabel,
  fpColumnTargetLabel,
} from '@so/model';

export interface FpParserDialogMappingFieldProps {
  readonly target: FpColumnTarget;
  readonly columns: readonly string[];
  readonly selectedColumn: string | undefined;
  readonly dateFormat: string;
  readonly sign: FpAmountSign;
  readonly preview: string | undefined;
  readonly hasSampleRows: boolean;
  readonly onSelectColumn: (column: string | undefined) => void;
  readonly onDateFormat: (value: string) => void;
  readonly onSign: (value: FpAmountSign) => void;
}

function previewLabel(
  selectedColumn: string | undefined,
  preview: string | undefined,
  hasSampleRows: boolean,
): string {
  if (selectedColumn === undefined) {
    return 'Not linked';
  }
  if (!hasSampleRows) {
    return 'Drop a CSV to preview';
  }
  if (preview === undefined) {
    return 'No usable sample';
  }
  return preview;
}

export default function FpParserDialogMappingField({
  target,
  columns,
  selectedColumn,
  dateFormat,
  sign,
  preview,
  hasSampleRows,
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
      <HStack justify="space-between" align="start" gap={2}>
        <Text fontSize="sm" fontWeight="medium">
          {fpColumnTargetLabel(target)}
        </Text>
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
          Final value:{' '}
        </Text>
        {previewLabel(selectedColumn, preview, hasSampleRows)}
      </Text>
    </Stack>
  );
}
