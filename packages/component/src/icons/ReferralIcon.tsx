import type {IconProps} from './IconProps';

/** Referral — one person with arrows to two people. */
export function ReferralIcon({size = 18}: IconProps) {
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
      <circle cx="5.5" cy="8" r="2" />
      <path d="M2 15c0-2.3 1.6-3.5 3.5-3.5s3.5 1.2 3.5 3.5" />
      <path d="M9.5 9.5L14.8 5.8" />
      <path d="M12.8 6.6l2-.8-.4 2" />
      <path d="M9.5 12.2L14.8 16.4" />
      <path d="M12.8 15.6l2 .8-.4-2" />
      <circle cx="19" cy="5" r="1.6" />
      <path d="M16.4 11c0-1.8 1.2-2.9 2.6-2.9S21.6 9.2 21.6 11" />
      <circle cx="19" cy="16.2" r="1.6" />
      <path d="M16.4 22.2c0-1.8 1.2-2.9 2.6-2.9s2.6 1.1 2.6 2.9" />
    </svg>
  );
}
