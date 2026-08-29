import type {IconProps} from './IconProps';

/** Move or copy to another session / folder. */
export function MoveIcon({size = 20}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 11H6v-2h12v2zm0-4H6v-2h12v2zm-7-5l3 3H8l3-3z"
      />
    </svg>
  );
}
