import type {IconProps} from './IconProps';

export function StrategyIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11h8M8 14h8M8 17h5" strokeLinecap="round" />
    </svg>
  );
}
