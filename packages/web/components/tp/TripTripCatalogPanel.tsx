'use client';

import {useState} from 'react';
import {Button, Field, HStack, Input, NativeSelect, Stack, Text, Textarea} from '@chakra-ui/react';
import type {DbTpLocation, DbTpTransportLib} from '@/lib/api/db/tp/loadDbTpWorkspace';
import TripTpCollapsible from '@/components/tp/TripTpCollapsible';
import createDbTpLocation from '@/lib/api/db/tp/createDbTpLocation';
import updateDbTpLocation from '@/lib/api/db/tp/updateDbTpLocation';
import deleteDbTpLocation from '@/lib/api/db/tp/deleteDbTpLocation';
import createDbTpTransportLib from '@/lib/api/db/tp/createDbTpTransportLib';
import updateDbTpTransportLib from '@/lib/api/db/tp/updateDbTpTransportLib';
import deleteDbTpTransportLib from '@/lib/api/db/tp/deleteDbTpTransportLib';
import {TP_TRANSPORT_MODES} from '@/components/tp/tpTransportModes';

export interface TripTripCatalogPanelProps {
  readonly tripId: string;
  readonly locations: readonly DbTpLocation[];
  readonly transportLib: readonly DbTpTransportLib[];
  readonly defaultCurrency?: string;
  readonly canWrite: boolean;
  readonly onSaved: () => void;
  readonly onError: (message: string) => void;
}

