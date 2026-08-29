import type {IconProps} from './IconProps';

/** Journal session — stacked cards / session stack. */
export function SessionIcon({size = 14}: IconProps) {
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
      <path d="M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M8 3h10a2 2 0 0 1 2 2" />
      <path d="M10 9h8" />
      <path d="M10 13h6" />
    </svg>
  );
}
