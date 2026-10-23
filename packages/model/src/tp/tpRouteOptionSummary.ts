import formatTpInstant from './formatTpInstant';

export interface TpRouteOptionStepInput {
  readonly fromPlace?: string;
  readonly toPlace?: string;
  readonly fromLocationName?: string;
  readonly toLocationName?: string;
  readonly costAmount?: number;
  readonly costCurrency?: string;
  readonly departAt?: string;
  readonly departTimezone?: string;
  readonly arriveAt?: string;
  readonly arriveTimezone?: string;
}

export interface TpRouteOptionSummaryInput {
  readonly name: string;
  readonly isSelected: boolean;
  readonly steps: readonly TpRouteOptionStepInput[];
}

function stepStartLabel(step: TpRouteOptionStepInput): string | undefined {
  const name = step.fromLocationName?.trim();
  if (name !== undefined && name !== '') {
    return name;
  }
  const place = step.fromPlace?.trim();
  return place !== undefined && place !== '' ? place : undefined;
}

function stepEndLabel(step: TpRouteOptionStepInput): string | undefined {
  const name = step.toLocationName?.trim();
  if (name !== undefined && name !== '') {
    return name;
  }
  const place = step.toPlace?.trim();
  return place !== undefined && place !== '' ? place : undefined;
}

function stepCountLabel(count: number): string {
  if (count === 0) {
    return 'No steps';
  }
  if (count === 1) {
    return '1 step';
  }
  return `${count} steps`;
}

function pricePart(steps: readonly TpRouteOptionStepInput[]): string | undefined {
  const priced = steps.filter((s) => s.costAmount !== undefined && s.costCurrency !== undefined && s.costCurrency !== '');
  if (priced.length === 0) {
    return undefined;
  }
  const currency = priced[0]?.costCurrency;
  if (currency === undefined || currency === '') {
    return undefined;
  }
  if (priced.some((s) => s.costCurrency !== currency)) {
    return undefined;
  }
  const sum = priced.reduce((acc, s) => acc + (s.costAmount ?? 0), 0);
  return `${currency} ${sum}`;
}

function timePart(steps: readonly TpRouteOptionStepInput[]): string | undefined {
  if (steps.length === 0) {
    return undefined;
  }
  const first = steps[0];
  const last = steps[steps.length - 1];
  if (first === undefined || last === undefined) {
    return undefined;
  }
  if (first.departAt === undefined || last.arriveAt === undefined) {
    return undefined;
  }
  const depTz = first.departTimezone ?? 'UTC';
  const arrTz = last.arriveTimezone ?? depTz;
  return `${formatTpInstant(first.departAt, depTz)} → ${formatTpInstant(last.arriveAt, arrTz)}`;
}

export default function tpRouteOptionSummary(input: TpRouteOptionSummaryInput): string {
  const parts: string[] = [input.name.trim()];
  if (input.isSelected) {
    parts.push('selected');
  }
  const steps = input.steps;
  if (steps.length > 0) {
    const first = steps[0];
    const last = steps[steps.length - 1];
    if (first !== undefined && last !== undefined) {
      const from = stepStartLabel(first);
      const to = stepEndLabel(last);
      if (from !== undefined && to !== undefined) {
        parts.push(`${from} → ${to}`);
      }
    }
  }
  parts.push(stepCountLabel(steps.length));
  const price = pricePart(steps);
  if (price !== undefined) {
    parts.push(price);
  }
  const times = timePart(steps);
  if (times !== undefined) {
    parts.push(times);
  }
  return parts.join(' · ');
}
