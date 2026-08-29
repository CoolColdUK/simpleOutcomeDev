import type {IconProps} from './IconProps';

export function TagsIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 3h10v15l-5-3.5L7 18V3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
