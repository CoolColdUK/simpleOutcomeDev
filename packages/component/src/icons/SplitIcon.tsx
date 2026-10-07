import type {IconProps} from './IconProps';

/** Bill / amount split (fork from a single line). */
export function SplitIcon({size = 20}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 4v6a4 4 0 0 0 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 4v6a4 4 0 0 1-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4v14" strokeLinecap="round" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
