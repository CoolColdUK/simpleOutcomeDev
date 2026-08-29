import type {IconProps} from './IconProps';

export function HistoryIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
