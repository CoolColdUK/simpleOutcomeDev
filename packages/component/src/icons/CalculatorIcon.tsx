import type {IconProps} from './IconProps';

export function CalculatorIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6h8" strokeLinecap="round" />
      <path
        d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"
        strokeLinecap="round"
      />
    </svg>
  );
}
