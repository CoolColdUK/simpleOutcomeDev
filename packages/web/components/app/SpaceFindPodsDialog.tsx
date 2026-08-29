'use client';

import {useEffect, useState} from 'react';
import {
  Alert,
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
  Field,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import type {FeatureKind, PodVisibility} from '@so/model';
import searchDbPods from '@/lib/api/db/searchDbPods';
import joinDbOpenPod from '@/lib/api/db/joinDbOpenPod';
import createDbPodJoinRequest from '@/lib/api/db/createDbPodJoinRequest';
import featureKindLabel from '@/lib/pod/featureKindLabel';

export interface SpaceFindPodsDialogProps {
  readonly open: boolean;
  readonly spaceId: string;
  readonly memberPodIds: readonly string[];
  readonly onClose: () => void;
  readonly onChanged: () => void;
}

interface FindPodRow {
  readonly id: string;
  readonly feature: FeatureKind;
  readonly name: string | undefined;
  readonly visibility: PodVisibility;
}

export default function SpaceFindPodsDialog({
  open,
  spaceId,
  memberPodIds,
  onClose,
  onChanged,
}: SpaceFindPodsDialogProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [rows, setRows] = useState<readonly FindPodRow[]>([]);

  const search = async (): Promise<void> => {
    setError('');
    try {
      const safe = query.replace(/[%_,()]/g, '');
      setRows(await searchDbPods(spaceId, safe));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    void searchDbPods(spaceId, '')
      .then((found) => {
        setRows(found);
        setError('');
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [open, spaceId]);

  const join = async (podId: string, visibility: PodVisibility): Promise<void> => {
    setError('');
    try {
      if (visibility === 'open') {
        await joinDbOpenPod(podId);
      } else {
        await createDbPodJoinRequest(podId);
      }
      onChanged();
      await search();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find pods</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>Search</Field.Label>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or feature" />
              </Field.Root>
              <Button colorPalette="brand" alignSelf="start" onClick={() => void search()}>
                Search
              </Button>
              {error !== '' ? (
                <Alert.Root status="error">
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Root>
              ) : null}
              {rows.map((row) => (
                <Stack key={row.id} borderWidth="1px" borderColor="border.emphasized" p={3} borderRadius="md">
                  <Text>
                    {row.name ?? featureKindLabel(row.feature)} · {row.visibility}
                  </Text>
                  {memberPodIds.includes(row.id) ? (
                    <Text fontSize="sm" color="fg.muted">
                      Already a member
                    </Text>
                  ) : (
                    <Button size="sm" colorPalette="brand" alignSelf="start" onClick={() => void join(row.id, row.visibility)}>
                      {row.visibility === 'open' ? 'Join' : 'Request to join'}
                    </Button>
                  )}
                </Stack>
              ))}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
