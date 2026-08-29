import type {IconProps} from './IconProps';

export function MessageIcon({size = 14}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-6l-3 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
