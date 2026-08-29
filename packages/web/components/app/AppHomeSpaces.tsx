'use client';

import {useCallback, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Alert, Button, Heading, HStack, Stack, Text} from '@chakra-ui/react';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import listDbSpaces from '@/lib/api/db/listDbSpaces';
import type {SpaceListItem} from '@/lib/api/db/spaceListItem';
import AppPageLoadingState from './AppPageLoadingState';
import AppHomeSpacesCard from './AppHomeSpacesCard';
import AppHomeSpacesCreateDialog from './AppHomeSpacesCreateDialog';

export default function AppHomeSpaces() {
  const {user} = useSupabaseAuthState();
  const router = useRouter();
  const [spaces, setSpaces] = useState<readonly SpaceListItem[]>([]);
  const [ready, setReady] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (): Promise<void> => {
    if (user === undefined) {
      return;
    }
    const rows = await listDbSpaces(user.id);
    setSpaces(rows);
    setReady(true);
  }, [user]);

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
    <Stack gap={6}>
      <HStack justify="space-between" align="center" gap={3} maxW="md">
        <Heading as="h1" size="lg">
          Spaces
        </Heading>
        <Button colorPalette="brand" size="sm" onClick={() => setCreateOpen(true)}>
          Create
        </Button>
      </HStack>
      <Text color="fg.muted">Your spaces. Create another when you need a separate group.</Text>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <Stack gap={3}>
        {spaces.map((space) => (
          <AppHomeSpacesCard key={space.id} space={space} />
        ))}
      </Stack>
      <AppHomeSpacesCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          router.push(`/app/spaces/${id}`);
        }}
      />
    </Stack>
  );
}
