import type {SiteSection} from '@so/model';
import SiteMediaBlock from '@/components/SiteMediaBlock';

export default function SiteSectionTeam({section}: {section: Extract<SiteSection, {type: 'team'}>}) {
  return (
    <section id={section.id} className="section">
      <h2>{section.props.title}</h2>
      <div className="team-grid">
        {section.props.members.map((member) => (
          <article key={member.role}>
            <SiteMediaBlock media={member.media} />
            <p>
              <strong>{member.name}</strong>
              <br />
              <small>{member.role}</small>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
