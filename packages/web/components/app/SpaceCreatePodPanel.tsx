'use client';

import {useState} from 'react';
import {Alert, Button, Field, Heading, Input, Stack} from '@chakra-ui/react';
import type {FeatureKind, PodVisibility} from '@so/model';
import createDbPod from '@/lib/api/db/createDbPod';

export interface SpaceCreatePodPanelProps {
  readonly spaceId: string;
  readonly onCreated: () => void;
}

export default function SpaceCreatePodPanel({spaceId, onCreated}: SpaceCreatePodPanelProps) {
  const [feature, setFeature] = useState<FeatureKind>('todo_list');
  const [visibility, setVisibility] = useState<PodVisibility>('open');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async (): Promise<void> => {
    setError('');
    setSaving(true);
    try {
      await createDbPod(spaceId, feature, name, visibility);
      setName('');
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={3} maxW="md">
      <Heading as="h2" size="md">
        Add a feature
      </Heading>
      <Stack direction="row" gap={2} flexWrap="wrap">
        <Button size="sm" variant={feature === 'todo_list' ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setFeature('todo_list')}>
          Todo list
        </Button>
        <Button
          size="sm"
          variant={feature === 'shopping_list' ? 'solid' : 'outline'}
          colorPalette="brand"
          onClick={() => setFeature('shopping_list')}
        >
          Shopping list
        </Button>
      </Stack>
      <Stack direction="row" gap={2} flexWrap="wrap">
        <Button size="sm" variant={visibility === 'open' ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setVisibility('open')}>
          Open
        </Button>
        <Button size="sm" variant={visibility === 'request' ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setVisibility('request')}>
          Request
        </Button>
        <Button size="sm" variant={visibility === 'private' ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setVisibility('private')}>
          Private
        </Button>
      </Stack>
      <Field.Root>
        <Field.Label>Name (optional)</Field.Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field.Root>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <Button colorPalette="brand" loading={saving} onClick={() => void create()}>
        Create pod
      </Button>
    </Stack>
  );
}
