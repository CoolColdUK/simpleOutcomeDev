'use client';

import {useMemo, useState} from 'react';
import {Alert, Button, Field, HStack, Input, NativeSelect, Stack, Text, Textarea} from '@chakra-ui/react';
import {formatTpInstant, tpRouteIsSelected, tpRouteOptionSummary, tpStepModeFromLibrary} from '@so/model';
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
import updateDbTpAction from '@/lib/api/db/tp/updateDbTpAction';
import updateDbTpRoute from '@/lib/api/db/tp/updateDbTpRoute';
import createDbTpRoute from '@/lib/api/db/tp/createDbTpRoute';
import deleteDbTpRoute from '@/lib/api/db/tp/deleteDbTpRoute';
import selectDbTpRoute from '@/lib/api/db/tp/selectDbTpRoute';
import createDbTpTransport from '@/lib/api/db/tp/createDbTpTransport';
import updateDbTpTransport, {type UpdateDbTpTransportInput} from '@/lib/api/db/tp/updateDbTpTransport';
import deleteDbTpTransport from '@/lib/api/db/tp/deleteDbTpTransport';
import {tpInstantFromParts, tpPartsFromInstant} from '@/lib/tp/tpDateTimeParts';
import TripTpAttachmentPanel from '@/components/tp/TripTpAttachmentPanel';
import TripTpMoneyField from '@/components/tp/TripTpMoneyField';
import TripTpCollapsible from '@/components/tp/TripTpCollapsible';
import TripTpRouteOptionTitle from '@/components/tp/TripTpRouteOptionTitle';
import TripTpLocationSelect from '@/components/tp/TripTpLocationSelect';
import TripTpTimestampField from '@/components/tp/TripTpTimestampField';
import TripTpTransportLibSelect from '@/components/tp/TripTpTransportLibSelect';
import type {DbTpAttachment} from '@/lib/api/db/tp/loadDbTpWorkspace';

function locationPlaceName(locations: readonly DbTpLocation[], locationId: string, fallback: string): string {
  if (locationId === '') {
    return fallback;
  }
  return locations.find((l) => l.id === locationId)?.name ?? fallback;
}

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

