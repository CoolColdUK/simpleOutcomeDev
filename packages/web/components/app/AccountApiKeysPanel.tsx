'use client';

import {useCallback, useEffect, useState} from 'react';
import {Alert, Button, Field, Heading, HStack, Input, Stack, Text, Textarea} from '@chakra-ui/react';
import {
  API_KEY_PRESET_OPTIONS,
  ApiKeyPresetId,
  ApiKeyStatus,
  FeatureKind,
  PodStatus,
  apiKeyMatrixForPreset,
  buildApiKeyAiSetupPrompt,
  createApiKeyMatrix,
  filterAccessiblePods,
  permissionsFromApiKeyMatrix,
  safeParseApiKeyPermissions,
  type ApiKeyMatrixPodInput,
  type ApiKeyMatrixSpaceInput,
  type ApiKeyPermissionMatrix,
} from '@so/model';
import createDbApiKey from '@/lib/api/db/createDbApiKey';
import listDbApiKeys, {type DbApiKey} from '@/lib/api/db/listDbApiKeys';
import listDbPods from '@/lib/api/db/listDbPods';
import listDbSpaces from '@/lib/api/db/listDbSpaces';
import revokeDbApiKey from '@/lib/api/db/revokeDbApiKey';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import AccountApiKeysPanelMatrix from '@/components/app/AccountApiKeysPanelMatrix';

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

export default function AccountApiKeysPanel({userId}: AccountApiKeysPanelProps) {
  const [keys, setKeys] = useState<readonly DbApiKey[]>([]);
  const [inputs, setInputs] = useState<MatrixInputs>({pods: [], spaces: []});
  const [matrix, setMatrix] = useState<ApiKeyPermissionMatrix>(createApiKeyMatrix([], []));
  const [name, setName] = useState('');
  const [secret, setSecret] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async (resetMatrix: boolean): Promise<void> => {
    const [listed, nextInputs] = await Promise.all([listDbApiKeys(), loadInputs(userId)]);
    setKeys(listed);
    setInputs(nextInputs);
    if (resetMatrix) {
      setMatrix(createApiKeyMatrix(nextInputs.pods, nextInputs.spaces));
    }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    void Promise.resolve()
      .then(() => refresh(true))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setReady(true);
      });
  }, [refresh]);

  const applyPreset = (preset: ApiKeyPresetId): void => {
    setMatrix(apiKeyMatrixForPreset(preset, inputs.pods, inputs.spaces));
  };

  const create = async (): Promise<void> => {
    const trimmed = name.trim();
    if (trimmed === '') {
      setError('Name is required');
      return;
    }
    const permissions = permissionsFromApiKeyMatrix(matrix);
    const parsed = safeParseApiKeyPermissions(permissions);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError('');
    setSaving(true);
    try {
      const created = await createDbApiKey(trimmed, parsed.value);
      setSecret(created.secret);
      setPrompt(buildApiKeyAiSetupPrompt(window.location.origin));
      setName('');
      await refresh(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string): Promise<void> => {
    setError('');
    try {
      await revokeDbApiKey(id);
      await refresh(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const copy = async (value: string): Promise<void> => {
    await navigator.clipboard.writeText(value);
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
        <Stack gap={3}>
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
          <Button colorPalette="brand" alignSelf="start" loading={saving} onClick={() => void create()}>
            Create key
          </Button>
        </Stack>
      ) : (
        <Text color="fg.muted">Loading API keys…</Text>
      )}
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
              <Button size="xs" variant="outline" colorPalette="brand" onClick={() => void revoke(key.id)}>
                Revoke
              </Button>
            ) : null}
          </HStack>
        ))}
      </Stack>
    </Stack>
  );
}
