import type {SiteDocument, SiteSection} from '@so/model';

export default function SiteSectionBookingCta({
  section,
  booking,
}: {
  section: Extract<SiteSection, {type: 'bookingCta'}>;
  booking: SiteDocument['booking'];
}) {
  return (
    <section id={section.id} className="section booking-band">
      <div>
        <h2>{section.props.title}</h2>
        {section.props.body ? <p>{section.props.body}</p> : null}
      </div>
      <a className="btn" href={booking.href} target="_blank" rel="noopener noreferrer">
        {booking.label}
      </a>
    </section>
  );
}
