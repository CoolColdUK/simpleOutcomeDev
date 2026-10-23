'use client';

import {useMemo, useState} from 'react';
import {Alert, Button, Field, HStack, Input, NativeSelect, Stack, Text, Textarea} from '@chakra-ui/react';
import {formatTpInstant, tpRouteIsSelected, tpRouteOptionSummary} from '@so/model';
import TripTpDoneCheckbox from '@/components/tp/TripTpDoneCheckbox';
import type {
  DbTpAction,
  DbTpActionTransport,
  DbTpDestination,
  DbTpLocation,
  DbTpRoute,
  DbTpTransport,
  DbTpTransportLib,
} from '@/lib/api/db/tp/loadDbTpWorkspace';
import createDbTpActionTransport from '@/lib/api/db/tp/createDbTpActionTransport';
import deleteDbTpActionTransport from '@/lib/api/db/tp/deleteDbTpActionTransport';
import updateDbTpActionTransport from '@/lib/api/db/tp/updateDbTpActionTransport';
import updateDbTpAction from '@/lib/api/db/tp/updateDbTpAction';
import createDbTpRoute from '@/lib/api/db/tp/createDbTpRoute';
import deleteDbTpRoute from '@/lib/api/db/tp/deleteDbTpRoute';
import selectDbTpRoute from '@/lib/api/db/tp/selectDbTpRoute';
import createDbTpTransport from '@/lib/api/db/tp/createDbTpTransport';
import updateDbTpTransport from '@/lib/api/db/tp/updateDbTpTransport';
import deleteDbTpTransport from '@/lib/api/db/tp/deleteDbTpTransport';
import {tpInstantFromParts, tpPartsFromInstant} from '@/lib/tp/tpDateTimeParts';
import {TP_TRANSPORT_MODES} from '@/components/tp/tpTransportModes';
import TripTpAttachmentPanel from '@/components/tp/TripTpAttachmentPanel';
import TripTpCollapsible from '@/components/tp/TripTpCollapsible';
import type {DbTpAttachment} from '@/lib/api/db/tp/loadDbTpWorkspace';

export interface TripTravelActionEditorProps {
  readonly podId: string;
  readonly tripId: string;
  readonly userId: string;
  readonly action: DbTpAction;
  readonly routes: readonly DbTpRoute[];
  readonly transports: readonly DbTpTransport[];
  readonly attachments: readonly DbTpAttachment[];
  readonly destinations: readonly DbTpDestination[];
  readonly locations: readonly DbTpLocation[];
  readonly transportLib: readonly DbTpTransportLib[];
  readonly actionTransports: readonly DbTpActionTransport[];
  readonly tripTimezone: string;
  readonly defaultCurrency?: string;
  readonly canWrite: boolean;
  readonly onSaved: () => void | Promise<void>;
  readonly onError: (message: string) => void;
}

type TravelPending = 'addRoute' | 'addStep' | 'selectRoute' | 'deleteRoute' | 'linkTransport' | 'saveJourney' | null;

