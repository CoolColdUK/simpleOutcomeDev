'use client';

import {useState, type ReactNode} from 'react';
import {Box, Button, Link, Stack, Text} from '@chakra-ui/react';
import {formatTpInstant, tpRouteIsSelected, tpRouteOptionSummary} from '@so/model';
import type {
  DbTpAction,
  DbTpActionTransport,
  DbTpLocation,
  DbTpRoute,
  DbTpTransport,
  DbTpTransportLib,
} from '@/lib/api/db/tp/loadDbTpWorkspace';
import TripTpDoneCheckbox from '@/components/tp/TripTpDoneCheckbox';
import tpFormatLocationTime from '@/components/tp/tpFormatLocationTime';
import updateDbTpActionTransport from '@/lib/api/db/tp/updateDbTpActionTransport';
import updateDbTpTransport from '@/lib/api/db/tp/updateDbTpTransport';

export interface TripTravelActionDetailsProps {
  readonly action: DbTpAction;
  readonly routes: readonly DbTpRoute[];
  readonly transports: readonly DbTpTransport[];
  readonly locations: readonly DbTpLocation[];
  readonly transportLib: readonly DbTpTransportLib[];
  readonly actionTransports: readonly DbTpActionTransport[];
  readonly canWrite: boolean;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
}

