import syncTpCalendarDates from './syncTpCalendarDates';

export interface TpDaySyncExisting {
  readonly id: string;
  readonly dayIndex: number;
  readonly calendarDate: string;
}

export interface TpDaySyncInsert {
  readonly dayIndex: number;
  readonly calendarDate: string;
}

export interface TpDaySyncUpdate {
  readonly id: string;
  readonly dayIndex: number;
  readonly calendarDate: string;
}

export interface TpDaySyncPlan {
  readonly inserts: readonly TpDaySyncInsert[];
  readonly updates: readonly TpDaySyncUpdate[];
  readonly deleteIds: readonly string[];
}

export default function planTpDaySync(
  existing: readonly TpDaySyncExisting[],
  startDate: string,
  endDate: string,
): TpDaySyncPlan {
  const targetDates = syncTpCalendarDates(startDate, endDate);
  const existingByDate = new Map(existing.map((day) => [day.calendarDate, day]));
  const targetSet = new Set(targetDates);

  const inserts: TpDaySyncInsert[] = [];
  const updates: TpDaySyncUpdate[] = [];

  targetDates.forEach((calendarDate, dayIndex) => {
    const row = existingByDate.get(calendarDate);
    if (row === undefined) {
      inserts.push({dayIndex, calendarDate});
      return;
    }
    if (row.dayIndex !== dayIndex) {
      updates.push({id: row.id, dayIndex, calendarDate});
    }
  });

  const deleteIds = existing.filter((day) => !targetSet.has(day.calendarDate)).map((day) => day.id);

  return {inserts, updates, deleteIds};
}
