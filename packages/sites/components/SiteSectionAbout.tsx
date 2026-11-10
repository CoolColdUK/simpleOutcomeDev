import type {SiteSection} from '@so/model';
import SiteMediaBlock from '@/components/SiteMediaBlock';

export default function SiteSectionAbout({section}: {section: Extract<SiteSection, {type: 'about'}>}) {
  return (
    <section id={section.id} className="section about">
      {section.props.media ? <SiteMediaBlock media={section.props.media} tall /> : null}
      <div>
        <p className="eyebrow">{section.props.eyebrow}</p>
        <h2>{section.props.title}</h2>
        <p>{section.props.body}</p>
      </div>
    </section>
  );
}
