'use client';

import {Button, HStack, NativeSelect, Stack, Tabs} from '@chakra-ui/react';
import {FpAction, FpResource} from '@so/model';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import type {DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';
import type {FpDatePreset} from '@/lib/fp/fpDateRangeFromPreset';
import FpCategoryAssignSelect from '@/components/fp/FpCategoryAssignSelect';
import FpReportPanel from '@/components/fp/FpReportPanel';
import FpTransactionTable from '@/components/fp/FpTransactionTable';

export interface FpLedgerPanelProps {
  readonly accounts: readonly DbFpAccount[];
  readonly categories: readonly DbFpCategory[];
  readonly transactions: readonly DbFpTransaction[];
  readonly currency: string;
  readonly preset: FpDatePreset;
  readonly accountFilter: string;
  readonly showArchived: boolean;
  readonly selected: ReadonlySet<string>;
  readonly start?: string;
  readonly end?: string;
  readonly can: (resource: FpResource, action: FpAction) => boolean;
  readonly onPreset: (preset: FpDatePreset) => void;
  readonly onAccountFilter: (accountId: string) => void;
  readonly onToggleArchived: () => void;
  readonly onAddTransaction: () => void;
  readonly onImport: () => void;
  readonly onRerunRules: () => void;
  readonly onToggleRow: (id: string) => void;
  readonly onAssign: (categoryId: string) => void;
  readonly onConfirm: () => void;
  readonly onArchive: (id: string) => void;
  readonly onSplit: (id: string, date: string) => void;
}

export default function FpLedgerPanel({
  accounts,
  categories,
  transactions,
  currency,
  preset,
  accountFilter,
  showArchived,
  selected,
  start,
  end,
  can,
  onPreset,
  onAccountFilter,
  onToggleArchived,
  onAddTransaction,
  onImport,
  onRerunRules,
  onToggleRow,
  onAssign,
  onConfirm,
  onArchive,
  onSplit,
}: FpLedgerPanelProps) {
  return (
    <Stack gap={3}>
      <HStack gap={2} flexWrap="wrap">
        {can(FpResource.TRANSACTION, FpAction.CREATE) ? (
          <Button size="sm" onClick={onAddTransaction}>
            Transaction
          </Button>
        ) : null}
        {can(FpResource.IMPORT, FpAction.CREATE) ? (
          <Button size="sm" colorPalette="brand" onClick={onImport}>
            Import
          </Button>
        ) : null}
        {can(FpResource.TRANSACTION, FpAction.UPDATE) ? (
          <Button size="sm" variant="outline" onClick={onRerunRules}>
            Re-run rules
          </Button>
        ) : null}
      </HStack>
      <HStack gap={2} flexWrap="wrap">
        <NativeSelect.Root maxW="180px">
          <NativeSelect.Field value={preset} onChange={(e) => onPreset(e.target.value as FpDatePreset)}>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="last_30">Last 30 days</option>
            <option value="this_year">This year</option>
            <option value="all">All time</option>
          </NativeSelect.Field>
        </NativeSelect.Root>
        <NativeSelect.Root maxW="180px">
          <NativeSelect.Field value={accountFilter} onChange={(e) => onAccountFilter(e.target.value)}>
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
        <Button size="sm" variant="outline" onClick={onToggleArchived}>
          {showArchived ? 'Hide archived' : 'Archived'}
        </Button>
      </HStack>
      <Tabs.Root defaultValue="report" variant="enclosed">
        <Tabs.List>
          <Tabs.Trigger value="report">Report</Tabs.Trigger>
          <Tabs.Trigger value="list">Transactions</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="report">
          <FpReportPanel
            transactions={transactions}
            categories={categories}
            start={start}
            end={end}
            currency={currency}
          />
        </Tabs.Content>
        <Tabs.Content value="list">
          <Stack gap={3}>
            {selected.size > 0 ? (
              <HStack>
                <FpCategoryAssignSelect categories={categories} onAssign={onAssign} />
                <Button size="sm" onClick={onConfirm}>
                  Confirm
                </Button>
              </HStack>
            ) : null}
            <FpTransactionTable
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              currency={currency}
              selected={selected}
              onToggle={onToggleRow}
              onArchive={onArchive}
              onSplit={onSplit}
              canUpdate={can(FpResource.TRANSACTION, FpAction.UPDATE)}
              canSplit={can(FpResource.BILL_SPLIT, FpAction.CREATE)}
            />
          </Stack>
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
