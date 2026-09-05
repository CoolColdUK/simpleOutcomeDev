'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, HStack, Stack, Tabs, Text} from '@chakra-ui/react';
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
import listDbFpImportFiles from '@/lib/api/db/listDbFpImportFiles';
import getDbFpSetting from '@/lib/api/db/getDbFpSetting';
import sumDbFpAccountBalance from '@/lib/api/db/sumDbFpAccountBalance';
import bulkUpdateDbFpTransactionCategory from '@/lib/api/db/bulkUpdateDbFpTransactionCategory';
import confirmDbFpTransactions from '@/lib/api/db/confirmDbFpTransactions';
import updateDbFpTransaction from '@/lib/api/db/updateDbFpTransaction';
import applyDbFpAutoAssign from '@/lib/api/db/applyDbFpAutoAssign';
import undoDbFpImport from '@/lib/api/db/undoDbFpImport';
import deleteDbFpAccount from '@/lib/api/db/deleteDbFpAccount';
import deleteDbFpCategory from '@/lib/api/db/deleteDbFpCategory';
import deleteDbFpParser from '@/lib/api/db/deleteDbFpParser';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import type {DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';
import type {DbFpParser} from '@/lib/api/db/mapDbFpParser';
import type {DbFpImport} from '@/lib/api/db/mapDbFpImport';
import type {DbFpImportFile} from '@/lib/api/db/mapDbFpImportFile';
import type {DbFpSetting} from '@/lib/api/db/mapDbFpSetting';
import formatFpMoney from '@/lib/fp/formatFpMoney';
import fpDateRangeFromPreset, {type FpDatePreset} from '@/lib/fp/fpDateRangeFromPreset';
import FpAccountDialog from '@/components/fp/FpAccountDialog';
import FpCategoryDialog from '@/components/fp/FpCategoryDialog';
import FpTransactionDialog from '@/components/fp/FpTransactionDialog';
import FpParserDialog from '@/components/fp/FpParserDialog';
import FpImportDialog from '@/components/fp/FpImportDialog';
import FpSplitDialog from '@/components/fp/FpSplitDialog';
import FpLedgerPanel from '@/components/fp/FpLedgerPanel';
import FpAccountPage from '@/components/fp/FpAccountPage';
import FpCategoryPage from '@/components/fp/FpCategoryPage';
import FpParserPage from '@/components/fp/FpParserPage';
import FpImportPage from '@/components/fp/FpImportPage';

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
  const [importFiles, setImportFiles] = useState<readonly DbFpImportFile[]>([]);
  const [setting, setSetting] = useState<DbFpSetting | undefined>(undefined);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState<FpDatePreset>('this_month');
  const [accountFilter, setAccountFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [section, setSection] = useState('ledger');
  const [accountOpen, setAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<DbFpAccount | undefined>(undefined);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DbFpCategory | undefined>(undefined);
  const [txOpen, setTxOpen] = useState(false);
  const [parserOpen, setParserOpen] = useState(false);
  const [editingParser, setEditingParser] = useState<DbFpParser | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const [splitId, setSplitId] = useState<string | undefined>(undefined);
  const [splitDate, setSplitDate] = useState<string | undefined>(undefined);

  const range = fpDateRangeFromPreset(preset, {});
  const permission = setting?.permission ?? fpDefaultPermission();
  const can = (resource: FpResource, action: FpAction) => fpCan(podRole, isSpaceOwner, permission, resource, action);

  const load = useCallback(async (): Promise<void> => {
    setError('');
    const [acc, cats, txs, pars, imps, files, set] = await Promise.all([
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
      listDbFpImportFiles(podId),
      getDbFpSetting(podId),
    ]);
    setAccounts(acc);
    setCategories(cats);
    setTransactions(txs);
    setParsers(pars);
    setImports(imps);
    setImportFiles(files);
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
    void Promise.resolve()
      .then(() => load())
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      });
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

  const runOrError = (work: () => Promise<void>): void => {
    void work().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    });
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
      <Tabs.Root
        value={section}
        onValueChange={(event) => setSection(event.value)}
        variant="line"
      >
        <Tabs.List>
          <Tabs.Trigger value="ledger">Ledger</Tabs.Trigger>
          <Tabs.Trigger value="accounts">Accounts</Tabs.Trigger>
          <Tabs.Trigger value="categories">Categories</Tabs.Trigger>
          <Tabs.Trigger value="parsers">Parsers</Tabs.Trigger>
          <Tabs.Trigger value="imports">Imports</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="ledger">
          <FpLedgerPanel
            accounts={visibleAccounts}
            categories={sortedCategories}
            transactions={transactions}
            currency={currency}
            preset={preset}
            accountFilter={accountFilter}
            showArchived={showArchived}
            selected={selected}
            start={range.start}
            end={range.end}
            can={can}
            onPreset={setPreset}
            onAccountFilter={setAccountFilter}
            onToggleArchived={() => setShowArchived(!showArchived)}
            onAddTransaction={() => setTxOpen(true)}
            onImport={() => setImportOpen(true)}
            onRerunRules={() => runOrError(() => applyDbFpAutoAssign(podId).then(() => load()))}
            onToggleRow={toggle}
            onAssign={(id) =>
              runOrError(() =>
                bulkUpdateDbFpTransactionCategory([...selected], id).then(() => {
                  setSelected(new Set());
                  return load();
                }),
              )
            }
            onConfirm={() =>
              runOrError(() =>
                confirmDbFpTransactions([...selected]).then(() => {
                  setSelected(new Set());
                  return load();
                }),
              )
            }
            onArchive={(id) => runOrError(() => updateDbFpTransaction(id, {archived: !showArchived}).then(() => load()))}
            onSplit={(id, date) => {
              setSplitId(id);
              setSplitDate(date);
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="accounts">
          <FpAccountPage
            accounts={accounts}
            balances={balances}
            currency={currency}
            canCreate={can(FpResource.ACCOUNT, FpAction.CREATE)}
            canUpdate={can(FpResource.ACCOUNT, FpAction.UPDATE)}
            canDelete={can(FpResource.ACCOUNT, FpAction.DELETE)}
            onAdd={() => {
              setEditingAccount(undefined);
              setAccountOpen(true);
            }}
            onEdit={(account) => {
              setEditingAccount(account);
              setAccountOpen(true);
            }}
            onDelete={(account) => {
              if (window.confirm(`Delete account “${account.name}”? This fails if it still has transactions.`)) {
                runOrError(() => deleteDbFpAccount(account.id).then(() => load()));
              }
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="categories">
          <FpCategoryPage
            categories={sortedCategories}
            canCreate={can(FpResource.CATEGORY, FpAction.CREATE)}
            canUpdate={can(FpResource.CATEGORY, FpAction.UPDATE)}
            canDelete={can(FpResource.CATEGORY, FpAction.DELETE)}
            onAdd={() => {
              setEditingCategory(undefined);
              setCategoryOpen(true);
            }}
            onEdit={(category) => {
              setEditingCategory(category);
              setCategoryOpen(true);
            }}
            onDelete={(category) => {
              if (window.confirm(`Delete category “${category.name}”? Transactions become uncategorised.`)) {
                runOrError(() => deleteDbFpCategory(category.id).then(() => load()));
              }
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="parsers">
          <FpParserPage
            parsers={parsers}
            canCreate={can(FpResource.PARSER, FpAction.CREATE)}
            canUpdate={can(FpResource.PARSER, FpAction.UPDATE)}
            canDelete={can(FpResource.PARSER, FpAction.DELETE)}
            onAdd={() => {
              setEditingParser(undefined);
              setParserOpen(true);
            }}
            onEdit={(parser) => {
              setEditingParser(parser);
              setParserOpen(true);
            }}
            onDelete={(parser) => {
              if (window.confirm(`Delete parser “${parser.name}”?`)) {
                runOrError(() => deleteDbFpParser(parser.id).then(() => load()));
              }
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="imports">
          <FpImportPage
            imports={imports}
            files={importFiles}
            accounts={accounts}
            parsers={parsers}
            canCreate={can(FpResource.IMPORT, FpAction.CREATE)}
            canUndo={can(FpResource.IMPORT, FpAction.DELETE)}
            onImport={() => setImportOpen(true)}
            onUndo={(imp) => {
              if (window.confirm('Undo this import and delete its transactions?')) {
                runOrError(() => undoDbFpImport(imp.id).then(() => load()));
              }
            }}
          />
        </Tabs.Content>
      </Tabs.Root>
      <FpAccountDialog
        open={accountOpen}
        podId={podId}
        account={editingAccount}
        onClose={() => {
          setAccountOpen(false);
          setEditingAccount(undefined);
        }}
        onSaved={() => void load()}
      />
      <FpCategoryDialog
        open={categoryOpen}
        podId={podId}
        category={editingCategory}
        onClose={() => {
          setCategoryOpen(false);
          setEditingCategory(undefined);
        }}
        onSaved={() => void load()}
      />
      <FpTransactionDialog
        open={txOpen}
        podId={podId}
        userId={userId}
        accounts={visibleAccounts}
        categories={sortedCategories}
        onClose={() => setTxOpen(false)}
        onSaved={() => void load()}
      />
      <FpParserDialog
        open={parserOpen}
        podId={podId}
        parser={editingParser}
        onClose={() => {
          setParserOpen(false);
          setEditingParser(undefined);
        }}
        onSaved={() => void load()}
      />
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
