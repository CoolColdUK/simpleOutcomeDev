import type {IconProps} from './IconProps';

export function CursorIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4l7 17 2.5-7.5L20 11 4 4z" />
    </svg>
  );
}
