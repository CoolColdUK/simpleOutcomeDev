'use client';

import {useEffect, useState, type ReactNode} from 'react';
import {Alert, Button, Field, Heading, Input, Stack, Text} from '@chakra-ui/react';
import {parseUsername} from '@so/model';
import getDbProfile from '@/lib/api/db/getDbProfile';
import updateDbProfileUsername from '@/lib/api/db/updateDbProfileUsername';
import AppPageLoadingState from './AppPageLoadingState';

export interface UsernameGateProps {
  readonly userId: string;
  readonly children: ReactNode;
}

export default function UsernameGate({userId, children}: UsernameGateProps) {
  const [ready, setReady] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    void getDbProfile(userId)
      .then((profile) => {
        if (ac.signal.aborted) {
          return;
        }
        setNeedsUsername(profile?.username === undefined);
        setReady(true);
      })
      .catch(() => {
        if (ac.signal.aborted) {
          return;
        }
        setNeedsUsername(true);
        setReady(true);
      });
    return () => ac.abort();
  }, [userId]);

  const save = async (): Promise<void> => {
    setError('');
    setSaving(true);
    try {
      const parsed = parseUsername(username);
      await updateDbProfileUsername(parsed);
      setNeedsUsername(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return <AppPageLoadingState />;
  }

  if (needsUsername) {
    return (
      <Stack gap={4} maxW="md" mx="auto" py={10}>
        <Heading as="h1" size="lg">
          Choose a username
        </Heading>
        <Text color="fg.muted">This handle is unique and is how others in a space can add you to a pod.</Text>
        <Field.Root>
          <Field.Label>Username</Field.Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="nickname" />
        </Field.Root>
        {error !== '' ? (
          <Alert.Root status="error">
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        ) : null}
        <Button colorPalette="brand" loading={saving} onClick={() => void save()}>
          Save
        </Button>
      </Stack>
    );
  }

  return children;
}
