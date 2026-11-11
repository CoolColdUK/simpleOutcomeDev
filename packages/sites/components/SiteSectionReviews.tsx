import type {SiteSection} from '@so/model';

export default function SiteSectionReviews({section}: {section: Extract<SiteSection, {type: 'reviews'}>}) {
  return (
    <section id={section.id} className="section">
      {section.props.title ? <h2>{section.props.title}</h2> : null}
      <div className="card-grid">
        {section.props.items.map((item) => (
          <article key={item.quote} className="card">
            <p className="stars" aria-label={`${item.stars} out of 5`}>
              {'★'.repeat(item.stars)}
            </p>
            <p>“{item.quote}”</p>
            <p className="attribution">{item.attribution}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
