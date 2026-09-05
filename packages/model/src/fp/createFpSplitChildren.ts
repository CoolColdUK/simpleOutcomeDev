import {FpSplitRecurrence} from './fpSplitRecurrence';

export interface FpSplitChild {
  readonly postedDate: string;
  readonly amount: number;
}

function addMonths(isoDate: string, months: number): string {
  const [yearRaw, monthRaw, dayRaw] = isoDate.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1 + months;
  const day = Number(dayRaw);
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const utc = new Date(Date.UTC(year, monthIndex, Math.min(day, lastDay)));
  const y = utc.getUTCFullYear();
  const m = utc.getUTCMonth() + 1;
  const d = utc.getUTCDate();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${y}-${pad(m)}-${pad(d)}`;
}

export default function createFpSplitChildren(
  parentAmount: number,
  startDate: string,
  portionCount: number,
  recurrence: FpSplitRecurrence,
): readonly FpSplitChild[] {
  if (portionCount < 2 || recurrence !== FpSplitRecurrence.MONTHLY) {
    return [];
  }
  const cents = Math.round(parentAmount * 100);
  const base = Math.trunc(cents / portionCount);
  return Array.from({length: portionCount}, (_, i) => {
    const amountCents = i === portionCount - 1 ? cents - base * (portionCount - 1) : base;
    return {
      postedDate: addMonths(startDate, i),
      amount: amountCents / 100,
    };
  });
}
