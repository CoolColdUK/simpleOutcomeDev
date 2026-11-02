import type {IconProps} from './IconProps';

export function LockIcon({size = 20}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 01-2-2v-2a2 2 0 114 0v2a2 2 0 01-2 2zm3-9H9V6a3 3 0 016 0v2z" />
    </svg>
  );
}
