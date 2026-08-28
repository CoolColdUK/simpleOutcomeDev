'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Alert, Button, Field, Heading, Input, Stack, Text, useSlotRecipe} from '@chakra-ui/react';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import listDbSpaces from '@/lib/api/db/listDbSpaces';
import createDbSpace from '@/lib/api/db/createDbSpace';
import type {SpaceListItem} from '@/lib/api/db/spaceListItem';
import AppPageLoadingState from './AppPageLoadingState';

export default function AppHomeSpaces() {
  const {user} = useSupabaseAuthState();
  const router = useRouter();
  const [spaces, setSpaces] = useState<readonly SpaceListItem[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const recipe = useSlotRecipe({key: 'spaceCard'});
  const styles = recipe();

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

  const create = async (): Promise<void> => {
    setError('');
    setSaving(true);
    try {
      const id = await createDbSpace(name.trim() === '' ? 'My space' : name.trim());
      setName('');
      await load();
      router.push(`/app/spaces/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return <AppPageLoadingState />;
  }

  return (
    <Stack gap={6}>
      <Heading as="h1" size="lg">
        Spaces
      </Heading>
      <Text color="fg.muted">Your spaces. Create another when you need a separate group.</Text>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <Stack gap={3}>
        {spaces.map((space) => (
          <Stack key={space.id} css={styles.root}>
            <Heading as="h2" size="md">
              <Link href={`/app/spaces/${space.id}`}>{space.name}</Link>
            </Heading>
            <Text fontSize="sm" color="fg.muted">
              {space.role.replace('_', ' ')}
            </Text>
          </Stack>
        ))}
      </Stack>
      <Stack gap={3} maxW="sm">
        <Field.Root>
          <Field.Label>New space name</Field.Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team space" />
        </Field.Root>
        <Button colorPalette="brand" loading={saving} onClick={() => void create()}>
          Create space
        </Button>
      </Stack>
    </Stack>
  );
}
