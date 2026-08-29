import type {IconProps} from './IconProps';

/** Add the selected strategy tag to a trade (strategy document + plus). */
export function StrategyAddIcon({size = 14}: IconProps) {
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
      <path d="M5 3h7l3 3v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16V4.5A1.5 1.5 0 0 1 5 3z" />
      <path d="M12 3v3h3" />
      <path d="M6 9h6" />
      <path d="M6 11.5h4" />
      <path d="M19 4v5" />
      <path d="M16.5 6.5h5" />
    </svg>
  );
}
