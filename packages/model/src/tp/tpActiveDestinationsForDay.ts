import type {TpDestinationRef} from './tpDestinationRef';
import localDateInZone from './localDateInZone';
import tpSpanOverlapsTripDay from './tpSpanOverlapsTripDay';

export interface TpDayDestinationLink {
  readonly dayId: string;
  readonly destinationId: string;
}

export interface TpStayForDestinationInference {
  readonly destinationId?: string;
  readonly checkInAt?: string;
  readonly checkOutAt?: string;
  readonly checkInTimezone?: string;
  readonly checkOutTimezone?: string;
  readonly placeText?: string;
}

export interface TpTransportForDestinationInference {
  readonly departAt?: string;
  readonly arriveAt?: string;
  readonly departTimezone?: string;
  readonly arriveTimezone?: string;
  readonly fromDestinationId?: string;
  readonly toDestinationId?: string;
  readonly fromPlace?: string;
  readonly toPlace?: string;
}

export interface TpActiveDestinationsForDayInput {
  readonly dayId: string;
  readonly calendarDate: string;
  readonly tripTimezone: string;
  readonly primaryDestinationId?: string;
  readonly destinations: readonly TpDestinationRef[];
  readonly dayDestinationLinks: readonly TpDayDestinationLink[];
  readonly stays: readonly TpStayForDestinationInference[];
  readonly transports: readonly TpTransportForDestinationInference[];
}

function nameMatch(place: string | undefined, destination: TpDestinationRef): boolean {
  if (place === undefined || place.trim() === '') {
    return false;
  }
  const a = place.trim().toLowerCase();
  const b = destination.name.trim().toLowerCase();
  return a.includes(b) || b.includes(a);
}

function inDateRange(calendarDate: string, dest: TpDestinationRef): boolean {
  if (dest.activeStartDate !== undefined && calendarDate < dest.activeStartDate) {
    return false;
  }
  if (dest.activeEndDate !== undefined && calendarDate > dest.activeEndDate) {
    return false;
  }
  return dest.activeStartDate !== undefined || dest.activeEndDate !== undefined;
}

export default function tpActiveDestinationsForDay(input: TpActiveDestinationsForDayInput): readonly string[] {
  if (input.primaryDestinationId !== undefined) {
    return [input.primaryDestinationId];
  }
  const ids = new Set<string>();
  const destById = new Map(input.destinations.map((d) => [d.id, d]));

  input.stays.forEach((stay) => {
    if (stay.checkInAt === undefined || stay.checkOutAt === undefined) {
      return;
    }
    const tz = stay.checkInTimezone ?? input.tripTimezone;
    const overlaps = tpSpanOverlapsTripDay(stay.checkInAt, stay.checkOutAt, input.calendarDate, tz);
    if (!overlaps) {
      return;
    }
    if (stay.destinationId !== undefined) {
      ids.add(stay.destinationId);
      return;
    }
    input.destinations.forEach((d) => {
      if (nameMatch(stay.placeText, d)) {
        ids.add(d.id);
      }
    });
  });

  input.transports.forEach((tr) => {
    if (tr.departAt === undefined || tr.arriveAt === undefined) {
      return;
    }
    if (!tpSpanOverlapsTripDay(tr.departAt, tr.arriveAt, input.calendarDate, input.tripTimezone)) {
      return;
    }
    const depDate = localDateInZone(tr.departAt, tr.departTimezone ?? input.tripTimezone);
    const arrDate = localDateInZone(tr.arriveAt, tr.arriveTimezone ?? input.tripTimezone);
    if (input.calendarDate === depDate && tr.fromDestinationId !== undefined) {
      ids.add(tr.fromDestinationId);
    }
    if (input.calendarDate === arrDate && tr.toDestinationId !== undefined) {
      ids.add(tr.toDestinationId);
    }
    if (input.calendarDate !== depDate && input.calendarDate !== arrDate) {
      if (tr.fromDestinationId !== undefined) {
        ids.add(tr.fromDestinationId);
      }
      if (tr.toDestinationId !== undefined) {
        ids.add(tr.toDestinationId);
      }
    }
    input.destinations.forEach((d) => {
      if (nameMatch(tr.fromPlace, d) || nameMatch(tr.toPlace, d)) {
        ids.add(d.id);
      }
    });
  });

  input.dayDestinationLinks
    .filter((l) => l.dayId === input.dayId)
    .forEach((l) => ids.add(l.destinationId));

  if (ids.size === 0) {
    input.destinations.forEach((d) => {
      if (inDateRange(input.calendarDate, d)) {
        ids.add(d.id);
      }
    });
  }

  return [...ids].filter((id) => destById.has(id));
}
