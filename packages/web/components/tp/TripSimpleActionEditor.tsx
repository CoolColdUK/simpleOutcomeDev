'use client';

import {useState} from 'react';
import {Button, Field, HStack, Input, Stack, Text, Textarea} from '@chakra-ui/react';
import type {DbTpAction} from '@/lib/api/db/tp/loadDbTpWorkspace';
import updateDbTpAction from '@/lib/api/db/tp/updateDbTpAction';

export interface TripSimpleActionEditorProps {
  readonly action: DbTpAction;
  readonly defaultCurrency?: string;
  readonly canWrite: boolean;
  readonly onSaved: () => void;
  readonly onError: (message: string) => void;
}

export default function TripSimpleActionEditor({action, defaultCurrency, canWrite, onSaved, onError}: TripSimpleActionEditorProps) {
  const [title, setTitle] = useState(action.title);
  const [notes, setNotes] = useState(action.notes ?? '');
  const [placeText, setPlaceText] = useState(action.placeText ?? '');
  const [mapsUrl, setMapsUrl] = useState(action.mapsUrl ?? '');
  const [cost, setCost] = useState(action.costAmount?.toString() ?? '');
  const [currency, setCurrency] = useState(action.costCurrency ?? defaultCurrency ?? '');

  const save = async (): Promise<void> => {
    try {
      await updateDbTpAction(action.id, {
        title,
        notes,
        placeText,
        mapsUrl: mapsUrl === '' ? null : mapsUrl,
        costAmount: cost === '' ? null : Number(cost),
        costCurrency: currency === '' ? null : currency,
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!canWrite) {
    return (
      <Stack gap={1} fontSize="sm">
        {action.placeText !== undefined ? <Text>{action.placeText}</Text> : null}
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
      <Field.Root>
        <Field.Label>Place</Field.Label>
        <Input value={placeText} onChange={(e) => setPlaceText(e.target.value)} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Maps URL</Field.Label>
        <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
      </Field.Root>
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
