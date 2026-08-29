'use client';

import {Button, Stack, Text} from '@chakra-ui/react';
import {PodStatus} from '@so/model';
import type {DbPod} from '@/lib/api/db/listDbPods';
import PodEditDialog from '@/components/app/PodEditDialog';
import {useState} from 'react';

export interface PodWorkspaceSettingsTabProps {
  readonly pod: DbPod;
  readonly canManage: boolean;
  readonly isSpaceOwner: boolean;
  readonly onArchive: () => void;
  readonly onDelete: () => void;
  readonly onSaved: () => void;
}

export default function PodWorkspaceSettingsTab({
  pod,
  canManage,
  isSpaceOwner,
  onArchive,
  onDelete,
  onSaved,
}: PodWorkspaceSettingsTabProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Stack gap={4} align="start">
      {canManage ? (
        <Button variant="outline" colorPalette="brand" onClick={() => setEditOpen(true)}>
          Edit title and description
        </Button>
      ) : (
        <Text color="fg.muted">Only pod owners and space owners can change settings.</Text>
      )}
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
      <PodEditDialog open={editOpen} pod={pod} onClose={() => setEditOpen(false)} onSaved={onSaved} />
    </Stack>
  );
}
