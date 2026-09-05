'use client';

import {useEffect, useState} from 'react';
import {Alert, Button, Field, Input, Stack, Text, Textarea} from '@chakra-ui/react';
import {FeatureKind, fpCan, FpAction, FpResource, PodRole, PodStatus} from '@so/model';
import type {DbPod} from '@/lib/api/db/listDbPods';
import updateDbPod from '@/lib/api/db/updateDbPod';
import getDbFpSetting from '@/lib/api/db/getDbFpSetting';
import type {DbFpSetting} from '@/lib/api/db/mapDbFpSetting';
import FpSettingsPanel from '@/components/fp/FpSettingsPanel';

export interface PodWorkspaceSettingsTabProps {
  readonly pod: DbPod;
  readonly canManage: boolean;
  readonly isSpaceOwner: boolean;
  readonly podRole: PodRole | undefined;
  readonly onArchive: () => void;
  readonly onDelete: () => void;
  readonly onSaved: () => void;
}

export default function PodWorkspaceSettingsTab({
  pod,
  canManage,
  isSpaceOwner,
  podRole,
  onArchive,
  onDelete,
  onSaved,
}: PodWorkspaceSettingsTabProps) {
  const [name, setName] = useState(pod.name ?? '');
  const [description, setDescription] = useState(pod.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fpSetting, setFpSetting] = useState<DbFpSetting | undefined>(undefined);

  useEffect(() => {
    if (pod.feature !== FeatureKind.FINANCIAL_PLANNING) {
      return;
    }
    void getDbFpSetting(pod.id).then(setFpSetting);
  }, [pod.feature, pod.id]);

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
    <Stack gap={4} align="start" maxW="3xl">
      {canManage ? (
        <Stack gap={3} w="full" maxW="md">
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
      {fpSetting !== undefined ? (
        <FpSettingsPanel
          podId={pod.id}
          setting={fpSetting}
          canUpdateSettings={fpCan(podRole, isSpaceOwner, fpSetting.permission, FpResource.SETTINGS, FpAction.UPDATE)}
          canDeleteAll={fpCan(podRole, isSpaceOwner, fpSetting.permission, FpResource.DELETE_ALL, FpAction.CREATE)}
          onSaved={() => {
            void getDbFpSetting(pod.id).then(setFpSetting);
            onSaved();
          }}
        />
      ) : null}
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
