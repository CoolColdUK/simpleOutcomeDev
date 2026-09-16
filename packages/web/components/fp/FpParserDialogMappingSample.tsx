'use client';

import {Field, NativeSelect, Stack, Text, Textarea} from '@chakra-ui/react';

export interface FpParserDialogMappingSampleProps {
  readonly csvFileName: string | undefined;
  readonly hasHeader: boolean;
  readonly skipRows: number;
  readonly sampleRows: readonly Record<string, string>[];
  readonly rowIndex: number;
  readonly onRowIndex: (index: number) => void;
}

function fileLineNumber(dataIndex: number, skipRows: number, hasHeader: boolean): number {
  const headerOffset = hasHeader ? 1 : 0;
  return skipRows + headerOffset + dataIndex + 1;
}

function emptyMessage(csvFileName: string | undefined): string {
  if (csvFileName === undefined) {
    return 'Drop an example CSV at the top of this dialog to preview rows from that file.';
  }
  return `No data rows in ${csvFileName}. Keep skip at 0 if the file starts with a header — the header switch already uses that row.`;
}

function rowLabel(index: number, skipRows: number, hasHeader: boolean): string {
  return `Data ${index + 1} (line ${fileLineNumber(index, skipRows, hasHeader)})`;
}

export default function FpParserDialogMappingSample({
  csvFileName,
  hasHeader,
  skipRows,
  sampleRows,
  rowIndex,
  onRowIndex,
}: FpParserDialogMappingSampleProps) {
  const row = sampleRows[rowIndex];
  const json = row === undefined ? '' : JSON.stringify(row, undefined, 2);
  return (
    <Stack gap={2}>
      <Text fontWeight="medium">Example row</Text>
      <Text fontSize="sm" color="fg.muted">
        {csvFileName === undefined
          ? 'Uses the CSV dropped at the top of this dialog.'
          : `From ${csvFileName}. Choose a data row; transaction fields use this row for before and after.`}
      </Text>
      {sampleRows.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {emptyMessage(csvFileName)}
        </Text>
      ) : (
        <Field.Root>
          <Field.Label>Row</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={String(rowIndex)}
              onChange={(e) => onRowIndex(Number(e.target.value))}
            >
              {sampleRows.map((_, index) => (
                <option key={index} value={index}>
                  {rowLabel(index, skipRows, hasHeader)}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
      )}
      <Textarea value={json} readOnly minH="8rem" fontFamily="mono" fontSize="sm" />
    </Stack>
  );
}
