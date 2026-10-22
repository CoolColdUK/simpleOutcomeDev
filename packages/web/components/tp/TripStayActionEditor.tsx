'use client';

import {useState} from 'react';
import {Button, Field, HStack, Input, NativeSelect, Stack, Text, Textarea} from '@chakra-ui/react';
import type {DbTpAction, DbTpDestination} from '@/lib/api/db/tp/loadDbTpWorkspace';
import updateDbTpAction from '@/lib/api/db/tp/updateDbTpAction';
import {tpInstantFromParts, tpPartsFromInstant} from '@/lib/tp/tpDateTimeParts';

export interface TripStayActionEditorProps {
  readonly action: DbTpAction;
  readonly destinations: readonly DbTpDestination[];
  readonly tripTimezone: string;
  readonly defaultCurrency?: string;
  readonly canWrite: boolean;
  readonly onSaved: () => void;
  readonly onError: (message: string) => void;
}

export default function TripStayActionEditor({
  action,
  destinations,
  tripTimezone,
  defaultCurrency,
  canWrite,
  onSaved,
  onError,
}: TripStayActionEditorProps) {
  const checkInTz = action.checkInTimezone ?? tripTimezone;
  const checkOutTz = action.checkOutTimezone ?? tripTimezone;
  const [title, setTitle] = useState(action.title);
  const [placeText, setPlaceText] = useState(action.placeText ?? '');
  const [mapsUrl, setMapsUrl] = useState(action.mapsUrl ?? '');
  const [destinationId, setDestinationId] = useState(action.destinationId ?? '');
  const [checkInTzState, setCheckInTzState] = useState(checkInTz);
  const [checkOutTzState, setCheckOutTzState] = useState(checkOutTz);
  const checkInParts = tpPartsFromInstant(action.checkInAt, checkInTzState);
  const checkOutParts = tpPartsFromInstant(action.checkOutAt, checkOutTzState);
  const [checkInDate, setCheckInDate] = useState(checkInParts.date);
  const [checkInTime, setCheckInTime] = useState(checkInParts.time);
  const [checkOutDate, setCheckOutDate] = useState(checkOutParts.date);
  const [checkOutTime, setCheckOutTime] = useState(checkOutParts.time);
  const [cost, setCost] = useState(action.costAmount?.toString() ?? '');
  const [currency, setCurrency] = useState(action.costCurrency ?? defaultCurrency ?? '');
  const [notes, setNotes] = useState(action.notes ?? '');

  const save = async (): Promise<void> => {
    try {
      await updateDbTpAction(action.id, {
        title,
        placeText,
        mapsUrl: mapsUrl === '' ? null : mapsUrl,
        destinationId: destinationId === '' ? null : destinationId,
        checkInAt: tpInstantFromParts(checkInDate, checkInTime, checkInTzState) ?? null,
        checkOutAt: tpInstantFromParts(checkOutDate, checkOutTime, checkOutTzState) ?? null,
        checkInTimezone: checkInTzState,
        checkOutTimezone: checkOutTzState,
        costAmount: cost === '' ? null : Number(cost),
        costCurrency: currency === '' ? null : currency,
        notes,
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!canWrite) {
    return (
      <Text fontSize="sm">
        {action.placeText ?? action.title}
        {action.checkInAt !== undefined ? ` · ${action.checkInAt} → ${action.checkOutAt ?? '?'}` : ''}
      </Text>
    );
  }

  return (
    <Stack gap={2}>
      <Field.Root>
        <Field.Label>Title</Field.Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Property / place</Field.Label>
        <Input value={placeText} onChange={(e) => setPlaceText(e.target.value)} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Maps URL</Field.Label>
        <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Destination</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
            <option value="">—</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
      <Text fontSize="sm" fontWeight="medium">Check-in</Text>
      <HStack wrap="wrap">
        <Input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
        <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
        <Input placeholder="IANA tz" value={checkInTzState} onChange={(e) => setCheckInTzState(e.target.value)} width="10rem" />
      </HStack>
      <Text fontSize="sm" fontWeight="medium">Check-out</Text>
      <HStack wrap="wrap">
        <Input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
        <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
        <Input placeholder="IANA tz" value={checkOutTzState} onChange={(e) => setCheckOutTzState(e.target.value)} width="10rem" />
      </HStack>
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
      <Field.Root>
        <Field.Label>Notes</Field.Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field.Root>
      <Button size="sm" colorPalette="brand" onClick={() => void save()}>Save stay</Button>
    </Stack>
  );
}
