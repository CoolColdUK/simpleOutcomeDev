'use client';

import {Button, HStack, Input, Stack, Text} from '@chakra-ui/react';
import type {DbTpAttachment} from '@/lib/api/db/tp/loadDbTpWorkspace';
import createDbTpAttachment from '@/lib/api/db/tp/createDbTpAttachment';
import deleteDbTpAttachment from '@/lib/api/db/tp/deleteDbTpAttachment';
import getStorageTpAttachmentSignedUrl from '@/lib/api/storage/getStorageTpAttachmentSignedUrl';

export interface TripTpAttachmentPanelProps {
  readonly podId: string;
  readonly tripId: string;
  readonly userId: string;
  readonly canWrite: boolean;
  readonly parent: {transportId: string} | {destinationId: string};
  readonly attachments: readonly DbTpAttachment[];
  readonly onChanged: () => void;
  readonly onError: (message: string) => void;
}

export default function TripTpAttachmentPanel({
  podId,
  tripId,
  userId,
  canWrite,
  parent,
  attachments,
  onChanged,
  onError,
}: TripTpAttachmentPanelProps) {
  const filtered = attachments.filter((a) =>
    'transportId' in parent ? a.transportId === parent.transportId : a.destinationId === parent.destinationId,
  );

  const upload = async (file: File | undefined): Promise<void> => {
    if (file === undefined || userId === '') {
      return;
    }
    try {
      await createDbTpAttachment(podId, tripId, userId, parent, file);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const download = async (storagePath: string): Promise<void> => {
    try {
      const url = await getStorageTpAttachmentSignedUrl(storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const remove = async (row: DbTpAttachment): Promise<void> => {
    try {
      await deleteDbTpAttachment(row.id, row.storagePath);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={2}>
      <Text fontSize="sm" fontWeight="medium">Attachments</Text>
      {filtered.length === 0 ? <Text fontSize="sm" color="fg.muted">None</Text> : null}
      {filtered.map((a) => (
        <HStack key={a.id} justify="space-between">
          <Text fontSize="sm">{a.fileName}</Text>
          <HStack>
            <Button size="xs" variant="outline" onClick={() => void download(a.storagePath)}>Download</Button>
            {canWrite ? (
              <Button size="xs" variant="outline" colorPalette="red" onClick={() => void remove(a)}>Delete</Button>
            ) : null}
          </HStack>
        </HStack>
      ))}
      {canWrite ? (
        <Input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      ) : null}
    </Stack>
  );
}
