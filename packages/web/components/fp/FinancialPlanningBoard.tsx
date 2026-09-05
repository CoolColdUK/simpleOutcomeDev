'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Button, HStack, NativeSelect, Stack, Tabs, Text} from '@chakra-ui/react';
import {
  fpCan,
  FpAction,
  fpDefaultPermission,
  FpResource,
  PodRole,
} from '@so/model';
import listDbFpAccounts from '@/lib/api/db/listDbFpAccounts';
import listDbFpCategories from '@/lib/api/db/listDbFpCategories';
import listDbFpTransactions from '@/lib/api/db/listDbFpTransactions';
import listDbFpParsers from '@/lib/api/db/listDbFpParsers';
import listDbFpImports from '@/lib/api/db/listDbFpImports';
import getDbFpSetting from '@/lib/api/db/getDbFpSetting';
import sumDbFpAccountBalance from '@/lib/api/db/sumDbFpAccountBalance';
import bulkUpdateDbFpTransactionCategory from '@/lib/api/db/bulkUpdateDbFpTransactionCategory';
import confirmDbFpTransactions from '@/lib/api/db/confirmDbFpTransactions';
import updateDbFpTransaction from '@/lib/api/db/updateDbFpTransaction';
import applyDbFpAutoAssign from '@/lib/api/db/applyDbFpAutoAssign';
import undoDbFpImport from '@/lib/api/db/undoDbFpImport';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import type {DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';
import type {DbFpParser} from '@/lib/api/db/mapDbFpParser';
import type {DbFpImport} from '@/lib/api/db/mapDbFpImport';
import type {DbFpSetting} from '@/lib/api/db/mapDbFpSetting';
import formatFpMoney from '@/lib/fp/formatFpMoney';
import fpDateRangeFromPreset, {type FpDatePreset} from '@/lib/fp/fpDateRangeFromPreset';
import FpAccountDialog from '@/components/fp/FpAccountDialog';
import FpCategoryDialog from '@/components/fp/FpCategoryDialog';
import FpTransactionDialog from '@/components/fp/FpTransactionDialog';
import FpParserDialog from '@/components/fp/FpParserDialog';
import FpImportDialog from '@/components/fp/FpImportDialog';
import FpSplitDialog from '@/components/fp/FpSplitDialog';
import FpReportPanel from '@/components/fp/FpReportPanel';
import FpTransactionTable from '@/components/fp/FpTransactionTable';
import FpCategoryAssignSelect from '@/components/fp/FpCategoryAssignSelect';

export interface FinancialPlanningBoardProps {
  readonly podId: string;
  readonly userId: string;
  readonly podRole: PodRole | undefined;
  readonly isSpaceOwner: boolean;
}

export default function FinancialPlanningBoard({
  podId,
  userId,
  podRole,
  isSpaceOwner,
}: FinancialPlanningBoardProps) {
  const [accounts, setAccounts] = useState<readonly DbFpAccount[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<readonly DbFpCategory[]>([]);
  const [transactions, setTransactions] = useState<readonly DbFpTransaction[]>([]);
  const [parsers, setParsers] = useState<readonly DbFpParser[]>([]);
  const [imports, setImports] = useState<readonly DbFpImport[]>([]);
  const [setting, setSetting] = useState<DbFpSetting | undefined>(undefined);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState<FpDatePreset>('this_month');
  const [accountFilter, setAccountFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [parserOpen, setParserOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [splitId, setSplitId] = useState<string | undefined>(undefined);
  const [splitDate, setSplitDate] = useState<string | undefined>(undefined);

  const range = fpDateRangeFromPreset(preset, {});
  const permission = setting?.permission ?? fpDefaultPermission();
  const can = (resource: FpResource, action: FpAction) => fpCan(podRole, isSpaceOwner, permission, resource, action);

  const load = useCallback(async (): Promise<void> => {
    setError('');
    const [acc, cats, txs, pars, imps, set] = await Promise.all([
      listDbFpAccounts(podId),
      listDbFpCategories(podId),
      listDbFpTransactions(podId, {
        startDate: range.start,
        endDate: range.end,
        accountId: accountFilter === '' ? undefined : accountFilter,
        archived: showArchived,
      }),
      listDbFpParsers(podId),
      listDbFpImports(podId),
      getDbFpSetting(podId),
    ]);
    setAccounts(acc);
    setCategories(cats);
    setTransactions(txs);
    setParsers(pars);
    setImports(imps);
    setSetting(set);
    const next: Record<string, number> = {};
    await Promise.all(
      acc.map(async (a) => {
        next[a.id] = await sumDbFpAccountBalance(a.id);
      }),
    );
    setBalances(next);
  }, [podId, range.start, range.end, accountFilter, showArchived]);

  useEffect(() => {
    void load().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [load]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => Number(b.favourite) - Number(a.favourite) || a.sortOrder - b.sortOrder),
    [categories],
  );

  const toggle = (id: string): void => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const currency = setting?.currency ?? 'GBP';
  const visibleAccounts = accounts.filter((a) => !a.archived);

  return (
    <Stack gap={4}>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <HStack gap={3} flexWrap="wrap">
        {visibleAccounts.map((a) => (
          <Text key={a.id} fontSize="sm">
            {a.name}: {formatFpMoney(balances[a.id] ?? a.openingFund, currency)}
          </Text>
        ))}
      </HStack>
      <HStack gap={2} flexWrap="wrap">
        {can(FpResource.ACCOUNT, FpAction.CREATE) ? (
          <Button size="sm" onClick={() => setAccountOpen(true)}>
            Account
          </Button>
        ) : null}
        {can(FpResource.CATEGORY, FpAction.CREATE) ? (
          <Button size="sm" onClick={() => setCategoryOpen(true)}>
            Category
          </Button>
        ) : null}
        {can(FpResource.TRANSACTION, FpAction.CREATE) ? (
          <Button size="sm" onClick={() => setTxOpen(true)}>
            Transaction
          </Button>
        ) : null}
        {can(FpResource.PARSER, FpAction.CREATE) ? (
          <Button size="sm" onClick={() => setParserOpen(true)}>
            Parser
          </Button>
        ) : null}
        {can(FpResource.IMPORT, FpAction.CREATE) ? (
          <Button size="sm" colorPalette="brand" onClick={() => setImportOpen(true)}>
            Import
          </Button>
        ) : null}
        {can(FpResource.TRANSACTION, FpAction.UPDATE) ? (
          <Button size="sm" variant="outline" onClick={() => void applyDbFpAutoAssign(podId).then(() => load())}>
            Re-run rules
          </Button>
        ) : null}
      </HStack>
      <HStack gap={2} flexWrap="wrap">
        <NativeSelect.Root maxW="180px">
          <NativeSelect.Field value={preset} onChange={(e) => setPreset(e.target.value as FpDatePreset)}>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="last_30">Last 30 days</option>
            <option value="this_year">This year</option>
            <option value="all">All time</option>
          </NativeSelect.Field>
        </NativeSelect.Root>
        <NativeSelect.Root maxW="180px">
          <NativeSelect.Field value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
            <option value="">All accounts</option>
            {visibleAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
        <Button size="sm" variant="outline" onClick={() => setShowArchived(!showArchived)}>
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
            categories={sortedCategories}
            start={range.start}
            end={range.end}
            currency={currency}
          />
        </Tabs.Content>
        <Tabs.Content value="list">
          <Stack gap={3}>
            {selected.size > 0 ? (
              <HStack>
                <FpCategoryAssignSelect
                  categories={sortedCategories}
                  onAssign={(id) =>
                    void bulkUpdateDbFpTransactionCategory([...selected], id).then(() => {
                      setSelected(new Set());
                      return load();
                    })
                  }
                />
                <Button
                  size="sm"
                  onClick={() =>
                    void confirmDbFpTransactions([...selected]).then(() => {
                      setSelected(new Set());
                      return load();
                    })
                  }
                >
                  Confirm
                </Button>
              </HStack>
            ) : null}
            <FpTransactionTable
              transactions={transactions}
              accounts={accounts}
              categories={sortedCategories}
              currency={currency}
              selected={selected}
              onToggle={toggle}
              onArchive={(id) => void updateDbFpTransaction(id, {archived: !showArchived}).then(() => load())}
              onSplit={(id, date) => {
                setSplitId(id);
                setSplitDate(date);
              }}
              canUpdate={can(FpResource.TRANSACTION, FpAction.UPDATE)}
              canSplit={can(FpResource.BILL_SPLIT, FpAction.CREATE)}
            />
          </Stack>
        </Tabs.Content>
      </Tabs.Root>
      {can(FpResource.IMPORT, FpAction.READ) ? (
        <Stack gap={1}>
          <Text fontSize="sm" color="fg.muted">
            Imports
          </Text>
          {imports.slice(0, 8).map((imp) => (
            <HStack key={imp.id} fontSize="sm">
              <Text>
                {imp.createdAt.slice(0, 10)}
                {imp.undoneAt !== undefined ? ' (undone)' : ''}
              </Text>
              {can(FpResource.IMPORT, FpAction.DELETE) && imp.undoneAt === undefined ? (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Undo this import and delete its transactions?')) {
                      void undoDbFpImport(imp.id).then(() => load());
                    }
                  }}
                >
                  Undo
                </Button>
              ) : null}
            </HStack>
          ))}
        </Stack>
      ) : null}
      <FpAccountDialog open={accountOpen} podId={podId} onClose={() => setAccountOpen(false)} onSaved={() => void load()} />
      <FpCategoryDialog open={categoryOpen} podId={podId} onClose={() => setCategoryOpen(false)} onSaved={() => void load()} />
      <FpTransactionDialog
        open={txOpen}
        podId={podId}
        userId={userId}
        accounts={visibleAccounts}
        categories={sortedCategories}
        onClose={() => setTxOpen(false)}
        onSaved={() => void load()}
      />
      <FpParserDialog open={parserOpen} podId={podId} onClose={() => setParserOpen(false)} onSaved={() => void load()} />
      <FpImportDialog
        open={importOpen}
        podId={podId}
        accounts={visibleAccounts}
        parsers={parsers}
        onClose={() => setImportOpen(false)}
        onSaved={() => void load()}
      />
      <FpSplitDialog
        open={splitId !== undefined}
        parentId={splitId}
        parentDate={splitDate}
        userId={userId}
        onClose={() => setSplitId(undefined)}
        onSaved={() => void load()}
      />
    </Stack>
  );
}
