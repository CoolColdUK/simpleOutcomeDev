'use client';

import {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Field,
  Input,
  Stack,
  Switch,
  Text,
} from '@chakra-ui/react';
import type {FeatureKind, PodVisibility} from '@so/model';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import listDbMyPodMemberships from '@/lib/api/db/listDbMyPodMemberships';
import searchDbPods from '@/lib/api/db/searchDbPods';
import joinDbOpenPod from '@/lib/api/db/joinDbOpenPod';
import createDbPodJoinRequest from '@/lib/api/db/createDbPodJoinRequest';
import featureKindLabel from '@/lib/pod/featureKindLabel';
import SpaceFindPodsPageJoinAction from '@/components/app/SpaceFindPodsPageJoinAction';

interface FindPodRow {
  readonly id: string;
  readonly feature: FeatureKind;
  readonly name: string | undefined;
  readonly visibility: PodVisibility;
}

export interface SpaceFindPodsDialogProps {
  readonly open: boolean;
  readonly spaceId: string;
  readonly showArchived: boolean;
  readonly canShowArchivedSwitch: boolean;
  readonly onShowArchivedChange: (show: boolean) => void;
  readonly onClose: () => void;
  readonly onJoined: () => void;
}

export default function SpaceFindPodsDialog({
  open,
  spaceId,
  showArchived,
  canShowArchivedSwitch,
  onShowArchivedChange,
  onClose,
  onJoined,
}: SpaceFindPodsDialogProps) {
  const {user} = useSupabaseAuthState();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [memberPodIds, setMemberPodIds] = useState<readonly string[]>([]);
  const [requestedPodIds, setRequestedPodIds] = useState<readonly string[]>([]);
  const [rows, setRows] = useState<readonly FindPodRow[]>([]);

  const load = useCallback(async (): Promise<void> => {
    if (user === undefined) {
      return;
    }
    const [found, memberships] = await Promise.all([searchDbPods(spaceId, ''), listDbMyPodMemberships(user.id)]);
    setRows(found);
    setMemberPodIds(memberships.map((m) => m.podId));
  }, [spaceId, user]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void Promise.resolve()
      .then(() => load())
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [load, open]);

  const search = async (): Promise<void> => {
    setError('');
    try {
      const safe = query.replace(/[%_,()]/g, '');
      setRows(await searchDbPods(spaceId, safe));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const join = async (podId: string, visibility: PodVisibility): Promise<void> => {
    setError('');
    try {
      if (visibility === 'open') {
        await joinDbOpenPod(podId);
      } else {
        await createDbPodJoinRequest(podId);
        setRequestedPodIds([...requestedPodIds, podId]);
      }
      await load();
      onJoined();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)} size="lg">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find pods</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              <Text color="fg.muted">
                Join open pods or request access. Archived pods you own (or all of them, if you own the space) can be
                shown on the space page with the switch below.
              </Text>
              {canShowArchivedSwitch ? (
                <Switch.Root checked={showArchived} onCheckedChange={(e) => onShowArchivedChange(e.checked)}>
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Label>Show archived pods</Switch.Label>
                </Switch.Root>
              ) : null}
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
                  <SpaceFindPodsPageJoinAction
                    podId={row.id}
                    visibility={row.visibility}
                    isMember={memberPodIds.includes(row.id)}
                    isRequested={requestedPodIds.includes(row.id)}
                    onJoin={(podId, visibility) => void join(podId, visibility)}
                  />
                </Stack>
              ))}
              {rows.length === 0 ? <Text color="fg.muted">No pods to join.</Text> : null}
            </Stack>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
