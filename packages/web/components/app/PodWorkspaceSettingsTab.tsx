'use client';

import {useState} from 'react';
import {Alert, Button, Field, Input, Stack, Text, Textarea} from '@chakra-ui/react';
import {PodStatus} from '@so/model';
import type {DbPod} from '@/lib/api/db/listDbPods';
import updateDbPod from '@/lib/api/db/updateDbPod';

export interface PodWorkspaceSettingsTabProps {
  readonly pod: DbPod;
  readonly canManage: boolean;
  readonly isSpaceOwner: boolean;
  readonly onArchive: () => void;
  readonly onDelete: () => void;
  readonly onSaved: () => void;
}

export default function PodWorkspaceSettingsTab({
  pod,
  canManage,
  isSpaceOwner,
  onArchive,
  onDelete,
  onSaved,
}: PodWorkspaceSettingsTabProps) {
  const [name, setName] = useState(pod.name ?? '');
  const [description, setDescription] = useState(pod.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setError('');
    setSaving(true);
    try {
      await updateDbPod(pod.id, name, pod.visibility, description);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={4} align="start" maxW="md">
      {canManage ? (
        <Stack gap={3} w="full">
          <Field.Root>
            <Field.Label>Title</Field.Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Description</Field.Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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
      ) : (
        <Text color="fg.muted">Only pod owners and space owners can change settings.</Text>
      )}
      {canManage ? (
        <Button colorPalette="brand" onClick={onArchive}>
          {pod.status === PodStatus.ARCHIVED ? 'Restore pod' : 'Archive pod'}
        </Button>
      ) : null}
      {isSpaceOwner ? (
        <Button variant="outline" colorPalette="brand" onClick={onDelete}>
          Delete pod
        </Button>
      ) : null}
    </Stack>
  );
}
