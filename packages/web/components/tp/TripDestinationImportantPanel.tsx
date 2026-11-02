'use client';

import {useState} from 'react';
import {Stack, Text, Textarea} from '@chakra-ui/react';
import type {DbTpAttachment, DbTpDestination} from '@/lib/api/db/tp/loadDbTpWorkspace';
import updateDbTpDestination from '@/lib/api/db/tp/updateDbTpDestination';
import deleteDbTpDestinationForBrowser from '@/lib/api/db/tp/deleteDbTpDestinationForBrowser';
import TripTpAttachmentPanel from '@/components/tp/TripTpAttachmentPanel';
import TripTpEditSaveBar from '@/components/tp/TripTpEditSaveBar';
import TripTpExpandableCard from '@/components/tp/TripTpExpandableCard';
import TripTpHeaderIconActions from '@/components/tp/TripTpHeaderIconActions';
import TripTpTruncateText from '@/components/tp/TripTpTruncateText';

export interface TripDestinationImportantPanelProps {
  readonly podId: string;
  readonly tripId: string;
  readonly userId: string;
  readonly destination: DbTpDestination;
  readonly attachments: readonly DbTpAttachment[];
  readonly canWrite: boolean;
  readonly tripLocked: boolean;
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
  tripLocked,
  onSaved,
  onError,
}: TripDestinationImportantPanelProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importantInfo, setImportantInfo] = useState('');
  const writeDisabled = !canWrite || tripLocked;
  const attachmentCount = attachments.filter((a) => a.destinationId === destination.id).length;
  const showAttachments = editing || attachmentCount > 0;

  const resetDraft = (): void => {
    setImportantInfo(destination.importantInfo ?? '');
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    try {
      await updateDbTpDestination(destination.id, {
        importantInfo: importantInfo === '' ? undefined : importantInfo,
      });
      await onSaved();
      setEditing(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = (): void => {
    const ok = window.confirm(`Delete destination “${destination.name}”? This cannot be undone.`);
    if (!ok) {
      return;
    }
    setBusy(true);
    void deleteDbTpDestinationForBrowser(destination.id)
      .then(onSaved)
      .catch((e) => onError(e instanceof Error ? e.message : String(e)))
      .finally(() => setBusy(false));
  };

  const dateSubtitle =
    destination.activeStartDate !== undefined
      ? `${destination.activeStartDate}–${destination.activeEndDate ?? '…'}`
      : undefined;

  return (
    <TripTpExpandableCard
      title={destination.name}
      subtitle={dateSubtitle}
      defaultExpanded={false}
      headerActions={
        canWrite ? (
          <TripTpHeaderIconActions
            editLabel={`Edit important info for ${destination.name}`}
            deleteLabel={`Delete destination ${destination.name}`}
            disabled={writeDisabled}
            onEdit={() => {
              resetDraft();
              setEditing(true);
            }}
            onDelete={remove}
          />
        ) : null
      }
      footer={
        <TripTpEditSaveBar
          editing={editing}
          canWrite={canWrite && !tripLocked}
          busy={busy}
          hideEditButton
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
      }
    >
      <Stack gap={2}>
        {editing && canWrite && !tripLocked ? (
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
        {showAttachments ? (
          <TripTpAttachmentPanel
            podId={podId}
            tripId={tripId}
            userId={userId}
            canWrite={canWrite && editing && !tripLocked}
            parent={{destinationId: destination.id}}
            attachments={attachments}
            onChanged={onSaved}
            onError={onError}
          />
        ) : null}
      </Stack>
    </TripTpExpandableCard>
  );
}
