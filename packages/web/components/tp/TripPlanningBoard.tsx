'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Field,
  Heading,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {ArrowDownIcon, ArrowUpIcon, CrossIcon, DeleteIcon, EditIcon} from '@so/component';
import {
  canWriteTpPod,
  TpActionKind,
  tpActionDayCardSummary,
  tpActiveDestinationsForDay,
  tpBudgetRollup,
  tpDayTimelineEntries,
  tpDefaultSelectedDayId,
  tpTagsFromLocationNotes,
  TpTripStatus,
  type PodRole,
} from '@so/model';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import TripActivityActionDetails from '@/components/tp/TripActivityActionDetails';
import TripDayCardTags from '@/components/tp/TripDayCardTags';
import TripTravelActionDetails from '@/components/tp/TripTravelActionDetails';
import TripTpDoneCheckbox from '@/components/tp/TripTpDoneCheckbox';
import loadDbTpWorkspace, {type DbTpAction, type DbTpWorkspace} from '@/lib/api/db/tp/loadDbTpWorkspace';
import {deleteDbTpActionForBrowser} from '@/lib/api/db/tp/deleteDbTpAction';
import createDbTpTripBundle from '@/lib/api/db/tp/createDbTpTripBundle';
import updateDbTpDay from '@/lib/api/db/tp/updateDbTpDay';
import createDbTpAction from '@/lib/api/db/tp/createDbTpAction';
import updateDbTpDestination from '@/lib/api/db/tp/updateDbTpDestination';
import updateDbTpAction from '@/lib/api/db/tp/updateDbTpAction';
import updateDbTpActionSortOrders from '@/lib/api/db/tp/updateDbTpActionSortOrders';
import createDbTpRoute from '@/lib/api/db/tp/createDbTpRoute';
import selectDbTpRoute from '@/lib/api/db/tp/selectDbTpRoute';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import TripStayActionEditor from '@/components/tp/TripStayActionEditor';
import TripTravelActionEditor from '@/components/tp/TripTravelActionEditor';
import TripSimpleActionEditor from '@/components/tp/TripSimpleActionEditor';
import TripActivityActionEditor from '@/components/tp/TripActivityActionEditor';
import TripTripCatalogPanel from '@/components/tp/TripTripCatalogPanel';
import TripTpAttachmentPanel from '@/components/tp/TripTpAttachmentPanel';
import TripTpCollapsible from '@/components/tp/TripTpCollapsible';

export interface TripPlanningBoardProps {
  readonly podId: string;
  readonly podRole: PodRole | undefined;
  readonly isSpaceOwner: boolean;
}

