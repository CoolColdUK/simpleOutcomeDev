'use client';

import {useState} from 'react';
import {Button, HStack, Stack, Table, Text} from '@chakra-ui/react';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpImport} from '@/lib/api/db/mapDbFpImport';
import type {DbFpImportFile} from '@/lib/api/db/mapDbFpImportFile';
import type {DbFpParser} from '@/lib/api/db/mapDbFpParser';
import FpImportPageLogs from '@/components/fp/FpImportPageLogs';

export interface FpImportPageProps {
  readonly imports: readonly DbFpImport[];
  readonly files: readonly DbFpImportFile[];
  readonly accounts: readonly DbFpAccount[];
  readonly parsers: readonly DbFpParser[];
  readonly canCreate: boolean;
  readonly canUndo: boolean;
  readonly onImport: () => void;
  readonly onUndo: (imp: DbFpImport) => void;
}

function fileSummary(file: DbFpImportFile | undefined): string {
  if (file === undefined) {
    return 'No file';
  }
  return `created ${file.createdCount} · skipped ${file.duplicateSkipped} · failed ${file.failed} · logs ${file.logs.length}`;
}

export default function FpImportPage({
  imports,
  files,
  accounts,
  parsers,
  canCreate,
  canUndo,
  onImport,
  onUndo,
}: FpImportPageProps) {
  const [openLogId, setOpenLogId] = useState<string | undefined>(undefined);
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;
  const parserName = (id: string | undefined) =>
    id === undefined ? '—' : (parsers.find((p) => p.id === id)?.name ?? id);

  return (
    <Stack gap={3}>
      <HStack justify="space-between">
        <Text fontWeight="medium">Imports</Text>
        {canCreate ? (
          <Button size="sm" colorPalette="brand" onClick={onImport}>
            Import CSV
          </Button>
        ) : null}
      </HStack>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Date</Table.ColumnHeader>
            <Table.ColumnHeader>File</Table.ColumnHeader>
            <Table.ColumnHeader>Account</Table.ColumnHeader>
            <Table.ColumnHeader>Parser</Table.ColumnHeader>
            <Table.ColumnHeader>Report</Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {imports.map((imp) => {
            const importFiles = files.filter((f) => f.importId === imp.id);
            const importFile = importFiles[0];
            const logOpen = openLogId === imp.id;
            return (
              <Table.Row key={imp.id}>
                <Table.Cell>
                  {imp.createdAt.slice(0, 10)}
                  {imp.undoneAt !== undefined ? ' (undone)' : ''}
                </Table.Cell>
                <Table.Cell>{importFile?.fileName ?? '—'}</Table.Cell>
                <Table.Cell>{accountName(imp.accountId)}</Table.Cell>
                <Table.Cell>{parserName(imp.parserId)}</Table.Cell>
                <Table.Cell>
                  <Stack gap={2}>
                    <Text>{fileSummary(importFile)}</Text>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setOpenLogId(logOpen ? undefined : imp.id)}
                    >
                      {logOpen ? 'Hide log' : 'View log'}
                    </Button>
                    {logOpen ? <FpImportPageLogs files={importFiles} /> : null}
                  </Stack>
                </Table.Cell>
                <Table.Cell>
                  {canUndo && imp.undoneAt === undefined ? (
                    <Button size="xs" variant="outline" onClick={() => onUndo(imp)}>
                      Undo
                    </Button>
                  ) : null}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
      {imports.length === 0 ? <Text color="fg.muted">No imports yet.</Text> : null}
    </Stack>
  );
}
