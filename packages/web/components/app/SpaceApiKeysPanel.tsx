'use client';

import {useCallback, useEffect, useState} from 'react';
import {Alert, Button, Field, Heading, HStack, Input, NativeSelect, Stack, Text, Textarea} from '@chakra-ui/react';
import {
  API_KEY_PRESET_OPTIONS,
  ApiKeyPresetId,
  ApiKeyStatus,
  buildApiKeyAiSetupPrompt,
  filterAccessiblePods,
  permissionsForPreset,
  PodStatus,
  safeParseApiKeyPermissions,
  type SpaceRole,
} from '@so/model';
import createDbApiKey from '@/lib/api/db/createDbApiKey';
import listDbApiKeys, {type DbApiKey} from '@/lib/api/db/listDbApiKeys';
import listDbPods, {type DbPod} from '@/lib/api/db/listDbPods';
import revokeDbApiKey from '@/lib/api/db/revokeDbApiKey';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface SpaceApiKeysPanelProps {
  readonly spaceId: string;
  readonly userId: string;
  readonly spaceRole: SpaceRole;
}

function formatWhen(value: string | undefined): string {
  if (value === undefined) {
    return 'Never';
  }
  return `${value.replace('T', ' ').slice(0, 16)} UTC`;
}

export default function SpaceApiKeysPanel({spaceId, userId, spaceRole}: SpaceApiKeysPanelProps) {
  const [keys, setKeys] = useState<readonly DbApiKey[]>([]);
  const [pods, setPods] = useState<readonly DbPod[]>([]);
  const [name, setName] = useState('');
  const [preset, setPreset] = useState<ApiKeyPresetId>(ApiKeyPresetId.TODO_READ_WRITE);
  const [selectedPods, setSelectedPods] = useState<readonly string[]>([]);
  const [secret, setSecret] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    const [listed, allPods, membership] = await Promise.all([
      listDbApiKeys(spaceId),
      listDbPods(spaceId),
      supabase.from('pod_member').select('pod_id').eq('user_id', userId),
    ]);
    throwIfSupabaseError(membership.error);
    const memberPodIds = (membership.data ?? []).map((row) => row.pod_id);
    setKeys(listed);
    setPods(
      filterAccessiblePods({
        pods: allPods.filter((pod) => pod.status === PodStatus.ACTIVE),
        memberPodIds,
        spaceRole,
        userId,
        showArchived: false,
      }),
    );
  }, [spaceId, spaceRole, userId]);

  useEffect(() => {
    void Promise.resolve()
      .then(() => load())
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [load]);

  const togglePod = (podId: string): void => {
    setSelectedPods((current) => (current.includes(podId) ? current.filter((id) => id !== podId) : [...current, podId]));
  };

  const create = async (): Promise<void> => {
    const trimmed = name.trim();
    if (trimmed === '') {
      setError('Name is required');
      return;
    }
    const permissions = permissionsForPreset(preset, selectedPods);
    const parsed = safeParseApiKeyPermissions(permissions, selectedPods);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError('');
    setSaving(true);
    try {
      const created = await createDbApiKey(spaceId, trimmed, selectedPods, parsed.value);
      setSecret(created.secret);
      setPrompt(buildApiKeyAiSetupPrompt(window.location.origin));
      setName('');
      setSelectedPods([]);
      await load();
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
      await load();
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
        Keys act as you. An empty pod list can access every pod you can access. Choosing pods limits the key to those pods. The secret is shown once.
      </Text>
      <Stack gap={3} maxW="lg">
        <Field.Root required>
          <Field.Label>Name</Field.Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Permission preset</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={preset} onChange={(event) => setPreset(event.target.value as ApiKeyPresetId)}>
              {API_KEY_PRESET_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
        <Stack gap={2}>
          <Text fontWeight="medium">Pod allowlist</Text>
          <HStack gap={2} flexWrap="wrap">
            {pods.map((pod) => (
              <Button
                key={pod.id}
                size="sm"
                variant={selectedPods.includes(pod.id) ? 'solid' : 'outline'}
                colorPalette="brand"
                onClick={() => togglePod(pod.id)}
              >
                {pod.name ?? pod.feature}
              </Button>
            ))}
          </HStack>
        </Stack>
        <Button colorPalette="brand" alignSelf="start" loading={saving} onClick={() => void create()}>
          Create key
        </Button>
      </Stack>
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
