'use client';

import {useState} from 'react';
import {Alert, Button, Field, Heading, Input, Stack} from '@chakra-ui/react';
import updateSupabaseAuthPassword from '@/lib/api/auth/updateSupabaseAuthPassword';

const PASSWORD_MIN_LENGTH = 8;

export default function AccountSettingsPasswordCard() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setError('');
    setSaved(false);
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await updateSupabaseAuthPassword(password);
      setPassword('');
      setConfirm('');
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={3} maxW="md">
      <Heading as="h2" size="md">
        Password
      </Heading>
      <Field.Root>
        <Field.Label>New password</Field.Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Confirm password</Field.Label>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </Field.Root>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      {saved ? (
        <Alert.Root status="success">
          <Alert.Description>Password updated.</Alert.Description>
        </Alert.Root>
      ) : null}
      <Button colorPalette="brand" loading={saving} onClick={() => void save()} alignSelf="start">
        Change password
      </Button>
    </Stack>
  );
}
