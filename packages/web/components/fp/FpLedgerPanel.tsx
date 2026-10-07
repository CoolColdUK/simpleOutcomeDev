'use client';

import {useMemo, useState} from 'react';
import {Button, HStack, Input, NativeSelect, Stack, Tabs, Text} from '@chakra-ui/react';
import {RefreshIcon} from '@so/component';
import {FpAction, FpResource} from '@so/model';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import type {DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';
import type {FpDatePreset, FpDateRange} from '@/lib/fp/fpDateRangeFromPreset';
import dayjs from 'dayjs';
import fpMonthSelectOptions from '@/lib/fp/fpMonthSelectOptions';
import downloadFpTransactionsCsv from '@/lib/fp/downloadFpTransactionsCsv';
import {
  FP_CATEGORY_FILTER_ALL,
  FP_CATEGORY_FILTER_UNCATEGORISED,
  transactionMatchesFpCategoryFilter,
} from '@/lib/fp/fpCategoryFilter';
import FpCategoryAssignSelect from '@/components/fp/FpCategoryAssignSelect';
import FpReportPanel from '@/components/fp/FpReportPanel';
import FpTransactionTable from '@/components/fp/FpTransactionTable';

export type FpTransactionPageSize = 10 | 25 | 50 | 100 | 'all';

export interface FpLedgerPanelProps {
  readonly accounts: readonly DbFpAccount[];
  readonly categories: readonly DbFpCategory[];
  readonly transactions: readonly DbFpTransaction[];
  readonly currency: string;
  readonly preset: FpDatePreset;
  readonly customRange: FpDateRange;
  readonly accountFilter: string;
  readonly showArchived: boolean;
  readonly selected: ReadonlySet<string>;
  readonly start?: string;
  readonly end?: string;
  readonly can: (resource: FpResource, action: FpAction) => boolean;
  readonly onPreset: (preset: FpDatePreset) => void;
  readonly onCustomRange: (range: FpDateRange) => void;
  readonly onAccountFilter: (accountId: string) => void;
  readonly onToggleArchived: () => void;
  readonly onAddTransaction: () => void;
  readonly onImport: () => void;
  readonly onRerunRules: () => void;
  readonly onRefreshCategories: () => void;
  readonly refreshingCategories: boolean;
  readonly onToggleRow: (id: string) => void;
  readonly onAssign: (categoryId: string) => void;
  readonly onAssignTransactionCategory: (
    transactionId: string,
    categoryId: string | undefined,
  ) => Promise<void>;
  readonly onConfirm: () => void;
  readonly onArchive: (id: string) => void;
  readonly onSplit: (id: string, date: string) => void;
}

function parsePageSize(value: string): FpTransactionPageSize {
  if (value === 'all') {
    return 'all';
  }
  const n = Number(value);
  if (n === 25 || n === 50 || n === 100) {
    return n;
  }
  return 10;
}

function pageCountBeforeClamp(total: number, pageSize: FpTransactionPageSize): number {
  if (pageSize === 'all') {
    return 1;
  }
  return Math.max(1, Math.ceil(total / pageSize));
}

export default function FpLedgerPanel({
  accounts,
  categories,
  transactions,
  currency,
  preset,
  customRange,
  accountFilter,
  showArchived,
  selected,
  start,
  end,
  can,
  onPreset,
  onCustomRange,
  onAccountFilter,
  onToggleArchived,
  onAddTransaction,
  onImport,
  onRerunRules,
  onRefreshCategories,
  refreshingCategories,
  onToggleRow,
  onAssign,
  onAssignTransactionCategory,
  onConfirm,
  onArchive,
  onSplit,
}: FpLedgerPanelProps) {
  const [categoryFilter, setCategoryFilter] = useState(FP_CATEGORY_FILTER_ALL);
  const filteredByCategory = useMemo(
    () => transactions.filter((t) => transactionMatchesFpCategoryFilter(t.categoryId, categoryFilter)),
    [transactions, categoryFilter],
  );
  const monthOptions = useMemo(() => fpMonthSelectOptions(48, 3), []);
  const selectedMonth = customRange.month ?? dayjs().format('YYYY-MM');
  const listVersion = `${categoryFilter}|${accountFilter}|${preset}|${start ?? ''}|${end ?? ''}|${showArchived}|${transactions.length}`;
  const [pagination, setPagination] = useState({
    version: listVersion,
    page: 1,
    pageSize: 10 as FpTransactionPageSize,
  });
  const pageSize = pagination.pageSize;
  const pageCount = pageCountBeforeClamp(filteredByCategory.length, pageSize);
  const page =
    pagination.version === listVersion ? Math.min(Math.max(1, pagination.page), pageCount) : 1;

  const setPage = (next: number): void => {
    setPagination((prev) => ({...prev, version: listVersion, page: next}));
  };

  const setPageSize = (next: FpTransactionPageSize): void => {
    setPagination((prev) => ({...prev, version: listVersion, page: 1, pageSize: next}));
  };

  const pagedTransactions = useMemo(() => {
    if (pageSize === 'all') {
      return filteredByCategory;
    }
    const startIndex = (page - 1) * pageSize;
    return filteredByCategory.slice(startIndex, startIndex + pageSize);
  }, [filteredByCategory, page, pageSize]);

  const downloadCsv = (): void => {
    const stamp = start ?? 'export';
    downloadFpTransactionsCsv(
      filteredByCategory,
      accounts,
      categories,
      `fp-transactions-${stamp}.csv`,
    );
  };

  const leaves = categories.filter((c) => !c.isGroup);

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
        <NativeSelect.Root maxW="200px">
          <NativeSelect.Field value={preset} onChange={(e) => onPreset(e.target.value as FpDatePreset)}>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="month">Choose month</option>
            <option value="last_30">Last 30 days</option>
            <option value="this_year">This year</option>
            <option value="custom">Custom range</option>
            <option value="all">All time</option>
          </NativeSelect.Field>
        </NativeSelect.Root>
        {preset === 'month' ? (
          <NativeSelect.Root maxW="220px">
            <NativeSelect.Field
              value={selectedMonth}
              onChange={(e) => onCustomRange({...customRange, month: e.target.value})}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        ) : null}
        {preset === 'custom' ? (
          <HStack gap={2}>
            <Input
              type="date"
              size="sm"
              maxW="160px"
              value={customRange.start ?? ''}
              onChange={(e) => onCustomRange({...customRange, start: e.target.value})}
              aria-label="Range start date"
            />
            <Text fontSize="sm" color="fg.muted">to</Text>
            <Input
              type="date"
              size="sm"
              maxW="160px"
              value={customRange.end ?? ''}
              onChange={(e) => onCustomRange({...customRange, end: e.target.value})}
              aria-label="Range end date"
            />
          </HStack>
        ) : null}
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
        <NativeSelect.Root maxW="200px">
          <NativeSelect.Field
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPagination((prev) => ({...prev, page: 1}));
            }}
          >
            <option value={FP_CATEGORY_FILTER_ALL}>All categories</option>
            <option value={FP_CATEGORY_FILTER_UNCATEGORISED}>Uncategorised</option>
            {leaves.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
              <HStack flexWrap="wrap">
                <FpCategoryAssignSelect
                  categories={categories}
                  onAssign={onAssign}
                  onRefresh={onRefreshCategories}
                  refreshing={refreshingCategories}
                />
                <Button size="sm" onClick={onConfirm}>
                  Confirm
                </Button>
              </HStack>
            ) : null}
            <HStack gap={2} flexWrap="wrap" justify="space-between">
              <HStack gap={2} flexWrap="wrap">
                <NativeSelect.Root maxW="120px">
                  <NativeSelect.Field
                    value={pageSize === 'all' ? 'all' : String(pageSize)}
                    onChange={(e) => setPageSize(parsePageSize(e.target.value))}
                  >
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                    <option value="all">All</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
                <Text fontSize="sm" color="fg.muted">
                  {filteredByCategory.length} transaction(s)
                </Text>
              </HStack>
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Refresh categories"
                  onClick={onRefreshCategories}
                  loading={refreshingCategories}
                >
                  <RefreshIcon size={16} />
                </Button>
                <Button size="sm" variant="outline" onClick={downloadCsv}>
                  Download CSV
                </Button>
              </HStack>
            </HStack>
            <FpTransactionTable
              transactions={pagedTransactions}
              accounts={accounts}
              categories={categories}
              currency={currency}
              selected={selected}
              onToggle={onToggleRow}
              onAssignCategory={onAssignTransactionCategory}
              onArchive={onArchive}
              onSplit={onSplit}
              canUpdate={can(FpResource.TRANSACTION, FpAction.UPDATE)}
              canSplit={can(FpResource.BILL_SPLIT, FpAction.CREATE)}
            />
            {pageSize !== 'all' && filteredByCategory.length > pageSize ? (
              <HStack gap={2}>
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Text fontSize="sm">
                  Page {page} of {pageCount}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pageCount}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </HStack>
            ) : null}
          </Stack>
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
