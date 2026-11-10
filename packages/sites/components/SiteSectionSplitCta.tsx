import type {SiteSection} from '@so/model';
import SiteMediaBlock from '@/components/SiteMediaBlock';

export default function SiteSectionSplitCta({section}: {section: Extract<SiteSection, {type: 'splitCta'}>}) {
  return (
    <section id={section.id} className="section split-cta">
      {section.props.items.map((item) => (
        <article key={item.title} className="card split-card">
          <SiteMediaBlock media={item.media} />
          <h2>{item.title}</h2>
          <p>{item.body}</p>
          <a className="btn" href={item.href} target="_blank" rel="noopener noreferrer">
            {item.ctaLabel}
          </a>
        </article>
      ))}
    </section>
  );
}
