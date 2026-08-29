import type {IconProps} from './IconProps';

/** Padlock with slash — used for “undock / detach” into a floating panel. */
export function PanelUndockIcon({size = 15}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
      <rect x="6" y="10" width="12" height="10" rx="2" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
