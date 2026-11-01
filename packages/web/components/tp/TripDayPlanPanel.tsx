'use client';

import {useEffect, useState} from 'react';
import {Box, Field, Heading, Input, NativeSelect, Stack, Text, Textarea} from '@chakra-ui/react';
import type {DbTpDay, DbTpDestination} from '@/lib/api/db/tp/loadDbTpWorkspace';
import updateDbTpDay from '@/lib/api/db/tp/updateDbTpDay';
import TripTpEditSaveBar from '@/components/tp/TripTpEditSaveBar';
import TripTpTruncateText from '@/components/tp/TripTpTruncateText';

export interface TripDayPlanPanelProps {
  readonly day: DbTpDay;
  readonly destinations: readonly DbTpDestination[];
  readonly canWrite: boolean;
  readonly onSaved: () => void | Promise<void>;
  readonly onError: (message: string) => void;
}

function primaryDestinationLabel(
  primaryDestinationId: string | undefined,
  destinations: readonly DbTpDestination[],
): string {
  if (primaryDestinationId === undefined) {
    return 'Auto from stay / travel';
  }
  return destinations.find((d) => d.id === primaryDestinationId)?.name ?? 'Unknown destination';
}

export default function TripDayPlanPanel({day, destinations, canWrite, onSaved, onError}: TripDayPlanPanelProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dayTitle, setDayTitle] = useState(day.dayTitle ?? '');
  const [dayNotes, setDayNotes] = useState(day.dayNotes ?? '');
  const [primaryDestinationId, setPrimaryDestinationId] = useState(day.primaryDestinationId ?? '');

  const resetDraft = (): void => {
    setDayTitle(day.dayTitle ?? '');
    setDayNotes(day.dayNotes ?? '');
    setPrimaryDestinationId(day.primaryDestinationId ?? '');
  };

  useEffect(() => {
    setDayTitle(day.dayTitle ?? '');
    setDayNotes(day.dayNotes ?? '');
    setPrimaryDestinationId(day.primaryDestinationId ?? '');
  }, [day.dayTitle, day.dayNotes, day.primaryDestinationId]);

  useEffect(() => {
    setEditing(false);
  }, [day.id]);

  const startEdit = (): void => {
    resetDraft();
    setEditing(true);
  };

  const cancelEdit = (): void => {
    resetDraft();
    setEditing(false);
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    try {
      await updateDbTpDay(day.id, {
        dayTitle: dayTitle === '' ? null : dayTitle,
        dayNotes: dayNotes === '' ? null : dayNotes,
        primaryDestinationId: primaryDestinationId === '' ? null : primaryDestinationId,
      });
      await onSaved();
      setEditing(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const primaryLabel = primaryDestinationLabel(day.primaryDestinationId, destinations);

  return (
    <Box borderWidth="1px" borderRadius="md" p={4}>
      <Heading size="sm" mb={2}>
        Day plan
      </Heading>
      {editing && canWrite ? (
        <Stack gap={2}>
          <Field.Root>
            <Field.Label>Day title</Field.Label>
            <Input placeholder="Day title" value={dayTitle} onChange={(e) => setDayTitle(e.target.value)} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Day notes</Field.Label>
            <Textarea
              placeholder="Rough plan for this day"
              value={dayNotes}
              onChange={(e) => setDayNotes(e.target.value)}
              rows={3}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Primary destination (override)</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field value={primaryDestinationId} onChange={(e) => setPrimaryDestinationId(e.target.value)}>
                <option value="">Auto from stay / travel</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Field.Root>
        </Stack>
      ) : (
        <Stack gap={2} fontSize="sm">
          <Stack gap={0}>
            <Text fontWeight="medium">Day title</Text>
            {(day.dayTitle ?? '').trim() === '' ? (
              <Text color="fg.muted">No title</Text>
            ) : (
              <Text>{day.dayTitle}</Text>
            )}
          </Stack>
          <Stack gap={0}>
            <Text fontWeight="medium">Day notes</Text>
            {(day.dayNotes ?? '').trim() === '' ? (
              <Text color="fg.muted">No notes for this day yet.</Text>
            ) : (
              <TripTpTruncateText whiteSpace="pre-wrap">{day.dayNotes}</TripTpTruncateText>
            )}
          </Stack>
          <Stack gap={0}>
            <Text fontWeight="medium">Primary destination</Text>
            <Text>{primaryLabel}</Text>
          </Stack>
        </Stack>
      )}
      <Box pt={3}>
        <TripTpEditSaveBar
          editing={editing}
          canWrite={canWrite}
          busy={busy}
          onEdit={startEdit}
          onSave={() => void save()}
          onCancel={cancelEdit}
        />
      </Box>
    </Box>
  );
}
