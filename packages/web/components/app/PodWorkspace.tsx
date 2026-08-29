'use client';

import {useCallback, useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Alert, Heading, Stack, Tabs, Text} from '@chakra-ui/react';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import getDbPod from '@/lib/api/db/getDbPod';
import type {DbPod} from '@/lib/api/db/listDbPods';
import listDbSpaces from '@/lib/api/db/listDbSpaces';
import listDbPodMembers, {type DbPodMember} from '@/lib/api/db/listDbPodMembers';
import listDbPodJoinRequests, {type DbPodJoinRequest} from '@/lib/api/db/listDbPodJoinRequests';
import updateDbPodStatus from '@/lib/api/db/updateDbPodStatus';
import deleteDbPod from '@/lib/api/db/deleteDbPod';
import featureKindLabel from '@/lib/pod/featureKindLabel';
import {FeatureKind, PodRole, PodStatus, SpaceRole} from '@so/model';
import AppPageLoadingState from '@/components/app/AppPageLoadingState';
import PodWorkspaceAccess from '@/components/app/PodWorkspaceAccess';
import PodWorkspaceSettingsTab from '@/components/app/PodWorkspaceSettingsTab';
import TodoListBoard from '@/components/todo/TodoListBoard';

export default function PodWorkspace() {
  const params = useParams<{spaceId: string; podId: string}>();
  const router = useRouter();
  const {user} = useSupabaseAuthState();
  const [pod, setPod] = useState<DbPod | undefined>(undefined);
  const [spaceRole, setSpaceRole] = useState<SpaceRole>(SpaceRole.USER);
  const [members, setMembers] = useState<readonly DbPodMember[]>([]);
  const [requests, setRequests] = useState<readonly DbPodJoinRequest[]>([]);
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
    setSpaceRole(mine?.role ?? SpaceRole.USER);
    setPod(row);
    setMembers(await listDbPodMembers(params.podId));
    setRequests(await listDbPodJoinRequests(params.podId).catch(() => []));
    setReady(true);
  }, [params.podId, params.spaceId, user]);

  useEffect(() => {
    void Promise.resolve()
      .then(() => load())
      .catch((e: unknown) => {
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
  const isPodOwner = myRole === PodRole.OWNER;
  const isPodAdmin = myRole === PodRole.ADMIN;
  const canManage = isPodOwner || spaceRole === SpaceRole.OWNER;
  const canApprove = isPodOwner || isPodAdmin || spaceRole === SpaceRole.OWNER;

  const archive = async (): Promise<void> => {
    await updateDbPodStatus(pod.id, pod.status === PodStatus.ARCHIVED ? PodStatus.ACTIVE : PodStatus.ARCHIVED);
    await load();
  };

  const remove = async (): Promise<void> => {
    await deleteDbPod(pod.id);
    router.replace(`/app/spaces/${params.spaceId}`);
  };

  return (
    <Stack gap={6}>
      <Heading as="h1" size="lg">
        {pod.name ?? featureKindLabel(pod.feature)}
      </Heading>
      {pod.description !== undefined ? <Text>{pod.description}</Text> : null}
      <Text color="fg.muted">
        {featureKindLabel(pod.feature)} · {pod.visibility} · {pod.status}
      </Text>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <Tabs.Root defaultValue="board" variant="line">
        <Tabs.List>
          <Tabs.Trigger value="board">Board</Tabs.Trigger>
          <Tabs.Trigger value="members">Members</Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="board">
          {pod.feature === FeatureKind.TODO_LIST && user !== undefined ? (
            <TodoListBoard
              podId={pod.id}
              userId={user.id}
              members={members}
              podRole={myRole}
              isSpaceOwner={spaceRole === SpaceRole.OWNER}
            />
          ) : (
            <Text>This feature is coming soon. You can still manage access here.</Text>
          )}
        </Tabs.Content>
        <Tabs.Content value="members">
          <PodWorkspaceAccess
            podId={pod.id}
            members={members}
            requests={requests}
            canAddMembers={canApprove}
            canApprove={canApprove}
            onChanged={() => void load()}
            onError={setError}
          />
        </Tabs.Content>
        <Tabs.Content value="settings">
          <PodWorkspaceSettingsTab
            key={`${pod.name ?? ''}:${pod.description ?? ''}`}
            pod={pod}
            canManage={canManage}
            isSpaceOwner={spaceRole === SpaceRole.OWNER}
            onArchive={() => void archive()}
            onDelete={() => void remove()}
            onSaved={() => void load()}
          />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
