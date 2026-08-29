'use client';

import {useCallback, useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import {Alert, Badge, Button, Heading, HStack, Stack, Text} from '@chakra-ui/react';
import {
  SPACE_INVITE_PAGE_SIZE,
  SpaceInviteStatus,
  SpaceInviteStatusFilter,
  canManageSpace,
  spaceInviteStatusLabel,
} from '@so/model';
import dayjs from 'dayjs';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import getDbSpace from '@/lib/api/db/getDbSpace';
import getDbSpaceMemberRole from '@/lib/api/db/getDbSpaceMemberRole';
import listDbSpaceInvites, {type DbSpaceInvite} from '@/lib/api/db/listDbSpaceInvites';
import disableDbSpaceInvite from '@/lib/api/db/disableDbSpaceInvite';
import deleteDbSpaceInvite from '@/lib/api/db/deleteDbSpaceInvite';
import AppPageLoadingState from '@/components/app/AppPageLoadingState';

export default function SpaceInvitationsPage() {
  const params = useParams<{spaceId: string}>();
  const spaceId = params.spaceId;
  const {user} = useSupabaseAuthState();
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<SpaceInviteStatusFilter>(SpaceInviteStatusFilter.ALL);
  const [page, setPage] = useState(1);
  const [invites, setInvites] = useState<readonly DbSpaceInvite[]>([]);
  const [total, setTotal] = useState(0);

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
    if (!canManageSpace(role)) {
      setError('Admin or owner role is required');
      setReady(true);
      return;
    }
    const listed = await listDbSpaceInvites(spaceId, status, page);
    setAllowed(true);
    setInvites(listed.invites);
    setTotal(listed.total);
    setReady(true);
  }, [page, spaceId, status, user]);

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

  const pageCount = Math.max(1, Math.ceil(total / SPACE_INVITE_PAGE_SIZE));

  return (
    <Stack gap={6}>
      <Heading as="h1" size="lg">
        Invitations
      </Heading>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      {allowed ? (
        <>
          <HStack gap={2} flexWrap="wrap">
            {Object.values(SpaceInviteStatusFilter).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={status === item ? 'solid' : 'outline'}
                colorPalette="brand"
                onClick={() => {
                  setPage(1);
                  setStatus(item);
                }}
              >
                {item === SpaceInviteStatusFilter.ALL ? 'All' : spaceInviteStatusLabel(item as unknown as SpaceInviteStatus)}
              </Button>
            ))}
          </HStack>
          {invites.map((invite) => (
            <HStack key={invite.id} justify="space-between" flexWrap="wrap" borderWidth="1px" borderColor="border.emphasized" p={3} borderRadius="md">
              <Stack gap={1}>
                <Text fontFamily="mono">{invite.tokenPrefix}</Text>
                <Text fontSize="sm" color="fg.muted">
                  {invite.useCount}/{invite.maxUses} uses · expires {invite.expiresAt === undefined ? 'never' : dayjs(invite.expiresAt).format('YYYY-MM-DD')}
                </Text>
              </Stack>
              <HStack>
                <Badge colorPalette="brand" variant="subtle">
                  {spaceInviteStatusLabel(invite.status)}
                </Badge>
                {invite.status === 'active' ? (
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="brand"
                    onClick={() =>
                      void disableDbSpaceInvite(invite.id)
                        .then(() => load())
                        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
                    }
                  >
                    Disable
                  </Button>
                ) : null}
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="brand"
                  onClick={() =>
                    void deleteDbSpaceInvite(invite.id)
                      .then(() => load())
                      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
                  }
                >
                  Delete
                </Button>
              </HStack>
            </HStack>
          ))}
          {invites.length === 0 ? <Text color="fg.muted">No invitations match this filter.</Text> : null}
          <HStack>
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Text fontSize="sm">
              Page {page} of {pageCount}
            </Text>
            <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </HStack>
        </>
      ) : null}
    </Stack>
  );
}
