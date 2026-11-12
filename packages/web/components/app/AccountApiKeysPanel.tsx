'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Badge, Button, Heading, HStack, Stack, Text, Textarea} from '@chakra-ui/react';
import {
  ApiKeyKind,
  ApiKeyStatus,
  FeatureKind,
  PodStatus,
  apiKeyKindLabel,
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
import AccountApiKeysSecret from '@/components/app/AccountApiKeysSecret';
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
  if (feature === FeatureKind.FINANCIAL_PLANNING) {
    return 'Financial planning';
  }
  if (feature === FeatureKind.TRIP_PLANNING) {
    return 'Trip planning';
  }
  if (feature === FeatureKind.BOOK) {
    return 'Book';
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
  const [secretVisible, setSecretVisible] = useState(false);
  const [visibleKeyIds, setVisibleKeyIds] = useState<ReadonlySet<string>>(new Set());
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

  const saveKey = async (name: string, kind: ApiKeyKind, matrix: ApiKeyPermissionMatrix, mode: 'create' | 'edit', keyId?: string): Promise<void> => {
    const trimmed = name.trim();
    if (trimmed === '') {
      setDialogError('Name is required');
      return;
    }
    const permissions = kind === ApiKeyKind.FULL ? {} : permissionsFromApiKeyMatrix(matrix);
    const parsed = safeParseApiKeyPermissions(permissions);
    if (!parsed.ok) {
      setDialogError(parsed.message);
      return;
    }
    setDialogError('');
    setSaving(true);
    try {
      if (mode === 'create') {
        const created = await createDbApiKey(trimmed, parsed.value, kind);
        setSecret(created.secret);
        setSecretVisible(false);
        setPrompt(buildApiKeyAiSetupPrompt(window.location.origin));
        setCreateOpen(false);
      } else if (keyId !== undefined) {
        await updateDbApiKey(keyId, trimmed, parsed.value, kind);
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

  const toggleKeyVisible = (id: string): void => {
    setVisibleKeyIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
        Scoped keys only include the actions you turn on. Full access keys can do everything you can do, including access you gain later. Secrets stay hidden until you show them.
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
        formKey="create"
        title="Create API key"
        submitLabel="Create key"
        initialName=""
        initialKind={ApiKeyKind.SCOPED}
        initialMatrix={createMatrix}
        pods={inputs.pods}
        spaces={inputs.spaces}
        saving={saving}
        error={dialogError}
        onClose={closeCreate}
        onSubmit={(name, kind, matrix) => void saveKey(name, kind, matrix, 'create')}
      />
      <AccountApiKeysKeyDialog
        open={editingKey !== undefined}
        formKey={editingKey?.id ?? 'edit'}
        title="Edit API key"
        submitLabel="Save"
        initialName={editingKey?.name ?? ''}
        initialKind={editingKey?.kind ?? ApiKeyKind.SCOPED}
        initialMatrix={editMatrix}
        pods={inputs.pods}
        spaces={inputs.spaces}
        saving={saving}
        error={dialogError}
        onClose={closeEdit}
        onSubmit={(name, kind, matrix) => void saveKey(name, kind, matrix, 'edit', editingKey?.id)}
      />
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      {secret !== undefined && prompt !== undefined ? (
        <Stack gap={2} maxW="lg">
          <Alert.Root status="warning">
            <Alert.Description>Copy the secret now, or show it later from this list.</Alert.Description>
          </Alert.Root>
          <AccountApiKeysSecret value={secret} revealed={secretVisible} onToggle={() => setSecretVisible((current) => !current)} />
          <Button alignSelf="start" variant="outline" colorPalette="brand" onClick={() => void navigator.clipboard.writeText(secret)}>
            Copy secret
          </Button>
          <Textarea readOnly value={prompt} minH="8rem" />
          <Button alignSelf="start" variant="outline" colorPalette="brand" onClick={() => void navigator.clipboard.writeText(prompt)}>
            Copy MCP setup
          </Button>
        </Stack>
      ) : null}
      <Stack gap={3}>
        {keys.map((key) => (
          <Stack key={key.id} gap={2} align="start">
            <HStack gap={2} flexWrap="wrap">
              <Text>{key.name}</Text>
              <Badge colorPalette={key.kind === ApiKeyKind.FULL ? 'brand' : 'gray'} variant="subtle">
                {apiKeyKindLabel(key.kind)}
              </Badge>
              <Text color="fg.muted">
                {key.status} · last used {formatWhen(key.lastUsedAt)}
              </Text>
            </HStack>
            {key.secret === undefined ? (
              <Text fontFamily="mono" color="fg.muted">
                {key.prefix}
              </Text>
            ) : (
              <AccountApiKeysSecret value={key.secret} revealed={visibleKeyIds.has(key.id)} onToggle={() => toggleKeyVisible(key.id)} />
            )}
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
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
