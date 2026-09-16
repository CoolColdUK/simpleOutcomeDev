'use client';

import {Stack, Table, Text} from '@chakra-ui/react';
import {fpImportLogKindLabel, type FpImportLogEntry} from '@so/model';
import type {DbFpImportFile} from '@/lib/api/db/mapDbFpImportFile';

export interface FpImportPageLogsProps {
  readonly files: readonly DbFpImportFile[];
}

function locationLabel(log: FpImportLogEntry): string {
  if (log.fileLine === undefined) {
    return `Row ${log.rowIndex}`;
  }
  return `Row ${log.rowIndex} (line ${log.fileLine})`;
}

export default function FpImportPageLogs({files}: FpImportPageLogsProps) {
  const entries = files.flatMap((file) =>
    file.logs.map((log) => ({
      key: `${file.id}-${log.kind}-${log.rowIndex}-${log.message}`,
      fileName: file.fileName,
      log,
    })),
  );
  if (entries.length === 0) {
    return <Text fontSize="sm" color="fg.muted">No skip or error logs for this import.</Text>;
  }
  return (
    <Stack gap={2}>
      <Text fontSize="sm" fontWeight="medium">
        Skip and error log
      </Text>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>File</Table.ColumnHeader>
            <Table.ColumnHeader>Kind</Table.ColumnHeader>
            <Table.ColumnHeader>Where</Table.ColumnHeader>
            <Table.ColumnHeader>Message</Table.ColumnHeader>
            <Table.ColumnHeader>Source</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {entries.map((entry) => (
            <Table.Row key={entry.key}>
              <Table.Cell>{entry.fileName}</Table.Cell>
              <Table.Cell>{fpImportLogKindLabel(entry.log.kind)}</Table.Cell>
              <Table.Cell>{locationLabel(entry.log)}</Table.Cell>
              <Table.Cell>{entry.log.message}</Table.Cell>
              <Table.Cell>
                <Text fontFamily="mono" fontSize="xs" whiteSpace="pre-wrap">
                  {entry.log.raw ?? '—'}
                </Text>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Stack>
  );
}
