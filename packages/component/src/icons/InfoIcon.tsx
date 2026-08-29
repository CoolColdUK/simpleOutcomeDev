import type {IconProps} from './IconProps';

export function InfoIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" strokeLinecap="round" />
      <path d="M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}
