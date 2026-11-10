import type {SiteDocument} from '@so/model';

export interface SiteCtaProps {
  readonly label: string;
  readonly target: string;
  readonly booking: SiteDocument['booking'];
  readonly secondary?: boolean;
}

export default function SiteCta({label, target, booking, secondary}: SiteCtaProps) {
  const className = secondary ? 'btn btn-secondary' : 'btn';
  if (target === 'booking') {
    return (
      <a className={className} href={booking.href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }
  return (
    <a className={className} href={`#${target}`}>
      {label}
    </a>
  );
}
