import type {IconProps} from './IconProps';

export function SortDescIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 7h8M8 11h6M8 15h4" strokeLinecap="round" />
      <path d="m6 22 3 3 3-3M9 7v14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
