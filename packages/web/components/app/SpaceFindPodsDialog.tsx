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

export interface SpaceFindPodsSearchRequest {
  readonly text: string;
  readonly archived: boolean;
  readonly nonce: number;
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
  const [request, setRequest] = useState<SpaceFindPodsSearchRequest>({text: '', archived: false, nonce: 0});
  const [error, setError] = useState('');
  const [memberPodIds, setMemberPodIds] = useState<readonly string[]>([]);
  const [requestedPodIds, setRequestedPodIds] = useState<readonly string[]>([]);
  const [rows, setRows] = useState<readonly FindPodRow[]>([]);

  const load = useCallback(async (text: string, archived: boolean): Promise<void> => {
    if (user === undefined) {
      return;
    }
    const safe = text.replace(/[%_,()]/g, '');
    const [found, memberships] = await Promise.all([
      searchDbPods(spaceId, safe, archived),
      listDbMyPodMemberships(user.id),
    ]);
    setRows(found);
    setMemberPodIds(memberships.map((m) => m.podId));
  }, [spaceId, user]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void Promise.resolve()
      .then(() => load(request.text, request.archived))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [load, open, request]);

  const search = (): void => {
    setError('');
    setRequest((current) => ({text: query, archived: current.archived, nonce: current.nonce + 1}));
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
      await load(request.text, request.archived);
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
                <Switch.Root
                  checked={request.archived}
                  onCheckedChange={(event) => {
                    setRequest((current) => ({text: query, archived: event.checked, nonce: current.nonce + 1}));
                  }}
                >
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
