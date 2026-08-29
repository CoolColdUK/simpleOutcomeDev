import type {IconProps} from './IconProps';

/** Play triangle inside a circular outline. */
export function PlayCircleIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M10 9.5v5l5-2.5-5-2.5z" fill="currentColor" />
    </svg>
  );
}
