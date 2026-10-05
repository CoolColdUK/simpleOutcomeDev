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
import applyDbFpAutoAssign from '@/lib/api/db/applyDbFpAutoAssign';
import previewDbFpAutoAssign from '@/lib/api/db/previewDbFpAutoAssign';
import formatFpMoney from '@/lib/fp/formatFpMoney';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';

export interface FpAutoAssignPreviewDialogProps {
  readonly open: boolean;
  readonly podId: string;
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
  categories,
  currency,
  onClose,
  onApplied,
}: FpAutoAssignPreviewDialogProps) {
  const [rows, setRows] = useState<readonly FpAutoAssignPreviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  useEffect(() => {
    void previewDbFpAutoAssign(podId)
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [podId]);

  const apply = async (): Promise<void> => {
    setApplying(true);
    setError('');
    try {
      await applyDbFpAutoAssign(podId);
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
        <DialogContent maxW="lg">
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
                  <Text fontSize="sm">{rows.length} transaction(s) would be categorised.</Text>
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                        <Table.ColumnHeader>Description</Table.ColumnHeader>
                        <Table.ColumnHeader>Amount</Table.ColumnHeader>
                        <Table.ColumnHeader>Category</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {rows.map((row) => (
                        <Table.Row key={row.transactionId}>
                          <Table.Cell>{row.postedDate}</Table.Cell>
                          <Table.Cell>{row.description}</Table.Cell>
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
              disabled={loading || applying || rows.length === 0}
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
