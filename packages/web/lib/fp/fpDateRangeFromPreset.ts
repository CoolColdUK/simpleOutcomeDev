import dayjs from 'dayjs';

export type FpDatePreset = 'this_month' | 'last_month' | 'last_30' | 'this_year' | 'all' | 'custom';

export interface FpDateRange {
  readonly start?: string;
  readonly end?: string;
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
  return custom;
}
