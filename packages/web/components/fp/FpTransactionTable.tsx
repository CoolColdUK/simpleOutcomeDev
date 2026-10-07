'use client';

import {useState} from 'react';
import {Badge, HStack, IconButton, Stack, Table, Text} from '@chakra-ui/react';
import {ArchiveIcon, RestoreIcon, SplitIcon, TagsIcon} from '@so/component';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import formatFpMoney from '@/lib/fp/formatFpMoney';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import type {DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';
import FpTransactionCategoryDialog from '@/components/fp/FpTransactionCategoryDialog';

export interface FpTransactionTableProps {
  readonly transactions: readonly DbFpTransaction[];
  readonly accounts: readonly DbFpAccount[];
  readonly categories: readonly DbFpCategory[];
  readonly currency: string;
  readonly selected: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly onArchive: (id: string) => void;
  readonly onSplit: (id: string, date: string) => void;
  readonly onAssignCategory: (transactionId: string, categoryId: string | undefined) => Promise<void>;
  readonly canUpdate: boolean;
  readonly canSplit: boolean;
}

function fpAmountColorPalette(amount: number): 'green' | 'red' | 'gray' {
  if (amount > 0) {
    return 'green';
  }
  if (amount < 0) {
    return 'red';
  }
  return 'gray';
}

function FpTransactionAmountCell({amount, currency}: {readonly amount: number; readonly currency: string}) {
  return (
    <Badge
      colorPalette={fpAmountColorPalette(amount)}
      variant="subtle"
      whiteSpace="nowrap"
      fontVariantNumeric="tabular-nums"
      px={2}
      py={0.5}
    >
      {formatFpMoney(amount, currency)}
    </Badge>
  );
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
  onAssignCategory,
  canUpdate,
  canSplit,
}: FpTransactionTableProps) {
  const [categoryDialogTx, setCategoryDialogTx] = useState<DbFpTransaction | undefined>(undefined);

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
            <Table.ColumnHeader>Recipient</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" whiteSpace="nowrap">Amount</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader aria-label="Actions" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transactions.map((t) => (
            <Table.Row key={t.id}>
              <Table.Cell>
                <input type="checkbox" checked={selected.has(t.id)} onChange={() => onToggle(t.id)} />
              </Table.Cell>
              <Table.Cell whiteSpace="nowrap">{t.postedDate}</Table.Cell>
              <Table.Cell>{accountName(t.accountId)}</Table.Cell>
              <Table.Cell>
                {t.description}
                {t.parentId !== undefined ? ' (split)' : ''}
                {t.splitPortionCount !== undefined ? ' (parent)' : ''}
                {!t.confirmed && t.categoryId !== undefined ? ' · review' : ''}
              </Table.Cell>
              <Table.Cell>{t.recipient === '' ? '—' : t.recipient}</Table.Cell>
              <Table.Cell textAlign="end" whiteSpace="nowrap">
                <FpTransactionAmountCell amount={t.amount} currency={currency} />
              </Table.Cell>
              <Table.Cell>
                <HStack gap={1} maxW="220px">
                  <Text fontSize="sm" truncate flex="1" minW={0}>
                    {categoryName(t.categoryId)}
                  </Text>
                  {canUpdate ? (
                    <AppIconTooltip label="Change category">
                      <IconButton
                        aria-label="Change category"
                        size="xs"
                        variant="ghost"
                        flexShrink={0}
                        onClick={() => setCategoryDialogTx(t)}
                      >
                        <TagsIcon size={16} />
                      </IconButton>
                    </AppIconTooltip>
                  ) : null}
                </HStack>
              </Table.Cell>
              <Table.Cell>
                <HStack gap={0} justify="flex-end">
                  {canUpdate ? (
                    <AppIconTooltip label={t.archived ? 'Restore from archive' : 'Archive'}>
                      <IconButton
                        aria-label={t.archived ? 'Restore from archive' : 'Archive'}
                        size="xs"
                        variant="ghost"
                        onClick={() => onArchive(t.id)}
                      >
                        {t.archived ? <RestoreIcon size={16} /> : <ArchiveIcon size={16} />}
                      </IconButton>
                    </AppIconTooltip>
                  ) : null}
                  {canSplit && t.parentId === undefined && t.splitPortionCount === undefined ? (
                    <AppIconTooltip label="Split into monthly portions">
                      <IconButton
                        aria-label="Split into monthly portions"
                        size="xs"
                        variant="ghost"
                        onClick={() => onSplit(t.id, t.postedDate)}
                      >
                        <SplitIcon size={16} />
                      </IconButton>
                    </AppIconTooltip>
                  ) : null}
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {transactions.length === 0 ? <Text color="fg.muted">No transactions in this range.</Text> : null}
      <FpTransactionCategoryDialog
        open={categoryDialogTx !== undefined}
        transaction={categoryDialogTx}
        categories={categories}
        currency={currency}
        onClose={() => setCategoryDialogTx(undefined)}
        onSave={onAssignCategory}
      />
    </Stack>
  );
}
