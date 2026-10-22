export const TP_TRANSPORT_MODES = [
  'flight',
  'train',
  'coach',
  'bus',
  'car',
  'ferry',
  'walk',
  'other',
] as const;

export type TpTransportMode = (typeof TP_TRANSPORT_MODES)[number];
