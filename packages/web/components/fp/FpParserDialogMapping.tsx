'use client';

import {useState} from 'react';
import {SimpleGrid, Stack, Text} from '@chakra-ui/react';
import {
  FpAmountSign,
  FpColumnTarget,
  previewFpMappedField,
  type FpColumnMap,
} from '@so/model';
import FpParserDialogMappingField from '@/components/fp/FpParserDialogMappingField';
import FpParserDialogMappingSample from '@/components/fp/FpParserDialogMappingSample';

const TARGETS = Object.values(FpColumnTarget);

export interface FpParserDialogMappingProps {
  readonly csvFileName: string | undefined;
  readonly hasHeader: boolean;
  readonly skipRows: number;
  readonly headers: readonly string[];
  readonly sampleRows: readonly Record<string, string>[];
  readonly columnMap: FpColumnMap;
  readonly dateFormat: string;
  readonly sign: FpAmountSign;
  readonly onAssign: (target: FpColumnTarget, column: string | undefined) => void;
  readonly onDateFormat: (value: string) => void;
  readonly onSign: (value: FpAmountSign) => void;
}

function uniqueColumns(headers: readonly string[], columnMap: FpColumnMap): readonly string[] {
  const mapped = Object.values(columnMap).flatMap((m) => (m === undefined ? [] : [m.column]));
  return [...new Set([...headers, ...mapped])];
}

function selectedRowIndex(rowIndex: number, rowCount: number): number {
  if (rowCount === 0 || rowIndex >= rowCount) {
    return 0;
  }
  return rowIndex;
}

export default function FpParserDialogMapping({
  csvFileName,
  hasHeader,
  skipRows,
  headers,
  sampleRows,
  columnMap,
  dateFormat,
  sign,
  onAssign,
  onDateFormat,
  onSign,
}: FpParserDialogMappingProps) {
  const [rowIndex, setRowIndex] = useState(0);
  const columns = uniqueColumns(headers, columnMap);
  const selectedIndex = selectedRowIndex(rowIndex, sampleRows.length);
  const sampleRow = sampleRows[selectedIndex];
  const previewRows = sampleRow === undefined ? [] : [sampleRow];
  const resolvedMap: FpColumnMap = {
    ...columnMap,
    [FpColumnTarget.DATE]:
      columnMap[FpColumnTarget.DATE] === undefined
        ? undefined
        : {...columnMap[FpColumnTarget.DATE], dateFormat},
    [FpColumnTarget.AMOUNT]:
      columnMap[FpColumnTarget.AMOUNT] === undefined
        ? undefined
        : {...columnMap[FpColumnTarget.AMOUNT], sign},
  };
  return (
    <Stack gap={4}>
      <FpParserDialogMappingSample
        csvFileName={csvFileName}
        hasHeader={hasHeader}
        skipRows={skipRows}
        sampleRows={sampleRows}
        rowIndex={selectedIndex}
        onRowIndex={setRowIndex}
      />
      <Stack gap={2}>
        <Text fontWeight="medium">Transaction fields</Text>
        <Text fontSize="sm" color="fg.muted">
          Link each field to a CSV column. Before is the example cell; after is the parsed value.
        </Text>
        <SimpleGrid columns={{base: 1, md: 2}} gap={3}>
          {TARGETS.map((target) => {
            const mapping = columnMap[target];
            return (
              <FpParserDialogMappingField
                key={target}
                target={target}
                columns={columns}
                selectedColumn={mapping?.column}
                dateFormat={dateFormat}
                sign={sign}
                before={mapping === undefined || sampleRow === undefined ? undefined : sampleRow[mapping.column]}
                after={previewFpMappedField(previewRows, target, resolvedMap[target])}
                hasSampleRow={sampleRow !== undefined}
                onSelectColumn={(column) => onAssign(target, column)}
                onDateFormat={onDateFormat}
                onSign={onSign}
              />
            );
          })}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
