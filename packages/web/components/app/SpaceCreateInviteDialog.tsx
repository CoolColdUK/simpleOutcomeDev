'use client';

import {useState} from 'react';
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
  Field,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  parseSpaceInviteDays,
  parseSpaceInviteMaxUses,
  SPACE_INVITE_DAYS_DEFAULT,
  SPACE_INVITE_DAYS_MAX,
  SPACE_INVITE_DAYS_MIN,
  SPACE_INVITE_MAX_USES_DEFAULT,
  SPACE_INVITE_MAX_USES_MAX,
  SPACE_INVITE_MAX_USES_MIN,
} from '@so/model';
import createDbSpaceInvite from '@/lib/api/db/createDbSpaceInvite';

export interface SpaceCreateInviteDialogProps {
  readonly open: boolean;
  readonly spaceId: string;
  readonly onClose: () => void;
}

export default function SpaceCreateInviteDialog({open, spaceId, onClose}: SpaceCreateInviteDialogProps) {
  const [days, setDays] = useState(String(SPACE_INVITE_DAYS_DEFAULT));
  const [maxUses, setMaxUses] = useState(String(SPACE_INVITE_MAX_USES_DEFAULT));
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async (): Promise<void> => {
    setError('');
    setSaving(true);
    try {
      const token = await createDbSpaceInvite(spaceId, parseSpaceInviteDays(days), parseSpaceInviteMaxUses(maxUses));
      setLink(`${window.location.origin}/app/join/${token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const close = (): void => {
    setDays(String(SPACE_INVITE_DAYS_DEFAULT));
    setMaxUses(String(SPACE_INVITE_MAX_USES_DEFAULT));
    setLink('');
    setError('');
    onClose();
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? close() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create invite link</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              {error !== '' ? (
                <Alert.Root status="error">
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Root>
              ) : null}
              <Field.Root required>
                <Field.Label>Days until expiry</Field.Label>
                <Input
                  type="number"
                  min={SPACE_INVITE_DAYS_MIN}
                  max={SPACE_INVITE_DAYS_MAX}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
                <Text fontSize="sm" color="fg.muted">
                  {SPACE_INVITE_DAYS_MIN} to {SPACE_INVITE_DAYS_MAX} days. Default {SPACE_INVITE_DAYS_DEFAULT}.
                </Text>
              </Field.Root>
              <Field.Root required>
                <Field.Label>Max uses</Field.Label>
                <Input
                  type="number"
                  min={SPACE_INVITE_MAX_USES_MIN}
                  max={SPACE_INVITE_MAX_USES_MAX}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
                <Text fontSize="sm" color="fg.muted">
                  {SPACE_INVITE_MAX_USES_MIN} to {SPACE_INVITE_MAX_USES_MAX}. Default {SPACE_INVITE_MAX_USES_DEFAULT}.
                </Text>
              </Field.Root>
              {link !== '' ? (
                <Stack gap={2}>
                  <Text fontSize="sm" wordBreak="break-all">
                    Copy now (shown once): {link}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="brand"
                    alignSelf="start"
                    onClick={() => void navigator.clipboard.writeText(link)}
                  >
                    Copy link
                  </Button>
                </Stack>
              ) : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
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
