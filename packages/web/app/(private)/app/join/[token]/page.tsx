'use client';

import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Alert, Heading, Stack, Text} from '@chakra-ui/react';
import joinDbSpaceByInviteToken from '@/lib/api/db/joinDbSpaceByInviteToken';
import AppPageLoadingState from '@/components/app/AppPageLoadingState';

export default function JoinSpacePage() {
  const params = useParams<{token: string}>();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.token;
    if (token === undefined || token === '') {
      setError('Missing invite token');
      return;
    }
    void joinDbSpaceByInviteToken(token)
      .then((spaceId) => {
        router.replace(`/app/spaces/${spaceId}`);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [params.token, router]);

  if (error !== '') {
    return (
      <Stack gap={4}>
        <Heading as="h1" size="lg">
          Invite
        </Heading>
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <AppPageLoadingState />
      <Text color="fg.muted">Joining space…</Text>
    </Stack>
  );
}
