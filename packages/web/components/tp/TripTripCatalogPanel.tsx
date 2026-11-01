'use client';

import {useState} from 'react';
import {Button, Checkbox, Field, HStack, Input, NativeSelect, Stack, Text, Textarea} from '@chakra-ui/react';
import type {DbTpLocation, DbTpTransportLib} from '@/lib/api/db/tp/loadDbTpWorkspace';
import TripTpCollapsible from '@/components/tp/TripTpCollapsible';
import createDbTpLocation from '@/lib/api/db/tp/createDbTpLocation';
import updateDbTpLocation from '@/lib/api/db/tp/updateDbTpLocation';
import deleteDbTpLocation from '@/lib/api/db/tp/deleteDbTpLocation';
import createDbTpTransportLib from '@/lib/api/db/tp/createDbTpTransportLib';
import updateDbTpTransportLib from '@/lib/api/db/tp/updateDbTpTransportLib';
import deleteDbTpTransportLib from '@/lib/api/db/tp/deleteDbTpTransportLib';
import TripTpCountrySelect from '@/components/tp/TripTpCountrySelect';
import TripTpEditSaveBar from '@/components/tp/TripTpEditSaveBar';
import TripTpMoneyField from '@/components/tp/TripTpMoneyField';
import TripTpTruncateText from '@/components/tp/TripTpTruncateText';
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
  const [editLocationId, setEditLocationId] = useState<string | undefined>(undefined);
  const [editTransportId, setEditTransportId] = useState<string | undefined>(undefined);

  const addLocation = async (): Promise<void> => {
    try {
      const id = await createDbTpLocation({tripId, name: 'New location', sortOrder: sortedLocations.length});
      setEditLocationId(id);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const addTransport = async (): Promise<void> => {
    try {
      const id = await createDbTpTransportLib({
        tripId,
        label: 'New transport',
        sortOrder: sortedTransports.length,
        costCurrency: defaultCurrency,
      });
      setEditTransportId(id);
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
              key={`${loc.id}:${editLocationId === loc.id}`}
              location={loc}
              canWrite={canWrite}
              initialEditing={editLocationId === loc.id}
              onEditingChange={(editing) => setEditLocationId(editing ? loc.id : undefined)}
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
              key={`${t.id}:${editTransportId === t.id}`}
              transport={t}
              locations={sortedLocations}
              defaultCurrency={defaultCurrency}
              canWrite={canWrite}
              initialEditing={editTransportId === t.id}
              onEditingChange={(editing) => setEditTransportId(editing ? t.id : undefined)}
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

function locationViewLines(location: DbTpLocation): {headline: string; details: readonly string[]} {
  const meta = [tpLocationTypeLabel(location.locationType), location.country?.trim()].filter(
    (part): part is string => part !== undefined && part !== '',
  );
  const headline = meta.length > 0 ? `${location.name} · ${meta.join(' · ')}` : location.name;
  const details: string[] = [];
  if (location.address !== undefined && location.address.trim() !== '') {
    details.push(location.address.trim());
  }
  if (location.openTime !== undefined || location.closeTime !== undefined) {
    const open = location.openTime?.slice(0, 5) ?? '—';
    const close = location.closeTime?.slice(0, 5) ?? '—';
    details.push(`Hours ${open}–${close}`);
  }
  const contact = [location.phone, location.email, location.website].filter(
    (part): part is string => part !== undefined && part.trim() !== '',
  );
  if (contact.length > 0) {
    details.push(contact.join(' · '));
  }
  if (location.notes !== undefined && location.notes.trim() !== '') {
    details.push(location.notes.trim());
  }
  return {headline, details};
}

interface LocationRowProps {
  readonly location: DbTpLocation;
  readonly canWrite: boolean;
  readonly initialEditing: boolean;
  readonly onEditingChange: (editing: boolean) => void;
  readonly onSaved: () => void;
  readonly onError: (message: string) => void;
}

function LocationRow({location, canWrite, initialEditing, onEditingChange, onSaved, onError}: LocationRowProps) {
  const [editing, setEditing] = useState(initialEditing);
  const [busy, setBusy] = useState(false);
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

  const resetDraft = (): void => {
    setName(location.name);
    setAddress(location.address ?? '');
    setMapsUrl(location.mapsUrl ?? '');
    setNotes(location.notes ?? '');
    setOpenTime(location.openTime?.slice(0, 5) ?? '');
    setCloseTime(location.closeTime?.slice(0, 5) ?? '');
    setWebsite(location.website ?? '');
    setEmail(location.email ?? '');
    setPhone(location.phone ?? '');
    setCountry(location.country ?? '');
    setLocationType(location.locationType);
  };

  const setEditingMode = (next: boolean): void => {
    setEditing(next);
    onEditingChange(next);
  };

  const save = async (): Promise<void> => {
    setBusy(true);
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
      setEditingMode(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (): Promise<void> => {
    setBusy(true);
    try {
      await deleteDbTpLocation(location.id);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const view = locationViewLines(location);

  return (
    <Stack gap={2} borderWidth="1px" borderRadius="md" p={3} fontSize="sm">
      {editing && canWrite ? (
        <>
          <Field.Root>
            <Field.Label>Name</Field.Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Type</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field value={locationType} onChange={(e) => setLocationType(e.target.value)}>
                {TP_LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {tpLocationTypeLabel(t)}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Field.Root>
          <TripTpCountrySelect value={country} onChange={setCountry} />
          <Field.Root>
            <Field.Label>Address</Field.Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Maps URL</Field.Label>
            <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Notes (e.g. Tags: food, walk)</Field.Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field.Root>
          <HStack wrap="wrap">
            <Field.Root>
              <Field.Label>Open</Field.Label>
              <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Close</Field.Label>
              <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
            </Field.Root>
          </HStack>
          <Field.Root>
            <Field.Label>Website</Field.Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
          </Field.Root>
          <HStack wrap="wrap">
            <Field.Root flex="1">
              <Field.Label>Email</Field.Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field.Root>
            <Field.Root flex="1">
              <Field.Label>Phone</Field.Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field.Root>
          </HStack>
        </>
      ) : (
        <Stack gap={1}>
          <Text fontWeight="medium">{view.headline}</Text>
          {view.details.map((line) => (
            <TripTpTruncateText key={line} color="fg.muted" lineClamp={3}>
              {line}
            </TripTpTruncateText>
          ))}
          {location.mapsUrl !== undefined && location.mapsUrl.trim() !== '' ? (
            <Text>
              <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer">
                Maps
              </a>
            </Text>
          ) : null}
        </Stack>
      )}
      <TripTpEditSaveBar
        editing={editing}
        canWrite={canWrite}
        busy={busy}
        onEdit={() => {
          resetDraft();
          setEditingMode(true);
        }}
        onSave={() => void save()}
        onCancel={() => {
          resetDraft();
          setEditingMode(false);
        }}
        trailing={
          canWrite ? (
            <Button size="sm" variant="outline" colorPalette="red" disabled={busy} onClick={() => void remove()}>
              Delete
            </Button>
          ) : null
        }
      />
    </Stack>
  );
}

function transportViewLines(
  transport: DbTpTransportLib,
  locations: readonly DbTpLocation[],
): {headline: string; subline?: string} {
  const from = locations.find((l) => l.id === transport.fromLocationId)?.name;
  const to = locations.find((l) => l.id === transport.toLocationId)?.name;
  const mode = transport.mode?.trim() ?? '';
  const cost =
    transport.costAmount !== undefined
      ? `${transport.costCurrency !== undefined ? `${transport.costCurrency} ` : ''}${transport.costAmount}`
      : '';
  const duration = transport.durationMinutes !== undefined ? `${transport.durationMinutes} min` : '';
  const parts = [mode, cost, duration].filter((part) => part !== '');
  const headline = parts.length > 0 ? `${transport.label} · ${parts.join(' · ')}` : transport.label;
  const route = from !== undefined || to !== undefined ? `${from ?? '—'} → ${to ?? '—'}` : undefined;
  const important =
    transport.important && transport.importantReason?.trim() !== ''
      ? `Important: ${transport.importantReason?.trim()}`
      : transport.important
        ? 'Important'
        : undefined;
  const subline = [route, important].filter((part): part is string => part !== undefined).join(' · ');
  return {headline, subline: subline === '' ? undefined : subline};
}

interface TransportLibRowProps {
  readonly transport: DbTpTransportLib;
  readonly locations: readonly DbTpLocation[];
  readonly defaultCurrency?: string;
  readonly canWrite: boolean;
  readonly initialEditing: boolean;
  readonly onEditingChange: (editing: boolean) => void;
  readonly onSaved: () => void;
  readonly onError: (message: string) => void;
}

function TransportLibRow({
  transport,
  locations,
  defaultCurrency,
  canWrite,
  initialEditing,
  onEditingChange,
  onSaved,
  onError,
}: TransportLibRowProps) {
  const [editing, setEditing] = useState(initialEditing);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState(transport.label);
  const [mode, setMode] = useState(transport.mode ?? '');
  const [duration, setDuration] = useState(transport.durationMinutes?.toString() ?? '');
  const [cost, setCost] = useState(transport.costAmount?.toString() ?? '');
  const [currency, setCurrency] = useState(transport.costCurrency ?? defaultCurrency ?? '');
  const [fromLocationId, setFromLocationId] = useState(transport.fromLocationId ?? '');
  const [toLocationId, setToLocationId] = useState(transport.toLocationId ?? '');
  const [important, setImportant] = useState(transport.important);
  const [importantReason, setImportantReason] = useState(transport.importantReason ?? '');

  const resetDraft = (): void => {
    setLabel(transport.label);
    setMode(transport.mode ?? '');
    setDuration(transport.durationMinutes?.toString() ?? '');
    setCost(transport.costAmount?.toString() ?? '');
    setCurrency(transport.costCurrency ?? defaultCurrency ?? '');
    setFromLocationId(transport.fromLocationId ?? '');
    setToLocationId(transport.toLocationId ?? '');
    setImportant(transport.important);
    setImportantReason(transport.importantReason ?? '');
  };

  const setEditingMode = (next: boolean): void => {
    setEditing(next);
    onEditingChange(next);
  };

  const save = async (): Promise<void> => {
    const reason = importantReason.trim();
    if (important && reason.length > 500) {
      onError('Important reason must be 500 characters or fewer');
      return;
    }
    setBusy(true);
    try {
      await updateDbTpTransportLib(transport.id, {
        label,
        mode: mode === '' ? null : mode,
        durationMinutes: duration === '' ? null : Number(duration),
        costAmount: cost === '' ? null : Number(cost),
        costCurrency: currency === '' ? null : currency,
        fromLocationId: fromLocationId === '' ? null : fromLocationId,
        toLocationId: toLocationId === '' ? null : toLocationId,
        important,
        importantReason: important && reason !== '' ? reason : null,
      });
      onSaved();
      setEditingMode(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (): Promise<void> => {
    setBusy(true);
    try {
      await deleteDbTpTransportLib(transport.id);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const view = transportViewLines(transport, locations);

  return (
    <Stack gap={2} borderWidth="1px" borderRadius="md" p={3} fontSize="sm">
      {editing && canWrite ? (
        <>
          <Field.Root>
            <Field.Label>Label</Field.Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Mode (optional)</Field.Label>
            <Input value={mode} placeholder="e.g. walk, bus 123" onChange={(e) => setMode(e.target.value)} />
          </Field.Root>
          <HStack align="flex-end" wrap="wrap">
            <Field.Root flex="1" minW="6rem">
              <Field.Label>Duration (min)</Field.Label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} />
            </Field.Root>
          </HStack>
          <TripTpMoneyField
            amountLabel="Price"
            amount={cost}
            currency={currency}
            onChange={({amount, currency: nextCurrency}) => {
              setCost(amount);
              setCurrency(nextCurrency);
            }}
          />
          <HStack wrap="wrap">
            <Field.Root flex="1" minW="10rem">
              <Field.Label>From location</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)}>
                  <option value="">—</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root flex="1" minW="10rem">
              <Field.Label>To location</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field value={toLocationId} onChange={(e) => setToLocationId(e.target.value)}>
                  <option value="">—</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
          </HStack>
          <Checkbox.Root checked={important} onCheckedChange={(details) => setImportant(details.checked === true)}>
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label>Important</Checkbox.Label>
          </Checkbox.Root>
          {important ? (
            <Field.Root>
              <Field.Label>Reason</Field.Label>
              <Textarea value={importantReason} maxLength={500} rows={2} onChange={(e) => setImportantReason(e.target.value)} />
            </Field.Root>
          ) : null}
        </>
      ) : (
        <Stack gap={1}>
          <Text fontWeight="medium">{view.headline}</Text>
          {view.subline !== undefined ? <Text color="fg.muted">{view.subline}</Text> : null}
        </Stack>
      )}
      <TripTpEditSaveBar
        editing={editing}
        canWrite={canWrite}
        busy={busy}
        onEdit={() => {
          resetDraft();
          setEditingMode(true);
        }}
        onSave={() => void save()}
        onCancel={() => {
          resetDraft();
          setEditingMode(false);
        }}
        trailing={
          canWrite ? (
            <Button size="sm" variant="outline" colorPalette="red" disabled={busy} onClick={() => void remove()}>
              Delete
            </Button>
          ) : null
        }
      />
    </Stack>
  );
}
