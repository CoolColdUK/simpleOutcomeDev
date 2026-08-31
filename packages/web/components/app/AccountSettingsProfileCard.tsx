'use client';

import {useState} from 'react';
import {Alert, Button, Field, Heading, Input, Stack} from '@chakra-ui/react';
import dayjs from 'dayjs';
import {canChangeUsername, nextUsernameChangeAt, parseDisplayName, parseUsername} from '@so/model';
import updateDbProfileDisplayName from '@/lib/api/db/updateDbProfileDisplayName';
import updateDbProfileUsername from '@/lib/api/db/updateDbProfileUsername';

export interface AccountSettingsProfileCardProps {
  readonly username: string;
  readonly usernameChangedAt: string | undefined;
  readonly displayName: string;
  readonly onUsernameSaved: (username: string, changedAt: string) => void;
  readonly onDisplayNameSaved: (displayName: string) => void;
}

export default function AccountSettingsProfileCard({
  username,
  usernameChangedAt,
  displayName,
  onUsernameSaved,
  onDisplayNameSaved,
}: AccountSettingsProfileCardProps) {
  const [handle, setHandle] = useState(username);
  const [name, setName] = useState(displayName);
  const [error, setError] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const nowIso = new Date().toISOString();
  const canEditUsername = canChangeUsername(usernameChangedAt, nowIso);
  const nextChange = nextUsernameChangeAt(usernameChangedAt);

  const saveUsername = async (): Promise<void> => {
    setError('');
    setSavingUsername(true);
    try {
      const parsed = parseUsername(handle);
      await updateDbProfileUsername(parsed);
      onUsernameSaved(parsed, new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingUsername(false);
    }
  };

  const saveDisplayName = async (): Promise<void> => {
    setError('');
    setSavingName(true);
    try {
      const parsed = parseDisplayName(name);
      await updateDbProfileDisplayName(parsed);
      onDisplayNameSaved(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingName(false);
    }
  };

  return (
    <Stack gap={3} maxW="md">
      <Heading as="h2" size="md">
        Profile
      </Heading>
      <Field.Root>
        <Field.Label>Username</Field.Label>
        <Input
          value={handle}
          readOnly={!canEditUsername}
          onChange={(e) => setHandle(e.target.value)}
          autoComplete="nickname"
        />
        <Field.HelperText>
          {canEditUsername
            ? 'Unique handle used to add you to a pod. You can change it once every 30 days.'
            : `You can change your username again on ${dayjs(nextChange).format('YYYY-MM-DD')}.`}
        </Field.HelperText>
      </Field.Root>
      {canEditUsername ? (
        <Button
          colorPalette="brand"
          loading={savingUsername}
          disabled={handle.trim().toLowerCase() === username.toLowerCase()}
          onClick={() => void saveUsername()}
          alignSelf="start"
        >
          Save username
        </Button>
      ) : null}
      <Field.Root>
        <Field.Label>Display name</Field.Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <Field.HelperText>Shown to others. Leave blank to use your username.</Field.HelperText>
      </Field.Root>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <Button colorPalette="brand" loading={savingName} onClick={() => void saveDisplayName()} alignSelf="start">
        Save display name
      </Button>
    </Stack>
  );
}
