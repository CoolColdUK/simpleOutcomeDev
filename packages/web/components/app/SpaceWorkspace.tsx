'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {Alert, Badge, Button, Heading, HStack, Stack, Switch, Text} from '@chakra-ui/react';
import {filterAccessiblePods, spaceRoleLabel, SpaceRole} from '@so/model';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import getDbSpace from '@/lib/api/db/getDbSpace';
import listDbSpaces from '@/lib/api/db/listDbSpaces';
import listDbPods from '@/lib/api/db/listDbPods';
import type {DbPod} from '@/lib/api/db/listDbPods';
import listDbMyPodMemberships from '@/lib/api/db/listDbMyPodMemberships';
import featureKindLabel from '@/lib/pod/featureKindLabel';
import AppPageLoadingState from '@/components/app/AppPageLoadingState';
import SpaceInvitesPanel from '@/components/app/SpaceInvitesPanel';
import SpaceMembersPanel from '@/components/app/SpaceMembersPanel';
import SpaceFindPodsPanel from '@/components/app/SpaceFindPodsPanel';
import SpaceCreatePodPanel from '@/components/app/SpaceCreatePodPanel';
import SpaceSettingsPanel from '@/components/app/SpaceSettingsPanel';

export default function SpaceWorkspace() {
  const params = useParams<{spaceId: string}>();
  const spaceId = params.spaceId;
  const {user} = useSupabaseAuthState();
  const [name, setName] = useState('');
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<SpaceRole>(SpaceRole.USER);
  const [pods, setPods] = useState<readonly DbPod[]>([]);
  const [memberPodIds, setMemberPodIds] = useState<readonly string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

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
    const spaces = await listDbSpaces(user.id);
    const mine = spaces.find((s) => s.id === spaceId);
    if (mine === undefined) {
      setError('No access to this space');
      setReady(true);
      return;
    }
    const [podRows, memberships] = await Promise.all([listDbPods(spaceId), listDbMyPodMemberships(user.id)]);
    setName(space.name);
    setDescription(space.description);
    setRole(mine.role);
    setPods(podRows);
    setMemberPodIds(memberships.map((m) => m.podId));
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

  const visible = filterAccessiblePods({
    pods,
    memberPodIds,
    spaceRole: role,
    userId: user?.id ?? '',
    showArchived,
  });
  const canShowArchivedSwitch = role === SpaceRole.OWNER || pods.some((p) => p.createdBy === user?.id && p.status === 'archived');

  return (
    <Stack gap={8}>
      <Stack gap={2}>
        <Text fontSize="sm">
          <Link href="/app">← Spaces</Link>
        </Text>
        <Heading as="h1" size="lg">
          {name}
        </Heading>
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
        <Heading as="h2" size="md">
          Pods
        </Heading>
        {visible.map((pod) => (
          <HStack key={pod.id} justify="space-between" borderWidth="1px" borderColor="border.subtle" p={3} borderRadius="md">
            <Link href={`/app/spaces/${spaceId}/pods/${pod.id}`}>
              {pod.name ?? featureKindLabel(pod.feature)} ({pod.status})
            </Link>
            <Text fontSize="sm" color="fg.muted">
              {pod.visibility}
            </Text>
          </HStack>
        ))}
        {visible.length === 0 ? <Text color="fg.muted">No pods yet. Find or add a feature.</Text> : null}
      </Stack>
      {spaceId !== undefined ? (
        <>
          <SpaceFindPodsPanel spaceId={spaceId} memberPodIds={memberPodIds} onChanged={() => void load()} />
          {role === SpaceRole.ADMIN || role === SpaceRole.OWNER ? (
            <SpaceCreatePodPanel spaceId={spaceId} onCreated={() => void load()} />
          ) : null}
          {role === SpaceRole.OWNER ? (
            <>
              <SpaceSettingsPanel
                key={`${name}:${description ?? ''}`}
                spaceId={spaceId}
                name={name}
                description={description}
                onSaved={() => void load()}
              />
              <SpaceInvitesPanel spaceId={spaceId} />
              <SpaceMembersPanel spaceId={spaceId} />
            </>
          ) : null}
        </>
      ) : null}
      <Button asChild variant="outline" colorPalette="brand" alignSelf="start">
        <Link href="/app">Back</Link>
      </Button>
    </Stack>
  );
}
