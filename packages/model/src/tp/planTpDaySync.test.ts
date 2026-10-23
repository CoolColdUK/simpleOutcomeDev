import planTpDaySync from './planTpDaySync';

describe('planTpDaySync', () => {
  it('plans inserts for an empty trip', () => {
    const plan = planTpDaySync([], '2026-06-01', '2026-06-03');
    expect(plan.inserts).toEqual([
      {dayIndex: 0, calendarDate: '2026-06-01'},
      {dayIndex: 1, calendarDate: '2026-06-02'},
      {dayIndex: 2, calendarDate: '2026-06-03'},
    ]);
    expect(plan.updates).toEqual([]);
    expect(plan.deleteIds).toEqual([]);
  });

  it('keeps matching days unchanged', () => {
    const plan = planTpDaySync(
      [
        {id: 'a', dayIndex: 0, calendarDate: '2026-06-01'},
        {id: 'b', dayIndex: 1, calendarDate: '2026-06-02'},
      ],
      '2026-06-01',
      '2026-06-02',
    );
    expect(plan.inserts).toEqual([]);
    expect(plan.updates).toEqual([]);
    expect(plan.deleteIds).toEqual([]);
  });

  it('plans deletes when the range shrinks', () => {
    const plan = planTpDaySync(
      [
        {id: 'a', dayIndex: 0, calendarDate: '2026-06-01'},
        {id: 'b', dayIndex: 1, calendarDate: '2026-06-02'},
        {id: 'c', dayIndex: 2, calendarDate: '2026-06-03'},
      ],
      '2026-06-01',
      '2026-06-01',
    );
    expect(plan.inserts).toEqual([]);
    expect(plan.updates).toEqual([]);
    expect(plan.deleteIds).toEqual(['b', 'c']);
  });

  it('reindexes days when the start date shifts but dates overlap', () => {
    const plan = planTpDaySync(
      [{id: 'b', dayIndex: 1, calendarDate: '2026-06-02'}],
      '2026-06-02',
      '2026-06-02',
    );
    expect(plan.inserts).toEqual([]);
    expect(plan.updates).toEqual([{id: 'b', dayIndex: 0, calendarDate: '2026-06-02'}]);
    expect(plan.deleteIds).toEqual([]);
  });
});
