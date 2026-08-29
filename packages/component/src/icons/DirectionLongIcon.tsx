import type {IconProps} from './IconProps';

const LONG_BG = '#22c55e';

/** Upward arrow on green background (long direction). */
export function DirectionLongIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5" fill={LONG_BG} />
      <path
        d="m7 15 5-5 5 5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
