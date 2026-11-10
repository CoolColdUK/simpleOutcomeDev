import type {SiteDocument, SiteSection} from '@so/model';
import SiteCta from '@/components/SiteCta';
import SiteMediaBlock from '@/components/SiteMediaBlock';

export default function SiteSectionHero({
  section,
  booking,
}: {
  section: Extract<SiteSection, {type: 'hero'}>;
  booking: SiteDocument['booking'];
}) {
  const {props} = section;
  return (
    <section id={section.id} className={`section hero hero-${props.layout}`} data-tone={props.tone}>
      <div className="hero-copy">
        {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
        {props.layout === 'quote' ? <p className="stars">★★★★★</p> : null}
        <h1>{props.layout === 'quote' && props.quote ? props.quote : props.title}</h1>
        {props.layout === 'quote' && props.attribution ? <p className="attribution">{props.attribution}</p> : null}
        {props.layout !== 'quote' && props.body ? <p>{props.body}</p> : null}
        {props.primaryCta || props.secondaryCta ? (
          <div className="cta-row">
            {props.primaryCta ? <SiteCta label={props.primaryCta.label} target={props.primaryCta.target} booking={booking} /> : null}
            {props.secondaryCta ? (
              <SiteCta label={props.secondaryCta.label} target={props.secondaryCta.target} booking={booking} secondary />
            ) : null}
          </div>
        ) : null}
      </div>
      {props.media ? <SiteMediaBlock media={props.media} tall /> : null}
    </section>
  );
}
