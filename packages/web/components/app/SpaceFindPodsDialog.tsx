'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
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
import {PodStatus, type FeatureKind, type PodVisibility} from '@so/model';
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
  readonly status: PodStatus;
}

export interface SpaceFindPodsDialogProps {
  readonly open: boolean;
  readonly spaceId: string;
  readonly canShowArchivedSwitch: boolean;
  readonly onClose: () => void;
  readonly onJoined: () => void;
}

export default function SpaceFindPodsDialog({
  open,
  spaceId,
  canShowArchivedSwitch,
  onClose,
  onJoined,
}: SpaceFindPodsDialogProps) {
  const {user} = useSupabaseAuthState();
  const [query, setQuery] = useState('');
  const queryRef = useRef(query);
  queryRef.current = query;
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState('');
  const [memberPodIds, setMemberPodIds] = useState<readonly string[]>([]);
  const [requestedPodIds, setRequestedPodIds] = useState<readonly string[]>([]);
  const [rows, setRows] = useState<readonly FindPodRow[]>([]);

  const load = useCallback(async (): Promise<void> => {
    if (user === undefined) {
      return;
    }
    const safe = queryRef.current.replace(/[%_,()]/g, '');
    const [found, memberships] = await Promise.all([
      searchDbPods(spaceId, safe, showArchived),
      listDbMyPodMemberships(user.id),
    ]);
    setRows(found);
    setMemberPodIds(memberships.map((m) => m.podId));
  }, [showArchived, spaceId, user]);

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
      await load();
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
                Join open pods or request access. The switch lists archived pods you own, or every archived pod if you
                own the space. It does not change the pods on the space page.
              </Text>
              {canShowArchivedSwitch ? (
                <Switch.Root checked={showArchived} onCheckedChange={(e) => setShowArchived(e.checked)}>
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
                    {row.status === PodStatus.ARCHIVED ? ' · archived' : ''}
                  </Text>
                  {row.status === PodStatus.ACTIVE ? (
                    <SpaceFindPodsPageJoinAction
                      podId={row.id}
                      visibility={row.visibility}
                      isMember={memberPodIds.includes(row.id)}
                      isRequested={requestedPodIds.includes(row.id)}
                      onJoin={(podId, visibility) => void join(podId, visibility)}
                    />
                  ) : null}
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
