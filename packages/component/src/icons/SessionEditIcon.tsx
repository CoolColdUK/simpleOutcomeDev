import type {IconProps} from './IconProps';

/** Edit the selected journal session (session stack + pencil). */
export function SessionEditIcon({size = 14}: IconProps) {
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
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L16 11l-4 1 1-4 5.5-5.5z" />
    </svg>
  );
}
