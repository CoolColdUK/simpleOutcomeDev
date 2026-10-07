import dayjs from 'dayjs';

export interface FpMonthSelectOption {
  readonly value: string;
  readonly label: string;
}

export default function fpMonthSelectOptions(
  monthsBefore: number,
  monthsAfter: number,
): readonly FpMonthSelectOption[] {
  const anchor = dayjs().startOf('month');
  return Array.from({length: monthsBefore + monthsAfter + 1}, (_, index) => {
    const month = anchor.subtract(monthsBefore - index, 'month');
    return {
      value: month.format('YYYY-MM'),
      label: month.format('MMMM YYYY'),
    };
  });
}
