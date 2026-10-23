import {TpActionKind} from './tpActionKind';
import tpDayTimelineEntries from './tpDayTimelineEntries';

const dayId = 'day-1';
const calendarDate = '2026-06-02';
const tripTimezone = 'UTC';

describe('tpDayTimelineEntries', () => {
  it('shows activity and note only on anchor day', () => {
    const entries = tpDayTimelineEntries({
      dayId,
      calendarDate,
      tripTimezone,
      actions: [
        {id: 'a1', kind: TpActionKind.ACTIVITY, anchorDayId: dayId, sortOrder: 0, title: 'Shop'},
        {id: 'n1', kind: TpActionKind.NOTE, anchorDayId: 'other', sortOrder: 1, title: 'Note'},
      ],
      stays: [],
      travels: [],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe(TpActionKind.ACTIVITY);
  });

  it('mirrors stay with complete span', () => {
    const entries = tpDayTimelineEntries({
      dayId,
      calendarDate,
      tripTimezone,
      actions: [{id: 's1', kind: TpActionKind.STAY, anchorDayId: 'anchor', sortOrder: 2, title: 'Hotel'}],
      stays: [
        {
          actionId: 's1',
          checkInAt: '2026-06-01T10:00:00.000Z',
          checkOutAt: '2026-06-03T18:00:00.000Z',
        },
      ],
      travels: [],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.displayMode).toBe('mirror');
    expect(entries[0]?.kind).toBe(TpActionKind.STAY);
  });

  it('shows draft stay on anchor day only', () => {
    const entries = tpDayTimelineEntries({
      dayId,
      calendarDate,
      tripTimezone,
      actions: [{id: 's1', kind: TpActionKind.STAY, anchorDayId: dayId, sortOrder: 1, title: 'Stay'}],
      stays: [{actionId: 's1', checkInAt: '', checkOutAt: ''}],
      travels: [],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.displayMode).toBe('canonical');
  });

  it('shows draft travel on anchor day only', () => {
    const entries = tpDayTimelineEntries({
      dayId,
      calendarDate,
      tripTimezone,
      actions: [],
      stays: [],
      travels: [{actionId: 't1', anchorDayId: dayId, sortOrder: 0, title: 'Travel'}],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe(TpActionKind.TRAVEL);
    expect(entries[0]?.displayMode).toBe('canonical');
  });

  it('emits one travel entry on anchor day inside span', () => {
    const entries = tpDayTimelineEntries({
      dayId,
      calendarDate,
      tripTimezone,
      actions: [],
      stays: [],
      travels: [
        {
          actionId: 't1',
          anchorDayId: dayId,
          sortOrder: 0,
          title: 'Fly',
          spanStartIso: '2026-06-01T10:00:00.000Z',
          spanEndIso: '2026-06-03T18:00:00.000Z',
        },
      ],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.displayMode).toBe('canonical');
  });
});
