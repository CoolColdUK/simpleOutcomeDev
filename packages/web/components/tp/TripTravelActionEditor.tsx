'use client';

import {useMemo, useState} from 'react';
import {Alert, Button, Field, HStack, Input, NativeSelect, Stack, Text, Textarea} from '@chakra-ui/react';
import {formatTpInstant} from '@so/model';
import type {DbTpAction, DbTpDestination, DbTpRoute, DbTpTransport} from '@/lib/api/db/tp/loadDbTpWorkspace';
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
  readonly tripTimezone: string;
  readonly defaultCurrency?: string;
  readonly canWrite: boolean;
  readonly onSaved: () => void;
  readonly onError: (message: string) => void;
}

export default function TripTravelActionEditor({
  podId,
  tripId,
  userId,
  action,
  routes,
  transports,
  attachments,
  destinations,
  tripTimezone,
  defaultCurrency,
  canWrite,
  onSaved,
  onError,
}: TripTravelActionEditorProps) {
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

  const saveAction = async (): Promise<void> => {
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
      });
      if (selectedRouteId !== undefined && selectedRouteTransports.length === 1) {
        const only = selectedRouteTransports[0];
        await updateDbTpTransport(only.id, {fromPlace, toPlace});
      }
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const addRoute = async (): Promise<void> => {
    try {
      const id = await createDbTpRoute(action.id, `Option ${actionRoutes.length + 1}`, actionRoutes.length);
      if (actionRoutes.length === 0) {
        await selectDbTpRoute(action.id, id);
      }
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const pickRoute = async (routeId: string): Promise<void> => {
    try {
      await selectDbTpRoute(action.id, routeId);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const removeRoute = async (routeId: string): Promise<void> => {
    try {
      await deleteDbTpRoute(routeId);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const addTransport = async (routeId: string): Promise<void> => {
    try {
      const count = transports.filter((t) => t.routeId === routeId).length;
      await createDbTpTransport(routeId, count);
      onSaved();
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
        departAt: tpInstantFromParts(draft.departDate, draft.departTime, draft.departTimezone) ?? null,
        arriveAt: tpInstantFromParts(draft.arriveDate, draft.arriveTime, draft.arriveTimezone) ?? null,
        departTimezone: draft.departTimezone,
        arriveTimezone: draft.arriveTimezone,
        costAmount: draft.cost === '' ? null : Number(draft.cost),
        costCurrency: draft.currency === '' ? null : draft.currency,
        bookingRef: draft.bookingRef,
        notes: draft.notes,
      });
      onSaved();
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
        </Stack>
      </HStack>
      <Field.Root>
        <Field.Label>Notes</Field.Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field.Root>
      <Button size="sm" colorPalette="brand" onClick={() => void saveAction()}>Save journey</Button>
      {multimodalWarning !== '' ? (
        <Alert.Root status="warning" size="sm">
          <Alert.Description>{multimodalWarning}</Alert.Description>
        </Alert.Root>
      ) : null}
      <HStack justify="space-between">
        <Text fontWeight="medium">Routes</Text>
        <Button size="xs" onClick={() => void addRoute()}>+ Route</Button>
      </HStack>
      {actionRoutes.map((route) => (
        <BoxRoute
          key={route.id}
          route={route}
          selected={route.id === selectedRouteId}
          transports={transports.filter((t) => t.routeId === route.id)}
          tripTimezone={tripTimezone}
          defaultCurrency={defaultCurrency}
          podId={podId}
          tripId={tripId}
          userId={userId}
          attachments={attachments}
          onPick={() => void pickRoute(route.id)}
          onDelete={() => void removeRoute(route.id)}
          onAddTransport={() => void addTransport(route.id)}
          onSaveTransport={saveTransport}
          onRemoveTransport={(id) => void deleteDbTpTransport(id).then(onSaved).catch((e) => onError(String(e)))}
          onChanged={onSaved}
          onError={onError}
        />
      ))}
    </Stack>
  );
}

interface TransportDraft {
  mode: string;
  fromPlace: string;
  toPlace: string;
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
  };
}

interface BoxRouteProps {
  readonly route: DbTpRoute;
  readonly selected: boolean;
  readonly transports: readonly DbTpTransport[];
  readonly tripTimezone: string;
  readonly defaultCurrency?: string;
  readonly podId: string;
  readonly tripId: string;
  readonly userId: string;
  readonly attachments: readonly DbTpAttachment[];
  readonly onPick: () => void;
  readonly onDelete: () => void;
  readonly onAddTransport: () => void;
  readonly onSaveTransport: (transport: DbTpTransport, draft: TransportDraft) => Promise<void>;
  readonly onRemoveTransport: (id: string) => void;
  readonly onChanged: () => void;
  readonly onError: (message: string) => void;
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
}: BoxRouteProps) {
  return (
    <Stack borderWidth="1px" borderRadius="md" p={3} gap={2} opacity={selected ? 1 : 0.85}>
      <HStack justify="space-between">
        <Text fontWeight="medium">{route.name}{selected ? ' (selected)' : ''}</Text>
        <HStack>
          {!selected ? <Button size="xs" onClick={onPick}>Select</Button> : null}
          <Button size="xs" variant="outline" colorPalette="red" onClick={onDelete}>Delete</Button>
        </HStack>
      </HStack>
      <Button size="xs" alignSelf="flex-start" onClick={onAddTransport}>+ Transport</Button>
      {transports.map((t) => (
        <TransportRow
          key={t.id}
          transport={t}
          tripTimezone={tripTimezone}
          defaultCurrency={defaultCurrency}
          podId={podId}
          tripId={tripId}
          userId={userId}
          attachments={attachments}
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
  tripTimezone,
  defaultCurrency,
  podId,
  tripId,
  userId,
  attachments,
  onSave,
  onRemove,
  onChanged,
  onError,
}: {
  readonly transport: DbTpTransport;
  readonly tripTimezone: string;
  readonly defaultCurrency?: string;
  readonly podId: string;
  readonly tripId: string;
  readonly userId: string;
  readonly attachments: readonly DbTpAttachment[];
  readonly onSave: (draft: TransportDraft) => Promise<void>;
  readonly onRemove: () => void;
  readonly onChanged: () => void;
  readonly onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState(() => transportDraft(transport, tripTimezone, defaultCurrency));

  const summary =
    transport.departAt !== undefined && transport.arriveAt !== undefined
      ? `${formatTpInstant(transport.departAt, draft.departTimezone)} → ${formatTpInstant(transport.arriveAt, draft.arriveTimezone)}`
      : '';

  return (
    <Stack gap={2} pl={2} borderLeftWidth="2px">
      {summary !== '' ? <Text fontSize="xs" color="fg.muted">{summary}</Text> : null}
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
        <Button size="xs" colorPalette="brand" onClick={() => void onSave(draft)}>Save segment</Button>
        <Button size="xs" variant="outline" colorPalette="red" onClick={onRemove}>Remove</Button>
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
