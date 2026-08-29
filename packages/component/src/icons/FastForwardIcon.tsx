import type {IconProps} from './IconProps';

export function FastForwardIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m6 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
