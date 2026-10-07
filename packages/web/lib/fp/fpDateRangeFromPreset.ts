import dayjs from 'dayjs';

export type FpDatePreset =
  | 'this_month'
  | 'last_month'
  | 'last_30'
  | 'this_year'
  | 'all'
  | 'month'
  | 'custom';

export interface FpDateRange {
  readonly start?: string;
  readonly end?: string;
  /** `YYYY-MM` when preset is `month`. */
  readonly month?: string;
}

function rangeForMonthYm(monthYm: string): FpDateRange {
  const month = dayjs(`${monthYm}-01`);
  if (!month.isValid()) {
    return {};
  }
  return {
    start: month.startOf('month').format('YYYY-MM-DD'),
    end: month.endOf('month').format('YYYY-MM-DD'),
  };
}

export default function fpDateRangeFromPreset(preset: FpDatePreset, custom: FpDateRange): FpDateRange {
  const today = dayjs();
  if (preset === 'this_month') {
    return {start: today.startOf('month').format('YYYY-MM-DD'), end: today.endOf('month').format('YYYY-MM-DD')};
  }
  if (preset === 'last_month') {
    const last = today.subtract(1, 'month');
    return {start: last.startOf('month').format('YYYY-MM-DD'), end: last.endOf('month').format('YYYY-MM-DD')};
  }
  if (preset === 'last_30') {
    return {start: today.subtract(29, 'day').format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD')};
  }
  if (preset === 'this_year') {
    return {start: today.startOf('year').format('YYYY-MM-DD'), end: today.endOf('year').format('YYYY-MM-DD')};
  }
  if (preset === 'all') {
    return {};
  }
  if (preset === 'month') {
    const ym = custom.month ?? today.format('YYYY-MM');
    return rangeForMonthYm(ym);
  }
  if (preset === 'custom') {
    const {start, end} = custom;
    if (start !== undefined && end !== undefined && start !== '' && end !== '') {
      return start <= end ? {start, end} : {start: end, end: start};
    }
    return {
      start: today.startOf('month').format('YYYY-MM-DD'),
      end: today.endOf('month').format('YYYY-MM-DD'),
    };
  }
  return custom;
}
