import {TpActionKind} from './tpActionKind';
import tpSpanOverlapsTripDay from './tpSpanOverlapsTripDay';

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
}

export interface TpTimelineTravelSpan {
  readonly actionId: string;
  readonly anchorDayId?: string;
  readonly sortOrder: number;
  readonly title: string;
  readonly spanStartIso: string;
  readonly spanEndIso: string;
}

export interface TpDayTimelineEntry {
  readonly actionId: string;
  readonly displayMode: TpTimelineDisplayMode;
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

export default function tpDayTimelineEntries(input: TpDayTimelineInput): readonly TpDayTimelineEntry[] {
  const entries: TpDayTimelineEntry[] = [];
  input.actions.forEach((action) => {
    if (action.kind === TpActionKind.ACTIVITY || action.kind === TpActionKind.NOTE) {
      if (action.anchorDayId === input.dayId) {
        entries.push({
          actionId: action.id,
          displayMode: 'canonical',
          sortOrder: action.sortOrder,
          title: action.title,
          kind: action.kind,
        });
      }
      return;
    }
    if (action.kind === TpActionKind.STAY) {
      const stay = input.stays.find((s) => s.actionId === action.id);
      if (stay === undefined) {
        return;
      }
      if (!tpSpanOverlapsTripDay(stay.checkInAt, stay.checkOutAt, input.calendarDate, input.tripTimezone)) {
        return;
      }
      entries.push({
        actionId: action.id,
        displayMode: action.anchorDayId === input.dayId ? 'canonical' : 'mirror',
        sortOrder: action.anchorDayId === input.dayId ? action.sortOrder : 10_000 + action.sortOrder,
        title: action.title,
        kind: action.kind,
      });
    }
  });

  input.travels.forEach((travel) => {
    if (!tpSpanOverlapsTripDay(travel.spanStartIso, travel.spanEndIso, input.calendarDate, input.tripTimezone)) {
      return;
    }
    entries.push({
      actionId: travel.actionId,
      displayMode: travel.anchorDayId === input.dayId ? 'canonical' : 'mirror',
      sortOrder: travel.anchorDayId === input.dayId ? travel.sortOrder : 10_000 + travel.sortOrder,
      title: travel.title,
      kind: TpActionKind.TRAVEL,
    });
  });

  return entries.sort((a, b) => a.sortOrder - b.sortOrder);
}
