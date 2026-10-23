import {TpActionKind} from './tpActionKind';
import formatTpInstant from './formatTpInstant';

export interface TpActivityPlaceRef {
  readonly placeText: string;
}

export interface TpActionDayCardSummaryInput {
  readonly kind: TpActionKind | string;
  readonly title: string;
  readonly placeText?: string;
  readonly fromPlace?: string;
  readonly toPlace?: string;
  readonly checkInAt?: string;
  readonly checkOutAt?: string;
  readonly checkInTimezone?: string;
  readonly checkOutTimezone?: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly notes?: string;
  readonly activityPlaces?: readonly TpActivityPlaceRef[];
  readonly selectedRouteName?: string;
  readonly travelDepartAt?: string;
  readonly travelArriveAt?: string;
  readonly travelDepartTimezone?: string;
  readonly travelArriveTimezone?: string;
}

function formatLocalTime(t: string | undefined): string | undefined {
  if (t === undefined || t === '') {
    return undefined;
  }
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function placeLabels(input: TpActionDayCardSummaryInput): readonly string[] {
  const children = input.activityPlaces ?? [];
  if (children.length > 0) {
    return children.map((p) => p.placeText);
  }
  if (input.placeText !== undefined && input.placeText !== '') {
    return [input.placeText];
  }
  return [];
}

export default function tpActionDayCardSummary(input: TpActionDayCardSummaryInput): string {
  const kind = input.kind;
  if (kind === TpActionKind.STAY) {
    const parts: string[] = [input.title];
    if (input.placeText !== undefined && input.placeText !== '') {
      parts.push(input.placeText);
    }
    if (input.checkInAt !== undefined && input.checkOutAt !== undefined) {
      const fromTz = input.checkInTimezone ?? 'UTC';
      const toTz = input.checkOutTimezone ?? fromTz;
      parts.push(`${formatTpInstant(input.checkInAt, fromTz)} → ${formatTpInstant(input.checkOutAt, toTz)}`);
    } else {
      parts.push('Times not set');
    }
    return parts.join(' · ');
  }
  if (kind === TpActionKind.ACTIVITY) {
    const parts: string[] = [input.title];
    const start = formatLocalTime(input.startTime);
    const end = formatLocalTime(input.endTime);
    if (start !== undefined && end !== undefined) {
      parts.push(`${start}–${end}`);
    } else if (start !== undefined) {
      parts.push(start);
    }
    const labels = placeLabels(input);
    if (labels.length === 1) {
      parts.push(labels[0]);
    } else if (labels.length > 1) {
      const preview = labels.slice(0, 2).join(', ');
      parts.push(labels.length > 2 ? `${preview}…` : preview);
      parts.push(`${labels.length} places`);
    }
    return parts.join(' · ');
  }
  if (kind === TpActionKind.TRAVEL) {
    const parts: string[] = [input.title];
    const endpoints =
      input.fromPlace !== undefined && input.fromPlace !== '' && input.toPlace !== undefined && input.toPlace !== ''
        ? `${input.fromPlace} → ${input.toPlace}`
        : undefined;
    if (endpoints !== undefined) {
      parts.push(endpoints);
    }
    if (input.selectedRouteName !== undefined && input.selectedRouteName !== '') {
      parts.push(input.selectedRouteName);
    }
    if (input.travelDepartAt !== undefined && input.travelArriveAt !== undefined) {
      const depTz = input.travelDepartTimezone ?? 'UTC';
      const arrTz = input.travelArriveTimezone ?? depTz;
      parts.push(`${formatTpInstant(input.travelDepartAt, depTz)} → ${formatTpInstant(input.travelArriveAt, arrTz)}`);
    } else if (endpoints === undefined && (input.selectedRouteName === undefined || input.selectedRouteName === '')) {
      parts.push('Route not set');
    }
    return parts.join(' · ');
  }
  if (kind === TpActionKind.NOTE) {
    const firstLine = input.notes?.split('\n')[0]?.trim();
    if (firstLine !== undefined && firstLine !== '') {
      return `${input.title} · ${firstLine}`;
    }
    return input.title;
  }
  return input.title;
}
