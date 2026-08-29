import type {IconProps} from './IconProps';

/** Open a new trade position (arrow into bracket). */
export function OpenTradeIcon({size = 14}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12h10" />
      <path d="M11 7l5 5-5 5" />
      <path d="M18 5v14" />
    </svg>
  );
}
