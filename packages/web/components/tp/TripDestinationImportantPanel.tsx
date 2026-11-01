'use client';

import {useEffect, useState} from 'react';
import {Stack, Text, Textarea} from '@chakra-ui/react';
import type {DbTpAttachment, DbTpDestination} from '@/lib/api/db/tp/loadDbTpWorkspace';
import updateDbTpDestination from '@/lib/api/db/tp/updateDbTpDestination';
import TripTpAttachmentPanel from '@/components/tp/TripTpAttachmentPanel';
import TripTpEditSaveBar from '@/components/tp/TripTpEditSaveBar';
import TripTpTruncateText from '@/components/tp/TripTpTruncateText';

export interface TripDestinationImportantPanelProps {
  readonly podId: string;
  readonly tripId: string;
  readonly userId: string;
  readonly destination: DbTpDestination;
  readonly attachments: readonly DbTpAttachment[];
  readonly canWrite: boolean;
  readonly onSaved: () => void | Promise<void>;
  readonly onError: (message: string) => void;
}

export default function TripDestinationImportantPanel({
  podId,
  tripId,
  userId,
  destination,
  attachments,
  canWrite,
  onSaved,
  onError,
}: TripDestinationImportantPanelProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importantInfo, setImportantInfo] = useState(destination.importantInfo ?? '');

  const resetDraft = (): void => {
    setImportantInfo(destination.importantInfo ?? '');
  };

  useEffect(() => {
    setImportantInfo(destination.importantInfo ?? '');
  }, [destination.importantInfo]);

  useEffect(() => {
    setEditing(false);
  }, [destination.id]);

  const save = async (): Promise<void> => {
    setBusy(true);
    try {
      await updateDbTpDestination(destination.id, {importantInfo: importantInfo === '' ? null : importantInfo});
      await onSaved();
      setEditing(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap={2}>
      <Text fontWeight="medium">
        {destination.name}
        {destination.activeStartDate !== undefined
          ? ` · ${destination.activeStartDate}–${destination.activeEndDate ?? '…'}`
          : ''}
      </Text>
      {editing && canWrite ? (
        <Textarea
          placeholder="Important / safety info (markdown)"
          value={importantInfo}
          onChange={(e) => setImportantInfo(e.target.value)}
          rows={4}
        />
      ) : (destination.importantInfo ?? '').trim() === '' ? (
        <Text color="fg.muted" fontSize="sm">
          No important info yet.
        </Text>
      ) : (
        <TripTpTruncateText lineClamp={8} whiteSpace="pre-wrap">
          {destination.importantInfo}
        </TripTpTruncateText>
      )}
      <TripTpEditSaveBar
        editing={editing}
        canWrite={canWrite}
        busy={busy}
        onEdit={() => {
          resetDraft();
          setEditing(true);
        }}
        onSave={() => void save()}
        onCancel={() => {
          resetDraft();
          setEditing(false);
        }}
      />
      <TripTpAttachmentPanel
        podId={podId}
        tripId={tripId}
        userId={userId}
        canWrite={canWrite && editing}
        parent={{destinationId: destination.id}}
        attachments={attachments}
        onChanged={onSaved}
        onError={onError}
      />
    </Stack>
  );
}
