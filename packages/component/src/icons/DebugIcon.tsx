import type {IconProps} from './IconProps';

export function DebugIcon({size = 18}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 2h8" />
      <path d="M9 2v2" />
      <path d="M15 2v2" />
      <path d="M12 20v-9" />
      <path d="M12 11a4 4 0 0 0 4-4V5H8v2a4 4 0 0 0 4 4Z" />
      <path d="M9.5 9a2.5 2.5 0 0 0 5 0" />
      <path d="M5.28 14.5A7 7 0 0 0 12 22a7 7 0 0 0 6.72-7.5H5.28Z" />
    </svg>
  );
}
