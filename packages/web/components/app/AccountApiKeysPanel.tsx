'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Button, Heading, HStack, Input, Stack, Text, Textarea} from '@chakra-ui/react';
import {
  ApiKeyStatus,
  FeatureKind,
  PodStatus,
  apiKeyMatrixFromPermissions,
  buildApiKeyAiSetupPrompt,
  createApiKeyMatrix,
  filterAccessiblePods,
  permissionsFromApiKeyMatrix,
  safeParseApiKeyPermissions,
  type ApiKeyMatrixPodInput,
  type ApiKeyMatrixSpaceInput,
  type ApiKeyPermissionMatrix,
  type ApiKeyPermissions,
} from '@so/model';
import AccountApiKeysKeyDialog from '@/components/app/AccountApiKeysKeyDialog';
import createDbApiKey from '@/lib/api/db/createDbApiKey';
import listDbApiKeys, {type DbApiKey} from '@/lib/api/db/listDbApiKeys';
import listDbPods from '@/lib/api/db/listDbPods';
import listDbSpaces from '@/lib/api/db/listDbSpaces';
import revokeDbApiKey from '@/lib/api/db/revokeDbApiKey';
import updateDbApiKey from '@/lib/api/db/updateDbApiKey';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface AccountApiKeysPanelProps {
  readonly userId: string;
}

interface MatrixInputs {
  readonly pods: readonly ApiKeyMatrixPodInput[];
  readonly spaces: readonly ApiKeyMatrixSpaceInput[];
}

function formatWhen(value: string | undefined): string {
  if (value === undefined) {
    return 'Never';
  }
  return `${value.replace('T', ' ').slice(0, 16)} UTC`;
}

function podName(feature: FeatureKind, name: string | undefined): string {
  if (name !== undefined && name.trim() !== '') {
    return name;
  }
  if (feature === FeatureKind.SHOPPING_LIST) {
    return 'Shopping list';
  }
  if (feature === FeatureKind.FINANCIAL_PLANNING) {
    return 'Financial planning';
  }
  if (feature === FeatureKind.TRIP_PLANNING) {
    return 'Trip planning';
  }
  return 'Todo list';
}

async function loadInputs(userId: string): Promise<MatrixInputs> {
  const supabase = getSupabaseBrowserClient();
  const [spaces, membership] = await Promise.all([listDbSpaces(userId), supabase.from('pod_member').select('pod_id').eq('user_id', userId)]);
  throwIfSupabaseError(membership.error);
  const memberPodIds = (membership.data ?? []).map((row) => row.pod_id);
  const pods = (
    await Promise.all(
      spaces.map(async (space) => {
        const listed = await listDbPods(space.id);
        return filterAccessiblePods({
          pods: listed.filter((pod) => pod.status === PodStatus.ACTIVE),
          memberPodIds,
          spaceRole: space.role,
          userId,
          showArchived: false,
        }).map((pod) => ({
          podId: pod.id,
          spaceId: space.id,
          spaceName: space.name,
          podName: podName(pod.feature, pod.name),
          feature: pod.feature,
        }));
      }),
    )
  ).flat();
  return {
    pods,
    spaces: spaces.map((space) => ({spaceId: space.id, spaceName: space.name})),
  };
}

function matrixForKey(permissions: ApiKeyPermissions, inputs: MatrixInputs): ApiKeyPermissionMatrix {
  return apiKeyMatrixFromPermissions(permissions, inputs.pods, inputs.spaces);
}

