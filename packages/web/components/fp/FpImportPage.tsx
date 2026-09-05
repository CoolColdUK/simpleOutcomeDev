'use client';

import {Button, HStack, Stack, Table, Text} from '@chakra-ui/react';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpImport} from '@/lib/api/db/mapDbFpImport';
import type {DbFpImportFile} from '@/lib/api/db/mapDbFpImportFile';
import type {DbFpParser} from '@/lib/api/db/mapDbFpParser';

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

function fileSummary(files: readonly DbFpImportFile[]): string {
  if (files.length === 0) {
    return 'No files';
  }
  const created = files.reduce((sum, file) => sum + file.createdCount, 0);
  const skipped = files.reduce((sum, file) => sum + file.duplicateSkipped, 0);
  const failed = files.reduce((sum, file) => sum + file.failed, 0);
  return `${files.map((f) => f.fileName).join(', ')} · created ${created} · skipped ${skipped} · failed ${failed}`;
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
            <Table.ColumnHeader>Account</Table.ColumnHeader>
            <Table.ColumnHeader>Parser</Table.ColumnHeader>
            <Table.ColumnHeader>Report</Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {imports.map((imp) => (
            <Table.Row key={imp.id}>
              <Table.Cell>
                {imp.createdAt.slice(0, 10)}
                {imp.undoneAt !== undefined ? ' (undone)' : ''}
              </Table.Cell>
              <Table.Cell>{accountName(imp.accountId)}</Table.Cell>
              <Table.Cell>{parserName(imp.parserId)}</Table.Cell>
              <Table.Cell>{fileSummary(files.filter((f) => f.importId === imp.id))}</Table.Cell>
              <Table.Cell>
                {canUndo && imp.undoneAt === undefined ? (
                  <Button size="xs" variant="outline" onClick={() => onUndo(imp)}>
                    Undo
                  </Button>
                ) : null}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {imports.length === 0 ? <Text color="fg.muted">No imports yet.</Text> : null}
    </Stack>
  );
}
