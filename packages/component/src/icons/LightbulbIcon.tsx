import type {IconProps} from './IconProps';

export function LightbulbIcon({size = 14}: IconProps) {
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
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1.5 1.7 1.8 2.8.1.4.4.7.8.7h2.8c.4 0 .7-.3.8-.7.3-1.1 1-2 1.8-2.8A6 6 0 0 0 12 3z" />
    </svg>
  );
}
