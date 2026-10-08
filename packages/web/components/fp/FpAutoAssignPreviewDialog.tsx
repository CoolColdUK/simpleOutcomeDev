'use client';

import {useEffect, useState} from 'react';
import {
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import type {FpAutoAssignPreviewRow} from '@so/model';
import applyDbFpAutoAssignUpdates from '@/lib/api/db/applyDbFpAutoAssignUpdates';
import previewDbFpAutoAssign from '@/lib/api/db/previewDbFpAutoAssign';
import formatFpMoney from '@/lib/fp/formatFpMoney';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';

export interface FpAutoAssignPreviewDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly accounts: readonly DbFpAccount[];
  readonly categories: readonly DbFpCategory[];
  readonly currency: string;
  readonly onClose: () => void;
  readonly onApplied: () => void;
}

export default function FpAutoAssignPreviewDialog(props: FpAutoAssignPreviewDialogProps) {
  if (!props.open) {
    return null;
  }
  return <FpAutoAssignPreviewDialogBody {...props} />;
}

function FpAutoAssignPreviewDialogBody({
  podId,
  accounts,
  categories,
  currency,
  onClose,
  onApplied,
}: FpAutoAssignPreviewDialogProps) {
  const [rows, setRows] = useState<readonly FpAutoAssignPreviewRow[]>([]);
  const [included, setIncluded] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  useEffect(() => {
    void previewDbFpAutoAssign(podId)
      .then((loaded) => {
        setRows(loaded);
        setIncluded(new Set(loaded.map((row) => row.transactionId)));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setRows([]);
        setIncluded(new Set());
      })
      .finally(() => setLoading(false));
  }, [podId]);

  const toggleIncluded = (transactionId: string): void => {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  const apply = async (): Promise<void> => {
    setApplying(true);
    setError('');
    try {
      const updates = rows
        .filter((row) => included.has(row.transactionId))
        .map((row) => ({transactionId: row.transactionId, categoryId: row.categoryId}));
      await applyDbFpAutoAssignUpdates(updates, {confirmed: true});
      onApplied();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setApplying(false);
    }
  };

  return (
    <DialogRoot open onOpenChange={(e) => !e.open && onClose()}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="4xl">
          <DialogHeader>
            <DialogTitle>Re-run auto-assign rules</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <Stack gap={3}>
              <Text fontSize="sm" color="fg.muted">
                Only uncategorised, non-archived transactions are updated. Existing categories are left unchanged.
              </Text>
              {error !== '' ? <Text color="red.500">{error}</Text> : null}
              {loading ? <Text>Loading preview…</Text> : null}
              {!loading && rows.length === 0 ? (
                <Text>No transactions would receive a category from the current rules.</Text>
              ) : null}
              {!loading && rows.length > 0 ? (
                <Stack gap={2} maxH="360px" overflowY="auto">
                  <Text fontSize="sm">
                    {included.size} of {rows.length} transaction(s) will be categorised. Uncheck any you want to skip.
                  </Text>
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader aria-label="Include assignment" />
                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                        <Table.ColumnHeader>Account</Table.ColumnHeader>
                        <Table.ColumnHeader>Description</Table.ColumnHeader>
                        <Table.ColumnHeader>Recipient</Table.ColumnHeader>
                        <Table.ColumnHeader>Amount</Table.ColumnHeader>
                        <Table.ColumnHeader>Category</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {rows.map((row) => (
                        <Table.Row key={row.transactionId}>
                          <Table.Cell>
                            <input
                              type="checkbox"
                              checked={included.has(row.transactionId)}
                              onChange={() => toggleIncluded(row.transactionId)}
                              aria-label={`Assign ${row.description}`}
                            />
                          </Table.Cell>
                          <Table.Cell>{row.postedDate}</Table.Cell>
                          <Table.Cell>{accountName(row.accountId)}</Table.Cell>
                          <Table.Cell>{row.description}</Table.Cell>
                          <Table.Cell>{row.recipient === '' ? '—' : row.recipient}</Table.Cell>
                          <Table.Cell>{formatFpMoney(row.amount, currency)}</Table.Cell>
                          <Table.Cell>{categoryName(row.categoryId)}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Stack>
              ) : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={applying}>
              Cancel
            </Button>
            <Button
              colorPalette="brand"
              onClick={() => void apply()}
              disabled={loading || applying || rows.length === 0 || included.size === 0}
              loading={applying}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
