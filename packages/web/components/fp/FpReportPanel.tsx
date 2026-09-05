'use client';

import {Box, Heading, HStack, Progress, Stack, Text} from '@chakra-ui/react';
import {buildFpCategoryReport, FpCategoryDirection} from '@so/model';
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

export default function FpReportPanel({transactions, categories, start, end, currency}: FpReportPanelProps) {
  const {totals, rows} = buildFpCategoryReport(transactions, categories, start, end);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.amount)), 1);

  return (
    <Stack gap={4}>
      <HStack gap={6} flexWrap="wrap">
        <Text>Income {formatFpMoney(totals.income, currency)}</Text>
        <Text>Expense {formatFpMoney(totals.expense, currency)}</Text>
        <Text>Saving {formatFpMoney(totals.saving, currency)}</Text>
      </HStack>
      <Stack gap={3}>
        {rows.map((row) => {
          const cat = categories.find((c) => c.id === row.categoryId);
              const spent = Math.abs(row.amount);
              const budget = cat?.budgetAmount;
              const pct = budget === undefined || budget === 0 ? undefined : (spent / budget) * 100;
          return (
            <Box key={row.categoryId ?? 'uncategorised'}>
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
        })}
      </Stack>
    </Stack>
  );
}
