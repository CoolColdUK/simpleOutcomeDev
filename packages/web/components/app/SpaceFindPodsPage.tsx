'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {Alert, Button, Field, Heading, Input, Stack, Text} from '@chakra-ui/react';
import type {FeatureKind, PodVisibility} from '@so/model';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import getDbSpace from '@/lib/api/db/getDbSpace';
import getDbSpaceMemberRole from '@/lib/api/db/getDbSpaceMemberRole';
import listDbMyPodMemberships from '@/lib/api/db/listDbMyPodMemberships';
import searchDbPods from '@/lib/api/db/searchDbPods';
import joinDbOpenPod from '@/lib/api/db/joinDbOpenPod';
import createDbPodJoinRequest from '@/lib/api/db/createDbPodJoinRequest';
import featureKindLabel from '@/lib/pod/featureKindLabel';
import AppPageLoadingState from '@/components/app/AppPageLoadingState';
import SpaceFindPodsPageJoinAction from '@/components/app/SpaceFindPodsPageJoinAction';

interface FindPodRow {
  readonly id: string;
  readonly feature: FeatureKind;
  readonly name: string | undefined;
  readonly visibility: PodVisibility;
}

export default function SpaceFindPodsPage() {
  const params = useParams<{spaceId: string}>();
  const spaceId = params.spaceId;
  const {user} = useSupabaseAuthState();
  const [spaceName, setSpaceName] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [memberPodIds, setMemberPodIds] = useState<readonly string[]>([]);
  const [requestedPodIds, setRequestedPodIds] = useState<readonly string[]>([]);
  const [rows, setRows] = useState<readonly FindPodRow[]>([]);

  const load = useCallback(async (): Promise<void> => {
    if (user === undefined || spaceId === undefined) {
      return;
    }
    const space = await getDbSpace(spaceId);
    const role = await getDbSpaceMemberRole(spaceId, user.id);
    if (space === undefined || role === undefined) {
      setError('Space not found');
      setReady(true);
      return;
    }
    const [found, memberships] = await Promise.all([searchDbPods(spaceId, ''), listDbMyPodMemberships(user.id)]);
    setSpaceName(space.name);
    setRows(found);
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

  const search = async (): Promise<void> => {
    if (spaceId === undefined) {
      return;
    }
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!ready) {
    return <AppPageLoadingState />;
  }

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Text fontSize="sm">
          <Link href={`/app/spaces/${spaceId}`}>← {spaceName || 'Space'}</Link>
        </Text>
        <Heading as="h1" size="lg">
          Find pods
        </Heading>
        <Text color="fg.muted">Join any open pods you want. Request access for pods that require approval.</Text>
      </Stack>
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
  );
}
