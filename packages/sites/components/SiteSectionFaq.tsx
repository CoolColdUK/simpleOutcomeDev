import type {SiteSection} from '@so/model';

export default function SiteSectionFaq({section}: {section: Extract<SiteSection, {type: 'faq'}>}) {
  return (
    <section id={section.id} className="section">
      <h2>{section.props.title}</h2>
      <div className="faq-list">
        {section.props.items.map((item) => (
          <article key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
