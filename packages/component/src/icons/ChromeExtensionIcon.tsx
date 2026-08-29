import type {IconProps} from './IconProps';

/** Browser extension (puzzle piece). */
export function ChromeExtensionIcon({size = 18}: IconProps) {
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
      <path d="M15.39 4.39a4.49 4.49 0 0 0-6.78 0 .65.65 0 0 1-.58.2 2.49 2.49 0 0 0-2.52 3.65 2.49 2.49 0 0 0 1.86 1.12.65.65 0 0 1 .47.73 4.49 4.49 0 0 0 2.63 6.14 4.49 4.49 0 0 0 6.14-2.63.65.65 0 0 1 .73-.47 2.49 2.49 0 0 0 3.12-3.12.65.65 0 0 1-.2-.58 4.49 4.49 0 0 0-5.87-5.31z" />
    </svg>
  );
}
