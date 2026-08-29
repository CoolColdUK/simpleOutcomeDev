import type {IconProps} from './IconProps';

/** Close a trade position (arrow out of bracket). */
export function CloseTradeIcon({size = 14}: IconProps) {
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
      <path d="M6 5v14" />
      <path d="M13 7l5 5-5 5" />
      <path d="M10 12h10" />
    </svg>
  );
}
