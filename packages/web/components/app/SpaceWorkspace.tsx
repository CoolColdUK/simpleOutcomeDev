'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {Alert, Badge, Button, Heading, HStack, Stack, Switch, Text} from '@chakra-ui/react';
import {canManageSpace, filterAccessiblePods, spaceRoleLabel, SpaceRole} from '@so/model';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import getDbSpace from '@/lib/api/db/getDbSpace';
import getDbSpaceMemberRole from '@/lib/api/db/getDbSpaceMemberRole';
import listDbPods from '@/lib/api/db/listDbPods';
import type {DbPod} from '@/lib/api/db/listDbPods';
import listDbMyPodMemberships from '@/lib/api/db/listDbMyPodMemberships';
import type {DbPodMembership} from '@/lib/api/db/listDbMyPodMemberships';
import AppPageLoadingState from '@/components/app/AppPageLoadingState';
import SpaceWorkspacePodCard from '@/components/app/SpaceWorkspacePodCard';
import SpaceCreatePodDialog from '@/components/app/SpaceCreatePodDialog';
import SpaceCreateInviteDialog from '@/components/app/SpaceCreateInviteDialog';

export default function SpaceWorkspace() {
  const params = useParams<{spaceId: string}>();
  const spaceId = params.spaceId;
  const {user} = useSupabaseAuthState();
  const [name, setName] = useState('');
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<SpaceRole>(SpaceRole.USER);
  const [pods, setPods] = useState<readonly DbPod[]>([]);
  const [memberships, setMemberships] = useState<readonly DbPodMembership[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (user === undefined || spaceId === undefined) {
      return;
    }
    const space = await getDbSpace(spaceId);
    if (space === undefined) {
      setError('Space not found');
      setReady(true);
      return;
    }
    const memberRole = await getDbSpaceMemberRole(spaceId, user.id);
    if (memberRole === undefined) {
      setError('No access to this space');
      setReady(true);
      return;
    }
    const [podRows, membershipRows] = await Promise.all([listDbPods(spaceId), listDbMyPodMemberships(user.id)]);
    setName(space.name);
    setDescription(space.description);
    setRole(memberRole);
    setPods(podRows);
    setMemberships(membershipRows);
    setReady(true);
  }, [spaceId, user]);

  useEffect(() => {
    void Promise.resolve()
      .then(() => load())
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setReady(true);
      });
  }, [load]);

  if (!ready) {
    return <AppPageLoadingState />;
  }

  const memberPodIds = memberships.map((m) => m.podId);
  const visible = filterAccessiblePods({
    pods,
    memberPodIds,
    spaceRole: role,
    userId: user?.id ?? '',
    showArchived,
  });
  const canCreate = canManageSpace(role);
  const isOwner = role === SpaceRole.OWNER;
  const canShowArchivedSwitch = isOwner || pods.some((p) => p.createdBy === user?.id && p.status === 'archived');

  return (
    <Stack gap={8}>
      <Stack gap={2}>
        <Text fontSize="sm">
          <Link href="/app">← Spaces</Link>
        </Text>
        <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
          <Heading as="h1" size="lg">
            {name}
          </Heading>
          {canCreate && spaceId !== undefined ? (
            <HStack gap={2} flexWrap="wrap">
              <Button colorPalette="brand" size="sm" onClick={() => setInviteOpen(true)}>
                Invite
              </Button>
              <Button asChild variant="outline" colorPalette="brand" size="sm">
                <Link href={`/app/spaces/${spaceId}/invitations`}>Invitation</Link>
              </Button>
              <Button asChild variant="outline" colorPalette="brand" size="sm">
                <Link href={`/app/spaces/${spaceId}/settings`}>Settings</Link>
              </Button>
            </HStack>
          ) : null}
        </HStack>
        {description !== undefined ? <Text color="fg.muted">{description}</Text> : null}
        <Badge colorPalette="brand" variant="subtle" alignSelf="start">
          {spaceRoleLabel(role)}
        </Badge>
      </Stack>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      {canShowArchivedSwitch ? (
        <HStack>
          <Switch.Root checked={showArchived} onCheckedChange={(e) => setShowArchived(e.checked)}>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>Show archived</Switch.Label>
          </Switch.Root>
        </HStack>
      ) : null}
      <Stack gap={3}>
        <HStack justify="space-between" align="center" gap={3} maxW="md">
          <Heading as="h2" size="md">
            Pods
          </Heading>
          <HStack gap={2}>
            {spaceId !== undefined ? (
              <Button asChild variant="outline" colorPalette="brand" size="sm">
                <Link href={`/app/spaces/${spaceId}/pods/find`}>Find</Link>
              </Button>
            ) : null}
            {canCreate ? (
              <Button colorPalette="brand" size="sm" onClick={() => setCreateOpen(true)}>
                Create
              </Button>
            ) : null}
          </HStack>
        </HStack>
        {visible.map((pod) => (
          <SpaceWorkspacePodCard
            key={pod.id}
            spaceId={spaceId ?? ''}
            pod={pod}
            role={memberships.find((m) => m.podId === pod.id)?.role}
          />
        ))}
        {visible.length === 0 ? <Text color="fg.muted">No pods yet. Find or create one.</Text> : null}
      </Stack>
      {spaceId !== undefined ? (
        <>
          {canCreate ? (
            <SpaceCreatePodDialog
              open={createOpen}
              spaceId={spaceId}
              onClose={() => setCreateOpen(false)}
              onCreated={() => {
                setCreateOpen(false);
                void load();
              }}
            />
          ) : null}
          {canCreate ? <SpaceCreateInviteDialog open={inviteOpen} spaceId={spaceId} onClose={() => setInviteOpen(false)} /> : null}
        </>
      ) : null}
      <Button asChild variant="outline" colorPalette="brand" alignSelf="start">
        <Link href="/app">Back</Link>
      </Button>
    </Stack>
  );
}
