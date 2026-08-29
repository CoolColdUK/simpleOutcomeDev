'use client';

import {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import {SPACE_INVITE_MODES, type SpaceInviteMode} from '@so/model';
import createDbSpaceInvite from '@/lib/api/db/createDbSpaceInvite';
import listDbSpaceInvites, {type DbSpaceInvite} from '@/lib/api/db/listDbSpaceInvites';
import disableDbSpaceInvite from '@/lib/api/db/disableDbSpaceInvite';
import deleteDbSpaceInvite from '@/lib/api/db/deleteDbSpaceInvite';

export interface SpaceInvitesDialogProps {
  readonly open: boolean;
  readonly spaceId: string;
  readonly onClose: () => void;
}

export default function SpaceInvitesDialog({open, spaceId, onClose}: SpaceInvitesDialogProps) {
  const [invites, setInvites] = useState<readonly DbSpaceInvite[]>([]);
  const [newToken, setNewToken] = useState('');
  const [error, setError] = useState('');
  const [infinite, setInfinite] = useState(false);
  const [mode, setMode] = useState<SpaceInviteMode>('permanent');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setInvites(await listDbSpaceInvites(spaceId));
  }, [spaceId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void Promise.resolve()
      .then(() => load())
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [load, open]);

  const create = async (): Promise<void> => {
    setError('');
    setSaving(true);
    try {
      const expiresAt = infinite ? undefined : dayjs().add(7, 'day').toISOString();
      const token = await createDbSpaceInvite(spaceId, mode, expiresAt);
      setNewToken(`${window.location.origin}/app/join/${token}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to space</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              {error !== '' ? (
                <Alert.Root status="error">
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Root>
              ) : null}
              <HStack gap={2} flexWrap="wrap">
                {SPACE_INVITE_MODES.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={mode === item ? 'solid' : 'outline'}
                    colorPalette="brand"
                    onClick={() => setMode(item)}
                  >
                    {item === 'single_use' ? 'Single use' : 'Permanent'}
                  </Button>
                ))}
                <Button size="sm" variant={infinite ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setInfinite(!infinite)}>
                  {infinite ? 'Never expires' : 'Expires in 7 days'}
                </Button>
              </HStack>
              {newToken !== '' ? (
                <Text fontSize="sm" wordBreak="break-all">
                  Copy now (shown once): {newToken}
                </Text>
              ) : null}
              {invites.map((invite) => (
                <HStack key={invite.id} justify="space-between" flexWrap="wrap" borderWidth="1px" borderColor="border.emphasized" p={2} borderRadius="md">
                  <Text fontSize="sm">
                    {invite.mode} · {invite.expiresAt === undefined ? 'infinite' : dayjs(invite.expiresAt).format('YYYY-MM-DD')}
                    {invite.disabledAt !== undefined ? ' · disabled' : ''}
                    {invite.consumedAt !== undefined ? ' · used' : ''}
                  </Text>
                  <HStack>
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
                    <Button size="xs" variant="outline" colorPalette="brand" onClick={() => void deleteDbSpaceInvite(invite.id).then(load)}>
                      Delete
                    </Button>
                  </HStack>
                </HStack>
              ))}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button colorPalette="brand" loading={saving} onClick={() => void create()}>
              Create link
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