export default function AccountApiKeysPanel({userId}: AccountApiKeysPanelProps) {
  const [keys, setKeys] = useState<readonly DbApiKey[]>([]);
  const [inputs, setInputs] = useState<MatrixInputs>({pods: [], spaces: []});
  const [secret, setSecret] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<DbApiKey | undefined>(undefined);

  const createMatrix = useMemo(() => createApiKeyMatrix(inputs.pods, inputs.spaces), [inputs]);
  const editMatrix = useMemo(
    () => (editingKey === undefined ? createMatrix : matrixForKey(editingKey.permissions, inputs)),
    [createMatrix, editingKey, inputs],
  );

  const refresh = useCallback(async (): Promise<void> => {
    const [listed, nextInputs] = await Promise.all([listDbApiKeys(), loadInputs(userId)]);
    setKeys(listed);
    setInputs(nextInputs);
    setReady(true);
  }, [userId]);

  useEffect(() => {
    void Promise.resolve()
      .then(() => refresh())
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setReady(true);
      });
  }, [refresh]);

  const saveKey = async (name: string, matrix: ApiKeyPermissionMatrix, mode: 'create' | 'edit', keyId?: string): Promise<void> => {
    const trimmed = name.trim();
    if (trimmed === '') {
      setDialogError('Name is required');
      return;
    }
    const permissions = permissionsFromApiKeyMatrix(matrix);
    const parsed = safeParseApiKeyPermissions(permissions);
    if (!parsed.ok) {
      setDialogError(parsed.message);
      return;
    }
    setDialogError('');
    setSaving(true);
    try {
      if (mode === 'create') {
        const created = await createDbApiKey(trimmed, parsed.value);
        setSecret(created.secret);
        setPrompt(buildApiKeyAiSetupPrompt(window.location.origin));
        setCreateOpen(false);
      } else if (keyId !== undefined) {
        await updateDbApiKey(keyId, trimmed, parsed.value);
        setEditingKey(undefined);
      }
      await refresh();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string): Promise<void> => {
    setError('');
    try {
      await revokeDbApiKey(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const copy = async (value: string): Promise<void> => {
    await navigator.clipboard.writeText(value);
  };

  const closeCreate = (): void => {
    setCreateOpen(false);
    setDialogError('');
  };

  const closeEdit = (): void => {
    setEditingKey(undefined);
    setDialogError('');
  };

  return (
    <Stack gap={4}>
      <Heading as="h2" size="md">
        API keys
      </Heading>
      <Text color="fg.muted">
        Keys act as you and can cover pods in more than one space. Nothing is granted until you turn it on. The secret is shown once.
      </Text>
      {ready ? (
        <Button
          colorPalette="brand"
          alignSelf="start"
          onClick={() => {
            setDialogError('');
            setCreateOpen(true);
          }}
        >
          Create key
        </Button>
      ) : (
        <Text color="fg.muted">Loading API keys…</Text>
      )}
      <AccountApiKeysKeyDialog
        open={createOpen}
        title="Create API key"
        submitLabel="Create key"
        initialName=""
        initialMatrix={createMatrix}
        pods={inputs.pods}
        spaces={inputs.spaces}
        saving={saving}
        error={dialogError}
        onClose={closeCreate}
        onSubmit={(name, matrix) => void saveKey(name, matrix, 'create')}
      />
      <AccountApiKeysKeyDialog
        open={editingKey !== undefined}
        title="Edit API key"
        submitLabel="Save"
        initialName={editingKey?.name ?? ''}
        initialMatrix={editMatrix}
        pods={inputs.pods}
        spaces={inputs.spaces}
        saving={saving}
        error={dialogError}
        onClose={closeEdit}
        onSubmit={(name, matrix) => void saveKey(name, matrix, 'edit', editingKey?.id)}
      />
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      {secret !== undefined && prompt !== undefined ? (
        <Stack gap={2} maxW="lg">
          <Alert.Root status="warning">
            <Alert.Description>Copy the secret now. It will not be shown again.</Alert.Description>
          </Alert.Root>
          <Input readOnly value={secret} />
          <Button alignSelf="start" variant="outline" colorPalette="brand" onClick={() => void copy(secret)}>
            Copy secret
          </Button>
          <Textarea readOnly value={prompt} minH="8rem" />
          <Button alignSelf="start" variant="outline" colorPalette="brand" onClick={() => void copy(prompt)}>
            Copy MCP setup
          </Button>
        </Stack>
      ) : null}
      <Stack gap={3}>
        {keys.map((key) => (
          <HStack key={key.id} justify="space-between" flexWrap="wrap" gap={2}>
            <Text>
              {key.name} · {key.prefix} · {key.status} · last used {formatWhen(key.lastUsedAt)}
            </Text>
            {key.status === ApiKeyStatus.ACTIVE ? (
              <HStack gap={2}>
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="brand"
                  onClick={() => {
                    setDialogError('');
                    setEditingKey(key);
                  }}
                >
                  Edit
                </Button>
                <Button size="xs" variant="outline" colorPalette="brand" onClick={() => void revoke(key.id)}>
                  Revoke
                </Button>
              </HStack>
            ) : null}
          </HStack>
        ))}
      </Stack>
    </Stack>
  );
}
