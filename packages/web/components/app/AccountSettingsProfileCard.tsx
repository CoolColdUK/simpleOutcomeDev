'use client';

import {useState} from 'react';
import {Alert, Button, Field, Heading, Input, Stack} from '@chakra-ui/react';
import {parseDisplayName} from '@so/model';
import updateDbProfileDisplayName from '@/lib/api/db/updateDbProfileDisplayName';

export interface AccountSettingsProfileCardProps {
  readonly username: string;
  readonly displayName: string;
  readonly onSaved: (displayName: string) => void;
}

export default function AccountSettingsProfileCard({
  username,
  displayName,
  onSaved,
}: AccountSettingsProfileCardProps) {
  const [name, setName] = useState(displayName);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setError('');
    setSaving(true);
    try {
      const parsed = parseDisplayName(name);
      await updateDbProfileDisplayName(parsed);
      onSaved(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={3} maxW="md">
      <Heading as="h2" size="md">
        Profile
      </Heading>
      <Field.Root>
        <Field.Label>Username</Field.Label>
        <Input value={username} readOnly />
        <Field.HelperText>Username cannot be changed once it is set.</Field.HelperText>
      </Field.Root>
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
      <Button colorPalette="brand" loading={saving} onClick={() => void save()} alignSelf="start">
        Save display name
      </Button>
    </Stack>
  );
}
