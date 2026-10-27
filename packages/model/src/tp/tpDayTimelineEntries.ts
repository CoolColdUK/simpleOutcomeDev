import {TpActionKind} from './tpActionKind';
import tpSpanOverlapsTripDay from './tpSpanOverlapsTripDay';
import tpStayTimelinePinsForDay, {type TpTimelinePin} from './tpStayTimelinePinsForDay';

export type TpTimelineDisplayMode = 'canonical' | 'mirror';

export interface TpTimelineActionRef {
  readonly id: string;
  readonly kind: TpActionKind;
  readonly anchorDayId?: string;
  readonly sortOrder: number;
  readonly title: string;
}

export interface TpTimelineStaySpan {
  readonly actionId: string;
  readonly checkInAt: string;
  readonly checkOutAt: string;
  readonly checkInTimezone?: string;
  readonly checkOutTimezone?: string;
}

export interface TpTimelineTravelSpan {
  readonly actionId: string;
  readonly anchorDayId?: string;
  readonly sortOrder: number;
  readonly title: string;
  readonly spanStartIso?: string;
  readonly spanEndIso?: string;
}

export interface TpDayTimelineEntry {
  readonly actionId: string;
  readonly displayMode: TpTimelineDisplayMode;
  readonly pin: TpTimelinePin;
  readonly sortOrder: number;
  readonly title: string;
  readonly kind: TpActionKind;
}

export interface TpDayTimelineInput {
  readonly dayId: string;
  readonly calendarDate: string;
  readonly tripTimezone: string;
  readonly actions: readonly TpTimelineActionRef[];
  readonly stays: readonly TpTimelineStaySpan[];
  readonly travels: readonly TpTimelineTravelSpan[];
}

const PIN_BAND_ORDER: Record<TpTimelinePin, number> = {
  top: 0,
  flow: 1,
  bottom: 2,
};

function stayHasCompleteSpan(stay: TpTimelineStaySpan | undefined): stay is TpTimelineStaySpan {
  return stay !== undefined && stay.checkInAt !== '' && stay.checkOutAt !== '';
}

function pushStayEntries(
  entries: TpDayTimelineEntry[],
  action: TpTimelineActionRef,
  stay: TpTimelineStaySpan,
  input: TpDayTimelineInput,
): void {
  if (!tpSpanOverlapsTripDay(stay.checkInAt, stay.checkOutAt, input.calendarDate, input.tripTimezone)) {
    return;
  }
  const displayMode = action.anchorDayId === input.dayId ? 'canonical' : 'mirror';
  const pins = tpStayTimelinePinsForDay({
    calendarDate: input.calendarDate,
    checkInAt: stay.checkInAt,
    checkOutAt: stay.checkOutAt,
    checkInTimezone: stay.checkInTimezone,
    checkOutTimezone: stay.checkOutTimezone,
    tripTimezone: input.tripTimezone,
  });
  const baseSort = action.sortOrder;
  pins.forEach((pin) => {
    entries.push({
      actionId: action.id,
      displayMode,
      pin,
      sortOrder: baseSort,
      title: action.title,
      kind: action.kind,
    });
  });
}

export default function tpDayTimelineEntries(input: TpDayTimelineInput): readonly TpDayTimelineEntry[] {
  const entries: TpDayTimelineEntry[] = [];
  input.actions.forEach((action) => {
    if (action.kind === TpActionKind.ACTIVITY || action.kind === TpActionKind.NOTE) {
      if (action.anchorDayId === input.dayId) {
        entries.push({
          actionId: action.id,
          displayMode: 'canonical',
          pin: 'flow',
          sortOrder: action.sortOrder,
          title: action.title,
          kind: action.kind,
        });
      }
      return;
    }
    if (action.kind === TpActionKind.STAY) {
      const stay = input.stays.find((s) => s.actionId === action.id);
      if (stay !== undefined && stayHasCompleteSpan(stay)) {
        pushStayEntries(entries, action, stay, input);
        return;
      }
      if (action.anchorDayId === input.dayId) {
        entries.push({
          actionId: action.id,
          displayMode: 'canonical',
          pin: 'flow',
          sortOrder: action.sortOrder,
          title: action.title,
          kind: action.kind,
        });
      }
    }
  });

  input.travels.forEach((travel) => {
    const hasSpan = travel.spanStartIso !== undefined && travel.spanEndIso !== undefined;
    if (hasSpan) {
      if (!tpSpanOverlapsTripDay(travel.spanStartIso, travel.spanEndIso, input.calendarDate, input.tripTimezone)) {
        return;
      }
      entries.push({
        actionId: travel.actionId,
        displayMode: travel.anchorDayId === input.dayId ? 'canonical' : 'mirror',
        pin: 'flow',
        sortOrder: travel.anchorDayId === input.dayId ? travel.sortOrder : 10_000 + travel.sortOrder,
        title: travel.title,
        kind: TpActionKind.TRAVEL,
      });
      return;
    }
    if (travel.anchorDayId === input.dayId) {
      entries.push({
        actionId: travel.actionId,
        displayMode: 'canonical',
        pin: 'flow',
        sortOrder: travel.sortOrder,
        title: travel.title,
        kind: TpActionKind.TRAVEL,
      });
    }
  });

  return entries.sort((a, b) => {
    const band = PIN_BAND_ORDER[a.pin] - PIN_BAND_ORDER[b.pin];
    if (band !== 0) {
      return band;
    }
    return a.sortOrder - b.sortOrder;
  });
}
