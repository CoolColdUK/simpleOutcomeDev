import type {IconProps} from './IconProps';

/** Manual journal entry (open book). */
export function JournalIcon({size = 14}: IconProps) {
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
      <path d="M12 7v14" />
      <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5z" />
      <path d="M5 19h14" />
    </svg>
  );
}
