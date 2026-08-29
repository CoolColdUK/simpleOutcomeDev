import type {IconProps} from './IconProps';

export function ArrowLeftIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
