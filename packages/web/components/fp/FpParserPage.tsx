'use client';

import {Button, HStack, Stack, Table, Text} from '@chakra-ui/react';
import type {DbFpParser} from '@/lib/api/db/mapDbFpParser';

export interface FpParserPageProps {
  readonly parsers: readonly DbFpParser[];
  readonly canCreate: boolean;
  readonly canUpdate: boolean;
  readonly canDelete: boolean;
  readonly onAdd: () => void;
  readonly onEdit: (parser: DbFpParser) => void;
  readonly onDelete: (parser: DbFpParser) => void;
}

export default function FpParserPage({
  parsers,
  canCreate,
  canUpdate,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
}: FpParserPageProps) {
  return (
    <Stack gap={3}>
      <HStack justify="space-between">
        <Text fontWeight="medium">Parsers</Text>
        {canCreate ? (
          <Button size="sm" colorPalette="brand" onClick={onAdd}>
            Add parser
          </Button>
        ) : null}
      </HStack>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Identifier</Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {parsers.map((parser) => (
            <Table.Row key={parser.id}>
              <Table.Cell>{parser.name}</Table.Cell>
              <Table.Cell>{parser.identifier ?? '—'}</Table.Cell>
              <Table.Cell>
                <HStack gap={1}>
                  {canUpdate ? (
                    <Button size="xs" variant="outline" onClick={() => onEdit(parser)}>
                      Edit
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button size="xs" variant="outline" onClick={() => onDelete(parser)}>
                      Delete
                    </Button>
                  ) : null}
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {parsers.length === 0 ? <Text color="fg.muted">No parsers yet.</Text> : null}
    </Stack>
  );
}
