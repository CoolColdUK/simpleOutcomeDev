'use client';

import {useState} from 'react';
import {
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
  Alert,
} from '@chakra-ui/react';
import createDbSpace from '@/lib/api/db/createDbSpace';

export interface AppHomeSpacesCreateDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreated: (spaceId: string) => void;
}

export default function AppHomeSpacesCreateDialog({open, onClose, onCreated}: AppHomeSpacesCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (): Promise<void> => {
    const trimmedName = name.trim();
    if (trimmedName === '') {
      setError('Name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const id = await createDbSpace(trimmedName, description.trim() === '' ? undefined : description.trim());
      setName('');
      setDescription('');
      onCreated(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create space</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              <Field.Root required>
                <Field.Label>Name</Field.Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team space" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this space is for"
                  minH="6rem"
                />
              </Field.Root>
              {error !== '' ? (
                <Alert.Root status="error">
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Root>
              ) : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button colorPalette="brand" onClick={() => void submit()} loading={loading}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