function trimTime(t: string | undefined): string {
  if (t === undefined) {
    return '';
  }
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function locName(locations: readonly DbTpLocation[], id?: string): string | undefined {
  if (id === undefined) {
    return undefined;
  }
  return locations.find((l) => l.id === id)?.name;
}

function endpointBlock(
  label: string,
  place: string | undefined,
  location: DbTpLocation | undefined,
  mapsUrl: string | undefined,
) {
  const name = location?.name ?? (place !== undefined && place !== '' ? place : undefined);
  if (name === undefined) {
    return null;
  }
  const openT = location !== undefined ? tpFormatLocationTime(location.openTime) : undefined;
  const closeT = location !== undefined ? tpFormatLocationTime(location.closeTime) : undefined;
  const hours =
    openT !== undefined && closeT !== undefined
      ? `${openT}–${closeT}`
      : openT !== undefined
        ? `Opens ${openT}`
        : closeT !== undefined
          ? `Closes ${closeT}`
          : undefined;
  return (
    <Stack key={label} gap={0}>
      <Text fontWeight="medium">{label}: {name}</Text>
      {location?.address !== undefined && location.address !== '' ? <Text>{location.address}</Text> : null}
      {hours !== undefined ? <Text>{hours}</Text> : null}
      {location?.website !== undefined && location.website !== '' ? (
        <Link href={location.website} target="_blank" rel="noopener noreferrer">{location.website}</Link>
      ) : null}
      {location?.email !== undefined && location.email !== '' ? <Text>{location.email}</Text> : null}
      {location?.phone !== undefined && location.phone !== '' ? <Text>{location.phone}</Text> : null}
      {mapsUrl !== undefined && mapsUrl !== '' ? (
        <Link href={mapsUrl} target="_blank" rel="noopener noreferrer">Map</Link>
      ) : null}
    </Stack>
  );
}

function effectiveMinutes(link: DbTpActionTransport, lib?: DbTpTransportLib): number | undefined {
  return link.durationMinutes ?? lib?.durationMinutes;
}

function effectiveCost(link: DbTpActionTransport, lib?: DbTpTransportLib): number | undefined {
  return link.costAmount ?? lib?.costAmount;
}

function effectiveCurrency(link: DbTpActionTransport, lib?: DbTpTransportLib): string | undefined {
  return link.costCurrency ?? lib?.costCurrency;
}

function TripTravelRouteOptionDetails({
  route,
  selectedRouteId,
  steps,
  locations,
  transportLib,
  canWrite,
  onReload,
  onError,
}: {
  readonly route: DbTpRoute;
  readonly selectedRouteId?: string;
  readonly steps: readonly DbTpTransport[];
  readonly locations: readonly DbTpLocation[];
  readonly transportLib: readonly DbTpTransportLib[];
  readonly canWrite: boolean;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busyStepId, setBusyStepId] = useState<string | undefined>();
  const isSelected = tpRouteIsSelected(route.id, selectedRouteId, route.isSelected);
  const summary = tpRouteOptionSummary({
    name: route.name,
    isSelected,
    steps: steps.map((s) => ({
      fromPlace: s.fromPlace,
      toPlace: s.toPlace,
      fromLocationName: locName(locations, s.fromLocationId),
      toLocationName: locName(locations, s.toLocationId),
      costAmount: s.costAmount,
      costCurrency: s.costCurrency,
      departAt: s.departAt,
      departTimezone: s.departTimezone,
      arriveAt: s.arriveAt,
      arriveTimezone: s.arriveTimezone,
    })),
  });
  const bodyId = `travel-route-${route.id}`;

  const toggleStepDone = async (step: DbTpTransport, done: boolean): Promise<void> => {
    setBusyStepId(step.id);
    try {
      await updateDbTpTransport(step.id, {done});
      await onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyStepId(undefined);
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden">
      <Button
        variant="ghost"
        width="full"
        justifyContent="space-between"
        fontWeight="medium"
        fontSize="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <Text textAlign="left">{summary}</Text>
        <Text as="span" color="fg.muted" fontSize="sm">{open ? '−' : '+'}</Text>
      </Button>
      {open ? (
        <Stack id={bodyId} gap={2} p={3} pt={0} borderTopWidth="1px" fontSize="sm">
          {steps.length === 0 ? <Text color="fg.muted">No steps.</Text> : null}
          {steps.map((step) => {
            const lib = step.transportLibId !== undefined
              ? transportLib.find((t) => t.id === step.transportLibId)
              : undefined;
            const label = lib?.label ?? step.mode;
            const from =
              locName(locations, step.fromLocationId) ?? (step.fromPlace !== undefined && step.fromPlace !== '' ? step.fromPlace : '—');
            const to =
              locName(locations, step.toLocationId) ?? (step.toPlace !== undefined && step.toPlace !== '' ? step.toPlace : '—');
            const time =
              step.departAt !== undefined && step.arriveAt !== undefined
                ? `${formatTpInstant(step.departAt, step.departTimezone ?? 'UTC')} → ${formatTpInstant(step.arriveAt, step.arriveTimezone ?? step.departTimezone ?? 'UTC')}`
                : undefined;
            return (
              <HStackStepRow key={step.id}>
                <TripTpDoneCheckbox
                  checked={step.done}
                  disabled={!canWrite}
                  busy={busyStepId === step.id}
                  ariaLabel={step.done ? `Mark step ${from} to ${to} not done` : `Mark step ${from} to ${to} done`}
                  tooltip="Done for this route step only — independent of the linked transport on the journey."
                  onCheckedChange={(v) => void toggleStepDone(step, v)}
                />
                <Stack gap={0} flex="1">
                  <Text fontWeight="medium">{label}</Text>
                  <Text>{from} → {to}</Text>
                  {step.durationMinutes !== undefined ? <Text>{step.durationMinutes} min</Text> : null}
                  {step.costAmount !== undefined ? (
                    <Text>{step.costCurrency !== undefined ? `${step.costCurrency} ` : ''}{step.costAmount}</Text>
                  ) : null}
                  {time !== undefined ? <Text color="fg.muted">{time}</Text> : null}
                </Stack>
              </HStackStepRow>
            );
          })}
        </Stack>
      ) : null}
    </Box>
  );
}

function HStackStepRow({children}: {readonly children: ReactNode}) {
  return (
    <Box display="flex" gap={2} alignItems="flex-start">
      {children}
    </Box>
  );
}

export default function TripTravelActionDetails({
  action,
  routes,
  transports,
  locations,
  transportLib,
  actionTransports,
  canWrite,
  onReload,
  onError,
}: TripTravelActionDetailsProps) {
  const [open, setOpen] = useState(false);
  const [busyLinkId, setBusyLinkId] = useState<string | undefined>();
  const actionRoutes = routes.filter((r) => r.actionId === action.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const selectedRouteId = action.selectedRouteId ?? actionRoutes.find((r) => r.isSelected)?.id;
  const travelLinks = actionTransports
    .filter((l) => l.actionId === action.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const fromLoc = locations.find((l) => l.id === action.fromLocationId);
  const toLoc = locations.find((l) => l.id === action.toLocationId);
  const start = trimTime(action.startTime);
  const end = trimTime(action.endTime);
  const hasTime = start !== '' || end !== '';
  const hasCost = action.costAmount !== undefined || (action.costCurrency !== undefined && action.costCurrency !== '');
  const hasNotes = action.notes !== undefined && action.notes !== '';
  const hasJourney =
    fromLoc !== undefined ||
    toLoc !== undefined ||
    (action.fromPlace !== undefined && action.fromPlace !== '') ||
    (action.toPlace !== undefined && action.toPlace !== '') ||
    hasTime ||
    action.durationMinutes !== undefined ||
    hasCost ||
    hasNotes ||
    travelLinks.length > 0;
  const bodyId = `travel-details-${action.id}`;

  const toggleLinkDone = async (link: DbTpActionTransport, done: boolean): Promise<void> => {
    setBusyLinkId(link.id);
    try {
      await updateDbTpActionTransport(link.id, {done});
      await onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyLinkId(undefined);
    }
  };

  return (
    <Box pt={2}>
      <Button
        variant="ghost"
        size="sm"
        width="full"
        justifyContent="space-between"
        fontWeight="medium"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        Details
        <Text as="span" color="fg.muted" fontSize="sm">{open ? '−' : '+'}</Text>
      </Button>
      {open ? (
        <Stack id={bodyId} gap={2} pt={2} fontSize="sm">
          {!hasJourney && actionRoutes.length === 0 ? <Text color="fg.muted">No extra details.</Text> : null}
          {endpointBlock('From', action.fromPlace, fromLoc, action.fromMapsUrl)}
          {endpointBlock('To', action.toPlace, toLoc, action.toMapsUrl)}
          {hasTime ? (
            <Text>
              {start !== '' && end !== '' ? `${start}–${end}` : start !== '' ? start : end}
            </Text>
          ) : null}
          {action.durationMinutes !== undefined ? <Text>{action.durationMinutes} min</Text> : null}
          {hasCost ? (
            <Text>
              {action.costCurrency !== undefined ? `${action.costCurrency} ` : ''}
              {action.costAmount ?? ''}
            </Text>
          ) : null}
          {travelLinks.length > 0 ? (
            <Stack gap={2}>
              <Text fontWeight="medium">Linked transports</Text>
              {travelLinks.map((link) => {
                const lib = transportLib.find((t) => t.id === link.transportLibId);
                const mins = effectiveMinutes(link, lib);
                const cost = effectiveCost(link, lib);
                const currency = effectiveCurrency(link, lib);
                const fromId = link.fromLocationId ?? lib?.fromLocationId;
                const toId = link.toLocationId ?? lib?.toLocationId;
                const from = locName(locations, fromId) ?? '—';
                const to = locName(locations, toId) ?? '—';
                return (
                  <Box key={link.id} display="flex" gap={2} alignItems="flex-start" pl={2} borderLeftWidth="2px">
                    <TripTpDoneCheckbox
                      checked={link.done}
                      disabled={!canWrite}
                      busy={busyLinkId === link.id}
                      ariaLabel={link.done ? `Mark transport ${lib?.label ?? 'link'} not done` : `Mark transport ${lib?.label ?? 'link'} done`}
                      tooltip="Done for this travel link only — not the route step or transport library."
                      onCheckedChange={(v) => void toggleLinkDone(link, v)}
                    />
                    <Stack gap={0} flex="1">
                      <Text fontWeight="medium">{lib?.label ?? 'Transport'}</Text>
                      {mins !== undefined ? <Text>{mins} min</Text> : null}
                      {cost !== undefined ? (
                        <Text>{currency !== undefined ? `${currency} ` : ''}{cost}</Text>
                      ) : null}
                      <Text>{from} → {to}</Text>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          ) : null}
          {hasNotes ? <Text whiteSpace="pre-wrap">{action.notes}</Text> : null}
          {actionRoutes.length > 0 ? (
            <Stack gap={2}>
              <Text fontWeight="medium">Route options</Text>
              {actionRoutes.map((route) => (
                <TripTravelRouteOptionDetails
                  key={route.id}
                  route={route}
                  selectedRouteId={selectedRouteId}
                  steps={transports.filter((t) => t.routeId === route.id).sort((a, b) => a.sortOrder - b.sortOrder)}
                  locations={locations}
                  transportLib={transportLib}
                  canWrite={canWrite}
                  onReload={onReload}
                  onError={onError}
                />
              ))}
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}
