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
import TripTpCountrySelect from '@/components/tp/TripTpCountrySelect';
import TripTpMoneyField from '@/components/tp/TripTpMoneyField';
import {TP_LOCATION_TYPES, tpLocationTypeLabel} from '@so/model';

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
        label: 'New transport',
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
  const [notes, setNotes] = useState(location.notes ?? '');
  const [openTime, setOpenTime] = useState(location.openTime?.slice(0, 5) ?? '');
  const [closeTime, setCloseTime] = useState(location.closeTime?.slice(0, 5) ?? '');
  const [website, setWebsite] = useState(location.website ?? '');
  const [email, setEmail] = useState(location.email ?? '');
  const [phone, setPhone] = useState(location.phone ?? '');
  const [country, setCountry] = useState(location.country ?? '');
  const [locationType, setLocationType] = useState(location.locationType);
  const save = async (): Promise<void> => {
    try {
      await updateDbTpLocation(location.id, {
        name,
        address: address === '' ? null : address,
        mapsUrl: mapsUrl === '' ? null : mapsUrl,
        notes: notes === '' ? null : notes,
        openTime: openTime === '' ? null : openTime,
        closeTime: closeTime === '' ? null : closeTime,
        website: website === '' ? null : website,
        email: email === '' ? null : email,
        phone: phone === '' ? null : phone,
        country: country === '' ? null : country,
        locationType,
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
        <Field.Label>Type</Field.Label>
        <NativeSelect.Root disabled={!canWrite}>
          <NativeSelect.Field value={locationType} onChange={(e) => setLocationType(e.target.value)}>
            {TP_LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>{tpLocationTypeLabel(t)}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
      <TripTpCountrySelect value={country} disabled={!canWrite} onChange={setCountry} />
      <Field.Root>
        <Field.Label>Address</Field.Label>
        <Textarea value={address} onChange={(e) => setAddress(e.target.value)} disabled={!canWrite} rows={2} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Maps URL</Field.Label>
        <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} disabled={!canWrite} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Notes (e.g. Tags: food, walk)</Field.Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canWrite} rows={2} />
      </Field.Root>
      <HStack wrap="wrap">
        <Field.Root>
          <Field.Label>Open</Field.Label>
          <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} disabled={!canWrite} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Close</Field.Label>
          <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} disabled={!canWrite} />
        </Field.Root>
      </HStack>
      <Field.Root>
        <Field.Label>Website</Field.Label>
        <Input value={website} onChange={(e) => setWebsite(e.target.value)} disabled={!canWrite} />
      </Field.Root>
      <HStack wrap="wrap">
        <Field.Root flex="1">
          <Field.Label>Email</Field.Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canWrite} />
        </Field.Root>
        <Field.Root flex="1">
          <Field.Label>Phone</Field.Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canWrite} />
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
  const [mode, setMode] = useState(transport.mode ?? '');
  const [duration, setDuration] = useState(transport.durationMinutes?.toString() ?? '');
  const [cost, setCost] = useState(transport.costAmount?.toString() ?? '');
  const [currency, setCurrency] = useState(transport.costCurrency ?? defaultCurrency ?? '');
  const [fromLocationId, setFromLocationId] = useState(transport.fromLocationId ?? '');
  const [toLocationId, setToLocationId] = useState(transport.toLocationId ?? '');
  const save = async (): Promise<void> => {
    try {
      await updateDbTpTransportLib(transport.id, {
        label,
        mode: mode === '' ? null : mode,
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
      <Field.Root>
        <Field.Label>Mode (optional)</Field.Label>
        <Input
          value={mode}
          placeholder="e.g. walk, bus 123"
          onChange={(e) => setMode(e.target.value)}
          disabled={!canWrite}
        />
      </Field.Root>
      <HStack align="flex-end" wrap="wrap">
        <Field.Root flex="1" minW="6rem">
          <Field.Label>Duration (min)</Field.Label>
          <Input value={duration} onChange={(e) => setDuration(e.target.value)} disabled={!canWrite} />
        </Field.Root>
      </HStack>
      <TripTpMoneyField
        amountLabel="Price"
        amount={cost}
        currency={currency}
        disabled={!canWrite}
        onChange={({amount, currency: nextCurrency}) => {
          setCost(amount);
          setCurrency(nextCurrency);
        }}
      />
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
