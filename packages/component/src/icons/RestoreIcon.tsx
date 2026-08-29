import type {IconProps} from './IconProps';

export function RestoreIcon({size = 20}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 3a9 9 0 00-9 9H1l4 4 4-4H6a7 7 0 117 7 7 7 0 01-4.95-2.05l-1.41 1.41A9 9 0 1013 3zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
    </svg>
  );
}
