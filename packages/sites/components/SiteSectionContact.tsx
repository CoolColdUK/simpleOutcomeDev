import type {SiteSection} from '@so/model';

export default function SiteSectionContact({section}: {section: Extract<SiteSection, {type: 'contact'}>}) {
  return (
    <section id={section.id} className="section">
      <h2>{section.props.title}</h2>
      {section.props.intro ? <p>{section.props.intro}</p> : null}
      <div className="contact-list">
        {section.props.channels.map((channel) => (
          <a key={channel.href} href={channel.href} {...(channel.href.startsWith('http') ? {target: '_blank', rel: 'noopener noreferrer'} : {})}>
            {channel.label}
          </a>
        ))}
      </div>
    </section>
  );
}