export default function TripTripCatalogPanel({
  tripId,
  locations,
  transportLib,
  defaultCurrency,
  canWrite,
  onSaved,
  onError,
}: TripTripCatalogPanelProps) {
  const sortedLocations = [...locations].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedTransports = [...transportLib].sort((a, b) => a.sortOrder - b.sortOrder);

  const addLocation = async (): Promise<void> => {
    try {
      await createDbTpLocation({tripId, name: 'New location', sortOrder: sortedLocations.length});
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const addTransport = async (): Promise<void> => {
    try {
      await createDbTpTransportLib({
        tripId,
        label: 'Walk 5 min',
        mode: 'walk',
        durationMinutes: 5,
        sortOrder: sortedTransports.length,
        costCurrency: defaultCurrency,
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={4}>
      <TripTpCollapsible title={`Locations (${sortedLocations.length})`} defaultOpen={false}>
        <Stack gap={3} pt={2}>
          {sortedLocations.map((loc) => (
            <LocationRow
              key={loc.id}
              location={loc}
              canWrite={canWrite}
              onSaved={onSaved}
              onError={onError}
            />
          ))}
          {canWrite ? (
            <Button size="sm" variant="outline" onClick={() => void addLocation()}>
              + Location
            </Button>
          ) : null}
        </Stack>
      </TripTpCollapsible>
      <TripTpCollapsible title={`Transport library (${sortedTransports.length})`} defaultOpen={false}>
        <Stack gap={3} pt={2}>
          {sortedTransports.map((t) => (
            <TransportLibRow
              key={t.id}
              transport={t}
              locations={sortedLocations}
              defaultCurrency={defaultCurrency}
              canWrite={canWrite}
              onSaved={onSaved}
              onError={onError}
            />
          ))}
          {canWrite ? (
            <Button size="sm" variant="outline" onClick={() => void addTransport()}>
              + Transport
            </Button>
          ) : null}
        </Stack>
      </TripTpCollapsible>
    </Stack>
  );
}

interface LocationRowProps {
  readonly location: DbTpLocation;
  readonly canWrite: boolean;
  readonly onSaved: () => void;
  readonly onError: (message: string) => void;
}

function LocationRow({location, canWrite, onSaved, onError}: LocationRowProps) {
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address ?? '');
  const [mapsUrl, setMapsUrl] = useState(location.mapsUrl ?? '');
  const save = async (): Promise<void> => {
    try {
      await updateDbTpLocation(location.id, {
        name,
        address: address === '' ? null : address,
        mapsUrl: mapsUrl === '' ? null : mapsUrl,
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };
  const remove = async (): Promise<void> => {
    try {
      await deleteDbTpLocation(location.id);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <Stack gap={2} borderWidth="1px" borderRadius="md" p={3}>
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canWrite} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Address</Field.Label>
        <Textarea value={address} onChange={(e) => setAddress(e.target.value)} disabled={!canWrite} rows={2} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Maps URL</Field.Label>
        <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} disabled={!canWrite} />
      </Field.Root>
      {canWrite ? (
        <HStack>
          <Button size="sm" onClick={() => void save()}>Save</Button>
          <Button size="sm" variant="outline" colorPalette="red" onClick={() => void remove()}>Delete</Button>
        </HStack>
      ) : null}
    </Stack>
  );
}

interface TransportLibRowProps {
  readonly transport: DbTpTransportLib;
  readonly locations: readonly DbTpLocation[];
  readonly defaultCurrency?: string;
  readonly canWrite: boolean;
  readonly onSaved: () => void;
  readonly onError: (message: string) => void;
}

function TransportLibRow({transport, locations, defaultCurrency, canWrite, onSaved, onError}: TransportLibRowProps) {
  const [label, setLabel] = useState(transport.label);
  const [mode, setMode] = useState(transport.mode);
  const [duration, setDuration] = useState(transport.durationMinutes?.toString() ?? '');
  const [cost, setCost] = useState(transport.costAmount?.toString() ?? '');
  const [currency, setCurrency] = useState(transport.costCurrency ?? defaultCurrency ?? '');
  const [fromLocationId, setFromLocationId] = useState(transport.fromLocationId ?? '');
  const [toLocationId, setToLocationId] = useState(transport.toLocationId ?? '');
  const save = async (): Promise<void> => {
    try {
      await updateDbTpTransportLib(transport.id, {
        label,
        mode,
        durationMinutes: duration === '' ? null : Number(duration),
        costAmount: cost === '' ? null : Number(cost),
        costCurrency: currency === '' ? null : currency,
        fromLocationId: fromLocationId === '' ? null : fromLocationId,
        toLocationId: toLocationId === '' ? null : toLocationId,
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };
  const remove = async (): Promise<void> => {
    try {
      await deleteDbTpTransportLib(transport.id);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <Stack gap={2} borderWidth="1px" borderRadius="md" p={3}>
      <Field.Root>
        <Field.Label>Label</Field.Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} disabled={!canWrite} />
      </Field.Root>
      <HStack align="flex-end" wrap="wrap">
        <Field.Root flex="1" minW="8rem">
          <Field.Label>Mode</Field.Label>
          <NativeSelect.Root disabled={!canWrite}>
            <NativeSelect.Field value={mode} onChange={(e) => setMode(e.target.value)}>
              {TP_TRANSPORT_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root flex="1" minW="6rem">
          <Field.Label>Duration (min)</Field.Label>
          <Input value={duration} onChange={(e) => setDuration(e.target.value)} disabled={!canWrite} />
        </Field.Root>
        <Field.Root flex="1" minW="6rem">
          <Field.Label>Price</Field.Label>
          <Input value={cost} onChange={(e) => setCost(e.target.value)} disabled={!canWrite} />
        </Field.Root>
        <Field.Root flex="1" minW="4rem">
          <Field.Label>Cur.</Field.Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!canWrite} />
        </Field.Root>
      </HStack>
      <HStack wrap="wrap">
        <Field.Root flex="1" minW="10rem">
          <Field.Label>From location</Field.Label>
          <NativeSelect.Root disabled={!canWrite}>
            <NativeSelect.Field value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)}>
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root flex="1" minW="10rem">
          <Field.Label>To location</Field.Label>
          <NativeSelect.Root disabled={!canWrite}>
            <NativeSelect.Field value={toLocationId} onChange={(e) => setToLocationId(e.target.value)}>
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
      </HStack>
      {canWrite ? (
        <HStack>
          <Button size="sm" onClick={() => void save()}>Save</Button>
          <Button size="sm" variant="outline" colorPalette="red" onClick={() => void remove()}>Delete</Button>
        </HStack>
      ) : null}
    </Stack>
  );
}
