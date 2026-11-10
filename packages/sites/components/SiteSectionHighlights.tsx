import type {SiteSection} from '@so/model';

export default function SiteSectionHighlights({section}: {section: Extract<SiteSection, {type: 'highlights'}>}) {
  return (
    <section id={section.id} className="section">
      <div className="card-grid">
        {section.props.items.map((item) => (
          <article key={item.title} className="card">
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
