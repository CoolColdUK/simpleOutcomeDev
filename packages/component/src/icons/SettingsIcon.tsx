import type {IconProps} from './IconProps';

/** Account and app settings. */
export function SettingsIcon({size = 18}: IconProps) {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2.5M12 20.5V23M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M1 12h2.5M20.5 12H23M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" />
    </svg>
  );
}
