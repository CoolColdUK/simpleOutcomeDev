'use client';

import {useMemo, useState} from 'react';
import {Button, Field, HStack, Input, NativeSelect, Stack, Text} from '@chakra-ui/react';
import type {DbTpAction, DbTpActionLocation, DbTpLocation} from '@/lib/api/db/tp/loadDbTpWorkspace';
import updateDbTpAction from '@/lib/api/db/tp/updateDbTpAction';
import createDbTpActionLocation from '@/lib/api/db/tp/createDbTpActionLocation';
import deleteDbTpActionLocation from '@/lib/api/db/tp/deleteDbTpActionLocation';
import createDbTpLocation from '@/lib/api/db/tp/createDbTpLocation';

export interface TripActivityActionEditorProps {
  readonly action: DbTpAction;
  readonly tripId: string;
  readonly locations: readonly DbTpLocation[];
  readonly actionLocations: readonly DbTpActionLocation[];
  readonly defaultCurrency?: string;
  readonly canWrite: boolean;
  readonly onSaved: () => void;
  readonly onError: (message: string) => void;
}

function trimTime(t: string | undefined): string {
  if (t === undefined) {
    return '';
  }
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export default function TripActivityActionEditor({
  action,
  tripId,
  locations,
  actionLocations,
  defaultCurrency,
  canWrite,
  onSaved,
  onError,
}: TripActivityActionEditorProps) {
  const [title, setTitle] = useState(action.title);
  const [notes, setNotes] = useState(action.notes ?? '');
  const [startTime, setStartTime] = useState(trimTime(action.startTime));
  const [endTime, setEndTime] = useState(trimTime(action.endTime));
  const [cost, setCost] = useState(action.costAmount?.toString() ?? '');
  const [currency, setCurrency] = useState(action.costCurrency ?? defaultCurrency ?? '');
  const links = useMemo(
    () =>
      [...actionLocations]
        .filter((l) => l.actionId === action.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [actionLocations, action.id],
  );
  const save = async (): Promise<void> => {
    try {
      await updateDbTpAction(action.id, {
        title,
        notes,
        startTime: startTime === '' ? null : startTime,
        endTime: endTime === '' ? null : endTime,
        costAmount: cost === '' ? null : Number(cost),
        costCurrency: currency === '' ? null : currency,
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const linkLocation = async (locationId: string): Promise<void> => {
    if (locationId === '') {
      return;
    }
    try {
      await createDbTpActionLocation({actionId: action.id, locationId, sortOrder: links.length});
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const unlink = async (linkId: string): Promise<void> => {
    try {
      await deleteDbTpActionLocation(linkId);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const quickAddLocation = async (): Promise<void> => {
    try {
      const id = await createDbTpLocation({tripId, name: 'New location', sortOrder: locations.length});
      await createDbTpActionLocation({actionId: action.id, locationId: id, sortOrder: links.length});
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={4}>
      <Field.Root>
        <Field.Label>Title</Field.Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canWrite} />
      </Field.Root>
      <HStack wrap="wrap">
        <Field.Root>
          <Field.Label>Start</Field.Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={!canWrite} />
        </Field.Root>
        <Field.Root>
          <Field.Label>End</Field.Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!canWrite} />
        </Field.Root>
      </HStack>
      <HStack wrap="wrap">
        <Field.Root>
          <Field.Label>Activity cost</Field.Label>
          <Input value={cost} onChange={(e) => setCost(e.target.value)} disabled={!canWrite} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Currency</Field.Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!canWrite} />
        </Field.Root>
      </HStack>
      <Field.Root>
        <Field.Label>Notes</Field.Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canWrite} />
      </Field.Root>
      <Stack gap={2}>
        <Text fontWeight="medium">Locations</Text>
        {links.map((link) => {
          const loc = locations.find((l) => l.id === link.locationId);
          if (loc === undefined) {
            return null;
          }
          return (
            <HStack key={link.id} justify="space-between">
              <Text>{loc.name}{loc.address !== undefined && loc.address !== '' ? ` — ${loc.address}` : ''}</Text>
              {canWrite ? (
                <Button size="xs" variant="outline" onClick={() => void unlink(link.id)}>Remove</Button>
              ) : null}
            </HStack>
          );
        })}
        {canWrite ? (
          <HStack wrap="wrap">
            <Field.Root flex="1" minW="12rem">
              <Field.Label>Add location</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value=""
                  onChange={(e) => void linkLocation(e.target.value)}
                >
                  <option value="">Select…</option>
                  {locations
                    .filter((l) => !links.some((link) => link.locationId === l.id))
                    .map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Button size="sm" variant="outline" onClick={() => void quickAddLocation()}>+ New location</Button>
          </HStack>
        ) : null}
      </Stack>
      {canWrite ? (
        <Button colorPalette="brand" onClick={() => void save()}>Save activity</Button>
      ) : null}
    </Stack>
  );
}
