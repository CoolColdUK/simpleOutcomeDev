import type {IconProps} from './IconProps';

/**
 * Wordmark-style monogram for Ensure Trade (“ET”).
 * Stroke monogram for inline UI. Square badge assets use `packages/web/public/favicon.svg` geometry.
 */
export function EnsureTradeLogoIcon({size = 24}: IconProps) {
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
      <path d="M4 5v14M4 5h7M4 12h6M4 19h7" />
      <path d="M13 5h8M17 5v14" />
    </svg>
  );
}