export default function TripTravelActionEditor({
  podId,
  tripId,
  userId,
  action,
  routes,
  transports,
  attachments,
  destinations,
  locations,
  transportLib,
  actionTransports,
  tripTimezone,
  defaultCurrency,
  canWrite,
  onSaved,
  onError,
}: TripTravelActionEditorProps) {
  const [pending, setPending] = useState<TravelPending>(null);
  const mutationsDisabled = pending !== null;
  const actionRoutes = routes.filter((r) => r.actionId === action.id);
  const selectedRouteId = action.selectedRouteId ?? actionRoutes.find((r) => r.isSelected)?.id;
  const selectedRouteTransports = transports.filter((t) => t.routeId === selectedRouteId);

  const [title, setTitle] = useState(action.title);
  const [fromPlace, setFromPlace] = useState(action.fromPlace ?? '');
  const [toPlace, setToPlace] = useState(action.toPlace ?? '');
  const [fromMapsUrl, setFromMapsUrl] = useState(action.fromMapsUrl ?? '');
  const [toMapsUrl, setToMapsUrl] = useState(action.toMapsUrl ?? '');
  const [fromDestinationId, setFromDestinationId] = useState(action.fromDestinationId ?? '');
  const [toDestinationId, setToDestinationId] = useState(action.toDestinationId ?? '');
  const [notes, setNotes] = useState(action.notes ?? '');
  const [startTime, setStartTime] = useState(action.startTime?.slice(0, 5) ?? '');
  const [endTime, setEndTime] = useState(action.endTime?.slice(0, 5) ?? '');
  const [durationMinutes, setDurationMinutes] = useState(action.durationMinutes?.toString() ?? '');
  const [journeyCost, setJourneyCost] = useState(action.costAmount?.toString() ?? '');
  const [journeyCurrency, setJourneyCurrency] = useState(action.costCurrency ?? defaultCurrency ?? '');
  const [fromLocationId, setFromLocationId] = useState(action.fromLocationId ?? '');
  const [toLocationId, setToLocationId] = useState(action.toLocationId ?? '');
  const travelLinks = actionTransports.filter((l) => l.actionId === action.id).sort((a, b) => a.sortOrder - b.sortOrder);

  const multimodalWarning = useMemo(() => {
    if (selectedRouteTransports.length <= 1) {
      return '';
    }
    const first = selectedRouteTransports[0];
    const last = selectedRouteTransports[selectedRouteTransports.length - 1];
    if (fromPlace !== '' && first?.fromPlace !== undefined && first.fromPlace !== fromPlace) {
      return 'First segment “from” does not match journey start.';
    }
    if (toPlace !== '' && last?.toPlace !== undefined && last.toPlace !== toPlace) {
      return 'Last segment “to” does not match journey end.';
    }
    return '';
  }, [fromPlace, toPlace, selectedRouteTransports]);

  const afterSave = async (): Promise<void> => {
    await onSaved();
  };

  const saveAction = async (): Promise<void> => {
    setPending('saveJourney');
    try {
      await updateDbTpAction(action.id, {
        title,
        fromPlace,
        toPlace,
        fromMapsUrl: fromMapsUrl === '' ? null : fromMapsUrl,
        toMapsUrl: toMapsUrl === '' ? null : toMapsUrl,
        fromDestinationId: fromDestinationId === '' ? null : fromDestinationId,
        toDestinationId: toDestinationId === '' ? null : toDestinationId,
        notes,
        startTime: startTime === '' ? null : startTime,
        endTime: endTime === '' ? null : endTime,
        durationMinutes: durationMinutes === '' ? null : Number(durationMinutes),
        costAmount: journeyCost === '' ? null : Number(journeyCost),
        costCurrency: journeyCurrency === '' ? null : journeyCurrency,
        fromLocationId: fromLocationId === '' ? null : fromLocationId,
        toLocationId: toLocationId === '' ? null : toLocationId,
      });
      if (selectedRouteId !== undefined && selectedRouteTransports.length === 1) {
        const only = selectedRouteTransports[0];
        await updateDbTpTransport(only.id, {fromPlace, toPlace});
      }
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  };

  const addRoute = async (): Promise<void> => {
    setPending('addRoute');
    try {
      const id = await createDbTpRoute(action.id, `Option ${actionRoutes.length + 1}`, actionRoutes.length);
      if (actionRoutes.length === 0) {
        await selectDbTpRoute(action.id, id);
      }
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  };

  const pickRoute = async (routeId: string): Promise<void> => {
    setPending('selectRoute');
    try {
      await selectDbTpRoute(action.id, routeId);
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  };

  const removeRoute = async (routeId: string): Promise<void> => {
    setPending('deleteRoute');
    try {
      await deleteDbTpRoute(routeId);
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  };

  const addTransport = async (routeId: string): Promise<void> => {
    setPending('addStep');
    try {
      const count = transports.filter((t) => t.routeId === routeId).length;
      await createDbTpTransport(routeId, count);
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  };

  const linkTransportLib = async (transportLibId: string): Promise<void> => {
    if (transportLibId === '') {
      return;
    }
    setPending('linkTransport');
    try {
      const lib = transportLib.find((t) => t.id === transportLibId);
      await createDbTpActionTransport({
        actionId: action.id,
        transportLibId,
        sortOrder: travelLinks.length,
        durationMinutes: lib?.durationMinutes,
        costAmount: lib?.costAmount,
        costCurrency: lib?.costCurrency,
        fromLocationId: lib?.fromLocationId,
        toLocationId: lib?.toLocationId,
      });
      const routeId = selectedRouteId ?? actionRoutes[0]?.id;
      if (routeId !== undefined && lib !== undefined) {
        const count = transports.filter((t) => t.routeId === routeId).length;
        await createDbTpTransport(routeId, count, {
          id: lib.id,
          mode: lib.mode ?? 'other',
          durationMinutes: lib.durationMinutes,
          costAmount: lib.costAmount,
          costCurrency: lib.costCurrency,
          fromLocationId: lib.fromLocationId,
          toLocationId: lib.toLocationId,
        });
      }
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  };

  const unlinkTransportLib = async (linkId: string): Promise<void> => {
    try {
      await deleteDbTpActionTransport(linkId);
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const saveTransport = async (transport: DbTpTransport, draft: TransportDraft): Promise<void> => {
    try {
      await updateDbTpTransport(transport.id, {
        mode: draft.mode,
        fromPlace: draft.fromPlace,
        toPlace: draft.toPlace,
        fromLocationId: draft.fromLocationId === '' ? null : draft.fromLocationId,
        toLocationId: draft.toLocationId === '' ? null : draft.toLocationId,
        durationMinutes: draft.durationMinutes === '' ? null : Number(draft.durationMinutes),
        departAt: tpInstantFromParts(draft.departDate, draft.departTime, draft.departTimezone) ?? null,
        arriveAt: tpInstantFromParts(draft.arriveDate, draft.arriveTime, draft.arriveTimezone) ?? null,
        departTimezone: draft.departTimezone,
        arriveTimezone: draft.arriveTimezone,
        costAmount: draft.cost === '' ? null : Number(draft.cost),
        costCurrency: draft.currency === '' ? null : draft.currency,
        bookingRef: draft.bookingRef,
        notes: draft.notes,
        done: draft.done,
      });
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!canWrite) {
    return (
      <Text fontSize="sm">
        {fromPlace} → {toPlace}
      </Text>
    );
  }

  return (
    <Stack gap={3}>
      <Field.Root>
        <Field.Label>Title</Field.Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field.Root>
      <HStack wrap="wrap" align="flex-start">
        <Stack flex="1" minW="12rem">
          <Field.Root>
            <Field.Label>Journey from</Field.Label>
            <Input value={fromPlace} onChange={(e) => setFromPlace(e.target.value)} />
          </Field.Root>
          <Input placeholder="From maps URL" value={fromMapsUrl} onChange={(e) => setFromMapsUrl(e.target.value)} size="sm" />
          <NativeSelect.Root>
            <NativeSelect.Field value={fromDestinationId} onChange={(e) => setFromDestinationId(e.target.value)}>
              <option value="">From destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
          <NativeSelect.Root>
            <NativeSelect.Field value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)}>
              <option value="">From location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Stack>
        <Stack flex="1" minW="12rem">
          <Field.Root>
            <Field.Label>Journey to</Field.Label>
            <Input value={toPlace} onChange={(e) => setToPlace(e.target.value)} />
          </Field.Root>
          <Input placeholder="To maps URL" value={toMapsUrl} onChange={(e) => setToMapsUrl(e.target.value)} size="sm" />
          <NativeSelect.Root>
            <NativeSelect.Field value={toDestinationId} onChange={(e) => setToDestinationId(e.target.value)}>
              <option value="">To destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
          <NativeSelect.Root>
            <NativeSelect.Field value={toLocationId} onChange={(e) => setToLocationId(e.target.value)}>
              <option value="">To location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Stack>
      </HStack>
      <HStack wrap="wrap">
        <Field.Root>
          <Field.Label>Start time</Field.Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>End time</Field.Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Duration (min)</Field.Label>
          <Input value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Journey price</Field.Label>
          <Input value={journeyCost} onChange={(e) => setJourneyCost(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Currency</Field.Label>
          <Input value={journeyCurrency} onChange={(e) => setJourneyCurrency(e.target.value)} />
        </Field.Root>
      </HStack>
      <Stack gap={2}>
        <Text fontWeight="medium">Linked transports</Text>
        {travelLinks.map((link) => (
          <ActionTransportLinkRow
            key={link.id}
            link={link}
            lib={transportLib.find((t) => t.id === link.transportLibId)}
            locations={locations}
            defaultCurrency={defaultCurrency}
            canWrite={canWrite}
            onRemove={() => void unlinkTransportLib(link.id)}
            onError={onError}
            onSaved={afterSave}
            mutationsDisabled={mutationsDisabled}
          />
        ))}
        <NativeSelect.Root disabled={mutationsDisabled}>
          <NativeSelect.Field value="" onChange={(e) => void linkTransportLib(e.target.value)}>
            <option value="">Add from library…</option>
            {transportLib
              .filter((t) => !travelLinks.some((l) => l.transportLibId === t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Stack>
      <Field.Root>
        <Field.Label>Notes</Field.Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field.Root>
      <Button
        size="sm"
        colorPalette="brand"
        disabled={mutationsDisabled}
        onClick={() => void saveAction()}
      >
        {pending === 'saveJourney' ? 'Saving…' : 'Save journey'}
      </Button>
      {multimodalWarning !== '' ? (
        <Alert.Root status="warning" size="sm">
          <Alert.Description>{multimodalWarning}</Alert.Description>
        </Alert.Root>
      ) : null}
      <HStack justify="space-between">
        <Text fontWeight="medium">Routes</Text>
        <Button size="xs" disabled={mutationsDisabled} onClick={() => void addRoute()}>
          {pending === 'addRoute' ? 'Adding route…' : '+ Route'}
        </Button>
      </HStack>
      {actionRoutes.map((route) => {
        const routeTransports = transports.filter((t) => t.routeId === route.id).sort((a, b) => a.sortOrder - b.sortOrder);
        const routeTitle = tpRouteOptionSummary({
          name: route.name,
          isSelected: tpRouteIsSelected(route.id, selectedRouteId, route.isSelected),
          steps: routeTransports.map((s) => ({
            fromPlace: s.fromPlace,
            toPlace: s.toPlace,
            fromLocationName: locations.find((l) => l.id === s.fromLocationId)?.name,
            toLocationName: locations.find((l) => l.id === s.toLocationId)?.name,
            costAmount: s.costAmount,
            costCurrency: s.costCurrency,
            departAt: s.departAt,
            departTimezone: s.departTimezone,
            arriveAt: s.arriveAt,
            arriveTimezone: s.arriveTimezone,
          })),
        });
        return (
          <TripTpCollapsible
            key={route.id}
            title={routeTitle}
          >
            <BoxRoute
              route={route}
              selected={route.id === selectedRouteId}
              transports={routeTransports}
              locations={locations}
              transportLib={transportLib}
              tripTimezone={tripTimezone}
              defaultCurrency={defaultCurrency}
              podId={podId}
              tripId={tripId}
              userId={userId}
              attachments={attachments}
              mutationsDisabled={mutationsDisabled}
              pending={pending}
              onPick={() => void pickRoute(route.id)}
              onDelete={() => void removeRoute(route.id)}
              onAddTransport={() => void addTransport(route.id)}
              onSaveTransport={saveTransport}
              onRemoveTransport={(id) => void deleteDbTpTransport(id).then(afterSave).catch((e) => onError(String(e)))}
              onChanged={afterSave}
              onError={onError}
            />
          </TripTpCollapsible>
        );
      })}
    </Stack>
  );
}

function effectiveMinutes(link: DbTpActionTransport, lib?: DbTpTransportLib): number | undefined {
  return link.durationMinutes ?? lib?.durationMinutes;
}

function effectiveCost(link: DbTpActionTransport, lib?: DbTpTransportLib): number | undefined {
  return link.costAmount ?? lib?.costAmount;
}

function effectiveCurrency(link: DbTpActionTransport, lib?: DbTpTransportLib, defaultCurrency?: string): string {
  return link.costCurrency ?? lib?.costCurrency ?? defaultCurrency ?? '';
}

function effectiveFromLocationId(link: DbTpActionTransport, lib?: DbTpTransportLib): string {
  return link.fromLocationId ?? lib?.fromLocationId ?? '';
}

function effectiveToLocationId(link: DbTpActionTransport, lib?: DbTpTransportLib): string {
  return link.toLocationId ?? lib?.toLocationId ?? '';
}

function ActionTransportLinkRow({
  link,
  lib,
  locations,
  defaultCurrency,
  canWrite,
  onRemove,
  onError,
  onSaved,
  mutationsDisabled,
}: {
  readonly link: DbTpActionTransport;
  readonly lib?: DbTpTransportLib;
  readonly locations: readonly DbTpLocation[];
  readonly defaultCurrency?: string;
  readonly canWrite: boolean;
  readonly onRemove: () => void;
  readonly onError: (message: string) => void;
  readonly onSaved: () => void | Promise<void>;
  readonly mutationsDisabled: boolean;
}) {
  const [duration, setDuration] = useState(effectiveMinutes(link, lib)?.toString() ?? '');
  const [cost, setCost] = useState(effectiveCost(link, lib)?.toString() ?? '');
  const [currency, setCurrency] = useState(effectiveCurrency(link, lib, defaultCurrency));
  const [fromLocationId, setFromLocationId] = useState(effectiveFromLocationId(link, lib));
  const [toLocationId, setToLocationId] = useState(effectiveToLocationId(link, lib));

  const save = async (): Promise<void> => {
    try {
      await updateDbTpActionTransport(link.id, {
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

  const locName = (id: string): string => locations.find((l) => l.id === id)?.name ?? '—';

  const toggleDone = async (done: boolean): Promise<void> => {
    try {
      await updateDbTpActionTransport(link.id, {done});
      await onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={2} pl={2} borderLeftWidth="2px">
      <HStack>
        <TripTpDoneCheckbox
          checked={link.done}
          disabled={!canWrite || mutationsDisabled}
          ariaLabel={link.done ? `Mark transport ${lib?.label ?? 'link'} not done` : `Mark transport ${lib?.label ?? 'link'} done`}
          tooltip="Done for this travel link only — not the route step or transport library."
          onCheckedChange={(v) => void toggleDone(v)}
        />
        <Text fontWeight="medium">{lib?.label ?? 'Transport'}</Text>
      </HStack>
      {canWrite ? (
        <>
          <HStack wrap="wrap">
            <Field.Root>
              <Field.Label>Duration (min)</Field.Label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} size="sm" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Price</Field.Label>
              <Input value={cost} onChange={(e) => setCost(e.target.value)} size="sm" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Currency</Field.Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} size="sm" width="5rem" />
            </Field.Root>
          </HStack>
          <HStack wrap="wrap">
            <Field.Root flex="1" minW="10rem">
              <Field.Label>From location</Field.Label>
              <NativeSelect.Root>
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
              <NativeSelect.Root>
                <NativeSelect.Field value={toLocationId} onChange={(e) => setToLocationId(e.target.value)}>
                  <option value="">—</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
          </HStack>
          <HStack>
            <Button size="xs" colorPalette="brand" onClick={() => void save()}>Save link</Button>
            <Button size="xs" variant="outline" onClick={onRemove}>Remove</Button>
          </HStack>
        </>
      ) : (
        <Text fontSize="sm" color="fg.muted">
          {duration !== '' ? `${duration} min` : ''}
          {fromLocationId !== '' ? ` · ${locName(fromLocationId)}` : ''}
          {toLocationId !== '' ? ` → ${locName(toLocationId)}` : ''}
        </Text>
      )}
    </Stack>
  );
}

interface TransportDraft {
  mode: string;
  fromPlace: string;
  toPlace: string;
  fromLocationId: string;
  toLocationId: string;
  durationMinutes: string;
  departDate: string;
  departTime: string;
  departTimezone: string;
  arriveDate: string;
  arriveTime: string;
  arriveTimezone: string;
  cost: string;
  currency: string;
  bookingRef: string;
  notes: string;
  done: boolean;
}

function transportDraft(transport: DbTpTransport, tripTimezone: string, defaultCurrency?: string): TransportDraft {
  const depTz = transport.departTimezone ?? tripTimezone;
  const arrTz = transport.arriveTimezone ?? tripTimezone;
  const dep = tpPartsFromInstant(transport.departAt, depTz);
  const arr = tpPartsFromInstant(transport.arriveAt, arrTz);
  return {
    mode: transport.mode,
    fromPlace: transport.fromPlace ?? '',
    toPlace: transport.toPlace ?? '',
    fromLocationId: transport.fromLocationId ?? '',
    toLocationId: transport.toLocationId ?? '',
    durationMinutes: transport.durationMinutes?.toString() ?? '',
    departDate: dep.date,
    departTime: dep.time,
    departTimezone: depTz,
    arriveDate: arr.date,
    arriveTime: arr.time,
    arriveTimezone: arrTz,
    cost: transport.costAmount?.toString() ?? '',
    currency: transport.costCurrency ?? defaultCurrency ?? '',
    bookingRef: transport.bookingRef ?? '',
    notes: transport.notes ?? '',
    done: transport.done,
  };
}

interface BoxRouteProps {
  readonly route: DbTpRoute;
  readonly selected: boolean;
  readonly transports: readonly DbTpTransport[];
  readonly locations: readonly DbTpLocation[];
  readonly transportLib: readonly DbTpTransportLib[];
  readonly tripTimezone: string;
  readonly defaultCurrency?: string;
  readonly podId: string;
  readonly tripId: string;
  readonly userId: string;
  readonly attachments: readonly DbTpAttachment[];
  readonly mutationsDisabled: boolean;
  readonly pending: TravelPending;
  readonly onPick: () => void;
  readonly onDelete: () => void;
  readonly onAddTransport: () => void;
  readonly onSaveTransport: (transport: DbTpTransport, draft: TransportDraft) => Promise<void>;
  readonly onRemoveTransport: (id: string) => void;
  readonly onChanged: () => void;
  readonly onError: (message: string) => void;
}

function BoxRoute({
  selected,
  transports,
  tripTimezone,
  defaultCurrency,
  podId,
  tripId,
  userId,
  attachments,
  onPick,
  onDelete,
  onAddTransport,
  onSaveTransport,
  onRemoveTransport,
  onChanged,
  onError,
  locations,
  transportLib,
  mutationsDisabled,
  pending,
}: BoxRouteProps) {
  return (
    <Stack gap={2} opacity={selected ? 1 : 0.85}>
      <HStack justify="space-between">
        <Text fontWeight="medium">Route options</Text>
        <HStack>
          {!selected ? (
            <Button size="xs" disabled={mutationsDisabled} onClick={onPick}>
              {pending === 'selectRoute' ? 'Selecting…' : 'Select'}
            </Button>
          ) : null}
          <Button size="xs" variant="outline" colorPalette="red" disabled={mutationsDisabled} onClick={onDelete}>
            {pending === 'deleteRoute' ? 'Deleting route…' : 'Delete route'}
          </Button>
        </HStack>
      </HStack>
      <Button size="xs" alignSelf="flex-start" disabled={mutationsDisabled} onClick={onAddTransport}>
        {pending === 'addStep' ? 'Adding step…' : '+ Step'}
      </Button>
      {transports.map((t) => (
        <TransportRow
          key={t.id}
          transport={t}
          transportLib={transportLib}
          locations={locations}
          tripTimezone={tripTimezone}
          defaultCurrency={defaultCurrency}
          podId={podId}
          tripId={tripId}
          userId={userId}
          attachments={attachments}
          mutationsDisabled={mutationsDisabled}
          onSave={(draft) => onSaveTransport(t, draft)}
          onRemove={() => onRemoveTransport(t.id)}
          onChanged={onChanged}
          onError={onError}
        />
      ))}
    </Stack>
  );
}

function TransportRow({
  transport,
  transportLib,
  locations,
  tripTimezone,
  defaultCurrency,
  podId,
  tripId,
  userId,
  attachments,
  mutationsDisabled,
  onSave,
  onRemove,
  onChanged,
  onError,
}: {
  readonly transport: DbTpTransport;
  readonly transportLib: readonly DbTpTransportLib[];
  readonly locations: readonly DbTpLocation[];
  readonly tripTimezone: string;
  readonly defaultCurrency?: string;
  readonly podId: string;
  readonly tripId: string;
  readonly userId: string;
  readonly attachments: readonly DbTpAttachment[];
  readonly mutationsDisabled: boolean;
  readonly onSave: (draft: TransportDraft) => Promise<void>;
  readonly onRemove: () => void;
  readonly onChanged: () => void | Promise<void>;
  readonly onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState(() => transportDraft(transport, tripTimezone, defaultCurrency));

  const summary =
    transport.departAt !== undefined && transport.arriveAt !== undefined
      ? `${formatTpInstant(transport.departAt, draft.departTimezone)} → ${formatTpInstant(transport.arriveAt, draft.arriveTimezone)}`
      : '';

  const libLabel =
    transport.transportLibId !== undefined
      ? transportLib.find((t) => t.id === transport.transportLibId)?.label
      : undefined;

  return (
    <Stack gap={2} pl={2} borderLeftWidth="2px">
      {summary !== '' ? <Text fontSize="xs" color="fg.muted">{summary}</Text> : null}
      {libLabel !== undefined ? <Text fontSize="xs">{libLabel}</Text> : null}
      <TripTpDoneCheckbox
        checked={draft.done}
        disabled={mutationsDisabled}
        ariaLabel={draft.done ? 'Mark route step not done' : 'Mark route step done'}
        tooltip="Done for this route step only — independent of the linked transport on the journey."
        onCheckedChange={(v) => setDraft({...draft, done: v})}
      />
      <NativeSelect.Root>
        <NativeSelect.Field value={draft.mode} onChange={(e) => setDraft({...draft, mode: e.target.value})}>
          {TP_TRANSPORT_MODES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </NativeSelect.Field>
      </NativeSelect.Root>
      <HStack>
        <Input placeholder="From" value={draft.fromPlace} onChange={(e) => setDraft({...draft, fromPlace: e.target.value})} />
        <Input placeholder="To" value={draft.toPlace} onChange={(e) => setDraft({...draft, toPlace: e.target.value})} />
      </HStack>
      <HStack wrap="wrap">
        <Field.Root flex="1" minW="10rem">
          <Field.Label>From location</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={draft.fromLocationId}
              onChange={(e) => setDraft({...draft, fromLocationId: e.target.value})}
            >
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root flex="1" minW="10rem">
          <Field.Label>To location</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={draft.toLocationId} onChange={(e) => setDraft({...draft, toLocationId: e.target.value})}>
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label>Duration (min)</Field.Label>
          <Input value={draft.durationMinutes} onChange={(e) => setDraft({...draft, durationMinutes: e.target.value})} />
        </Field.Root>
      </HStack>
      <Text fontSize="xs">Depart</Text>
      <HStack wrap="wrap">
        <Input type="date" value={draft.departDate} onChange={(e) => setDraft({...draft, departDate: e.target.value})} />
        <Input type="time" value={draft.departTime} onChange={(e) => setDraft({...draft, departTime: e.target.value})} />
        <Input value={draft.departTimezone} onChange={(e) => setDraft({...draft, departTimezone: e.target.value})} width="8rem" />
      </HStack>
      <Text fontSize="xs">Arrive</Text>
      <HStack wrap="wrap">
        <Input type="date" value={draft.arriveDate} onChange={(e) => setDraft({...draft, arriveDate: e.target.value})} />
        <Input type="time" value={draft.arriveTime} onChange={(e) => setDraft({...draft, arriveTime: e.target.value})} />
        <Input value={draft.arriveTimezone} onChange={(e) => setDraft({...draft, arriveTimezone: e.target.value})} width="8rem" />
      </HStack>
      <HStack>
        <Input placeholder="Cost" value={draft.cost} onChange={(e) => setDraft({...draft, cost: e.target.value})} />
        <Input placeholder="Currency" value={draft.currency} onChange={(e) => setDraft({...draft, currency: e.target.value})} />
        <Input placeholder="Booking ref" value={draft.bookingRef} onChange={(e) => setDraft({...draft, bookingRef: e.target.value})} />
      </HStack>
      <Input placeholder="Segment notes" value={draft.notes} onChange={(e) => setDraft({...draft, notes: e.target.value})} />
      <HStack>
        <Button size="xs" colorPalette="brand" disabled={mutationsDisabled} onClick={() => void onSave(draft)}>Save step</Button>
        <Button size="xs" variant="outline" colorPalette="red" disabled={mutationsDisabled} onClick={onRemove}>Remove</Button>
      </HStack>
      <TripTpAttachmentPanel
        podId={podId}
        tripId={tripId}
        userId={userId}
        canWrite={true}
        parent={{transportId: transport.id}}
        attachments={attachments}
        onChanged={onChanged}
        onError={onError}
      />
    </Stack>
  );
}
