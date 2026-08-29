import type {IconProps} from './IconProps';

const SHORT_BG = '#ef4444';

/** Downward arrow on red background (short direction). */
export function DirectionShortIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5" fill={SHORT_BG} />
      <path
        d="m7 9 5 5 5-5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
