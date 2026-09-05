'use client';

import {Button, HStack, Stack, Table, Text} from '@chakra-ui/react';
import formatFpMoney from '@/lib/fp/formatFpMoney';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import type {DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';

export interface FpTransactionTableProps {
  readonly transactions: readonly DbFpTransaction[];
  readonly accounts: readonly DbFpAccount[];
  readonly categories: readonly DbFpCategory[];
  readonly currency: string;
  readonly selected: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly onArchive: (id: string) => void;
  readonly onSplit: (id: string, date: string) => void;
  readonly canUpdate: boolean;
  readonly canSplit: boolean;
}

export default function FpTransactionTable({
  transactions,
  accounts,
  categories,
  currency,
  selected,
  onToggle,
  onArchive,
  onSplit,
  canUpdate,
  canSplit,
}: FpTransactionTableProps) {
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;
  const categoryName = (id: string | undefined) =>
    id === undefined ? 'Uncategorised' : (categories.find((c) => c.id === id)?.name ?? id);

  return (
    <Stack gap={2} overflowX="auto">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader />
            <Table.ColumnHeader>Date</Table.ColumnHeader>
            <Table.ColumnHeader>Account</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader>Amount</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transactions.map((t) => (
            <Table.Row key={t.id}>
              <Table.Cell>
                <input type="checkbox" checked={selected.has(t.id)} onChange={() => onToggle(t.id)} />
              </Table.Cell>
              <Table.Cell>{t.postedDate}</Table.Cell>
              <Table.Cell>{accountName(t.accountId)}</Table.Cell>
              <Table.Cell>
                {t.description}
                {t.parentId !== undefined ? ' (split)' : ''}
                {t.splitPortionCount !== undefined ? ' (parent)' : ''}
                {!t.confirmed && t.categoryId !== undefined ? ' · review' : ''}
              </Table.Cell>
              <Table.Cell>{formatFpMoney(t.amount, currency)}</Table.Cell>
              <Table.Cell>{categoryName(t.categoryId)}</Table.Cell>
              <Table.Cell>
                <HStack gap={1}>
                  {canUpdate ? (
                    <Button size="xs" variant="outline" onClick={() => onArchive(t.id)}>
                      {t.archived ? 'Restore' : 'Archive'}
                    </Button>
                  ) : null}
                  {canSplit && t.parentId === undefined && t.splitPortionCount === undefined ? (
                    <Button size="xs" variant="outline" onClick={() => onSplit(t.id, t.postedDate)}>
                      Split
                    </Button>
                  ) : null}
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {transactions.length === 0 ? <Text color="fg.muted">No transactions in this range.</Text> : null}
    </Stack>
  );
}
