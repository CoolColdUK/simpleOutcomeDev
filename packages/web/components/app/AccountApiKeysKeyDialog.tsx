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
  HStack,
  Input,
  Stack,
} from '@chakra-ui/react';
import {
  API_KEY_PRESET_OPTIONS,
  ApiKeyPresetId,
  apiKeyMatrixForPreset,
  type ApiKeyMatrixPodInput,
  type ApiKeyMatrixSpaceInput,
  type ApiKeyPermissionMatrix,
} from '@so/model';
import AccountApiKeysPanelMatrix from '@/components/app/AccountApiKeysPanelMatrix';

export interface AccountApiKeysKeyDialogProps {
  readonly open: boolean;
  readonly formKey: string;
  readonly title: string;
  readonly submitLabel: string;
  readonly initialName: string;
  readonly initialMatrix: ApiKeyPermissionMatrix;
  readonly pods: readonly ApiKeyMatrixPodInput[];
  readonly spaces: readonly ApiKeyMatrixSpaceInput[];
  readonly saving: boolean;
  readonly error: string;
  readonly onClose: () => void;
  readonly onSubmit: (name: string, matrix: ApiKeyPermissionMatrix) => void;
}

function AccountApiKeysKeyDialogForm({
  title,
  submitLabel,
  initialName,
  initialMatrix,
  pods,
  spaces,
  saving,
  error,
  onClose,
  onSubmit,
}: Omit<AccountApiKeysKeyDialogProps, 'open' | 'formKey'>) {
  const [name, setName] = useState(initialName);
  const [matrix, setMatrix] = useState(initialMatrix);

  const applyPreset = (preset: ApiKeyPresetId): void => {
    setMatrix(apiKeyMatrixForPreset(preset, pods, spaces));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogCloseTrigger />
      </DialogHeader>
      <DialogBody>
        <Stack gap={4}>
          <Field.Root required>
            <Field.Label>Name</Field.Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} maxW="lg" />
          </Field.Root>
          <HStack gap={2} flexWrap="wrap">
            {API_KEY_PRESET_OPTIONS.map((option) => (
              <Button key={option.id} size="sm" variant="outline" colorPalette="brand" onClick={() => applyPreset(option.id)}>
                {option.label}
              </Button>
            ))}
          </HStack>
          <AccountApiKeysPanelMatrix matrix={matrix} onChange={setMatrix} />
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
        <Button colorPalette="brand" loading={saving} onClick={() => onSubmit(name, matrix)}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

export default function AccountApiKeysKeyDialog({open, formKey, ...formProps}: AccountApiKeysKeyDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? formProps.onClose() : undefined)} size="xl">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="min(100vw, 56rem)">
          {open ? <AccountApiKeysKeyDialogForm key={formKey} {...formProps} /> : null}
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
