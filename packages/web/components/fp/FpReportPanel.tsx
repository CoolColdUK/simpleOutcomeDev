'use client';

import {useState} from 'react';
import {Box, Button, Heading, HStack, Progress, Stack, Text} from '@chakra-ui/react';
import {buildFpCategoryReport, FpCategoryDirection, type FpReportCategoryRow} from '@so/model';
import formatFpMoney from '@/lib/fp/formatFpMoney';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import type {DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';

export interface FpReportPanelProps {
  readonly transactions: readonly DbFpTransaction[];
  readonly categories: readonly DbFpCategory[];
  readonly start?: string;
  readonly end?: string;
  readonly currency: string;
}

function ReportLeafRow({
  row,
  categories,
  currency,
  maxAbs,
  indent,
}: {
  readonly row: FpReportCategoryRow;
  readonly categories: readonly DbFpCategory[];
  readonly currency: string;
  readonly maxAbs: number;
  readonly indent?: boolean;
}) {
  const cat = categories.find((c) => c.id === row.categoryId);
  const spent = Math.abs(row.amount);
  const budget = cat?.budgetAmount;
  const pct = budget === undefined || budget === 0 ? undefined : (spent / budget) * 100;
  return (
    <Box pl={indent === true ? 4 : 0}>
      <HStack justify="space-between">
        <Heading as="h3" size="sm">
          {row.name}
          {row.direction === FpCategoryDirection.TRANSFER ? ' (transfer)' : ''}
        </Heading>
        <Text>{formatFpMoney(row.amount, currency)}</Text>
      </HStack>
      <Progress.Root value={Math.min(100, (Math.abs(row.amount) / maxAbs) * 100)} max={100}>
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      {pct !== undefined ? (
        <Text fontSize="xs" color="fg.muted">
          {Math.round(pct)}% of budget
        </Text>
      ) : null}
    </Box>
  );
}

export default function FpReportPanel({transactions, categories, start, end, currency}: FpReportPanelProps) {
  const {totals, rows} = buildFpCategoryReport(transactions, categories, start, end);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.amount)), 1);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = (groupId: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <Stack gap={4}>
      <HStack gap={6} flexWrap="wrap">
        <Text>Income {formatFpMoney(totals.income, currency)}</Text>
        <Text>Expense {formatFpMoney(totals.expense, currency)}</Text>
        <Text>Saving {formatFpMoney(totals.saving, currency)}</Text>
      </HStack>
      <Stack gap={3}>
        {rows.map((row) => {
          const groupId = row.categoryId;
          if (row.isGroup === true && groupId !== undefined) {
            const isOpen = expanded.has(groupId);
            return (
              <Box key={groupId}>
                <HStack justify="space-between">
                  <HStack gap={2}>
                    <Button size="xs" variant="ghost" aria-expanded={isOpen} onClick={() => toggle(groupId)}>
                      {isOpen ? '▼' : '▶'}
                    </Button>
                    <Heading as="h3" size="sm">
                      {row.name}
                    </Heading>
                  </HStack>
                  <Text>{formatFpMoney(row.amount, currency)}</Text>
                </HStack>
                <Progress.Root value={Math.min(100, (Math.abs(row.amount) / maxAbs) * 100)} max={100}>
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
                {isOpen
                  ? (row.children ?? []).map((child) => (
                      <ReportLeafRow
                        key={child.categoryId ?? 'uncategorised'}
                        row={child}
                        categories={categories}
                        currency={currency}
                        maxAbs={maxAbs}
                        indent
                      />
                    ))
                  : null}
              </Box>
            );
          }
          return (
            <ReportLeafRow
              key={row.categoryId ?? 'uncategorised'}
              row={row}
              categories={categories}
              currency={currency}
              maxAbs={maxAbs}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}