export default function TripPlanningBoard({podId, podRole, isSpaceOwner}: TripPlanningBoardProps) {
  const canWrite = canWriteTpPod(podRole, isSpaceOwner);
  const {user} = useSupabaseAuthState();
  const userId = user?.id ?? '';
  const [data, setData] = useState<DbTpWorkspace | undefined>(undefined);
  const [selectedDayId, setSelectedDayId] = useState<string | undefined>(undefined);
  const [expandedActionId, setExpandedActionId] = useState<string | undefined>(undefined);
  const [busyActionDoneId, setBusyActionDoneId] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [wizardTitle, setWizardTitle] = useState('');
  const [wizardStart, setWizardStart] = useState('');
  const [wizardEnd, setWizardEnd] = useState('');
  const [wizardTz, setWizardTz] = useState('UTC');
  const [wizardDestinations, setWizardDestinations] = useState('Tokyo\nHong Kong');

  const reload = useCallback(async (): Promise<void> => {
    const next = await loadDbTpWorkspace(podId);
    setData(next);
    setSelectedDayId((current) => {
      if (current !== undefined && next.days.some((d) => d.id === current)) {
        return current;
      }
      const tripTz = next.trip?.timezone ?? 'UTC';
      return tpDefaultSelectedDayId(
        next.days.map((d) => ({id: d.id, calendarDate: d.calendarDate})),
        tripTz,
      ) ?? next.days[0]?.id;
    });
  }, [podId]);

  useEffect(() => {
    void Promise.resolve().then(() =>
      reload().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e))),
    );
  }, [reload]);

  const selectedDay = data?.days.find((d) => d.id === selectedDayId);
  const trip = data?.trip;

  const activeDestinationIds = useMemo(() => {
    if (trip === undefined || selectedDay === undefined || data === undefined) {
      return [];
    }
    const stays = data.actions
      .filter((a) => a.kind === TpActionKind.STAY)
      .map((a) => ({
        destinationId: a.destinationId,
        checkInAt: a.checkInAt,
        checkOutAt: a.checkOutAt,
        checkInTimezone: a.checkInTimezone,
        checkOutTimezone: a.checkOutTimezone,
        placeText: a.placeText,
      }));
    const transports = data.transports
      .filter((t) => {
        const route = data.routes.find((r) => r.id === t.routeId);
        if (route === undefined) {
          return false;
        }
        const action = data.actions.find((a) => a.id === route.actionId);
        return action?.selectedRouteId === route.id || route.isSelected;
      })
      .map((t) => ({
        departAt: t.departAt,
        arriveAt: t.arriveAt,
        departTimezone: t.departTimezone,
        arriveTimezone: t.arriveTimezone,
        fromDestinationId: data.actions.find((a) => data.routes.some((r) => r.id === t.routeId && r.actionId === a.id))
          ?.fromDestinationId,
        toDestinationId: data.actions.find((a) => data.routes.some((r) => r.id === t.routeId && r.actionId === a.id))
          ?.toDestinationId,
        fromPlace: t.fromPlace,
        toPlace: t.toPlace,
      }));
    return tpActiveDestinationsForDay({
      dayId: selectedDay.id,
      calendarDate: selectedDay.calendarDate,
      tripTimezone: trip.timezone,
      primaryDestinationId: selectedDay.primaryDestinationId,
      destinations: data.destinations.map((d) => ({
        id: d.id,
        name: d.name,
        activeStartDate: d.activeStartDate,
        activeEndDate: d.activeEndDate,
      })),
      dayDestinationLinks: data.dayDestinationLinks,
      stays,
      transports,
    });
  }, [data, selectedDay, trip]);

  const timeline = useMemo(() => {
    if (data === undefined || trip === undefined || selectedDay === undefined) {
      return [];
    }
    const travels = data.actions
      .filter((a) => a.kind === TpActionKind.TRAVEL)
      .map((a) => {
        const routeId = a.selectedRouteId ?? data.routes.find((r) => r.actionId === a.id && r.isSelected)?.id;
        const routeTransports = data.transports.filter((t) => t.routeId === routeId);
        const dep = routeTransports.map((t) => t.departAt).filter((x): x is string => x !== undefined).sort()[0];
        const arr = routeTransports.map((t) => t.arriveAt).filter((x): x is string => x !== undefined).sort().reverse()[0];
        return {
          actionId: a.id,
          anchorDayId: a.anchorDayId,
          sortOrder: a.sortOrder,
          title: a.title,
          spanStartIso: dep,
          spanEndIso: arr,
        };
      });
    return tpDayTimelineEntries({
      dayId: selectedDay.id,
      calendarDate: selectedDay.calendarDate,
      tripTimezone: trip.timezone,
      actions: data.actions.map((a) => ({
        id: a.id,
        kind: a.kind as TpActionKind,
        anchorDayId: a.anchorDayId,
        sortOrder: a.sortOrder,
        title: a.title,
      })),
      stays: data.actions
        .filter((a) => a.kind === TpActionKind.STAY)
        .map((a) => ({
          actionId: a.id,
          checkInAt: a.checkInAt ?? '',
          checkOutAt: a.checkOutAt ?? '',
        })),
      travels,
    });
  }, [data, selectedDay, trip]);

  const budgetTotal = useMemo(() => {
    if (data === undefined) {
      return 0;
    }
    return tpBudgetRollup(
      data.actions.map((a) => ({
        kind: a.kind as TpActionKind,
        costAmount: a.costAmount,
        selectedRouteId: a.selectedRouteId,
      })),
      data.transports.map((t) => ({routeId: t.routeId, costAmount: t.costAmount})),
    );
  }, [data]);

  const createTrip = async (): Promise<void> => {
    try {
      await createDbTpTripBundle({
        podId,
        title: wizardTitle.trim(),
        timezone: wizardTz.trim() || 'UTC',
        startDate: wizardStart,
        endDate: wizardEnd,
        destinationNames: wizardDestinations.split('\n'),
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const saveDayHeader = async (): Promise<void> => {
    if (selectedDay === undefined || !canWrite) {
      return;
    }
    try {
      await updateDbTpDay(selectedDay.id, {
        dayTitle: selectedDay.dayTitle,
        dayNotes: selectedDay.dayNotes,
        primaryDestinationId: selectedDay.primaryDestinationId ?? null,
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const canonicalTimelineIds = useMemo(
    () => timeline.filter((e) => e.displayMode === 'canonical').map((e) => e.actionId),
    [timeline],
  );

  const moveCanonicalAction = async (actionId: string, direction: 'up' | 'down'): Promise<void> => {
    if (!canWrite) {
      return;
    }
    const ids = [...canonicalTimelineIds];
    const idx = ids.indexOf(actionId);
    if (idx < 0) {
      return;
    }
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= ids.length) {
      return;
    }
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    try {
      await updateDbTpActionSortOrders(ids);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onEditorSaved = (): Promise<void> =>
    reload().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    });

  const onEditorError = (message: string): void => setError(message);

  const toggleActionDone = async (actionId: string, done: boolean): Promise<void> => {
    setBusyActionDoneId(actionId);
    try {
      await updateDbTpAction(actionId, {done});
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyActionDoneId(undefined);
    }
  };

  const addAction = async (kind: TpActionKind): Promise<void> => {
    if (trip === undefined || selectedDay === undefined || !canWrite) {
      return;
    }
    const title =
      kind === TpActionKind.NOTE ? 'Note' : kind === TpActionKind.ACTIVITY ? 'Activity' : kind === TpActionKind.STAY ? 'Stay' : 'Travel';
    try {
      const actionId = await createDbTpAction({
        tripId: trip.id,
        anchorDayId: selectedDay.id,
        kind,
        title,
        sortOrder: data?.actions.filter((a) => a.anchorDayId === selectedDay.id).length ?? 0,
      });
      if (kind === TpActionKind.TRAVEL) {
        const routeId = await createDbTpRoute(actionId, 'Option A', 0);
        await selectDbTpRoute(actionId, routeId);
      }
      setExpandedActionId(actionId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const deleteAction = async (actionId: string): Promise<void> => {
    if (!canWrite) {
      return;
    }
    const action = data?.actions.find((a) => a.id === actionId);
    if (action === undefined) {
      return;
    }
    const ok = window.confirm(
      `Delete this ${action.kind} (“${action.title}”)? It will be removed from every day on the trip.`,
    );
    if (!ok) {
      return;
    }
    try {
      await deleteDbTpActionForBrowser(actionId);
      setExpandedActionId((current) => (current === actionId ? undefined : current));
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const actionCardSummary = (action: DbTpAction): string => {
    if (data === undefined) {
      return action.title;
    }
    const routeId = action.selectedRouteId ?? data.routes.find((r) => r.actionId === action.id && r.isSelected)?.id;
    const selectedRoute = routeId !== undefined ? data.routes.find((r) => r.id === routeId) : undefined;
    const routeTransports = data.transports.filter((t) => t.routeId === routeId);
    const dep = routeTransports.map((t) => t.departAt).filter((x): x is string => x !== undefined).sort()[0];
    const arr = routeTransports.map((t) => t.arriveAt).filter((x): x is string => x !== undefined).sort().reverse()[0];
    const depTz = routeTransports.find((t) => t.departAt === dep)?.departTimezone;
    const arrTz = routeTransports.find((t) => t.arriveAt === arr)?.arriveTimezone;
    const locName = (id?: string): string | undefined =>
      id === undefined ? undefined : data.locations.find((l) => l.id === id)?.name;
    const linkedLocationNames = data.actionLocations
      .filter((l) => l.actionId === action.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((l) => ({name: locName(l.locationId) ?? 'Location'}));
    const travelTransportLabels = data.actionTransports
      .filter((l) => l.actionId === action.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((l) => data.transportLib.find((t) => t.id === l.transportLibId)?.label ?? 'Transport');
    const summary = tpActionDayCardSummary({
      kind: action.kind,
      title: action.title,
      placeText: action.placeText,
      fromPlace: action.fromPlace ?? locName(action.fromLocationId),
      toPlace: action.toPlace ?? locName(action.toLocationId),
      checkInAt: action.checkInAt,
      checkOutAt: action.checkOutAt,
      checkInTimezone: action.checkInTimezone,
      checkOutTimezone: action.checkOutTimezone,
      startTime: action.startTime,
      endTime: action.endTime,
      durationMinutes: action.durationMinutes,
      notes: action.notes,
      locationNames: linkedLocationNames,
      travelTransportLabels,
      selectedRouteName: selectedRoute?.name,
      travelDepartAt: dep,
      travelArriveAt: arr,
      travelDepartTimezone: depTz,
      travelArriveTimezone: arrTz,
    });
    if (summary === action.title) {
      return '';
    }
    const prefix = `${action.title} · `;
    return summary.startsWith(prefix) ? summary.slice(prefix.length) : summary;
  };

  const updateTripStatus = async (status: TpTripStatus): Promise<void> => {
    if (trip === undefined || !canWrite) {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const {error: err} = await supabase.from('tp_trip').update({status}).eq('id', trip.id);
    throwIfSupabaseError(err);
    await reload();
  };

  if (data === undefined) {
    return <Text>Loading trip…</Text>;
  }

  if (trip === undefined) {
    return (
      <Stack gap={4} maxW="md">
        <Heading size="md">Create your trip</Heading>
        {error !== '' ? <Alert.Root status="error"><Alert.Description>{error}</Alert.Description></Alert.Root> : null}
        <Field.Root>
          <Field.Label>Title</Field.Label>
          <Input value={wizardTitle} onChange={(e) => setWizardTitle(e.target.value)} disabled={!canWrite} />
        </Field.Root>
        <HStack>
          <Field.Root>
            <Field.Label>Start</Field.Label>
            <Input type="date" value={wizardStart} onChange={(e) => setWizardStart(e.target.value)} disabled={!canWrite} />
          </Field.Root>
          <Field.Root>
            <Field.Label>End</Field.Label>
            <Input type="date" value={wizardEnd} onChange={(e) => setWizardEnd(e.target.value)} disabled={!canWrite} />
          </Field.Root>
        </HStack>
        <Field.Root>
          <Field.Label>Timezone (day strip)</Field.Label>
          <Input value={wizardTz} onChange={(e) => setWizardTz(e.target.value)} disabled={!canWrite} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Destinations (one per line)</Field.Label>
          <Textarea value={wizardDestinations} onChange={(e) => setWizardDestinations(e.target.value)} disabled={!canWrite} rows={4} />
        </Field.Root>
        {canWrite ? (
          <Button colorPalette="brand" onClick={() => void createTrip()}>
            Create trip
          </Button>
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack gap={6}>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <HStack justify="space-between" wrap="wrap">
        <Stack gap={0}>
          <Heading size="md">{trip.title}</Heading>
          <Text color="fg.muted">
            {trip.startDate} → {trip.endDate} · {trip.timezone} · {trip.status}
          </Text>
          {trip.budgetAmount !== undefined ? (
            <Text>
              Budget: {trip.budgetCurrency ?? ''} {trip.budgetAmount} · Planned: {budgetTotal.toFixed(2)}
            </Text>
          ) : (
            <Text>Planned spend: {budgetTotal.toFixed(2)}</Text>
          )}
        </Stack>
        {canWrite ? (
          <HStack>
            <Button size="sm" variant="outline" onClick={() => void updateTripStatus(TpTripStatus.ACTIVE)}>
              Mark active
            </Button>
            <Button size="sm" variant="outline" onClick={() => void updateTripStatus(TpTripStatus.ARCHIVED)}>
              Archive
            </Button>
          </HStack>
        ) : null}
      </HStack>
      <HStack gap={2} overflowX="auto" pb={2}>
        {data.days.map((day) => (
          <Button
            key={day.id}
            size="sm"
            variant={day.id === selectedDayId ? 'solid' : 'outline'}
            colorPalette="brand"
            onClick={() => setSelectedDayId(day.id)}
          >
            {day.dayTitle ?? day.calendarDate}
          </Button>
        ))}
      </HStack>
      {selectedDay !== undefined ? (
        <Stack gap={4}>
          <Box borderWidth="1px" borderRadius="md" p={4}>
            <Heading size="sm" mb={2}>Day plan</Heading>
            <Stack gap={2}>
              <Input
                placeholder="Day title"
                value={selectedDay.dayTitle ?? ''}
                onChange={(e) =>
                  setData((prev) =>
                    prev === undefined
                      ? prev
                      : {
                          ...prev,
                          days: prev.days.map((d) => (d.id === selectedDay.id ? {...d, dayTitle: e.target.value} : d)),
                        },
                  )
                }
                onBlur={() => void saveDayHeader()}
                disabled={!canWrite}
              />
              <Textarea
                placeholder="Rough plan for this day"
                value={selectedDay.dayNotes ?? ''}
                onChange={(e) =>
                  setData((prev) =>
                    prev === undefined
                      ? prev
                      : {
                          ...prev,
                          days: prev.days.map((d) => (d.id === selectedDay.id ? {...d, dayNotes: e.target.value} : d)),
                        },
                  )
                }
                onBlur={() => void saveDayHeader()}
                disabled={!canWrite}
                rows={3}
              />
              <Field.Root>
                <Field.Label>Primary destination (override)</Field.Label>
                <NativeSelect.Root disabled={!canWrite}>
                  <NativeSelect.Field
                    value={selectedDay.primaryDestinationId ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setData((prev) =>
                        prev === undefined
                          ? prev
                          : {
                              ...prev,
                              days: prev.days.map((d) =>
                                d.id === selectedDay.id
                                  ? {...d, primaryDestinationId: value === '' ? undefined : value}
                                  : d,
                              ),
                            },
                      );
                    }}
                    onBlur={() => void saveDayHeader()}
                  >
                    <option value="">Auto from stay / travel</option>
                    {data.destinations.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </Stack>
          </Box>
          {activeDestinationIds.length > 0 ? (
            <TripTpCollapsible
              title={
                activeDestinationIds.length === 1
                  ? `Important info · ${data.destinations.find((d) => d.id === activeDestinationIds[0])?.name ?? ''}`
                  : `Important info · ${activeDestinationIds.map((id) => data.destinations.find((d) => d.id === id)?.name).filter(Boolean).join(', ')}`
              }
            >
              {activeDestinationIds.map((destId) => {
                const dest = data.destinations.find((d) => d.id === destId);
                if (dest === undefined) {
                  return null;
                }
                return (
                  <Box key={dest.id}>
                    <Text fontWeight="semibold">{dest.name}</Text>
                    <Text whiteSpace="pre-wrap">{dest.importantInfo ?? 'No details yet.'}</Text>
                  </Box>
                );
              })}
            </TripTpCollapsible>
          ) : null}
          <Stack gap={2}>
            <HStack justify="space-between">
              <Heading size="sm">Actions</Heading>
              {canWrite ? (
                <HStack>
                  <Button size="xs" onClick={() => void addAction(TpActionKind.ACTIVITY)}>+ Activity</Button>
                  <Button size="xs" onClick={() => void addAction(TpActionKind.NOTE)}>+ Note</Button>
                  <Button size="xs" onClick={() => void addAction(TpActionKind.STAY)}>+ Stay</Button>
                  <Button size="xs" onClick={() => void addAction(TpActionKind.TRAVEL)}>+ Travel</Button>
                </HStack>
              ) : null}
            </HStack>
            {timeline.length === 0 ? <Text color="fg.muted">No actions yet.</Text> : null}
            {timeline.map((entry) => {
              const action = data.actions.find((a) => a.id === entry.actionId);
              const expanded = expandedActionId === entry.actionId;
              const canonicalIdx = canonicalTimelineIds.indexOf(entry.actionId);
              const title = action?.title ?? entry.title;
              const activityTags =
                action !== undefined && entry.kind === TpActionKind.ACTIVITY
                  ? tpTagsFromLocationNotes(
                      data.actionLocations
                        .filter((l) => l.actionId === action.id)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((l) => data.locations.find((loc) => loc.id === l.locationId)?.notes),
                    )
                  : [];
              const showCardEdit =
                action === undefined
                  ? false
                  : entry.kind === TpActionKind.ACTIVITY || entry.kind === TpActionKind.TRAVEL
                    ? canWrite && entry.displayMode === 'canonical'
                    : true;
              const showActionDone =
                action !== undefined &&
                (entry.kind === TpActionKind.ACTIVITY ||
                  entry.kind === TpActionKind.STAY ||
                  entry.kind === TpActionKind.TRAVEL);
              return (
                <Box key={`${entry.actionId}-${entry.displayMode}`} borderWidth="1px" borderRadius="md" p={3}>
                  <HStack justify="space-between" wrap="wrap" gap={2} align="flex-start">
                    <HStack align="flex-start">
                      {showActionDone ? (
                        <TripTpDoneCheckbox
                          checked={action.done}
                          disabled={!canWrite}
                          busy={busyActionDoneId === action.id}
                          ariaLabel={
                            action.done
                              ? `Mark ${entry.kind} ${title} not done`
                              : `Mark ${entry.kind} ${title} done`
                          }
                          tooltip="Done for this day card only."
                          onCheckedChange={(v) => void toggleActionDone(action.id, v)}
                        />
                      ) : null}
                      <Badge>{entry.kind}</Badge>
                      {entry.displayMode === 'mirror' ? <Badge variant="outline">mirror</Badge> : null}
                      <Stack gap={1}>
                        <Text fontWeight="medium">{entry.title}</Text>
                        {action !== undefined && actionCardSummary(action) !== '' ? (
                          <Text fontSize="sm" color="fg.muted">{actionCardSummary(action)}</Text>
                        ) : null}
                        {activityTags.length > 0 ? <TripDayCardTags tags={activityTags} max={4} /> : null}
                      </Stack>
                    </HStack>
                    <HStack>
                      {entry.displayMode === 'mirror' && action?.anchorDayId !== undefined ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setSelectedDayId(action.anchorDayId)}
                        >
                          Anchor day
                        </Button>
                      ) : null}
                      {entry.displayMode === 'canonical' && canWrite ? (
                        <>
                          <AppIconTooltip label={`Move ${entry.kind} ${title} up`}>
                            <IconButton
                              aria-label={`Move ${entry.kind} ${title} up`}
                              size="xs"
                              variant="outline"
                              disabled={canonicalIdx <= 0}
                              onClick={() => void moveCanonicalAction(entry.actionId, 'up')}
                            >
                              <ArrowUpIcon size={14} />
                            </IconButton>
                          </AppIconTooltip>
                          <AppIconTooltip label={`Move ${entry.kind} ${title} down`}>
                            <IconButton
                              aria-label={`Move ${entry.kind} ${title} down`}
                              size="xs"
                              variant="outline"
                              disabled={canonicalIdx < 0 || canonicalIdx >= canonicalTimelineIds.length - 1}
                              onClick={() => void moveCanonicalAction(entry.actionId, 'down')}
                            >
                              <ArrowDownIcon size={14} />
                            </IconButton>
                          </AppIconTooltip>
                        </>
                      ) : null}
                      {canWrite ? (
                        <AppIconTooltip label={`Delete ${entry.kind} ${title}`}>
                          <IconButton
                            aria-label={`Delete ${entry.kind} ${title}`}
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => void deleteAction(entry.actionId)}
                          >
                            <DeleteIcon size={14} />
                          </IconButton>
                        </AppIconTooltip>
                      ) : null}
                      {showCardEdit ? (
                        <AppIconTooltip label={expanded ? `Close editor ${title}` : `Edit ${entry.kind} ${title}`}>
                          <IconButton
                            aria-label={expanded ? `Close editor ${title}` : `Edit ${entry.kind} ${title}`}
                            size="xs"
                            variant={expanded ? 'solid' : 'outline'}
                            onClick={() => setExpandedActionId(expanded ? undefined : entry.actionId)}
                          >
                            {expanded ? <CrossIcon size={14} /> : <EditIcon size={14} />}
                          </IconButton>
                        </AppIconTooltip>
                      ) : null}
                    </HStack>
                  </HStack>
                  {action !== undefined && entry.kind === TpActionKind.ACTIVITY && !expanded ? (
                    <TripActivityActionDetails
                      action={action}
                      locations={data.locations}
                      actionLocations={data.actionLocations}
                      canWrite={canWrite}
                      onReload={reload}
                      onError={onEditorError}
                    />
                  ) : null}
                  {action !== undefined && entry.kind === TpActionKind.TRAVEL && !expanded && trip !== undefined ? (
                    <TripTravelActionDetails
                      action={action}
                      routes={data.routes}
                      transports={data.transports}
                      locations={data.locations}
                      transportLib={data.transportLib}
                      actionTransports={data.actionTransports}
                      canWrite={canWrite}
                      onReload={reload}
                      onError={onEditorError}
                    />
                  ) : null}
                  {expanded && action !== undefined && trip !== undefined ? (
                    <Box mt={3} pt={3} borderTopWidth="1px">
                      {action.kind === TpActionKind.STAY ? (
                        <TripStayActionEditor
                          action={action}
                          destinations={data.destinations}
                          tripTimezone={trip.timezone}
                          defaultCurrency={trip.budgetCurrency}
                          canWrite={canWrite && entry.displayMode === 'canonical'}
                          onSaved={onEditorSaved}
                          onError={onEditorError}
                        />
                      ) : null}
                      {action.kind === TpActionKind.TRAVEL ? (
                        <TripTravelActionEditor
                          podId={podId}
                          tripId={trip.id}
                          userId={userId}
                          action={action}
                          routes={data.routes}
                          transports={data.transports}
                          attachments={data.attachments}
                          destinations={data.destinations}
                          locations={data.locations}
                          transportLib={data.transportLib}
                          actionTransports={data.actionTransports}
                          tripTimezone={trip.timezone}
                          defaultCurrency={trip.budgetCurrency}
                          canWrite={canWrite && entry.displayMode === 'canonical'}
                          onSaved={onEditorSaved}
                          onError={onEditorError}
                        />
                      ) : null}
                      {action.kind === TpActionKind.ACTIVITY ? (
                        <TripActivityActionEditor
                          action={action}
                          tripId={trip.id}
                          locations={data.locations}
                          actionLocations={data.actionLocations}
                          defaultCurrency={trip.budgetCurrency}
                          canWrite={canWrite && entry.displayMode === 'canonical'}
                          onSaved={onEditorSaved}
                          onError={onEditorError}
                        />
                      ) : null}
                      {action.kind === TpActionKind.NOTE ? (
                        <TripSimpleActionEditor
                          action={action}
                          defaultCurrency={trip.budgetCurrency}
                          canWrite={canWrite && entry.displayMode === 'canonical'}
                          onSaved={onEditorSaved}
                          onError={onEditorError}
                        />
                      ) : null}
                    </Box>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </Stack>
      ) : null}
      {trip !== undefined ? (
        <TripTripCatalogPanel
          tripId={trip.id}
          locations={data.locations}
          transportLib={data.transportLib}
          defaultCurrency={trip.budgetCurrency}
          canWrite={canWrite}
          onSaved={() => void reload()}
          onError={(message) => setError(message)}
        />
      ) : null}
      <TripTpCollapsible title="Destinations (trip)">
        <Stack gap={4}>
          {data.destinations.map((d) => (
            <Stack key={d.id} gap={2}>
              <Text fontWeight="medium">
                {d.name}
                {d.activeStartDate !== undefined ? ` · ${d.activeStartDate}–${d.activeEndDate ?? '…'}` : ''}
              </Text>
              {canWrite ? (
                <Textarea
                  placeholder="Important / safety info (markdown)"
                  value={d.importantInfo ?? ''}
                  onChange={(e) =>
                    setData((prev) =>
                      prev === undefined
                        ? prev
                        : {
                            ...prev,
                            destinations: prev.destinations.map((x) =>
                              x.id === d.id ? {...x, importantInfo: e.target.value} : x,
                            ),
                          },
                    )
                  }
                  rows={3}
                />
              ) : (
                <Text whiteSpace="pre-wrap">{d.importantInfo ?? ''}</Text>
              )}
              {canWrite ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void updateDbTpDestination(d.id, {importantInfo: d.importantInfo})
                      .then(() => reload())
                      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
                  }
                >
                  Save destination info
                </Button>
              ) : null}
              {trip !== undefined ? (
                <TripTpAttachmentPanel
                  podId={podId}
                  tripId={trip.id}
                  userId={userId}
                  canWrite={canWrite}
                  parent={{destinationId: d.id}}
                  attachments={data.attachments}
                  onChanged={onEditorSaved}
                  onError={onEditorError}
                />
              ) : null}
            </Stack>
          ))}
        </Stack>
      </TripTpCollapsible>
    </Stack>
  );
}
