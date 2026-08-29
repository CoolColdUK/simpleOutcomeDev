'use client';

import {useState} from 'react';
import {Alert, Button, Field, Heading, Input, Stack, Textarea} from '@chakra-ui/react';
import updateDbSpace from '@/lib/api/db/updateDbSpace';

export interface SpaceSettingsPanelProps {
  readonly spaceId: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly onSaved: () => void;
}

export default function SpaceSettingsPanel({spaceId, name, description, onSaved}: SpaceSettingsPanelProps) {
  const [spaceName, setSpaceName] = useState(name);
  const [spaceDescription, setSpaceDescription] = useState(description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    const trimmed = spaceName.trim();
    if (trimmed === '') {
      setError('Name is required');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await updateDbSpace(spaceId, trimmed, spaceDescription.trim() === '' ? undefined : spaceDescription.trim());
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={3} maxW="md">
      <Heading as="h2" size="md">
        Space details
      </Heading>
      <Field.Root required>
        <Field.Label>Name</Field.Label>
        <Input value={spaceName} onChange={(e) => setSpaceName(e.target.value)} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Description</Field.Label>
        <Textarea value={spaceDescription} onChange={(e) => setSpaceDescription(e.target.value)} minH="6rem" />
      </Field.Root>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <Button colorPalette="brand" loading={saving} onClick={() => void save()} alignSelf="start">
        Save
      </Button>
    </Stack>
  );
}
