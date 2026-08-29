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
} from '@chakra-ui/react';
import {FEATURE_KINDS, POD_VISIBILITIES, type FeatureKind, type PodVisibility} from '@so/model';
import createDbPod from '@/lib/api/db/createDbPod';
import featureKindLabel from '@/lib/pod/featureKindLabel';

export interface SpaceCreatePodDialogProps {
  readonly open: boolean;
  readonly spaceId: string;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

export default function SpaceCreatePodDialog({open, spaceId, onClose, onCreated}: SpaceCreatePodDialogProps) {
  const [feature, setFeature] = useState<FeatureKind>('todo_list');
  const [visibility, setVisibility] = useState<PodVisibility>('open');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (): Promise<void> => {
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
                {FEATURE_KINDS.map((kind) => (
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
                {POD_VISIBILITIES.map((item) => (
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
                <Field.Label>Name (optional)</Field.Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
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
