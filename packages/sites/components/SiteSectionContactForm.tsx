import type {SiteSection} from '@so/model';
import SiteContactForm from '@/components/SiteContactForm';

export default function SiteSectionContactForm({
  section,
  status,
}: {
  section: Extract<SiteSection, {type: 'contactForm'}>;
  status: 'demo' | 'draft' | 'live' | 'archived';
}) {
  const formStatus = status === 'demo' ? 'demo' : 'live';
  return (
    <section id={section.id} className="section">
      <h2>{section.props.title}</h2>
      {section.props.intro ? <p>{section.props.intro}</p> : null}
      <SiteContactForm status={formStatus} submitLabel={section.props.submitLabel} />
    </section>
  );
}
