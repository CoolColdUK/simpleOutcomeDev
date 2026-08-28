'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams, useRouter} from 'next/navigation';
import {Alert, Button, Field, Heading, HStack, Input, Stack, Text} from '@chakra-ui/react';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import getDbPod from '@/lib/api/db/getDbPod';
import type {DbPod} from '@/lib/api/db/listDbPods';
import listDbSpaces from '@/lib/api/db/listDbSpaces';
import listDbPodMembers, {type DbPodMember} from '@/lib/api/db/listDbPodMembers';
import listDbPodJoinRequests, {type DbPodJoinRequest} from '@/lib/api/db/listDbPodJoinRequests';
import updateDbPodStatus from '@/lib/api/db/updateDbPodStatus';
import deleteDbPod from '@/lib/api/db/deleteDbPod';
import addDbPodMemberByUsername from '@/lib/api/db/addDbPodMemberByUsername';
import approveDbPodJoinRequest from '@/lib/api/db/approveDbPodJoinRequest';
import denyDbPodJoinRequest from '@/lib/api/db/denyDbPodJoinRequest';
import featureKindLabel from '@/lib/pod/featureKindLabel';
import type {SpaceRole} from '@so/model';
import AppPageLoadingState from '@/components/app/AppPageLoadingState';

export default function PodWorkspace() {
  const params = useParams<{spaceId: string; podId: string}>();
  const router = useRouter();
  const {user} = useSupabaseAuthState();
  const [pod, setPod] = useState<DbPod | undefined>(undefined);
  const [spaceRole, setSpaceRole] = useState<SpaceRole>('space_user');
  const [members, setMembers] = useState<readonly DbPodMember[]>([]);
  const [requests, setRequests] = useState<readonly DbPodJoinRequest[]>([]);
  const [addUsername, setAddUsername] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (user === undefined) {
      return;
    }
    const row = await getDbPod(params.podId);
    if (row === undefined) {
      setError('Pod not found');
      setReady(true);
      return;
    }
    const spaces = await listDbSpaces(user.id);
    const mine = spaces.find((s) => s.id === params.spaceId);
    setSpaceRole(mine?.role ?? 'space_user');
    setPod(row);
    setMembers(await listDbPodMembers(params.podId));
    setRequests(await listDbPodJoinRequests(params.podId).catch(() => []));
    setReady(true);
  }, [params.podId, params.spaceId, user]);

  useEffect(() => {
    void load().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
      setReady(true);
    });
  }, [load]);

  if (!ready || pod === undefined) {
    return ready ? (
      <Alert.Root status="error">
        <Alert.Description>{error === '' ? 'Pod not found' : error}</Alert.Description>
      </Alert.Root>
    ) : (
      <AppPageLoadingState />
    );
  }

  const myRole = members.find((m) => m.userId === user?.id)?.role;
  const isPodOwner = myRole === 'pod_owner';
  const isPodAdmin = myRole === 'pod_admin';
  const canManage = isPodOwner || spaceRole === 'space_owner';
  const canApprove = isPodOwner || isPodAdmin || spaceRole === 'space_owner';
  const canAddMembers = canApprove;

  const archive = async (): Promise<void> => {
    await updateDbPodStatus(pod.id, pod.status === 'archived' ? 'active' : 'archived');
    await load();
  };

  const remove = async (): Promise<void> => {
    await deleteDbPod(pod.id);
    router.replace(`/app/spaces/${params.spaceId}`);
  };

  const addMember = async (): Promise<void> => {
    setError('');
    try {
      await addDbPodMemberByUsername(pod.id, addUsername.trim(), 'pod_user');
      setAddUsername('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={6}>
      <Text fontSize="sm">
        <Link href={`/app/spaces/${params.spaceId}`}>← {params.spaceId.slice(0, 8)}</Link>
      </Text>
      <Heading as="h1" size="lg">
        {pod.name ?? featureKindLabel(pod.feature)}
      </Heading>
      <Text color="fg.muted">
        {featureKindLabel(pod.feature)} · {pod.visibility} · {pod.status}
      </Text>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <Text>This feature is coming soon. You can still manage access here.</Text>
      {canManage ? (
        <Button colorPalette="brand" alignSelf="start" onClick={() => void archive()}>
          {pod.status === 'archived' ? 'Restore' : 'Archive'}
        </Button>
      ) : null}
      {spaceRole === 'space_owner' ? (
        <Button variant="outline" colorPalette="brand" alignSelf="start" onClick={() => void remove()}>
          Delete pod
        </Button>
      ) : null}
      {canAddMembers ? (
        <Stack maxW="sm" gap={2}>
          <Field.Root>
            <Field.Label>Add space member by username</Field.Label>
            <Input value={addUsername} onChange={(e) => setAddUsername(e.target.value)} />
          </Field.Root>
          <Button colorPalette="brand" onClick={() => void addMember()}>
            Add as pod user
          </Button>
        </Stack>
      ) : null}
      <Stack gap={2}>
        <Heading as="h2" size="md">
          Members
        </Heading>
        {members.map((m) => (
          <Text key={m.userId}>
            {m.username ?? m.userId.slice(0, 8)} · {m.role.replaceAll('_', ' ')}
          </Text>
        ))}
      </Stack>
      {canApprove && requests.length > 0 ? (
        <Stack gap={2}>
          <Heading as="h2" size="md">
            Join requests
          </Heading>
          {requests.map((req) => (
            <HStack key={req.id}>
              <Text>{req.username ?? req.userId.slice(0, 8)}</Text>
              <Button size="sm" colorPalette="brand" onClick={() => void approveDbPodJoinRequest(req.id).then(load)}>
                Approve
              </Button>
              <Button size="sm" variant="outline" colorPalette="brand" onClick={() => void denyDbPodJoinRequest(req.id).then(load)}>
                Deny
              </Button>
            </HStack>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