type TravelPending = 'addRoute' | 'addStep' | 'selectRoute' | 'deleteRoute' | 'saveJourney' | 'saveRoute' | null;

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
  actionTransports: _actionTransports,
  tripTimezone,
  defaultCurrency,
  canWrite,
  onSaved,
  onError,
}: TripTravelActionEditorProps) {
  const [pending, setPending] = useState<TravelPending>(null);
  const [expandStepId, setExpandStepId] = useState<string | undefined>(undefined);
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
  const [fromLocationId, setFromLocationId] = useState(action.fromLocationId ?? '');
  const [toLocationId, setToLocationId] = useState(action.toLocationId ?? '');
  const [fromTypeFilter, setFromTypeFilter] = useState('');
  const [toTypeFilter, setToTypeFilter] = useState('');

  const multimodalWarning = useMemo(() => {
    if (selectedRouteTransports.length <= 1) {
      return '';
    }
    const first = selectedRouteTransports[0];
    const last = selectedRouteTransports[selectedRouteTransports.length - 1];
    const journeyFrom = locationPlaceName(locations, fromLocationId, fromPlace);
    const journeyTo = locationPlaceName(locations, toLocationId, toPlace);
    const firstFrom = locationPlaceName(locations, first?.fromLocationId ?? '', first?.fromPlace ?? '');
    const lastTo = locationPlaceName(locations, last?.toLocationId ?? '', last?.toPlace ?? '');
    if (journeyFrom !== '' && firstFrom !== '' && firstFrom !== journeyFrom) {
      return 'First segment “from” does not match journey start.';
    }
    if (journeyTo !== '' && lastTo !== '' && lastTo !== journeyTo) {
      return 'Last segment “to” does not match journey end.';
    }
    return '';
  }, [fromPlace, toPlace, fromLocationId, toLocationId, locations, selectedRouteTransports]);

  const afterSave = async (): Promise<void> => {
    await onSaved();
  };

  const saveAction = async (): Promise<void> => {
    setPending('saveJourney');
    try {
      const resolvedFrom = locationPlaceName(locations, fromLocationId, fromPlace);
      const resolvedTo = locationPlaceName(locations, toLocationId, toPlace);
      await updateDbTpAction(action.id, {
        title,
        fromPlace: resolvedFrom === '' ? null : resolvedFrom,
        toPlace: resolvedTo === '' ? null : resolvedTo,
        fromMapsUrl: fromMapsUrl === '' ? null : fromMapsUrl,
        toMapsUrl: toMapsUrl === '' ? null : toMapsUrl,
        fromDestinationId: fromDestinationId === '' ? null : fromDestinationId,
        toDestinationId: toDestinationId === '' ? null : toDestinationId,
        notes,
        startTime: startTime === '' ? null : startTime,
        endTime: endTime === '' ? null : endTime,
        fromLocationId: fromLocationId === '' ? null : fromLocationId,
        toLocationId: toLocationId === '' ? null : toLocationId,
      });
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
      const stepId = await createDbTpTransport(routeId, count);
      setExpandStepId(stepId);
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  };

  const saveTransport = async (transport: DbTpTransport, draft: TransportDraft): Promise<void> => {
    try {
      const resolvedFrom = locationPlaceName(locations, draft.fromLocationId, draft.fromPlace);
      const resolvedTo = locationPlaceName(locations, draft.toLocationId, draft.toPlace);
      const transportLibId = draft.transportLibId === '' ? null : draft.transportLibId;
      const linkedLib = transportLibId !== null ? transportLib.find((t) => t.id === transportLibId) : undefined;
      const patch: UpdateDbTpTransportInput = {
        fromPlace: resolvedFrom === '' ? null : resolvedFrom,
        toPlace: resolvedTo === '' ? null : resolvedTo,
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
        transportLibId,
        ...(transportLibId !== null ? {mode: tpStepModeFromLibrary(linkedLib?.mode)} : {}),
      };
      await updateDbTpTransport(transport.id, patch);
      await afterSave();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!canWrite) {
    const fromLabel = locationPlaceName(locations, fromLocationId, fromPlace);
    const toLabel = locationPlaceName(locations, toLocationId, toPlace);
    return (
      <Text fontSize="sm">
        {fromLabel} → {toLabel}
      </Text>
    );
  }

  return (
    <Stack gap={3} minW={0} maxW="100%">
      <Field.Root>
        <Field.Label>Title</Field.Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field.Root>
      <HStack wrap="wrap" align="flex-start" minW={0} maxW="100%">
        <TripTpLocationSelect
          label="Journey from (location)"
          value={fromLocationId}
          locations={locations}
          typeFilter={fromTypeFilter}
          disabled={mutationsDisabled}
          onTypeFilterChange={setFromTypeFilter}
          onChange={(id) => {
            setFromLocationId(id);
            if (id !== '') {
              setFromPlace(locationPlaceName(locations, id, ''));
            }
          }}
        />
        <TripTpLocationSelect
          label="Journey to (location)"
          value={toLocationId}
          locations={locations}
          typeFilter={toTypeFilter}
          disabled={mutationsDisabled}
          onTypeFilterChange={setToTypeFilter}
          onChange={(id) => {
            setToLocationId(id);
            if (id !== '') {
              setToPlace(locationPlaceName(locations, id, ''));
            }
          }}
        />
      </HStack>
      <HStack wrap="wrap" minW={0} maxW="100%">
        <Field.Root flex="1" minW={0}>
          <Field.Label>From destination (region)</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={fromDestinationId} onChange={(e) => setFromDestinationId(e.target.value)}>
              <option value="">—</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root flex="1" minW={0}>
          <Field.Label>To destination (region)</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={toDestinationId} onChange={(e) => setToDestinationId(e.target.value)}>
              <option value="">—</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
      </HStack>
      <HStack wrap="wrap" minW={0} maxW="100%">
        <Field.Root>
          <Field.Label>Start time</Field.Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>End time</Field.Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field.Root>
      </HStack>
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
        const routeLib = route.transportLibId !== undefined
          ? transportLib.find((t) => t.id === route.transportLibId)
          : undefined;
        const routeTitle = tpRouteOptionSummary({
          name: route.name,
          isSelected: tpRouteIsSelected(route.id, selectedRouteId, route.isSelected),
          routeCostAmount: route.costAmount,
          routeCostCurrency: route.costCurrency,
          transportLibLabel: routeLib?.label,
          transportLibMode: routeLib?.mode,
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
        const routeSelected = tpRouteIsSelected(route.id, selectedRouteId, route.isSelected);
        return (
          <TripTpCollapsible
            key={route.id}
            title={<TripTpRouteOptionTitle summary={routeTitle} selected={routeSelected} />}
          >
            <BoxRoute
              route={route}
              selected={routeSelected}
              transports={routeTransports}
              expandStepId={expandStepId}
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

interface TransportDraft {
  transportLibId: string;
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
    transportLibId: transport.transportLibId ?? '',
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
  readonly expandStepId?: string;
}

function BoxRoute({
  route,
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
  expandStepId,
}: BoxRouteProps) {
  const [routeCost, setRouteCost] = useState(route.costAmount?.toString() ?? '');
  const [routeCurrency, setRouteCurrency] = useState(route.costCurrency ?? defaultCurrency ?? '');
  const [routeDuration, setRouteDuration] = useState(route.durationMinutes?.toString() ?? '');
  const [routeTransportLibId, setRouteTransportLibId] = useState(route.transportLibId ?? '');

  const saveRouteFields = async (): Promise<void> => {
    try {
      await updateDbTpRoute(route.id, {
        costAmount: routeCost === '' ? null : Number(routeCost),
        costCurrency: routeCurrency === '' ? null : routeCurrency,
        durationMinutes: routeDuration === '' ? null : Number(routeDuration),
        transportLibId: routeTransportLibId === '' ? null : routeTransportLibId,
      });
      await onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={2} opacity={selected ? 1 : 0.85} minW={0} maxW="100%">
      <TripTpMoneyField
        amountLabel="Option price"
        amount={routeCost}
        currency={routeCurrency}
        disabled={mutationsDisabled}
        onChange={({amount, currency}) => {
          setRouteCost(amount);
          setRouteCurrency(currency);
        }}
      />
      <Field.Root maxW="12rem">
        <Field.Label>Duration (min)</Field.Label>
        <Input value={routeDuration} onChange={(e) => setRouteDuration(e.target.value)} size="sm" disabled={mutationsDisabled} />
      </Field.Root>
      <TripTpTransportLibSelect
        label="Whole-option transport (library)"
        value={routeTransportLibId}
        transportLib={transportLib}
        disabled={mutationsDisabled}
        onChange={setRouteTransportLibId}
      />
      <Button size="xs" alignSelf="flex-start" disabled={mutationsDisabled} onClick={() => void saveRouteFields()}>
        {pending === 'saveRoute' ? 'Saving route…' : 'Save route option'}
      </Button>
      <HStack justify="space-between">
        <Text fontWeight="medium">Steps</Text>
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
          defaultOpen={t.id === expandStepId}
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
  defaultOpen,
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
  readonly defaultOpen?: boolean;
}) {
  const [draft, setDraft] = useState(() => transportDraft(transport, tripTimezone, defaultCurrency));
  const [fromTypeFilter, setFromTypeFilter] = useState('');
  const [toTypeFilter, setToTypeFilter] = useState('');

  const lib = draft.transportLibId !== ''
    ? transportLib.find((t) => t.id === draft.transportLibId)
    : undefined;
  const label = lib?.label ?? transport.mode;
  const from =
    locationPlaceName(locations, draft.fromLocationId, draft.fromPlace) || '—';
  const to =
    locationPlaceName(locations, draft.toLocationId, draft.toPlace) || '—';
  const timeSummary =
    transport.departAt !== undefined && transport.arriveAt !== undefined
      ? `${formatTpInstant(transport.departAt, draft.departTimezone)} → ${formatTpInstant(transport.arriveAt, draft.arriveTimezone)}`
      : '';
  const collapsedTitle = [label, `${from} → ${to}`, timeSummary].filter((part) => part !== '').join(' · ');

  return (
    <TripTpCollapsible title={collapsedTitle} defaultOpen={defaultOpen ?? false}>
    <Stack gap={2} pl={2} borderLeftWidth="2px" minW={0} maxW="100%">
      <TripTpDoneCheckbox
        checked={draft.done}
        disabled={mutationsDisabled}
        ariaLabel={draft.done ? 'Mark route step not done' : 'Mark route step done'}
        tooltip="Done for this route step only — independent of the linked transport on the journey."
        onCheckedChange={(v) => setDraft({...draft, done: v})}
      />
      <TripTpTransportLibSelect
        label="Transport"
        value={draft.transportLibId}
        transportLib={transportLib}
        disabled={mutationsDisabled}
        onChange={(id) => setDraft({...draft, transportLibId: id})}
      />
      <HStack wrap="wrap" align="flex-start" minW={0} maxW="100%">
        <TripTpLocationSelect
          label="From location"
          value={draft.fromLocationId}
          locations={locations}
          typeFilter={fromTypeFilter}
          disabled={mutationsDisabled}
          onTypeFilterChange={setFromTypeFilter}
          onChange={(id) => setDraft({...draft, fromLocationId: id, fromPlace: locationPlaceName(locations, id, draft.fromPlace)})}
        />
        <TripTpLocationSelect
          label="To location"
          value={draft.toLocationId}
          locations={locations}
          typeFilter={toTypeFilter}
          disabled={mutationsDisabled}
          onTypeFilterChange={setToTypeFilter}
          onChange={(id) => setDraft({...draft, toLocationId: id, toPlace: locationPlaceName(locations, id, draft.toPlace)})}
        />
      </HStack>
      <Field.Root>
        <Field.Label>Duration (min)</Field.Label>
        <Input value={draft.durationMinutes} onChange={(e) => setDraft({...draft, durationMinutes: e.target.value})} disabled={mutationsDisabled} />
      </Field.Root>
      <TripTpTimestampField
        label="Depart"
        date={draft.departDate}
        time={draft.departTime}
        timezone={draft.departTimezone}
        disabled={mutationsDisabled}
        onChange={(next) => setDraft({...draft, departDate: next.date, departTime: next.time, departTimezone: next.timezone})}
      />
      <TripTpTimestampField
        label="Arrive"
        date={draft.arriveDate}
        time={draft.arriveTime}
        timezone={draft.arriveTimezone}
        disabled={mutationsDisabled}
        onChange={(next) => setDraft({...draft, arriveDate: next.date, arriveTime: next.time, arriveTimezone: next.timezone})}
      />
      <TripTpMoneyField
        amountLabel="Step cost"
        amount={draft.cost}
        currency={draft.currency}
        disabled={mutationsDisabled}
        onChange={({amount, currency}) => setDraft({...draft, cost: amount, currency})}
      />
      <Field.Root>
        <Field.Label>Booking ref</Field.Label>
        <Input value={draft.bookingRef} onChange={(e) => setDraft({...draft, bookingRef: e.target.value})} disabled={mutationsDisabled} />
      </Field.Root>
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
    </TripTpCollapsible>
  );
}
