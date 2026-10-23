'use client';

import {useState} from 'react';
import {Button, Field, HStack, Input, Stack, Text, Textarea} from '@chakra-ui/react';
import type {DbTpAction, DbTpActivityPlace} from '@/lib/api/db/tp/loadDbTpWorkspace';
import updateDbTpAction from '@/lib/api/db/tp/updateDbTpAction';
import createDbTpActivityPlace from '@/lib/api/db/tp/createDbTpActivityPlace';
import updateDbTpActivityPlace from '@/lib/api/db/tp/updateDbTpActivityPlace';
import deleteDbTpActivityPlace from '@/lib/api/db/tp/deleteDbTpActivityPlace';

export interface TripActivityActionEditorProps {
  readonly action: DbTpAction;
  readonly places: readonly DbTpActivityPlace[];
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
  places,
  defaultCurrency,
  canWrite,
  onSaved,
  onError,
}: TripActivityActionEditorProps) {
  const [title, setTitle] = useState(action.title);
  const [notes, setNotes] = useState(action.notes ?? '');
  const [placeText, setPlaceText] = useState(action.placeText ?? '');
  const [mapsUrl, setMapsUrl] = useState(action.mapsUrl ?? '');
  const [startTime, setStartTime] = useState(trimTime(action.startTime));
  const [endTime, setEndTime] = useState(trimTime(action.endTime));
  const [cost, setCost] = useState(action.costAmount?.toString() ?? '');
  const [currency, setCurrency] = useState(action.costCurrency ?? defaultCurrency ?? '');
  const sortedPlaces = [...places].sort((a, b) => a.sortOrder - b.sortOrder);
  const useChildPlaces = sortedPlaces.length > 0;

  const save = async (): Promise<void> => {
    try {
      await updateDbTpAction(action.id, {
        title,
        notes,
        placeText: useChildPlaces ? action.placeText : placeText,
        mapsUrl: useChildPlaces ? action.mapsUrl : mapsUrl === '' ? null : mapsUrl,
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

  const addPlace = async (): Promise<void> => {
    try {
      if (!useChildPlaces && placeText.trim() !== '') {
        await createDbTpActivityPlace({
          actionId: action.id,
          placeText: placeText.trim(),
          mapsUrl: mapsUrl === '' ? undefined : mapsUrl,
          sortOrder: 0,
        });
      }
      await createDbTpActivityPlace({
        actionId: action.id,
        placeText: 'New place',
        sortOrder: sortedPlaces.length + (useChildPlaces ? 0 : placeText.trim() !== '' ? 1 : 0),
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const savePlace = async (place: DbTpActivityPlace, draft: {placeText: string; mapsUrl: string; notes: string}): Promise<void> => {
    try {
      await updateDbTpActivityPlace(place.id, {
        placeText: draft.placeText,
        mapsUrl: draft.mapsUrl === '' ? null : draft.mapsUrl,
        notes: draft.notes === '' ? null : draft.notes,
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const removePlace = async (placeId: string): Promise<void> => {
    try {
      await deleteDbTpActivityPlace(placeId);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!canWrite) {
    return (
      <Stack gap={1} fontSize="sm">
        {startTime !== '' || endTime !== '' ? <Text>{startTime}–{endTime}</Text> : null}
        {useChildPlaces
          ? sortedPlaces.map((p) => <Text key={p.id}>{p.placeText}</Text>)
          : action.placeText !== undefined ? <Text>{action.placeText}</Text> : null}
        {action.notes !== undefined ? <Text whiteSpace="pre-wrap">{action.notes}</Text> : null}
      </Stack>
    );
  }

  return (
    <Stack gap={2}>
      <Field.Root>
        <Field.Label>Title</Field.Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field.Root>
      <HStack>
        <Field.Root>
          <Field.Label>Start</Field.Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>End</Field.Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field.Root>
      </HStack>
      {useChildPlaces ? (
        <Stack gap={2}>
          <HStack justify="space-between">
            <Text fontWeight="medium">Places</Text>
            <Button size="xs" onClick={() => void addPlace()}>+ Place</Button>
          </HStack>
          {sortedPlaces.map((place) => (
            <PlaceRow key={place.id} place={place} onSave={savePlace} onRemove={() => void removePlace(place.id)} />
          ))}
        </Stack>
      ) : (
        <Stack gap={2}>
          <Field.Root>
            <Field.Label>Place</Field.Label>
            <Input value={placeText} onChange={(e) => setPlaceText(e.target.value)} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Maps URL</Field.Label>
            <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
          </Field.Root>
          <Button size="xs" alignSelf="flex-start" onClick={() => void addPlace()}>+ Another place</Button>
        </Stack>
      )}
      <Field.Root>
        <Field.Label>Notes</Field.Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </Field.Root>
      <HStack>
        <Field.Root>
          <Field.Label>Cost</Field.Label>
          <Input value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Currency</Field.Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </Field.Root>
      </HStack>
      <Button size="sm" colorPalette="brand" onClick={() => void save()}>Save</Button>
    </Stack>
  );
}

function PlaceRow({
  place,
  onSave,
  onRemove,
}: {
  readonly place: DbTpActivityPlace;
  readonly onSave: (place: DbTpActivityPlace, draft: {placeText: string; mapsUrl: string; notes: string}) => Promise<void>;
  readonly onRemove: () => void;
}) {
  const [placeText, setPlaceText] = useState(place.placeText);
  const [mapsUrl, setMapsUrl] = useState(place.mapsUrl ?? '');
  const [notes, setNotes] = useState(place.notes ?? '');
  return (
    <Stack gap={1} pl={2} borderLeftWidth="2px">
      <Input value={placeText} onChange={(e) => setPlaceText(e.target.value)} placeholder="Place name" />
      <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="Maps URL" size="sm" />
      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" size="sm" />
      <HStack>
        <Button size="xs" colorPalette="brand" onClick={() => void onSave(place, {placeText, mapsUrl, notes})}>Save place</Button>
        <Button size="xs" variant="outline" colorPalette="red" onClick={onRemove}>Remove</Button>
      </HStack>
    </Stack>
  );
}
