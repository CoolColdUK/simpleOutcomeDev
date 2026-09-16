'use client';

import {SimpleGrid, Stack, Text} from '@chakra-ui/react';
import {
  exampleFpCsvColumnValue,
  FpAmountSign,
  FpColumnTarget,
  fpColumnTargetLabel,
  previewFpMappedField,
  type FpColumnMap,
} from '@so/model';
import FpParserDialogMappingColumn from '@/components/fp/FpParserDialogMappingColumn';
import FpParserDialogMappingField from '@/components/fp/FpParserDialogMappingField';

const TARGETS = Object.values(FpColumnTarget);

export interface FpParserDialogMappingProps {
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

export default function FpParserDialogMapping({
  headers,
  sampleRows,
  columnMap,
  dateFormat,
  sign,
  onAssign,
  onDateFormat,
  onSign,
}: FpParserDialogMappingProps) {
  const columns = uniqueColumns(headers, columnMap);
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
      <Stack gap={2}>
        <Text fontWeight="medium">CSV columns</Text>
        <Text fontSize="sm" color="fg.muted">
          Hover a column to see a sample value from the file.
        </Text>
        {columns.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            Drop an example CSV to list its columns.
          </Text>
        ) : (
          <SimpleGrid columns={{base: 1, sm: 2}} gap={2}>
            {columns.map((column) => {
              const linked = TARGETS.filter((target) => columnMap[target]?.column === column);
              return (
                <FpParserDialogMappingColumn
                  key={column}
                  column={column}
                  example={exampleFpCsvColumnValue(sampleRows, column)}
                  linkedLabels={linked.map((target) => fpColumnTargetLabel(target))}
                />
              );
            })}
          </SimpleGrid>
        )}
      </Stack>
      <Stack gap={2}>
        <Text fontWeight="medium">Transaction fields</Text>
        <Text fontSize="sm" color="fg.muted">
          Link each field to a CSV column. Linked fields show the parsed value.
        </Text>
        <SimpleGrid columns={{base: 1, md: 2}} gap={3}>
          {TARGETS.map((target) => (
            <FpParserDialogMappingField
              key={target}
              target={target}
              columns={columns}
              selectedColumn={columnMap[target]?.column}
              dateFormat={dateFormat}
              sign={sign}
              preview={previewFpMappedField(sampleRows, target, resolvedMap[target])}
              hasSampleRows={sampleRows.length > 0}
              onSelectColumn={(column) => onAssign(target, column)}
              onDateFormat={onDateFormat}
              onSign={onSign}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
