'use client';

import {Button, HStack, Stack, Table, Text} from '@chakra-ui/react';
import {fpAccountKindLabel} from '@so/model';
import formatFpMoney from '@/lib/fp/formatFpMoney';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';

export interface FpAccountPageProps {
  readonly accounts: readonly DbFpAccount[];
  readonly balances: Readonly<Record<string, number>>;
  readonly currency: string;
  readonly canCreate: boolean;
  readonly canUpdate: boolean;
  readonly canDelete: boolean;
  readonly onAdd: () => void;
  readonly onEdit: (account: DbFpAccount) => void;
  readonly onDelete: (account: DbFpAccount) => void;
}

export default function FpAccountPage({
  accounts,
  balances,
  currency,
  canCreate,
  canUpdate,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
}: FpAccountPageProps) {
  return (
    <Stack gap={3}>
      <HStack justify="space-between">
        <Text fontWeight="medium">Accounts</Text>
        {canCreate ? (
          <Button size="sm" colorPalette="brand" onClick={onAdd}>
            Add account
          </Button>
        ) : null}
      </HStack>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Kind</Table.ColumnHeader>
            <Table.ColumnHeader>Opening</Table.ColumnHeader>
            <Table.ColumnHeader>Balance</Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {accounts.map((account) => (
            <Table.Row key={account.id}>
              <Table.Cell>
                {account.name}
                {account.archived ? ' (archived)' : ''}
              </Table.Cell>
              <Table.Cell>{fpAccountKindLabel(account.kind)}</Table.Cell>
              <Table.Cell>{formatFpMoney(account.openingFund, currency)}</Table.Cell>
              <Table.Cell>{formatFpMoney(balances[account.id] ?? account.openingFund, currency)}</Table.Cell>
              <Table.Cell>
                <HStack gap={1}>
                  {canUpdate ? (
                    <Button size="xs" variant="outline" onClick={() => onEdit(account)}>
                      Edit
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button size="xs" variant="outline" onClick={() => onDelete(account)}>
                      Delete
                    </Button>
                  ) : null}
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {accounts.length === 0 ? <Text color="fg.muted">No accounts yet.</Text> : null}
    </Stack>
  );
}
