import type {IconProps} from './IconProps';

/** Create a new journal session (session stack + plus). */
export function SessionAddIcon({size = 14}: IconProps) {
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
      <path d="M4 6h9a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 13.5 18H4A1.5 1.5 0 0 1 2.5 16.5v-9A1.5 1.5 0 0 1 4 6z" />
      <path d="M6 4.5h8a1.5 1.5 0 0 1 1.5 1.5" />
      <path d="M7 10h5" />
      <path d="M7 12.5h4" />
      <path d="M19 5v5" />
      <path d="M16.5 7.5h5" />
    </svg>
  );
}
