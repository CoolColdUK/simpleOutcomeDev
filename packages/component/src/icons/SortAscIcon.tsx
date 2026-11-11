import type {IconProps} from './IconProps';

export function SortAscIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 9h8M8 13h6M8 17h4" strokeLinecap="round" />
      <path d="m6 6 3-3 3 3M9 3v14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
