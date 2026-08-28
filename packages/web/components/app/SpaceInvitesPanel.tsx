'use client';

import {useCallback, useEffect, useState} from 'react';
import {Alert, Button, Heading, HStack, Stack, Text} from '@chakra-ui/react';
import dayjs from 'dayjs';
import type {SpaceInviteMode} from '@so/model';
import createDbSpaceInvite from '@/lib/api/db/createDbSpaceInvite';
import listDbSpaceInvites, {type DbSpaceInvite} from '@/lib/api/db/listDbSpaceInvites';
import disableDbSpaceInvite from '@/lib/api/db/disableDbSpaceInvite';
import deleteDbSpaceInvite from '@/lib/api/db/deleteDbSpaceInvite';

export interface SpaceInvitesPanelProps {
  readonly spaceId: string;
}

export default function SpaceInvitesPanel({spaceId}: SpaceInvitesPanelProps) {
  const [invites, setInvites] = useState<readonly DbSpaceInvite[]>([]);
  const [newToken, setNewToken] = useState('');
  const [error, setError] = useState('');
  const [infinite, setInfinite] = useState(false);
  const [mode, setMode] = useState<SpaceInviteMode>('permanent');

  const load = useCallback(async (): Promise<void> => {
    setInvites(await listDbSpaceInvites(spaceId));
  }, [spaceId]);

  useEffect(() => {
    void Promise.resolve()
      .then(() => load())
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [load]);

  const create = async (): Promise<void> => {
    setError('');
    try {
      const expiresAt = infinite ? undefined : dayjs().add(7, 'day').toISOString();
      const token = await createDbSpaceInvite(spaceId, mode, expiresAt);
      setNewToken(`${window.location.origin}/app/join/${token}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={3}>
      <Heading as="h2" size="md">
        Invites
      </Heading>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <HStack gap={2} flexWrap="wrap">
        <Button size="sm" variant={mode === 'permanent' ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setMode('permanent')}>
          Permanent
        </Button>
        <Button size="sm" variant={mode === 'single_use' ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setMode('single_use')}>
          Single use
        </Button>
        <Button size="sm" variant={infinite ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setInfinite(!infinite)}>
          {infinite ? 'Never expires' : 'Expires in 7 days'}
        </Button>
        <Button size="sm" colorPalette="brand" onClick={() => void create()}>
          Create link
        </Button>
      </HStack>
      {newToken !== '' ? (
        <Text fontSize="sm" wordBreak="break-all">
          Copy now (shown once): {newToken}
        </Text>
      ) : null}
      {invites.map((invite) => (
        <HStack key={invite.id} justify="space-between" flexWrap="wrap" borderWidth="1px" borderColor="border.subtle" p={2} borderRadius="md">
          <Text fontSize="sm">
            {invite.mode} · {invite.expiresAt === undefined ? 'infinite' : dayjs(invite.expiresAt).format('YYYY-MM-DD')}
            {invite.disabledAt !== undefined ? ' · disabled' : ''}
            {invite.consumedAt !== undefined ? ' · used' : ''}
          </Text>
          <HStack>
            <Button size="xs" variant="outline" colorPalette="brand" onClick={() => void disableDbSpaceInvite(invite.id).then(() => load()).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))}>
              Disable
            </Button>
            <Button size="xs" variant="outline" colorPalette="brand" onClick={() => void deleteDbSpaceInvite(invite.id).then(load)}>
              Delete
            </Button>
          </HStack>
        </HStack>
      ))}
    </Stack>
  );
}
