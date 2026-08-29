import type {IconProps} from './IconProps';

/** Capture the chart and save a screenshot to the trade journal. */
export function SaveScreenshotIcon({size = 14}: IconProps) {
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
      <path d="M4 7h2l1.5-2h5L14 7h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 16v3" />
      <path d="M9 19h6" />
    </svg>
  );
}
