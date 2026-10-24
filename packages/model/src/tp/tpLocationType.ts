export const TP_LOCATION_TYPES = [
  'station',
  'accommodation',
  'restaurant',
  'shop',
  'attraction',
  'office',
  'other',
] as const;

export type TpLocationType = (typeof TP_LOCATION_TYPES)[number];

const LABELS: Record<TpLocationType, string> = {
  station: 'Station / transit',
  accommodation: 'Stay',
  restaurant: 'Food',
  shop: 'Shop',
  attraction: 'Attraction',
  office: 'Office / service',
  other: 'Other',
};

export function tpLocationTypeLabel(type: string | undefined): string {
  if (type === undefined || type === '') {
    return LABELS.other;
  }
  const key = type as TpLocationType;
  return LABELS[key] ?? type;
}

export function isTpLocationType(value: string): value is TpLocationType {
  return (TP_LOCATION_TYPES as readonly string[]).includes(value);
}
