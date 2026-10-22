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
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  canWriteTpPod,
  TpActionKind,
  tpActiveDestinationsForDay,
  tpBudgetRollup,
  tpDayTimelineEntries,
  TpTripStatus,
  type PodRole,
} from '@so/model';
import loadDbTpWorkspace, {type DbTpWorkspace} from '@/lib/api/db/tp/loadDbTpWorkspace';
import createDbTpTripBundle from '@/lib/api/db/tp/createDbTpTripBundle';
import updateDbTpDay from '@/lib/api/db/tp/updateDbTpDay';
import createDbTpAction from '@/lib/api/db/tp/createDbTpAction';
import updateDbTpDestination from '@/lib/api/db/tp/updateDbTpDestination';
import updateDbTpActionSortOrders from '@/lib/api/db/tp/updateDbTpActionSortOrders';
import createDbTpRoute from '@/lib/api/db/tp/createDbTpRoute';
import selectDbTpRoute from '@/lib/api/db/tp/selectDbTpRoute';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import TripStayActionEditor from '@/components/tp/TripStayActionEditor';
import TripTravelActionEditor from '@/components/tp/TripTravelActionEditor';
import TripSimpleActionEditor from '@/components/tp/TripSimpleActionEditor';
import TripTpAttachmentPanel from '@/components/tp/TripTpAttachmentPanel';

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
  const [error, setError] = useState('');
  const [wizardTitle, setWizardTitle] = useState('');
  const [wizardStart, setWizardStart] = useState('');
  const [wizardEnd, setWizardEnd] = useState('');
  const [wizardTz, setWizardTz] = useState('UTC');
  const [wizardDestinations, setWizardDestinations] = useState('Tokyo\nHong Kong');

  const reload = useCallback(async (): Promise<void> => {
    const next = await loadDbTpWorkspace(podId);
    setData(next);
    setSelectedDayId((current) => current ?? next.days[0]?.id);
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
        if (dep === undefined || arr === undefined) {
          return undefined;
        }
        return {
          actionId: a.id,
          anchorDayId: a.anchorDayId,
          sortOrder: a.sortOrder,
          title: a.title,
          spanStartIso: dep,
          spanEndIso: arr,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== undefined);
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
        .filter((a) => a.kind === TpActionKind.STAY && a.checkInAt !== undefined && a.checkOutAt !== undefined)
        .map((a) => ({
          actionId: a.id,
          checkInAt: a.checkInAt as string,
          checkOutAt: a.checkOutAt as string,
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

  const onEditorSaved = (): void => {
    void reload().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };

  const onEditorError = (message: string): void => setError(message);

  const addAction = async (kind: TpActionKind): Promise<void> => {
    if (trip === undefined || selectedDay === undefined || !canWrite) {
      return;
    }
    const title =
      kind === TpActionKind.NOTE ? 'Note' : kind === TpActionKind.ACTIVITY ? 'Activity' : kind === TpActionKind.STAY ? 'Stay' : 'Travel';
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
            <Stack gap={2}>
              <Heading size="sm">Important info</Heading>
              {activeDestinationIds.map((destId) => {
                const dest = data.destinations.find((d) => d.id === destId);
                if (dest === undefined) {
                  return null;
                }
                return (
                  <Box key={dest.id} borderWidth="1px" borderRadius="md" p={3}>
                    <Text fontWeight="semibold">{dest.name}</Text>
                    <Text whiteSpace="pre-wrap">{dest.importantInfo ?? 'No details yet.'}</Text>
                  </Box>
                );
              })}
            </Stack>
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
              return (
                <Box key={`${entry.actionId}-${entry.displayMode}`} borderWidth="1px" borderRadius="md" p={3}>
                  <HStack justify="space-between" wrap="wrap" gap={2}>
                    <HStack>
                      <Badge>{entry.kind}</Badge>
                      {entry.displayMode === 'mirror' ? <Badge variant="outline">mirror</Badge> : null}
                      <Text fontWeight="medium">{entry.title}</Text>
                    </HStack>
                    <HStack>
                      {entry.displayMode === 'mirror' && action?.anchorDayId !== undefined ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedDayId(action.anchorDayId);
                            setExpandedActionId(entry.actionId);
                          }}
                        >
                          Anchor day
                        </Button>
                      ) : null}
                      {entry.displayMode === 'canonical' && canWrite ? (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={canonicalIdx <= 0}
                            onClick={() => void moveCanonicalAction(entry.actionId, 'up')}
                          >
                            ↑
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={canonicalIdx < 0 || canonicalIdx >= canonicalTimelineIds.length - 1}
                            onClick={() => void moveCanonicalAction(entry.actionId, 'down')}
                          >
                            ↓
                          </Button>
                        </>
                      ) : null}
                      <Button
                        size="xs"
                        variant={expanded ? 'solid' : 'outline'}
                        onClick={() => setExpandedActionId(expanded ? undefined : entry.actionId)}
                      >
                        {expanded ? 'Close' : 'Edit'}
                      </Button>
                    </HStack>
                  </HStack>
                  {expanded && action !== undefined && trip !== undefined ? (
                    <Box mt={3} pt={3} borderTopWidth="1px">
                      {action.kind === TpActionKind.STAY ? (
                        <TripStayActionEditor
                          action={action}
                          destinations={data.destinations}
                          tripTimezone={trip.timezone}
                          defaultCurrency={trip.budgetCurrency}
                          canWrite={canWrite}
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
                          tripTimezone={trip.timezone}
                          defaultCurrency={trip.budgetCurrency}
                          canWrite={canWrite}
                          onSaved={onEditorSaved}
                          onError={onEditorError}
                        />
                      ) : null}
                      {action.kind === TpActionKind.ACTIVITY || action.kind === TpActionKind.NOTE ? (
                        <TripSimpleActionEditor
                          action={action}
                          defaultCurrency={trip.budgetCurrency}
                          canWrite={canWrite}
                          onSaved={onEditorSaved}
                          onError={onEditorError}
                        />
                      ) : null}
                    </Box>
                  ) : null}
                  {!expanded && action?.notes !== undefined ? <Text fontSize="sm" mt={2}>{action.notes}</Text> : null}
                </Box>
              );
            })}
          </Stack>
        </Stack>
      ) : null}
      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="sm" mb={2}>Destinations (trip)</Heading>
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
      </Box>
    </Stack>
  );
}
