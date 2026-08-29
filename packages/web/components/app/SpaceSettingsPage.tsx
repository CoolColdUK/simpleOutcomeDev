'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {Alert, Heading, Stack, Text} from '@chakra-ui/react';
import {SpaceRole, canManageSpace} from '@so/model';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import getDbSpace from '@/lib/api/db/getDbSpace';
import getDbSpaceMemberRole from '@/lib/api/db/getDbSpaceMemberRole';
import AppPageLoadingState from '@/components/app/AppPageLoadingState';
import SpaceSettingsPanel from '@/components/app/SpaceSettingsPanel';
import SpaceMembersPanel from '@/components/app/SpaceMembersPanel';

export default function SpaceSettingsPage() {
  const params = useParams<{spaceId: string}>();
  const spaceId = params.spaceId;
  const {user} = useSupabaseAuthState();
  const [name, setName] = useState('');
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<SpaceRole>(SpaceRole.USER);
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (): Promise<void> => {
    if (user === undefined || spaceId === undefined) {
      return;
    }
    const space = await getDbSpace(spaceId);
    const memberRole = await getDbSpaceMemberRole(spaceId, user.id);
    if (space === undefined || memberRole === undefined) {
      setError('Space not found');
      setReady(true);
      return;
    }
    setName(space.name);
    setDescription(space.description);
    setRole(memberRole);
    if (!canManageSpace(memberRole)) {
      setError('Admin or owner role is required');
      setReady(true);
      return;
    }
    setAllowed(true);
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

  return (
    <Stack gap={8}>
      <Stack gap={2}>
        <Text fontSize="sm">
          <Link href={`/app/spaces/${spaceId}`}>← {name || 'Space'}</Link>
        </Text>
        <Heading as="h1" size="lg">
          Settings
        </Heading>
      </Stack>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      {allowed && spaceId !== undefined ? (
        <>
          <SpaceSettingsPanel
            key={`${name}:${description ?? ''}`}
            spaceId={spaceId}
            name={name}
            description={description}
            onSaved={() => void load()}
          />
          <SpaceMembersPanel spaceId={spaceId} canEditRoles={role === SpaceRole.OWNER} />
        </>
      ) : null}
    </Stack>
  );
}
