import type {IconProps} from './IconProps';

export function LightbulbAddIcon({size = 14}: IconProps) {
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
      <path d="M8 18h5" />
      <path d="M9 21h3" />
      <path d="M10.5 3a5.5 5.5 0 0 0-3.7 9.6c.7.7 1.4 1.5 1.7 2.6.1.4.4.7.8.7h2.4c.4 0 .7-.3.8-.7.3-1 1-1.9 1.7-2.6A5.5 5.5 0 0 0 10.5 3z" />
      <path d="M19 3v6" />
      <path d="M16 6h6" />
    </svg>
  );
}
