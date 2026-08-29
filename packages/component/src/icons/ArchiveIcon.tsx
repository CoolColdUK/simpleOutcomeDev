import type {IconProps} from './IconProps';

export function ArchiveIcon({size = 20}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 6H4c-1.1 0-2 .9-2 2v2h2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10h2V8c0-1.1-.9-2-2-2zM9 14v-2h6v2H9zM4 8V6h16v2H4z" />
    </svg>
  );
}
