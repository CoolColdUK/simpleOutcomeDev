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
  Textarea,
} from '@chakra-ui/react';
import {FeatureKind, PodVisibility} from '@so/model';
import createDbPod from '@/lib/api/db/createDbPod';
import featureKindLabel from '@/lib/pod/featureKindLabel';

export interface SpaceCreatePodDialogProps {
  readonly open: boolean;
  readonly spaceId: string;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

export default function SpaceCreatePodDialog({open, spaceId, onClose, onCreated}: SpaceCreatePodDialogProps) {
  const [feature, setFeature] = useState<FeatureKind>(FeatureKind.TODO_LIST);
  const [visibility, setVisibility] = useState<PodVisibility>(PodVisibility.OPEN);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (): Promise<void> => {
    setError('');
    setSaving(true);
    try {
      await createDbPod(spaceId, feature, name, visibility, description);
      setName('');
      setDescription('');
      onCreated();
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
            <DialogTitle>Create pod</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              <Stack direction="row" gap={2} flexWrap="wrap">
                {Object.values(FeatureKind).map((kind) => (
                  <Button
                    key={kind}
                    size="sm"
                    variant={feature === kind ? 'solid' : 'outline'}
                    colorPalette="brand"
                    onClick={() => setFeature(kind)}
                  >
                    {featureKindLabel(kind)}
                  </Button>
                ))}
              </Stack>
              <Stack direction="row" gap={2} flexWrap="wrap">
                {Object.values(PodVisibility).map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={visibility === item ? 'solid' : 'outline'}
                    colorPalette="brand"
                    onClick={() => setVisibility(item)}
                  >
                    {item}
                  </Button>
                ))}
              </Stack>
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
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button colorPalette="brand" loading={saving} onClick={() => void submit()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
