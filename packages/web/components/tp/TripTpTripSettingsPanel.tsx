'use client';

import {useState} from 'react';
import {
  Box,
  Button,
  Field,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {TpActionKind, TpTripStatus, type TpActionKindColors} from '@so/model';
import type {DbTpSettings, DbTpTrip} from '@/lib/api/db/tp/loadDbTpWorkspace';
import TripTpCollapsible from '@/components/tp/TripTpCollapsible';
import TripTpEditSaveBar from '@/components/tp/TripTpEditSaveBar';
import TripTpCurrencySelect from '@/components/tp/TripTpCurrencySelect';
import updateDbTpTripForBrowser, {updateDbTpTripLockedForBrowser} from '@/lib/api/db/tp/updateDbTpTripForBrowser';
import updateDbTpSettingActionKindColors from '@/lib/api/db/tp/updateDbTpSettingActionKindColors';

export interface TripTpTripSettingsPanelProps {
  readonly podId: string;
  readonly trip: DbTpTrip;
  readonly settings?: DbTpSettings;
  readonly canWrite: boolean;
  readonly onSaved: () => void | Promise<void>;
  readonly onError: (message: string) => void;
}

const KINDS: readonly TpActionKind[] = [
  TpActionKind.STAY,
  TpActionKind.TRAVEL,
  TpActionKind.ACTIVITY,
  TpActionKind.NOTE,
];

export default function TripTpTripSettingsPanel({
  podId,
  trip,
  settings,
  canWrite,
  onSaved,
  onError,
}: TripTpTripSettingsPanelProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(trip.title);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [timezone, setTimezone] = useState(trip.timezone);
  const [status, setStatus] = useState(trip.status);
  const [budgetAmount, setBudgetAmount] = useState(trip.budgetAmount?.toString() ?? '');
  const [budgetCurrency, setBudgetCurrency] = useState(trip.budgetCurrency ?? '');
  const [mapsUrl, setMapsUrl] = useState(trip.mapsUrl ?? '');
  const [notes, setNotes] = useState(trip.notes ?? '');
  const [defaultCurrency, setDefaultCurrency] = useState(settings?.defaultCurrency ?? 'GBP');
  const [kindColors, setKindColors] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    KINDS.forEach((k) => {
      const c = settings?.actionKindColors?.[k];
      if (c !== undefined) {
        initial[k] = c;
      }
    });
    return initial;
  });

  const tripLocked = trip.locked;
  const settingsDisabled = !canWrite || tripLocked;

  const resetDraft = (): void => {
    setTitle(trip.title);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setTimezone(trip.timezone);
    setStatus(trip.status);
    setBudgetAmount(trip.budgetAmount?.toString() ?? '');
    setBudgetCurrency(trip.budgetCurrency ?? '');
    setMapsUrl(trip.mapsUrl ?? '');
    setNotes(trip.notes ?? '');
    setDefaultCurrency(settings?.defaultCurrency ?? 'GBP');
    const initial: Record<string, string> = {};
    KINDS.forEach((k) => {
      const c = settings?.actionKindColors?.[k];
      if (c !== undefined) {
        initial[k] = c;
      }
    });
    setKindColors(initial);
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    try {
      const parsedBudget = budgetAmount.trim() === '' ? undefined : Number(budgetAmount);
      await updateDbTpTripForBrowser({
        podId,
        title,
        startDate,
        endDate,
        timezone,
        status,
        budgetAmount: parsedBudget !== undefined && !Number.isNaN(parsedBudget) ? parsedBudget : undefined,
        budgetCurrency: budgetCurrency === '' ? undefined : budgetCurrency,
        mapsUrl: mapsUrl === '' ? undefined : mapsUrl,
        notes: notes === '' ? undefined : notes,
        defaultCurrency,
      });
      const colorsPayload: TpActionKindColors = {};
      KINDS.forEach((k) => {
        const v = kindColors[k]?.trim();
        if (v !== undefined && v !== '') {
          colorsPayload[k] = v;
        }
      });
      await updateDbTpSettingActionKindColors(
        podId,
        Object.keys(colorsPayload).length > 0 ? colorsPayload : null,
      );
      await onSaved();
      setEditing(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleTripLock = async (locked: boolean): Promise<void> => {
    setBusy(true);
    try {
      await updateDbTpTripLockedForBrowser(trip.id, locked);
      await onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!canWrite) {
    return null;
  }

  return (
    <TripTpCollapsible title="Trip settings" defaultOpen={false}>
      <Stack gap={4} pt={2}>
        <HStack justify="space-between" wrap="wrap">
          <Text fontWeight="medium">Lock trip plan</Text>
          <Switch.Root
            checked={tripLocked}
            disabled={busy}
            onCheckedChange={(e) => void toggleTripLock(e.checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>{tripLocked ? 'Locked' : 'Unlocked'}</Switch.Label>
          </Switch.Root>
        </HStack>
        {tripLocked ? (
          <Text fontSize="sm" color="fg.muted">
            Trip plan is locked. Plan edits and agent writes are blocked until you unlock here.
          </Text>
        ) : null}
        {editing && !tripLocked ? (
          <Stack gap={3}>
            <Field.Root>
              <Field.Label>Title</Field.Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field.Root>
            <HStack wrap="wrap">
              <Field.Root flex="1">
                <Field.Label>Start</Field.Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field.Root>
              <Field.Root flex="1">
                <Field.Label>End</Field.Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field.Root>
            </HStack>
            <Field.Root>
              <Field.Label>Timezone</Field.Label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Status</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field value={status} onChange={(e) => setStatus(e.target.value)}>
                  {Object.values(TpTripStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <HStack wrap="wrap">
              <Field.Root flex="1">
                <Field.Label>Budget amount</Field.Label>
                <Input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
              </Field.Root>
              <Field.Root flex="1">
                <Field.Label>Budget currency</Field.Label>
                <TripTpCurrencySelect value={budgetCurrency} onChange={setBudgetCurrency} />
              </Field.Root>
            </HStack>
            <Field.Root>
              <Field.Label>Default currency (pod)</Field.Label>
              <TripTpCurrencySelect value={defaultCurrency} onChange={setDefaultCurrency} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Maps URL</Field.Label>
              <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Notes</Field.Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field.Root>
            <Box>
              <Text fontWeight="medium" mb={2}>
                Display — card background (hex)
              </Text>
              <Stack gap={2}>
                {KINDS.map((k) => (
                  <HStack key={k}>
                    <Text fontSize="sm" minW="5rem">
                      {k}
                    </Text>
                    <Input
                      size="sm"
                      placeholder="#RRGGBB"
                      value={kindColors[k] ?? ''}
                      onChange={(e) => setKindColors((prev) => ({...prev, [k]: e.target.value}))}
                    />
                  </HStack>
                ))}
              </Stack>
            </Box>
          </Stack>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            {trip.title} · {trip.startDate} → {trip.endDate} · {trip.timezone}
          </Text>
        )}
        <TripTpEditSaveBar
          editing={editing}
          canWrite={canWrite && !tripLocked}
          busy={busy}
          onEdit={() => {
            resetDraft();
            setEditing(true);
          }}
          onSave={() => void save()}
          onCancel={() => {
            resetDraft();
            setEditing(false);
          }}
        />
      </Stack>
    </TripTpCollapsible>
  );
}
